import React, { useState } from 'react';
import { Plus, X, Search, Clock, UserCheck, UserX, Edit, Trash2 } from 'lucide-react';

export default function StaffDirectory({ 
  users, 
  toggleUserStatus, 
  deleteStaff, 
  addStaff, 
  startEdit, 
  showToast 
}) {
  // Add Staff State Form
  const [showAddStaffForm, setShowAddStaffForm] = useState(false);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffSalutation, setNewStaffSalutation] = useState('En.');
  const [newStaffIc, setNewStaffIc] = useState('');
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffPhone, setNewStaffPhone] = useState('');
  const [newStaffPassword, setNewStaffPassword] = useState('');

  // Searching & Filtering State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const handleAddStaffSubmit = async (e) => {
    e.preventDefault();
    if (newStaffPassword.length < 8) {
      showToast('Password must be at least 8 characters.', 'error');
      return;
    }
    if (!/[A-Za-z]/.test(newStaffPassword) || !/[0-9]/.test(newStaffPassword)) {
      showToast('Password must contain both letters and numbers.', 'error');
      return;
    }
    const res = await addStaff(newStaffName, newStaffIc, newStaffEmail, newStaffPhone, newStaffPassword, newStaffSalutation);
    if (res.success) {
      showToast(res.message, 'success');
      setNewStaffName('');
      setNewStaffSalutation('En.');
      setNewStaffIc('');
      setNewStaffEmail('');
      setNewStaffPhone('');
      setNewStaffPassword('');
      setShowAddStaffForm(false);
    } else {
      showToast(res.message, 'error');
    }
  };

  const handleStatusToggle = async (user) => {
    const nextStatus = user.status === 'enabled' ? 'disabled' : 'enabled';
    await toggleUserStatus(user.id, nextStatus);
    showToast(`Account of ${user.name} is now ${nextStatus}`, 'info');
  };

  const handleDeleteStaff = async (user) => {
    if (window.confirm(`Are you sure you want to delete staff member "${user.name}"? This will remove their record.`)) {
      await deleteStaff(user.id);
      showToast(`Deleted staff member "${user.name}"`, 'info');
    }
  };

  // Filtered Users List
  const partTimers = users.filter(u => u.role === 'part-timer');
  const filteredPartTimers = partTimers.filter(u => {
    const matchesSearch = 
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.phone.includes(searchQuery) ||
      u.icNumber.includes(searchQuery);
    
    const matchesStatus = statusFilter === 'all' || u.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="card animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Staff Accounts Directory</h2>
        
        <button 
          className="btn btn-primary btn-sm"
          onClick={() => setShowAddStaffForm(!showAddStaffForm)}
          style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
        >
          <Plus size={14} /> Create Staff Account
        </button>
      </div>

      {/* Collapsible Add Staff Form */}
      {showAddStaffForm && (
        <form onSubmit={handleAddStaffSubmit} className="card animate-scale" style={{ backgroundColor: '#f8fafc', padding: '1.25rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700 }}>Add New Staff Member</h3>
            <button type="button" onClick={() => setShowAddStaffForm(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
              <X size={16} />
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Title</label>
              <select 
                className="form-input" 
                value={newStaffSalutation} 
                onChange={(e) => setNewStaffSalutation(e.target.value)}
                required
              >
                <option value="En.">En.</option>
                <option value="Cik">Cik</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g. Tan Ah Kow"
                value={newStaffName}
                onChange={(e) => setNewStaffName(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">IC Number</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g. 010505-14-1234"
                value={newStaffIc}
                onChange={(e) => setNewStaffIc(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input 
                type="email" 
                className="form-input" 
                placeholder="e.g. ahkow@example.com"
                value={newStaffEmail}
                onChange={(e) => setNewStaffEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g. 012345678"
                value={newStaffPhone}
                onChange={(e) => setNewStaffPhone(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input 
                type="password" 
                className="form-input" 
                placeholder="Min 8 chars, letters & numbers"
                value={newStaffPassword}
                onChange={(e) => setNewStaffPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowAddStaffForm(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary btn-sm">Add & Enable Staff</button>
          </div>
        </form>
      )}

      {/* Searching and filtering directory */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', width: '100%', maxWidth: '500px' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            className="form-input" 
            style={{ paddingLeft: '2.25rem' }} 
            placeholder="Search name, IC, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <select 
          className="form-input" 
          style={{ width: '140px' }}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="enabled">Enabled</option>
          <option value="disabled">Disabled</option>
        </select>
      </div>

      {/* Directory Table */}
      <div className="table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Part Timer Info</th>
              <th>IC Number</th>
              <th>Status</th>
              <th>Registered At</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredPartTimers.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  No registered staff found matching search.
                </td>
              </tr>
            ) : (
              filteredPartTimers.map(pt => (
                <tr key={pt.id}>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{pt.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{pt.email} | {pt.phone}</div>
                  </td>
                  <td>
                    <code style={{ fontSize: '0.85rem' }}>{pt.icNumber}</code>
                  </td>
                  <td>
                    <span className={`badge badge-${pt.status}`}>
                      {pt.status === 'pending' ? <Clock size={12} /> : pt.status === 'enabled' ? <UserCheck size={12} /> : <UserX size={12} />}
                      {pt.status}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                    {new Date(pt.createdAt).toLocaleDateString(undefined, { 
                      year: 'numeric', month: 'short', day: 'numeric'
                    })}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '0.25rem', justifyContent: 'flex-end' }}>
                      <button 
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '0.25rem 0.5rem' }}
                        onClick={() => startEdit(pt)}
                        title="Edit Staff Account"
                      >
                        <Edit size={12} />
                      </button>
                      {pt.status === 'pending' && (
                        <button 
                          className="btn btn-success-outline btn-sm"
                          onClick={() => handleStatusToggle(pt)}
                        >
                          Enable
                        </button>
                      )}
                      {pt.status === 'enabled' && (
                        <button 
                          className="btn btn-danger-outline btn-sm"
                          onClick={() => handleStatusToggle(pt)}
                        >
                          Disable
                        </button>
                      )}
                      {pt.status === 'disabled' && (
                        <button 
                          className="btn btn-success-outline btn-sm"
                          onClick={() => handleStatusToggle(pt)}
                        >
                          Enable
                        </button>
                      )}
                      <button 
                        className="btn btn-danger-outline btn-sm"
                        style={{ padding: '0.25rem 0.5rem' }}
                        onClick={() => handleDeleteStaff(pt)}
                        title="Delete Staff Account"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
