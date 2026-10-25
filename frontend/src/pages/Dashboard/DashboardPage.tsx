import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { AnalyticsSummary, DatabaseHealth, BaggageMovement, Flight } from '../../types';
import { StatCard } from '../../components/ui/StatCard';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { LoadingSkeleton } from '../../components/feedback/LoadingSkeleton';
import { useExperienceMode } from '../../context/ExperienceModeContext';
import {
  Luggage,
  ShieldCheck,
  RotateCw,
  CheckCircle2,
  AlertTriangle,
  Barcode,
  ArrowRight,
  PlaneTakeoff,
  Clock,
  Layers,
  BarChart3,
  Search,
  Building2,
  Server,
  Sparkles,
} from 'lucide-react';
import { getFriendlyLocationName } from '../../services/locationMapping';

export const DashboardPage: React.FC = () => {
  const { isSimple } = useExperienceMode();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<AnalyticsSummary | null>(null);
  const [dbHealth, setDbHealth] = useState<DatabaseHealth | null>(null);
  const [recentActivity, setRecentActivity] = useState<BaggageMovement[]>([]);
  const [activeFlights, setActiveFlights] = useState<Flight[]>([]);
  const [allFlightsCount, setAllFlightsCount] = useState<number>(0);
  const [error, setError] = useState('');
  const [quickSearchTag, setQuickSearchTag] = useState('');

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
      setRecentActivity(dash.recentActivity || []);
      setActiveFlights(flightList.slice(0, 5));
      setAllFlightsCount(flightList.length);
    } catch (err: any) {
      setError(err.message || 'Something went wrong while loading this information. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleQuickSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const tag = quickSearchTag.trim();
    if (!tag) return;
    if (tag.toUpperCase().startsWith('AI-') || tag.toUpperCase().startsWith('6E-') || tag.toUpperCase().startsWith('SG-')) {
      navigate(`/flights?search=${encodeURIComponent(tag)}`);
    } else {
      navigate(`/tracking?tag=${encodeURIComponent(tag)}`);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '1.5rem', maxWidth: '1300px', margin: '0 auto' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0F172A' }}>Welcome to FlyTrack</h2>
          <p style={{ color: '#64748B' }}>Loading baggage information, flight status, and recent updates...</p>
        </div>
        <LoadingSkeleton rows={6} />
      </div>
    );
  }

  // Calculated verified metrics from actual backend data
  const totalBaggageTracked = metrics?.totalBaggageProcessed ?? 0;
  const flightsToday = allFlightsCount || activeFlights.length;
  const deliveredCount =
    (metrics?.statusDistribution?.['LOADED'] ?? 0) +
    (metrics?.statusDistribution?.['DELIVERED_TO_BELT'] ?? 0) +
    (metrics?.statusDistribution?.['CLAIMED'] ?? 0) ||
    ((metrics?.loaded ?? 0) + (metrics?.awaitingCollection ?? 0));
  const needsAttentionCount =
    (metrics?.delayedCount ?? 0) +
    (metrics?.misroutedCount ?? 0) +
    (metrics?.openExceptionsCount ?? 0);

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1540px', margin: '0 auto', width: '100%' }}>
      {/* Modern Airport Hero Banner */}
      <div className="airport-hero">
        <div className="airport-hero-content">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <span className="airport-hero-badge">
              <span className="pulse-dot" style={{ width: '6px', height: '6px' }} />
              Airport Hub Active
            </span>
            <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>&bull; Chennai International Airport [MAA] &bull; Terminal 2</span>
          </div>

          <h1 className="airport-hero-title">
            Welcome to FlyTrack
          </h1>

          <p className="airport-hero-subtitle">
            Track baggage, check flights, and find out what needs attention across all 11 handling zones.
          </p>

          {/* Quick Baggage Search Field */}
          <form onSubmit={handleQuickSearch} style={{ marginTop: '1.25rem', display: 'flex', gap: '0.5rem', maxWidth: '540px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={16} style={{ position: 'absolute', left: '0.85rem', top: '0.85rem', color: '#94A3B8' }} />
              <input
                type="text"
                value={quickSearchTag}
                onChange={(e) => setQuickSearchTag(e.target.value)}
                placeholder="Enter baggage tracking number (e.g. MAA6E008912, BAG1001)"
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem 0.65rem 2.4rem',
                  fontSize: '0.85rem',
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  color: '#0F172A',
                  outline: 'none',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                }}
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              style={{
                backgroundColor: '#0878F9',
                borderColor: '#0878F9',
                padding: '0.65rem 1.25rem',
                fontWeight: 600,
                borderRadius: '10px',
                boxShadow: '0 0 16px rgba(8, 120, 249, 0.4)',
              }}
            >
              Track My Baggage
            </button>
          </form>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', alignItems: 'flex-start', position: 'relative', zIndex: 2 }}>
          <button
            onClick={loadData}
            className="btn btn-secondary btn-sm"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              color: '#FFFFFF',
              borderColor: 'rgba(255, 255, 255, 0.25)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              borderRadius: '8px',
              backdropFilter: 'blur(4px)',
            }}
          >
            <RotateCw size={14} />
            <span>Refresh Information</span>
          </button>

          <Link
            to="/tracking"
            className="btn btn-sm"
            style={{
              backgroundColor: '#00C2D7',
              color: '#03111F',
              border: 'none',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              borderRadius: '8px',
              textDecoration: 'none',
              boxShadow: '0 0 16px rgba(0, 194, 215, 0.35)',
            }}
          >
            <Clock size={14} />
            <span>Track Baggage Journey</span>
          </Link>
        </div>
      </div>

      {error && (
        <div style={{ padding: '1rem', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '10px', color: '#B91C1C', fontSize: '0.875rem' }}>
          {error}
        </div>
      )}

      {/* Needs Attention Alert Banner (if issues exist) */}
      {needsAttentionCount > 0 && (
        <div
          style={{
            padding: '1rem 1.25rem',
            backgroundColor: '#FFFBEB',
            border: '1px solid #FDE68A',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertTriangle size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 700, color: '#92400E', fontSize: '0.9rem' }}>
                {needsAttentionCount} baggage item{needsAttentionCount > 1 ? 's' : ''} require attention
              </div>
              <div style={{ fontSize: '0.775rem', color: '#B45309' }}>
                Delays, reroutes, or routine secondary security inspections have been flagged.
              </div>
            </div>
          </div>
          <Link
            to="/exceptions"
            className="btn btn-sm"
            style={{
              backgroundColor: '#D97706',
              color: '#FFFFFF',
              border: 'none',
              fontWeight: 600,
              textDecoration: 'none',
              borderRadius: '8px',
            }}
          >
            <span>View Problems & Delays</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      )}

      {/* 4 Summary Cards using verified backend data */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
        <StatCard
          label="Baggage Being Tracked"
          value={totalBaggageTracked}
          subValue="Active in airport handling network"
          icon={<Luggage size={22} />}
          variant="default"
        />
        <StatCard
          label="Flights Today"
          value={flightsToday}
          subValue="Chennai Airport arrivals & departures"
          icon={<PlaneTakeoff size={22} />}
          variant="info"
        />
        <StatCard
          label="Successfully Delivered"
          value={deliveredCount}
          subValue="Loaded onto aircraft or at collection belt"
          icon={<CheckCircle2 size={22} />}
          variant="success"
        />
        <StatCard
          label="Needs Attention"
          value={needsAttentionCount}
          subValue={needsAttentionCount === 0 ? 'All bags moving on schedule' : 'Delays or pending checks'}
          icon={<AlertTriangle size={22} />}
          variant={needsAttentionCount > 0 ? 'warning' : 'default'}
        />
      </div>

      {/* Quick Action Navigation Buttons */}
      <div
        className="card"
        style={{
          padding: '1.25rem',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
          gap: '0.75rem',
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
        }}
      >
        <Link
          to="/tracking"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.85rem 1rem',
            backgroundColor: '#F8FAFD',
            border: '1px solid #E2E8F0',
            borderRadius: '10px',
            color: '#14233B',
            fontWeight: 600,
            textDecoration: 'none',
            transition: 'all 150ms ease',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', fontSize: '0.85rem' }}>
            <Search size={18} color="#0878F9" /> Track Baggage
          </span>
          <ArrowRight size={14} color="#94A3B8" />
        </Link>

        <Link
          to="/flights"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.85rem 1rem',
            backgroundColor: '#F8FAFD',
            border: '1px solid #E2E8F0',
            borderRadius: '10px',
            color: '#14233B',
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', fontSize: '0.85rem' }}>
            <PlaneTakeoff size={18} color="#0878F9" /> View Flights
          </span>
          <ArrowRight size={14} color="#94A3B8" />
        </Link>

        <Link
          to="/registration"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.85rem 1rem',
            backgroundColor: '#F8FAFD',
            border: '1px solid #E2E8F0',
            borderRadius: '10px',
            color: '#14233B',
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', fontSize: '0.85rem' }}>
            <Luggage size={18} color="#0878F9" /> Register Baggage
          </span>
          <ArrowRight size={14} color="#94A3B8" />
        </Link>

        <Link
          to="/exceptions"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.85rem 1rem',
            backgroundColor: '#F8FAFD',
            border: '1px solid #E2E8F0',
            borderRadius: '10px',
            color: '#14233B',
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', fontSize: '0.85rem' }}>
            <AlertTriangle size={18} color="#D97706" /> View Problems
          </span>
          <ArrowRight size={14} color="#94A3B8" />
        </Link>

        <Link
          to="/analytics"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.85rem 1rem',
            backgroundColor: '#F8FAFD',
            border: '1px solid #E2E8F0',
            borderRadius: '10px',
            color: '#14233B',
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', fontSize: '0.85rem' }}>
            <BarChart3 size={18} color="#0878F9" /> Activity Reports
          </span>
          <ArrowRight size={14} color="#94A3B8" />
        </Link>
      </div>

      {/* Main Grid: Recent Activity Stream & Flights Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: '1.5rem' }}>
        {/* Left Column: Recent Baggage Activity */}
        <div className="card" style={{ backgroundColor: '#FFFFFF', borderRadius: '12px' }}>
          <div className="card-header" style={{ padding: '1.25rem', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: '#14233B' }}>
                Recent Baggage Activity
              </div>
              <div style={{ fontSize: '0.785rem', color: '#64748B', marginTop: '0.2rem' }}>
                Live updates as baggage moves through security, sorting, and aircraft loading.
              </div>
            </div>
            <Link to="/tracking" style={{ fontSize: '0.8125rem', color: '#0878F9', fontWeight: 600, textDecoration: 'none' }}>
              Full Baggage Search &rarr;
            </Link>
          </div>

          <div className="card-body" style={{ padding: 0 }}>
            {recentActivity.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#64748B' }}>
                <Barcode size={36} style={{ margin: '0 auto 0.75rem', opacity: 0.4 }} />
                <div style={{ fontWeight: 600, color: '#1E293B' }}>No movement scans recorded yet.</div>
                <div style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>Baggage will appear here as soon as check-in tags are scanned.</div>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#F8FAFD', borderBottom: '1px solid #E2E8F0', textAlign: 'left', color: '#64748B', fontSize: '0.75rem' }}>
                      <th style={{ padding: '0.75rem 1rem' }}>Time</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Baggage Tag</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Location</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Journey Status</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentActivity.slice(0, 7).map((act) => (
                      <tr key={act.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '0.75rem 1rem', fontSize: '0.775rem', color: '#64748B', whiteSpace: 'nowrap' }}>
                          {new Date(act.recordedAt).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true })}
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <Link to={`/tracking?tag=${act.baggageTag}`} style={{ fontWeight: 700, color: '#0878F9', textDecoration: 'none' }}>
                            {act.baggageTag}
                          </Link>
                        </td>
                        <td style={{ padding: '0.75rem 1rem', fontSize: '0.8125rem', color: '#334155' }}>
                          <div style={{ fontWeight: 600 }}>{getFriendlyLocationName(act.handlingPointId, act.handlingPointName)}</div>
                          {act.handlingPointId && (
                            <div style={{ fontSize: '0.7rem', color: '#64748B', fontFamily: 'monospace' }}>
                              {act.handlingPointId}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <StatusBadge status={act.statusAfter} size="sm" />
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <Link
                            to={`/tracking?tag=${act.baggageTag}`}
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '0.25rem 0.55rem', fontSize: '0.75rem' }}
                          >
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
        </div>

        {/* Right Column: Flights Today & System Status */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Flights Today Card */}
          <div className="card" style={{ backgroundColor: '#FFFFFF', borderRadius: '12px' }}>
            <div className="card-header" style={{ padding: '1.25rem', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: '#14233B' }}>
                  Flights Today
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Departures & Baggage Loading</div>
              </div>
              <Link to="/flights" style={{ fontSize: '0.75rem', color: '#0878F9', fontWeight: 600, textDecoration: 'none' }}>
                All Flights &rarr;
              </Link>
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1rem' }}>
              {activeFlights.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#64748B', fontSize: '0.8rem', padding: '1.5rem' }}>
                  No flights currently scheduled.
                </div>
              ) : (
                activeFlights.map((f) => (
                  <div
                    key={f.id}
                    style={{
                      padding: '0.85rem 1rem',
                      backgroundColor: '#FFFFFF',
                      borderRadius: '12px',
                      border: '1px solid #E2E8F0',
                      boxShadow: '0 1px 3px rgba(6, 24, 45, 0.03)',
                      transition: 'border-color 150ms ease',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontWeight: 800, color: '#0878F9', fontSize: '0.925rem' }}>{f.flightNumber}</span>
                        <span style={{ fontSize: '0.725rem', color: '#64748B', fontWeight: 600 }}>{f.airlineName || 'Commercial Flight'}</span>
                      </div>
                      <StatusBadge status={f.status} size="sm" />
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginTop: '0.5rem' }}>
                      <span className="airport-code-tag">{f.originIata}</span>
                      <span style={{ color: '#0878F9', fontSize: '0.8rem' }}>&rarr;</span>
                      <span className="airport-code-tag">{f.destinationIata}</span>
                      <span style={{ fontSize: '0.725rem', color: '#64748B', marginLeft: 'auto' }}>
                        T{f.terminal} &bull; Gate {f.gate}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748B', marginTop: '0.65rem' }}>
                      <span>Baggage: <strong>{f.totalLoadedBags} / {f.totalExpectedBags}</strong> bags</span>
                      <span style={{ fontWeight: 700, color: '#0878F9' }}>{f.loadingProgressPercent}%</span>
                    </div>

                    {/* Progress Bar */}
                    <div style={{ width: '100%', height: '6px', backgroundColor: '#EFF6FF', borderRadius: '4px', overflow: 'hidden', marginTop: '0.35rem', border: '1px solid #DBEAFE' }}>
                      <div
                        style={{
                          width: `${Math.min(100, f.loadingProgressPercent || 0)}%`,
                          height: '100%',
                          backgroundColor: f.loadingProgressPercent >= 100 ? '#10B981' : '#0878F9',
                          transition: 'width 250ms ease',
                        }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* System Status Card */}
          <div className="card" style={{ backgroundColor: '#FFFFFF', borderRadius: '12px' }}>
            <div className="card-header" style={{ padding: '1.25rem', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: '#14233B' }}>
                  System Status
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Connected airport database services</div>
              </div>
              <Link to="/database-center" style={{ fontSize: '0.75rem', color: '#0878F9', fontWeight: 600, textDecoration: 'none' }}>
                Health Check &rarr;
              </Link>
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', padding: '1rem' }}>
              {(dbHealth?.databases || []).map((db) => {
                const friendlyPurpose =
                  db.databaseName.toLowerCase().includes('postgres')
                    ? 'Flights & Baggage Master Records'
                    : db.databaseName.toLowerCase().includes('mongo')
                    ? 'Live Scanner Activity Logs'
                    : 'Baggage Route Optimization';
                return (
                  <div
                    key={db.databaseName}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.6rem 0.75rem',
                      backgroundColor: '#F8FAFD',
                      borderRadius: '8px',
                      border: '1px solid #E2E8F0',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#14233B' }}>
                        {db.databaseName}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#64748B' }}>
                        {friendlyPurpose}
                      </div>
                    </div>
                    <StatusBadge status={db.status} size="sm" />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
