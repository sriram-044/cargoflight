import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { HandlingPoint } from '../../types';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { LoadingSkeleton } from '../../components/feedback/LoadingSkeleton';
import {
  Building2,
  Power,
  RefreshCw,
  Radio,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ArrowRight,
  ShieldCheck,
  MapPin,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  getFriendlyLocationName,
  getLocationDescription,
  getFriendlyConnectedLocations,
} from '../../services/locationMapping';

export const HandlingPointsPage: React.FC = () => {
  const [points, setHandlingPoints] = useState<HandlingPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [selectedZone, setSelectedZone] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const { hasRole } = useAuth();
  const canEdit = hasRole(['SYSTEM_ADMIN', 'OPERATIONS_MANAGER']);

  const loadPoints = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await api.getHandlingPoints();
      setHandlingPoints(data);
    } catch (err: any) {
      setError('Failed to load baggage locations: ' + (err.message || 'Service unavailable'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPoints();
  }, []);

  const toggleStatus = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'MAINTENANCE' : 'ACTIVE';
    try {
      setUpdatingId(id);
      const updated = await api.updateHandlingPointStatus(id, nextStatus);
      setHandlingPoints(points.map((p) => (p.id === id ? { ...p, operationalStatus: updated.operationalStatus } : p)));
    } catch (err: any) {
      setError(err.message || 'Failed to update location status');
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredPoints = points.filter((p) => {
    if (selectedZone !== 'ALL' && p.zone !== selectedZone) return false;
    if (selectedCategory !== 'ALL' && p.category !== selectedCategory) return false;
    return true;
  });

  const totalCapacity = points.reduce((acc, p) => acc + (p.capacityPerHour || 0), 0);
  const activeCount = points.filter((p) => p.operationalStatus === 'ACTIVE').length;
  const maintenanceCount = points.filter((p) => p.operationalStatus !== 'ACTIVE').length;
  const totalScanners = points.reduce((acc, p) => acc + (p.activeScannerCount || 1), 0);

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1540px', margin: '0 auto', width: '100%' }}>
      {/* Airport Hero Header */}
      <div className="airport-hero">
        <div className="airport-hero-content">
          <div className="airport-hero-badge">
            <Building2 size={14} /> Airport Handling Infrastructure
          </div>
          <h1 className="airport-hero-title">
            Baggage Locations
          </h1>
          <p className="airport-hero-subtitle">
            Overview of all 11 baggage handling locations across check-in counters, automatic sorting, security screening, and baggage collection areas at Chennai Hub (MAA).
          </p>
        </div>

        <button onClick={loadPoints} className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', backgroundColor: 'rgba(255, 255, 255, 0.1)', color: '#FFFFFF', borderColor: 'rgba(255, 255, 255, 0.25)', backdropFilter: 'blur(4px)', position: 'relative', zIndex: 2 }}>
          <RefreshCw size={14} className={loading ? 'spin' : ''} />
          <span>Refresh Locations</span>
        </button>
      </div>

      {/* KPI Overview Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <div className="card" style={{ padding: '1.25rem', backgroundColor: '#FFFFFF', borderRadius: '12px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
            Active Locations
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#10B981', marginTop: '0.25rem' }}>
            {activeCount} <span style={{ fontSize: '0.9rem', color: '#64748B', fontWeight: 500 }}>/ {points.length}</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.2rem' }}>
            Operating normally
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem', backgroundColor: '#FFFFFF', borderRadius: '12px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
            Under Maintenance
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: maintenanceCount > 0 ? '#F59E0B' : '#64748B', marginTop: '0.25rem' }}>
            {maintenanceCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.2rem' }}>
            Baggage safely rerouted around
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem', backgroundColor: '#FFFFFF', borderRadius: '12px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
            System Hourly Capacity
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0878F9', marginTop: '0.25rem' }}>
            {totalCapacity.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.2rem' }}>
            Bags handled per hour
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem', backgroundColor: '#FFFFFF', borderRadius: '12px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
            Connected Scanners
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#00C2D7', marginTop: '0.25rem' }}>
            {totalScanners}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.2rem' }}>
            Barcode & RFID scanners active
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="card" style={{ padding: '1rem 1.25rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Filter size={16} color="#0878F9" />
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>Airport Zone:</span>
          <select
            className="form-select"
            style={{ width: 'auto', padding: '0.35rem 0.65rem', fontSize: '0.8rem', borderRadius: '6px' }}
            value={selectedZone}
            onChange={(e) => setSelectedZone(e.target.value)}
          >
            <option value="ALL">All Airport Zones</option>
            <option value="LANDSIDE_T2">Terminal 2 Check-in</option>
            <option value="SECURITY_CHECK">Security Screening</option>
            <option value="BASEMENT_BHS">Sorting Area (Basement)</option>
            <option value="AIRSIDE_RAMP">Aircraft Ramp Area</option>
            <option value="BAGGAGE_CLAIM">Baggage Collection Area</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>Location Type:</span>
          <select
            className="form-select"
            style={{ width: 'auto', padding: '0.35rem 0.65rem', fontSize: '0.8rem', borderRadius: '6px' }}
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="ALL">All Types</option>
            <option value="CHECKIN">Check-in Areas</option>
            <option value="SECURITY">Security Screening</option>
            <option value="SORTER">Sorting Systems</option>
            <option value="CONVEYOR">Connecting Conveyors</option>
            <option value="LOADING">Flight Loading Preparation</option>
            <option value="CLAIM">Baggage Collection</option>
          </select>
        </div>
      </div>

      {error && (
        <div style={{ padding: '1rem', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '10px', color: '#EF4444' }}>
          {error}
        </div>
      )}

      {loading ? (
        <LoadingSkeleton rows={6} />
      ) : (
        <div className="card" style={{ backgroundColor: '#FFFFFF', borderRadius: '12px' }}>
          <div className="table-responsive">
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#F8FAFD', borderBottom: '1px solid #E2E8F0', textAlign: 'left', color: '#64748B', fontSize: '0.75rem' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Location ID</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Baggage Location Name</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Type</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Airport Zone</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Hourly Capacity</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Scanners</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                  {canEdit && <th style={{ padding: '0.75rem 1rem' }}>Action</th>}
                </tr>
              </thead>
              <tbody>
                {filteredPoints.map((p) => (
                  <tr key={p.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span style={{ fontWeight: 800, color: '#0878F9', fontFamily: 'monospace' }}>
                        {p.id}
                      </span>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', maxWidth: '420px' }}>
                      <div style={{ fontWeight: 800, fontSize: '0.925rem', color: '#0F172A' }}>
                        {getFriendlyLocationName(p.id, p.name)}
                      </div>
                      <div style={{ fontSize: '0.785rem', color: '#475569', marginTop: '0.25rem', lineHeight: 1.45 }}>
                        {getLocationDescription(p.id, p.name)}
                      </div>
                      <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', display: 'flex', alignItems: 'flex-start', gap: '0.35rem', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 700, color: '#334155' }}>Connected locations:</span>
                        {getFriendlyConnectedLocations(p.connectedToIds).length > 0 ? (
                          <div style={{ display: 'inline-flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                            {getFriendlyConnectedLocations(p.connectedToIds).map((conn) => (
                              <span
                                key={conn.id}
                                style={{
                                  color: '#0878F9',
                                  backgroundColor: '#EFF6FF',
                                  padding: '0.15rem 0.45rem',
                                  borderRadius: '5px',
                                  border: '1px solid #DBEAFE',
                                  fontSize: '0.725rem',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.25rem',
                                }}
                              >
                                <span style={{ fontWeight: 600 }}>{conn.name}</span>
                                <span style={{ fontFamily: 'monospace', fontSize: '0.675rem', color: '#64748B' }}>
                                  ({conn.id})
                                </span>
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span style={{ color: '#94A3B8', fontStyle: 'italic' }}>Terminal Departure / Final Hand-off</span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <StatusBadge status={p.category} size="sm" />
                    </td>
                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: '#334155' }}>
                      {p.zone.replace(/_/g, ' ')}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#1E293B' }}>
                      {p.capacityPerHour.toLocaleString()} bags
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', color: '#10B981', fontWeight: 600 }}>
                        <Radio size={14} color="#10B981" />
                        <span>{p.activeScannerCount || 1} online</span>
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <StatusBadge status={p.operationalStatus} size="sm" />
                    </td>
                    {canEdit && (
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <button
                          onClick={() => toggleStatus(p.id, p.operationalStatus)}
                          disabled={updatingId === p.id}
                          className={`btn btn-sm ${p.operationalStatus === 'ACTIVE' ? 'btn-secondary' : 'btn-primary'}`}
                          style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                        >
                          <Power size={12} />
                          <span>{p.operationalStatus === 'ACTIVE' ? 'Set Maintenance' : 'Set Active'}</span>
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
