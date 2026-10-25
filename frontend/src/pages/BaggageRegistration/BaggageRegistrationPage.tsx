import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { Flight, Baggage, HandlingPoint } from '../../types';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Luggage, CheckCircle2, AlertCircle, ArrowRight, Plane, Scale, PlusCircle, Sparkles, Send } from 'lucide-react';
import { getFriendlyLocationName } from '../../services/locationMapping';

export const BaggageRegistrationPage: React.FC = () => {
  const [flights, setFlights] = useState<Flight[]>([]);
  const [handlingPoints, setHandlingPoints] = useState<HandlingPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingConfig, setFetchingConfig] = useState(true);

  // Form State
  const [baggageTag, setBaggageTag] = useState('');
  const [flightId, setFlightId] = useState<number | ''>('');
  const [passengerName, setPassengerName] = useState('');
  const [passengerPnr, setPassengerPnr] = useState('');
  const [originIata, setOriginIata] = useState('MAA');
  const [destinationIata, setDestinationIata] = useState('DEL');
  const [weightKg, setWeightKg] = useState('18.5');
  const [initialHandlingPointId, setInitialHandlingPointId] = useState('MAA-CHECKIN-01');

  // Outcome Feedback
  const [registeredBag, setRegisteredBag] = useState<Baggage | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadConfig = async () => {
      try {
        setFetchingConfig(true);
        const [flightList, pointList] = await Promise.all([
          api.getFlights(),
          api.getHandlingPoints(),
        ]);
        setFlights(flightList);
        if (flightList.length > 0) {
          setFlightId(flightList[0].id);
          setDestinationIata(flightList[0].destinationIata);
          setOriginIata(flightList[0].originIata);
        }
        setHandlingPoints(pointList);
      } catch (err: any) {
        setError('Failed to load flights and baggage locations: ' + (err.message || 'Service unavailable'));
      } finally {
        setFetchingConfig(false);
      }
    };
    loadConfig();
  }, []);

  const handleFlightChange = (id: number) => {
    setFlightId(id);
    const sel = flights.find((f) => f.id === id);
    if (sel) {
      setOriginIata(sel.originIata);
      setDestinationIata(sel.destinationIata);
    }
  };

  const generateRandomTag = () => {
    const prefix = 'MAA';
    const num = Math.floor(100000 + Math.random() * 900000);
    setBaggageTag(`${prefix}${num}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!baggageTag.trim()) {
      setError('Please provide a unique Baggage Tag number.');
      return;
    }
    if (!flightId) {
      setError('Please select an active flight.');
      return;
    }

    setLoading(true);
    setError('');
    setRegisteredBag(null);

    try {
      const result = await api.registerBaggage({
        baggageTag: baggageTag.trim().toUpperCase(),
        flightId: Number(flightId),
        passengerName: passengerName.trim(),
        passengerPnr: passengerPnr.trim().toUpperCase(),
        originIata: originIata.trim().toUpperCase(),
        destinationIata: destinationIata.trim().toUpperCase(),
        weightKg: parseFloat(weightKg),
        initialHandlingPointId,
      });

      setRegisteredBag(result);
      setBaggageTag('');
      setPassengerName('');
      setPassengerPnr('');
    } catch (err: any) {
      setError(err.message || 'Could not register baggage. Please verify details and try again.');
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
              <span>CHECK-IN COUNTER INTAKE & INDUCTION</span>
            </div>
            <h1 className="airport-hero-title">Register New Baggage</h1>
            <p className="airport-hero-subtitle">
              Register passenger luggage at check-in counters, assign to flight manifests, and induct into the baggage handling system.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <Link
              to="/baggage"
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
              <span>Manage Baggage List</span>
            </Link>
            <Link
              to="/tracking"
              className="btn btn-primary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}
            >
              <Luggage size={14} />
              <span>Track Baggage</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Success Notification Alert */}
      {registeredBag && (
        <div
          style={{
            padding: '1.5rem',
            backgroundColor: '#ECFDF5',
            border: '1px solid #A7F3D0',
            borderRadius: '14px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '1rem',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <CheckCircle2 size={26} color="#059669" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, color: '#065F46', fontSize: '1.15rem' }}>
              Baggage Registered Successfully!
            </div>
            <p style={{ fontSize: '0.9rem', color: '#047857', marginTop: '0.35rem', lineHeight: 1.5 }}>
              Tag <strong>{registeredBag.baggageTag}</strong> is now registered with status{' '}
              <StatusBadge status={registeredBag.currentStatus} size="sm" /> for flight{' '}
              <strong>{registeredBag.flightNumber}</strong> ({registeredBag.originIata} &rarr;{' '}
              {registeredBag.destinationIata}).
            </p>
            <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <Link
                to={`/tracking?tag=${registeredBag.baggageTag}`}
                className="btn btn-primary btn-sm"
                style={{ fontSize: '0.825rem', fontWeight: 700 }}
              >
                Track Baggage Journey &rarr;
              </Link>
              <Link
                to={`/scans?tag=${registeredBag.baggageTag}`}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '0.825rem', fontWeight: 700 }}
              >
                Send to Security Check &rarr;
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div
          style={{
            padding: '1rem 1.25rem',
            backgroundColor: '#FEF2F2',
            border: '1px solid #FECACA',
            borderRadius: '10px',
            color: '#B91C1C',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            fontSize: '0.875rem',
          }}
        >
          <AlertCircle size={20} style={{ flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}

      {/* Registration Form Card */}
      <div className="card" style={{ backgroundColor: '#FFFFFF', borderRadius: '14px', overflow: 'hidden', boxShadow: 'var(--shadow-card)', maxWidth: '1080px', margin: '0 auto', width: '100%' }}>
        <div className="card-header" style={{ padding: '1.25rem 1.75rem', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <Luggage size={22} color="#0878F9" />
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#14233B' }}>Baggage Intake & Induction Form</h3>
              <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Chennai International Airport (MAA) &bull; Terminal 2 Counters</div>
            </div>
          </div>
          <span style={{ fontSize: '0.75rem', color: '#0878F9', backgroundColor: '#EFF6FF', padding: '0.25rem 0.65rem', borderRadius: '6px', fontWeight: 700 }}>
            PostgreSQL Master
          </span>
        </div>

        <div className="card-body" style={{ padding: '2rem 1.75rem' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Tag Generator Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem', alignItems: 'flex-end' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" htmlFor="tag" style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                  Baggage Tag Number (Barcode / Tracking ID) *
                </label>
                <input
                  id="tag"
                  type="text"
                  className="form-input"
                  value={baggageTag}
                  onChange={(e) => setBaggageTag(e.target.value)}
                  placeholder="e.g. MAA6E991204 or click Auto-Generate"
                  style={{ height: '44px', borderRadius: '8px', fontWeight: 700 }}
                  required
                />
              </div>

              <button
                type="button"
                onClick={generateRandomTag}
                className="btn btn-secondary"
                style={{ height: '44px', fontSize: '0.825rem', borderRadius: '8px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
              >
                <Sparkles size={15} color="#0878F9" />
                <span>Auto-Generate Tag</span>
              </button>
            </div>

            {/* Flight Selection Row */}
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" htmlFor="flight" style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                Assigned Flight *
              </label>
              <select
                id="flight"
                className="form-select"
                value={flightId}
                onChange={(e) => handleFlightChange(Number(e.target.value))}
                style={{ height: '44px', borderRadius: '8px', fontWeight: 600 }}
                required
              >
                {flights.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.flightNumber} &bull; {f.airlineName} ({f.originIata} &rarr; {f.destinationIata}) &bull; Terminal {f.terminal} Gate {f.gate}
                  </option>
                ))}
              </select>
            </div>

            {/* Passenger Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" htmlFor="pname" style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                  Passenger Full Name *
                </label>
                <input
                  id="pname"
                  type="text"
                  className="form-input"
                  value={passengerName}
                  onChange={(e) => setPassengerName(e.target.value)}
                  placeholder="e.g. Priya Sundaram"
                  style={{ height: '44px', borderRadius: '8px' }}
                  required
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" htmlFor="pnr" style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                  Booking Reference / PNR *
                </label>
                <input
                  id="pnr"
                  type="text"
                  className="form-input"
                  value={passengerPnr}
                  onChange={(e) => setPassengerPnr(e.target.value)}
                  placeholder="e.g. PNR774A"
                  maxLength={8}
                  style={{ height: '44px', borderRadius: '8px', fontWeight: 700 }}
                  required
                />
              </div>
            </div>

            {/* Origin, Destination & Weight */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" htmlFor="orig" style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                  Origin Airport
                </label>
                <input
                  id="orig"
                  type="text"
                  className="form-input"
                  value={originIata}
                  readOnly
                  style={{ backgroundColor: '#F8FAFC', color: '#0F172A', height: '44px', borderRadius: '8px', fontWeight: 700 }}
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" htmlFor="dest" style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                  Destination Airport
                </label>
                <input
                  id="dest"
                  type="text"
                  className="form-input"
                  value={destinationIata}
                  readOnly
                  style={{ backgroundColor: '#F8FAFC', color: '#0F172A', height: '44px', borderRadius: '8px', fontWeight: 700 }}
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" htmlFor="weight" style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                  Weight (kg) *
                </label>
                <input
                  id="weight"
                  type="number"
                  step="0.1"
                  min="0.5"
                  max="50"
                  className="form-input"
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)}
                  style={{ height: '44px', borderRadius: '8px', fontWeight: 700 }}
                  required
                />
              </div>
            </div>

            {/* Starting Location */}
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" htmlFor="point" style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                Induction Checkpoint Location *
              </label>
              <select
                id="point"
                className="form-select"
                value={initialHandlingPointId}
                onChange={(e) => setInitialHandlingPointId(e.target.value)}
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

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <button
                type="submit"
                disabled={loading || fetchingConfig}
                className="btn btn-primary"
                style={{ padding: '0.85rem 2.25rem', fontWeight: 700, borderRadius: '10px', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <Send size={16} />
                <span>{loading ? 'Registering...' : 'Register Baggage'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

