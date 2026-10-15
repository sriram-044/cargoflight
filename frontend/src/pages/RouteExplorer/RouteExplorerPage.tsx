import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { HandlingPoint, RouteResponse } from '../../types';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { LoadingSkeleton } from '../../components/feedback/LoadingSkeleton';
import {
  Network,
  RotateCw,
  Ban,
  CheckCircle,
  Navigation,
  Clock,
  Zap,
  AlertCircle,
  Info,
} from 'lucide-react';

export const RouteExplorerPage: React.FC = () => {
  const [handlingPoints, setHandlingPoints] = useState<HandlingPoint[]>([]);
  const [originId, setOriginId] = useState('MAA-CHECKIN-01');
  const [destId, setDestId] = useState('MAA-LOADING-01');
  const [objective, setObjective] = useState<'DISTANCE' | 'TIME'>('DISTANCE');
  const [blockedConnections, setBlockedConnections] = useState<string[]>([]);
  const [routeResult, setRouteResult] = useState<RouteResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Initial load
  useEffect(() => {
    const loadPoints = async () => {
      try {
        const points = await api.getHandlingPoints();
        setHandlingPoints(points);
      } catch (err: any) {
        setError('Failed to load handling points: ' + err.message);
      }
    };
    loadPoints();
  }, []);

  // Compute route when origin, dest, objective, or blockages change
  const computeRoute = async () => {
    if (!originId || !destId) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.calculateRoute({
        originPointId: originId,
        destinationPointId: destId,
        blockedConnectionIds: blockedConnections,
        objective: objective,
      });
      setRouteResult(res);
    } catch (err: any) {
      setError(err.message || 'Routing computation failed');
      setRouteResult(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (originId && destId) {
      computeRoute();
    }
  }, [originId, destId, objective, blockedConnections]);

  const toggleBlockConnection = (connKey: string) => {
    if (blockedConnections.includes(connKey)) {
      setBlockedConnections(blockedConnections.filter((k) => k !== connKey));
    } else {
      setBlockedConnections([...blockedConnections, connKey]);
    }
  };

  // Node coordinates for interactive SVG diagram
  const nodeCoordinates: Record<string, { x: number; y: number; label: string }> = {
    'MAA-CHECKIN-01': { x: 70, y: 160, label: 'Check-in 01' },
    'MAA-SECURITY-01': { x: 230, y: 160, label: 'Security EDS' },
    'MAA-SECURITY-02': { x: 230, y: 60, label: 'Security CTX 2' },
    'MAA-SORTING-01': { x: 410, y: 160, label: 'Sorting Core' },
    'MAA-SORTING-02': { x: 410, y: 260, label: 'Sorter Pier Bypass' },
    'MAA-CONVEYOR-01': { x: 610, y: 160, label: 'Inter-Pier Spine' },
    'MAA-TRANSFER-01': { x: 130, y: 260, label: 'Transfer Induction' },
    'MAA-LOADING-01': { x: 800, y: 110, label: 'Ramp Makeup 01' },
    'MAA-LOADING-02': { x: 800, y: 210, label: 'Ramp Makeup 02' },
    'MAA-ARRIVAL-01': { x: 410, y: 350, label: 'Inbound Induction' },
    'MAA-CLAIM-01': { x: 700, y: 350, label: 'Reclaim Belt 03' },
  };

  const configuredEdges = [
    { from: 'MAA-CHECKIN-01', to: 'MAA-SECURITY-01', dist: 85, time: 65 },
    { from: 'MAA-SECURITY-01', to: 'MAA-SORTING-01', dist: 140, time: 110 },
    { from: 'MAA-SECURITY-01', to: 'MAA-SECURITY-02', dist: 40, time: 35 },
    { from: 'MAA-SECURITY-02', to: 'MAA-SORTING-01', dist: 110, time: 85 },
    { from: 'MAA-SORTING-01', to: 'MAA-CONVEYOR-01', dist: 220, time: 140 },
    { from: 'MAA-SORTING-01', to: 'MAA-SORTING-02', dist: 60, time: 45 },
    { from: 'MAA-SORTING-02', to: 'MAA-CONVEYOR-01', dist: 190, time: 125 },
    { from: 'MAA-CONVEYOR-01', to: 'MAA-LOADING-01', dist: 175, time: 115 },
    { from: 'MAA-CONVEYOR-01', to: 'MAA-LOADING-02', dist: 240, time: 160 },
    { from: 'MAA-TRANSFER-01', to: 'MAA-SECURITY-01', dist: 115, time: 90 },
    { from: 'MAA-ARRIVAL-01', to: 'MAA-CLAIM-01', dist: 160, time: 130 },
  ];

  // Helper to determine if an edge is in the calculated path
  const isEdgeInRoute = (from: string, to: string) => {
    if (!routeResult || !routeResult.orderedPath) return false;
    const pathIds = routeResult.orderedPath.map((p) => p.id);
    for (let i = 0; i < pathIds.length - 1; i++) {
      if (pathIds[i] === from && pathIds[i + 1] === to) return true;
    }
    return false;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1280px', margin: '0 auto' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>
          MAA Handling Network & Dynamic Route Explorer
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '0.2rem' }}>
          Graph-based BHS routing topology with live connection blockage simulation and rerouting
        </p>
      </div>

      {/* Control Bar: Origin, Destination & Engine Attribution */}
      <div
        className="card"
        style={{
          padding: '1.25rem',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem',
          alignItems: 'flex-end',
        }}
      >
        <div className="form-group">
          <label className="form-label" htmlFor="orig">
            Origin Handling Node
          </label>
          <select
            id="orig"
            className="form-select"
            value={originId}
            onChange={(e) => setOriginId(e.target.value)}
          >
            {handlingPoints.map((p) => (
              <option key={p.id} value={p.id}>
                {p.id} ({p.name})
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="dest">
            Destination Node
          </label>
          <select
            id="dest"
            className="form-select"
            value={destId}
            onChange={(e) => setDestId(e.target.value)}
          >
            {handlingPoints.map((p) => (
              <option key={p.id} value={p.id}>
                {p.id} ({p.name})
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="obj">
            Optimization Objective
          </label>
          <select
            id="obj"
            className="form-select"
            value={objective}
            onChange={(e) => setObjective(e.target.value as 'DISTANCE' | 'TIME')}
          >
            <option value="DISTANCE">Shortest Distance (Meters)</option>
            <option value="TIME">Fastest Travel Time (Seconds)</option>
          </select>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => setBlockedConnections([])}
            className="btn btn-secondary"
            style={{ height: '38px', fontSize: '0.8125rem' }}
          >
            <RotateCw size={14} /> Clear Blockages
          </button>
          <button
            onClick={computeRoute}
            disabled={loading}
            className="btn btn-primary"
            style={{ height: '38px', fontSize: '0.8125rem' }}
          >
            <Navigation size={14} /> Recalculate
          </button>
        </div>
      </div>

      {error && (
        <div style={{ padding: '1rem', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#b91c1c' }}>
          {error}
        </div>
      )}

      {/* Interactive Topology Graph Visualizer */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div
          style={{
            padding: '1rem 1.25rem',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#ffffff',
          }}
        >
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Interactive BHS Topological Schematic</h3>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
              Click any edge line or blockage button to simulate a belt stoppage and observe automatic rerouting
            </span>
          </div>

          {routeResult && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  padding: '0.2rem 0.55rem',
                  borderRadius: '4px',
                  backgroundColor: routeResult.routingEngine === 'NEO4J_CYPHER' ? '#f0fdf4' : '#eff6ff',
                  color: routeResult.routingEngine === 'NEO4J_CYPHER' ? '#166534' : '#1e40af',
                  border: '1px solid #cbd5e1',
                }}
              >
                Engine: {routeResult.routingEngine}
              </span>
              <StatusBadge status={routeResult.routeFound ? 'PASS' : 'FAIL'} size="sm" />
            </div>
          )}
        </div>

        {/* SVG Network Map */}
        <div style={{ backgroundColor: '#f8fafc', padding: '1.5rem', display: 'flex', justifyContent: 'center' }}>
          <svg viewBox="0 0 920 420" style={{ width: '100%', maxWidth: '920px', height: 'auto', maxHeight: '420px' }}>
            <defs>
              <marker id="arrow" viewBox="0 0 10 10" refX="18" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#94a3b8" />
              </marker>
              <marker id="arrow-active" viewBox="0 0 10 10" refX="18" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#0284c7" />
              </marker>
              <marker id="arrow-blocked" viewBox="0 0 10 10" refX="18" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#dc2626" />
              </marker>
            </defs>

            {/* Draw Edges */}
            {configuredEdges.map((edge) => {
              const src = nodeCoordinates[edge.from];
              const tgt = nodeCoordinates[edge.to];
              if (!src || !tgt) return null;

              const edgeKey = `${edge.from}->${edge.to}`;
              const isBlocked = blockedConnections.includes(edgeKey);
              const inActiveRoute = isEdgeInRoute(edge.from, edge.to);

              let strokeColor = '#cbd5e1';
              let strokeWidth = 2;
              let marker = 'url(#arrow)';

              if (isBlocked) {
                strokeColor = '#dc2626';
                strokeWidth = 3;
                marker = 'url(#arrow-blocked)';
              } else if (inActiveRoute) {
                strokeColor = '#0284c7';
                strokeWidth = 4;
                marker = 'url(#arrow-active)';
              }

              const midX = (src.x + tgt.x) / 2;
              const midY = (src.y + tgt.y) / 2;

              return (
                <g key={edgeKey} style={{ cursor: 'pointer' }} onClick={() => toggleBlockConnection(edgeKey)}>
                  <line
                    x1={src.x}
                    y1={src.y}
                    x2={tgt.x}
                    y2={tgt.y}
                    stroke={strokeColor}
                    strokeWidth={strokeWidth}
                    strokeDasharray={isBlocked ? '5,5' : inActiveRoute ? 'none' : 'none'}
                    markerEnd={marker}
                  />
                  <rect
                    x={midX - 22}
                    y={midY - 10}
                    width={44}
                    height={18}
                    rx={4}
                    fill={isBlocked ? '#fee2e2' : inActiveRoute ? '#e0f2fe' : '#ffffff'}
                    stroke={isBlocked ? '#fca5a5' : inActiveRoute ? '#7dd3fc' : '#e2e8f0'}
                  />
                  <text
                    x={midX}
                    y={midY + 3}
                    textAnchor="middle"
                    fontSize="9"
                    fontWeight="600"
                    fill={isBlocked ? '#991b1b' : inActiveRoute ? '#0369a1' : '#64748b'}
                  >
                    {isBlocked ? 'BLOCKED' : `${edge.dist}m`}
                  </text>
                </g>
              );
            })}

            {/* Draw Nodes */}
            {Object.entries(nodeCoordinates).map(([id, pos]) => {
              const isOrigin = id === originId;
              const isDest = id === destId;
              const inRoute = routeResult?.orderedPath?.some((p) => p.id === id);

              let fillColor = '#ffffff';
              let strokeColor = '#94a3b8';
              let textColor = '#0f172a';

              if (isOrigin) {
                fillColor = '#ecfdf5';
                strokeColor = '#059669';
              } else if (isDest) {
                fillColor = '#eff6ff';
                strokeColor = '#1d4ed8';
              } else if (inRoute) {
                fillColor = '#f0f9ff';
                strokeColor = '#0284c7';
              }

              return (
                <g key={id}>
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={20}
                    fill={fillColor}
                    stroke={strokeColor}
                    strokeWidth={isOrigin || isDest || inRoute ? 3 : 1.5}
                    filter="drop-shadow(0px 2px 3px rgba(0,0,0,0.06))"
                  />
                  <text
                    x={pos.x}
                    y={pos.y + 4}
                    textAnchor="middle"
                    fontSize="10"
                    fontWeight="700"
                    fill={isOrigin ? '#059669' : isDest ? '#1d4ed8' : inRoute ? '#0284c7' : textColor}
                  >
                    {id.replace('MAA-', '').substring(0, 3)}
                  </text>
                  <text
                    x={pos.x}
                    y={pos.y + 32}
                    textAnchor="middle"
                    fontSize="10"
                    fontWeight="600"
                    fill="#334155"
                  >
                    {pos.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Calculated Metrics & Ordered Route Steps */}
      {routeResult && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem' }}>
          {/* Metrics summary */}
          <div className="card">
            <div className="card-header">
              <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Route Traversal Metrics</h3>
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b', fontSize: '0.875rem' }}>Total Distance:</span>
                <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>
                  {routeResult.routeFound ? `${routeResult.totalDistanceMeters} m` : 'N/A'}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b', fontSize: '0.875rem' }}>Estimated Traversal Time:</span>
                <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0284c7' }}>
                  {routeResult.routeFound ? `${Math.round(routeResult.estimatedTraversalSeconds / 60)} min (${routeResult.estimatedTraversalSeconds}s)` : 'N/A'}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b', fontSize: '0.875rem' }}>Rerouted around block:</span>
                <span style={{ fontWeight: 600, color: routeResult.reroutedDueToBlockage ? '#d97706' : '#059669' }}>
                  {routeResult.reroutedDueToBlockage ? 'YES (Bypass Active)' : 'NO (Direct Spine)'}
                </span>
              </div>

              <div
                style={{
                  padding: '0.75rem',
                  backgroundColor: routeResult.routeFound ? '#f0fdf4' : '#fef2f2',
                  border: `1px solid ${routeResult.routeFound ? '#bbf7d0' : '#fecaca'}`,
                  borderRadius: '6px',
                  fontSize: '0.8125rem',
                  color: routeResult.routeFound ? '#166534' : '#991b1b',
                }}
              >
                {routeResult.message}
              </div>
            </div>
          </div>

          {/* Ordered path list */}
          <div className="card">
            <div className="card-header">
              <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Ordered Traversal Sequence</h3>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                {routeResult.orderedPath?.length || 0} Checkpoints
              </span>
            </div>
            <div className="card-body">
              {!routeResult.routeFound ? (
                <div style={{ color: '#b91c1c', textAlign: 'center', padding: '1rem' }}>
                  No traversal path possible under current network blockages.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {routeResult.orderedPath?.map((point, idx) => (
                    <div
                      key={point.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.65rem 1rem',
                        backgroundColor: '#f8fafc',
                        borderRadius: '6px',
                        border: '1px solid #e2e8f0',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span
                          style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            backgroundColor: idx === 0 ? '#ecfdf5' : idx === routeResult.orderedPath.length - 1 ? '#eff6ff' : '#ffffff',
                            color: idx === 0 ? '#059669' : idx === routeResult.orderedPath.length - 1 ? '#1d4ed8' : '#64748b',
                            border: '1px solid #cbd5e1',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '0.75rem',
                          }}
                        >
                          {idx + 1}
                        </span>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{point.name}</div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                            {point.id} &bull; Zone: {point.zone}
                          </div>
                        </div>
                      </div>
                      <StatusBadge status={point.category} size="sm" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Distinction Note */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '0.75rem 1rem',
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          fontSize: '0.8125rem',
          color: '#64748b',
        }}
      >
        <Info size={16} color="#0284c7" style={{ flexShrink: 0 }} />
        <span>
          <strong>Operational Distinction:</strong> This schematic visualizes the internal baggage conveyor, EDS x-ray screening, and sorting chute topology. It is separate from airside tarmac GPS tracking and passenger GPS apps.
        </span>
      </div>
    </div>
  );
};
