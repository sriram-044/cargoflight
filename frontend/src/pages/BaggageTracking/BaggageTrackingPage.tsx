import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '../../services/api';
import { Baggage, BaggageMovement } from '../../types';
import { StatusBadge } from '../../components/ui/StatusBadge';
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
  MapPin,
  Calendar,
  User,
  Info,
  RotateCw,
} from 'lucide-react';
import { getFriendlyLocationName } from '../../services/locationMapping';

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
      if (err.message && err.message.toLowerCase().includes('not found')) {
        setError('No matching baggage record was found. Check the tracking number and try again.');
      } else {
        setError("We couldn't connect to the service. Please try again later.");
      }
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

  // Standard user-friendly journey stages
  const journeyStages = [
    { key: 'REGISTERED', label: 'Baggage Registered', icon: Luggage, desc: 'Tag printed & assigned' },
    { key: 'CHECKED_IN', label: 'Checked In', icon: MapPin, desc: 'Accepted at counter' },
    { key: 'SECURITY_CLEARED', label: 'Security Check', icon: ShieldCheck, desc: 'X-ray screening cleared' },
    { key: 'SORTED', label: 'Sorted for Flight', icon: Navigation, desc: 'Directed to flight carousel' },
    { key: 'READY_FOR_LOADING', label: 'Waiting to Load', icon: Clock, desc: 'At aircraft ramp' },
    { key: 'LOADED', label: 'Loaded Onto Aircraft', icon: Plane, desc: 'Safely onboard flight' },
    { key: 'ARRIVED', label: 'Arrived at Destination', icon: MapPin, desc: 'Flight touched down' },
    { key: 'DELIVERED_TO_BELT', label: 'Baggage Collection Belt', icon: CheckCircle, desc: 'Ready for pick up' },
  ];

  const getStageStatus = (stageKey: string, currentStatus: string) => {
    const stageOrder = journeyStages.map((s) => s.key);
    const currentIndex = stageOrder.indexOf(currentStatus);
    const thisIndex = stageOrder.indexOf(stageKey);

    if (currentStatus === 'EXCEPTION' || currentStatus === 'SECURITY_REJECT') {
      return thisIndex <= 2 ? 'completed' : 'pending';
    }
    if (thisIndex < currentIndex) return 'completed';
    if (thisIndex === currentIndex) return 'current';
    return 'pending';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1540px', margin: '0 auto', width: '100%', padding: '1rem 0' }}>
      {/* Page Header */}
      <div className="airport-hero" style={{ padding: '1.75rem 2rem' }}>
        <div className="airport-hero-content">
          <div className="airport-hero-badge">
            <Luggage size={14} /> Live Baggage Radar
          </div>
          <h1 className="airport-hero-title">
            Where is your baggage?
          </h1>
          <p className="airport-hero-subtitle">
            Enter your baggage tracking number to view its real-time journey step-by-step from check-in counter to aircraft hold and baggage claim belt.
          </p>
        </div>
      </div>

      {/* Prominent Search Card */}
      <div className="card" style={{ padding: '1.5rem', backgroundColor: '#FFFFFF', borderRadius: '14px', boxShadow: '0 4px 16px rgba(15, 23, 42, 0.05)' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '280px' }}>
            <span style={{ position: 'absolute', left: '1rem', top: '0.85rem', color: '#94A3B8' }}>
              <Search size={18} />
            </span>
            <input
              type="text"
              className="form-input"
              style={{
                paddingLeft: '2.75rem',
                height: '46px',
                fontSize: '0.95rem',
                fontWeight: 600,
                borderRadius: '10px',
                border: '1.5px solid #CBD5E1',
                width: '100%',
                backgroundColor: '#F8FAFC',
              }}
              value={searchTag}
              onChange={(e) => setSearchTag(e.target.value)}
              placeholder="Enter baggage tracking number (e.g. MAA6E008912, BAG1001, CARGO-CF-903)"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{
              padding: '0 1.75rem',
              height: '46px',
              fontWeight: 700,
              fontSize: '0.9rem',
              borderRadius: '10px',
              backgroundColor: '#0878F9',
              borderColor: '#0878F9',
              boxShadow: '0 0 16px rgba(8, 120, 249, 0.35)',
            }}
          >
            {loading ? 'Searching...' : 'Track My Baggage'}
          </button>
        </form>

        {/* Quick Sample Tags */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginTop: '1rem', fontSize: '0.8rem', color: '#64748B', flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 600 }}>Try quick sample tags:</span>
          {['MAA6E008912', 'BAG1001', 'CARGO-CF-903', 'MAAAI004120', 'MAAEXP00099'].map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => {
                setSearchTag(tag);
                executeSearch(tag);
              }}
              style={{
                backgroundColor: '#EFF6FF',
                border: '1px solid #DBEAFE',
                padding: '0.25rem 0.65rem',
                borderRadius: '6px',
                cursor: 'pointer',
                color: '#0878F9',
                fontWeight: 700,
                fontSize: '0.75rem',
                transition: 'all 120ms ease',
              }}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div
          style={{
            padding: '1.25rem',
            backgroundColor: '#FEF2F2',
            border: '1px solid #FECACA',
            borderRadius: '12px',
            color: '#B91C1C',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
          }}
        >
          <AlertTriangle size={22} color="#DC2626" style={{ flexShrink: 0 }} />
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Baggage Not Found</div>
            <div style={{ fontSize: '0.85rem', marginTop: '0.2rem', color: '#7F1D1D' }}>{error}</div>
          </div>
        </div>
      )}

      {loading && <LoadingSkeleton rows={5} />}

      {baggage && !loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Prominent Delayed / Attention Alert if applicable */}
          {(baggage.delayed || baggage.misrouted) && (
            <div
              style={{
                padding: '1.15rem 1.4rem',
                backgroundColor: '#FFFBEB',
                border: '1px solid #FDE68A',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <AlertTriangle size={22} />
                </div>
                <div>
                  <div style={{ fontWeight: 800, color: '#92400E', fontSize: '0.95rem' }}>
                    {baggage.delayed ? 'Baggage Movement Delayed' : 'Rerouting in Progress'}
                  </div>
                  <div style={{ fontSize: '0.825rem', color: '#B45309', marginTop: '0.2rem' }}>
                    {baggage.delayed
                      ? 'The bag has spent longer than expected between scans. Airport operations staff have been alerted to inspect its conveyor checkpoint.'
                      : 'This baggage was sorted for an alternate conveyor chute and is being verified by ground handling staff.'}
                  </div>
                </div>
              </div>

              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#B45309', backgroundColor: '#FEF3C7', padding: '0.35rem 0.75rem', borderRadius: '6px' }}>
                Priority Action Flagged
              </span>
            </div>
          )}

          {/* Identity & Status Overview Banner */}
          <div
            className="card"
            style={{
              padding: '1.75rem',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '1.5rem',
              backgroundColor: '#FFFFFF',
              borderRadius: '14px',
              borderLeft: '5px solid #0878F9',
              boxShadow: '0 4px 16px rgba(15, 23, 42, 0.04)',
            }}
          >
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Baggage Tag
              </div>
              <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0F172A', marginTop: '0.2rem', fontFamily: 'var(--font-display)' }}>
                {baggage.baggageTag}
              </div>
              <div style={{ marginTop: '0.5rem' }}>
                <StatusBadge status={baggage.currentStatus} />
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Assigned Flight
              </div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F172A', marginTop: '0.2rem' }}>
                {baggage.flightNumber}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginTop: '0.4rem' }}>
                <span className="airport-code-tag">{baggage.originIata}</span>
                <span style={{ color: '#0878F9', fontSize: '0.8rem' }}>&rarr;</span>
                <span className="airport-code-tag">{baggage.destinationIata}</span>
                <span style={{ fontSize: '0.75rem', color: '#64748B', marginLeft: '0.35rem' }}>{baggage.airlineName}</span>
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Passenger Details
              </div>
              <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0F172A', marginTop: '0.2rem' }}>
                {baggage.passengerName}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '0.35rem' }}>
                Booking Ref (PNR): <strong style={{ color: '#0F172A' }}>{baggage.passengerPnr}</strong> &bull; Weight: {baggage.weightKg} kg
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Latest Verified Location
              </div>
              <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0878F9', marginTop: '0.2rem' }}>
                {getFriendlyLocationName(baggage.currentHandlingPointId, baggage.currentHandlingPointName)}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.35rem' }}>
                {baggage.lastScanTime ? `Last scan: ${new Date(baggage.lastScanTime).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true })}` : 'Check-in recorded'}
              </div>
            </div>
          </div>

          {/* Expected Next Step Notification */}
          {(baggage.expectedNextHandlingPointName || baggage.expectedNextHandlingPointId) && (
            <div
              style={{
                padding: '1rem 1.25rem',
                backgroundColor: '#EFF6FF',
                border: '1px solid #BFDBFE',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.75rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Navigation size={20} color="#0878F9" />
                <div style={{ fontSize: '0.875rem', color: '#1E40AF' }}>
                  <strong>Next Baggage Location:</strong> {getFriendlyLocationName(baggage.expectedNextHandlingPointId, baggage.expectedNextHandlingPointName)}
                  <span style={{ fontSize: '0.75rem', color: '#64748B', marginLeft: '0.5rem' }}>
                    (Automated routing checkpoint)
                  </span>
                </div>
              </div>

              <Link
                to={`/scans?tag=${baggage.baggageTag}`}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '0.75rem' }}
              >
                <Barcode size={14} /> Update Status (Staff)
              </Link>
            </div>
          )}

          {/* Baggage Journey Timeline */}
          <div className="card" style={{ padding: '1.75rem', backgroundColor: '#FFFFFF', borderRadius: '12px' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.5rem', color: '#0F172A' }}>
              Baggage Journey Timeline
            </h3>
            <p style={{ color: '#64748B', fontSize: '0.8rem', marginBottom: '1.5rem' }}>
              Follow your bag's real-time progression from check-in to arrival.
            </p>

            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', overflowX: 'auto', padding: '0.75rem 0 1.25rem' }}>
              {journeyStages.map((stage, idx) => {
                const statusState = getStageStatus(stage.key, baggage.currentStatus);
                let circleBg = '#F1F5F9';
                let circleColor = '#64748B';
                let circleBorder = '#CBD5E1';

                if (statusState === 'completed') {
                  circleBg = '#ECFDF5';
                  circleColor = '#059669';
                  circleBorder = '#A7F3D0';
                } else if (statusState === 'current') {
                  circleBg = '#0878F9';
                  circleColor = '#FFFFFF';
                  circleBorder = '#0878F9';
                }

                return (
                  <React.Fragment key={stage.key}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', minWidth: '105px' }}>
                      <div
                        style={{
                          width: '38px',
                          height: '38px',
                          borderRadius: '50%',
                          backgroundColor: circleBg,
                          color: circleColor,
                          border: `2px solid ${circleBorder}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.85rem',
                          fontWeight: 700,
                          marginBottom: '0.5rem',
                          boxShadow: statusState === 'current' ? '0 0 10px rgba(8, 120, 249, 0.4)' : 'none',
                        }}
                      >
                        {statusState === 'completed' ? '✓' : idx + 1}
                      </div>
                      <span
                        style={{
                          fontSize: '0.775rem',
                          fontWeight: statusState === 'current' ? 700 : 600,
                          color: statusState === 'current' ? '#0878F9' : statusState === 'completed' ? '#059669' : '#64748B',
                        }}
                      >
                        {stage.label}
                      </span>
                      <span style={{ fontSize: '0.675rem', color: '#94A3B8', marginTop: '0.2rem' }}>
                        {stage.desc}
                      </span>
                    </div>

                    {idx < journeyStages.length - 1 && (
                      <div
                        style={{
                          flex: 1,
                          height: '3px',
                          backgroundColor: statusState === 'completed' ? '#10B981' : '#E2E8F0',
                          minWidth: '24px',
                          marginTop: '19px',
                        }}
                      />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* Activity History Table */}
          <div className="card" style={{ backgroundColor: '#FFFFFF', borderRadius: '12px' }}>
            <div className="card-header" style={{ padding: '1.25rem', borderBottom: '1px solid #E2E8F0' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0F172A' }}>Activity History</h3>
              <span style={{ fontSize: '0.785rem', color: '#64748B' }}>
                Chronological record of every scan and location update for this bag.
              </span>
            </div>

            <div className="card-body" style={{ padding: 0 }}>
              {!baggage.movementHistory || baggage.movementHistory.length === 0 ? (
                <div style={{ padding: '2.5rem', textAlign: 'center', color: '#64748B' }}>
                  No movement scans recorded yet for this bag.
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#F8FAFD', borderBottom: '1px solid #E2E8F0', textAlign: 'left', color: '#64748B', fontSize: '0.75rem' }}>
                        <th style={{ padding: '0.75rem 1rem' }}>#</th>
                        <th style={{ padding: '0.75rem 1rem' }}>Time</th>
                        <th style={{ padding: '0.75rem 1rem' }}>Baggage Location</th>
                        <th style={{ padding: '0.75rem 1rem' }}>Status Update</th>
                        <th style={{ padding: '0.75rem 1rem' }}>Scanner / Operator</th>
                        <th style={{ padding: '0.75rem 1rem' }}>Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {baggage.movementHistory.map((m, idx) => (
                        <tr key={m.id || idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                          <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#94A3B8', fontSize: '0.75rem' }}>
                            {idx + 1}
                          </td>
                          <td style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', whiteSpace: 'nowrap', color: '#334155' }}>
                            {new Date(m.recordedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true })}
                          </td>
                          <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#0F172A' }}>
                            <div>{getFriendlyLocationName(m.handlingPointId, m.handlingPointName)}</div>
                            {m.handlingPointId && (
                              <div style={{ fontSize: '0.7rem', color: '#64748B', fontFamily: 'monospace', marginTop: '0.1rem' }}>
                                {m.handlingPointId}
                              </div>
                            )}
                          </td>
                          <td style={{ padding: '0.75rem 1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                              <StatusBadge status={m.statusBefore} size="sm" />
                              <span style={{ color: '#94A3B8' }}>&rarr;</span>
                              <StatusBadge status={m.statusAfter} size="sm" />
                            </div>
                          </td>
                          <td style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', color: '#64748B' }}>
                            <div>{m.scannerId || 'Station Scanner'}</div>
                            <span style={{ color: '#94A3B8' }}>{m.operatorUsername || 'Operations Team'}</span>
                          </td>
                          <td style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: '#475569' }}>
                            {m.notes || 'Normal progression'}
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
      )}
    </div>
  );
};
