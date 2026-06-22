import React from 'react';
import logoImg from '../../assets/logo.png';

export default function AdminLogin({ email, setEmail, password, setPassword, handleLogin, onBackToLanding }) {
  return (
    <div className="card animate-scale" style={{ maxWidth: '480px', margin: '3rem auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <img src={logoImg} alt="Total Neutron Logo" style={{ display: 'block', margin: '0 auto 1rem', width: '5rem', height: '5rem', objectFit: 'contain' }} />
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>Admin Dashboard</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Access control panel for managing part-timer accounts.</p>
      </div>

      <form onSubmit={handleLogin}>
        <div className="form-group">
          <label className="form-label">Admin Email</label>
          <input 
            type="email" 
            className="form-input" 
            placeholder="e.g. admin@parttime.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Password</label>
          <input 
            type="password" 
            className="form-input" 
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button type="submit" className="btn btn-primary btn-block" style={{ marginTop: '1rem' }}>
          Login as Admin
        </button>
        {onBackToLanding && (
          <button type="button" className="btn btn-secondary btn-block" style={{ marginTop: '0.5rem' }} onClick={onBackToLanding}>
            Back to Portal Selection
          </button>
        )}
      </form>

      <div style={{ marginTop: '1.5rem', padding: '0.75rem', backgroundColor: 'var(--bg-app)', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', border: '1px solid var(--border-color)' }}>
        <strong>Default Admin Account:</strong><br />
        Email: <code style={{ color: 'var(--primary)' }}>admin@neutron.com</code><br />
        Password: <code style={{ color: 'var(--primary)' }}>abc123456</code>
      </div>
    </div>
  );
}
