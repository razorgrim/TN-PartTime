import React, { useState, useContext } from 'react';
import { AppContext } from '../../context/AppContext';
import logoImg from '../../assets/logo.png';
import { FileText, Printer, Send, X, Download } from 'lucide-react';

const formatDuration = (minutes) => {
  if (!minutes) return '0m';
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hrs > 0) {
    return `${hrs}h ${mins}m`;
  }
  return `${mins}m`;
};

// Parse local YYYY-MM-DD
const parseLocalDate = (dateStr) => {
  if (!dateStr) return new Date();
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

export default function PhoneClaimsTab({ partTimerSession, shifts, showToast }) {
  const { adjustShiftPayout } = useContext(AppContext);
  const [selectedClaimIds, setSelectedClaimIds] = useState([]);

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
    });

    return Object.values(groups).map(group => {
      // Resolve daily status
      const statuses = group.shifts.map(s => s.claimStatus || 'pending');
      let finalStatus = 'paid';
      if (statuses.includes('pending')) {
        finalStatus = 'pending';
      } else if (statuses.includes('approved')) {
        finalStatus = 'approved';
      } else if (statuses.includes('submitted')) {
        finalStatus = 'submitted';
      }

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
        claimStatus: finalStatus,
        durationMinutes: group.totalDuration,
        shifts: group.shifts
      };
    });
  };

  const dailyClaims = getDailyClaims(completedShifts);
  const totalEarnings = dailyClaims.reduce((acc, c) => acc + c.payout, 0);

  const toggleSelectClaim = (claimId) => {
    setSelectedClaimIds(prev => 
      prev.includes(claimId) 
        ? prev.filter(id => id !== claimId) 
        : [...prev, claimId]
    );
  };

  const selectedClaims = dailyClaims.filter(c => selectedClaimIds.includes(c.id));
  const selectedTotalAmount = selectedClaims.reduce((acc, c) => acc + c.payout, 0);

  const handleSubmitClaims = async () => {
    try {
      // Set all selected shifts status to 'submitted'
      for (const claim of selectedClaims) {
        for (const shift of claim.shifts) {
          const res = await adjustShiftPayout(shift.id, shift.payRate, shift.payout, false, 'submitted');
          if (!res || !res.success) {
            throw new Error(res?.message || "Failed to submit shift claim.");
          }
        }
      }
      showToast("Claim form submitted to admin successfully!", "success");
      setSelectedClaimIds([]);
    } catch (e) {
      console.error(e);
      showToast(e.message || "Failed to submit claim form.", "error");
    }
  };

  return (
    <div className="phone-tab-screen" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="phone-screen-header">
        <h2 className="phone-screen-title">e-Claims</h2>
      </div>

      <div style={{ padding: '1.25rem', paddingBottom: selectedClaims.length > 0 ? '160px' : '90px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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

        <h4 style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
          Claim History
        </h4>

        {/* Claim History List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {dailyClaims.length === 0 ? (
            <div style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', border: '1px dashed var(--border-color)', borderRadius: '16px' }}>
              No claims history found. Complete a shift by checking in first.
            </div>
          ) : (
            dailyClaims.map(claim => {
              const isApproved = claim.claimStatus === 'approved';
              const isSelected = selectedClaimIds.includes(claim.id);
              
              return (
                <div 
                  key={claim.id} 
                  className={`claim-history-item animate-fade ${isSelected ? 'selected' : ''}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    border: isSelected ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                    backgroundColor: isSelected ? '#f5f3ff' : 'var(--bg-card)',
                    padding: '0.85rem',
                    borderRadius: '12px',
                    transition: 'all 0.2s'
                  }}
                >
                  {isApproved && (
                    <input 
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelectClaim(claim.id)}
                      style={{
                        width: '16px',
                        height: '16px',
                        accentColor: 'var(--primary)',
                        cursor: 'pointer',
                        flexShrink: 0
                      }}
                    />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={claim.jobTitle}>
                      {claim.jobTitle}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                      Date: {parseLocalDate(claim.date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })} | Daily Rate: RM {Number(claim.payRate).toFixed(2)}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-primary)' }}>RM {Number(claim.payout).toFixed(2)}</div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Total Duration: {formatDuration(claim.durationMinutes)}</div>
                    {claim.claimStatus === 'paid' ? (
                      <span className="badge badge-enabled" style={{ backgroundColor: '#dbeafe', color: '#1e40af', borderColor: '#bfdbfe', fontSize: '0.55rem', padding: '0px 6px', marginTop: '0.15rem' }}>Paid</span>
                    ) : claim.claimStatus === 'submitted' ? (
                      <span className="badge badge-pending" style={{ backgroundColor: '#ffedd5', color: '#c2410c', borderColor: '#fed7aa', fontSize: '0.55rem', padding: '0px 6px', marginTop: '0.15rem' }}>Submitted</span>
                    ) : claim.claimStatus === 'approved' ? (
                      <span className="badge badge-enabled" style={{ fontSize: '0.55rem', padding: '0px 6px', marginTop: '0.15rem' }}>Approved</span>
                    ) : (
                      <span className="badge badge-pending" style={{ fontSize: '0.55rem', padding: '0px 6px', marginTop: '0.15rem' }}>Pending Approval</span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Floating Action Bar for Selected Claims */}
      {selectedClaims.length > 0 && (
        <div 
          className="no-print animate-fade"
          style={{
            position: 'absolute',
            bottom: '75px',
            left: '1rem',
            right: '1rem',
            backgroundColor: 'white',
            border: '1px solid var(--border-color)',
            boxShadow: '0 -10px 15px -3px rgba(0,0,0,0.05), 0 4px 6px -2px rgba(0,0,0,0.05)',
            borderRadius: '16px',
            padding: '0.9rem 1.25rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            zIndex: 100
          }}
        >
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
              {selectedClaims.length} Claim{selectedClaims.length > 1 ? 's' : ''} Selected
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--primary)' }}>
              RM {Number(selectedTotalAmount).toFixed(2)}
            </div>
          </div>
          <button
            onClick={handleSubmitClaims}
            className="btn btn-primary"
            style={{
              padding: '0.5rem 1.25rem',
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              height: '34px',
              borderRadius: '8px'
            }}
          >
            <Send size={14} /> Submit Claim Form
          </button>
        </div>
      )}
    </div>
  );
}
