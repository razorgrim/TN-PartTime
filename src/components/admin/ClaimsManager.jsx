import React, { useState } from 'react';
import { Wallet, Search, ArrowLeft, Printer, FileText, X, Download } from 'lucide-react';
import logoImg from '../../assets/logo.png';

const formatDuration = (minutes) => {
  if (!minutes) return '—';
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

export default function ClaimsManager({ users, shifts, claims, adjustClaim, showToast }) {
  const [selectedClaimStaffId, setSelectedClaimStaffId] = useState(null);
  const [claimSearchQuery, setClaimSearchQuery] = useState('');
  const [claimStatusFilter, setClaimStatusFilter] = useState('all');

  // Admin Claim Modal States
  const [showAdminFormModal, setShowAdminFormModal] = useState(false);
  const [modalClaim, setModalClaim] = useState(null);

  const handleDownloadPDF = () => {
    const element = document.getElementById('printable-admin-claim-sheet');
    if (!element) return;
    
    const opt = {
      margin:       10,
      filename:     `Claim_Form_${(selectedUser?.name || 'Staff').replace(/\s+/g, '_')}_${new Date().toISOString().substring(0, 10)}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, logging: false },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'landscape' }
    };
    
    if (window.html2pdf) {
      window.html2pdf().set(opt).from(element).save();
      showToast("PDF Claim Form downloaded successfully!", "success");
    } else {
      showToast("PDF generation library is loading. Please try again in a moment.", "error");
    }
  };



  const getWorkerClaims = (workerId, workerShifts) => {
    const workerClaims = claims.filter(c => c.workerId === workerId);
    return workerClaims.map(claim => {
      const claimShifts = workerShifts.filter(s => s.claimId === claim.id);
      claimShifts.sort((a, b) => new Date(a.clockInTime) - new Date(b.clockInTime));
      
      return {
        ...claim,
        jobTitle: claimShifts.map(s => s.jobTitle).join(' + ') || 'No Shifts',
        locationName: claimShifts.map(s => s.locationName).join('; ') || 'No Location',
        durationMinutes: claimShifts.reduce((sum, s) => sum + (s.durationMinutes || 0), 0),
        claimStatus: claim.status,
        shifts: claimShifts
      };
    });
  };

  // Master View: Staff list with claim stats
  if (!selectedClaimStaffId) {
    return (
      <div className="card animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <Wallet size={18} /> e-Claims Approval & Payout Adjustments
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          Select a staff member below to view, adjust, and approve their individual daily e-claims (flat rate RM 100/day).
        </p>
        <div className="table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Staff Member</th>
                <th>Total Claims (Days)</th>
                <th>Pending Approval</th>
                <th>Approved Claims</th>
                <th>Submitted Forms</th>
                <th>Paid Claims</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.filter(u => u.role === 'part-timer').length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    No registered staff found.
                  </td>
                </tr>
              ) : (
                users.filter(u => u.role === 'part-timer').map(pt => {
                  const staffShifts = shifts.filter(s => s.status === 'completed' && s.workerId === pt.id);
                  const dailyClaims = getWorkerClaims(pt.id, staffShifts);
                  const total = dailyClaims.length;
                  const pending = dailyClaims.filter(c => c.claimStatus === 'pending').length;
                  const approved = dailyClaims.filter(c => c.claimStatus === 'approved').length;
                  const submitted = dailyClaims.filter(c => c.claimStatus === 'submitted').length;
                  const paid = dailyClaims.filter(c => c.claimStatus === 'paid').length;

                  return (
                    <tr key={pt.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedClaimStaffId(pt.id)}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '2rem', height: '2rem', borderRadius: '50%', backgroundColor: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', fontWeight: 700, fontSize: '0.85rem' }}>
                            {pt.name ? pt.name.charAt(0).toUpperCase() : '?'}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{"Engineer " + pt.name}</div>
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
                      <td>
                        <span className="badge badge-pending" style={{ backgroundColor: '#ffedd5', color: '#c2410c', borderColor: '#fed7aa', fontSize: '0.75rem' }}>
                          {submitted} submitted
                        </span>
                      </td>
                      <td>
                        <span className="badge badge-enabled" style={{ backgroundColor: '#dbeafe', color: '#1e40af', borderColor: '#bfdbfe', fontSize: '0.75rem' }}>
                          {paid} paid
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
  const rawStaffShifts = shifts.filter(s => s.status === 'completed' && s.workerId === selectedClaimStaffId);
  const staffDailyClaims = getWorkerClaims(selectedClaimStaffId, rawStaffShifts);
  const filteredClaims = staffDailyClaims.filter(c => {
    const matchesSearch = c.jobTitle.toLowerCase().includes(claimSearchQuery.toLowerCase()) || c.locationName.toLowerCase().includes(claimSearchQuery.toLowerCase());
    const matchesStatus = claimStatusFilter === 'all' || c.claimStatus === claimStatusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="card animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <style>{`
        @media print {
          @page {
            size: landscape;
            margin: 10mm;
          }
          
          /* Reset layout, spacing, and scaling/transforms for all containers on print */
          html, body, #root, .app-container, .main-content, .card, .modal-overlay {
            display: block !important;
            position: static !important;
            width: 100% !important;
            height: auto !important;
            min-height: 0 !important;
            max-height: none !important;
            max-width: none !important;
            padding: 0 !important;
            margin: 0 !important;
            border: none !important;
            box-shadow: none !important;
            background: transparent !important;
            transform: none !important;
            animation: none !important;
            transition: none !important;
            backdrop-filter: none !important;
            filter: none !important;
          }
          
          /* Disable transforms, animations and transitions globally during print to avoid scaling bugs */
          *, *::before, *::after {
            transform: none !important;
            animation: none !important;
            transition: none !important;
          }

          body * {
            visibility: hidden;
          }

          #printable-admin-claim-sheet, #printable-admin-claim-sheet * {
            visibility: visible;
          }

          #printable-admin-claim-sheet {
            position: static !important;
            display: block !important;
            width: 100% !important;
            height: auto !important;
            background: white !important;
            color: black !important;
            padding: 0 !important;
            margin: 0 !important;
            overflow: visible !important;
          }

          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
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
              Claims for {selectedUser ? "Engineer " + selectedUser.name : 'Unknown Staff'}
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
            style={{ width: '150px', height: '32px', fontSize: '0.85rem' }}
            value={claimStatusFilter}
            onChange={(e) => setClaimStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending Approval</option>
            <option value="approved">Approved</option>
            <option value="submitted">Submitted Forms</option>
            <option value="paid">Paid Payouts</option>
          </select>
        </div>
      </div>
      <div className="table-wrapper no-print">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Date & Consolidated Site Details</th>
              <th style={{ width: '40%' }}>Clock In / Out Details per Site</th>
              <th>Daily Payout (RM)</th>
              <th style={{ textAlign: 'right' }}>Actions & Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredClaims.length === 0 ? (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  No completed claims found for this staff member matching filter.
                </td>
              </tr>
            ) : (
              filteredClaims.map(claim => (
                <tr key={claim.id}>
                  <td>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                      {parseLocalDate(claim.date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                    <div style={{ marginTop: '6px', marginBottom: '8px' }}>
                      <span className="badge" style={{ backgroundColor: '#eff6ff', color: '#1e40af', borderColor: '#bfdbfe', fontSize: '0.7rem', padding: '3px 8px', fontWeight: 700 }}>
                        {claim.shifts.length} {claim.shifts.length === 1 ? 'Site Visited' : 'Sites Visited'}
                      </span>
                    </div>
                    <div style={{ fontWeight: 600, fontSize: '0.8rem' }}>{claim.jobTitle}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>{claim.locationName}</div>
                  </td>
                  <td style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {claim.shifts.map((s, idx) => (
                        <div key={s.id} style={{ borderBottom: idx < claim.shifts.length - 1 ? '1px solid #f1f5f9' : 'none', paddingBottom: '6px' }}>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{s.jobTitle}</div>
                          <div>
                            <strong>In:</strong> {new Date(s.clockInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            {s.clockOutTime && ` | Out: ${new Date(s.clockOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                          </div>
                          <div><strong>Duration:</strong> {formatDuration(s.durationMinutes)}</div>
                        </div>
                      ))}
                      <div style={{ fontWeight: 700, color: 'var(--primary)', marginTop: '4px', borderTop: claim.shifts.length > 1 ? '1px dashed var(--border-color)' : 'none', paddingTop: claim.shifts.length > 1 ? '4px' : '0' }}>
                        Total Duration: {formatDuration(claim.durationMinutes)}
                      </div>
                    </div>
                  </td>
                  <td>
                    {['pending', 'approved'].includes(claim.claimStatus) ? (
                      <input 
                        type="number" 
                        className="form-input" 
                        style={{ padding: '4px 8px', fontSize: '0.85rem', width: '90px', height: '28px', fontWeight: 'bold' }}
                        defaultValue={claim.payout}
                        id={`payout-${claim.id}`}
                      />
                    ) : (
                      <span style={{ fontWeight: 'bold', fontSize: '0.85rem', paddingLeft: '8px' }}>RM {Number(claim.payout).toFixed(2)}</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                      {/* View Form Button */}
                      {['submitted', 'paid'].includes(claim.claimStatus) && (
                        <button
                          className="btn btn-secondary btn-sm"
                          style={{ height: '28px', padding: '0 8px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          onClick={() => {
                            setModalClaim(claim);
                            setShowAdminFormModal(true);
                          }}
                        >
                          <FileText size={13} /> View Form
                        </button>
                      )}

                      {/* Main Action Button */}
                      {claim.claimStatus === 'submitted' ? (
                        <button 
                          className="btn btn-primary btn-sm"
                          style={{ height: '28px', padding: '0 12px', fontSize: '0.75rem', backgroundColor: '#10b981', borderColor: '#059669' }}
                          onClick={async () => {
                            await adjustClaim(claim.id, claim.payRate, claim.payout, 'paid');
                            showToast("Daily claim payout processed and marked as Paid successfully", "success");
                          }}
                        >
                          Mark as Paid
                        </button>
                      ) : claim.claimStatus === 'approved' ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end' }}>
                          <button 
                            className="btn btn-primary btn-sm"
                            style={{ height: '28px', padding: '0 12px', fontSize: '0.75rem' }}
                            onClick={async () => {
                              const payoutVal = parseFloat(document.getElementById(`payout-${claim.id}`).value);
                              if (!isNaN(payoutVal)) {
                                await adjustClaim(claim.id, claim.payRate, payoutVal, 'approved');
                                showToast("Daily claim payout updated and approved successfully", "success");
                              } else {
                                showToast("Please enter a valid payout number", "error");
                              }
                            }}
                          >
                            Update
                          </button>
                          <span style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', fontStyle: 'italic', fontWeight: 600 }}>Awaiting submission</span>
                        </div>
                      ) : claim.claimStatus === 'paid' ? (
                        <span className="badge badge-enabled" style={{ backgroundColor: '#dbeafe', color: '#1e40af', borderColor: '#bfdbfe' }}>Paid</span>
                      ) : (
                        <button 
                          className="btn btn-primary btn-sm"
                          style={{ height: '28px', padding: '0 12px', fontSize: '0.75rem' }}
                          onClick={async () => {
                            const payoutVal = parseFloat(document.getElementById(`payout-${claim.id}`).value);
                            if (!isNaN(payoutVal)) {
                              await adjustClaim(claim.id, claim.payRate, payoutVal, 'approved');
                              showToast("Daily claim payout approved successfully", "success");
                            } else {
                              showToast("Please enter a valid payout number", "error");
                            }
                          }}
                        >
                          Approve
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Admin Claim Form Modal View */}
      {showAdminFormModal && modalClaim && (
        <div 
          className="modal-overlay"
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
              className="no-print"
              style={{ 
                padding: '0.75rem 1.25rem', 
                borderBottom: '1px solid var(--border-color)', 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                flexShrink: 0
              }}
            >
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Claim Form Viewer</h3>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button
                  onClick={handleDownloadPDF}
                  className="btn btn-secondary"
                  style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px', height: '30px', backgroundColor: '#e0f2fe', color: '#0369a1', borderColor: '#bae6fd' }}
                >
                  <FileText size={13} /> Download PDF
                </button>
                <button
                  onClick={() => window.print()}
                  className="btn btn-secondary"
                  style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px', height: '30px' }}
                >
                  <Printer size={13} /> Print / Save PDF
                </button>
                {modalClaim.claimStatus === 'submitted' && (
                  <button
                    onClick={async () => {
                      await adjustClaim(modalClaim.id, modalClaim.payRate, modalClaim.payout, 'paid');
                      showToast("Daily claim payout processed and marked as Paid successfully", "success");
                      setShowAdminFormModal(false);
                    }}
                    className="btn btn-primary"
                    style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', backgroundColor: '#10b981', borderColor: '#059669', height: '30px' }}
                  >
                    Mark as Paid
                  </button>
                )}
                <button
                  onClick={() => {
                    setShowAdminFormModal(false);
                    setModalClaim(null);
                  }}
                  style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Printable Claim Sheet Area */}
            <div 
              id="printable-admin-claim-sheet"
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
                {((selectedUser?.salutation || 'En').replace(/\.$/, '') + ' ' + (selectedUser?.name || '') + ' CLAIM').toUpperCase()}
              </div>

              {/* Employee Information Table */}
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1.5rem', fontSize: '0.75rem' }}>
                <tbody>
                  <tr>
                    <td style={{ width: '15%', border: '1px solid black', padding: '6px', fontWeight: 700, backgroundColor: '#f8fafc' }}>Employee Name:</td>
                    <td style={{ width: '35%', border: '1px solid black', padding: '6px' }}>{selectedUser?.name}</td>
                    <td style={{ width: '15%', border: '1px solid black', padding: '6px', fontWeight: 700, backgroundColor: '#f8fafc' }}>Contact Numbers:</td>
                    <td style={{ width: '35%', border: '1px solid black', padding: '6px' }}>{selectedUser?.phone}</td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid black', padding: '6px', fontWeight: 700, backgroundColor: '#f8fafc' }}>IC:</td>
                    <td style={{ border: '1px solid black', padding: '6px' }}>{selectedUser?.icNumber}</td>
                    <td style={{ border: '1px solid black', padding: '6px', fontWeight: 700, backgroundColor: '#f8fafc' }}>Account Number:</td>
                    <td style={{ border: '1px solid black', padding: '6px' }}>
                      {selectedUser?.bankAccount 
                        ? `${selectedUser.bankAccount}${selectedUser.bankName ? ` (${selectedUser.bankName})` : ''}` 
                        : '—'}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid black', padding: '6px', fontWeight: 700, backgroundColor: '#f8fafc' }}>Date:</td>
                    <td style={{ border: '1px solid black', padding: '6px' }}>{new Date().toLocaleDateString(undefined, { dateStyle: 'medium' })}</td>
                    <td style={{ border: '1px solid black', padding: '6px', fontWeight: 700, backgroundColor: '#f8fafc' }}>Account Holder's Name:</td>
                    <td style={{ border: '1px solid black', padding: '6px' }}>{selectedUser?.bankHolder || '—'}</td>
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
                    <th style={{ border: '1px solid black', padding: '8px', textAlign: 'center', width: '10%' }}>Total Hours</th>
                    <th style={{ border: '1px solid black', padding: '8px', textAlign: 'center', width: '10%' }}>Overtime</th>
                    <th style={{ border: '1px solid black', padding: '8px', textAlign: 'right', width: '12%' }}>Price (RM)</th>
                  </tr>
                </thead>
                <tbody>
                  {modalClaim.shifts.map((shift, idx) => {
                    const clockInTimeFormatted = new Date(shift.clockInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    const clockOutTimeFormatted = shift.clockOutTime
                      ? new Date(shift.clockOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : '—';
                    
                    return (
                      <tr key={shift.id}>
                        <td style={{ border: '1px solid black', padding: '6px', textAlign: 'center' }}>
                          {idx === 0 ? parseLocalDate(modalClaim.date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : ''}
                        </td>
                        <td style={{ border: '1px solid black', padding: '6px', textAlign: 'center' }}>{clockInTimeFormatted}</td>
                        <td style={{ border: '1px solid black', padding: '6px', textAlign: 'center' }}>{clockOutTimeFormatted}</td>
                        <td style={{ border: '1px solid black', padding: '6px' }}>
                          <div style={{ fontWeight: 600 }}>{shift.jobTitle}</div>
                          <div style={{ fontSize: '0.65rem', color: '#475569' }}>{shift.locationName}</div>
                        </td>
                        <td style={{ border: '1px solid black', padding: '6px', textAlign: 'center' }}>
                          {shift.durationMinutes ? (shift.durationMinutes / 60).toFixed(2) : '—'}
                        </td>
                        <td style={{ border: '1px solid black', padding: '6px', textAlign: 'center' }}>—</td>
                        <td style={{ border: '1px solid black', padding: '6px', textAlign: 'right', fontWeight: 600 }}>
                          RM {idx === 0 ? Number(modalClaim.payout).toFixed(2) : '0.00'}
                        </td>
                      </tr>
                    );
                  })}
                  {/* Total Row */}
                  <tr style={{ backgroundColor: '#f8fafc', fontWeight: 800 }}>
                    <td colSpan="6" style={{ border: '1px solid black', padding: '8px', textAlign: 'right', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                      Total Amount Approved:
                    </td>
                    <td style={{ border: '1px solid black', padding: '8px', textAlign: 'right', fontSize: '0.78rem', color: 'var(--primary)' }}>
                      RM {Number(modalClaim.payout).toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>
              </div>

              {/* Signature Blocks */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '3.5rem', fontSize: '0.72rem' }}>
                <div style={{ borderTop: '1px solid black', width: '200px', textAlign: 'center', paddingTop: '5px' }}>
                  <strong>Submitted By:</strong>
                  <div style={{ marginTop: '2px', color: '#475569' }}>{selectedUser?.name}</div>
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
