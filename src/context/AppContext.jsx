import React, { createContext, useState, useEffect, useRef } from 'react';

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [users, setUsers] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [shifts, setShifts] = useState([]);
  const isFetchingRef = useRef(false);

  const [adminSession, setAdminSession] = useState(() => {
    const saved = localStorage.getItem('pt_admin_session');
    return saved ? JSON.parse(saved) : null;
  });

  const [partTimerSession, setPartTimerSession] = useState(() => {
    const saved = localStorage.getItem('pt_parttimer_session');
    return saved ? JSON.parse(saved) : null;
  });

  const [simulatedDate, setSimulatedDate] = useState(() => {
    return localStorage.getItem('pt_simulated_date') || '';
  });

  useEffect(() => {
    if (simulatedDate) {
      localStorage.setItem('pt_simulated_date', simulatedDate);
    } else {
      localStorage.removeItem('pt_simulated_date');
    }
  }, [simulatedDate]);

  // Helper to extract last 4 digits of IC (digits only)
  const getICLast4 = (ic) => {
    if (!ic) return '';
    const clean = ic.replace(/[^0-9a-zA-Z]/g, '');
    return clean.slice(-4);
  };

  // Fetch initial database data
  const fetchInitialData = async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    try {
      const [usersRes, jobsRes, shiftsRes] = await Promise.all([
        fetch('/api/users'),
        fetch('/api/jobs'),
        fetch('/api/shifts')
      ]);

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData);
      }
      if (jobsRes.ok) {
        const jobsData = await jobsRes.json();
        setJobs(jobsData);
      }
      if (shiftsRes.ok) {
        const shiftsData = await shiftsRes.json();
        setShifts(shiftsData);
      }
    } catch (e) {
      console.error("Error fetching initial database data:", e);
    } finally {
      isFetchingRef.current = false;
    }
  };

  useEffect(() => {
    fetchInitialData();
    const interval = setInterval(fetchInitialData, 3000);
    return () => clearInterval(interval);
  }, []);

  // Update session storage
  useEffect(() => {
    if (adminSession) {
      localStorage.setItem('pt_admin_session', JSON.stringify(adminSession));
    } else {
      localStorage.removeItem('pt_admin_session');
    }
  }, [adminSession]);

  useEffect(() => {
    if (partTimerSession) {
      localStorage.setItem('pt_parttimer_session', JSON.stringify(partTimerSession));
    } else {
      localStorage.removeItem('pt_parttimer_session');
    }
  }, [partTimerSession]);

  // Register Part-Timer
  const registerPartTimer = async (name, icNumber, email, phone, password) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, icNumber, email, phone, password })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        // Re-fetch users to sync local state
        const usersRes = await fetch('/api/users');
        if (usersRes.ok) {
          const usersData = await usersRes.json();
          setUsers(usersData);
        }
      }
      return data;
    } catch (error) {
      console.error(error);
      return { success: false, message: 'Failed to connect to backend.' };
    }
  };

  // Add Staff member directly from Admin Control Panel
  const addStaff = async (name, icNumber, email, phone, password) => {
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, icNumber, email, phone, password })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setUsers(prev => [data.user, ...prev]);
      }
      return data;
    } catch (error) {
      console.error(error);
      return { success: false, message: 'Failed to connect to backend.' };
    }
  };

  // Delete Staff member
  const deleteStaff = async (userId) => {
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setUsers(prev => prev.filter(u => u.id !== userId));
        if (partTimerSession && partTimerSession.id === userId) {
          setPartTimerSession(null);
        }
        return { success: true, message: 'Staff member deleted.' };
      }
      return { success: false, message: 'Failed to delete staff member.' };
    } catch (error) {
      console.error(error);
      return { success: false, message: 'Failed to connect to backend.' };
    }
  };

  // Add Job/Task directly from Admin Control Panel
  const addJob = async (title, description, locationName, payRate, date, time, latitude, longitude) => {
    try {
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, locationName, payRate, date, time, latitude, longitude })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setJobs(prev => [...prev, data.job]);
      }
      return data;
    } catch (error) {
      console.error(error);
      return { success: false, message: 'Failed to connect to backend.' };
    }
  };

  // Delete Job/Task
  const deleteJob = async (jobId) => {
    try {
      const res = await fetch(`/api/jobs/${jobId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setJobs(prev => prev.filter(j => j.id !== jobId));
        return { success: true, message: 'Project task deleted.' };
      }
      return { success: false, message: 'Failed to delete project task.' };
    } catch (error) {
      console.error(error);
      return { success: false, message: 'Failed to connect to backend.' };
    }
  };

  // Update Job/Task details from Admin Control Panel
  const updateJob = async (jobId, title, description, locationName, payRate, date, time, latitude, longitude) => {
    try {
      const res = await fetch(`/api/jobs/${jobId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, locationName, payRate, date, time, latitude, longitude })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setJobs(prev => prev.map(j => j.id === jobId ? data.job : j));
      }
      return data;
    } catch (error) {
      console.error(error);
      return { success: false, message: 'Failed to connect to backend.' };
    }
  };

  // Enable/Disable user
  const toggleUserStatus = async (userId, newStatus) => {
    try {
      const res = await fetch(`/api/users/${userId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setUsers(prev => prev.map(u => u.id === userId ? data.user : u));
        if (partTimerSession && partTimerSession.id === userId) {
          if (newStatus !== 'enabled') {
            setPartTimerSession(null);
          } else {
            setPartTimerSession(data.user);
          }
        }
      }
    } catch (error) {
      console.error(error);
    }
  };

  // Login Admin
  const loginAdmin = async (email, password) => {
    try {
      const res = await fetch('/api/auth/login-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAdminSession(data.user);
      }
      return data;
    } catch (error) {
      console.error(error);
      return { success: false, message: 'Failed to connect to backend.' };
    }
  };

  // Logout Admin
  const logoutAdmin = () => {
    setAdminSession(null);
  };

  // Login Part-Timer (using last 4 digits of IC as username + registration password)
  const loginPartTimer = async (icLast4, password) => {
    try {
      const res = await fetch('/api/auth/login-parttimer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ icLast4, password })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPartTimerSession(data.user);
      }
      return data;
    } catch (error) {
      console.error(error);
      return { success: false, message: 'Failed to connect to backend.' };
    }
  };

  // Logout Part-Timer
  const logoutPartTimer = () => {
    setPartTimerSession(null);
  };

  const getCustomTime = () => {
    if (!simulatedDate) return null;
    const now = new Date();
    const offsetMin = now.getTimezoneOffset();
    const offsetSign = offsetMin <= 0 ? '+' : '-';
    const absOffsetMin = Math.abs(offsetMin);
    const offsetHours = String(Math.floor(absOffsetMin / 60)).padStart(2, '0');
    const offsetMins = String(absOffsetMin % 60).padStart(2, '0');
    const tzOffset = `${offsetSign}${offsetHours}:${offsetMins}`;

    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const ms = String(now.getMilliseconds()).padStart(3, '0');
    
    return `${simulatedDate}T${hours}:${minutes}:${seconds}.${ms}${tzOffset}`;
  };

  // Clock In to a Job (creates a shift record)
  const clockInJob = async (jobId, distance, workerId, workerName) => {
    try {
      const customTime = getCustomTime();
      const res = await fetch('/api/shifts/clockin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId, distance, workerId, workerName, customTime })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setShifts(prev => [data.shift, ...prev]);
      }
    } catch (error) {
      console.error(error);
    }
  };

  // Clock Out of a Job (completes active shift record, sets initial payout and claim status)
  const clockOutJob = async (jobId, workerId, distance, simulatedDurationMinutes = null) => {
    try {
      const customTime = getCustomTime();
      const res = await fetch('/api/shifts/clockout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId, workerId, distance, simulatedDurationMinutes, customTime })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setShifts(prev => prev.map(s => s.id === data.shift.id ? data.shift : s));
      }
    } catch (error) {
      console.error(error);
    }
  };

  // Adjust completed shift payout details
  const adjustShiftPayout = async (shiftId, newRate, newPayout, approve = false) => {
    try {
      const res = await fetch(`/api/shifts/${shiftId}/payout`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payRate: newRate, payout: newPayout, approve })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setShifts(prev => prev.map(s => s.id === shiftId ? data.shift : s));
      }
    } catch (error) {
      console.error(error);
    }
  };

  // Clear all shifts (Admin)
  const clearShifts = async () => {
    try {
      const res = await fetch('/api/shifts', {
        method: 'DELETE'
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setShifts([]);
        return data;
      }
      return { success: false, message: 'Failed to clear shift records.' };
    } catch (error) {
      console.error(error);
      return { success: false, message: 'Failed to connect to backend.' };
    }
  };

  // Update staff details from admin panel
  // Update staff details from admin panel
  const updateStaffProfile = async (userId, currentPassword, newPassword, bankName, bankAccount, bankHolder) => {
    try {
      const res = await fetch(`/api/users/${userId}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword, bankName, bankAccount, bankHolder })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setUsers(prev => prev.map(u => u.id === userId ? data.user : u));
        if (partTimerSession && partTimerSession.id === userId) {
          setPartTimerSession(data.user);
        }
      }
      return data;
    } catch (error) {
      console.error(error);
      return { success: false, message: 'Failed to connect to backend.' };
    }
  };

  const updateStaff = async (userId, name, icNumber, email, phone, password) => {
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, icNumber, email, phone, password })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setUsers(prev => prev.map(u => u.id === userId ? data.user : u));
        if (partTimerSession && partTimerSession.id === userId) {
          setPartTimerSession(data.user);
        }
      }
      return data;
    } catch (error) {
      console.error(error);
      return { success: false, message: 'Failed to connect to backend.' };
    }
  };

  // Reset database back to default settings
  const resetDatabase = async () => {
    try {
      const res = await fetch('/api/reset', {
        method: 'POST'
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAdminSession(null);
        setPartTimerSession(null);
        await fetchInitialData();
        return { success: true, message: 'Database reset successfully.' };
      }
      return { success: false, message: data.message || 'Failed to reset database.' };
    } catch (error) {
      console.error(error);
      return { success: false, message: 'Failed to connect to backend.' };
    }
  };

  return (
    <AppContext.Provider value={{
      users,
      adminSession,
      partTimerSession,
      registerPartTimer,
      toggleUserStatus,
      loginAdmin,
      logoutAdmin,
      loginPartTimer,
      logoutPartTimer,
      getICLast4,
      jobs,
      shifts,
      clockInJob,
      clockOutJob,
      adjustShiftPayout,
      resetDatabase,
      addStaff,
      deleteStaff,
      addJob,
      deleteJob,
      updateJob,
      updateStaff,
      clearShifts,
      updateStaffProfile,
      simulatedDate,
      setSimulatedDate
    }}>
      {children}
    </AppContext.Provider>
  );
};
