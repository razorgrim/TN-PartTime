import React from 'react';
import { Clock } from 'lucide-react';

const formatDuration = (minutes) => {
  if (!minutes) return '—';
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hrs > 0) {
    return `${hrs}h ${mins}m`;
  }
  return `${mins}m`;
};

export default function ShiftMonitoring({ shifts, clearShifts, showToast }) {
  const handleClear = async () => {
    if (window.confirm('Are you sure you want to clear all shift monitoring records? This action cannot be undone.')) {
      const res = await clearShifts();
      if (res.success) {
        showToast(res.message, 'success');
      } else {
        showToast(res.message, 'error');
      }
    }
  };

  return (
    <div className="card animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
          <Clock size={18} /> Active Shifts & Work Duration
        </h2>
        {shifts.length > 0 && (
          <button 
            type="button" 
            className="btn btn-secondary btn-sm"
            onClick={handleClear}
            style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            Clear Shift History
          </button>
        )}
      </div>

      <div className="table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Job Title & Location</th>
              <th>Assigned Worker</th>
              <th>Status</th>
              <th>Check In / Out Details</th>
              <th>Work Duration</th>
              <th>Approved Payout</th>
            </tr>
          </thead>
          <tbody>
            {shifts.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  No shifts recorded yet. Staff will appear here once they clock in.
                </td>
              </tr>
            ) : (
              shifts.map(shift => (
                <tr key={shift.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{shift.jobTitle}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{shift.locationName}</div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div style={{ width: '1.5rem', height: '1.5rem', borderRadius: '50%', backgroundColor: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', fontWeight: 700, fontSize: '0.7rem' }}>
                        {shift.workerName ? shift.workerName.charAt(0).toUpperCase() : '?'}
                      </div>
                      <div>
                        <div style={{ fontWeight: 500 }}>{shift.workerName}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span 
                      className="badge"
                      style={{
                        backgroundColor: shift.status === 'active' ? '#e0f2fe' : '#d1fae5',
                        color: shift.status === 'active' ? '#0369a1' : '#065f46',
                        borderColor: shift.status === 'active' ? '#bae6fd' : '#a7f3d0'
                      }}
                    >
                      {shift.status === 'completed' ? 'Completed' : 'Clocked In'}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {shift.status === 'active' && (
                      <div>
                        <strong>In:</strong> {new Date(shift.clockInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({shift.clockInDistance}m away)
                      </div>
                    )}
                    {shift.status === 'completed' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <div>
                          <strong>In:</strong> {new Date(shift.clockInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({shift.clockInDistance}m)
                        </div>
                        <div>
                          <strong>Out:</strong> {new Date(shift.clockOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({shift.clockOutDistance}m)
                        </div>
                      </div>
                    )}
                  </td>
                  <td style={{ fontWeight: 600 }}>
                    {shift.status === 'completed' ? formatDuration(shift.durationMinutes) : 'Working...'}
                  </td>
                  <td>
                    {shift.status === 'completed' ? (
                      <div>
                        <strong>RM {Number(shift.payout || shift.payRate).toFixed(2)}</strong>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                          <span>Claim:</span>
                          {shift.claimStatus === 'approved' ? (
                            <span className="badge badge-enabled" style={{ fontSize: '0.55rem', padding: '0px 6px', height: '16px', display: 'inline-flex', alignItems: 'center' }}>
                              Approved
                            </span>
                          ) : (
                            <span className="badge badge-pending" style={{ fontSize: '0.55rem', padding: '0px 6px', height: '16px', display: 'inline-flex', alignItems: 'center' }}>
                              Pending
                            </span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Working...</span>
                      </div>
                    )}
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
