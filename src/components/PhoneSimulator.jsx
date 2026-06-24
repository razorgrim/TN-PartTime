import React, { useContext, useState, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import { 
  Smartphone, LogIn, UserPlus, ShieldAlert, Wifi, Battery, 
  ChevronLeft, CheckCircle2, Home, Clock, Wallet, User, MessageSquare, Plus, LogOut
} from 'lucide-react';

// Sub-components
import logoImg from '../assets/logo.png';
import PhoneLogin from './phone/PhoneLogin';
import PhoneRegister from './phone/PhoneRegister';
import PhoneHomeTab from './phone/PhoneHomeTab';
import PhoneAttendanceTab from './phone/PhoneAttendanceTab';
import PhoneClaimsTab from './phone/PhoneClaimsTab';
import PhoneProfileTab from './phone/PhoneProfileTab';
import PhoneSupportTab from './phone/PhoneSupportTab';

export default function PhoneSimulator({ showToast, onBackToLanding }) {
  const { 
    partTimerSession, 
    registerPartTimer, 
    loginPartTimer, 
    logoutPartTimer, 
    jobs, 
    shifts,
    clockInJob,
    clockOutJob,
    updateStaffProfile
  } = useContext(AppContext);

  // Navigation State: 'welcome' | 'login' | 'register' | 'pending_notice' | 'dashboard'
  const [screen, setScreen] = useState('welcome');
  const [simulatedTime, setSimulatedTime] = useState('12:00 PM');
  
  // Dashboard Tab State: 'home' | 'attendance' | 'claims' | 'profile' | 'support'
  const [activeTab, setActiveTab] = useState('home');

  // Register success feedback message
  const [regSuccessMsg, setRegSuccessMsg] = useState('');

  // Device GPS State
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState(null);
  const [userCoords, setUserCoords] = useState(null);

  const getBrowserLocation = () => {
    const isInsecure = typeof window !== 'undefined' && window.isSecureContext === false;
    if (!navigator.geolocation || isInsecure) {
      console.warn('Browser Geolocation is unavailable (requires HTTPS). Fallback to simulated coordinates active.');
      setGpsError(null);
      return;
    }
    setGpsLoading(true);
    setGpsError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserCoords({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
        setGpsLoading(false);
      },
      (err) => {
        console.warn('Native geolocation failed, using simulated coordinates fallback:', err);
        setGpsError(null);
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  };

  useEffect(() => {
    if (activeTab === 'attendance') {
      getBrowserLocation();
    }
  }, [activeTab]);

  // Update time for the phone status bar
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setSimulatedTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  // Sync screen state with context session
  useEffect(() => {
    if (partTimerSession) {
      setScreen('dashboard');
      setActiveTab('home');
    } else if (screen === 'dashboard') {
      setScreen('welcome');
    }
  }, [partTimerSession]);

  const handleLogout = () => {
    logoutPartTimer();
    showToast('Logged out from Phone', 'info');
    setScreen('welcome');
  };

  return (
    <div className="staff-portal-container" style={{
      width: '100%',
      maxWidth: '480px',
      margin: '0 auto',
      minHeight: '100vh',
      backgroundColor: '#ffffff',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: 'var(--shadow-xl)',
      position: 'relative',
      borderLeft: '1px solid var(--border-color)',
      borderRight: '1px solid var(--border-color)'
    }}>
      {/* Phone Status Bar */}
      <div style={{
        height: '24px',
        backgroundColor: '#f8fafc',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0 1rem',
        fontSize: '0.75rem',
        color: 'var(--text-secondary)',
        fontWeight: 600
      }}>
        <span>{simulatedTime}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Wifi size={12} />
          <Battery size={14} />
        </div>
      </div>

      {/* Screen Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', paddingBottom: '80px', overflowY: 'auto' }}>
          
          {/* WELCOME SCREEN */}
          {screen === 'welcome' && (
            <div style={{ padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center' }}>
              <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                <img src={logoImg} alt="Total Neutron Logo" style={{ display: 'block', margin: '0 auto 1.5rem', width: '4.5rem', height: '4.5rem', objectFit: 'contain' }} />
                <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>
                  PartTimer Portal
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', padding: '0 1rem' }}>
                  Find jobs, pin your location, and check-in to get paid instantly.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <button className="btn btn-primary btn-block" style={{ padding: '0.9rem' }} onClick={() => setScreen('login')}>
                  <LogIn size={18} /> Sign In
                </button>
                <button className="btn btn-secondary btn-block" style={{ padding: '0.9rem' }} onClick={() => setScreen('register')}>
                  <UserPlus size={18} /> Register Account
                </button>
                {onBackToLanding && (
                  <button className="btn btn-secondary btn-block" style={{ padding: '0.9rem', backgroundColor: 'transparent', borderColor: 'var(--border-color)' }} onClick={onBackToLanding}>
                    Exit Staff Portal
                  </button>
                )}
              </div>

              <p style={{ textAlign: 'center', marginTop: '2.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Powered by TN Part-Timer Portal v1.0
              </p>
            </div>
          )}

          {/* REGISTER SCREEN */}
          {screen === 'register' && (
            <PhoneRegister 
              registerPartTimer={registerPartTimer} 
              setScreen={setScreen} 
              setRegSuccessMsg={setRegSuccessMsg} 
              showToast={showToast} 
            />
          )}

          {/* REGISTRATION SUCCESS / PENDING NOTICE */}
          {screen === 'pending_notice' && (
            <div style={{ padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center', textAlign: 'center' }}>
              <div style={{ color: '#10b981', margin: '0 auto 1.5rem' }}>
                <CheckCircle2 size={56} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.75rem' }}>Awaiting Approval</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: '1.5', marginBottom: '2rem' }}>
                {regSuccessMsg}
              </p>
              
              <div style={{ padding: '1rem', backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '12px', textAlign: 'left', marginBottom: '2rem' }}>
                <h4 style={{ fontSize: '0.8rem', fontWeight: 700, color: '#b45309', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <ShieldAlert size={14} /> Test instructions:
                </h4>
                <p style={{ fontSize: '0.75rem', color: '#b45309', lineHeight: '1.4' }}>
                  Open the <strong>Admin Dashboard</strong> on the left, find your registered name in the list, and click <strong>Enable Account</strong>. Then return here and log in!
                </p>
              </div>

              <button className="btn btn-primary btn-block" onClick={() => setScreen('login')}>
                Go to Sign In
              </button>
            </div>
          )}

          {/* LOGIN SCREEN */}
          {screen === 'login' && (
            <PhoneLogin 
              loginPartTimer={loginPartTimer} 
              setScreen={setScreen} 
              showToast={showToast} 
            />
          )}

          {/* DASHBOARD SYSTEM */}
          {screen === 'dashboard' && partTimerSession && (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
              
              {/* ACTIVE TAB ROUTER */}
              <div className="phone-screen animate-fade">

                {/* 1. HOME TAB */}
                {activeTab === 'home' && (
                  <PhoneHomeTab 
                    partTimerSession={partTimerSession} 
                    setActiveTab={setActiveTab} 
                  />
                )}

                {/* 2. ATTENDANCE TAB */}
                {activeTab === 'attendance' && (
                  <PhoneAttendanceTab 
                    partTimerSession={partTimerSession}
                    jobs={jobs}
                    shifts={shifts}
                    clockInJob={clockInJob}
                    clockOutJob={clockOutJob}
                    setActiveTab={setActiveTab}
                    simulatedTime={simulatedTime}
                    gpsLoading={gpsLoading}
                    gpsError={gpsError}
                    userCoords={userCoords}
                    setUserCoords={setUserCoords}
                    setGpsError={setGpsError}
                    getBrowserLocation={getBrowserLocation}
                    showToast={showToast}
                  />
                )}

                {/* 3. CLAIMS TAB */}
                {activeTab === 'claims' && (
                  <PhoneClaimsTab 
                    partTimerSession={partTimerSession} 
                    shifts={shifts} 
                  />
                )}

                {/* 4. PROFILE TAB */}
                {activeTab === 'profile' && (
                  <PhoneProfileTab 
                    partTimerSession={partTimerSession} 
                    updateStaffProfile={updateStaffProfile}
                    handleLogout={handleLogout}
                    showToast={showToast} 
                  />
                )}

                {/* 5. SUPPORT TAB */}
                {activeTab === 'support' && (
                  <PhoneSupportTab />
                )}

              </div>

              {/* Bottom Sticky Navigation Bar */}
              <div className="phone-nav-bar">
                <button 
                  className={`phone-nav-item ${activeTab === 'home' ? 'active' : ''}`}
                  onClick={() => setActiveTab('home')}
                >
                  <Home size={20} />
                  <span>Home</span>
                </button>

                <button 
                  className={`phone-nav-item ${activeTab === 'attendance' ? 'active' : ''}`}
                  onClick={() => setActiveTab('attendance')}
                >
                  <Clock size={20} />
                  <span>Clock In</span>
                </button>

                {/* Floating center Plus Button (Purely Visual) */}
                <div className="phone-nav-fab-container">
                  <button type="button" className="phone-nav-fab" aria-label="Visual Only Option">
                    <Plus size={24} />
                  </button>
                </div>

                <button 
                  className={`phone-nav-item ${activeTab === 'claims' ? 'active' : ''}`}
                  onClick={() => setActiveTab('claims')}
                >
                  <Wallet size={20} />
                  <span>Claims</span>
                </button>

                <button 
                  className={`phone-nav-item ${activeTab === 'profile' ? 'active' : ''}`}
                  onClick={() => setActiveTab('profile')}
                >
                  <User size={20} />
                  <span>Profile</span>
                </button>
              </div>

            </div>
          )}

      </div>
    </div>
  );
}
