import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { AnalyticsSummary, DatabaseHealth, BaggageMovement, Flight } from '../../types';
import { StatCard } from '../../components/ui/StatCard';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { LoadingSkeleton } from '../../components/feedback/LoadingSkeleton';
import {
  Luggage,
  ShieldCheck,
  RotateCw,
  Truck,
  CheckCircle2,
  AlertTriangle,
  Barcode,
  Network,
  Database,
  ArrowRight,
  PlaneTakeoff,
  Clock,
  Layers,
  BarChart3,
  Server,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<AnalyticsSummary | null>(null);
  const [dbHealth, setDbHealth] = useState<DatabaseHealth | null>(null);
  const [recentActivity, setRecentActivity] = useState<BaggageMovement[]>([]);
  const [activeFlights, setActiveFlights] = useState<Flight[]>([]);
  const [error, setError] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const [dash, flightList] = await Promise.all([
        api.getDashboardSummary(),
        api.getFlights(),
      ]);
      setMetrics(dash.operationalMetrics);
      setDbHealth(dash.databaseHealth);
      setRecentActivity(dash.recentActivity);
      setActiveFlights(flightList.slice(0, 4));
    } catch (err: any) {
      setError(err.message || 'Failed to load operational dashboard summary');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '1.5rem' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <h2>CARGOFLIGHT Operations Command Console</h2>
          <p style={{ color: '#64748b' }}>Loading live baggage operations & telemetry...</p>
        </div>
        <LoadingSkeleton rows={6} />
      </div>
    );
  }

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Aviation Hero Banner */}
      <div
        className="card"
        style={{
          padding: '1.75rem 2rem',
          backgroundColor: '#06182D', // CARGOFLIGHT Navy
          backgroundImage: 'radial-gradient(circle at 90% 10%, #0878F9 0%, transparent 40%), radial-gradient(circle at 10% 90%, #00C2D7 0%, transparent 30%)',
          color: '#FFFFFF',
          borderRadius: '16px',
          boxShadow: '0 8px 24px rgba(6, 24, 45, 0.2)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.5rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.35rem' }}>
            <span
              style={{
                fontSize: '0.7rem',
                fontWeight: 800,
                color: '#00C2D7',
                backgroundColor: 'rgba(0, 194, 215, 0.15)',
                padding: '0.2rem 0.6rem',
                borderRadius: '6px',
                letterSpacing: '0.08em',
              }}
            >
              SIMULATED OPERATIONS ENVIRONMENT &bull; MAA HUB
            </span>
          </div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.01em' }}>
            CARGOFLIGHT &bull; Airport Cargo & Baggage Tracking System
          </h1>
          <p style={{ color: '#94A3B8', fontSize: '0.875rem', marginTop: '0.35rem', maxWidth: '640px', lineHeight: 1.5 }}>
            Comprehensive full-stack baggage journey monitoring: Check-in &rarr; Security EDS &rarr; Automated Sorting &rarr; Inter-Pier Belts &rarr; Aircraft Cargo Hold Loading &rarr; Baggage Reclaim.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            onClick={loadData}
            className="btn btn-secondary btn-sm"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', color: '#FFFFFF', borderColor: 'rgba(255, 255, 255, 0.2)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <RotateCw size={14} />
            <span>Refresh State</span>
          </button>
          <Link
            to="/registration"
            className="btn btn-primary btn-sm"
            style={{ backgroundColor: '#0878F9', borderColor: '#0878F9', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Luggage size={14} />
            <span>Register New Bag</span>
          </Link>
        </div>
      </div>

      {error && (
        <div style={{ padding: '1rem', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', color: '#EF4444', fontSize: '0.875rem' }}>
          {error}
        </div>
      )}

      {/* KPI Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <StatCard
          label="TOTAL BAGGAGE PROCESSED"
          value={metrics?.totalBaggageProcessed ?? 0}
          subValue="PostgreSQL Authoritative Records"
          icon={<Luggage size={22} />}
          variant="default"
        />
        <StatCard
          label="IN SCREENING & SORTING"
          value={(metrics?.awaitingSecurity ?? 0) + (metrics?.inSorting ?? 0)}
          subValue="Level 1/2 X-Ray & Sorter Core"
          icon={<ShieldCheck size={22} />}
          variant="info"
        />
        <StatCard
          label="LOADED ON AIRCRAFT"
          value={metrics?.loaded ?? 0}
          subValue="Cargo Hold Manifest Verified"
          icon={<Truck size={22} />}
          variant="success"
        />
        <StatCard
          label="ACTIVE EXCEPTIONS"
          value={metrics?.openExceptionsCount ?? 0}
          subValue={`${metrics?.delayedCount ?? 0} delayed / ${metrics?.misroutedCount ?? 0} misrouted`}
          icon={<AlertTriangle size={22} />}
          variant={metrics?.openExceptionsCount ? 'danger' : 'default'}
        />
      </div>

      {/* Quick Operational Actions Bar */}
      <div
        className="card"
        style={{
          padding: '1.25rem',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '0.75rem',
        }}
      >
        <Link
          to="/registration"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.75rem 1rem',
            backgroundColor: '#F8FAFD',
            border: '1px solid #E2E8F0',
            borderRadius: '8px',
            color: '#14233B',
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem' }}>
            <Luggage size={16} color="#0878F9" /> Register Bag
          </span>
          <ArrowRight size={13} color="#94A3B8" />
        </Link>

        <Link
          to="/handling"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.75rem 1rem',
            backgroundColor: '#F8FAFD',
            border: '1px solid #E2E8F0',
            borderRadius: '8px',
            color: '#14233B',
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem' }}>
            <Layers size={16} color="#0878F9" /> Baggage Handling
          </span>
          <ArrowRight size={13} color="#94A3B8" />
        </Link>

        <Link
          to="/tracking"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.75rem 1rem',
            backgroundColor: '#F8FAFD',
            border: '1px solid #E2E8F0',
            borderRadius: '8px',
            color: '#14233B',
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem' }}>
            <Clock size={16} color="#00C2D7" /> Track Baggage
          </span>
          <ArrowRight size={13} color="#94A3B8" />
        </Link>

        <Link
          to="/flights"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.75rem 1rem',
            backgroundColor: '#F8FAFD',
            border: '1px solid #E2E8F0',
            borderRadius: '8px',
            color: '#14233B',
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem' }}>
            <PlaneTakeoff size={16} color="#0878F9" /> Flights & Manifests
          </span>
          <ArrowRight size={13} color="#94A3B8" />
        </Link>

        <Link
          to="/scans"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.75rem 1rem',
            backgroundColor: '#F8FAFD',
            border: '1px solid #E2E8F0',
            borderRadius: '8px',
            color: '#14233B',
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem' }}>
            <Barcode size={16} color="#10B981" /> Simulate Scan
          </span>
          <ArrowRight size={13} color="#94A3B8" />
        </Link>

        <Link
          to="/routes"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.75rem 1rem',
            backgroundColor: '#F8FAFD',
            border: '1px solid #E2E8F0',
            borderRadius: '8px',
            color: '#14233B',
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem' }}>
            <Network size={16} color="#0878F9" /> Optimize Route
          </span>
          <ArrowRight size={13} color="#94A3B8" />
        </Link>

        <Link
          to="/analytics"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.75rem 1rem',
            backgroundColor: '#F8FAFD',
            border: '1px solid #E2E8F0',
            borderRadius: '8px',
            color: '#14233B',
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem' }}>
            <BarChart3 size={16} color="#6366F1" /> Analytics & DW
          </span>
          <ArrowRight size={13} color="#94A3B8" />
        </Link>
      </div>

      {/* Main Grid: Activity Stream & Flights Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        {/* Left Column: Recent Activity & Movement */}
        <div className="card">
          <div className="card-header">
            <div>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#14233B' }}>
                Live Baggage Movement Events
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                Latest sequential checkpoint scans
              </div>
            </div>
            <Link to="/tracking" style={{ fontSize: '0.8125rem', color: '#0878F9', fontWeight: 600, textDecoration: 'none' }}>
              Baggage Tracker &rarr;
            </Link>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {recentActivity.length === 0 ? (
              <div style={{ padding: '2.5rem', textAlign: 'center', color: '#64748B' }}>
                <Barcode size={32} style={{ margin: '0 auto 0.5rem', opacity: 0.5 }} />
                <div>No movement scans recorded yet.</div>
                <Link to="/scans" className="btn btn-secondary btn-sm" style={{ marginTop: '0.5rem', display: 'inline-flex' }}>
                  Simulate First Scan
                </Link>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Time (IST)</th>
                      <th>Tag</th>
                      <th>Checkpoint</th>
                      <th>Stage</th>
                      <th>Scanner / Op</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentActivity.slice(0, 8).map((act) => (
                      <tr key={act.id}>
                        <td style={{ fontSize: '0.75rem', color: '#64748B', whiteSpace: 'nowrap' }}>
                          {new Date(act.recordedAt).toLocaleTimeString('en-GB', { timeZone: 'Asia/Kolkata', hour12: false })}
                        </td>
                        <td>
                          <Link to={`/tracking?tag=${act.baggageTag}`} style={{ fontWeight: 700, color: '#0878F9' }}>
                            {act.baggageTag}
                          </Link>
                        </td>
                        <td style={{ fontSize: '0.8125rem', color: '#334155' }}>
                          {act.handlingPointName || act.handlingPointId || 'MAA Hub'}
                        </td>
                        <td>
                          <StatusBadge status={act.statusAfter} size="sm" />
                        </td>
                        <td style={{ fontSize: '0.75rem', color: '#64748B' }}>
                          {act.scannerId || act.operatorUsername || 'system'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Active Flights & Database Verification Widget */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Active Flights Overview */}
          <div className="card">
            <div className="card-header">
              <div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#14233B' }}>
                  Active Flights at Hub
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Baggage loading state</div>
              </div>
              <Link to="/flights" style={{ fontSize: '0.75rem', color: '#0878F9', fontWeight: 600 }}>
                All Flights
              </Link>
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1rem' }}>
              {activeFlights.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#64748B', fontSize: '0.8rem', padding: '1rem' }}>
                  No flights currently scheduled.
                </div>
              ) : (
                activeFlights.map((f) => (
                  <div
                    key={f.id}
                    style={{
                      padding: '0.75rem',
                      backgroundColor: '#F8FAFD',
                      borderRadius: '8px',
                      border: '1px solid #E2E8F0',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 800, color: '#0878F9', fontSize: '0.9rem' }}>{f.flightNumber}</span>
                      <StatusBadge status={f.status} size="sm" />
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#475569', marginTop: '0.2rem' }}>
                      {f.originIata} &rarr; {f.destinationIata} &bull; T{f.terminal} Gate {f.gate}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#64748B', marginTop: '0.4rem' }}>
                      <span>Loaded: {f.totalLoadedBags} / {f.totalExpectedBags}</span>
                      <span style={{ fontWeight: 700, color: '#0878F9' }}>{f.loadingProgressPercent}%</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 3-Database Health Status */}
          <div className="card">
            <div className="card-header">
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#14233B' }}>
                3-Database Integration
              </div>
              <Link to="/database-center" style={{ fontSize: '0.75rem', color: '#0878F9', fontWeight: 600 }}>
                Details
              </Link>
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', padding: '1rem' }}>
              {(dbHealth?.databases || []).map((db) => (
                <div
                  key={db.databaseName}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.55rem 0.75rem',
                    backgroundColor: '#F8FAFD',
                    borderRadius: '6px',
                    border: '1px solid #E2E8F0',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#14233B' }}>
                      {db.databaseName}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#64748B' }}>
                      {db.role.replace(/_/g, ' ')}
                    </div>
                  </div>
                  <StatusBadge status={db.status} size="sm" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
