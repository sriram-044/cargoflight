import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { DatabaseHealth, DatabaseCheckResult, WarehouseRefreshResponse } from '../../types';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { LoadingSkeleton } from '../../components/feedback/LoadingSkeleton';
import {
  Database,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Zap,
  Info,
  Server,
  Layers,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const DatabaseCenterPage: React.FC = () => {
  const [health, setHealth] = useState<DatabaseHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshingDw, setRefreshingDw] = useState(false);
  const [dwMessage, setDwMessage] = useState<string | null>(null);
  const [error, setError] = useState('');

  const { hasRole } = useAuth();
  const canRefreshWarehouse = hasRole(['SYSTEM_ADMIN', 'OPERATIONS_MANAGER', 'DATABASE_ADMIN']);

  const loadHealth = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await api.getDatabaseHealth();
      setHealth(data);
    } catch (err: any) {
      setError('Database verification check failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHealth();
  }, []);

  const handleRefreshWarehouse = async () => {
    try {
      setRefreshingDw(true);
      setDwMessage(null);
      setError('');
      const res: WarehouseRefreshResponse = await api.refreshWarehouse();
      setDwMessage(`Warehouse ETL Refresh Completed: ${res.recordsProcessed} analytical facts loaded in ${res.durationMs} ms into schema cargoflight_dw.`);
      loadHealth();
    } catch (err: any) {
      setError('Warehouse OLAP refresh failed: ' + err.message);
    } finally {
      setRefreshingDw(false);
    }
  };

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
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
            <Database size={22} color="#0878F9" />
            <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#14233B' }}>
              Distributed Databases & System Health
            </h1>
          </div>
          <p style={{ color: '#64748B', fontSize: '0.85rem', marginTop: '0.25rem' }}>
            Live connection verification for CARGOFLIGHT's 3-database runtime architecture: PostgreSQL, MongoDB, and Neo4j.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button onClick={loadHealth} disabled={loading} className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
            <span>Re-verify 3 Databases</span>
          </button>
          {canRefreshWarehouse && (
            <button
              onClick={handleRefreshWarehouse}
              disabled={refreshingDw}
              className="btn btn-primary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <Zap size={14} className={refreshingDw ? 'spin' : ''} />
              <span>{refreshingDw ? 'Executing Warehouse ETL...' : 'Refresh PostgreSQL Warehouse'}</span>
            </button>
          )}
        </div>
      </div>

      {dwMessage && (
        <div
          style={{
            padding: '1rem',
            backgroundColor: '#ECFDF5',
            border: '1px solid #A7F3D0',
            borderRadius: '8px',
            color: '#065F46',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.85rem',
            fontWeight: 600,
          }}
        >
          <CheckCircle2 size={18} color="#10B981" />
          <span>{dwMessage}</span>
        </div>
      )}

      {error && (
        <div style={{ padding: '1rem', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', color: '#EF4444', fontSize: '0.85rem' }}>
          {error}
        </div>
      )}

      {/* Architecture Rule Banner */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '0.85rem 1.25rem',
          backgroundColor: '#FFFFFF',
          border: '1px solid #D8E2EE',
          borderRadius: '8px',
          fontSize: '0.8125rem',
          color: '#334155',
          boxShadow: '0 1px 2px rgba(6, 24, 45, 0.04)',
        }}
      >
        <Server size={18} color="#0878F9" style={{ flexShrink: 0 }} />
        <span>
          <strong>Three-Database Runtime Architecture:</strong> <strong>1. PostgreSQL 17</strong> is the authoritative operational master and hosts the dedicated <code>cargoflight_dw</code> OLAP star-schema. <strong>2. MongoDB 7.0</strong> stores high-volume raw scanner telemetry with 7-day TTL expiration. <strong>3. Neo4j 5.20</strong> stores the physical conveyor graph for path optimization. <em>(MySQL is not an active runtime dependency per project architecture rules).</em>
        </span>
      </div>

      {/* Main Database Status Cards (Exactly 3 Databases) */}
      {loading ? (
        <LoadingSkeleton rows={3} height="120px" />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {(health?.databases || []).map((db) => {
            const isPass = db.status === 'PASS';
            const isFail = db.status === 'FAIL';

            let cardBorder = '#D8E2EE';
            let badgeBg = '#F1F5F9';
            let badgeText = '#475569';

            if (isPass) {
              cardBorder = '#A7F3D0';
              badgeBg = '#ECFDF5';
              badgeText = '#065F46';
            } else if (isFail) {
              cardBorder = '#FECACA';
              badgeBg = '#FEF2F2';
              badgeText = '#991B1B';
            }

            return (
              <div
                key={db.databaseName}
                className="card"
                style={{
                  border: `1px solid ${cardBorder}`,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 2px 4px rgba(6, 24, 45, 0.04)',
                }}
              >
                <div style={{ padding: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <div>
                      <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#14233B' }}>
                        {db.databaseName}
                      </h3>
                      <div style={{ fontSize: '0.7rem', color: '#0878F9', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                        ROLE: {db.role.replace(/_/g, ' ')}
                      </div>
                    </div>
                    <StatusBadge status={db.status} />
                  </div>

                  <p style={{ fontSize: '0.8125rem', color: '#334155', marginBottom: '1.25rem', minHeight: '44px', lineHeight: 1.45 }}>
                    {db.details}
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.75rem', color: '#64748B', backgroundColor: '#F8FAFD', padding: '0.75rem', borderRadius: '6px' }}>
                    <div>
                      <strong>Safe Endpoint:</strong> <code>{db.endpointSafe}</code>
                    </div>
                    <div>
                      <strong>Verified Records / Facts:</strong> <span style={{ fontWeight: 700, color: '#14233B' }}>{db.recordCount.toLocaleString()}</span>
                    </div>
                    <div>
                      <strong>Roundtrip Ping Latency:</strong> <span style={{ fontWeight: 700, color: '#0878F9' }}>{db.latencyMs} ms</span>
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    padding: '0.65rem 1.25rem',
                    backgroundColor: '#F8FAFD',
                    borderTop: '1px solid #E2E8F0',
                    fontSize: '0.7rem',
                    color: '#64748B',
                    display: 'flex',
                    justifyContent: 'space-between',
                  }}
                >
                  <span>Health: <strong>{db.connected ? 'Connected' : 'Offline / Standby'}</strong></span>
                  <span>Checked: {new Date(db.lastVerified).toLocaleTimeString('en-GB', { timeZone: 'Asia/Kolkata', hour12: false })} IST</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Formal Verification Table */}
      <div className="card">
        <div className="card-header">
          <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#14233B' }}>
            System Architecture Verification Matrix
          </div>
          <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
            Evaluated per Section 15 & Section 24 criteria
          </span>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Database System</th>
                  <th>Configured Target</th>
                  <th>Persistence Guarantee</th>
                  <th>Role & Capabilities</th>
                  <th>Ping Latency</th>
                  <th>Evaluation</th>
                </tr>
              </thead>
              <tbody>
                {(health?.databases || []).map((db) => (
                  <tr key={db.databaseName}>
                    <td style={{ fontWeight: 800, color: '#14233B' }}>{db.databaseName}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{db.endpointSafe}</td>
                    <td style={{ fontSize: '0.8125rem', color: '#334155' }}>
                      {db.databaseName.includes('PostgreSQL')
                        ? 'Authoritative ACID Operational + Star-Schema OLAP'
                        : db.databaseName.includes('MongoDB')
                        ? 'Telemetry Buffer with 7-Day TTL Policy'
                        : 'Graph Topology with Dijkstra Fallback'}
                    </td>
                    <td style={{ fontSize: '0.8125rem' }}>{db.role}</td>
                    <td style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#0878F9' }}>
                      {db.latencyMs} ms
                    </td>
                    <td>
                      <StatusBadge status={db.status} size="sm" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
