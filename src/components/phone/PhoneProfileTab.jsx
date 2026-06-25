import React, { useState } from 'react';
import { LogOut } from 'lucide-react';

export default function PhoneProfileTab({ partTimerSession, updateStaffProfile, handleLogout, showToast }) {
  const [bankName, setBankName] = useState(partTimerSession.bankName || '');
  const [bankAccount, setBankAccount] = useState(partTimerSession.bankAccount || '');
  const [bankHolder, setBankHolder] = useState(partTimerSession.bankHolder || '');
  const [salutation, setSalutation] = useState(partTimerSession.salutation || 'Engineer');

  // Password change states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSaveBankDetails = async (e) => {
    e.preventDefault();
    if (!bankName.trim() || !bankAccount.trim() || !bankHolder.trim()) {
      showToast('All bank details are required.', 'error');
      return;
    }
    const res = await updateStaffProfile(partTimerSession.id, null, null, bankName, bankAccount, bankHolder, salutation);
    if (res.success) {
      showToast('Profile and bank details saved successfully!', 'success');
    } else {
      showToast(res.message || 'Failed to save details.', 'error');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword) {
      showToast('Please enter your current password.', 'error');
      return;
    }
    if (newPassword.length < 8) {
      showToast('New password must be at least 8 characters long.', 'error');
      return;
    }
    if (!/[A-Za-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      showToast('New password must contain both letters and numbers.', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('New password and confirmation do not match.', 'error');
      return;
    }

    const res = await updateStaffProfile(
      partTimerSession.id,
      currentPassword,
      newPassword,
      partTimerSession.bankName || bankName,
      partTimerSession.bankAccount || bankAccount,
      partTimerSession.bankHolder || bankHolder,
      salutation
    );

    if (res.success) {
      showToast('Password updated successfully!', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      showToast(res.message || 'Failed to update password.', 'error');
    }
  };

  return (
    <div className="phone-tab-screen" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="phone-screen-header">
        <h2 className="phone-screen-title">Profile</h2>
      </div>

      <div style={{ padding: '1.25rem', paddingBottom: '90px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Member info card */}
        <div className="card" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '50%', backgroundColor: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', fontWeight: 800, fontSize: '1.1rem' }}>
            {partTimerSession.name ? partTimerSession.name.charAt(0).toUpperCase() : '?'}
          </div>
          <div>
            <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>{"Engineer " + partTimerSession.name}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Registered Part-Timer</div>
          </div>
        </div>

        {/* Personal Details */}
        <div>
          <h4 style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
            Personal Info
          </h4>
          <div className="card" style={{ padding: '0.85rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.8rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Designation:</span>
              <strong style={{ color: 'var(--text-primary)' }}>Engineer</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>IC Number:</span>
              <strong style={{ color: 'var(--text-primary)' }}>{partTimerSession.icNumber}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Email:</span>
              <strong style={{ color: 'var(--text-primary)' }}>{partTimerSession.email}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Phone:</span>
              <strong style={{ color: 'var(--text-primary)' }}>{partTimerSession.phone}</strong>
            </div>
          </div>
        </div>

        {/* Change Password Form */}
        <div>
          <h4 style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
            Security Settings
          </h4>
          <form onSubmit={handleChangePassword} className="card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.75rem' }}>Current Password</label>
              <input 
                type="password" 
                className="form-input" 
                style={{ padding: '0.5rem 0.75rem', fontSize: '0.8rem' }}
                placeholder="••••••••"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.75rem' }}>New Password</label>
              <input 
                type="password" 
                className="form-input" 
                style={{ padding: '0.5rem 0.75rem', fontSize: '0.8rem' }}
                placeholder="Min 8 chars, letters & numbers"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.75rem' }}>Confirm New Password</label>
              <input 
                type="password" 
                className="form-input" 
                style={{ padding: '0.5rem 0.75rem', fontSize: '0.8rem' }}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary btn-block btn-sm">
              Update Password
            </button>
          </form>
        </div>

        {/* Bank Details Form */}
        <div>
          <h4 style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
            Bank & Payout Info
          </h4>
          <form onSubmit={handleSaveBankDetails} className="card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>

            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.75rem' }}>Bank Name</label>
              <input 
                type="text" 
                className="form-input" 
                style={{ padding: '0.5rem 0.75rem', fontSize: '0.8rem' }}
                placeholder="e.g. Maybank, CIMB"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.75rem' }}>Bank Account Number</label>
              <input 
                type="text" 
                className="form-input" 
                style={{ padding: '0.5rem 0.75rem', fontSize: '0.8rem' }}
                placeholder="e.g. 164012345678"
                value={bankAccount}
                onChange={(e) => setBankAccount(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.75rem' }}>Account Holder Name</label>
              <input 
                type="text" 
                className="form-input" 
                style={{ padding: '0.5rem 0.75rem', fontSize: '0.8rem' }}
                placeholder="e.g. Ahmad Syamil Bin Osman"
                value={bankHolder}
                onChange={(e) => setBankHolder(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary btn-block btn-sm">
              Save Payout Details
            </button>
          </form>
        </div>

        {/* Logout Button */}
        <div>
          <button 
            type="button" 
            className="btn btn-danger btn-block btn-sm"
            onClick={handleLogout}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', height: '38px' }}
          >
            <LogOut size={16} /> Logout from Portal
          </button>
        </div>
      </div>
    </div>
  );
}
