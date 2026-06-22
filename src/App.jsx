import React, { useState, useContext, useEffect } from 'react';
import { AppProvider, AppContext } from './context/AppContext';
import AdminDashboard from './components/AdminDashboard';
import PhoneSimulator from './components/PhoneSimulator';
import { LayoutGrid, Smartphone, Laptop, CheckCircle, XCircle, AlertCircle, Briefcase, RotateCcw } from 'lucide-react';
import logoImg from './assets/logo.png';


function AppContent() {
  const { adminSession, partTimerSession, loginAdmin, loginPartTimer, registerPartTimer } = useContext(AppContext);
  const [viewMode, setViewMode] = useState('login'); // 'login' | 'register' | 'pending' | 'admin' | 'phone'
  const [toasts, setToasts] = useState([]);

  // Login form fields
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form fields
  const [regName, setRegName] = useState('');
  const [regIc, setRegIc] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regSuccessMsg, setRegSuccessMsg] = useState('');

  const showToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  useEffect(() => {
    if (adminSession) {
      setViewMode('admin');
    } else if (partTimerSession) {
      setViewMode('phone');
    } else if (viewMode === 'admin' || viewMode === 'phone') {
      setViewMode('login');
    }
  }, [adminSession, partTimerSession]);

  const handleUnifiedLogin = async (e) => {
    e.preventDefault();
    if (!loginUsername.trim() || !loginPassword) {
      showToast('Please fill in all fields.', 'error');
      return;
    }

    // Detect role based on username (email format vs short IC digits code)
    const isEmail = loginUsername.includes('@');

    if (isEmail) {
      const res = await loginAdmin(loginUsername, loginPassword);
      if (res.success) {
        showToast('Admin logged in successfully', 'success');
        setLoginUsername('');
        setLoginPassword('');
      } else {
        showToast(res.message, 'error');
      }
    } else {
      const res = await loginPartTimer(loginUsername, loginPassword);
      if (res.success) {
        showToast('Logged in successfully', 'success');
        setLoginUsername('');
        setLoginPassword('');
      } else {
        showToast(res.message, 'error');
      }
    }
  };

  const validateRegistrationDetails = (name, icNumber, email, phone, password, confirmPassword) => {
    if (!name || name.trim().length < 3) {
      showToast('Name must be at least 3 characters.', 'error');
      return false;
    }
    const nameRegex = /^[a-zA-Z\s'-]+$/;
    if (!nameRegex.test(name.trim())) {
      showToast('Name can only contain letters, spaces, hyphens, and apostrophes.', 'error');
      return false;
    }

    const cleanIc = icNumber.trim().replace(/-/g, '');
    if (!/^\d{12}$/.test(cleanIc)) {
      showToast('IC Number must be exactly 12 digits (e.g., 990101-14-1234).', 'error');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      showToast('Please enter a valid email address (e.g., user@example.com).', 'error');
      return false;
    }

    const cleanPhone = phone.trim().replace(/[-\s+]/g, '');
    const phoneRegex = /^(?:60|0)1\d{7,9}$/;
    if (!phoneRegex.test(cleanPhone)) {
      showToast('Please enter a valid Malaysian phone number (e.g., 012-3456789).', 'error');
      return false;
    }

    if (password.length < 8) {
      showToast('Password must be at least 8 characters.', 'error');
      return false;
    }
    if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
      showToast('Password must contain both letters and numbers for safety.', 'error');
      return false;
    }

    if (password !== confirmPassword) {
      showToast('Passwords do not match.', 'error');
      return false;
    }

    return true;
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!validateRegistrationDetails(regName, regIc, regEmail, regPhone, regPassword, regConfirmPassword)) {
      return;
    }

    const res = await registerPartTimer(regName, regIc, regEmail, regPhone, regPassword);
    if (res.success) {
      showToast('Registered successfully!', 'success');
      setRegSuccessMsg(`Registration submitted! Your account is pending admin approval.`);
      setRegName('');
      setRegIc('');
      setRegEmail('');
      setRegPhone('');
      setRegPassword('');
      setRegConfirmPassword('');
      setViewMode('pending');
    } else {
      showToast(res.message, 'error');
    }
  };

  const getToastIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle size={18} style={{ color: '#10b981' }} />;
      case 'error':
        return <XCircle size={18} style={{ color: '#ef4444' }} />;
      default:
        return <AlertCircle size={18} style={{ color: '#3b82f6' }} />;
    }
  };

  // Render landing layout (Login / Register / Pending notice screens)
  if (!adminSession && !partTimerSession && (viewMode === 'login' || viewMode === 'register' || viewMode === 'pending')) {
    return (
      <div className="landing-container" style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: 'var(--bg-app)',
        padding: '2rem'
      }}>
        {viewMode === 'login' && (
          <div className="landing-card card animate-scale" style={{
            width: '100%',
            maxWidth: '480px',
            textAlign: 'center',
            padding: '2.5rem 2rem',
            boxShadow: 'var(--shadow-xl)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)'
          }}>
            <img src={logoImg} alt="Total Neutron Logo" style={{ width: '5.5rem', height: '5.5rem', objectFit: 'contain', marginBottom: '1.25rem' }} />
            <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.25rem', letterSpacing: '-0.03em' }}>
              TN Part-Time Portal
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '2rem' }}>
              Total Neutron Solutions Sdn Bhd
            </p>

            <form onSubmit={handleUnifiedLogin} style={{ textAlign: 'left' }}>
              <div className="form-group">
                <label className="form-label">Username</label>
                <input
                  type="text"
                  className="form-input"
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary btn-block" style={{ marginTop: '1rem', padding: '0.8rem' }}>
                Sign In
              </button>
            </form>

            <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                New Staff member?{' '}
                <span
                  style={{ color: 'var(--primary)', fontWeight: 600, cursor: 'pointer' }}
                  onClick={() => setViewMode('register')}
                >
                  Register here
                </span>
              </p>
            </div>
          </div>
        )}

        {viewMode === 'register' && (
          <div className="landing-card card animate-scale" style={{
            width: '100%',
            maxWidth: '480px',
            padding: '2.5rem 2rem',
            boxShadow: 'var(--shadow-xl)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)'
          }}>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.25rem', letterSpacing: '-0.02em', textAlign: 'center' }}>
              Create Staff Account
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '2.5rem', textAlign: 'center' }}>
              Fill in details to register as a part-timer.
            </p>

            <form onSubmit={handleRegisterSubmit} style={{ textAlign: 'left' }}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Ahmad Syamil"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">IC Number</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. 980712-14-5543"
                  value={regIc}
                  onChange={(e) => setRegIc(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="e.g. ahmad@parttime.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input
                  type="tel"
                  className="form-input"
                  placeholder="e.g. 0198765432"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Min 8 chars, letters & numbers"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Confirm Password</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Re-enter password"
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary btn-block" style={{ marginTop: '1rem', padding: '0.8rem' }}>
                Register
              </button>

              <button
                type="button"
                className="btn btn-secondary btn-block"
                style={{ marginTop: '0.5rem', padding: '0.8rem' }}
                onClick={() => setViewMode('login')}
              >
                Back to Sign In
              </button>
            </form>
          </div>
        )}

        {viewMode === 'pending' && (
          <div className="landing-card card animate-scale" style={{
            width: '100%',
            maxWidth: '480px',
            textAlign: 'center',
            padding: '3rem 2rem',
            boxShadow: 'var(--shadow-xl)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)'
          }}>
            <div style={{ color: '#10b981', marginBottom: '1.5rem', display: 'flex', justifyContent: 'center' }}>
              <CheckCircle size={56} />
            </div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.75rem', letterSpacing: '-0.02em' }}>
              Awaiting Approval
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: '1.6', marginBottom: '2rem' }}>
              {regSuccessMsg}
            </p>

            <button className="btn btn-primary btn-block" onClick={() => setViewMode('login')} style={{ padding: '0.8rem' }}>
              Go to Sign In
            </button>
          </div>
        )}
        {/* Toast Alert Notifications */}
        <div className="toast-container">
          {toasts.map((toast) => (
            <div key={toast.id} className={`toast toast-${toast.type}`}>
              {getToastIcon(toast.type)}
              <span>{toast.message}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Main workspace */}
      <main className="main-content" style={{ padding: viewMode === 'phone' ? '0' : '2rem', maxWidth: viewMode === 'phone' ? '100%' : '1600px', display: 'block', margin: '0 auto' }}>
        {viewMode === 'admin' && (
          <AdminDashboard showToast={showToast} />
        )}

        {viewMode === 'phone' && (
          <PhoneSimulator showToast={showToast} />
        )}
      </main>

      {/* Toast Alert Notifications */}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast-${toast.type}`}>
            {getToastIcon(toast.type)}
            <span>{toast.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
