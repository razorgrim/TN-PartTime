import React, { useContext, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { Users, UserCheck, Clock, LogOut, Briefcase, Wallet } from 'lucide-react';

// Sub-components
import AdminLogin from './admin/AdminLogin';
import ShiftMonitoring from './admin/ShiftMonitoring';
import ClaimsManager from './admin/ClaimsManager';
import StaffDirectory from './admin/StaffDirectory';
import ProjectTasks from './admin/ProjectTasks';
import EditStaffModal from './admin/EditStaffModal';
import CreateProjectModal from './admin/CreateProjectModal';
import EditProjectModal from './admin/EditProjectModal';

export default function AdminDashboard({ showToast, onBackToLanding }) {
  const { 
    users, 
    adminSession, 
    loginAdmin, 
    logoutAdmin, 
    toggleUserStatus, 
    jobs,
    shifts,
    claims,
    addStaff,
    deleteStaff,
    addJob,
    deleteJob,
    adjustClaim,
    updateStaff,
    updateJob,
    clearShifts
  } = useContext(AppContext);
  
  // Login Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Admin Tabs: 'shifts' | 'claims' | 'staff' | 'projects'
  const [adminTab, setAdminTab] = useState('shifts');

  // Modal display states
  const [editingUserId, setEditingUserId] = useState(null);
  const [editingJobId, setEditingJobId] = useState(null);
  const [showAddTaskForm, setShowAddTaskForm] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    const res = await loginAdmin(email, password);
    if (res.success) {
      showToast('Admin logged in successfully', 'success');
      setEmail('');
      setPassword('');
    } else {
      showToast(res.message, 'error');
    }
  };

  // Find users/jobs for edit modals
  const editingUser = users.find(u => u.id === editingUserId);
  const editingJob = jobs.find(j => j.id === editingJobId);

  // Stats Calculations
  const partTimers = users.filter(u => u.role === 'part-timer');
  const totalPT = partTimers.length;
  const pendingPT = partTimers.filter(u => u.status === 'pending').length;
  const activeShiftsCount = shifts.filter(s => s.status === 'active').length;
  const pendingClaimsCount = claims.filter(c => c.status === 'pending').length;

  if (!adminSession) {
    return (
      <AdminLogin 
        email={email}
        setEmail={setEmail}
        password={password}
        setPassword={setPassword}
        handleLogin={handleLogin}
        onBackToLanding={onBackToLanding}
      />
    );
  }

  return (
    <div className="admin-pane animate-fade">
      {/* Admin Header */}
      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem' }}>
        <div>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Control Panel</span>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Welcome, {adminSession.name}</h1>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={() => { logoutAdmin(); showToast('Logged out of Admin Panel', 'info'); }}>
          <LogOut size={14} /> Logout
        </button>
      </div>

      {/* Admin stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem' }}>
          <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: 'var(--radius-md)', backgroundColor: '#eff6ff', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users size={20} />
          </div>
          <div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Total Registered Staff</p>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{totalPT}</h3>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem' }}>
          <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--status-pending-bg)', color: 'var(--status-pending-text)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Clock size={20} />
          </div>
          <div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Pending Approvals</p>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{pendingPT}</h3>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem' }}>
          <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--status-enabled-bg)', color: 'var(--status-enabled-text)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <UserCheck size={20} />
          </div>
          <div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Active Clocked In</p>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{activeShiftsCount}</h3>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem' }}>
          <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: 'var(--radius-md)', backgroundColor: '#fef2f2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Wallet size={20} />
          </div>
          <div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Pending Claims</p>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{pendingClaimsCount}</h3>
          </div>
        </div>
      </div>

      {/* Tab Navigation Menu */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.25rem' }}>
        <button 
          className={`view-btn ${adminTab === 'shifts' ? 'active' : ''}`}
          onClick={() => setAdminTab('shifts')}
          style={{ padding: '0.6rem 1.25rem', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <Clock size={16} />
          <span>Shift Monitoring</span>
        </button>
        <button 
          className={`view-btn ${adminTab === 'claims' ? 'active' : ''}`}
          onClick={() => setAdminTab('claims')}
          style={{ padding: '0.6rem 1.25rem', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <Wallet size={16} />
          <span>Claims Manager</span>
        </button>
        <button 
          className={`view-btn ${adminTab === 'staff' ? 'active' : ''}`}
          onClick={() => setAdminTab('staff')}
          style={{ padding: '0.6rem 1.25rem', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <Users size={16} />
          <span>Staff Directory</span>
        </button>
        <button 
          className={`view-btn ${adminTab === 'projects' ? 'active' : ''}`}
          onClick={() => setAdminTab('projects')}
          style={{ padding: '0.6rem 1.25rem', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <Briefcase size={16} />
          <span>Project Tasks</span>
        </button>
      </div>

      {/* TAB CONTENTS */}
      {adminTab === 'shifts' && (
        <ShiftMonitoring shifts={shifts} clearShifts={clearShifts} showToast={showToast} />
      )}

      {adminTab === 'claims' && (
        <ClaimsManager 
          users={users} 
          shifts={shifts} 
          claims={claims}
          adjustClaim={adjustClaim} 
          showToast={showToast} 
        />
      )}

      {adminTab === 'staff' && (
        <StaffDirectory 
          users={users} 
          toggleUserStatus={toggleUserStatus} 
          deleteStaff={deleteStaff} 
          addStaff={addStaff} 
          startEdit={(pt) => setEditingUserId(pt.id)} 
          showToast={showToast} 
        />
      )}

      {adminTab === 'projects' && (
        <ProjectTasks 
          jobs={jobs} 
          deleteJob={deleteJob} 
          startEditJob={(job) => setEditingJobId(job.id)} 
          setShowAddTaskForm={setShowAddTaskForm} 
          showToast={showToast} 
        />
      )}

      {/* MODALS */}
      {editingUserId && editingUser && (
        <EditStaffModal 
          user={editingUser} 
          onClose={() => setEditingUserId(null)} 
          onSave={updateStaff} 
          showToast={showToast} 
        />
      )}

      {editingJobId && editingJob && (
        <EditProjectModal 
          job={editingJob} 
          onClose={() => setEditingJobId(null)} 
          onSave={updateJob} 
          showToast={showToast} 
        />
      )}

      {showAddTaskForm && (
        <CreateProjectModal 
          onClose={() => setShowAddTaskForm(false)} 
          addJob={addJob} 
          showToast={showToast} 
        />
      )}
    </div>
  );
}
