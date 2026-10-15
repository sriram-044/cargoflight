import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Baggage, HandlingPoint } from '../../types';
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
} from 'lucide-react';
import { Link } from 'react-router-dom';

const STAGES = [
  { key: 'ALL', label: 'All Stages' },
  { key: 'REGISTERED', label: 'Registered' },
  { key: 'CHECKED_IN', label: 'Checked In' },
  { key: 'SECURITY_CLEARED', label: 'Security Cleared' },
  { key: 'SORTED', label: 'Sorted' },
  { key: 'IN_TRANSIT', label: 'In Transit' },
  { key: 'READY_FOR_LOADING', label: 'Ready for Loading' },
  { key: 'LOADED', label: 'Loaded' },
  { key: 'ARRIVED', label: 'Arrived' },
  { key: 'DELIVERED_TO_BELT', label: 'Delivered to Belt' },
  { key: 'CLAIMED', label: 'Claimed' },
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
        scannerId: 'MANUAL_HANDLING_CONSOLE',
      });

      setFeedback({
        type: 'success',
        message: `Successfully transitioned ${updated.baggageTag} to ${updated.currentStatus}. Movement history recorded.`,
      });

      // Update in local list
      setBaggageList((prev) =>
        prev.map((b) => (b.baggageTag === updated.baggageTag ? updated : b))
      );
      setActiveBaggage(updated);
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Transition rejected by operational workflow rules.',
      });
    } finally {
      setTransitioning(false);
    }
  };

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header Banner */}
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
            <Layers size={22} color="#0878F9" />
            <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#14233B' }}>
              Baggage Handling Stage Console
            </h1>
          </div>
          <p style={{ color: '#64748B', fontSize: '0.85rem', marginTop: '0.25rem' }}>
            Enforce linear baggage stage workflows with strict transactional state transitions and append-only movement logs.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={fetchBaggage}
            disabled={loading}
            className="btn btn-secondary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
            <span>Refresh Manifest</span>
          </button>
          <Link to="/registration" className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Luggage size={14} />
            <span>Register New Bag</span>
          </Link>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '260px' }}>
            <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '0.65rem', color: '#94A3B8' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '2.25rem' }}
              placeholder="Search by baggage tag, passenger name, PNR..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchBaggage()}
            />
          </div>
          <button onClick={fetchBaggage} className="btn btn-primary btn-sm">
            Search
          </button>
        </div>

        {/* Stage Tabs */}
        <div style={{ display: 'flex', gap: '0.4rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
          {STAGES.map((s) => {
            const isSelected = selectedStage === s.key;
            return (
              <button
                key={s.key}
                onClick={() => setSelectedStage(s.key)}
                style={{
                  padding: '0.4rem 0.85rem',
                  borderRadius: '20px',
                  fontSize: '0.75rem',
                  fontWeight: isSelected ? 700 : 500,
                  border: isSelected ? '1px solid #0878F9' : '1px solid #E2E8F0',
                  backgroundColor: isSelected ? '#EFF6FF' : '#FFFFFF',
                  color: isSelected ? '#0878F9' : '#475569',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 150ms ease',
                }}
              >
                {s.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Baggage Table */}
      <div className="card">
        <div className="card-header">
          <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#14233B' }}>
            Active Baggage Items ({baggageList.length})
          </div>
          <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
            Showing operational baggage assigned to MAA Hub
          </span>
        </div>

        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748B' }}>
            <RefreshCw size={24} className="spin" style={{ margin: '0 auto 0.75rem' }} />
            <div>Loading baggage manifests...</div>
          </div>
        ) : error ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#EF4444' }}>
            <AlertTriangle size={24} style={{ margin: '0 auto 0.5rem' }} />
            <div>{error}</div>
          </div>
        ) : baggageList.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748B' }}>
            <Luggage size={32} style={{ margin: '0 auto 0.75rem', opacity: 0.5 }} />
            <div style={{ fontWeight: 600 }}>No baggage records found in stage "{selectedStage}"</div>
            <p style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>Register new baggage or select a different stage.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Baggage Tag</th>
                  <th>Passenger & PNR</th>
                  <th>Flight</th>
                  <th>Current Stage</th>
                  <th>Handling Point</th>
                  <th>Next Target</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {baggageList.map((bag) => {
                  const allowed = VALID_NEXT_STEPS[bag.currentStatus] || [];
                  return (
                    <tr key={bag.id}>
                      <td>
                        <Link
                          to={`/tracking?tag=${bag.baggageTag}`}
                          style={{ fontWeight: 700, color: '#0878F9', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                        >
                          <Luggage size={14} />
                          <span>{bag.baggageTag}</span>
                        </Link>
                        <div style={{ fontSize: '0.7rem', color: '#64748B' }}>{bag.weightKg} kg</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: '#14233B' }}>{bag.passengerName}</div>
                        <div style={{ fontSize: '0.7rem', color: '#64748B' }}>PNR: {bag.passengerPnr}</div>
                      </td>
                      <td>
                        <span style={{ fontWeight: 600, color: '#1E293B' }}>{bag.flightNumber}</span>
                        <div style={{ fontSize: '0.7rem', color: '#64748B' }}>
                          {bag.originIata} &rarr; {bag.destinationIata}
                        </div>
                      </td>
                      <td>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '0.2rem 0.6rem',
                            borderRadius: '12px',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            backgroundColor:
                              bag.currentStatus === 'LOADED' || bag.currentStatus === 'CLAIMED'
                                ? '#ECFDF5'
                                : bag.currentStatus === 'EXCEPTION'
                                ? '#FEF2F2'
                                : '#EFF6FF',
                            color:
                              bag.currentStatus === 'LOADED' || bag.currentStatus === 'CLAIMED'
                                ? '#065F46'
                                : bag.currentStatus === 'EXCEPTION'
                                ? '#991B1B'
                                : '#0878F9',
                          }}
                        >
                          {bag.currentStatus}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem' }}>
                          <MapPin size={13} color="#64748B" />
                          <span>{bag.currentHandlingPointName || bag.currentHandlingPointId || 'N/A'}</span>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.75rem', color: '#475569' }}>
                          {bag.expectedNextHandlingPointName || 'Finalized'}
                        </div>
                      </td>
                      <td>
                        {allowed.length > 0 ? (
                          <button
                            onClick={() => openTransitionModal(bag)}
                            className="btn btn-primary btn-sm"
                            style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem' }}
                          >
                            <span>Move Stage</span>
                            <ArrowRight size={13} />
                          </button>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: '#10B981', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <CheckCircle2 size={14} /> Claimed
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
            backgroundColor: 'rgba(6, 24, 45, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '1rem',
          }}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: '520px',
              backgroundColor: '#FFFFFF',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
            }}
          >
            <div className="card-header" style={{ backgroundColor: '#03111F', color: '#FFFFFF' }}>
              <div>
                <div style={{ fontSize: '1rem', fontWeight: 800 }}>Move Baggage Stage</div>
                <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                  Tag: {activeBaggage.baggageTag} &bull; Flight: {activeBaggage.flightNumber}
                </div>
              </div>
              <button
                onClick={() => setActiveBaggage(null)}
                style={{ border: 'none', background: 'transparent', color: '#94A3B8', cursor: 'pointer', fontSize: '1.2rem' }}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleExecuteTransition} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {feedback && (
                <div
                  style={{
                    padding: '0.75rem 1rem',
                    borderRadius: '8px',
                    fontSize: '0.8125rem',
                    backgroundColor: feedback.type === 'success' ? '#ECFDF5' : '#FEF2F2',
                    border: `1px solid ${feedback.type === 'success' ? '#A7F3D0' : '#FECACA'}`,
                    color: feedback.type === 'success' ? '#065F46' : '#991B1B',
                  }}
                >
                  {feedback.message}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', padding: '0.75rem', backgroundColor: '#F8FAFD', borderRadius: '8px' }}>
                <div>
                  <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 600 }}>CURRENT STAGE</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0878F9' }}>
                    {activeBaggage.currentStatus}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 600 }}>PASSENGER</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#14233B' }}>
                    {activeBaggage.passengerName}
                  </div>
                </div>
              </div>

              {/* Target Status Selection */}
              <div className="form-group">
                <label className="form-label">Next Target Status (Enforced Operational Workflow)</label>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {(VALID_NEXT_STEPS[activeBaggage.currentStatus] || []).map((step) => {
                    const isSelected = targetStatus === step;
                    return (
                      <button
                        type="button"
                        key={step}
                        onClick={() => setTargetStatus(step)}
                        style={{
                          padding: '0.5rem 0.85rem',
                          borderRadius: '8px',
                          border: isSelected ? '2px solid #0878F9' : '1px solid #D8E2EE',
                          backgroundColor: isSelected ? '#EFF6FF' : '#FFFFFF',
                          color: isSelected ? '#0878F9' : '#334155',
                          fontWeight: isSelected ? 700 : 500,
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                        }}
                      >
                        &rarr; {step}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Handling Point Selection */}
              <div className="form-group">
                <label className="form-label">Target Airport Handling Point</label>
                <select
                  className="form-select"
                  value={targetPointId}
                  onChange={(e) => setTargetPointId(e.target.value)}
                  required
                >
                  {handlingPoints.map((hp) => (
                    <option key={hp.id} value={hp.id}>
                      {hp.id} &bull; {hp.name} ({hp.zone})
                    </option>
                  ))}
                </select>
              </div>

              {/* Operator Notes */}
              <div className="form-group">
                <label className="form-label">Operational Transition Note (Optional)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Scanned at security X-ray belt 2, cleared for sorting loop"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
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
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  {transitioning ? (
                    <>
                      <RefreshCw size={14} className="spin" />
                      <span>Recording Movement...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={15} />
                      <span>Execute Stage Transition</span>
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
