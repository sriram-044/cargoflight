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
  Activity,
  HardDrive,
  Cpu,
  Clock,
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
      setError('System status check failed: ' + (err.message || 'Service unavailable'));
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
      setDwMessage(`Data Warehouse Refresh Completed: ${res.recordsProcessed} analytical records synchronized in ${res.durationMs} ms.`);
      loadHealth();
    } catch (err: any) {
      setError('Data warehouse refresh failed: ' + (err.message || 'Service error'));
    } finally {
      setRefreshingDw(false);
    }
  };

  const getPlainEnglishDescription = (dbName: string) => {
    if (dbName.toLowerCase().includes('postgres')) {
      return 'The authoritative core database storing all passenger baggage files, flight manifests, and historical audit history.';
    }
    if (dbName.toLowerCase().includes('mongo')) {
      return 'High-speed cloud telemetry database capturing every barcode and RFID scanner event in real-time.';
    }
    return 'Graph routing network calculating the fastest and safest routes between baggage handling belts.';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1540px', margin: '0 auto', width: '100%' }}>
      {/* Modern Airport Hero Header */}
      <div className="airport-hero">
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div>
            <div className="airport-hero-badge">
              <span className="pulse-dot"></span>
              <span>MULTI-DATABASE ARCHITECTURE & STATUS</span>
            </div>
            <h1 className="airport-hero-title">System Status</h1>
            <p className="airport-hero-subtitle">
              Verified real-time operational health for PostgreSQL (Master Data & OLAP Warehouse), MongoDB Atlas (Telemetry Stream), and Neo4j (Graph Conveyor Routing).
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={loadHealth}
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
              <span>Check All Services</span>
            </button>
            {canRefreshWarehouse && (
              <button
                onClick={handleRefreshWarehouse}
                disabled={refreshingDw}
                className="btn btn-primary btn-sm"
                style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}
              >
                <Zap size={14} className={refreshingDw ? 'spin' : ''} />
                <span>{refreshingDw ? 'Synchronizing...' : 'Sync Data Warehouse'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {dwMessage && (
        <div
          style={{
            padding: '1.25rem 1.5rem',
            backgroundColor: '#ECFDF5',
            border: '1px solid #A7F3D0',
            borderRadius: '12px',
            color: '#065F46',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            fontSize: '0.9rem',
            fontWeight: 700,
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <CheckCircle2 size={20} color="#10B981" />
          <span>{dwMessage}</span>
        </div>
      )}

      {error && (
        <div style={{ padding: '1rem 1.25rem', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '10px', color: '#EF4444', fontSize: '0.875rem' }}>
          {error}
        </div>
      )}

      {/* Main Database Status Cards */}
      {loading ? (
        <LoadingSkeleton rows={3} height="140px" />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.25rem' }}>
          {(health?.databases || []).map((db) => {
            const isPass = db.status === 'PASS';
            const isFail = db.status === 'FAIL';

            return (
              <div
                key={db.databaseName}
                className="card"
                style={{
                  borderRadius: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  backgroundColor: '#FFFFFF',
                  boxShadow: 'var(--shadow-card)',
                  overflow: 'hidden',
                  borderTop: `4px solid ${isPass ? '#10B981' : isFail ? '#EF4444' : '#F59E0B'}`,
                }}
              >
                <div style={{ padding: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
                    <div>
                      <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#14233B' }}>
                        {db.databaseName}
                      </h3>
                      <div style={{ fontSize: '0.725rem', color: '#0878F9', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', marginTop: '0.2rem' }}>
                        {db.role.replace(/_/g, ' ')}
                      </div>
                    </div>
                    <StatusBadge status={db.status} />
                  </div>

                  <p style={{ fontSize: '0.875rem', color: '#334155', marginBottom: '1.25rem', minHeight: '44px', lineHeight: 1.5 }}>
                    {getPlainEnglishDescription(db.databaseName)}
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem', fontSize: '0.8rem', color: '#64748B', backgroundColor: '#F8FAFD', padding: '1rem', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: 600 }}>Safe Endpoint:</span>
                      <code style={{ color: '#0878F9', fontWeight: 700 }}>{db.endpointSafe}</code>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: 600 }}>Verified Records:</span>
                      <span style={{ fontWeight: 800, color: '#14233B' }}>{db.recordCount.toLocaleString()}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: 600 }}>Response Latency:</span>
                      <span style={{ fontWeight: 800, color: '#0878F9' }}>{db.latencyMs} ms</span>
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    padding: '0.85rem 1.5rem',
                    backgroundColor: '#F8FAFD',
                    borderTop: '1px solid #E2E8F0',
                    fontSize: '0.75rem',
                    color: '#64748B',
                    display: 'flex',
                    justifyContent: 'space-between',
                  }}
                >
                  <span>Service: <strong style={{ color: db.connected ? '#059669' : '#64748B' }}>{db.connected ? 'Operational & Connected' : 'Standby'}</strong></span>
                  <span>Checked: {new Date(db.lastVerified).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true })}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Verification Matrix Table */}
      <div className="card" style={{ backgroundColor: '#FFFFFF', borderRadius: '14px', boxShadow: 'var(--shadow-card)', overflow: 'hidden' }}>
        <div className="card-header" style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #E2E8F0' }}>
          <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#14233B' }}>
            System Architecture Verification Matrix
          </div>
          <span style={{ fontSize: '0.8rem', color: '#64748B' }}>
            Multi-database operational verification for Chennai Airport Baggage Intelligence
          </span>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          <div className="table-responsive">
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#F8FAFD', borderBottom: '1px solid #E2E8F0', textAlign: 'left', color: '#64748B', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  <th style={{ padding: '0.85rem 1.25rem' }}>Database Service</th>
                  <th style={{ padding: '0.85rem 1.25rem' }}>Connection Endpoint</th>
                  <th style={{ padding: '0.85rem 1.25rem' }}>Primary Responsibility</th>
                  <th style={{ padding: '0.85rem 1.25rem' }}>Response Latency</th>
                  <th style={{ padding: '0.85rem 1.25rem' }}>Health Status</th>
                </tr>
              </thead>
              <tbody>
                {(health?.databases || []).map((db) => (
                  <tr key={db.databaseName} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '1rem 1.25rem', fontWeight: 800, color: '#14233B' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Database size={15} color="#0878F9" />
                        <span>{db.databaseName}</span>
                      </div>
                    </td>
                    <td style={{ padding: '1rem 1.25rem', fontFamily: 'monospace', fontSize: '0.85rem', color: '#0878F9', fontWeight: 600 }}>{db.endpointSafe}</td>
                    <td style={{ padding: '1rem 1.25rem', fontSize: '0.85rem', color: '#334155' }}>
                      {db.databaseName.includes('PostgreSQL')
                        ? 'Master Baggage Records + Data Warehouse (Port 5433)'
                        : db.databaseName.includes('MongoDB')
                        ? 'High-Volume Scanner Telemetry (MongoDB Atlas Cloud)'
                        : 'Graph-Based Route Optimization (Neo4j / Dijkstra)'}
                    </td>
                    <td style={{ padding: '1rem 1.25rem', fontSize: '0.85rem', fontWeight: 700, color: '#0878F9' }}>
                      {db.latencyMs} ms
                    </td>
                    <td style={{ padding: '1rem 1.25rem' }}>
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

