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

export default function PhoneClaimsTab({ partTimerSession, shifts, claims, showToast }) {
  const { adjustClaim } = useContext(AppContext);
  const [selectedClaimIds, setSelectedClaimIds] = useState([]);

  const myClaims = claims.filter(c => c.workerId === partTimerSession?.id);

  const dailyClaims = myClaims.map(claim => {
    const claimShifts = shifts.filter(s => s.claimId === claim.id);
    return {
      ...claim,
      jobTitle: claimShifts.map(s => s.jobTitle).join(' + ') || 'No Shifts',
      locationName: claimShifts.map(s => s.locationName).join('; ') || 'No Location',
      durationMinutes: claimShifts.reduce((sum, s) => sum + (s.durationMinutes || 0), 0),
      claimStatus: claim.status,
      shifts: claimShifts
    };
  });

  const totalEarnings = dailyClaims.reduce((acc, c) => acc + parseFloat(c.payout || 0), 0);

  const toggleSelectClaim = (claimId) => {
    setSelectedClaimIds(prev => 
      prev.includes(claimId) 
        ? prev.filter(id => id !== claimId) 
        : [...prev, claimId]
    );
  };

  const selectedClaims = dailyClaims.filter(c => selectedClaimIds.includes(c.id));
  const selectedTotalAmount = selectedClaims.reduce((acc, c) => acc + parseFloat(c.payout || 0), 0);

  const isBankDetailEmpty = (val) => {
    if (val === null || val === undefined) return true;
    const s = String(val).trim();
    return s === "" || s.toLowerCase() === "null" || s === "—" || s === "-";
  };

  const handleSubmitClaims = async () => {
    // Verify bank details are completed
    if (
      isBankDetailEmpty(partTimerSession?.bankName) || 
      isBankDetailEmpty(partTimerSession?.bankAccount) || 
      isBankDetailEmpty(partTimerSession?.bankHolder)
    ) {
      showToast("Please complete your bank details on your Profile tab before submitting claims.", "error");
      return;
    }

    try {
      // Set all selected claims status to 'submitted'
      for (const claim of selectedClaims) {
        const res = await adjustClaim(claim.id, claim.payRate, claim.payout, 'submitted');
        if (!res || !res.success) {
          throw new Error(res?.message || "Failed to submit claim.");
        }
      }
      showToast("Claim form submitted to admin successfully!", "success");
      setSelectedClaimIds([]);
    } catch (e) {
      console.error(e);
      showToast(e.message || "Failed to submit claim form.", "error");
    }
  };

  const hasMissingBankDetails = 
    isBankDetailEmpty(partTimerSession?.bankName) || 
    isBankDetailEmpty(partTimerSession?.bankAccount) || 
    isBankDetailEmpty(partTimerSession?.bankHolder);

  return (
    <div className="phone-tab-screen" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="phone-screen-header">
        <h2 className="phone-screen-title">e-Claims</h2>
      </div>

      <div style={{ padding: '1.25rem', paddingBottom: selectedClaims.length > 0 ? '160px' : '90px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Missing Bank Details Warning Banner */}
        {hasMissingBankDetails && (
          <div 
            style={{ 
              backgroundColor: '#fef2f2', 
              border: '1px solid #fee2e2', 
              borderRadius: '12px', 
              padding: '0.75rem 1rem', 
              color: '#991b1b', 
              fontSize: '0.75rem',
              fontWeight: 500,
              display: 'flex',
              flexDirection: 'column',
              gap: '4px'
            }}
          >
            <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
              ⚠️ Bank Details Required
            </div>
            <div>
              Please fill in your bank details under the <strong>Profile</strong> tab before you can submit any claims.
            </div>
          </div>
        )}

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
