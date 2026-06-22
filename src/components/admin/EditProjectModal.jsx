import React, { useState, useEffect } from 'react';
import { X, Search } from 'lucide-react';

const formatTime12Hour = (time24) => {
  if (!time24) return '';
  const [hourStr, minuteStr] = time24.split(':');
  let hour = parseInt(hourStr, 10);
  const minute = minuteStr;
  const ampm = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12;
  hour = hour ? hour : 12;
  const formattedHour = hour < 10 ? `0${hour}` : hour;
  return `${formattedHour}:${minute} ${ampm}`;
};

const parseTimeRange = (timeRangeStr) => {
  if (!timeRangeStr || !timeRangeStr.includes(' - ')) {
    return { startTime: '', endTime: '' };
  }
  const [startStr, endStr] = timeRangeStr.split(' - ');
  
  const parse12HourTo24Hour = (time12h) => {
    if (!time12h) return '';
    const parts = time12h.trim().split(' ');
    if (parts.length < 2) return '';
    const [time, ampm] = parts;
    const [hourStr, minuteStr] = time.split(':');
    let hour = parseInt(hourStr, 10);
    const minute = minuteStr;
    
    if (ampm.toUpperCase() === 'PM' && hour < 12) {
      hour += 12;
    } else if (ampm.toUpperCase() === 'AM' && hour === 12) {
      hour = 0;
    }
    
    const formattedHour = hour < 10 ? `0${hour}` : hour;
    return `${formattedHour}:${minute}`;
  };

  return {
    startTime: parse12HourTo24Hour(startStr),
    endTime: parse12HourTo24Hour(endStr)
  };
};

export default function EditProjectModal({ job, onClose, onSave, showToast }) {
  const parsed = parseTimeRange(job.time);

  const [editJobTitle, setEditJobTitle] = useState(job.title || '');
  const [editJobDescription, setEditJobDescription] = useState(job.description || '');
  const [editJobLocation, setEditJobLocation] = useState(job.locationName || '');
  const [editJobPayRate, setEditJobPayRate] = useState(job.payRate || '');
  const [editJobDate, setEditJobDate] = useState(job.date || '');
  const [editJobStartTime, setEditJobStartTime] = useState(parsed.startTime || '');
  const [editJobEndTime, setEditJobEndTime] = useState(parsed.endTime || '');

  const [editPinnedLat, setEditPinnedLat] = useState(job.latitude !== null ? parseFloat(job.latitude) : 3.1390);
  const [editPinnedLng, setEditPinnedLng] = useState(job.longitude !== null ? parseFloat(job.longitude) : 101.6869);
  const [coordsText, setCoordsText] = useState(
    job.latitude !== null && job.longitude !== null
      ? `${parseFloat(job.latitude).toFixed(5)}, ${parseFloat(job.longitude).toFixed(5)}`
      : '3.13900, 101.68690'
  );

  useEffect(() => {
    if (editPinnedLat !== null && editPinnedLng !== null) {
      setCoordsText(`${editPinnedLat.toFixed(5)}, ${editPinnedLng.toFixed(5)}`);
    }
  }, [editPinnedLat, editPinnedLng]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const mapContainer = document.getElementById('edit-project-map');
      if (!mapContainer || !window.L) return;

      const mapInstance = window.L.map('edit-project-map').setView([editPinnedLat, editPinnedLng], 14);

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

      const markerInstance = window.L.marker([editPinnedLat, editPinnedLng], {
        draggable: true
      }).addTo(mapInstance);

      mapInstance.on('click', (e) => {
        const { lat, lng } = e.latlng;
        markerInstance.setLatLng([lat, lng]);
        setEditPinnedLat(lat);
        setEditPinnedLng(lng);
      });

      markerInstance.on('dragend', () => {
        const position = markerInstance.getLatLng();
        setEditPinnedLat(position.lat);
        setEditPinnedLng(position.lng);
      });

      window._editMap = mapInstance;
      window._editMarker = markerInstance;
    }, 100);

    return () => {
      clearTimeout(timer);
      if (window._editMap) {
        window._editMap.remove();
        window._editMap = null;
        window._editMarker = null;
      }
    };
  }, []);

  const handleLocateCoords = () => {
    if (!coordsText.trim()) {
      showToast('Please enter coordinates first.', 'error');
      return;
    }
    const parts = coordsText.split(',');
    if (parts.length === 2) {
      const lat = parseFloat(parts[0].trim());
      const lng = parseFloat(parts[1].trim());
      if (!isNaN(lat) && !isNaN(lng)) {
        setEditPinnedLat(lat);
        setEditPinnedLng(lng);
        if (window._editMarker && window._editMap) {
          window._editMarker.setLatLng([lat, lng]);
          window._editMap.setView([lat, lng], 14);
        }
        showToast('Coordinates located successfully!', 'success');
      } else {
        showToast('Invalid latitude or longitude value.', 'error');
      }
    } else {
      showToast('Please enter coordinates in "latitude, longitude" format.', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!editJobTitle.trim()) {
      showToast('Title is required.', 'error');
      return;
    }
    if (!editJobLocation.trim()) {
      showToast('Location is required.', 'error');
      return;
    }
    if (isNaN(editJobPayRate) || parseFloat(editJobPayRate) <= 0) {
      showToast('Please enter a valid pay rate.', 'error');
      return;
    }
    if (!editJobDate) {
      showToast('Date is required.', 'error');
      return;
    }
    if (!editJobStartTime || !editJobEndTime) {
      showToast('Please select both Start Time and End Time.', 'error');
      return;
    }
    if (editPinnedLat === null || editPinnedLng === null) {
      showToast('Please pin the location on the map.', 'error');
      return;
    }

    const formattedTime = `${formatTime12Hour(editJobStartTime)} - ${formatTime12Hour(editJobEndTime)}`;
    const res = await onSave(job.id, editJobTitle, editJobDescription, editJobLocation, editJobPayRate, editJobDate, formattedTime, editPinnedLat, editPinnedLng);

    if (res.success) {
      showToast(res.message, 'success');
      onClose();
    } else {
      showToast(res.message, 'error');
    }
  };

  return (
    <div className="modal-overlay" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 999,
      padding: '1rem'
    }}>
      <div className="card animate-scale" style={{
        width: '100%',
        maxWidth: '520px',
        margin: '0 auto',
        position: 'relative',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        border: '1px solid var(--border-color)',
        padding: '1.75rem',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Edit Project Details</h3>
          <button 
            type="button" 
            onClick={onClose} 
            style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px', borderRadius: '50%' }}
            className="hover-bg"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Task/Job Title</label>
              <input 
                type="text" 
                className="form-input" 
                value={editJobTitle}
                onChange={(e) => setEditJobTitle(e.target.value)}
                placeholder="e.g. Server Room Maintenance"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Job Description</label>
              <textarea 
                className="form-input" 
                placeholder="e.g. Detail the tasks, schedules, and specific roles required for this project."
                value={editJobDescription}
                onChange={(e) => setEditJobDescription(e.target.value)}
                rows={3}
                style={{ resize: 'vertical' }}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Latitude and Longitude</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input 
                  type="text" 
                  className="form-input" 
                  style={{ flex: 1 }}
                  placeholder="e.g. 3.1390, 101.6869"
                  value={coordsText}
                  onChange={(e) => setCoordsText(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleLocateCoords}
                  style={{ height: '38px', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <Search size={14} /> Locate
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Reposition Map Pin</label>
              <div 
                id="edit-project-map"
                style={{ 
                  height: '180px', 
                  borderRadius: 'var(--radius-md)', 
                  border: '1px solid var(--border-color)', 
                  position: 'relative',
                  overflow: 'hidden',
                  zIndex: 1
                }}
              ></div>
            </div>

            <div className="form-group">
              <label className="form-label">Location / Site Address</label>
              <input 
                type="text" 
                className="form-input" 
                value={editJobLocation}
                onChange={(e) => setEditJobLocation(e.target.value)}
                placeholder="e.g. KLCC Tower 2, Level 15"
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Rate (RM)</label>
                <input 
                  type="number" 
                  className="form-input" 
                  value={editJobPayRate}
                  onChange={(e) => setEditJobPayRate(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Scheduled Date</label>
                <input 
                  type="date" 
                  className="form-input" 
                  value={editJobDate}
                  onChange={(e) => setEditJobDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Start Time</label>
                <input 
                  type="time" 
                  className="form-input" 
                  value={editJobStartTime}
                  onChange={(e) => setEditJobStartTime(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">End Time</label>
                <input 
                  type="time" 
                  className="form-input" 
                  value={editJobEndTime}
                  onChange={(e) => setEditJobEndTime(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary btn-sm">Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  );
}
