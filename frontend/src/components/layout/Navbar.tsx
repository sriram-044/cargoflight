import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Plane, User as UserIcon, LogOut, Clock, Database, Search, Bell, Settings, X, ExternalLink } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [istTime, setIstTime] = useState<string>('');
  const [globalSearch, setGlobalSearch] = useState<string>('');
  const [showNotifications, setShowNotifications] = useState<boolean>(false);

  // Simulated operational notification list
  const notifications = [
    { id: 1, type: 'ALERT', text: 'Baggage tag MAA-73892 flagged for secondary security clearance inspection', time: '10m ago' },
    { id: 2, type: 'INFO', text: 'Flight AI-508 arrived at Gate G14. Ground crew ready for unloading', time: '22m ago' },
    { id: 3, type: 'SYSTEM', text: 'PostgreSQL analytical warehouse refreshed successfully (24 facts generated)', time: '45m ago' },
  ];

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        timeZone: 'Asia/Kolkata',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      };
      setIstTime(now.toLocaleString('en-GB', options) + ' IST');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleGlobalSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = globalSearch.trim();
    if (!q) return;

    if (q.toUpperCase().startsWith('AI-') || q.toUpperCase().startsWith('6E-') || q.toUpperCase().startsWith('SG-')) {
      navigate(`/flights?search=${encodeURIComponent(q)}`);
    } else {
      navigate(`/tracking?tag=${encodeURIComponent(q)}`);
    }
    setGlobalSearch('');
  };

  return (
    <header
      style={{
        height: '64px',
        backgroundColor: '#FFFFFF',
        borderBottom: '1px solid #E2E8F0',
        padding: '0 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 25,
        boxShadow: '0 1px 3px 0 rgba(6, 24, 45, 0.04)',
      }}
    >
      {/* Left Section: Airport Hub Badge & Clock */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.3rem 0.75rem',
            backgroundColor: '#EFF6FF',
            border: '1px solid #DBEAFE',
            borderRadius: '6px',
            fontSize: '0.75rem',
            fontWeight: 700,
            color: '#0878F9',
            letterSpacing: '0.04em',
          }}
        >
          <Plane size={15} />
          <span>CHENNAI HUB [MAA]</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#64748B', fontSize: '0.8125rem', fontWeight: 500 }}>
          <Clock size={14} color="#0878F9" />
          <span>{istTime}</span>
        </div>
      </div>

      {/* Center Section: Global Search */}
      <form onSubmit={handleGlobalSearch} style={{ display: 'flex', alignItems: 'center', position: 'relative', width: '320px' }}>
        <Search size={15} style={{ position: 'absolute', left: '0.75rem', color: '#94A3B8' }} />
        <input
          type="text"
          value={globalSearch}
          onChange={(e) => setGlobalSearch(e.target.value)}
          placeholder="Global Search: Baggage Tag or Flight..."
          style={{
            width: '100%',
            padding: '0.45rem 0.75rem 0.45rem 2.25rem',
            fontSize: '0.8125rem',
            border: '1px solid #D8E2EE',
            borderRadius: '8px',
            backgroundColor: '#F8FAFD',
            color: '#14233B',
            outline: 'none',
            transition: 'all 150ms ease',
          }}
          onFocus={(e) => {
            e.target.style.borderColor = '#0878F9';
            e.target.style.backgroundColor = '#FFFFFF';
            e.target.style.boxShadow = '0 0 0 3px rgba(8, 120, 249, 0.15)';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = '#D8E2EE';
            e.target.style.backgroundColor = '#F8FAFD';
            e.target.style.boxShadow = 'none';
          }}
        />
      </form>

      {/* Right Section: Database Center link, Notifications, Profile, Account actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
        <Link
          to="/database-center"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            fontSize: '0.8125rem',
            fontWeight: 600,
            color: '#0878F9',
            padding: '0.35rem 0.75rem',
            borderRadius: '6px',
            backgroundColor: '#EFF6FF',
            border: '1px solid #DBEAFE',
            textDecoration: 'none',
          }}
        >
          <Database size={15} />
          <span>3-DB Health</span>
        </Link>

        {/* Notifications Toggle */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            style={{
              border: '1px solid #E2E8F0',
              backgroundColor: '#FFFFFF',
              color: '#475569',
              padding: '0.45rem',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
            }}
            title="Operational Notifications"
          >
            <Bell size={17} />
            <span
              style={{
                position: 'absolute',
                top: '-2px',
                right: '-2px',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#EF4444',
                border: '2px solid #FFFFFF',
              }}
            />
          </button>

          {showNotifications && (
            <div
              style={{
                position: 'absolute',
                top: '42px',
                right: 0,
                width: '320px',
                backgroundColor: '#FFFFFF',
                borderRadius: '8px',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                border: '1px solid #E2E8F0',
                padding: '0.75rem',
                zIndex: 50,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid #F1F5F9' }}>
                <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#14233B' }}>Flight Operations Alerts</span>
                <button
                  onClick={() => setShowNotifications(false)}
                  style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#94A3B8' }}
                >
                  <X size={14} />
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                {notifications.map((n) => (
                  <div key={n.id} style={{ padding: '0.45rem 0.5rem', backgroundColor: '#F8FAFD', borderRadius: '6px', fontSize: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748B', fontSize: '0.7rem' }}>
                      <span style={{ fontWeight: 600, color: n.type === 'ALERT' ? '#EF4444' : '#0878F9' }}>{n.type}</span>
                      <span>{n.time}</span>
                    </div>
                    <div style={{ color: '#1E293B', marginTop: '0.2rem', lineHeight: 1.35 }}>{n.text}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Settings Shortcut */}
        <Link
          to="/settings"
          style={{
            border: '1px solid #E2E8F0',
            backgroundColor: '#FFFFFF',
            color: '#475569',
            padding: '0.45rem',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textDecoration: 'none',
          }}
          title="System Settings"
        >
          <Settings size={17} />
        </Link>

        {/* User Profile */}
        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.3rem 0.75rem',
                borderRadius: '8px',
                backgroundColor: '#F8FAFD',
                border: '1px solid #E2E8F0',
              }}
            >
              <div
                style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  backgroundColor: '#0878F9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                }}
              >
                {user.fullName ? user.fullName.charAt(0).toUpperCase() : user.username.charAt(0).toUpperCase()}
              </div>
              <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
                <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#14233B' }}>
                  {user.fullName || user.username}
                </div>
                <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#0878F9' }}>
                  {user.role}
                </div>
              </div>
            </div>

            <button
              onClick={logout}
              title="Refresh CARGOFLIGHT Operator Session"
              className="btn btn-secondary btn-sm"
              style={{ padding: '0.45rem', display: 'flex', alignItems: 'center' }}
            >
              <LogOut size={16} />
            </button>
          </div>
        ) : (
          <div
            style={{
              padding: '0.35rem 0.75rem',
              borderRadius: '8px',
              backgroundColor: '#EFF6FF',
              color: '#0878F9',
              fontSize: '0.75rem',
              fontWeight: 700,
              border: '1px solid #BFDBFE',
            }}
          >
            CARGOFLIGHT Ops
          </div>
        )}
      </div>
    </header>
  );
};
