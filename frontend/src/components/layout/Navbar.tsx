import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useExperienceMode } from '../../context/ExperienceModeContext';
import {
  Plane,
  Luggage,
  Sliders,
  CheckCircle,
  Clock,
  Database,
  Search,
  Bell,
  Settings,
  X,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { mode, toggleMode, isSimple } = useExperienceMode();
  const navigate = useNavigate();
  const [istTime, setIstTime] = useState<string>('');
  const [globalSearch, setGlobalSearch] = useState<string>('');
  const [showNotifications, setShowNotifications] = useState<boolean>(false);

  // User-friendly flight & baggage update notifications
  const notifications = [
    {
      id: 1,
      type: 'CHECK REQUIRED',
      text: 'Baggage MAA-73892 was routed for a routine security inspection.',
      time: '10m ago',
      color: '#F59E0B',
    },
    {
      id: 2,
      type: 'FLIGHT ARRIVAL',
      text: 'Flight AI-508 has landed at Gate G14. Baggage unloading is starting now.',
      time: '22m ago',
      color: '#0878F9',
    },
    {
      id: 3,
      type: 'SYSTEM OK',
      text: 'All airport database records and baggage history are up to date.',
      time: '45m ago',
      color: '#10B981',
    },
  ];

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        timeZone: 'Asia/Kolkata',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      };
      setIstTime(now.toLocaleString('en-IN', options) + ' IST');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleGlobalSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = globalSearch.trim();
    if (!q) return;

    if (q.toUpperCase().startsWith('AI-') || q.toUpperCase().startsWith('6E-') || q.toUpperCase().startsWith('SG-') || q.toUpperCase().startsWith('UK-')) {
      navigate(`/flights?search=${encodeURIComponent(q)}`);
    } else {
      navigate(`/tracking?tag=${encodeURIComponent(q)}`);
    }
    setGlobalSearch('');
  };

  return (
    <header
      style={{
        height: '66px',
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
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.35rem 0.75rem',
            backgroundColor: '#EFF6FF',
            border: '1px solid #DBEAFE',
            borderRadius: '8px',
            fontSize: '0.75rem',
            fontWeight: 700,
            color: '#0878F9',
            letterSpacing: '0.04em',
          }}
        >
          <Plane size={15} />
          <span>CHENNAI AIRPORT [MAA]</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#64748B', fontSize: '0.8125rem', fontWeight: 500 }}>
          <Clock size={14} color="#0878F9" />
          <span>{istTime}</span>
        </div>
      </div>

      {/* Center Section: Global Search */}
      <form onSubmit={handleGlobalSearch} style={{ display: 'flex', alignItems: 'center', position: 'relative', width: '380px' }}>
        <Search size={15} style={{ position: 'absolute', left: '0.85rem', color: '#94A3B8' }} />
        <input
          type="text"
          value={globalSearch}
          onChange={(e) => setGlobalSearch(e.target.value)}
          placeholder="Track baggage number or search flight..."
          style={{
            width: '100%',
            padding: '0.5rem 0.85rem 0.5rem 2.4rem',
            fontSize: '0.8125rem',
            border: '1px solid #D8E2EE',
            borderRadius: '10px',
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

      {/* Right Section: Experience Mode Toggle, System Status, Notifications, User */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
        {/* Simple Mode vs Operations Mode Switcher */}
        <button
          onClick={toggleMode}
          title={isSimple ? 'Switch to Airport Operations Mode (for staff)' : 'Switch to Simple Mode (for passengers)'}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.35rem 0.75rem',
            borderRadius: '20px',
            fontSize: '0.75rem',
            fontWeight: 700,
            cursor: 'pointer',
            border: isSimple ? '1px solid #A7F3D0' : '1px solid #BFDBFE',
            backgroundColor: isSimple ? '#ECFDF5' : '#EFF6FF',
            color: isSimple ? '#065F46' : '#1E40AF',
            transition: 'all 150ms ease',
          }}
        >
          {isSimple ? (
            <>
              <Sparkles size={14} color="#059669" />
              <span>Simple View</span>
            </>
          ) : (
            <>
              <Sliders size={14} color="#0878F9" />
              <span>Operations View</span>
            </>
          )}
        </button>

        {/* System Status Link */}
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
            borderRadius: '8px',
            backgroundColor: '#EFF6FF',
            border: '1px solid #DBEAFE',
            textDecoration: 'none',
          }}
          title="View PostgreSQL, MongoDB & Neo4j real-time health"
        >
          <Database size={15} />
          <span>System Status</span>
        </Link>

        {/* Notifications Toggle */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            style={{
              border: '1px solid #E2E8F0',
              backgroundColor: '#FFFFFF',
              color: '#475569',
              padding: '0.5rem',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
            }}
            title="Activity Updates"
          >
            <Bell size={16} />
            <span
              style={{
                position: 'absolute',
                top: '-2px',
                right: '-2px',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#0878F9',
                border: '2px solid #FFFFFF',
              }}
            />
          </button>

          {showNotifications && (
            <div
              style={{
                position: 'absolute',
                top: '46px',
                right: 0,
                width: '340px',
                backgroundColor: '#FFFFFF',
                borderRadius: '10px',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                border: '1px solid #E2E8F0',
                padding: '0.85rem',
                zIndex: 50,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid #F1F5F9' }}>
                <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#14233B' }}>Flight & Baggage Updates</span>
                <button
                  onClick={() => setShowNotifications(false)}
                  style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#94A3B8' }}
                >
                  <X size={14} />
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                {notifications.map((n) => (
                  <div key={n.id} style={{ padding: '0.5rem 0.65rem', backgroundColor: '#F8FAFD', borderRadius: '8px', fontSize: '0.75rem', borderLeft: `3px solid ${n.color}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748B', fontSize: '0.7rem' }}>
                      <span style={{ fontWeight: 700, color: n.color }}>{n.type}</span>
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
            padding: '0.5rem',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textDecoration: 'none',
          }}
          title="Application Settings"
        >
          <Settings size={16} />
        </Link>

        {/* User Profile */}
        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.35rem 0.75rem',
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
                  {user.role === 'SYSTEM_ADMIN' ? 'System Administrator' : user.role.replace(/_/g, ' ')}
                </div>
              </div>
            </div>

            <button
              onClick={logout}
              title="Refresh / Reconnect Operator Session"
              className="btn btn-secondary btn-sm"
              style={{ padding: '0.5rem', display: 'flex', alignItems: 'center' }}
            >
              <LogOut size={15} />
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
            FlyTrack Guest
          </div>
        )}
      </div>
    </header>
  );
};
