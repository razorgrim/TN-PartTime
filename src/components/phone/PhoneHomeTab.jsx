import React from 'react';
import { Fingerprint, Wallet, User, MessageSquare } from 'lucide-react';

const getMiddleName = (fullName) => {
  if (!fullName) return '';
  const parts = fullName.trim().split(/\s+/);
  if (parts.length <= 1) return fullName;
  return parts[1];
};

export default function PhoneHomeTab({ partTimerSession, setActiveTab }) {
  const middleName = getMiddleName(partTimerSession.name);

  return (
    <div className="phone-tab-screen" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="phone-screen-header">
        <h2 className="phone-screen-title">Home</h2>
      </div>

      <div style={{ padding: '1.25rem', paddingBottom: '90px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Welcome Banner Card */}
        <div className="phone-welcome-banner" style={{ margin: 0 }}>
          <div className="welcome-info">
            <h4>Hello, {middleName}!</h4>
            <p>Role: Part-Timer</p>
          </div>
          <div className="welcome-avatar-container">
            <div className="welcome-avatar">
              {middleName ? middleName.charAt(0).toUpperCase() : '?'}
            </div>
            <div className="welcome-avatar-status"></div>
          </div>
        </div>

        <div>
          <h3 style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
            YOUR APPS
          </h3>

          {/* Apps Grid */}
          <div className="phone-app-grid">
            <div className="phone-app-card" onClick={() => setActiveTab('attendance')}>
              <div className="phone-app-icon-wrap icon-attendance">
                <Fingerprint size={24} />
              </div>
              <span className="phone-app-label">Attendance</span>
              <span className="phone-app-sublabel">Clock In/Out</span>
            </div>

            <div className="phone-app-card" onClick={() => setActiveTab('claims')}>
              <div className="phone-app-icon-wrap icon-claims">
                <Wallet size={24} />
              </div>
              <span className="phone-app-label">e-Claims</span>
              <span className="phone-app-sublabel">Submit & Track</span>
            </div>

            <div className="phone-app-card" onClick={() => setActiveTab('profile')}>
              <div className="phone-app-icon-wrap icon-profile">
                <User size={24} />
              </div>
              <span className="phone-app-label">Profile</span>
              <span className="phone-app-sublabel">Bank & Info</span>
            </div>

            <div className="phone-app-card" onClick={() => setActiveTab('support')}>
              <div className="phone-app-icon-wrap icon-support">
                <MessageSquare size={24} />
              </div>
              <span className="phone-app-label">Support</span>
              <span className="phone-app-sublabel">Contact HR</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
