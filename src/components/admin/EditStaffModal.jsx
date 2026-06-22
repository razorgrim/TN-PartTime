import React, { useState } from 'react';
import { X } from 'lucide-react';

export default function EditStaffModal({ user, onClose, onSave, showToast }) {
  const [editName, setEditName] = useState(user.name || '');
  const [editIc, setEditIc] = useState(user.icNumber || '');
  const [editEmail, setEditEmail] = useState(user.email || '');
  const [editPhone, setEditPhone] = useState(user.phone || '');
  const [editPassword, setEditPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!editName.trim()) {
      showToast('Name is required.', 'error');
      return;
    }
    if (!editIc.trim()) {
      showToast('IC Number is required.', 'error');
      return;
    }
    if (!editEmail.trim()) {
      showToast('Email is required.', 'error');
      return;
    }
    if (!editPhone.trim()) {
      showToast('Phone number is required.', 'error');
      return;
    }
    if (editPassword && editPassword.trim() !== '') {
      if (editPassword.length < 8) {
        showToast('Password must be at least 8 characters.', 'error');
        return;
      }
      if (!/[A-Za-z]/.test(editPassword) || !/[0-9]/.test(editPassword)) {
        showToast('Password must contain both letters and numbers.', 'error');
        return;
      }
    }

    const res = await onSave(user.id, editName, editIc, editEmail, editPhone, editPassword);
    if (res.success) {
      showToast(res.message, 'success');
      onClose();
    } else {
      showToast(res.message, 'error');
    }
  };

  return (
    <div className="modal-overlay" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 999,
      padding: '1rem'
    }}>
      <div className="card animate-scale" style={{
        width: '100%',
        maxWidth: '480px',
        margin: '0 auto',
        position: 'relative',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        border: '1px solid var(--border-color)',
        padding: '1.75rem'
      }}>
        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Edit Staff Profile</h3>
          <button 
            type="button" 
            onClick={onClose} 
            style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px', borderRadius: '50%' }}
            className="hover-bg"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input 
                type="text" 
                className="form-input" 
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="e.g. Tan Ah Kow"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">IC Number</label>
              <input 
                type="text" 
                className="form-input" 
                value={editIc}
                onChange={(e) => setEditIc(e.target.value)}
                placeholder="e.g. 010505-14-1234"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input 
                type="email" 
                className="form-input" 
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                placeholder="e.g. ahkow@example.com"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input 
                type="text" 
                className="form-input" 
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                placeholder="e.g. 012345678"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">New Password (optional)</label>
              <input 
                type="password" 
                className="form-input" 
                value={editPassword}
                onChange={(e) => setEditPassword(e.target.value)}
                placeholder="Leave blank to keep existing password"
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary btn-sm">Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  );
}
