import React, { useState } from 'react';
import { Wallet, Search, ArrowLeft } from 'lucide-react';

const formatDuration = (minutes) => {
  if (!minutes) return '—';
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hrs > 0) {
    return `${hrs}h ${mins}m`;
  }
  return `${mins}m`;
};

export default function ClaimsManager({ users, shifts, adjustShiftPayout, showToast }) {
  const [selectedClaimStaffId, setSelectedClaimStaffId] = useState(null);
  const [claimSearchQuery, setClaimSearchQuery] = useState('');
  const [claimStatusFilter, setClaimStatusFilter] = useState('all');

  // Master View: Staff list with claim stats
  if (!selectedClaimStaffId) {
    return (
      <div className="card animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <Wallet size={18} /> e-Claims Approval & Payout Adjustments
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          Select a staff member below to view, adjust, and approve their individual e-claims.
        </p>
        <div className="table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Staff Member</th>
                <th>Total Claims</th>
                <th>Pending Approval</th>
                <th>Approved Claims</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.filter(u => u.role === 'part-timer').length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    No registered staff found.
                  </td>
                </tr>
              ) : (
                users.filter(u => u.role === 'part-timer').map(pt => {
                  const staffShifts = shifts.filter(s => s.status === 'completed' && s.workerId === pt.id);
                  const total = staffShifts.length;
                  const pending = staffShifts.filter(s => s.claimStatus === 'pending').length;
                  const approved = staffShifts.filter(s => s.claimStatus === 'approved').length;

                  return (
                    <tr key={pt.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedClaimStaffId(pt.id)}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '2rem', height: '2rem', borderRadius: '50%', backgroundColor: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', fontWeight: 700, fontSize: '0.85rem' }}>
                            {pt.name ? pt.name.charAt(0).toUpperCase() : '?'}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{pt.name}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{pt.email} | {pt.phone}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span style={{ fontWeight: 600 }}>{total}</span>
                      </td>
                      <td>
                        <span className={`badge badge-${pending > 0 ? 'pending' : 'enabled'}`} style={{ fontSize: '0.75rem' }}>
                          {pending} pending
                        </span>
                      </td>
                      <td>
                        <span className="badge badge-enabled" style={{ backgroundColor: '#d1fae5', color: '#065f46', borderColor: '#a7f3d0', fontSize: '0.75rem' }}>
                          {approved} approved
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button 
                          className="btn btn-primary btn-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedClaimStaffId(pt.id);
                          }}
                        >
                          View Claims
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // Detail View: Claims of selected staff member
  const selectedUser = users.find(u => u.id === selectedClaimStaffId);
  const staffClaims = shifts.filter(s => s.status === 'completed' && s.workerId === selectedClaimStaffId);
  const filteredClaims = staffClaims.filter(s => {
    const matchesSearch = s.jobTitle.toLowerCase().includes(claimSearchQuery.toLowerCase()) || s.locationName.toLowerCase().includes(claimSearchQuery.toLowerCase());
    const matchesStatus = claimStatusFilter === 'all' || s.claimStatus === claimStatusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="card animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button 
            className="btn btn-secondary btn-sm" 
            onClick={() => {
              setSelectedClaimStaffId(null);
              setClaimSearchQuery('');
              setClaimStatusFilter('all');
            }}
            style={{ padding: '0.4rem 0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <ArrowLeft size={14} /> Back
          </button>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>
              Claims for {selectedUser ? selectedUser.name : 'Unknown Staff'}
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', margin: 0 }}>
              {selectedUser ? `${selectedUser.email} | ${selectedUser.phone}` : ''}
            </p>
            {selectedUser && (selectedUser.bankName || selectedUser.bankAccount || selectedUser.bankHolder) ? (
              <p style={{ color: 'var(--primary)', fontSize: '0.75rem', fontWeight: 600, margin: '2px 0 0 0' }}>
                Bank: {selectedUser.bankName || '—'} | Acc: {selectedUser.bankAccount || '—'} | Holder: {selectedUser.bankHolder || '—'}
              </p>
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', margin: '2px 0 0 0', fontStyle: 'italic' }}>
                No bank details registered by staff yet.
              </p>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', width: '200px' }}>
            <Search size={14} style={{ position: 'absolute', left: '0.6rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              className="form-input" 
              style={{ paddingLeft: '1.75rem', height: '32px', fontSize: '0.85rem' }} 
              placeholder="Search project..."
              value={claimSearchQuery}
              onChange={(e) => setClaimSearchQuery(e.target.value)}
            />
          </div>
          
          <select 
            className="form-input" 
            style={{ width: '130px', height: '32px', fontSize: '0.85rem' }}
            value={claimStatusFilter}
            onChange={(e) => setClaimStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
          </select>
        </div>
      </div>

      <div className="table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Job Title & Location</th>
              <th>Clock In / Out Details</th>
              <th>Job Rate (RM)</th>
              <th>Approved Payout (RM)</th>
              <th style={{ textAlign: 'right' }}>Actions & Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredClaims.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  No completed claims found for this staff member matching filter.
                </td>
              </tr>
            ) : (
              filteredClaims.map(claim => (
                <tr key={claim.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{claim.jobTitle}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{claim.locationName}</div>
                  </td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    <div><strong>In:</strong> {new Date(claim.clockInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    <div><strong>Out:</strong> {new Date(claim.clockOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    <div><strong>Duration:</strong> {formatDuration(claim.durationMinutes)}</div>
                  </td>
                  <td>
                    <input 
                      type="number" 
                      className="form-input" 
                      style={{ padding: '4px 8px', fontSize: '0.85rem', width: '80px', height: '28px' }}
                      defaultValue={claim.payRate}
                      id={`rate-${claim.id}`}
                    />
                  </td>
                  <td>
                    <input 
                      type="number" 
                      className="form-input" 
                      style={{ padding: '4px 8px', fontSize: '0.85rem', width: '80px', height: '28px', fontWeight: 'bold' }}
                      defaultValue={claim.payout || claim.payRate}
                      id={`payout-${claim.id}`}
                    />
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end' }}>
                      <button 
                        className="btn btn-primary btn-sm"
                        style={{ height: '28px', padding: '0 12px', fontSize: '0.75rem' }}
                        onClick={async () => {
                          const rateVal = parseFloat(document.getElementById(`rate-${claim.id}`).value);
                          const payoutVal = parseFloat(document.getElementById(`payout-${claim.id}`).value);
                          if (!isNaN(rateVal) && !isNaN(payoutVal)) {
                            await adjustShiftPayout(claim.id, rateVal, payoutVal, true);
                            showToast("Claim payout updated and approved successfully", "success");
                          } else {
                            showToast("Please enter valid numbers", "error");
                          }
                        }}
                      >
                        {claim.claimStatus === 'approved' ? 'Update' : 'Approve'}
                      </button>
                      {claim.claimStatus === 'approved' ? (
                        <span className="badge badge-enabled">Approved</span>
                      ) : (
                        <span className="badge badge-pending">Pending</span>
                      )}
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
