import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { BaggageException } from '../../types';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { StatCard } from '../../components/ui/StatCard';
import { LoadingSkeleton } from '../../components/feedback/LoadingSkeleton';
import {
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Filter,
  FileText,
  Clock,
  MapPin,
  ArrowRight,
  ShieldAlert,
  HelpCircle,
  CheckCircle2,
  Search,
  Zap,
  Luggage,
  ShieldCheck,
  Radio,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { getFriendlyLocationName } from '../../services/locationMapping';
import { useAuth } from '../../context/AuthContext';

export const ExceptionsPage: React.FC = () => {
  const [exceptions, setExceptions] = useState<BaggageException[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');
  const [resolvingId, setResolvingId] = useState<number | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');

  const { hasRole } = useAuth();
  const canResolve = hasRole(['SYSTEM_ADMIN', 'OPERATIONS_MANAGER', 'SECURITY_OFFICER']);

  const loadExceptions = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await api.getExceptions(statusFilter);
      setExceptions(data.content || []);
    } catch (err: any) {
      setError('Failed to load problems & delays: ' + (err.message || 'Service unavailable'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExceptions();
  }, [statusFilter]);

  const handleResolve = async (id: number) => {
    if (!resolutionNotes.trim()) {
      setError('Please provide resolution notes before closing the incident.');
      return;
    }
    try {
      await api.resolveException(id, resolutionNotes);
      setResolvingId(null);
      setResolutionNotes('');
      loadExceptions();
    } catch (err: any) {
      setError(err.message || 'Failed to resolve problem');
    }
  };

  // Plain English interpretations based on exception characteristics
  const getProblemDetails = (ex: BaggageException) => {
    const type = (ex.exceptionType || '').toUpperCase();
    const desc = (ex.description || '').toLowerCase();

    if (type.includes('SECURITY') || desc.includes('x-ray') || desc.includes('eds')) {
      return {
        title: 'Security Screening Check Required',
        explanation: 'This bag requires a routine secondary security inspection before it can be loaded.',
        action: 'Airport security personnel are reviewing the baggage screening.',
      };
    }
    if (type.includes('JAM') || desc.includes('jam') || desc.includes('conveyor')) {
      return {
        title: 'Baggage Conveyor Slowdown',
        explanation: 'Movement along the conveyor system was temporarily paused or delayed.',
        action: 'Check latest scan checkpoint to confirm the bag has moved past the transfer junction.',
      };
    }
    if (type.includes('MISROUTE') || desc.includes('misroute')) {
      return {
        title: 'Baggage Route Adjustment Needed',
        explanation: 'The bag was routed to an unexpected checkpoint or carousel.',
        action: 'Ground staff must re-scan the bag at the correct flight sorting line.',
      };
    }
    if (type.includes('SCAN') || desc.includes('scan') || desc.includes('tag')) {
      return {
        title: 'Baggage Scan Unsuccessful',
        explanation: 'The barcode tag was not read clearly by the automated scanner.',
        action: 'Try scanning again manually. If the problem continues, reprint the barcode tag.',
      };
    }
    if (type.includes('FLIGHT') || desc.includes('flight')) {
      return {
        title: 'Flight Assignment Review Required',
        explanation: 'This baggage record is missing an active flight assignment or has a scheduling discrepancy.',
        action: 'Ask an authorized operations staff member to verify the flight assignment.',
      };
    }

    return {
      title: ex.exceptionType.replace(/_/g, ' '),
      explanation: ex.description || 'Movement took longer than expected or requires operational check.',
      action: 'Check latest checkpoint scan and flight schedule.',
    };
  };

  // Filtered exceptions based on severity and search query
  const filteredExceptions = exceptions.filter((ex) => {
    const matchesSeverity = severityFilter === 'ALL' || ex.severity === severityFilter;
    const query = searchQuery.trim().toLowerCase();
    const matchesQuery =
      !query ||
      ex.baggageTag.toLowerCase().includes(query) ||
      (ex.handlingPointName || '').toLowerCase().includes(query) ||
      (ex.description || '').toLowerCase().includes(query) ||
      ex.exceptionType.toLowerCase().includes(query);
    return matchesSeverity && matchesQuery;
  });

  const totalIncidents = exceptions.length;
  const openIncidents = exceptions.filter((e) => e.status === 'OPEN').length;
  const resolvedIncidents = exceptions.filter((e) => e.status === 'RESOLVED').length;
  const criticalCount = exceptions.filter((e) => e.severity === 'CRITICAL' || e.severity === 'HIGH').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1540px', margin: '0 auto', width: '100%' }}>
      {/* Modern Airport Hero Header */}
      <div className="airport-hero">
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div>
            <div className="airport-hero-badge">
              <span className="pulse-dot" style={{ backgroundColor: '#F59E0B' }}></span>
              <span>EXCEPTION & DISRUPTION MANAGEMENT</span>
            </div>
            <h1 className="airport-hero-title">Problems & Delays</h1>
            <p className="airport-hero-subtitle">
              Real-time conveyor halts, screening holds, and sorting alerts at Chennai Airport Hub (MAA) with automated resolution workflows.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button
              onClick={loadExceptions}
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
              <span>Refresh Issues</span>
            </button>
            <Link
              to="/tracking"
              className="btn btn-primary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}
            >
              <Luggage size={14} />
              <span>Track Luggage</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 4 Summary Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
        <StatCard
          label="Total Tracked Incidents"
          value={totalIncidents}
          subValue="Logged in operations database"
          variant="default"
          icon={<AlertTriangle size={20} />}
        />
        <StatCard
          label="Awaiting Staff Action"
          value={openIncidents}
          subValue={openIncidents > 0 ? "Requires ground crew resolution" : "All issues cleared"}
          variant={openIncidents > 0 ? "warning" : "success"}
          icon={<Clock size={20} />}
        />
        <StatCard
          label="Resolved Today"
          value={resolvedIncidents}
          subValue="Returned to normal transit flow"
          variant="success"
          icon={<CheckCircle2 size={20} />}
        />
        <StatCard
          label="Critical / High Priority"
          value={criticalCount}
          subValue="Security screening or conveyor block"
          variant={criticalCount > 0 ? "danger" : "default"}
          icon={<ShieldAlert size={20} />}
        />
      </div>

      {/* Filter and Search Bar */}
      <div
        className="card"
        style={{
          padding: '1.25rem 1.5rem',
          backgroundColor: '#FFFFFF',
          borderRadius: '14px',
          boxShadow: 'var(--shadow-card)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        {/* Status Filter Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {[
            { key: 'ALL', label: `All Issues (${totalIncidents})` },
            { key: 'OPEN', label: `Unresolved (${openIncidents})` },
            { key: 'RESOLVED', label: `Resolved (${resolvedIncidents})` },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`btn btn-sm ${statusFilter === tab.key ? 'btn-primary' : 'btn-secondary'}`}
              style={{ borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600 }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Severity & Search Controls */}
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap', flex: 1, justifyContent: 'flex-end', minWidth: '320px' }}>
          <select
            className="form-select"
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            style={{ width: 'auto', minWidth: '150px', height: '38px', fontSize: '0.8rem', borderRadius: '8px' }}
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical Severity</option>
            <option value="HIGH">High Severity</option>
            <option value="MEDIUM">Medium Severity</option>
            <option value="LOW">Low Severity</option>
          </select>

          <div style={{ position: 'relative', width: '260px' }}>
            <Search size={15} style={{ position: 'absolute', left: '0.75rem', top: '0.7rem', color: '#94A3B8' }} />
            <input
              type="text"
              className="form-input"
              placeholder="Search tag, location, type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '2.25rem', height: '38px', fontSize: '0.8rem', borderRadius: '8px', width: '100%' }}
            />
          </div>
        </div>
      </div>

      {error && (
        <div style={{ padding: '1rem 1.25rem', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '10px', color: '#B91C1C', fontSize: '0.875rem' }}>
          {error}
        </div>
      )}

      {loading ? (
        <LoadingSkeleton rows={5} />
      ) : filteredExceptions.length === 0 ? (
        <div className="card" style={{ padding: '4rem 2rem', textAlign: 'center', color: '#64748B', backgroundColor: '#FFFFFF', borderRadius: '14px', boxShadow: 'var(--shadow-card)' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#ECFDF5', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
            <CheckCircle2 size={36} />
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A' }}>
            No Problems Found
          </h3>
          <p style={{ fontSize: '0.875rem', marginTop: '0.35rem', maxWidth: '480px', margin: '0.35rem auto 0', color: '#64748B' }}>
            {searchQuery || severityFilter !== 'ALL'
              ? 'No issues match your current filters. Try resetting the search or severity criteria.'
              : 'All checked baggage, flights, and conveyor belts at Chennai Airport Hub are currently operating on schedule.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredExceptions.map((ex) => {
            const details = getProblemDetails(ex);
            const isCritical = ex.severity === 'CRITICAL' || ex.severity === 'HIGH';

            return (
              <div
                key={ex.id}
                className="card"
                style={{
                  padding: '1.5rem',
                  backgroundColor: '#FFFFFF',
                  borderRadius: '14px',
                  borderLeft: `5px solid ${isCritical ? '#EF4444' : ex.status === 'RESOLVED' ? '#10B981' : '#F59E0B'}`,
                  boxShadow: 'var(--shadow-card)',
                  transition: 'box-shadow 0.2s ease, transform 0.2s ease',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.45rem', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748B', letterSpacing: '0.04em' }}>
                        INCIDENT #{ex.id}
                      </span>
                      <StatusBadge status={ex.severity} size="sm" />
                      <StatusBadge status={ex.status} size="sm" />
                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          padding: '0.2rem 0.6rem',
                          borderRadius: '6px',
                          backgroundColor: '#F1F5F9',
                          color: '#334155',
                        }}
                      >
                        {ex.exceptionType.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                      {details.title}
                    </h3>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Link
                      to={`/tracking?tag=${ex.baggageTag}`}
                      className="btn btn-primary btn-sm"
                      style={{ fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                    >
                      <Luggage size={14} />
                      <span>Track Tag {ex.baggageTag}</span>
                      <ArrowRight size={13} />
                    </Link>
                  </div>
                </div>

                {/* Plain-Language Explanation */}
                <div style={{ marginTop: '0.85rem', fontSize: '0.9rem', color: '#334155', lineHeight: 1.55 }}>
                  {details.explanation}
                </div>

                {/* Metadata Row: Location, Time & Severity Indicator */}
                <div style={{ display: 'flex', gap: '1.75rem', marginTop: '1rem', flexWrap: 'wrap', fontSize: '0.825rem', color: '#64748B', paddingTop: '0.75rem', borderTop: '1px solid #F1F5F9' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <MapPin size={15} color="#0878F9" />
                    <span>Location: <strong style={{ color: '#0F172A' }}>{getFriendlyLocationName(ex.handlingPointId, ex.handlingPointName)}</strong></span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Clock size={15} color="#0878F9" />
                    <span>
                      Reported: <strong style={{ color: '#0F172A' }}>{new Date(ex.reportedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short', hour12: true })}</strong>
                    </span>
                  </div>
                </div>

                {/* Recommended Action Box */}
                <div
                  style={{
                    marginTop: '1rem',
                    padding: '0.85rem 1.15rem',
                    backgroundColor: '#F8FAFD',
                    border: '1px solid #E2E8F0',
                    borderLeft: '4px solid #0878F9',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    color: '#1E293B',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.65rem',
                  }}
                >
                  <Zap size={16} color="#0878F9" style={{ flexShrink: 0 }} />
                  <div>
                    <strong style={{ color: '#0878F9' }}>Recommended Action: </strong>
                    {details.action}
                  </div>
                </div>

                {/* Resolution Notes display if resolved */}
                {ex.resolutionNotes && (
                  <div
                    style={{
                      marginTop: '0.85rem',
                      padding: '0.75rem 1.15rem',
                      backgroundColor: '#ECFDF5',
                      border: '1px solid #A7F3D0',
                      borderRadius: '8px',
                      fontSize: '0.825rem',
                      color: '#065F46',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    <CheckCircle2 size={16} color="#10B981" style={{ flexShrink: 0 }} />
                    <div>
                      <strong>Resolution Record: </strong> {ex.resolutionNotes} (Resolved by {ex.resolvedBy || 'Operations Team'})
                    </div>
                  </div>
                )}

                {/* Authorized Staff Resolution Workflow */}
                {canResolve && ex.status === 'OPEN' && (
                  <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid #F1F5F9' }}>
                    {resolvingId === ex.id ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', maxWidth: '600px' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155' }}>
                          Staff Action &mdash; Enter resolution notes to close this incident:
                        </label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="e.g. Baggage inspected, cleared by security officer, returned to flight line"
                          value={resolutionNotes}
                          onChange={(e) => setResolutionNotes(e.target.value)}
                          style={{ fontSize: '0.85rem', padding: '0.6rem 0.85rem', borderRadius: '8px' }}
                        />
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                          <button
                            onClick={() => handleResolve(ex.id)}
                            className="btn btn-primary btn-sm"
                            style={{ fontSize: '0.8rem', fontWeight: 700 }}
                          >
                            Save & Close Issue
                          </button>
                          <button
                            onClick={() => {
                              setResolvingId(null);
                              setResolutionNotes('');
                            }}
                            className="btn btn-secondary btn-sm"
                            style={{ fontSize: '0.8rem' }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setResolvingId(ex.id);
                          setResolutionNotes('');
                        }}
                        className="btn btn-secondary btn-sm"
                        style={{
                          fontSize: '0.8rem',
                          color: '#0878F9',
                          borderColor: '#BFDBFE',
                          backgroundColor: '#EFF6FF',
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                        }}
                      >
                        <ShieldCheck size={14} />
                        <span>Resolve This Problem (Staff Action)</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

