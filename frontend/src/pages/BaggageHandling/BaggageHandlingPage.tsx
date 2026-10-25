import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Baggage, HandlingPoint } from '../../types';
import { StatusBadge } from '../../components/ui/StatusBadge';
import {
  Layers,
  Search,
  Filter,
  CheckCircle2,
  ArrowRight,
  AlertTriangle,
  Clock,
  ShieldCheck,
  PlaneTakeoff,
  Luggage,
  MapPin,
  RefreshCw,
  X,
  Plane,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { getFriendlyLocationName } from '../../services/locationMapping';

const STAGES = [
  { key: 'ALL', label: 'All Stages' },
  { key: 'REGISTERED', label: 'Registered' },
  { key: 'CHECKED_IN', label: 'Checked In' },
  { key: 'SECURITY_CLEARED', label: 'Security Check' },
  { key: 'SORTED', label: 'Sorted for Flight' },
  { key: 'IN_TRANSIT', label: 'In Transit' },
  { key: 'READY_FOR_LOADING', label: 'Waiting to Load' },
  { key: 'LOADED', label: 'Loaded on Aircraft' },
  { key: 'ARRIVED', label: 'Arrived at Destination' },
  { key: 'DELIVERED_TO_BELT', label: 'At Baggage Belt' },
  { key: 'CLAIMED', label: 'Collected' },
];

const VALID_NEXT_STEPS: Record<string, string[]> = {
  REGISTERED: ['CHECKED_IN'],
  CHECKED_IN: ['SECURITY_CLEARED', 'SECURITY_HELD'],
  SECURITY_HELD: ['SECURITY_CLEARED'],
  SECURITY_CLEARED: ['SORTED', 'IN_TRANSIT'],
  SORTED: ['READY_FOR_LOADING', 'IN_TRANSIT'],
  IN_TRANSIT: ['READY_FOR_LOADING', 'LOADED'],
  READY_FOR_LOADING: ['LOADED'],
  LOADED: ['ARRIVED'],
  ARRIVED: ['DELIVERED_TO_BELT', 'CLAIMED'],
  DELIVERED_TO_BELT: ['CLAIMED'],
  CLAIMED: [],
  EXCEPTION: ['CHECKED_IN', 'SECURITY_CLEARED', 'SORTED', 'READY_FOR_LOADING', 'LOADED'],
};

const STEP_LABELS: Record<string, string> = {
  CHECKED_IN: 'Checked In',
  SECURITY_CLEARED: 'Pass Security Check',
  SECURITY_HELD: 'Hold for Inspection',
  SORTED: 'Sort for Flight',
  IN_TRANSIT: 'Move In Transit',
  READY_FOR_LOADING: 'Ready for Aircraft Loading',
  LOADED: 'Load Onto Aircraft',
  ARRIVED: 'Mark Arrived',
  DELIVERED_TO_BELT: 'Send to Collection Belt',
  CLAIMED: 'Mark Collected',
};

export const BaggageHandlingPage: React.FC = () => {
  const [selectedStage, setSelectedStage] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [baggageList, setBaggageList] = useState<Baggage[]>([]);
  const [handlingPoints, setHandlingPoints] = useState<HandlingPoint[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Transition Modal State
  const [activeBaggage, setActiveBaggage] = useState<Baggage | null>(null);
  const [targetStatus, setTargetStatus] = useState<string>('');
  const [targetPointId, setTargetPointId] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [transitioning, setTransitioning] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchBaggage = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.searchBaggage(
        searchQuery || undefined,
        selectedStage === 'ALL' ? undefined : selectedStage,
        undefined,
        0,
        50
      );
      setBaggageList(res.content || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch baggage records');
    } finally {
      setLoading(false);
    }
  };

  const fetchHandlingPoints = async () => {
    try {
      const pts = await api.getHandlingPoints();
      setHandlingPoints(pts);
    } catch (err) {
      console.error('Failed to load handling points', err);
    }
  };

  useEffect(() => {
    fetchBaggage();
  }, [selectedStage]);

  useEffect(() => {
    fetchHandlingPoints();
  }, []);

  const openTransitionModal = (bag: Baggage) => {
    setActiveBaggage(bag);
    const validNext = VALID_NEXT_STEPS[bag.currentStatus] || [];
    setTargetStatus(validNext[0] || '');
    setTargetPointId(bag.currentHandlingPointId || 'MAA-CHECKIN-01');
    setNotes('');
    setFeedback(null);
  };

  const handleExecuteTransition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBaggage || !targetStatus) return;

    try {
      setTransitioning(true);
      setFeedback(null);
      const updated = await api.transitionBaggage(activeBaggage.baggageTag, {
        targetStatus,
        handlingPointId: targetPointId || undefined,
        notes: notes || undefined,
        scannerId: 'STAFF_CONSOLE',
      });

      setFeedback({
        type: 'success',
        message: `Successfully updated ${updated.baggageTag}. Journey status updated.`,
      });

      setBaggageList((prev) =>
        prev.map((b) => (b.baggageTag === updated.baggageTag ? updated : b))
      );
      setActiveBaggage(updated);
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Update could not be completed. Check stage requirements.',
      });
    } finally {
      setTransitioning(false);
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
              <span>BAGGAGE LIFECYCLE & SORTING OPERATIONS</span>
            </div>
            <h1 className="airport-hero-title">Update Baggage Status</h1>
            <p className="airport-hero-subtitle">
              Advance passenger baggage through lifecycle milestones: Check-In, EDS Security Clearance, Automated Sorter Chutes, Ramp Makeup, and Aircraft Hold Loading.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              onClick={fetchBaggage}
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
              <span>Refresh List</span>
            </button>
            <Link to="/registration" className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <Luggage size={14} />
              <span>Register New Baggage</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', backgroundColor: '#FFFFFF', borderRadius: '14px', boxShadow: 'var(--shadow-card)' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '280px' }}>
            <Search size={18} style={{ position: 'absolute', left: '0.9rem', top: '0.75rem', color: '#94A3B8' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '2.5rem', height: '42px', borderRadius: '8px', fontSize: '0.9rem' }}
              placeholder="Search by baggage tag, passenger name, PNR..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchBaggage()}
            />
          </div>
          <button onClick={fetchBaggage} className="btn btn-primary btn-sm" style={{ height: '42px', padding: '0 1.5rem', fontWeight: 700 }}>
            Search
          </button>
        </div>

        {/* Stage Filter Tabs */}
        <div style={{ display: 'flex', gap: '0.45rem', overflowX: 'auto', paddingBottom: '0.35rem' }}>
          {STAGES.map((s) => {
            const isSelected = selectedStage === s.key;
            return (
              <button
                key={s.key}
                onClick={() => setSelectedStage(s.key)}
                style={{
                  padding: '0.45rem 1rem',
                  borderRadius: '20px',
                  fontSize: '0.8rem',
                  fontWeight: isSelected ? 800 : 600,
                  border: isSelected ? '1.5px solid #0878F9' : '1px solid #E2E8F0',
                  backgroundColor: isSelected ? '#EFF6FF' : '#FFFFFF',
                  color: isSelected ? '#0878F9' : '#475569',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 140ms ease',
                }}
              >
                {s.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Baggage Table */}
      <div className="card" style={{ backgroundColor: '#FFFFFF', borderRadius: '14px', boxShadow: 'var(--shadow-card)', overflow: 'hidden' }}>
        <div className="card-header" style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#14233B' }}>
            Baggage Items ({baggageList.length})
          </div>
          <span style={{ fontSize: '0.8rem', color: '#64748B' }}>
            Airport baggage assigned to Chennai Hub (MAA)
          </span>
        </div>

        {loading ? (
          <div style={{ padding: '3.5rem', textAlign: 'center', color: '#64748B' }}>
            <RefreshCw size={28} className="spin" style={{ margin: '0 auto 0.75rem', color: '#0878F9' }} />
            <div style={{ fontWeight: 600 }}>Loading baggage manifests...</div>
          </div>
        ) : error ? (
          <div style={{ padding: '2.5rem', textAlign: 'center', color: '#EF4444' }}>
            <AlertTriangle size={28} style={{ margin: '0 auto 0.5rem' }} />
            <div>{error}</div>
          </div>
        ) : baggageList.length === 0 ? (
          <div style={{ padding: '4rem 2rem', textAlign: 'center', color: '#64748B' }}>
            <Luggage size={40} style={{ margin: '0 auto 0.75rem', opacity: 0.4 }} />
            <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#0F172A' }}>No baggage records found in this stage.</div>
            <p style={{ fontSize: '0.85rem', marginTop: '0.35rem', color: '#64748B' }}>Select "All Stages" or try searching for a different tag or passenger.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#F8FAFD', borderBottom: '1px solid #E2E8F0', textAlign: 'left', color: '#64748B', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  <th style={{ padding: '0.85rem 1.25rem' }}>Baggage Tag</th>
                  <th style={{ padding: '0.85rem 1.25rem' }}>Passenger & PNR</th>
                  <th style={{ padding: '0.85rem 1.25rem' }}>Flight & Route</th>
                  <th style={{ padding: '0.85rem 1.25rem' }}>Current Status</th>
                  <th style={{ padding: '0.85rem 1.25rem' }}>Current Location</th>
                  <th style={{ padding: '0.85rem 1.25rem' }}>Next Location</th>
                  <th style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {baggageList.map((bag) => {
                  const allowed = VALID_NEXT_STEPS[bag.currentStatus] || [];
                  return (
                    <tr key={bag.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <Link
                          to={`/tracking?tag=${bag.baggageTag}`}
                          style={{ fontWeight: 800, color: '#0878F9', display: 'flex', alignItems: 'center', gap: '0.4rem', textDecoration: 'none', fontSize: '0.95rem' }}
                        >
                          <Luggage size={15} />
                          <span>{bag.baggageTag}</span>
                        </Link>
                        <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.15rem' }}>{bag.weightKg} kg</div>
                      </td>
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <div style={{ fontWeight: 700, color: '#14233B', fontSize: '0.875rem' }}>{bag.passengerName}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748B' }}>PNR: <strong style={{ color: '#0F172A' }}>{bag.passengerPnr}</strong></div>
                      </td>
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.875rem' }}>{bag.flightNumber}</div>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.2rem', backgroundColor: '#F1F5F9', padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700, color: '#334155' }}>
                          <span>{bag.originIata}</span>
                          <span style={{ color: '#0878F9' }}>&rarr;</span>
                          <span>{bag.destinationIata}</span>
                        </div>
                      </td>
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <StatusBadge status={bag.currentStatus} size="sm" />
                      </td>
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem', color: '#334155', fontWeight: 600 }}>
                          <MapPin size={14} color="#0878F9" />
                          <span>{getFriendlyLocationName(bag.currentHandlingPointId, bag.currentHandlingPointName)}</span>
                        </div>
                      </td>
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <div style={{ fontSize: '0.8rem', color: '#64748B' }}>
                          {bag.expectedNextHandlingPointName || bag.expectedNextHandlingPointId
                            ? getFriendlyLocationName(bag.expectedNextHandlingPointId, bag.expectedNextHandlingPointName)
                            : 'Finalized'}
                        </div>
                      </td>
                      <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                        {allowed.length > 0 ? (
                          <button
                            onClick={() => openTransitionModal(bag)}
                            className="btn btn-primary btn-sm"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', fontWeight: 700, borderRadius: '8px' }}
                          >
                            <span>Advance Status</span>
                            <ArrowRight size={13} />
                          </button>
                        ) : (
                          <span style={{ fontSize: '0.8rem', color: '#10B981', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                            <CheckCircle2 size={16} /> Completed
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Transition Modal */}
      {activeBaggage && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(3, 17, 31, 0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1.5rem',
            backdropFilter: 'blur(4px)',
          }}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: '560px',
              backgroundColor: '#FFFFFF',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              borderRadius: '14px',
              overflow: 'hidden',
            }}
          >
            <div className="card-header" style={{ backgroundColor: '#03111F', color: '#FFFFFF', padding: '1.25rem 1.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '1.15rem', fontWeight: 800 }}>Advance Baggage Status</div>
                <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '0.2rem' }}>
                  Tag: <strong style={{ color: '#FFFFFF' }}>{activeBaggage.baggageTag}</strong> &bull; Flight: <strong style={{ color: '#00C2D7' }}>{activeBaggage.flightNumber}</strong>
                </div>
              </div>
              <button
                onClick={() => setActiveBaggage(null)}
                style={{ border: 'none', background: 'transparent', color: '#94A3B8', cursor: 'pointer', padding: '0.25rem' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleExecuteTransition} style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.35rem' }}>
              {feedback && (
                <div
                  style={{
                    padding: '0.85rem 1.15rem',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    backgroundColor: feedback.type === 'success' ? '#ECFDF5' : '#FEF2F2',
                    border: `1px solid ${feedback.type === 'success' ? '#A7F3D0' : '#FECACA'}`,
                    color: feedback.type === 'success' ? '#065F46' : '#991B1B',
                  }}
                >
                  {feedback.message}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', padding: '1rem', backgroundColor: '#F8FAFD', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                <div>
                  <div style={{ fontSize: '0.725rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>Current Stage</div>
                  <div style={{ marginTop: '0.35rem' }}>
                    <StatusBadge status={activeBaggage.currentStatus} size="sm" />
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.725rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>Passenger</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#14233B', marginTop: '0.35rem' }}>
                    {activeBaggage.passengerName}
                  </div>
                </div>
              </div>

              {/* Target Status Selection */}
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                  Select Next Step in Baggage Journey *
                </label>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.4rem' }}>
                  {(VALID_NEXT_STEPS[activeBaggage.currentStatus] || []).map((step) => {
                    const isSelected = targetStatus === step;
                    const label = STEP_LABELS[step] || step.replace(/_/g, ' ');
                    return (
                      <button
                        type="button"
                        key={step}
                        onClick={() => setTargetStatus(step)}
                        style={{
                          padding: '0.6rem 1rem',
                          borderRadius: '8px',
                          border: isSelected ? '2px solid #0878F9' : '1px solid #CBD5E1',
                          backgroundColor: isSelected ? '#EFF6FF' : '#FFFFFF',
                          color: isSelected ? '#0878F9' : '#334155',
                          fontWeight: isSelected ? 800 : 600,
                          fontSize: '0.825rem',
                          cursor: 'pointer',
                          transition: 'all 120ms ease',
                        }}
                      >
                        &rarr; {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Handling Point Selection */}
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                  Checkpoint Location *
                </label>
                <select
                  className="form-select"
                  value={targetPointId}
                  onChange={(e) => setTargetPointId(e.target.value)}
                  style={{ height: '42px', borderRadius: '8px' }}
                  required
                >
                  {handlingPoints.map((hp) => (
                    <option key={hp.id} value={hp.id}>
                      {getFriendlyLocationName(hp.id, hp.name)} [{hp.id}]
                    </option>
                  ))}
                </select>
              </div>

              {/* Operator Notes */}
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                  Handling Notes (Optional)
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Scanned at security X-ray belt, cleared for flight sorting"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  style={{ height: '42px', borderRadius: '8px' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setActiveBaggage(null)}
                  className="btn btn-secondary"
                  disabled={transitioning}
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={transitioning || !targetStatus}
                  className="btn btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontWeight: 700, borderRadius: '8px' }}
                >
                  {transitioning ? (
                    <>
                      <RefreshCw size={14} className="spin" />
                      <span>Saving Status...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={16} />
                      <span>Confirm Status Update</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

