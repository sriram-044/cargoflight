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
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

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
      setError('Failed to load handling points: ' + err.message);
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
      setError(err.message || 'Failed to update handling point status');
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
            <Building2 size={22} color="#0878F9" />
            <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#14233B' }}>
              Terminal & Handling Zone Management
            </h1>
          </div>
          <p style={{ color: '#64748B', fontSize: '0.85rem', marginTop: '0.25rem' }}>
            Chennai Airport (MAA) Terminals, Zones, Conveyor Belts, Screening Points, and Gate Loading Bays.
          </p>
        </div>

        <button onClick={loadPoints} className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <RefreshCw size={14} className={loading ? 'spin' : ''} />
          <span>Refresh Checkpoints</span>
        </button>
      </div>

      {/* KPI Overview Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
            Active Facilities
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#10B981', marginTop: '0.25rem' }}>
            {activeCount} <span style={{ fontSize: '0.9rem', color: '#64748B', fontWeight: 500 }}>/ {points.length}</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.2rem' }}>
            Operational checkpoints online
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
            In Maintenance
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: maintenanceCount > 0 ? '#F59E0B' : '#64748B', marginTop: '0.25rem' }}>
            {maintenanceCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.2rem' }}>
            Facilities routed around in graph
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
            Total System Capacity
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0878F9', marginTop: '0.25rem' }}>
            {totalCapacity.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.2rem' }}>
            Bags per hour design throughput
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
            Connected Scanners
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#00C2D7', marginTop: '0.25rem' }}>
            {totalScanners}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.2rem' }}>
            RFID & Optical Readers online
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="card" style={{ padding: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Filter size={16} color="#0878F9" />
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>Filter By Zone:</span>
          <select
            className="form-select"
            style={{ width: 'auto', padding: '0.35rem 0.65rem', fontSize: '0.8rem' }}
            value={selectedZone}
            onChange={(e) => setSelectedZone(e.target.value)}
          >
            <option value="ALL">All Zones</option>
            <option value="LANDSIDE_T2">Landside T2</option>
            <option value="SECURITY_CHECK">Security Screening</option>
            <option value="BASEMENT_BHS">Basement BHS Sorter</option>
            <option value="AIRSIDE_RAMP">Airside Ramp</option>
            <option value="BAGGAGE_CLAIM">Baggage Claim Reclaim</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>Category:</span>
          <select
            className="form-select"
            style={{ width: 'auto', padding: '0.35rem 0.65rem', fontSize: '0.8rem' }}
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="ALL">All Categories</option>
            <option value="CHECKIN">Check-in Desks</option>
            <option value="SECURITY">Security Screening</option>
            <option value="SORTER">Automated Sorters</option>
            <option value="CONVEYOR">Conveyor Belts</option>
            <option value="LOADING">Aircraft Loading Bays</option>
            <option value="CLAIM">Claim Carousels</option>
          </select>
        </div>
      </div>

      {error && (
        <div style={{ padding: '1rem', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', color: '#EF4444' }}>
          {error}
        </div>
      )}

      {loading ? (
        <LoadingSkeleton rows={6} />
      ) : (
        <div className="card">
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Checkpoint ID</th>
                  <th>Facility Name</th>
                  <th>Category</th>
                  <th>Airport Zone</th>
                  <th>Capacity / Hr</th>
                  <th>Scanners</th>
                  <th>Status</th>
                  {canEdit && <th>Action</th>}
                </tr>
              </thead>
              <tbody>
                {filteredPoints.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <span style={{ fontWeight: 800, color: '#0878F9', fontFamily: 'monospace' }}>
                        {p.id}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: '#14233B' }}>{p.name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                        Feeds into: {(p.connectedToIds || []).join(', ') || 'Aircraft / Passenger Collection'}
                      </div>
                    </td>
                    <td>
                      <StatusBadge status={p.category} size="sm" />
                    </td>
                    <td style={{ fontSize: '0.8125rem', color: '#334155', fontWeight: 500 }}>
                      {p.zone.replace(/_/g, ' ')}
                    </td>
                    <td style={{ fontWeight: 700, color: '#1E293B' }}>
                      {p.capacityPerHour.toLocaleString()} bags
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8125rem', color: '#10B981', fontWeight: 600 }}>
                        <Radio size={14} color="#10B981" />
                        <span>{p.activeScannerCount || 1} online</span>
                      </div>
                    </td>
                    <td>
                      <StatusBadge status={p.operationalStatus} size="sm" />
                    </td>
                    {canEdit && (
                      <td>
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
