import React, { useState } from 'react';
import { ChevronLeft, User, Fingerprint, Mail, Phone, Key } from 'lucide-react';

export default function PhoneRegister({ registerPartTimer, setScreen, setRegSuccessMsg, showToast }) {
  const [regName, setRegName] = useState('');
  const [regIc, setRegIc] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');

  const validateDetails = (name, ic, email, phone, password, confirmPassword) => {
    if (!name || name.trim().length < 3) {
      showToast('Name must be at least 3 characters.', 'error');
      return false;
    }
    const nameRegex = /^[a-zA-Z\s'-]+$/;
    if (!nameRegex.test(name.trim())) {
      showToast('Name can only contain letters, spaces, hyphens, and apostrophes.', 'error');
      return false;
    }

    const cleanIc = ic.trim().replace(/-/g, '');
    if (!/^\d{12}$/.test(cleanIc)) {
      showToast('IC Number must be exactly 12 digits (e.g. 990101-14-1234).', 'error');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      showToast('Please enter a valid email address (e.g. user@example.com).', 'error');
      return false;
    }

    const cleanPhone = phone.trim().replace(/[-\s+]/g, '');
    const phoneRegex = /^(?:60|0)1\d{7,9}$/;
    if (!phoneRegex.test(cleanPhone)) {
      showToast('Please enter a valid Malaysian phone number (e.g. 012-3456789).', 'error');
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateDetails(regName, regIc, regEmail, regPhone, regPassword, regConfirmPassword)) {
      return;
    }

    const res = await registerPartTimer(regName, regIc, regEmail, regPhone, regPassword);
    if (res.success) {
      showToast('Registered successfully!', 'success');
      setRegSuccessMsg(`Registration submitted! Your account is pending admin approval.`);
      setScreen('pending_notice');
    } else {
      showToast(res.message, 'error');
    }
  };

  return (
    <div style={{ padding: '1.5rem 1.25rem' }}>
      <button 
        onClick={() => setScreen('welcome')}
        style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.5rem 0', fontWeight: 600, fontSize: '0.875rem', marginBottom: '1rem' }}
      >
        <ChevronLeft size={16} /> Back
      </button>

      <h3 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '0.25rem' }}>Create Account</h3>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginBottom: '1.5rem' }}>Fill in details to register as a part-timer.</p>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><User size={14} /> Full Name</span>
          </label>
          <input 
            type="text" 
            className="form-input" 
            placeholder="e.g. John Doe"
            value={regName}
            onChange={(e) => setRegName(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Fingerprint size={14} /> IC Number</span>
          </label>
          <input 
            type="text" 
            className="form-input" 
            placeholder="e.g. 990101-14-1234"
            value={regIc}
            onChange={(e) => setRegIc(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Mail size={14} /> Email Address</span>
          </label>
          <input 
            type="email" 
            className="form-input" 
            placeholder="e.g. john@example.com"
            value={regEmail}
            onChange={(e) => setRegEmail(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Phone size={14} /> Phone Number</span>
          </label>
          <input 
            type="tel" 
            className="form-input" 
            placeholder="e.g. 0123456789"
            value={regPhone}
            onChange={(e) => setRegPhone(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Key size={14} /> Password</span>
          </label>
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
          <label className="form-label">
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Key size={14} /> Confirm Password</span>
          </label>
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
      </form>
    </div>
  );
}
