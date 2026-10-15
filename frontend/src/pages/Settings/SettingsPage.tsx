import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { SystemSetting } from '../../types';
import { useAuth } from '../../context/AuthContext';
import {
  Settings as SettingsIcon,
  Save,
  RefreshCw,
  Sliders,
  Shield,
  Database,
  Building2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Radio,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'SYSTEM_ADMIN' || user?.role === 'OPERATIONS_MANAGER';

  const [settings, setSettings] = useState<Record<string, string>>({
    AIRPORT_DEFAULT_CODE: 'MAA',
    TERMINAL_DEFAULT: 'Terminal 2 (Domestic & International)',
    BAGGAGE_DELAY_THRESHOLD_MINUTES: '45',
    TIMEZONE_DEFAULT: 'Asia/Kolkata',
    AUTO_SYNC_INTERVAL_MINUTES: '15',
    AUDIT_RETENTION_DAYS: '90',
    TELEMETRY_STORAGE_ENABLED: 'true',
    GRAPH_ROUTING_ENGINE: 'NEO4J_WITH_PG_FALLBACK',
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Client-side local operational preferences
  const [localAutoRefresh, setLocalAutoRefresh] = useState<boolean>(() => {
    return localStorage.getItem('cargoflight_auto_refresh') === 'true';
  });
  const [denseTables, setDenseTables] = useState<boolean>(() => {
    return localStorage.getItem('cargoflight_dense_tables') === 'true';
  });

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await api.getSettings();
      const map: Record<string, string> = {};
      res.forEach((s) => {
        map[s.settingKey] = s.settingValue;
      });
      setSettings((prev) => ({ ...prev, ...map }));
    } catch (err: any) {
      console.warn('Could not load backend settings, using defaults', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleChange = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      setFeedback({ type: 'error', message: 'Unauthorized: Only Administrators and Operations Managers can modify operational thresholds.' });
      return;
    }

    try {
      setSaving(true);
      setFeedback(null);
      await api.updateSettings(settings);

      // Save local client preferences
      localStorage.setItem('cargoflight_auto_refresh', localAutoRefresh ? 'true' : 'false');
      localStorage.setItem('cargoflight_dense_tables', denseTables ? 'true' : 'false');

      setFeedback({
        type: 'success',
        message: 'System settings successfully updated and persisted to PostgreSQL configuration store.',
      });
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to persist settings.',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Page Title */}
      <div
        className="card"
        style={{
          padding: '1.5rem',
          backgroundColor: '#FFFFFF',
          borderLeft: '4px solid #0878F9',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <SettingsIcon size={22} color="#0878F9" />
            <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#14233B' }}>
              System & Operational Settings
            </h1>
          </div>
          <p style={{ color: '#64748B', fontSize: '0.85rem', marginTop: '0.25rem' }}>
            Configure authoritative airport defaults, baggage delay alert thresholds, telemetry ingestion, and database engine modes.
          </p>
        </div>

        <button
          onClick={fetchSettings}
          disabled={loading}
          className="btn btn-secondary btn-sm"
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <RefreshCw size={14} className={loading ? 'spin' : ''} />
          <span>Reload Config</span>
        </button>
      </div>

      {feedback && (
        <div
          style={{
            padding: '1rem 1.25rem',
            borderRadius: '8px',
            fontSize: '0.875rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            backgroundColor: feedback.type === 'success' ? '#ECFDF5' : '#FEF2F2',
            border: `1px solid ${feedback.type === 'success' ? '#A7F3D0' : '#FECACA'}`,
            color: feedback.type === 'success' ? '#065F46' : '#991B1B',
          }}
        >
          {feedback.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{feedback.message}</span>
        </div>
      )}

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Section 1: Airport Operations & Thresholds */}
        <div className="card">
          <div className="card-header" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Building2 size={18} color="#0878F9" />
            <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Airport Operations & Thresholds</span>
          </div>
          <div className="card-body" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
            <div className="form-group">
              <label className="form-label">Default Airport IATA Hub</label>
              <input
                type="text"
                className="form-input"
                value={settings.AIRPORT_DEFAULT_CODE || 'MAA'}
                onChange={(e) => handleChange('AIRPORT_DEFAULT_CODE', e.target.value.toUpperCase())}
                disabled={!isAdmin}
                required
              />
              <span className="form-hint">Authoritative three-letter IATA station code</span>
            </div>

            <div className="form-group">
              <label className="form-label">Primary Handling Terminal</label>
              <input
                type="text"
                className="form-input"
                value={settings.TERMINAL_DEFAULT || 'Terminal 2 (Domestic & International)'}
                onChange={(e) => handleChange('TERMINAL_DEFAULT', e.target.value)}
                disabled={!isAdmin}
                required
              />
              <span className="form-hint">Primary operational sorting terminal at MAA</span>
            </div>

            <div className="form-group">
              <label className="form-label">Baggage Delay Threshold (Minutes)</label>
              <input
                type="number"
                min="5"
                max="240"
                className="form-input"
                value={settings.BAGGAGE_DELAY_THRESHOLD_MINUTES || '45'}
                onChange={(e) => handleChange('BAGGAGE_DELAY_THRESHOLD_MINUTES', e.target.value)}
                disabled={!isAdmin}
                required
              />
              <span className="form-hint">Time without scan before flagging baggage as Delayed Exception</span>
            </div>

            <div className="form-group">
              <label className="form-label">Operational Timezone</label>
              <input
                type="text"
                className="form-input"
                value={settings.TIMEZONE_DEFAULT || 'Asia/Kolkata'}
                onChange={(e) => handleChange('TIMEZONE_DEFAULT', e.target.value)}
                disabled={!isAdmin}
                required
              />
              <span className="form-hint">Timezone applied for console display (Timestamps stored in UTC)</span>
            </div>
          </div>
        </div>

        {/* Section 2: Database Architecture & Ingestion */}
        <div className="card">
          <div className="card-header" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Database size={18} color="#00C2D7" />
            <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>3-Database Architecture & Integrations</span>
          </div>
          <div className="card-body" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
            <div className="form-group">
              <label className="form-label">MongoDB Telemetry Ingestion</label>
              <select
                className="form-select"
                value={settings.TELEMETRY_STORAGE_ENABLED || 'true'}
                onChange={(e) => handleChange('TELEMETRY_STORAGE_ENABLED', e.target.value)}
                disabled={!isAdmin}
              >
                <option value="true">Enabled (Persist raw scan events with 7-day TTL)</option>
                <option value="false">Disabled (Operational PostgreSQL only)</option>
              </select>
              <span className="form-hint">Store raw RFID/barcode scanner device telemetry in MongoDB</span>
            </div>

            <div className="form-group">
              <label className="form-label">Route Optimization Engine</label>
              <select
                className="form-select"
                value={settings.GRAPH_ROUTING_ENGINE || 'NEO4J_WITH_PG_FALLBACK'}
                onChange={(e) => handleChange('GRAPH_ROUTING_ENGINE', e.target.value)}
                disabled={!isAdmin}
              >
                <option value="NEO4J_WITH_PG_FALLBACK">Neo4j Cypher with PostgreSQL Dijkstra Fallback</option>
                <option value="POSTGRES_TOPOLOGY_SOLVER">Deterministic PostgreSQL Solver Only</option>
              </select>
              <span className="form-hint">Pathfinding strategy for conveyor and tug cart routing</span>
            </div>

            <div className="form-group">
              <label className="form-label">Warehouse Refresh Cadence (Minutes)</label>
              <input
                type="number"
                min="5"
                max="1440"
                className="form-input"
                value={settings.AUTO_SYNC_INTERVAL_MINUTES || '15'}
                onChange={(e) => handleChange('AUTO_SYNC_INTERVAL_MINUTES', e.target.value)}
                disabled={!isAdmin}
              />
              <span className="form-hint">Scheduled refresh rate for PostgreSQL cargoflight_dw schema</span>
            </div>

            <div className="form-group">
              <label className="form-label">Audit Log Retention Policy (Days)</label>
              <input
                type="number"
                min="30"
                max="365"
                className="form-input"
                value={settings.AUDIT_RETENTION_DAYS || '90'}
                onChange={(e) => handleChange('AUDIT_RETENTION_DAYS', e.target.value)}
                disabled={!isAdmin}
              />
              <span className="form-hint">Security journal preservation window</span>
            </div>
          </div>
        </div>

        {/* Section 3: Browser Client Preferences */}
        <div className="card">
          <div className="card-header" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sliders size={18} color="#10B981" />
            <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Local Display Preferences (Current Browser)</span>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={localAutoRefresh}
                onChange={(e) => setLocalAutoRefresh(e.target.checked)}
                style={{ width: '18px', height: '18px', accentColor: '#0878F9' }}
              />
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>Auto-Refresh Operational Monitors</div>
                <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                  Poll backend API every 15 seconds on Dashboard and Live Scan simulator.
                </div>
              </div>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={denseTables}
                onChange={(e) => setDenseTables(e.target.checked)}
                style={{ width: '18px', height: '18px', accentColor: '#0878F9' }}
              />
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>Compact Table Rows</div>
                <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                  Reduces table row padding for high-density airport operations displays.
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Action Button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', alignItems: 'center' }}>
          {!isAdmin && (
            <div style={{ fontSize: '0.8rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Shield size={14} color="#F59E0B" />
              <span>Settings are read-only for your current role. Sign in as Admin to edit.</span>
            </div>
          )}
          <button
            type="submit"
            disabled={saving || !isAdmin}
            className="btn btn-primary"
            style={{
              padding: '0.65rem 1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontWeight: 600,
            }}
          >
            {saving ? <RefreshCw size={16} className="spin" /> : <Save size={16} />}
            <span>Save Operational Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
};
