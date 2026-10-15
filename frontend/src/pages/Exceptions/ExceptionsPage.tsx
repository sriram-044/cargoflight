import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { BaggageException } from '../../types';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { LoadingSkeleton } from '../../components/feedback/LoadingSkeleton';
import { AlertTriangle, CheckCircle, RefreshCw, Filter, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const ExceptionsPage: React.FC = () => {
  const [exceptions, setExceptions] = useState<BaggageException[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
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
      setExceptions(data.content);
    } catch (err: any) {
      setError('Failed to load exceptions: ' + err.message);
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
      setError(err.message || 'Failed to resolve exception');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>
            Baggage Incident & Exception Investigations
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '0.2rem' }}>
            Active investigations for security EDS rejects, conveyor jams, tag damage, and misrouted baggage
          </p>
        </div>

        <button onClick={loadExceptions} className="btn btn-secondary btn-sm">
          <RefreshCw size={14} /> Refresh Incidents
        </button>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
        {['ALL', 'OPEN', 'RESOLVED'].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`btn btn-sm ${statusFilter === st ? 'btn-primary' : 'btn-secondary'}`}
          >
            {st === 'ALL' ? 'All Incidents' : st}
          </button>
        ))}
      </div>

      {error && (
        <div style={{ padding: '1rem', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#b91c1c' }}>
          {error}
        </div>
      )}

      {loading ? (
        <LoadingSkeleton rows={5} />
      ) : exceptions.length === 0 ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
          <CheckCircle size={36} color="#059669" style={{ margin: '0 auto 0.75rem' }} />
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#0f172a' }}>
            No Exceptional Incidents Found
          </h3>
          <p style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>
            All checked baggage at MAA Hub are operating within nominal standard parameters.
          </p>
        </div>
      ) : (
        <div className="card">
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Incident #</th>
                  <th>Baggage Tag</th>
                  <th>Exception Type</th>
                  <th>Severity</th>
                  <th>Reported Location</th>
                  <th>Description</th>
                  <th>Status</th>
                  {canResolve && <th>Investigation Resolution</th>}
                </tr>
              </thead>
              <tbody>
                {exceptions.map((ex) => (
                  <tr key={ex.id}>
                    <td style={{ fontWeight: 600, color: '#64748b' }}>#{ex.id}</td>
                    <td>
                      <Link to={`/tracking?tag=${ex.baggageTag}`} style={{ fontWeight: 700 }}>
                        {ex.baggageTag}
                      </Link>
                    </td>
                    <td>
                      <StatusBadge status={ex.exceptionType} size="sm" />
                    </td>
                    <td>
                      <StatusBadge status={ex.severity} size="sm" />
                    </td>
                    <td style={{ fontSize: '0.8125rem' }}>
                      {ex.handlingPointName || ex.handlingPointId}
                    </td>
                    <td style={{ fontSize: '0.8125rem', maxWidth: '300px' }}>
                      <div>{ex.description}</div>
                      {ex.resolutionNotes && (
                        <div style={{ fontSize: '0.75rem', color: '#059669', marginTop: '0.25rem', fontStyle: 'italic' }}>
                          Resolved: {ex.resolutionNotes} (by {ex.resolvedBy})
                        </div>
                      )}
                    </td>
                    <td>
                      <StatusBadge status={ex.status} size="sm" />
                    </td>
                    {canResolve && (
                      <td>
                        {ex.status === 'OPEN' ? (
                          resolvingId === ex.id ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', minWidth: '180px' }}>
                              <input
                                type="text"
                                className="form-input"
                                placeholder="Resolution notes..."
                                value={resolutionNotes}
                                onChange={(e) => setResolutionNotes(e.target.value)}
                                style={{ fontSize: '0.75rem', padding: '0.3rem 0.5rem' }}
                              />
                              <div style={{ display: 'flex', gap: '0.3rem' }}>
                                <button
                                  onClick={() => handleResolve(ex.id)}
                                  className="btn btn-primary btn-sm"
                                  style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}
                                >
                                  Submit Close
                                </button>
                                <button
                                  onClick={() => setResolvingId(null)}
                                  className="btn btn-secondary btn-sm"
                                  style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}
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
                              className="btn btn-primary btn-sm"
                              style={{ fontSize: '0.75rem' }}
                            >
                              Resolve Incident
                            </button>
                          )
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 600 }}>
                            Closed
                          </span>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
