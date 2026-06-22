import React from 'react';

const formatDuration = (minutes) => {
  if (!minutes) return '0m';
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hrs > 0) {
    return `${hrs}h ${mins}m`;
  }
  return `${mins}m`;
};

export default function PhoneClaimsTab({ partTimerSession, shifts }) {
  const ptShifts = shifts.filter(s => s.workerId === partTimerSession?.id);
  const completedShifts = ptShifts.filter(s => s.status === 'completed');
  const totalEarnings = completedShifts.reduce((acc, s) => acc + (s.payout || s.payRate), 0);

  return (
    <div className="phone-tab-screen">
      <div className="phone-screen-header">
        <h2 className="phone-screen-title">e-Claims</h2>
      </div>

      {/* Claims Summary */}
      <div className="claims-summary-card">
        <div>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Completed</span>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            {completedShifts.length} Shift{completedShifts.length !== 1 ? 's' : ''}
          </h3>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Total Earnings</span>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)' }}>
            RM {Number(totalEarnings).toFixed(2)}
          </h3>
        </div>
      </div>

      <h4 style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
        Claim History
      </h4>

      {/* Claim History List */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {completedShifts.length === 0 ? (
          <div style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', border: '1px dashed var(--border-color)', borderRadius: '16px' }}>
            No claims history found. Complete a shift by checking in first.
          </div>
        ) : (
          completedShifts.map(shift => (
            <div key={shift.id} className="claim-history-item animate-fade">
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{shift.jobTitle}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                  Clocked In: {new Date(shift.clockInTime).toLocaleDateString([], { month: 'short', day: 'numeric' })} | Job Rate: RM {Number(shift.payRate).toFixed(2)}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-primary)' }}>RM {Number(shift.payout || shift.payRate).toFixed(2)}</div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Duration: {formatDuration(shift.durationMinutes)}</div>
                {shift.claimStatus === 'approved' ? (
                  <span className="badge badge-enabled" style={{ fontSize: '0.55rem', padding: '0px 6px', marginTop: '0.15rem' }}>Approved</span>
                ) : (
                  <span className="badge badge-pending" style={{ fontSize: '0.55rem', padding: '0px 6px', marginTop: '0.15rem' }}>Pending Approval</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
