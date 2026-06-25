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

export default function CreateProjectModal({ onClose, addJob, showToast }) {
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskLocation, setNewTaskLocation] = useState('');
  const [newTaskPayRate, setNewTaskPayRate] = useState('0.00');
  const [newTaskDate, setNewTaskDate] = useState('');
  const [newTaskStartTime, setNewTaskStartTime] = useState('');
  const [newTaskEndTime, setNewTaskEndTime] = useState('');
  
  const [pinnedLat, setPinnedLat] = useState(3.1390); // default KL
  const [pinnedLng, setPinnedLng] = useState(101.6869);
  const [coordsText, setCoordsText] = useState('3.13900, 101.68690');

  useEffect(() => {
    if (pinnedLat !== null && pinnedLng !== null) {
      setCoordsText(`${pinnedLat.toFixed(5)}, ${pinnedLng.toFixed(5)}`);
    }
  }, [pinnedLat, pinnedLng]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const mapContainer = document.getElementById('admin-map');
      if (!mapContainer || !window.L) return;

      const mapInstance = window.L.map('admin-map').setView([pinnedLat, pinnedLng], 14);

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

      const markerInstance = window.L.marker([pinnedLat, pinnedLng], {
        draggable: true
      }).addTo(mapInstance);

      mapInstance.on('click', (e) => {
        const { lat, lng } = e.latlng;
        markerInstance.setLatLng([lat, lng]);
        setPinnedLat(lat);
        setPinnedLng(lng);
      });

      markerInstance.on('dragend', () => {
        const position = markerInstance.getLatLng();
        setPinnedLat(position.lat);
        setPinnedLng(position.lng);
      });

      window._adminMap = mapInstance;
      window._adminMarker = markerInstance;
    }, 100);

    return () => {
      clearTimeout(timer);
      if (window._adminMap) {
        window._adminMap.remove();
        window._adminMap = null;
        window._adminMarker = null;
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
        setPinnedLat(lat);
        setPinnedLng(lng);
        if (window._adminMarker && window._adminMap) {
          window._adminMarker.setLatLng([lat, lng]);
          window._adminMap.setView([lat, lng], 14);
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
    if (pinnedLat === null || pinnedLng === null) {
      showToast('Please pin the exact project location on the map.', 'error');
      return;
    }
    if (!newTaskStartTime || !newTaskEndTime) {
      showToast('Please select both Start Time and End Time.', 'error');
      return;
    }
    const newTaskTime = `${formatTime12Hour(newTaskStartTime)} - ${formatTime12Hour(newTaskEndTime)}`;
    const res = await addJob(newTaskTitle, newTaskDescription, newTaskLocation, newTaskPayRate, newTaskDate, newTaskTime, pinnedLat, pinnedLng);
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
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Schedule New Project Task</h3>
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
                placeholder="e.g. Server Room Maintenance"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Job Description</label>
              <textarea 
                className="form-input" 
                placeholder="e.g. Detail the tasks, schedules, and specific roles required for this project."
                value={newTaskDescription}
                onChange={(e) => setNewTaskDescription(e.target.value)}
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
              <label className="form-label">Pin Location on Map</label>
              <div 
                id="admin-map"
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
                placeholder="e.g. KLCC Tower 2, Level 15"
                value={newTaskLocation}
                onChange={(e) => setNewTaskLocation(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Scheduled Date</label>
              <input 
                type="date" 
                className="form-input" 
                value={newTaskDate}
                onChange={(e) => setNewTaskDate(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Start Time</label>
                <input 
                  type="time" 
                  className="form-input" 
                  value={newTaskStartTime}
                  onChange={(e) => setNewTaskStartTime(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">End Time</label>
                <input 
                  type="time" 
                  className="form-input" 
                  value={newTaskEndTime}
                  onChange={(e) => setNewTaskEndTime(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary btn-sm">Add Project Task</button>
          </div>
        </form>
      </div>
    </div>
  );
}
