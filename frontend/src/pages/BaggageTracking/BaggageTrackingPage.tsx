import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '../../services/api';
import { Baggage, BaggageMovement } from '../../types';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { EmptyState } from '../../components/feedback/EmptyState';
import { LoadingSkeleton } from '../../components/feedback/LoadingSkeleton';
import {
  Search,
  Luggage,
  CheckCircle,
  Clock,
  ArrowRight,
  AlertTriangle,
  Barcode,
  Navigation,
  ShieldCheck,
  Plane,
} from 'lucide-react';

export const BaggageTrackingPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTag = searchParams.get('tag') || 'MAA6E008912';

  const [searchTag, setSearchTag] = useState(initialTag);
  const [baggage, setBaggage] = useState<Baggage | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const executeSearch = async (tag: string) => {
    if (!tag.trim()) return;
    setLoading(true);
    setError('');
    try {
      const data = await api.getBaggageByTag(tag.trim().toUpperCase());
      setBaggage(data);
      setSearchParams({ tag: data.baggageTag });
    } catch (err: any) {
      setError(err.message || 'Baggage tag not found in operational database');
      setBaggage(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialTag) {
      executeSearch(initialTag);
    }
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch(searchTag);
  };

  // Standard Linear Stages for visualization
  const allStages = [
    { key: 'REGISTERED', label: 'Registered' },
    { key: 'CHECKED_IN', label: 'Checked In' },
    { key: 'SECURITY_CLEARED', label: 'Security Screening' },
    { key: 'SORTED', label: 'Sorted Core' },
    { key: 'READY_FOR_LOADING', label: 'Ramp Staging' },
    { key: 'LOADED', label: 'Loaded on Flight' },
    { key: 'ARRIVED', label: 'Arrived at MAA' },
    { key: 'DELIVERED_TO_BELT', label: 'Reclaim Belt' },
  ];

  const getStageStatus = (stageKey: string, currentStatus: string) => {
    const stageOrder = allStages.map((s) => s.key);
    const currentIndex = stageOrder.indexOf(currentStatus);
    const thisIndex = stageOrder.indexOf(stageKey);

    if (currentStatus === 'EXCEPTION') {
      return thisIndex <= currentIndex ? 'completed' : 'pending';
    }
    if (thisIndex < currentIndex) return 'completed';
    if (thisIndex === currentIndex) return 'current';
    return 'pending';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>
          Baggage Tracking & Movement Audit Timeline
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '0.2rem' }}>
          Inspect immutable append-only scans, current checkpoint custody, and expected routing
        </p>
      </div>

      {/* Prominent Search Bar Card */}
      <div className="card" style={{ padding: '1.25rem' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.75rem' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <span style={{ position: 'absolute', left: '0.85rem', top: '0.7rem', color: '#94a3b8' }}>
              <Search size={18} />
            </span>
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '2.5rem', height: '42px', fontSize: '0.9375rem', fontWeight: 500 }}
              value={searchTag}
              onChange={(e) => setSearchTag(e.target.value)}
              placeholder="Search by Baggage Tag (e.g. MAA6E008912, MAAAI004120)..."
              required
            />
          </div>
          <button type="submit" disabled={loading} className="btn btn-primary" style={{ padding: '0 1.5rem' }}>
            {loading ? 'Searching...' : 'Locate Baggage'}
          </button>
        </form>

        {/* Quick Example Tags */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.75rem', fontSize: '0.75rem', color: '#64748b' }}>
          <span>Try sample tags:</span>
          {['MAA6E008912', 'MAAAI004120', 'MAAEXP00099', 'MAAINB00711'].map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => {
                setSearchTag(tag);
                executeSearch(tag);
              }}
              style={{
                background: '#f1f5f9',
                border: 'none',
                padding: '0.2rem 0.5rem',
                borderRadius: '4px',
                cursor: 'pointer',
                color: '#0369a1',
                fontWeight: 600,
              }}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div style={{ padding: '1rem', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#b91c1c' }}>
          {error}
        </div>
      )}

      {loading && <LoadingSkeleton rows={5} />}

      {baggage && !loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Identity & Status Overview Bar */}
          <div
            className="card"
            style={{
              padding: '1.5rem',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1.25rem',
              backgroundColor: '#ffffff',
            }}
          >
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>BAGGAGE TAG</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>{baggage.baggageTag}</div>
              <div style={{ marginTop: '0.35rem' }}>
                <StatusBadge status={baggage.currentStatus} />
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>FLIGHT & ROUTE</div>
              <div style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0f172a' }}>
                {baggage.flightNumber} &bull; {baggage.airlineName}
              </div>
              <div style={{ fontSize: '0.8125rem', color: '#0369a1', fontWeight: 600, marginTop: '0.2rem' }}>
                {baggage.originIata} &rarr; {baggage.destinationIata}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>PASSENGER MANIFEST</div>
              <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#0f172a' }}>{baggage.passengerName}</div>
              <div style={{ fontSize: '0.8125rem', color: '#64748b' }}>
                PNR: <strong>{baggage.passengerPnr}</strong> &bull; {baggage.weightKg} kg
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>CURRENT RECORDED CUSTODY</div>
              <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#0284c7' }}>
                {baggage.currentHandlingPointName || baggage.currentHandlingPointId || 'Inducted'}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>
                Last scan: {baggage.lastScanTime ? new Date(baggage.lastScanTime).toLocaleString('en-GB', { timeZone: 'Asia/Kolkata', hour12: false }) : 'N/A'}
              </div>
            </div>
          </div>

          {/* Expected vs Actual Distinct Notification */}
          <div
            style={{
              padding: '0.875rem 1.25rem',
              backgroundColor: '#f0f9ff',
              border: '1px solid #bae6fd',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <Navigation size={18} color="#0284c7" />
              <div style={{ fontSize: '0.875rem', color: '#0369a1' }}>
                <strong>Expected Next BHS Milestone:</strong> {baggage.expectedNextHandlingPointName} ({baggage.expectedNextHandlingPointId})
                <span style={{ fontSize: '0.75rem', color: '#64748b', marginLeft: '0.5rem' }}>
                  (Distinct from verified recorded physical scan)
                </span>
              </div>
            </div>

            <Link
              to={`/scans?tag=${baggage.baggageTag}`}
              className="btn btn-primary btn-sm"
            >
              <Barcode size={14} /> Scan / Update Now
            </Link>
          </div>

          {/* Linear Stage Progress Pipeline */}
          <div className="card" style={{ padding: '1.25rem' }}>
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, marginBottom: '1rem', color: '#0f172a' }}>
              Operational Stage Progression
            </h3>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', overflowX: 'auto', padding: '0.5rem 0' }}>
              {allStages.map((stage, idx) => {
                const statusState = getStageStatus(stage.key, baggage.currentStatus);
                let circleBg = '#e2e8f0';
                let circleColor = '#64748b';
                let circleBorder = '#cbd5e1';

                if (statusState === 'completed') {
                  circleBg = '#ecfdf5';
                  circleColor = '#059669';
                  circleBorder = '#a7f3d0';
                } else if (statusState === 'current') {
                  circleBg = '#0284c7';
                  circleColor = '#ffffff';
                  circleBorder = '#0284c7';
                }

                return (
                  <React.Fragment key={stage.key}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', minWidth: '95px' }}>
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          backgroundColor: circleBg,
                          color: circleColor,
                          border: `2px solid ${circleBorder}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          marginBottom: '0.35rem',
                        }}
                      >
                        {statusState === 'completed' ? '✓' : idx + 1}
                      </div>
                      <span style={{ fontSize: '0.75rem', fontWeight: statusState === 'current' ? 700 : 500, color: statusState === 'current' ? '#0284c7' : '#475569' }}>
                        {stage.label}
                      </span>
                    </div>

                    {idx < allStages.length - 1 && (
                      <div
                        style={{
                          flex: 1,
                          height: '3px',
                          backgroundColor: statusState === 'completed' ? '#059669' : '#e2e8f0',
                          minWidth: '20px',
                          marginBottom: '1rem',
                        }}
                      />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* Immutable Append-Only Movement History Table */}
          <div className="card">
            <div className="card-header">
              <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Immutable Movement Audit Trail</h3>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>PostgreSQL append-only transaction log</span>
            </div>

            <div className="card-body" style={{ padding: 0 }}>
              {(!baggage.movementHistory || baggage.movementHistory.length === 0) ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                  No movement events recorded yet.
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Event #</th>
                        <th>Timestamp (IST)</th>
                        <th>Checkpoint Node</th>
                        <th>Transition</th>
                        <th>Device / Scan Type</th>
                        <th>Operator</th>
                        <th>Operational Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {baggage.movementHistory.map((m, idx) => (
                        <tr key={m.id || idx}>
                          <td style={{ fontWeight: 600, color: '#64748b' }}>#{idx + 1}</td>
                          <td style={{ fontSize: '0.8125rem', whiteSpace: 'nowrap' }}>
                            {new Date(m.recordedAt).toLocaleString('en-GB', { timeZone: 'Asia/Kolkata', hour12: false })}
                          </td>
                          <td style={{ fontWeight: 600 }}>
                            {m.handlingPointName || m.handlingPointId}
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                              <StatusBadge status={m.statusBefore} size="sm" />
                              <span style={{ color: '#94a3b8' }}>&rarr;</span>
                              <StatusBadge status={m.statusAfter} size="sm" />
                            </div>
                          </td>
                          <td style={{ fontSize: '0.75rem', color: '#64748b' }}>
                            <div>{m.scannerId || 'MANUAL'}</div>
                            <span style={{ color: '#94a3b8' }}>{m.scanType}</span>
                          </td>
                          <td style={{ fontSize: '0.8125rem' }}>{m.operatorUsername}</td>
                          <td style={{ fontSize: '0.8125rem', color: '#334155' }}>{m.notes || '&mdash;'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
