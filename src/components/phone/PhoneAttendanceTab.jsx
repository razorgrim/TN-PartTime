import React, { useState, useEffect, useContext } from 'react';
import { ChevronLeft, Calendar, ShieldAlert, CheckCircle2, MapPin, Fingerprint, Clock } from 'lucide-react';
import { AppContext } from '../../context/AppContext';

const deg2rad = (deg) => deg * (Math.PI / 180);
const getDistanceKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const formatTime = (timeStr) => {
  if (!timeStr) return '--:--';
  return new Date(timeStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const formatDuration = (minutes) => {
  if (!minutes) return '0m';
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hrs > 0) {
    return `${hrs}h ${mins}m`;
  }
  return `${mins}m`;
};

const parseLocalDate = (dateStr) => {
  if (!dateStr) return new Date();
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const isSameDate = (isoString, dateStr) => {
  if (!isoString) return false;
  const dateObj = new Date(isoString);
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
  const d = String(dateObj.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}` === dateStr;
};

export default function PhoneAttendanceTab({
  partTimerSession,
  jobs,
  shifts,
  clockInJob,
  clockOutJob,
  setActiveTab,
  simulatedTime,
  gpsLoading,
  gpsError,
  userCoords,
  setUserCoords,
  setGpsError,
  getBrowserLocation,
  showToast
}) {
  const { simulatedDate, setSimulatedDate } = useContext(AppContext);
  const [selectedJobId, setSelectedJobId] = useState('');

  // Redesigned attendance selection synchronization (default to active clocked-in job if any)
  useEffect(() => {
    if (!selectedJobId && jobs && jobs.length > 0) {
      const activeShift = shifts.find(s => s.workerId === partTimerSession?.id && s.status === 'active');
      if (activeShift && jobs.some(j => j.id === activeShift.jobId)) {
        setSelectedJobId(activeShift.jobId);
      } else {
        setSelectedJobId(jobs[0].id);
      }
    }
  }, [jobs, shifts, partTimerSession, selectedJobId]);

  const selectedJob = jobs.find(job => job.id === selectedJobId) || jobs[0];



  const realDist = userCoords && selectedJob?.latitude && selectedJob?.longitude
    ? getDistanceKm(
      userCoords.latitude,
      userCoords.longitude,
      parseFloat(selectedJob.latitude),
      parseFloat(selectedJob.longitude)
    )
    : null;
  const distanceMeters = realDist !== null ? Math.round(realDist * 1000) : null;

  // User-specific shifts for the currently selected job
  const userJobActiveShift = selectedJob
    ? shifts.find(s => s.workerId === partTimerSession?.id && s.jobId === selectedJob.id && s.status === 'active')
    : null;

  const targetDateStr = simulatedDate || new Date().toISOString().split('T')[0];

  const userJobCompletedShift = selectedJob
    ? shifts.find(s => 
        s.workerId === partTimerSession?.id && 
        s.jobId === selectedJob.id && 
        s.status === 'completed' &&
        isSameDate(s.clockInTime, targetDateStr)
      )
    : null;

  // Check if user has an active shift on ANY job
  const anyActiveShift = shifts.find(s => s.workerId === partTimerSession?.id && s.status === 'active');

  // Leaflet map setup
  useEffect(() => {
    if (!selectedJob || !selectedJob.latitude || !selectedJob.longitude) return;

    const jobLat = parseFloat(selectedJob.latitude);
    const jobLng = parseFloat(selectedJob.longitude);

    const timer = setTimeout(() => {
      const mapContainer = document.getElementById('staff-map');
      if (!mapContainer || !window.L) return;

      const mapInstance = window.L.map('staff-map').setView([jobLat, jobLng], 14);

      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap'
      }).addTo(mapInstance);

      const DefaultIcon = window.L.icon({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
      });
      window.L.Marker.prototype.options.icon = DefaultIcon;

      const jobMarker = window.L.marker([jobLat, jobLng]).addTo(mapInstance);
      jobMarker.bindPopup(`<b>${selectedJob.title}</b><br/>${selectedJob.locationName}`).openPopup();

      if (userCoords && userCoords.latitude && userCoords.longitude) {
        const userLat = parseFloat(userCoords.latitude);
        const userLng = parseFloat(userCoords.longitude);

        const userMarkerIcon = window.L.divIcon({
          className: 'custom-user-marker',
          html: `<div style="background-color: #3b82f6; width: 14px; height: 14px; border: 2px solid white; border-radius: 50%; box-shadow: 0 0 8px rgba(59, 130, 246, 0.8);"></div>`,
          iconSize: [14, 14],
          iconAnchor: [7, 7]
        });
        const userMarker = window.L.marker([userLat, userLng], { icon: userMarkerIcon }).addTo(mapInstance);
        userMarker.bindPopup('<b>Your Current Location</b>');

        window.L.polyline([[userLat, userLng], [jobLat, jobLng]], {
          color: '#3b82f6',
          weight: 3,
          opacity: 0.7,
          dashArray: '5, 10'
        }).addTo(mapInstance);

        const group = new window.L.featureGroup([jobMarker, userMarker]);
        mapInstance.fitBounds(group.getBounds().pad(0.2));
      }

      window._staffMap = mapInstance;
    }, 100);

    return () => {
      clearTimeout(timer);
      if (window._staffMap) {
        window._staffMap.remove();
        window._staffMap = null;
      }
    };
  }, [selectedJobId, userCoords]);

  // Clock In trigger
  const handleClockIn = async (jobId) => {
    if (gpsError) {
      showToast(gpsError, 'error');
      return;
    }
    if (!userCoords) {
      showToast('Waiting for GPS coordinates. Please enable location or mock location.', 'error');
      return;
    }
    if (!selectedJob?.latitude || !selectedJob?.longitude) {
      showToast('Project location coordinates not configured.', 'error');
      return;
    }

    const realDist = getDistanceKm(
      userCoords.latitude,
      userCoords.longitude,
      parseFloat(selectedJob.latitude),
      parseFloat(selectedJob.longitude)
    );
    const distanceMeters = Math.round(realDist * 1000);

    if (distanceMeters > 120) {
      showToast(`Clock-in denied. You are ${distanceMeters}m away from the project site. You must be within 120m.`, 'error');
      return;
    }

    await clockInJob(jobId, distanceMeters, partTimerSession.id, partTimerSession.name);
    showToast('Clocked in successfully!', 'success');
  };

  // Clock Out trigger
  const handleClockOut = async (jobId) => {
    if (gpsError) {
      showToast(gpsError, 'error');
      return;
    }
    if (!userCoords) {
      showToast('Waiting for GPS coordinates. Please enable location or mock location.', 'error');
      return;
    }
    if (!selectedJob?.latitude || !selectedJob?.longitude) {
      showToast('Project location coordinates not configured.', 'error');
      return;
    }

    const realDist = getDistanceKm(
      userCoords.latitude,
      userCoords.longitude,
      parseFloat(selectedJob.latitude),
      parseFloat(selectedJob.longitude)
    );
    const distanceMeters = Math.round(realDist * 1000);

    if (distanceMeters > 120) {
      showToast(`Clock-out denied. You are ${distanceMeters}m away from the project site. You must be within 120m.`, 'error');
      return;
    }

    await clockOutJob(jobId, partTimerSession.id, distanceMeters, null);
    showToast('Clocked out successfully!', 'success');
  };

  return (
    <div className="phone-tab-screen" style={{ padding: 0 }}>
      {/* Visual Mockup Header */}
      <div className="attendance-header">
        <button className="attendance-back-btn" onClick={() => setActiveTab('home')} aria-label="Back">
          <ChevronLeft size={20} />
        </button>
        <span className="attendance-header-title">Attendance</span>
      </div>

      {/* Scrollable body content */}
      <div style={{ padding: '1.25rem', paddingBottom: '90px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Live Clock & Uppercase Date */}
        <div className="attendance-clock">{simulatedTime}</div>
        <div className="attendance-date">
          <Calendar size={14} />
          <span>{simulatedDate 
            ? parseLocalDate(simulatedDate).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
            : new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
        </div>

        {/* Map Card */}
        {selectedJob ? (
          <div
            className="attendance-map-card"
            style={{ position: 'relative', overflow: 'hidden', padding: 0 }}
          >
            <div
              id="staff-map"
              style={{ width: '100%', height: '100%', zIndex: 1 }}
            ></div>

            <div style={{ position: 'absolute', top: '8px', left: '8px', right: '8px', zIndex: 10 }}>
              {gpsLoading ? (
                <div className="attendance-gps-banner" style={{ backgroundColor: '#eff6ff', color: '#1e40af', borderColor: '#bfdbfe', margin: 0 }}>
                  <span className="spinner" style={{ display: 'inline-block', width: '12px', height: '12px', border: '2px solid #1e40af', borderTopColor: 'transparent', borderRadius: '50%', animation: 'pulse-ring 1s infinite linear', marginRight: '4px' }}></span>
                  <span>Verifying location...</span>
                </div>
              ) : (
                <div
                  className={`attendance-gps-banner ${gpsError ? 'attendance-gps-banner-warn' : 'attendance-gps-banner-ok'}`}
                  style={{ margin: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px', width: '100%' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: 1, minWidth: '120px' }}>
                    {gpsError ? <ShieldAlert size={12} style={{ flexShrink: 0 }} /> : <CheckCircle2 size={12} style={{ flexShrink: 0 }} />}
                    <span style={{ fontSize: '0.72rem', lineHeight: '1.2' }}>
                      {gpsError ? gpsError : `GPS: ${userCoords ? `${userCoords.latitude.toFixed(4)}, ${userCoords.longitude.toFixed(4)}` : 'No signal'}`}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                    {!userCoords && (
                      <button
                        type="button"
                        onClick={() => getBrowserLocation()}
                        style={{
                          border: 'none',
                          background: 'var(--primary)',
                          color: 'white',
                          fontSize: '0.6rem',
                          padding: '2px 6px',
                          borderRadius: '3px',
                          cursor: 'pointer',
                          fontWeight: 'bold'
                        }}
                      >
                        Retry
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedJob) {
                          setUserCoords({
                            latitude: parseFloat(selectedJob.latitude) + (Math.random() - 0.5) * 0.0002,
                            longitude: parseFloat(selectedJob.longitude) + (Math.random() - 0.5) * 0.0002
                          });
                          setGpsError(null);
                          showToast('Simulating GPS coordinates within site radius', 'info');
                        } else {
                          showToast('No project selected to simulate coordinates', 'error');
                        }
                      }}
                      style={{
                        border: 'none',
                        background: 'var(--primary)',
                        color: 'white',
                        fontSize: '0.6rem',
                        padding: '2px 6px',
                        borderRadius: '3px',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                      }}
                    >
                      Mock Near
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedJob) {
                          setUserCoords({
                            latitude: parseFloat(selectedJob.latitude) + 0.01,
                            longitude: parseFloat(selectedJob.longitude) + 0.01
                          });
                          setGpsError(null);
                          showToast('Simulating GPS coordinates outside site radius (approx. 1.5km)', 'warning');
                        } else {
                          showToast('No project selected to simulate coordinates', 'error');
                        }
                      }}
                      style={{
                        border: 'none',
                        background: '#64748b',
                        color: 'white',
                        fontSize: '0.6rem',
                        padding: '2px 6px',
                        borderRadius: '3px',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                      }}
                    >
                      Mock Far
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="attendance-map-card" style={{ backgroundColor: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
            No Job Allocated
          </div>
        )}

        {/* Date Simulation Controls */}
        <div 
          className="attendance-task-card animate-scale" 
          style={{ 
            borderLeft: '3px solid #f59e0b', 
            backgroundColor: '#fffbeb',
            padding: '0.75rem',
            marginTop: '0.75rem',
            marginBottom: '0.25rem',
            borderRadius: '8px'
          }}
        >
          <span style={{ 
            color: '#b45309', 
            fontSize: '0.65rem', 
            fontWeight: 800, 
            display: 'flex', 
            alignItems: 'center', 
            gap: '6px',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            <Calendar size={13} style={{ color: '#b45309' }} /> Simulation Date Override
          </span>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', alignItems: 'center' }}>
            <input
              type="date"
              value={simulatedDate}
              onChange={(e) => setSimulatedDate(e.target.value)}
              style={{
                margin: 0,
                padding: '0.35rem 0.5rem',
                fontSize: '0.75rem',
                border: '1px solid #fde68a',
                borderRadius: '6px',
                flex: 1,
                backgroundColor: 'white',
                outline: 'none',
                color: '#1e293b'
              }}
            />
            {simulatedDate && (
              <button
                type="button"
                onClick={() => setSimulatedDate('')}
                style={{
                  padding: '0.35rem 0.65rem',
                  fontSize: '0.7rem',
                  backgroundColor: '#f3f4f6',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  color: '#374151',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                Clear
              </button>
            )}
          </div>
          <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => {
                const d = new Date();
                const yst = new Date(d.setDate(d.getDate() - 1));
                setSimulatedDate(yst.toISOString().split('T')[0]);
              }}
              style={{
                border: '1px solid #fde68a',
                background: '#fef3c7',
                color: '#b45309',
                fontSize: '0.625rem',
                padding: '2px 6px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              Yesterday
            </button>
            <button
              type="button"
              onClick={() => {
                setSimulatedDate(new Date().toISOString().split('T')[0]);
              }}
              style={{
                border: '1px solid #fde68a',
                background: '#fef3c7',
                color: '#b45309',
                fontSize: '0.625rem',
                padding: '2px 6px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => {
                const d = new Date();
                const tmr = new Date(d.setDate(d.getDate() + 1));
                setSimulatedDate(tmr.toISOString().split('T')[0]);
              }}
              style={{
                border: '1px solid #fde68a',
                background: '#fef3c7',
                color: '#b45309',
                fontSize: '0.625rem',
                padding: '2px 6px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              Tomorrow
            </button>
          </div>
          <p style={{ fontSize: '0.625rem', color: '#b45309', marginTop: '0.4rem', lineHeight: '1.3' }}>
            {simulatedDate
              ? `Active: Clock in/out will record on ${parseLocalDate(simulatedDate).toLocaleDateString(undefined, { dateStyle: 'medium' })}.`
              : 'Using real system date & time for clocking in/out.'
            }
          </p>
        </div>

        {/* 4 Summary Columns Row */}
        <div className="attendance-summary-row">
          <div className="attendance-summary-col">
            <span className="col-title col-title-in">Clock In</span>
            <span className="col-value">
              {userJobActiveShift
                ? formatTime(userJobActiveShift.clockInTime)
                : (userJobCompletedShift ? formatTime(userJobCompletedShift.clockInTime) : '--:--')}
            </span>
          </div>
          <div className="attendance-summary-col">
            <span className="col-title col-title-rest">Rest</span>
            <span className="col-value">--</span>
          </div>
          <div className="attendance-summary-col">
            <span className="col-title col-title-out">Out</span>
            <span className="col-value">{userJobCompletedShift ? formatTime(userJobCompletedShift.clockOutTime) : '--:--'}</span>
          </div>
          <div className="attendance-summary-col">
            <span className="col-title col-title-total">Total</span>
            <span className="col-value">
              {userJobCompletedShift
                ? formatDuration(userJobCompletedShift.durationMinutes)
                : '--'}
            </span>
          </div>
        </div>

        {/* Project selector */}
        <div className="attendance-task-card">
          <span className="attendance-task-title">PROJECT / SITE TASK</span>
          {jobs.length > 0 ? (
            <>
              <select
                className="attendance-task-select"
                value={selectedJobId}
                onChange={(e) => setSelectedJobId(e.target.value)}
              >
                {jobs.map(job => (
                  <option key={job.id} value={job.id}>{job.title}</option>
                ))}
              </select>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                {/* Location */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MapPin size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                  <span style={{ fontWeight: 500 }}>{selectedJob?.locationName}</span>
                </div>

                {/* Date and Time */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Calendar size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                    <span>{selectedJob?.date}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Clock size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedJob?.time}</span>
                  </div>
                </div>

                {/* Status Badges */}
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.15rem' }}>
                  {/* <span style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary)', padding: '3px 8px', borderRadius: '6px', fontSize: '0.65rem', fontWeight: 700 }}>
                    RM {Number(selectedJob?.payRate || 0).toFixed(2)} / Job
                  </span> */}

                  {distanceMeters !== null ? (
                    <span style={{
                      backgroundColor: distanceMeters <= 120 ? '#d1fae5' : '#fee2e2',
                      color: distanceMeters <= 120 ? '#065f46' : '#991b1b',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      border: `1px solid ${distanceMeters <= 120 ? '#a7f3d0' : '#fca5a5'}`
                    }}>
                      GPS: {distanceMeters}m {distanceMeters <= 120 ? '(In Range)' : '(Out of Range)'}
                    </span>
                  ) : (
                    <span style={{ backgroundColor: '#f1f5f9', color: '#475569', padding: '3px 8px', borderRadius: '6px', fontSize: '0.65rem', fontWeight: 700 }}>
                      No GPS Signal
                    </span>
                  )}
                </div>
              </div>

              {selectedJob?.description && (
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.5rem', padding: '6px 8px', backgroundColor: '#f8fafc', borderRadius: '8px', borderLeft: '3px solid var(--primary)', lineHeight: '1.4' }}>
                  <strong style={{ color: 'var(--text-primary)', display: 'block', fontSize: '0.7rem', marginBottom: '2px', fontWeight: 700 }}>Task Description:</strong>
                  {selectedJob.description}
                </div>
              )}
            </>
          ) : (
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '0.5rem 0' }}>
              No active project tasks available.
            </div>
          )}
        </div>

        {/* Large Fingerprint Button */}
        {selectedJob ? (
          <div style={{ marginBottom: '1.5rem' }}>
            {(!userJobActiveShift && !userJobCompletedShift) && (
              anyActiveShift ? (
                <button
                  className="attendance-large-btn attendance-large-btn-in animate-scale"
                  disabled
                  style={{ opacity: 0.6, cursor: 'not-allowed', backgroundColor: '#64748b' }}
                >
                  <Fingerprint size={28} style={{ color: '#cbd5e1' }} />
                  <span style={{ fontSize: '0.7rem' }}>ACTIVE AT OTHER SITE</span>
                </button>
              ) : (
                <button
                  className="attendance-large-btn attendance-large-btn-in animate-scale"
                  onClick={() => handleClockIn(selectedJob.id)}
                >
                  <Fingerprint size={28} />
                  <span>CLOCK IN</span>
                </button>
              )
            )}
            {userJobActiveShift && (
              <button
                className="attendance-large-btn attendance-large-btn-out animate-scale"
                onClick={() => handleClockOut(selectedJob.id)}
              >
                <Fingerprint size={28} />
                <span>CLOCK OUT</span>
              </button>
            )}
            {(userJobCompletedShift && !userJobActiveShift) && (
              <button
                className="attendance-large-btn attendance-large-btn-done animate-scale"
                disabled
              >
                <CheckCircle2 size={28} />
                <span>COMPLETED</span>
              </button>
            )}
          </div>
        ) : null}

        {/* Real GPS Refresh Button */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem', marginBottom: '2rem' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={getBrowserLocation}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <MapPin size={12} />
            <span>Refresh GPS Location</span>
          </button>
        </div>
      </div>
    </div>
  );
}
