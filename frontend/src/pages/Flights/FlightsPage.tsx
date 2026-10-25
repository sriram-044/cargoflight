import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Flight, Baggage } from '../../types';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { LoadingSkeleton } from '../../components/feedback/LoadingSkeleton';
import {
  PlaneTakeoff,
  Search,
  Clock,
  ArrowRight,
  RefreshCw,
  PlusCircle,
  Luggage,
  Eye,
  CheckCircle2,
  AlertTriangle,
  X,
  Filter,
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getFriendlyLocationName } from '../../services/locationMapping';

export const FlightsPage: React.FC = () => {
  const [flights, setFlights] = useState<Flight[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [error, setError] = useState('');

  // Modals
  const [selectedFlight, setSelectedFlight] = useState<Flight | null>(null);
  const [flightBaggage, setFlightBaggage] = useState<Baggage[]>([]);
  const [loadingBaggage, setLoadingBaggage] = useState(false);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newFlight, setNewFlight] = useState({
    flightNumber: '',
    airlineCode: 'AI',
    airlineName: 'Air India',
    originIata: 'MAA',
    destinationIata: 'DEL',
    scheduledDeparture: '',
    scheduledArrival: '',
    terminal: 'T2',
    gate: 'G12',
    status: 'SCHEDULED',
    totalExpectedBags: 120,
  });
  const [submittingFlight, setSubmittingFlight] = useState(false);
  const [createFeedback, setCreateFeedback] = useState<string | null>(null);

  const { hasRole } = useAuth();
  const canManage = hasRole(['SYSTEM_ADMIN', 'OPERATIONS_MANAGER', 'FLIGHT_OPERATOR']);

  const loadFlights = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await api.getFlights();
      setFlights(data);
    } catch (err: any) {
      setError('Failed to load flights: ' + (err.message || 'Service unavailable'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFlights();
  }, []);

  const openFlightDetails = async (flight: Flight) => {
    setSelectedFlight(flight);
    try {
      setLoadingBaggage(true);
      const bags = await api.getFlightBaggage(flight.id);
      setFlightBaggage(bags);
    } catch (err) {
      console.error('Failed to load flight baggage list', err);
    } finally {
      setLoadingBaggage(false);
    }
  };

  const handleCreateFlight = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmittingFlight(true);
      setCreateFeedback(null);
      const created = await api.createFlight(newFlight);
      setFlights((prev) => [created, ...prev]);
      setShowCreateModal(false);
      setCreateFeedback(null);
      setNewFlight({
        flightNumber: '',
        airlineCode: 'AI',
        airlineName: 'Air India',
        originIata: 'MAA',
        destinationIata: 'DEL',
        scheduledDeparture: '',
        scheduledArrival: '',
        terminal: 'T2',
        gate: 'G12',
        status: 'SCHEDULED',
        totalExpectedBags: 120,
      });
    } catch (err: any) {
      setCreateFeedback(err.message || 'Failed to add flight');
    } finally {
      setSubmittingFlight(false);
    }
  };

  const filteredFlights = flights.filter((f) => {
    const matchesQuery =
      f.flightNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.airlineName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.originIata.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.destinationIata.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || f.status === statusFilter;
    return matchesQuery && matchesStatus;
  });

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1540px', margin: '0 auto', width: '100%' }}>
      {/* Aviation Flights Hero Header */}
      <div className="airport-hero">
        <div className="airport-hero-content">
          <div className="airport-hero-badge">
            <PlaneTakeoff size={14} /> Flight Management & Baggage Loading
          </div>
          <h1 className="airport-hero-title">
            Flights
          </h1>
          <p className="airport-hero-subtitle">
            Monitor real-time commercial passenger flights, departure gate assignments, and baggage hold loading progress at Chennai Hub (MAA).
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', position: 'relative', zIndex: 2 }}>
          <button onClick={loadFlights} className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', backgroundColor: 'rgba(255, 255, 255, 0.1)', color: '#FFFFFF', borderColor: 'rgba(255, 255, 255, 0.25)', backdropFilter: 'blur(4px)' }}>
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
            <span>Refresh Flights</span>
          </button>
          {canManage && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn btn-primary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', backgroundColor: '#0878F9', borderColor: '#0878F9', boxShadow: '0 0 14px rgba(8, 120, 249, 0.4)' }}
            >
              <PlusCircle size={15} />
              <span>Add New Flight</span>
            </button>
          )}
        </div>
      </div>

      {/* Flight Summary Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <div className="stat-card" style={{ padding: '1rem 1.25rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>Total Flights</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0F172A', marginTop: '0.2rem' }}>{flights.length}</div>
          <div style={{ fontSize: '0.7rem', color: '#64748B', marginTop: '0.25rem' }}>Chennai Airport Active Flights</div>
        </div>
        <div className="stat-card" style={{ padding: '1rem 1.25rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>Departed / In Flight</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#10B981', marginTop: '0.2rem' }}>
            {flights.filter((f) => f.status === 'DEPARTED' || f.status === 'ARRIVED').length}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#10B981', marginTop: '0.25rem' }}>Airborne or arrived at destination</div>
        </div>
        <div className="stat-card" style={{ padding: '1rem 1.25rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>Scheduled / Boarding</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0878F9', marginTop: '0.2rem' }}>
            {flights.filter((f) => f.status === 'SCHEDULED' || f.status === 'BOARDING' || f.status === 'ACTIVE').length}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#0878F9', marginTop: '0.25rem' }}>Currently loading or pre-flight</div>
        </div>
        <div className="stat-card" style={{ padding: '1rem 1.25rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>Baggage Loading Avg</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#00C2D7', marginTop: '0.2rem' }}>
            {flights.length > 0 ? Math.round(flights.reduce((acc, f) => acc + (f.loadingProgressPercent || 0), 0) / flights.length) : 0}%
          </div>
          <div style={{ fontSize: '0.7rem', color: '#64748B', marginTop: '0.25rem' }}>Fleet average hold loading</div>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.85rem', backgroundColor: '#FFFFFF', borderRadius: '12px', boxShadow: '0 2px 6px rgba(6, 24, 45, 0.04)' }}>
        <div style={{ position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '0.85rem', top: '0.75rem', color: '#94A3B8' }} />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '2.5rem', height: '42px', fontSize: '0.9rem', borderRadius: '8px' }}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search flights by flight number (e.g. 6E-2041, AI-440), airline, or destination..."
          />
        </div>

        {/* Status Filter Pills */}
        <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', flexWrap: 'wrap' }}>
          {['ALL', 'SCHEDULED', 'BOARDING', 'ACTIVE', 'DEPARTED', 'ARRIVED', 'DELAYED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              style={{
                padding: '0.35rem 0.85rem',
                borderRadius: '16px',
                fontSize: '0.75rem',
                fontWeight: statusFilter === st ? 700 : 500,
                border: statusFilter === st ? '1px solid #0878F9' : '1px solid #E2E8F0',
                backgroundColor: statusFilter === st ? '#EFF6FF' : '#FFFFFF',
                color: statusFilter === st ? '#0878F9' : '#475569',
                cursor: 'pointer',
                transition: 'all 120ms ease',
              }}
            >
              {st === 'ALL' ? 'All Flights' : st.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div style={{ padding: '1rem', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '10px', color: '#EF4444' }}>
          {error}
        </div>
      )}

      {loading ? (
        <LoadingSkeleton rows={5} />
      ) : filteredFlights.length === 0 ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center', color: '#64748B', backgroundColor: '#FFFFFF', borderRadius: '12px' }}>
          <PlaneTakeoff size={36} style={{ margin: '0 auto 0.75rem', opacity: 0.4 }} />
          <div style={{ fontSize: '1rem', fontWeight: 600, color: '#1E293B' }}>No matching flights found</div>
          <div style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>Try clearing the search query or selecting a different status filter.</div>
        </div>
      ) : (
        <div className="card" style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', boxShadow: '0 2px 8px rgba(6, 24, 45, 0.04)' }}>
          <div className="table-responsive">
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#F8FAFD', borderBottom: '1px solid #E2E8F0', textAlign: 'left', color: '#64748B', fontSize: '0.75rem' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Flight</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Route</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Departure Time</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Gate</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Flight Status</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Baggage Loading Progress</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredFlights.map((f) => (
                  <tr key={f.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <div style={{ fontWeight: 800, color: '#0878F9', fontSize: '0.95rem' }}>
                        {f.flightNumber}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 500 }}>{f.airlineName}</div>
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                        <span className="airport-code-tag">{f.originIata}</span>
                        <ArrowRight size={13} color="#0878F9" />
                        <span className="airport-code-tag">{f.destinationIata}</span>
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: '#334155' }}>
                      {new Date(f.scheduledDeparture).toLocaleTimeString('en-IN', {
                        timeZone: 'Asia/Kolkata',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true,
                      })}{' '}
                      IST
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span style={{ fontWeight: 600 }}>Terminal {f.terminal}</span> &bull; Gate {f.gate}
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <StatusBadge status={f.status} size="sm" />
                    </td>
                    <td style={{ padding: '0.75rem 1rem', minWidth: '180px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                        <span style={{ fontWeight: 600 }}>
                          {f.totalLoadedBags} / {f.totalExpectedBags} loaded
                        </span>
                        <span style={{ color: '#0878F9', fontWeight: 700 }}>{f.loadingProgressPercent}%</span>
                      </div>
                      <div style={{ width: '100%', height: '6px', backgroundColor: '#E2E8F0', borderRadius: '3px', overflow: 'hidden' }}>
                        <div
                          style={{
                            width: `${f.loadingProgressPercent}%`,
                            height: '100%',
                            backgroundColor: f.loadingProgressPercent >= 100 ? '#10B981' : '#0878F9',
                            transition: 'width 250ms ease',
                          }}
                        />
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button
                          onClick={() => openFlightDetails(f)}
                          className="btn btn-secondary btn-sm"
                          style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem' }}
                          title="View Baggage List"
                        >
                          <Eye size={13} />
                          <span>Baggage List</span>
                        </button>
                        <Link
                          to={`/registration?flightId=${f.id}`}
                          className="btn btn-primary btn-sm"
                          style={{ fontSize: '0.75rem' }}
                          title="Register Bag for this Flight"
                        >
                          + Bag
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Flight Detail & Baggage List Modal */}
      {selectedFlight && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(6, 24, 45, 0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '1.5rem',
          }}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: '750px',
              maxHeight: '85vh',
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: '#FFFFFF',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.25)',
              borderRadius: '12px',
              overflow: 'hidden',
            }}
          >
            <div className="card-header" style={{ backgroundColor: '#03111F', color: '#FFFFFF', padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '1.15rem', fontWeight: 800 }}>
                  Flight {selectedFlight.flightNumber} Baggage List
                </div>
                <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '0.2rem' }}>
                  {selectedFlight.airlineName} &bull; {selectedFlight.originIata} &rarr; {selectedFlight.destinationIata} &bull; Terminal {selectedFlight.terminal} Gate {selectedFlight.gate}
                </div>
              </div>
              <button
                onClick={() => setSelectedFlight(null)}
                style={{ border: 'none', background: 'transparent', color: '#94A3B8', cursor: 'pointer', fontSize: '1.25rem' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '1.25rem 1.5rem', flex: 1, overflowY: 'auto' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <div style={{ padding: '0.75rem', backgroundColor: '#F8FAFD', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 600 }}>FLIGHT STATUS</div>
                  <div style={{ fontWeight: 800, color: '#0878F9' }}>{selectedFlight.status}</div>
                </div>
                <div style={{ padding: '0.75rem', backgroundColor: '#F8FAFD', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 600 }}>EXPECTED BAGS</div>
                  <div style={{ fontWeight: 800, color: '#14233B' }}>{selectedFlight.totalExpectedBags}</div>
                </div>
                <div style={{ padding: '0.75rem', backgroundColor: '#F8FAFD', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 600 }}>LOADED ON FLIGHT</div>
                  <div style={{ fontWeight: 800, color: '#10B981' }}>{selectedFlight.totalLoadedBags}</div>
                </div>
                <div style={{ padding: '0.75rem', backgroundColor: '#F8FAFD', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 600 }}>LOADING PROGRESS</div>
                  <div style={{ fontWeight: 800, color: '#0878F9' }}>{selectedFlight.loadingProgressPercent}%</div>
                </div>
              </div>

              <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.75rem', color: '#14233B' }}>
                Baggage for this Flight ({flightBaggage.length})
              </div>

              {loadingBaggage ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#64748B' }}>
                  <RefreshCw size={20} className="spin" style={{ margin: '0 auto 0.5rem' }} />
                  <div>Loading baggage items...</div>
                </div>
              ) : flightBaggage.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#64748B', backgroundColor: '#F8FAFD', borderRadius: '8px' }}>
                  <Luggage size={28} style={{ margin: '0 auto 0.5rem', opacity: 0.5 }} />
                  <div>No baggage units currently registered for this flight.</div>
                  <Link
                    to={`/registration?flightId=${selectedFlight.id}`}
                    className="btn btn-primary btn-sm"
                    style={{ marginTop: '0.75rem', display: 'inline-flex' }}
                  >
                    Register Baggage Now
                  </Link>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#F8FAFD', borderBottom: '1px solid #E2E8F0', textAlign: 'left', color: '#64748B', fontSize: '0.75rem' }}>
                        <th style={{ padding: '0.65rem 0.75rem' }}>Tag</th>
                        <th style={{ padding: '0.65rem 0.75rem' }}>Passenger</th>
                        <th style={{ padding: '0.65rem 0.75rem' }}>Weight</th>
                        <th style={{ padding: '0.65rem 0.75rem' }}>Status</th>
                        <th style={{ padding: '0.65rem 0.75rem' }}>Location</th>
                        <th style={{ padding: '0.65rem 0.75rem' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {flightBaggage.map((b) => (
                        <tr key={b.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                          <td style={{ padding: '0.65rem 0.75rem', fontWeight: 700, color: '#0878F9' }}>{b.baggageTag}</td>
                          <td style={{ padding: '0.65rem 0.75rem' }}>
                            <div>{b.passengerName}</div>
                            <div style={{ fontSize: '0.7rem', color: '#64748B' }}>PNR: {b.passengerPnr}</div>
                          </td>
                          <td style={{ padding: '0.65rem 0.75rem' }}>{b.weightKg} kg</td>
                          <td style={{ padding: '0.65rem 0.75rem' }}>
                            <StatusBadge status={b.currentStatus} size="sm" />
                          </td>
                          <td style={{ padding: '0.65rem 0.75rem', fontSize: '0.75rem', color: '#475569' }}>
                            <div style={{ fontWeight: 600, color: '#0F172A' }}>
                              {getFriendlyLocationName(b.currentHandlingPointId, b.currentHandlingPointName)}
                            </div>
                            {b.currentHandlingPointId && (
                              <div style={{ fontSize: '0.675rem', color: '#94A3B8', fontFamily: 'monospace' }}>
                                {b.currentHandlingPointId}
                              </div>
                            )}
                          </td>
                          <td style={{ padding: '0.65rem 0.75rem' }}>
                            <Link to={`/tracking?tag=${b.baggageTag}`} className="btn btn-secondary btn-sm" style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }}>
                              Track
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setSelectedFlight(null)} className="btn btn-secondary">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Flight Modal */}
      {showCreateModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(6, 24, 45, 0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '1.5rem',
          }}
        >
          <div className="card" style={{ width: '100%', maxWidth: '540px', backgroundColor: '#FFFFFF', borderRadius: '12px', overflow: 'hidden' }}>
            <div className="card-header" style={{ backgroundColor: '#03111F', color: '#FFFFFF', padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '1.05rem', fontWeight: 800 }}>Schedule New Flight</div>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{ border: 'none', background: 'transparent', color: '#94A3B8', cursor: 'pointer', fontSize: '1.25rem' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateFlight} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {createFeedback && (
                <div style={{ padding: '0.75rem', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '6px', color: '#EF4444', fontSize: '0.8rem' }}>
                  {createFeedback}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Flight Number</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. AI-582"
                    value={newFlight.flightNumber}
                    onChange={(e) => setNewFlight({ ...newFlight, flightNumber: e.target.value.toUpperCase() })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Airline Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newFlight.airlineName}
                    onChange={(e) => setNewFlight({ ...newFlight, airlineName: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Origin (Airport Code)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newFlight.originIata}
                    onChange={(e) => setNewFlight({ ...newFlight, originIata: e.target.value.toUpperCase() })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Destination (Airport Code)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newFlight.destinationIata}
                    onChange={(e) => setNewFlight({ ...newFlight, destinationIata: e.target.value.toUpperCase() })}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Terminal</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newFlight.terminal}
                    onChange={(e) => setNewFlight({ ...newFlight, terminal: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Gate</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newFlight.gate}
                    onChange={(e) => setNewFlight({ ...newFlight, gate: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Expected Total Baggage</label>
                <input
                  type="number"
                  min="1"
                  max="500"
                  className="form-input"
                  value={newFlight.totalExpectedBags}
                  onChange={(e) => setNewFlight({ ...newFlight, totalExpectedBags: parseInt(e.target.value) || 0 })}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={submittingFlight} className="btn btn-primary">
                  {submittingFlight ? 'Scheduling...' : 'Confirm Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
