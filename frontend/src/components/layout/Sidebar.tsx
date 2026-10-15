import React from 'react';
import { NavLink } from 'react-router-dom';
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
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle }) => {
  // Required 11 Modules + Retained Workflow Helpers
  const mainNavItems = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard },
    { label: 'Flight Operations', path: '/flights', icon: PlaneTakeoff },
    { label: 'Baggage Handling', path: '/handling', icon: Layers },
    { label: 'Track Baggage', path: '/tracking', icon: Search },
    { label: 'Route Optimization', path: '/routes', icon: Network },
    { label: 'Terminal Management', path: '/terminals', icon: Building2 },
    { label: 'Live Scan Events', path: '/scans', icon: Barcode },
    { label: 'Analytics & Reports', path: '/analytics', icon: BarChart3 },
    { label: 'Distributed Databases', path: '/database-center', icon: Database },
    { label: 'Users & Roles', path: '/admin', icon: Users },
    { label: 'Settings', path: '/settings', icon: Settings },
  ];

  const secondaryNavItems = [
    { label: 'Baggage Registration', path: '/registration', icon: Luggage },
    { label: 'Exceptions & Recovery', path: '/exceptions', icon: AlertTriangle },
  ];

  return (
    <aside
      style={{
        width: collapsed ? '72px' : '264px',
        backgroundColor: '#06182D', // CARGOFLIGHT Navy
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
          height: '64px',
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
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: '#0878F9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                boxShadow: '0 0 12px rgba(8, 120, 249, 0.4)',
              }}
            >
              <Plane size={18} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span
                  style={{
                    fontSize: '1.05rem',
                    fontWeight: 800,
                    color: '#FFFFFF',
                    letterSpacing: '0.04em',
                    fontFamily: 'var(--font-display, sans-serif)',
                  }}
                >
                  CARGOFLIGHT
                </span>
                <span
                  style={{
                    fontSize: '0.625rem',
                    fontWeight: 700,
                    color: '#00C2D7',
                    backgroundColor: 'rgba(0, 194, 215, 0.15)',
                    padding: '0.1rem 0.35rem',
                    borderRadius: '4px',
                    letterSpacing: '0.05em',
                  }}
                >
                  AIRPORT
                </span>
              </div>
              <div
                style={{
                  fontSize: '0.625rem',
                  color: '#94A3B8',
                  fontWeight: 600,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                }}
              >
                CARGO & BAGGAGE TRACKING
              </div>
            </div>
          </div>
        ) : (
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              backgroundColor: '#0878F9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              boxShadow: '0 0 12px rgba(8, 120, 249, 0.4)',
            }}
          >
            <Plane size={20} />
          </div>
        )}

        <button
          onClick={onToggle}
          style={{
            border: 'none',
            background: 'transparent',
            color: '#94A3B8',
            cursor: 'pointer',
            padding: '0.35rem',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'color 150ms ease',
          }}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Navigation Links */}
      <nav style={{ padding: '0.85rem 0.65rem', flex: 1, overflowY: 'auto' }}>
        <div
          style={{
            fontSize: '0.65rem',
            fontWeight: 700,
            color: '#64748B',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            padding: '0 0.65rem 0.4rem',
            display: collapsed ? 'none' : 'block',
          }}
        >
          Operations Core
        </div>
        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  end={item.path === '/'}
                  style={({ isActive }) => ({
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: collapsed ? '0.65rem 0' : '0.6rem 0.85rem',
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    borderRadius: '8px',
                    color: isActive ? '#FFFFFF' : '#94A3B8',
                    backgroundColor: isActive ? '#0878F9' : 'transparent',
                    fontWeight: isActive ? 600 : 500,
                    fontSize: '0.85rem',
                    textDecoration: 'none',
                    transition: 'all 150ms ease',
                    boxShadow: isActive ? '0 2px 8px rgba(8, 120, 249, 0.35)' : 'none',
                  })}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon size={18} color={undefined} />
                  {!collapsed && <span style={{ whiteSpace: 'nowrap' }}>{item.label}</span>}
                </NavLink>
              </li>
            );
          })}
        </ul>

        {/* Retained Operational Consoles */}
        <div
          style={{
            fontSize: '0.65rem',
            fontWeight: 700,
            color: '#64748B',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            padding: '1.25rem 0.65rem 0.4rem',
            display: collapsed ? 'none' : 'block',
          }}
        >
          Quick Consoles
        </div>
        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
          {secondaryNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  style={({ isActive }) => ({
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: collapsed ? '0.65rem 0' : '0.55rem 0.85rem',
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    borderRadius: '8px',
                    color: isActive ? '#FFFFFF' : '#94A3B8',
                    backgroundColor: isActive ? '#0878F9' : 'transparent',
                    fontWeight: isActive ? 600 : 500,
                    fontSize: '0.825rem',
                    textDecoration: 'none',
                    transition: 'all 150ms ease',
                  })}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon size={16} />
                  {!collapsed && <span style={{ whiteSpace: 'nowrap' }}>{item.label}</span>}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer Status */}
      {!collapsed ? (
        <div
          style={{
            padding: '0.85rem 1rem',
            backgroundColor: '#03111F',
            borderTop: '1px solid #1E293B',
            fontSize: '0.7rem',
            color: '#64748B',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.2rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 600, color: '#94A3B8' }}>CARGOFLIGHT 3-DB</span>
            <span style={{ color: '#10B981', display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 600 }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10B981' }} />
              ONLINE
            </span>
          </div>
          <div style={{ fontSize: '0.65rem', color: '#64748B' }}>
            PG + MongoDB + Neo4j
          </div>
        </div>
      ) : (
        <div style={{ padding: '0.75rem', textAlign: 'center', borderTop: '1px solid #1E293B' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10B981', display: 'inline-block' }} />
        </div>
      )}
    </aside>
  );
};
