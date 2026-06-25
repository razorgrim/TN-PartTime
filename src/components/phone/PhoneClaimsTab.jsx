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

export default function PhoneClaimsTab({ partTimerSession, shifts }) {
  const { adjustShiftPayout, showToast } = useContext(AppContext);
  const [selectedClaimIds, setSelectedClaimIds] = useState([]);
  const [showFormModal, setShowFormModal] = useState(false);

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
          await adjustShiftPayout(shift.id, shift.payRate, shift.payout, false, 'submitted');
        }
      }
      showToast("Claim form submitted to admin successfully!", "success");
      setSelectedClaimIds([]);
      setShowFormModal(false);
    } catch (e) {
      console.error(e);
      showToast("Failed to submit claim form.", "error");
    }
  };

  const handleDownloadHTML = () => {
    const element = document.getElementById('printable-claim-sheet');
    if (!element) return;
    const htmlContent = element.innerHTML;
    const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Claim Form - ${partTimerSession?.name || 'Staff'}</title>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    body { margin: 0; padding: 40px; background-color: #f1f5f9; font-family: 'Outfit', sans-serif; }
    .claim-container { max-width: 900px; margin: 0 auto; background: white; padding: 40px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); border-radius: 8px; color: black; }
    @media print {
      @page { size: landscape; margin: 20mm; }
      body { background-color: white; padding: 0; }
      .claim-container { box-shadow: none; padding: 0; max-width: 100%; }
    }
  </style>
</head>
<body>
  <div class="claim-container">${htmlContent}</div>
</body>
</html>`;
    const blob = new Blob([fullHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Claim_Form_${(partTimerSession?.name || 'Staff').replace(/\\s+/g, '_')}_${new Date().toISOString().substring(0, 10)}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast("Claim form downloaded successfully!", "success");
  };

  return (
    <div className="phone-tab-screen" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <style>{`
        @media print {
          @page {
            size: landscape;
          }
          body * {
            visibility: hidden;
          }
          #printable-claim-sheet, #printable-claim-sheet * {
            visibility: visible;
          }
          #printable-claim-sheet {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white;
            color: black;
            padding: 20px;
            font-size: 11px;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

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
            onClick={() => setShowFormModal(true)}
            className="btn btn-primary"
            style={{
              padding: '0.5rem 1rem',
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              height: '34px',
              borderRadius: '8px'
            }}
          >
            <FileText size={14} /> Claim Form
          </button>
        </div>
      )}

      {/* Claim Form high-fidelity Modal */}
      {showFormModal && (
        <div 
          className="modal-overlay no-print"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            zIndex: 999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
          }}
        >
          <div 
            className="card animate-scale"
            style={{
              width: '100%',
              maxWidth: '850px',
              backgroundColor: 'white',
              maxHeight: '90vh',
              borderRadius: '16px',
              border: '1px solid var(--border-color)',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: 'var(--shadow-xl)',
              overflow: 'hidden'
            }}
          >
            {/* Modal Controls Header */}
            <div 
              style={{ 
                padding: '0.75rem 1.25rem', 
                borderBottom: '1px solid var(--border-color)', 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                flexShrink: 0
              }}
            >
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Claim Form Preview</h3>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button
                  onClick={handleDownloadHTML}
                  className="btn btn-secondary"
                  style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px', height: '30px', backgroundColor: '#e2e8f0', color: '#1e293b', borderColor: '#cbd5e1' }}
                >
                  <Download size={13} /> Download Form
                </button>
                <button
                  onClick={() => window.print()}
                  className="btn btn-secondary"
                  style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px', height: '30px' }}
                >
                  <Printer size={13} /> Print / Save PDF
                </button>
                <button
                  onClick={handleSubmitClaims}
                  className="btn btn-primary"
                  style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px', height: '30px' }}
                >
                  <Send size={13} /> Send to Admin
                </button>
                <button
                  onClick={() => setShowFormModal(false)}
                  style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Printable Claim Sheet Area */}
            <div 
              id="printable-claim-sheet"
              style={{
                padding: '2.5rem',
                overflowY: 'auto',
                flex: 1,
                backgroundColor: 'white',
                color: 'black',
                fontFamily: 'Outfit, sans-serif'
              }}
            >
              {/* Document Header Letterhead */}
              <div style={{ display: 'flex', alignItems: 'center', borderBottom: '2px solid black', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
                <div style={{ marginRight: '1.5rem' }}>
                  <img src={logoImg} alt="Logo" style={{ width: '4.5rem', height: '4.5rem', objectFit: 'contain' }} />
                </div>
                <div style={{ flex: 1, textAlign: 'center' }}>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, letterSpacing: '0.05em' }}>
                    TOTAL NEUTRON SOLUTION SDN BHD (1064906-M)
                  </h2>
                  <p style={{ fontSize: '0.65rem', margin: '2px 0 0 0', color: '#334155', fontWeight: 500 }}>
                    5-2 PERSIARAN SYED PUTRA 3 TAMAN PERSIARAN DESA 50460 SEPUTEH KUALA LUMPUR
                  </p>
                  <p style={{ fontSize: '0.65rem', margin: '1px 0 0 0', color: '#334155', fontWeight: 500 }}>
                    TEL: 603-8320 8306
                  </p>
                </div>
              </div>

              {/* Title Banner */}
              <div 
                style={{ 
                  border: '2px solid black', 
                  padding: '5px', 
                  textAlign: 'center', 
                  fontWeight: 800, 
                  fontSize: '0.9rem', 
                  marginBottom: '1rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  backgroundColor: '#f8fafc'
                }}
              >
                {"ENGINEER " + (partTimerSession?.name || '').toUpperCase()}
              </div>

              {/* Employee Information Table */}
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1.5rem', fontSize: '0.75rem' }}>
                <tbody>
                  <tr>
                    <td style={{ width: '15%', border: '1px solid black', padding: '6px', fontWeight: 700, backgroundColor: '#f8fafc' }}>Employee Name:</td>
                    <td style={{ width: '35%', border: '1px solid black', padding: '6px' }}>{partTimerSession?.name}</td>
                    <td style={{ width: '15%', border: '1px solid black', padding: '6px', fontWeight: 700, backgroundColor: '#f8fafc' }}>Contact Numbers:</td>
                    <td style={{ width: '35%', border: '1px solid black', padding: '6px' }}>{partTimerSession?.phone}</td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid black', padding: '6px', fontWeight: 700, backgroundColor: '#f8fafc' }}>IC:</td>
                    <td style={{ border: '1px solid black', padding: '6px' }}>{partTimerSession?.icNumber}</td>
                    <td style={{ border: '1px solid black', padding: '6px', fontWeight: 700, backgroundColor: '#f8fafc' }}>Account Number:</td>
                    <td style={{ border: '1px solid black', padding: '6px' }}>{partTimerSession?.bankAccount || '—'}</td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid black', padding: '6px', fontWeight: 700, backgroundColor: '#f8fafc' }}>Date:</td>
                    <td style={{ border: '1px solid black', padding: '6px' }}>{new Date().toLocaleDateString(undefined, { dateStyle: 'medium' })}</td>
                    <td style={{ border: '1px solid black', padding: '6px', fontWeight: 700, backgroundColor: '#f8fafc' }}>Account Holder's Name:</td>
                    <td style={{ border: '1px solid black', padding: '6px' }}>{partTimerSession?.bankHolder || '—'}</td>
                  </tr>
                </tbody>
              </table>

              {/* Claims Details Breakdown Table */}
              <div style={{ width: '100%', overflowX: 'auto', marginBottom: '1.5rem' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.72rem', minWidth: '700px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f1f5f9', fontWeight: 800 }}>
                    <th style={{ border: '1px solid black', padding: '8px', textAlign: 'center', width: '12%' }}>Date</th>
                    <th style={{ border: '1px solid black', padding: '8px', textAlign: 'center', width: '12%' }}>Check in (Hours)</th>
                    <th style={{ border: '1px solid black', padding: '8px', textAlign: 'center', width: '12%' }}>Check Out (Hours)</th>
                    <th style={{ border: '1px solid black', padding: '8px', textAlign: 'left', width: '36%' }}>Location</th>
                    <th style={{ border: '1px solid black', padding: '8px', textAlign: 'center', width: '10%' }}>Overtime</th>
                    <th style={{ border: '1px solid black', padding: '8px', textAlign: 'center', width: '10%' }}>Claims</th>
                    <th style={{ border: '1px solid black', padding: '8px', textAlign: 'right', width: '12%' }}>Price (RM)</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedClaims.map(claim => {
                    return claim.shifts.map((shift, idx) => {
                      const clockInTimeFormatted = new Date(shift.clockInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                      const clockOutTimeFormatted = shift.clockOutTime
                        ? new Date(shift.clockOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : '—';
                      
                      return (
                        <tr key={shift.id}>
                          <td style={{ border: '1px solid black', padding: '6px', textAlign: 'center' }}>
                            {idx === 0 ? parseLocalDate(claim.date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : ''}
                          </td>
                          <td style={{ border: '1px solid black', padding: '6px', textAlign: 'center' }}>{clockInTimeFormatted}</td>
                          <td style={{ border: '1px solid black', padding: '6px', textAlign: 'center' }}>{clockOutTimeFormatted}</td>
                          <td style={{ border: '1px solid black', padding: '6px' }}>
                            <div style={{ fontWeight: 600 }}>{shift.jobTitle}</div>
                            <div style={{ fontSize: '0.65rem', color: '#475569' }}>{shift.locationName}</div>
                          </td>
                          <td style={{ border: '1px solid black', padding: '6px', textAlign: 'center' }}>—</td>
                          <td style={{ border: '1px solid black', padding: '6px', textAlign: 'center' }}>Daily Flat Rate</td>
                          <td style={{ border: '1px solid black', padding: '6px', textAlign: 'right', fontWeight: 600 }}>
                            RM {idx === 0 ? Number(claim.payout).toFixed(2) : '0.00'}
                          </td>
                        </tr>
                      );
                    });
                  })}
                  {/* Empty rows to match spreadsheet aesthetic if less than 8 items */}
                  {Array.from({ length: Math.max(0, 8 - selectedClaims.reduce((acc, c) => acc + c.shifts.length, 0)) }).map((_, idx) => (
                    <tr key={`empty-${idx}`} style={{ height: '24px' }}>
                      <td style={{ border: '1px solid black', padding: '6px' }}></td>
                      <td style={{ border: '1px solid black', padding: '6px' }}></td>
                      <td style={{ border: '1px solid black', padding: '6px' }}></td>
                      <td style={{ border: '1px solid black', padding: '6px' }}></td>
                      <td style={{ border: '1px solid black', padding: '6px' }}></td>
                      <td style={{ border: '1px solid black', padding: '6px' }}></td>
                      <td style={{ border: '1px solid black', padding: '6px' }}></td>
                    </tr>
                  ))}
                  {/* Total Row */}
                  <tr style={{ backgroundColor: '#f8fafc', fontWeight: 800 }}>
                    <td colSpan="6" style={{ border: '1px solid black', padding: '8px', textAlign: 'right', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                      Total Amount Approved:
                    </td>
                    <td style={{ border: '1px solid black', padding: '8px', textAlign: 'right', fontSize: '0.78rem', color: 'var(--primary)' }}>
                      RM {Number(selectedTotalAmount).toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>
              </div>

              {/* Signature Blocks */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '3.5rem', fontSize: '0.72rem' }}>
                <div style={{ borderTop: '1px solid black', width: '200px', textAlign: 'center', paddingTop: '5px' }}>
                  <strong>Submitted By:</strong>
                  <div style={{ marginTop: '2px', color: '#475569' }}>{partTimerSession?.name}</div>
                </div>
                <div style={{ borderTop: '1px solid black', width: '200px', textAlign: 'center', paddingTop: '5px' }}>
                  <strong>Approved & Paid By:</strong>
                  <div style={{ marginTop: '2px', color: '#475569' }}>Total Neutron Finance</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
