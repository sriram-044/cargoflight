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
} from 'lucide-react';

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
        setError('Failed to initialize scan console: ' + err.message);
      }
    };
    initData();
  }, []);

  const handlePointChange = (pointId: string) => {
    setSelectedPointId(pointId);
    // Auto-select realistic scanner id based on point
    const clean = pointId.replace('MAA-', '').replace('-0', '');
    setScannerId(`SCN-MAA-${clean}`);
  };

  const handleSubmitScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!baggageTag.trim()) {
      setError('Please provide a baggage tag.');
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

      // Refresh recent scans
      const updatedScans = await api.getRecentScans();
      setRecentScans(updatedScans);
    } catch (err: any) {
      setError(err.message || 'Scan processing rejected by operational rules');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>
          Optical / RFID Scan Ingestion Console
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '0.2rem' }}>
          Simulated optical tunnel scanners, RFID gates, and handheld ramp terminals at Chennai MAA
        </p>
      </div>

      {/* Outcome Banner */}
      {result && (
        <div
          style={{
            padding: '1.25rem',
            backgroundColor: result.duplicate ? '#fffbeb' : '#ecfdf5',
            border: `1px solid ${result.duplicate ? '#fde68a' : '#a7f3d0'}`,
            borderRadius: '10px',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <CheckCircle2 size={22} color={result.duplicate ? '#d97706' : '#059669'} />
            <div style={{ fontWeight: 700, fontSize: '1rem', color: result.duplicate ? '#92400e' : '#065f46' }}>
              {result.duplicate ? 'Duplicate Telemetry Event Ignored' : 'Scan Processed & Persisted!'}
            </div>
          </div>

          <div style={{ fontSize: '0.875rem', color: '#334155' }}>
            {result.message}
          </div>

          {/* Database Persistence Verification Badges */}
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', paddingTop: '0.25rem' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.75rem',
                fontWeight: 600,
                padding: '0.25rem 0.6rem',
                borderRadius: '6px',
                backgroundColor: result.operationalPersistedPostgres ? '#ecfdf5' : '#fef2f2',
                color: result.operationalPersistedPostgres ? '#065f46' : '#991b1b',
                border: `1px solid ${result.operationalPersistedPostgres ? '#a7f3d0' : '#fecaca'}`,
              }}
            >
              <Database size={13} />
              PostgreSQL Operational State: {result.operationalPersistedPostgres ? 'UPDATED' : 'NOT UPDATED'}
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.75rem',
                fontWeight: 600,
                padding: '0.25rem 0.6rem',
                borderRadius: '6px',
                backgroundColor: result.telemetryPersistedMongo ? '#f0fdf4' : '#f8fafc',
                color: result.telemetryPersistedMongo ? '#166534' : '#64748b',
                border: `1px solid ${result.telemetryPersistedMongo ? '#bbf7d0' : '#e2e8f0'}`,
              }}
            >
              <Database size={13} />
              MongoDB Telemetry Raw Event: {result.telemetryPersistedMongo ? 'INGESTED' : 'OFFLINE / DISABLED'}
            </div>

            <Link
              to={`/tracking?tag=${result.baggageTag}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.75rem',
                fontWeight: 600,
                color: '#0284c7',
                marginLeft: 'auto',
              }}
            >
              View Updated Timeline &rarr;
            </Link>
          </div>
        </div>
      )}

      {error && (
        <div style={{ padding: '1rem', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#b91c1c' }}>
          {error}
        </div>
      )}

      {/* Main Grid: Scan Submission Form & Recent Event Log */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem' }}>
        {/* Left: Scan Ingestion Form */}
        <div className="card">
          <div className="card-header">
            <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Scanner Ingestion Console</h3>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Simulated Event Generator</span>
          </div>

          <div className="card-body">
            <form onSubmit={handleSubmitScan} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="tag">
                  Baggage Tag *
                </label>
                <input
                  id="tag"
                  type="text"
                  className="form-input"
                  value={baggageTag}
                  onChange={(e) => setBaggageTag(e.target.value)}
                  placeholder="e.g. MAA6E008912"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="point">
                  Checkpoint / Handling Point *
                </label>
                <select
                  id="point"
                  className="form-select"
                  value={selectedPointId}
                  onChange={(e) => handlePointChange(e.target.value)}
                  required
                >
                  {handlingPoints.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.id} &mdash; {p.name} ({p.category})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="device">
                    Scanner Device ID *
                  </label>
                  <input
                    id="device"
                    type="text"
                    className="form-input"
                    value={scannerId}
                    onChange={(e) => setScannerId(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="type">
                    Scan Mechanism *
                  </label>
                  <select
                    id="type"
                    className="form-select"
                    value={scanType}
                    onChange={(e) => setScanType(e.target.value)}
                  >
                    <option value="FIXED_BARCODE">Fixed Laser / Optical Barcode</option>
                    <option value="FIXED_RFID">Fixed RFID Tunnel Reader</option>
                    <option value="MOBILE_TERMINAL">Handheld Mobile Ramp Terminal</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="notes">
                  Operational Event Notes (Optional)
                </label>
                <input
                  id="notes"
                  type="text"
                  className="form-input"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Cleared Level 1 X-Ray screening line"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
                style={{ padding: '0.65rem', marginTop: '0.5rem' }}
              >
                {loading ? 'Transmitting Scan Event...' : 'Submit Scanner Telemetry Event'}
              </button>
            </form>
          </div>
        </div>

        {/* Right: Recent Scans Table */}
        <div className="card">
          <div className="card-header">
            <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Recent Persisted Scans</h3>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>PostgreSQL Event Stream</span>
          </div>

          <div className="card-body" style={{ padding: 0 }}>
            {recentScans.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                No scan events recorded yet.
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Time (IST)</th>
                      <th>Tag</th>
                      <th>New Status</th>
                      <th>Location</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentScans.slice(0, 10).map((s) => (
                      <tr key={s.id}>
                        <td style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          {new Date(s.recordedAt).toLocaleTimeString('en-GB', { timeZone: 'Asia/Kolkata', hour12: false })}
                        </td>
                        <td>
                          <Link to={`/tracking?tag=${s.baggageTag}`} style={{ fontWeight: 600 }}>
                            {s.baggageTag}
                          </Link>
                        </td>
                        <td>
                          <StatusBadge status={s.statusAfter} size="sm" />
                        </td>
                        <td style={{ fontSize: '0.75rem' }}>
                          {s.handlingPointName || s.handlingPointId}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
