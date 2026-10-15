import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { Flight, Baggage, HandlingPoint } from '../../types';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Luggage, CheckCircle2, AlertCircle, ArrowRight, Plane, Scale } from 'lucide-react';

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
        setError('Failed to load flight schedules and handling checkpoints: ' + err.message);
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
      // Reset tag for next registration
      setBaggageTag('');
      setPassengerName('');
      setPassengerPnr('');
    } catch (err: any) {
      setError(err.message || 'Failed to register baggage in PostgreSQL');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>
          Baggage Registration &bull; Terminal 2 Check-in
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '0.2rem' }}>
          Assign IATA baggage tags to flights, record passenger manifest, and induct into MAA BHS
        </p>
      </div>

      {/* Success Notification Alert */}
      {registeredBag && (
        <div
          style={{
            padding: '1.25rem',
            backgroundColor: '#ecfdf5',
            border: '1px solid #a7f3d0',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '1rem',
          }}
        >
          <CheckCircle2 size={24} color="#059669" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, color: '#065f46', fontSize: '1rem' }}>
              Baggage Registered Successfully in PostgreSQL!
            </div>
            <p style={{ fontSize: '0.8125rem', color: '#047857', marginTop: '0.25rem' }}>
              Tag <strong>{registeredBag.baggageTag}</strong> has been created with status{' '}
              <StatusBadge status={registeredBag.currentStatus} size="sm" /> for flight{' '}
              <strong>{registeredBag.flightNumber}</strong> ({registeredBag.originIata} &rarr;{' '}
              {registeredBag.destinationIata}).
            </p>
            <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.75rem' }}>
              <Link
                to={`/tracking?tag=${registeredBag.baggageTag}`}
                className="btn btn-primary btn-sm"
              >
                Track Movement Timeline &rarr;
              </Link>
              <Link
                to={`/scans?tag=${registeredBag.baggageTag}`}
                className="btn btn-secondary btn-sm"
              >
                Induct / Scan at Security &rarr;
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div
          style={{
            padding: '1rem',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            color: '#b91c1c',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            fontSize: '0.875rem',
          }}
        >
          <AlertCircle size={18} style={{ flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}

      {/* Registration Form Card */}
      <div className="card">
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Luggage size={18} color="#0284c7" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600 }}>New Baggage Intake Manifest</h3>
          </div>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Authoritative Operational Record</span>
        </div>

        <div className="card-body">
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Tag Generator Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem', alignItems: 'flex-end' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="tag">
                  Baggage Tag (IATA Barcode / RFID Tag) *
                </label>
                <input
                  id="tag"
                  type="text"
                  className="form-input"
                  value={baggageTag}
                  onChange={(e) => setBaggageTag(e.target.value)}
                  placeholder="e.g. MAA6E991204"
                  required
                />
              </div>

              <button
                type="button"
                onClick={generateRandomTag}
                className="btn btn-secondary"
                style={{ height: '38px', fontSize: '0.8125rem' }}
              >
                Auto-Generate Tag
              </button>
            </div>

            {/* Flight Selection Row */}
            <div className="form-group">
              <label className="form-label" htmlFor="flight">
                Assigned Flight (Chennai MAA Operations) *
              </label>
              <select
                id="flight"
                className="form-select"
                value={flightId}
                onChange={(e) => handleFlightChange(Number(e.target.value))}
                required
              >
                {flights.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.flightNumber} &bull; {f.airlineName} ({f.originIata} &rarr; {f.destinationIata}) &bull; Terminal {f.terminal} Gate {f.gate}
                  </option>
                ))}
              </select>
            </div>

            {/* Passenger Manifest Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="pname">
                  Passenger Full Name *
                </label>
                <input
                  id="pname"
                  type="text"
                  className="form-input"
                  value={passengerName}
                  onChange={(e) => setPassengerName(e.target.value)}
                  placeholder="e.g. Aravindhan Sundaram"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="pnr">
                  Booking Reference / PNR *
                </label>
                <input
                  id="pnr"
                  type="text"
                  className="form-input"
                  value={passengerPnr}
                  onChange={(e) => setPassengerPnr(e.target.value)}
                  placeholder="e.g. PNR882K"
                  maxLength={8}
                  required
                />
              </div>
            </div>

            {/* Origin & Destination Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="orig">
                  Origin Airport Code
                </label>
                <input
                  id="orig"
                  type="text"
                  className="form-input"
                  value={originIata}
                  readOnly
                  style={{ backgroundColor: '#f8fafc', color: '#64748b' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="dest">
                  Destination Airport Code
                </label>
                <input
                  id="dest"
                  type="text"
                  className="form-input"
                  value={destinationIata}
                  readOnly
                  style={{ backgroundColor: '#f8fafc', color: '#64748b' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="weight">
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
                  required
                />
              </div>
            </div>

            {/* Handling Point Induction */}
            <div className="form-group">
              <label className="form-label" htmlFor="point">
                Initial Induction Handling Point *
              </label>
              <select
                id="point"
                className="form-select"
                value={initialHandlingPointId}
                onChange={(e) => setInitialHandlingPointId(e.target.value)}
                required
              >
                {handlingPoints.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.id} &mdash; {p.name} ({p.zone})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <button
                type="submit"
                disabled={loading || fetchingConfig}
                className="btn btn-primary"
                style={{ padding: '0.65rem 1.5rem' }}
              >
                {loading ? 'Submitting to PostgreSQL...' : 'Register Baggage in System'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
