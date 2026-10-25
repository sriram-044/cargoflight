import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '../../services/api';
import { HandlingPoint, ScanResultResponse, BaggageMovement } from '../../types';
import { StatusBadge } from '../../components/ui/StatusBadge';
import {
  Barcode,
  Radio,
  CheckCircle2,
  AlertCircle,
  RotateCw,
  Database,
  ArrowRight,
  ShieldCheck,
  Zap,
  Luggage,
  Clock,
  MapPin,
  Send,
} from 'lucide-react';
import { getFriendlyLocationName } from '../../services/locationMapping';

export const ScanUpdatePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const defaultTag = searchParams.get('tag') || 'MAA6E008912';

  const [baggageTag, setBaggageTag] = useState(defaultTag);
  const [handlingPoints, setHandlingPoints] = useState<HandlingPoint[]>([]);
  const [selectedPointId, setSelectedPointId] = useState('MAA-SECURITY-01');
  const [scannerId, setScannerId] = useState('SCN-MAA-SEC1');
  const [scanType, setScanType] = useState('FIXED_BARCODE');
  const [confidenceScore, setConfidenceScore] = useState(0.98);
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScanResultResponse | null>(null);
  const [error, setError] = useState('');
  const [recentScans, setRecentScans] = useState<BaggageMovement[]>([]);

  useEffect(() => {
    const initData = async () => {
      try {
        const [points, scans] = await Promise.all([
          api.getHandlingPoints(),
          api.getRecentScans(),
        ]);
        setHandlingPoints(points);
        setRecentScans(scans);
      } catch (err: any) {
        setError('Failed to load scanning stations: ' + (err.message || 'Service unavailable'));
      }
    };
    initData();
  }, []);

  const handlePointChange = (pointId: string) => {
    setSelectedPointId(pointId);
    const clean = pointId.replace('MAA-', '').replace('-0', '');
    setScannerId(`SCN-MAA-${clean}`);
  };

  const handleSubmitScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!baggageTag.trim()) {
      setError('Please provide a baggage tag number.');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await api.submitScan({
        baggageTag: baggageTag.trim().toUpperCase(),
        scannerId,
        handlingPointId: selectedPointId,
        scanType,
        opticalConfidenceScore: confidenceScore,
        notes: notes.trim() || undefined,
      });

      setResult(res);

      const updatedScans = await api.getRecentScans();
      setRecentScans(updatedScans);
    } catch (err: any) {
      setError(err.message || 'Scan was not accepted by airport handling rules.');
    } finally {
      setLoading(false);
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
              <span>BARCODE & RFID CHECKPOINT TELEMETRY</span>
            </div>
            <h1 className="airport-hero-title">Scanning Activity</h1>
            <p className="airport-hero-subtitle">
              Simulate or record laser barcode scans and RFID events as baggage navigates check-in, EDS screening, sorting carousels, and aircraft holds.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <Link
              to="/tracking"
              className="btn btn-primary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}
            >
              <Luggage size={14} />
              <span>Track Baggage Journey</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Outcome Banner */}
      {result && (
        <div
          style={{
            padding: '1.5rem',
            backgroundColor: result.duplicate ? '#FFFBEB' : '#ECFDF5',
            border: `1px solid ${result.duplicate ? '#FDE68A' : '#A7F3D0'}`,
            borderRadius: '14px',
            boxShadow: 'var(--shadow-card)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <CheckCircle2 size={26} color={result.duplicate ? '#D97706' : '#059669'} />
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.15rem', color: result.duplicate ? '#92400E' : '#065F46' }}>
                {result.duplicate ? 'Duplicate Scan Detected & Debounced' : 'Scan Recorded Successfully!'}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#334155', marginTop: '0.2rem' }}>
                {result.message}
              </div>
            </div>
          </div>

          {/* Database Persistence Verification Badges */}
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', paddingTop: '0.5rem', borderTop: `1px solid ${result.duplicate ? '#FDE68A' : '#A7F3D0'}` }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                fontSize: '0.785rem',
                fontWeight: 700,
                padding: '0.35rem 0.75rem',
                borderRadius: '6px',
                backgroundColor: result.operationalPersistedPostgres ? '#ECFDF5' : '#FEF2F2',
                color: result.operationalPersistedPostgres ? '#065F46' : '#991B1B',
                border: `1px solid ${result.operationalPersistedPostgres ? '#A7F3D0' : '#FECACA'}`,
              }}
            >
              <Database size={14} />
              PostgreSQL Core Record: {result.operationalPersistedPostgres ? 'UPDATED (Port 5433)' : 'NOT UPDATED'}
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                fontSize: '0.785rem',
                fontWeight: 700,
                padding: '0.35rem 0.75rem',
                borderRadius: '6px',
                backgroundColor: result.telemetryPersistedMongo ? '#F0FDF4' : '#F8FAFC',
                color: result.telemetryPersistedMongo ? '#166534' : '#64748B',
                border: `1px solid ${result.telemetryPersistedMongo ? '#BBF7D0' : '#E2E8F0'}`,
              }}
            >
              <Database size={14} />
              MongoDB Telemetry Stream: {result.telemetryPersistedMongo ? 'RECORDED (Atlas Cloud)' : 'STANDBY'}
            </div>

            <Link
              to={`/tracking?tag=${result.baggageTag}`}
              className="btn btn-primary btn-sm"
              style={{
                marginLeft: 'auto',
                fontSize: '0.8rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
            >
              <span>View Updated Baggage Journey</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      )}

      {error && (
        <div style={{ padding: '1rem 1.25rem', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '10px', color: '#B91C1C', fontSize: '0.875rem' }}>
          {error}
        </div>
      )}

      {/* Main Grid: Scan Form & Recent Scans */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.25fr) minmax(0, 1fr)', gap: '1.5rem' }}>
        {/* Left: Scan Form */}
        <div className="card" style={{ backgroundColor: '#FFFFFF', borderRadius: '14px', boxShadow: 'var(--shadow-card)', overflow: 'hidden' }}>
          <div className="card-header" style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#14233B' }}>Record Station Scan</h3>
              <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Fixed & Handheld Barcode / RFID Checkpoint Console</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: '#059669', fontWeight: 700, backgroundColor: '#ECFDF5', padding: '0.25rem 0.65rem', borderRadius: '6px' }}>
              <span className="pulse-dot" style={{ backgroundColor: '#10B981', width: '6px', height: '6px' }}></span>
              <span>Ingestion Live</span>
            </div>
          </div>

          <div className="card-body" style={{ padding: '1.5rem' }}>
            <form onSubmit={handleSubmitScan} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="tag" style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                  Baggage Tag Number *
                </label>
                <div style={{ position: 'relative' }}>
                  <Barcode size={18} style={{ position: 'absolute', left: '0.85rem', top: '0.75rem', color: '#94A3B8' }} />
                  <input
                    id="tag"
                    type="text"
                    className="form-input"
                    value={baggageTag}
                    onChange={(e) => setBaggageTag(e.target.value)}
                    placeholder="e.g. MAA6E008912, BAG1001"
                    style={{ height: '44px', borderRadius: '8px', paddingLeft: '2.5rem', fontWeight: 700, fontSize: '0.95rem' }}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="point" style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                  Baggage Location Checkpoint *
                </label>
                <select
                  id="point"
                  className="form-select"
                  value={selectedPointId}
                  onChange={(e) => handlePointChange(e.target.value)}
                  style={{ height: '44px', borderRadius: '8px' }}
                  required
                >
                  {handlingPoints.map((p) => (
                    <option key={p.id} value={p.id}>
                      {getFriendlyLocationName(p.id, p.name)} [{p.id}]
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="device" style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                    Scanner Station ID
                  </label>
                  <input
                    id="device"
                    type="text"
                    className="form-input"
                    value={scannerId}
                    onChange={(e) => setScannerId(e.target.value)}
                    style={{ height: '42px', borderRadius: '8px' }}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="type" style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                    Scanner Sensor Type
                  </label>
                  <select
                    id="type"
                    className="form-select"
                    value={scanType}
                    onChange={(e) => setScanType(e.target.value)}
                    style={{ height: '42px', borderRadius: '8px' }}
                  >
                    <option value="FIXED_BARCODE">Fixed Laser Conveyor Scanner</option>
                    <option value="RFID_PORTAL">RFID Overhead Antenna</option>
                    <option value="MANUAL_HANDHELD">Ramp Handheld Terminal</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="form-label" style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                    Scan Optical Confidence
                  </label>
                  <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0878F9' }}>
                    {Math.round(confidenceScore * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  step="0.01"
                  min="0.5"
                  max="1.0"
                  value={confidenceScore}
                  onChange={(e) => setConfidenceScore(parseFloat(e.target.value))}
                  style={{ width: '100%', accentColor: '#0878F9' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                  Handling Note (Optional)
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Scanned and verified by ground crew"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  style={{ height: '42px', borderRadius: '8px' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary"
                  style={{
                    padding: '0.75rem 2rem',
                    fontWeight: 700,
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <Send size={15} />
                  <span>{loading ? 'Recording Scan...' : 'Record Checkpoint Scan'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right: Recent Scans */}
        <div className="card" style={{ backgroundColor: '#FFFFFF', borderRadius: '14px', boxShadow: 'var(--shadow-card)', overflow: 'hidden' }}>
          <div className="card-header" style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#14233B' }}>Recent Scanning Activity</h3>
            <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>Live Feed</span>
          </div>

          <div className="card-body" style={{ padding: 0 }}>
            {recentScans.length === 0 ? (
              <div style={{ padding: '4rem 2rem', textAlign: 'center', color: '#64748B' }}>
                <Barcode size={36} style={{ margin: '0 auto 0.75rem', opacity: 0.4 }} />
                <div style={{ fontWeight: 600 }}>No recent scans recorded.</div>
                <p style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>Enter a tag on the left to submit a scan.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {recentScans.slice(0, 8).map((scan) => (
                  <div
                    key={scan.id}
                    style={{
                      padding: '1rem 1.25rem',
                      borderBottom: '1px solid #F1F5F9',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      transition: 'background-color 0.15s ease',
                    }}
                  >
                    <div>
                      <Link
                        to={`/tracking?tag=${scan.baggageTag}`}
                        style={{ fontWeight: 800, color: '#0878F9', textDecoration: 'none', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                      >
                        <Luggage size={14} />
                        <span>{scan.baggageTag}</span>
                      </Link>
                      <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.25rem' }}>
                        {getFriendlyLocationName(scan.handlingPointId, scan.handlingPointName)} &bull; Scanner: <code>{scan.scannerId || 'Station'}</code>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <StatusBadge status={scan.statusAfter} size="sm" />
                      <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '0.3rem', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.25rem' }}>
                        <Clock size={12} />
                        <span>{new Date(scan.recordedAt).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

