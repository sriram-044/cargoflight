import React from 'react';
import { NavLink } from 'react-router-dom';
import { useExperienceMode } from '../../context/ExperienceModeContext';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  PlaneTakeoff,
  Layers,
  Search,
  Network,
  Building2,
  Barcode,
  BarChart3,
  Database,
  Users,
  Settings,
  AlertTriangle,
  Luggage,
  ChevronLeft,
  ChevronRight,
  Plane,
  Sparkles,
  Sliders,
  HelpCircle,
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle }) => {
  const { mode, isSimple, toggleMode } = useExperienceMode();
  const { user } = useAuth();

  // Core navigation for everyday users & passengers
  const everydayNavItems = [
    { label: 'Home', path: '/', icon: LayoutDashboard },
    { label: 'Track Baggage', path: '/tracking', icon: Search },
    { label: 'Flights', path: '/flights', icon: PlaneTakeoff },
    { label: 'Baggage Locations', path: '/terminals', icon: Building2 },
    { label: 'Problems & Delays', path: '/exceptions', icon: AlertTriangle },
    { label: 'Activity Reports', path: '/analytics', icon: BarChart3 },
  ];

  // Airport Operations & Administrative tools
  const operationsNavItems = [
    { label: 'Update Baggage Status', path: '/handling', icon: Layers },
    { label: 'Register New Baggage', path: '/registration', icon: Luggage },
    { label: 'Find Best Route', path: '/routes', icon: Network },
    { label: 'Scanning Activity', path: '/scans', icon: Barcode },
    { label: 'System Status', path: '/database-center', icon: Database },
    { label: 'User Permissions', path: '/admin', icon: Users },
    { label: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <aside
      style={{
        width: collapsed ? '72px' : '264px',
        backgroundColor: '#06182D', // FlyTrack Navy
        color: '#E2E8F0',
        borderRight: '1px solid #1E293B',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 200ms cubic-bezier(0.4, 0, 0.2, 1)',
        flexShrink: 0,
        height: '100vh',
        position: 'sticky',
        top: 0,
        zIndex: 30,
      }}
    >
      {/* Brand Header */}
      <div
        style={{
          height: '66px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          padding: collapsed ? '0' : '0 1.25rem',
          backgroundColor: '#03111F', // Deep Navy
          borderBottom: '1px solid #1E293B',
        }}
      >
        {!collapsed ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '9px',
                backgroundColor: '#0878F9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                boxShadow: '0 0 14px rgba(8, 120, 249, 0.45)',
              }}
            >
              <Luggage size={19} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span
                  style={{
                    fontSize: '1.15rem',
                    fontWeight: 800,
                    color: '#FFFFFF',
                    letterSpacing: '0.03em',
                    fontFamily: 'var(--font-display, sans-serif)',
                  }}
                >
                  FLYTRACK
                </span>
                <span
                  style={{
                    fontSize: '0.625rem',
                    fontWeight: 700,
                    color: '#00C2D7',
                    backgroundColor: 'rgba(0, 194, 215, 0.15)',
                    padding: '0.1rem 0.35rem',
                    borderRadius: '4px',
                    letterSpacing: '0.04em',
                  }}
                >
                  AIRPORT
                </span>
              </div>
              <div
                style={{
                  fontSize: '0.625rem',
                  color: '#94A3B8',
                  fontWeight: 500,
                  letterSpacing: '0.01em',
                }}
              >
                Your baggage journey, made simple.
              </div>
            </div>
          </div>
        ) : (
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '9px',
              backgroundColor: '#0878F9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              boxShadow: '0 0 12px rgba(8, 120, 249, 0.4)',
            }}
          >
            <Luggage size={18} />
          </div>
        )}

        <button
          onClick={onToggle}
          title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          style={{
            border: 'none',
            background: 'transparent',
            color: '#94A3B8',
            cursor: 'pointer',
            padding: '0.35rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '6px',
          }}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Navigation List */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '0.75rem 0.65rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem',
        }}
      >
        {/* Everyday Section */}
        <div>
          {!collapsed && (
            <div
              style={{
                fontSize: '0.6875rem',
                fontWeight: 700,
                color: '#64748B',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                padding: '0 0.65rem 0.5rem',
              }}
            >
              Everyday Tracking
            </div>
          )}
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
            {everydayNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  title={collapsed ? item.label : undefined}
                  style={({ isActive }) => ({
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: collapsed ? '0.65rem 0' : '0.6rem 0.75rem',
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    borderRadius: '8px',
                    color: isActive ? '#FFFFFF' : '#94A3B8',
                    backgroundColor: isActive ? '#0878F9' : 'transparent',
                    textDecoration: 'none',
                    fontWeight: isActive ? 600 : 500,
                    fontSize: '0.8125rem',
                    transition: 'all 120ms ease',
                  })}
                >
                  <Icon size={18} style={{ flexShrink: 0 }} />
                  {!collapsed && <span>{item.label}</span>}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Airport Operations Section (Available in Operations Mode or togglable) */}
        {(!isSimple || !collapsed) && (
          <div>
            {!collapsed && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0 0.65rem 0.5rem',
                }}
              >
                <span
                  style={{
                    fontSize: '0.6875rem',
                    fontWeight: 700,
                    color: '#64748B',
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                  }}
                >
                  Airport Operations
                </span>
                {isSimple && (
                  <span
                    style={{
                      fontSize: '0.625rem',
                      color: '#00C2D7',
                      backgroundColor: 'rgba(0, 194, 215, 0.1)',
                      padding: '0.1rem 0.35rem',
                      borderRadius: '4px',
                    }}
                  >
                    Staff Tools
                  </span>
                )}
              </div>
            )}
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
              {operationsNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    title={collapsed ? item.label : undefined}
                    style={({ isActive }) => ({
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: collapsed ? '0.65rem 0' : '0.6rem 0.75rem',
                      justifyContent: collapsed ? 'center' : 'flex-start',
                      borderRadius: '8px',
                      color: isActive ? '#FFFFFF' : '#94A3B8',
                      backgroundColor: isActive ? '#0878F9' : 'transparent',
                      textDecoration: 'none',
                      fontWeight: isActive ? 600 : 500,
                      fontSize: '0.8125rem',
                      transition: 'all 120ms ease',
                    })}
                  >
                    <Icon size={18} style={{ flexShrink: 0 }} />
                    {!collapsed && <span>{item.label}</span>}
                  </NavLink>
                );
              })}
            </nav>
          </div>
        )}
      </div>

      {/* Mode Switcher Banner in Sidebar Footer */}
      {!collapsed && (
        <div
          style={{
            padding: '0.85rem 1rem',
            backgroundColor: '#03111F',
            borderTop: '1px solid #1E293B',
          }}
        >
          <div
            onClick={toggleMode}
            style={{
              padding: '0.65rem 0.75rem',
              borderRadius: '8px',
              backgroundColor: isSimple ? 'rgba(16, 185, 129, 0.12)' : 'rgba(8, 120, 249, 0.15)',
              border: isSimple ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid rgba(8, 120, 249, 0.25)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: isSimple ? '#34D399' : '#60A5FA',
                }}
              >
                {isSimple ? 'Simple Mode Active' : 'Operations Mode Active'}
              </div>
              <div style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>
                {isSimple ? 'Switch to Staff Ops' : 'Switch to Passenger View'}
              </div>
            </div>
            {isSimple ? <Sparkles size={16} color="#34D399" /> : <Sliders size={16} color="#60A5FA" />}
          </div>
        </div>
      )}
    </aside>
  );
};
