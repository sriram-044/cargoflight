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
  SlidersHorizontal,
  Monitor,
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1540px', margin: '0 auto', width: '100%' }}>
      {/* Modern Airport Hero Header */}
      <div className="airport-hero">
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div>
            <div className="airport-hero-badge">
              <span className="pulse-dot"></span>
              <span>SYSTEM CONFIGURATION & OPERATIONAL POLICIES</span>
            </div>
            <h1 className="airport-hero-title">Settings</h1>
            <p className="airport-hero-subtitle">
              Configure airport hub defaults, delay warning thresholds, cloud telemetry retention, and screen preferences.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={fetchSettings}
              disabled={loading}
              className="btn btn-secondary btn-sm"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                color: '#FFFFFF',
                border: '1px solid rgba(255, 255, 255, 0.18)',
                backdropFilter: 'blur(10px)',
              }}
            >
              <RefreshCw size={14} className={loading ? 'spin' : ''} />
              <span>Reload Settings</span>
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !isAdmin}
              className="btn btn-primary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}
            >
              {saving ? <RefreshCw size={14} className="spin" /> : <Save size={14} />}
              <span>{saving ? 'Saving...' : 'Save All Changes'}</span>
            </button>
          </div>
        </div>
      </div>

      {feedback && (
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderRadius: '12px',
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            backgroundColor: feedback.type === 'success' ? '#ECFDF5' : '#FEF2F2',
            border: `1px solid ${feedback.type === 'success' ? '#A7F3D0' : '#FECACA'}`,
            color: feedback.type === 'success' ? '#065F46' : '#991B1B',
            fontWeight: 700,
            boxShadow: 'var(--shadow-card)',
          }}
        >
          {feedback.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          <span>{feedback.message}</span>
        </div>
      )}

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Section 1: Airport Operations & Thresholds */}
        <div className="card" style={{ backgroundColor: '#FFFFFF', borderRadius: '14px', boxShadow: 'var(--shadow-card)', overflow: 'hidden' }}>
          <div className="card-header" style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <Building2 size={20} color="#0878F9" />
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#14233B' }}>Airport Defaults & Delay Thresholds</div>
              <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Primary hub identification and automated baggage warning timers</div>
            </div>
          </div>
          <div className="card-body" style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 700, fontSize: '0.85rem' }}>Default Airport Code</label>
              <input
                type="text"
                className="form-input"
                value={settings.AIRPORT_DEFAULT_CODE || 'MAA'}
                onChange={(e) => handleChange('AIRPORT_DEFAULT_CODE', e.target.value.toUpperCase())}
                disabled={!isAdmin}
                style={{ height: '42px', borderRadius: '8px' }}
                required
              />
              <span className="form-hint">3-letter IATA code (e.g. MAA for Chennai International)</span>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 700, fontSize: '0.85rem' }}>Default Terminal</label>
              <input
                type="text"
                className="form-input"
                value={settings.TERMINAL_DEFAULT || 'Terminal 2 (Domestic & International)'}
                onChange={(e) => handleChange('TERMINAL_DEFAULT', e.target.value)}
                disabled={!isAdmin}
                style={{ height: '42px', borderRadius: '8px' }}
                required
              />
              <span className="form-hint">Terminal where check-in and transfer induction belts operate</span>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 700, fontSize: '0.85rem' }}>Delay Warning Trigger (Minutes)</label>
              <input
                type="number"
                min="5"
                max="240"
                className="form-input"
                value={settings.BAGGAGE_DELAY_THRESHOLD_MINUTES || '45'}
                onChange={(e) => handleChange('BAGGAGE_DELAY_THRESHOLD_MINUTES', e.target.value)}
                disabled={!isAdmin}
                style={{ height: '42px', borderRadius: '8px' }}
                required
              />
              <span className="form-hint">Minutes without a checkpoint scan before triggering an automated operational alert</span>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 700, fontSize: '0.85rem' }}>Timezone</label>
              <input
                type="text"
                className="form-input"
                value={settings.TIMEZONE_DEFAULT || 'Asia/Kolkata'}
                onChange={(e) => handleChange('TIMEZONE_DEFAULT', e.target.value)}
                disabled={!isAdmin}
                style={{ height: '42px', borderRadius: '8px' }}
                required
              />
              <span className="form-hint">Standard airport timezone for flight departures and scan logs</span>
            </div>
          </div>
        </div>

        {/* Section 2: Database Architecture & Ingestion */}
        <div className="card" style={{ backgroundColor: '#FFFFFF', borderRadius: '14px', boxShadow: 'var(--shadow-card)', overflow: 'hidden' }}>
          <div className="card-header" style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <Database size={20} color="#00C2D7" />
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#14233B' }}>Multi-Database Telemetry & Routing</div>
              <div style={{ fontSize: '0.75rem', color: '#64748B' }}>MongoDB Atlas telemetry parameters, Neo4j routing fallback, and data warehouse sync</div>
            </div>
          </div>
          <div className="card-body" style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 700, fontSize: '0.85rem' }}>Scanner Telemetry Storage (MongoDB Atlas)</label>
              <select
                className="form-select"
                value={settings.TELEMETRY_STORAGE_ENABLED || 'true'}
                onChange={(e) => handleChange('TELEMETRY_STORAGE_ENABLED', e.target.value)}
                disabled={!isAdmin}
                style={{ height: '42px', borderRadius: '8px' }}
              >
                <option value="true">Enabled (Stream all barcode & RFID scans to MongoDB Atlas)</option>
                <option value="false">Disabled (Record latest state in PostgreSQL only)</option>
              </select>
              <span className="form-hint">Persists high-frequency optical scans to cloud document store</span>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 700, fontSize: '0.85rem' }}>Route Calculation Method</label>
              <select
                className="form-select"
                value={settings.GRAPH_ROUTING_ENGINE || 'NEO4J_WITH_PG_FALLBACK'}
                onChange={(e) => handleChange('GRAPH_ROUTING_ENGINE', e.target.value)}
                disabled={!isAdmin}
                style={{ height: '42px', borderRadius: '8px' }}
              >
                <option value="NEO4J_WITH_PG_FALLBACK">Neo4j Graph Database (with Dijkstra fallback)</option>
                <option value="POSTGRES_TOPOLOGY_SOLVER">In-Memory Dijkstra Solver Only</option>
              </select>
              <span className="form-hint">Primary engine used to find the optimal conveyor path</span>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 700, fontSize: '0.85rem' }}>Warehouse Sync Interval (Minutes)</label>
              <input
                type="number"
                min="5"
                max="1440"
                className="form-input"
                value={settings.AUTO_SYNC_INTERVAL_MINUTES || '15'}
                onChange={(e) => handleChange('AUTO_SYNC_INTERVAL_MINUTES', e.target.value)}
                disabled={!isAdmin}
                style={{ height: '42px', borderRadius: '8px' }}
              />
              <span className="form-hint">Frequency of analytical ETL sync to <code>cargoflight_dw</code></span>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 700, fontSize: '0.85rem' }}>Audit Log Retention (Days)</label>
              <input
                type="number"
                min="30"
                max="365"
                className="form-input"
                value={settings.AUDIT_RETENTION_DAYS || '90'}
                onChange={(e) => handleChange('AUDIT_RETENTION_DAYS', e.target.value)}
                disabled={!isAdmin}
                style={{ height: '42px', borderRadius: '8px' }}
              />
              <span className="form-hint">Retention duration for operator security audit trail</span>
            </div>
          </div>
        </div>

        {/* Section 3: Browser Client Preferences */}
        <div className="card" style={{ backgroundColor: '#FFFFFF', borderRadius: '14px', boxShadow: 'var(--shadow-card)', overflow: 'hidden' }}>
          <div className="card-header" style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <Monitor size={20} color="#10B981" />
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#14233B' }}>Display & Browser Preferences</div>
              <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Personal screen preferences stored locally in this browser</div>
            </div>
          </div>
          <div className="card-body" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem', cursor: 'pointer', padding: '1rem', backgroundColor: '#F8FAFD', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
              <input
                type="checkbox"
                checked={localAutoRefresh}
                onChange={(e) => setLocalAutoRefresh(e.target.checked)}
                style={{ width: '18px', height: '18px', accentColor: '#0878F9', marginTop: '2px' }}
              />
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0F172A' }}>Automatically refresh tracking and flight tables</div>
                <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '0.15rem' }}>
                  Polls the Spring Boot REST backend every 15 seconds for live baggage scans and flight status updates.
                </div>
              </div>
            </label>

            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem', cursor: 'pointer', padding: '1rem', backgroundColor: '#F8FAFD', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
              <input
                type="checkbox"
                checked={denseTables}
                onChange={(e) => setDenseTables(e.target.checked)}
                style={{ width: '18px', height: '18px', accentColor: '#0878F9', marginTop: '2px' }}
              />
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0F172A' }}>Compact high-density table view</div>
                <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '0.15rem' }}>
                  Reduces vertical row padding to display more flight manifests and baggage rows simultaneously on operations wall monitors.
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Action Button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', alignItems: 'center' }}>
          {!isAdmin && (
            <div style={{ fontSize: '0.85rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <Shield size={16} color="#F59E0B" />
              <span>Operational settings are read-only for your current role. Sign in as Admin to edit.</span>
            </div>
          )}
          <button
            type="submit"
            disabled={saving || !isAdmin}
            className="btn btn-primary"
            style={{
              padding: '0.75rem 2rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontWeight: 700,
              borderRadius: '10px',
            }}
          >
            {saving ? <RefreshCw size={16} className="spin" /> : <Save size={16} />}
            <span>Save Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
};

