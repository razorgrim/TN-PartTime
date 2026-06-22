import React, { useState } from 'react';
import { ChevronLeft } from 'lucide-react';

export default function PhoneLogin({ loginPartTimer, setScreen, showToast }) {
  const [loginIcLast4, setLoginIcLast4] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!loginIcLast4 || !loginPassword) {
      showToast('Please fill in all fields.', 'error');
      return;
    }

    const res = await loginPartTimer(loginIcLast4, loginPassword);
    if (res.success) {
      showToast('Logged in successfully', 'success');
      setScreen('dashboard');
    } else {
      showToast(res.message, 'error');
    }
  };

  return (
    <div style={{ padding: '1.5rem 1.25rem', display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
      <div>
        <button 
          onClick={() => setScreen('welcome')}
          style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.5rem 0', fontWeight: 600, fontSize: '0.875rem', marginBottom: '1.5rem' }}
        >
          <ChevronLeft size={16} /> Back
        </button>

        <h3 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '0.25rem' }}>Sign In</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginBottom: '2rem' }}>Use your IC last 4 digits and password to access.</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">IC Last 4 Digits (Username)</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="e.g. 1234"
              maxLength="4"
              value={loginIcLast4}
              onChange={(e) => setLoginIcLast4(e.target.value)}
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

          <button type="submit" className="btn btn-primary btn-block" style={{ marginTop: '1.5rem', padding: '0.8rem' }}>
            Log In
          </button>
        </form>
      </div>

      <div style={{ textAlign: 'center', marginTop: '2rem' }}>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
          Don't have an account?{' '}
          <span 
            style={{ color: 'var(--primary)', fontWeight: 600, cursor: 'pointer' }}
            onClick={() => setScreen('register')}
          >
            Register here
          </span>
        </p>
      </div>
    </div>
  );
}
