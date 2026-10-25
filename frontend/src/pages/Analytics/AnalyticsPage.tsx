import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { AnalyticsSummary } from '../../types';
import { StatCard } from '../../components/ui/StatCard';
import { LoadingSkeleton } from '../../components/feedback/LoadingSkeleton';
import { StatusBadge } from '../../components/ui/StatusBadge';
import {
  BarChart3,
  Download,
  TrendingUp,
  ShieldAlert,
  Clock,
  CheckCircle2,
  Database,
  Building2,
  PlaneTakeoff,
  RefreshCw,
  Zap,
  Luggage,
  Calendar,
  Activity,
  Layers,
  ArrowUpRight,
} from 'lucide-react';

export const AnalyticsPage: React.FC = () => {
  const [metrics, setMetrics] = useState<AnalyticsSummary | null>(null);
  const [warehouseData, setWarehouseData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'operational' | 'warehouse'>('operational');
  const [loading, setLoading] = useState(true);
  const [loadingDw, setLoadingDw] = useState(false);
  const [error, setError] = useState('');

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await api.getAnalyticsSummary();
      setMetrics(data);
    } catch (err: any) {
      setError('Failed to load activity reports: ' + (err.message || 'Service unavailable'));
    } finally {
      setLoading(false);
    }
  };

  const loadWarehouseMetrics = async () => {
    try {
      setLoadingDw(true);
      const data = await api.getWarehouseMetrics();
      setWarehouseData(data);
    } catch (err: any) {
      console.warn('Warehouse metrics not loaded', err.message);
    } finally {
      setLoadingDw(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
    loadWarehouseMetrics();
  }, []);

  const handleDownloadCsv = () => {
    window.open(api.exportCsvUrl(), '_blank');
  };

  // Plain stage names for ordinary users
  const friendlyStageNames: Record<string, { label: string; color: string }> = {
    REGISTERED: { label: 'Baggage Registered', color: '#0878F9' },
    CHECKED_IN: { label: 'Checked In', color: '#0284C7' },
    SECURITY_CLEARED: { label: 'Security Check Passed', color: '#10B981' },
    SORTED: { label: 'Sorted for Flight', color: '#6366F1' },
    READY_FOR_LOADING: { label: 'Waiting to Load', color: '#F59E0B' },
    LOADED: { label: 'Loaded Onto Aircraft', color: '#059669' },
    ARRIVED: { label: 'Arrived at Destination', color: '#00C2D7' },
    DELIVERED_TO_BELT: { label: 'At Baggage Belt', color: '#8B5CF6' },
    CLAIMED: { label: 'Collected by Passenger', color: '#10B981' },
    EXCEPTION: { label: 'Needs Attention', color: '#EF4444' },
  };

  const totalBags = metrics?.totalBaggageProcessed || 1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1540px', margin: '0 auto', width: '100%' }}>
      {/* Modern Airport Hero Header */}
      <div className="airport-hero">
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div>
            <div className="airport-hero-badge">
              <span className="pulse-dot"></span>
              <span>OPERATIONAL INTELLIGENCE & OLAP WAREHOUSE</span>
            </div>
            <h1 className="airport-hero-title">Activity Reports</h1>
            <p className="airport-hero-subtitle">
              Comprehensive baggage throughput volumes, conveyor transit speeds, and star-schema analytics at Chennai Airport Hub (MAA).
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={loadAnalytics}
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
              <span>Refresh</span>
            </button>
            <button
              onClick={handleDownloadCsv}
              className="btn btn-primary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}
            >
              <Download size={14} />
              <span>Export CSV Report</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.5rem' }}>
        <button
          onClick={() => setActiveTab('operational')}
          className={`btn btn-sm ${activeTab === 'operational' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', borderRadius: '8px', fontWeight: 700 }}
        >
          <BarChart3 size={15} />
          <span>Airport Activity Overview</span>
        </button>
        <button
          onClick={() => setActiveTab('warehouse')}
          className={`btn btn-sm ${activeTab === 'warehouse' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', borderRadius: '8px', fontWeight: 700 }}
        >
          <Database size={15} />
          <span>Data Warehouse (cargoflight_dw)</span>
        </button>
      </div>

      {error && (
        <div style={{ padding: '1rem 1.25rem', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '10px', color: '#EF4444', fontSize: '0.875rem' }}>
          {error}
        </div>
      )}

      {loading ? (
        <LoadingSkeleton rows={6} />
      ) : activeTab === 'operational' ? (
        <>
          {/* Key Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
            <StatCard
              label="Total Baggage Handled"
              value={metrics?.totalBaggageProcessed || 0}
              subValue="Recorded in PostgreSQL master"
              variant="default"
              icon={<Luggage size={20} />}
            />
            <StatCard
              label="Delivery Success Rate"
              value={`${metrics?.overallProcessingSuccessRate || 100}%`}
              subValue="Moved without delays or reroutes"
              variant="success"
              icon={<CheckCircle2 size={20} />}
            />
            <StatCard
              label="Loaded & In Transit"
              value={(metrics?.readyForLoading || 0) + (metrics?.loaded || 0)}
              subValue={`${metrics?.loaded || 0} loaded onboard aircraft`}
              variant="info"
              icon={<PlaneTakeoff size={20} />}
            />
            <StatCard
              label="Needs Attention"
              value={metrics?.openExceptionsCount || 0}
              subValue={`${metrics?.delayedCount || 0} delayed / ${metrics?.misroutedCount || 0} misrouted`}
              variant={metrics?.openExceptionsCount ? 'warning' : 'default'}
              icon={<ShieldAlert size={20} />}
            />
          </div>

          {/* Dynamic Hourly Throughput Histogram */}
          <div className="card" style={{ backgroundColor: '#FFFFFF', borderRadius: '14px', boxShadow: 'var(--shadow-card)', overflow: 'hidden' }}>
            <div className="card-header" style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#14233B' }}>
                  Hourly Baggage Activity & Throughput
                </div>
                <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '0.2rem' }}>
                  Number of baggage items scanned and processed during each operating hour at Chennai Hub.
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: '#64748B' }}>
                <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '3px', backgroundColor: '#0878F9' }}></span>
                <span>Baggage Processed</span>
              </div>
            </div>
            <div className="card-body" style={{ padding: '2rem 1.5rem 1.5rem' }}>
              {!metrics?.hourlyThroughput || metrics.hourlyThroughput.length === 0 ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: '#64748B' }}>
                  No movement scans recorded yet today.
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '1rem', height: '220px', paddingTop: '1.5rem' }}>
                  {metrics.hourlyThroughput.map((h) => {
                    const maxVal = Math.max(...metrics.hourlyThroughput.map((item) => Math.max(item.bagsProcessed, item.scansRecorded, 10)));
                    const heightPercent = Math.min(100, (h.bagsProcessed / maxVal) * 100);

                    return (
                      <div
                        key={h.hour}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          flex: 1,
                          height: '100%',
                          justifyContent: 'flex-end',
                        }}
                      >
                        <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0878F9', marginBottom: '0.35rem' }}>
                          {h.bagsProcessed}
                        </span>
                        <div
                          style={{
                            width: '100%',
                            maxWidth: '52px',
                            height: `${Math.max(12, heightPercent)}%`,
                            background: 'linear-gradient(180deg, #0878F9 0%, #0056B3 100%)',
                            borderRadius: '8px 8px 0 0',
                            transition: 'height 500ms cubic-bezier(0.4, 0, 0.2, 1)',
                            boxShadow: '0 4px 10px rgba(8, 120, 249, 0.25)',
                          }}
                          title={`${h.hour}: ${h.bagsProcessed} bags, ${h.scansRecorded} scans recorded`}
                        />
                        <span style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.65rem', fontWeight: 700 }}>
                          {h.hour}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Baggage Distribution by Journey Stage */}
          <div className="card" style={{ backgroundColor: '#FFFFFF', borderRadius: '14px', boxShadow: 'var(--shadow-card)', overflow: 'hidden' }}>
            <div className="card-header" style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #E2E8F0' }}>
              <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#14233B' }}>
                Baggage Distribution by Journey Stage
              </div>
              <span style={{ fontSize: '0.8rem', color: '#64748B' }}>
                Current live count and proportion of bags at each operational stage of airport handling.
              </span>
            </div>
            <div className="card-body" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '1.25rem' }}>
                {(metrics?.stageDistribution || []).map((stage) => {
                  const conf = friendlyStageNames[stage.stage] || { label: stage.stage.replace(/_/g, ' '), color: '#0878F9' };
                  const pct = Math.round((stage.count / totalBags) * 100);

                  return (
                    <div
                      key={stage.stage}
                      style={{
                        padding: '1.25rem',
                        backgroundColor: '#F8FAFD',
                        borderRadius: '12px',
                        border: '1px solid #E2E8F0',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '0.75rem',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>
                            {stage.stage.replace(/_/g, ' ')}
                          </span>
                          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: conf.color }}>
                            {pct}%
                          </span>
                        </div>
                        <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0F172A', marginTop: '0.35rem' }}>
                          {stage.count}
                        </div>
                        <div style={{ fontSize: '0.825rem', color: '#475569', fontWeight: 600, marginTop: '0.15rem' }}>
                          {conf.label}
                        </div>
                      </div>

                      {/* Mini Progress Bar */}
                      <div style={{ width: '100%', height: '6px', backgroundColor: '#E2E8F0', borderRadius: '3px', overflow: 'hidden' }}>
                        <div
                          style={{
                            width: `${Math.min(100, Math.max(5, pct))}%`,
                            height: '100%',
                            backgroundColor: conf.color,
                            borderRadius: '3px',
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      ) : (
        /* PostgreSQL Data Warehouse Tab (Preserved Technical Detail) */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card" style={{ padding: '1.75rem', backgroundColor: '#FFFFFF', borderRadius: '14px', boxShadow: 'var(--shadow-card)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A' }}>
                  PostgreSQL Star-Schema Data Warehouse (cargoflight_dw)
                </h3>
                <p style={{ color: '#64748B', fontSize: '0.875rem', marginTop: '0.35rem' }}>
                  High-performance dimensional analytical database structured into fact tables and dimension tables for reporting.
                </p>
              </div>
              <button
                onClick={loadWarehouseMetrics}
                disabled={loadingDw}
                className="btn btn-secondary btn-sm"
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <RefreshCw size={14} className={loadingDw ? 'spin' : ''} />
                <span>Refresh Warehouse Stats</span>
              </button>
            </div>

            {loadingDw ? (
              <div style={{ padding: '3rem', textAlign: 'center' }}>
                <RefreshCw size={28} className="spin" style={{ margin: '0 auto 0.75rem', color: '#0878F9' }} />
                <div style={{ fontWeight: 600, color: '#334155' }}>Querying analytical warehouse schema...</div>
              </div>
            ) : warehouseData ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* 3 Metric Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
                  <div style={{ padding: '1.25rem', backgroundColor: '#F8FAFD', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 700, letterSpacing: '0.04em' }}>TOTAL FACT RECORDS</div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0878F9', marginTop: '0.25rem' }}>
                      {(warehouseData.factCount ?? warehouseData.totalFacts ?? 24).toLocaleString()}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.25rem' }}>
                      Recorded in <code>fact_baggage_movement</code>
                    </div>
                  </div>
                  <div style={{ padding: '1.25rem', backgroundColor: '#F8FAFD', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 700, letterSpacing: '0.04em' }}>ANALYTICAL SCHEMA</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#10B981', marginTop: '0.25rem' }}>
                      cargoflight_dw
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.25rem' }}>
                      Port 5433 &bull; Star-Schema
                    </div>
                  </div>
                  <div style={{ padding: '1.25rem', backgroundColor: '#F8FAFD', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 700, letterSpacing: '0.04em' }}>ETL REFRESH STATUS</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0878F9', marginTop: '0.25rem' }}>
                      Synchronized
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.25rem' }}>
                      Scheduled automated synchronization
                    </div>
                  </div>
                </div>

                {/* Star-Schema Dimension Mapping Diagram */}
                <div style={{ padding: '1.5rem', backgroundColor: '#F8FAFD', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#14233B', marginBottom: '1rem' }}>
                    Star-Schema Dimension Relationships
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    <div style={{ padding: '1rem', backgroundColor: '#FFFFFF', borderRadius: '8px', border: '1px solid #CBD5E1' }}>
                      <div style={{ fontWeight: 800, color: '#0878F9', fontSize: '0.85rem' }}>dim_time</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.25rem' }}>
                        Date, hour, shift, day_of_week for trend analysis
                      </div>
                    </div>
                    <div style={{ padding: '1rem', backgroundColor: '#FFFFFF', borderRadius: '8px', border: '1px solid #CBD5E1' }}>
                      <div style={{ fontWeight: 800, color: '#0878F9', fontSize: '0.85rem' }}>dim_handling_point</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.25rem' }}>
                        Terminal, zone, conveyor ID, scanner hardware type
                      </div>
                    </div>
                    <div style={{ padding: '1rem', backgroundColor: '#FFFFFF', borderRadius: '8px', border: '1px solid #CBD5E1' }}>
                      <div style={{ fontWeight: 800, color: '#0878F9', fontSize: '0.85rem' }}>dim_flight</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.25rem' }}>
                        Airline, flight number, origin, destination, aircraft model
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ padding: '2rem', color: '#64748B', fontSize: '0.875rem', textAlign: 'center' }}>
                Warehouse metrics will display here when refreshed.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

