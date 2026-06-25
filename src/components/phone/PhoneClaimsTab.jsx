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

  const getDailyClaims = (workerShifts) => {
    const groups = {};
    workerShifts.forEach(shift => {
      const dateStr = shift.clockInTime.substring(0, 10);
      if (!groups[dateStr]) {
        groups[dateStr] = {
          date: dateStr,
          shifts: [],
          jobTitles: [],
          locations: [],
          totalDuration: 0,
          claimStatus: 'approved',
        };
      }
      groups[dateStr].shifts.push(shift);
      if (!groups[dateStr].jobTitles.includes(shift.jobTitle)) {
        groups[dateStr].jobTitles.push(shift.jobTitle);
      }
      if (!groups[dateStr].locations.includes(shift.locationName)) {
        groups[dateStr].locations.push(shift.locationName);
      }
      groups[dateStr].totalDuration += (shift.durationMinutes || 0);
      if (shift.claimStatus === 'pending') {
        groups[dateStr].claimStatus = 'pending';
      }
    });

    return Object.values(groups).map(group => {
      const hasPayout = group.shifts.some(s => s.payout !== null);
      const totalPayout = hasPayout
        ? group.shifts.reduce((sum, s) => sum + parseFloat(s.payout || 0), 0)
        : 100.00;

      return {
        id: `daily-${group.date}`,
        date: group.date,
        jobTitle: group.jobTitles.join(' + '),
        locationName: group.locations.join('; '),
        payRate: 100.00,
        payout: totalPayout,
        claimStatus: group.claimStatus,
        durationMinutes: group.totalDuration,
        shifts: group.shifts
      };
    });
  };

  const dailyClaims = getDailyClaims(completedShifts);
  const totalEarnings = dailyClaims.reduce((acc, c) => acc + c.payout, 0);

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
            {dailyClaims.length} Day{dailyClaims.length !== 1 ? 's' : ''}
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
        {dailyClaims.length === 0 ? (
          <div style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', border: '1px dashed var(--border-color)', borderRadius: '16px' }}>
            No claims history found. Complete a shift by checking in first.
          </div>
        ) : (
          dailyClaims.map(claim => (
            <div key={claim.id} className="claim-history-item animate-fade">
              <div style={{ flex: 1, minWidth: 0, paddingRight: '8px' }}>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={claim.jobTitle}>
                  {claim.jobTitle}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                  Date: {new Date(claim.date + 'T00:00:00').toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })} | Daily Rate: RM {Number(claim.payRate).toFixed(2)}
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-primary)' }}>RM {Number(claim.payout).toFixed(2)}</div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Total Duration: {formatDuration(claim.durationMinutes)}</div>
                {claim.claimStatus === 'approved' ? (
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
