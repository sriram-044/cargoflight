import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { HandlingPoint, RouteResponse, RouteEdge, AlternativeRoute } from '../../types';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { LoadingSkeleton } from '../../components/feedback/LoadingSkeleton';
import {
  RotateCw,
  Navigation,
  Clock,
  Zap,
  AlertCircle,
  Info,
  CheckCircle2,
  ArrowRight,
  ShieldAlert,
  Sliders,
  Layers,
  MapPin,
  HelpCircle,
  X,
  Gauge,
  Plane,
  ChevronDown,
  ChevronUp,
  Check,
} from 'lucide-react';
import {
  getFriendlyLocationName,
  getLocationDescription,
  getShortLocationLabel,
} from '../../services/locationMapping';

export const RouteExplorerPage: React.FC = () => {
  const [handlingPoints, setHandlingPoints] = useState<HandlingPoint[]>([]);
  const [originId, setOriginId] = useState('MAA-CHECKIN-01');
  const [destId, setDestId] = useState('MAA-LOADING-01');
  const [objective, setObjective] = useState<string>('DISTANCE');
  const [blockedConnections, setBlockedConnections] = useState<string[]>([]);
  const [routeResult, setRouteResult] = useState<RouteResponse | null>(null);
  const [selectedAlternativeIndex, setSelectedAlternativeIndex] = useState<number>(0);
  const [showAlternatives, setShowAlternatives] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showExplanationModal, setShowExplanationModal] = useState(false);
  const [inspectedSegment, setInspectedSegment] = useState<RouteEdge | null>(null);
  const [inspectedSegmentLoading, setInspectedSegmentLoading] = useState(false);

  // 1. Initial Load: Fetch all valid handling points from the backend API
  useEffect(() => {
    const loadPoints = async () => {
      try {
        const points = await api.getRouteLocations();
        setHandlingPoints(points);
      } catch (err: any) {
        // Fallback to getHandlingPoints if needed
        try {
          const fallbackPoints = await api.getHandlingPoints();
          setHandlingPoints(fallbackPoints);
        } catch (fbErr: any) {
          setError('Failed to load airport handling points: ' + fbErr.message);
        }
      }
    };
    loadPoints();
  }, []);

  // 2. Primary Route Calculation
  const computeRoute = async () => {
    if (!originId || !destId) return;

    if (originId === destId) {
      setError('Starting location and destination location must be different.');
      setRouteResult(null);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await api.calculateRoute({
        originPointId: originId,
        destinationPointId: destId,
        blockedConnectionIds: blockedConnections,
        optimizationObjective: objective,
      });
      setRouteResult(res);
      setSelectedAlternativeIndex(0); // Reset to recommended route
    } catch (err: any) {
      setError(err.message || 'Routing computation failed');
      setRouteResult(null);
    } finally {
      setLoading(false);
    }
  };

  // Re-compute whenever origin, dest, objective, or blockages change
  useEffect(() => {
    if (originId && destId && originId !== destId) {
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

  const handleInspectSegment = async (fromId: string, toId: string) => {
    setInspectedSegmentLoading(true);
    try {
      const edge = await api.getRouteSegment(fromId, toId);
      setInspectedSegment(edge);
    } catch (err) {
      // Fallback from configured edges
      const edgeKey = `${fromId}->${toId}`;
      const isBlocked = blockedConnections.includes(edgeKey);
      setInspectedSegment({
        fromId,
        toId,
        distanceMeters: 100,
        estimatedSeconds: 60,
        active: !isBlocked,
        status: isBlocked ? 'BLOCKED' : 'HEALTHY',
        speedMetersPerSecond: 1.35,
      });
    } finally {
      setInspectedSegmentLoading(false);
    }
  };

  // Actual coordinates on the SVG canvas for all 11 MAA handling points
  const nodeCoordinates: Record<string, { x: number; y: number; label: string; code: string; type: string }> = {
    'MAA-CHECKIN-01': { x: 70, y: 150, label: 'Check-in Area', code: 'CK-01', type: 'CHECK_IN' },
    'MAA-SECURITY-01': { x: 230, y: 150, label: 'Security Screening', code: 'SEC-01', type: 'SECURITY' },
    'MAA-SECURITY-02': { x: 230, y: 55, label: 'Additional Security', code: 'SEC-02', type: 'SECURITY' },
    'MAA-SORTING-01': { x: 430, y: 150, label: 'Automatic Sorting', code: 'SRT-01', type: 'SORTING' },
    'MAA-SORTING-02': { x: 430, y: 270, label: 'Route Direction', code: 'SRT-02', type: 'SORTING' },
    'MAA-CONVEYOR-01': { x: 630, y: 150, label: 'Connecting Conveyor', code: 'CNV-01', type: 'CONVEYOR' },
    'MAA-TRANSFER-01': { x: 120, y: 270, label: 'Transfer Baggage', code: 'TRN-01', type: 'TRANSFER' },
    'MAA-LOADING-01': { x: 840, y: 150, label: 'Flight Loading 1', code: 'LD-01', type: 'LOADING' },
    'MAA-LOADING-02': { x: 840, y: 270, label: 'Flight Loading 2', code: 'LD-02', type: 'LOADING' },
    'MAA-ARRIVAL-01': { x: 120, y: 380, label: 'Arriving Unload', code: 'ARR-01', type: 'ARRIVAL' },
    'MAA-CLAIM-01': { x: 500, y: 380, label: 'Baggage Collection', code: 'CLM-01', type: 'CLAIM' },
  };

  // Topologically mapped conveyor connections from database
  const configuredEdges = [
    { from: 'MAA-CHECKIN-01', to: 'MAA-SECURITY-01', dist: 45, time: 90, name: 'Check-in Induction Belt' },
    { from: 'MAA-SECURITY-01', to: 'MAA-SORTING-01', dist: 120, time: 180, name: 'Main Security Exit Belt' },
    { from: 'MAA-SECURITY-01', to: 'MAA-SECURITY-02', dist: 25, time: 60, name: 'Manual CTX Diverter Spur' },
    { from: 'MAA-SECURITY-02', to: 'MAA-SORTING-01', dist: 105, time: 160, name: 'CTX Re-induction Line' },
    { from: 'MAA-SORTING-01', to: 'MAA-CONVEYOR-01', dist: 80, time: 120, name: 'Primary Departure Spine' },
    { from: 'MAA-SORTING-01', to: 'MAA-SORTING-02', dist: 60, time: 90, name: 'Pier 2 Transfer Chute' },
    { from: 'MAA-SORTING-02', to: 'MAA-LOADING-02', dist: 150, time: 240, name: 'Pier 2 Carousel Feed' },
    { from: 'MAA-CONVEYOR-01', to: 'MAA-LOADING-01', dist: 200, time: 300, name: 'Pier 1 Carousel Feed' },
    { from: 'MAA-TRANSFER-01', to: 'MAA-SECURITY-01', dist: 75, time: 120, name: 'Transfer Security Link' },
    { from: 'MAA-ARRIVAL-01', to: 'MAA-CLAIM-01', dist: 95, time: 150, name: 'Arrival Inbound Line' },
    { from: 'MAA-ARRIVAL-01', to: 'MAA-TRANSFER-01', dist: 110, time: 180, name: 'Inbound Transit Feeder' },
  ];

  // Active path to display: user can click between Recommended (0) and any Alternative (1, 2)
  const currentDisplayedRoute =
    routeResult?.alternatives && routeResult.alternatives.length > selectedAlternativeIndex
      ? routeResult.alternatives[selectedAlternativeIndex]
      : null;

  const currentActivePathIds = currentDisplayedRoute?.orderedPath?.map((p) => p.id) ||
    routeResult?.orderedPath?.map((p) => p.id) || [];

  const isEdgeInActiveRoute = (from: string, to: string) => {
    for (let i = 0; i < currentActivePathIds.length - 1; i++) {
      if (currentActivePathIds[i] === from && currentActivePathIds[i + 1] === to) return true;
    }
    return false;
  };

  const isEdgeInRecommendedRoute = (from: string, to: string) => {
    if (!routeResult?.orderedPath) return false;
    const pIds = routeResult.orderedPath.map((p) => p.id);
    for (let i = 0; i < pIds.length - 1; i++) {
      if (pIds[i] === from && pIds[i + 1] === to) return true;
    }
    return false;
  };

  // Helper for human-friendly time
  const formatTravelTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return `${mins} min ${secs > 0 ? `${secs} sec` : ''}`.trim();
    }
    return `${seconds} sec`;
  };

  // Alternative routes excluding the recommended path (candidate 0)
  const alternativeRoutes = (routeResult?.alternatives || []).filter((_, idx) => idx > 0);

  // Helper to extract clean alternative name (e.g. "Alternative 1")
  const getAltName = (alt: AlternativeRoute, index: number) => {
    if (alt.label) {
      const match = alt.label.match(/Alternative\s*\d+/i);
      if (match) return match[0];
      const cleaned = alt.label.replace(/^Route\s+[A-Z]\s*[-—:]\s*/i, '').trim();
      if (cleaned) return cleaned;
    }
    return `Alternative ${index + 1}`;
  };

  // Helper to calculate delta difference string from recommended route (e.g. "+10 m, +40 sec")
  const getDeltaString = (alt: AlternativeRoute) => {
    if (!routeResult) return '';
    const dMeters = alt.deltaDistanceMeters !== undefined && alt.deltaDistanceMeters !== 0
      ? alt.deltaDistanceMeters
      : (alt.totalDistanceMeters - routeResult.totalDistanceMeters);
    const dSecs = alt.deltaSeconds !== undefined && alt.deltaSeconds !== 0
      ? alt.deltaSeconds
      : (alt.estimatedTraversalSeconds - routeResult.estimatedTraversalSeconds);

    const distPart = dMeters >= 0 ? `+${Math.round(dMeters)} m` : `${Math.round(dMeters)} m`;
    const timePart = dSecs >= 0 ? `+${dSecs} sec` : `${dSecs} sec`;
    return `${distPart}, ${timePart}`;
  };

  // Active path to display in step-by-step path: recommended (0) or previewed alternative (> 0)
  const activePathPoints = (selectedAlternativeIndex > 0 && currentDisplayedRoute?.orderedPath)
    ? currentDisplayedRoute.orderedPath
    : (routeResult?.orderedPath || []);
  const activePathEdges = (selectedAlternativeIndex > 0 && currentDisplayedRoute?.edges)
    ? currentDisplayedRoute.edges
    : (routeResult?.edges || []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1540px', margin: '0 auto', width: '100%' }}>
      {/* 1. Airport Hero Banner */}
      <div className="airport-hero">
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div>
            <div className="airport-hero-badge">
              <span className="pulse-dot"></span>
              <span>NEO4J GRAPH TOPOLOGY & DIJKSTRA ROUTING</span>
            </div>
            <h1 className="airport-hero-title">Find the Best Route</h1>
            <p className="airport-hero-subtitle">
              Graph-powered baggage conveyor calculation for Chennai Airport Hub (MAA), dynamically rerouting around jams, belt maintenance, and security diversions.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => setBlockedConnections([])}
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
              <RotateCw size={14} />
              <span>Clear Blocked Belts ({blockedConnections.length})</span>
            </button>
            <button
              onClick={computeRoute}
              disabled={loading}
              className="btn btn-primary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}
            >
              <Navigation size={14} className={loading ? 'spin' : ''} />
              <span>{loading ? 'Calculating...' : 'Recalculate Route'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Route Selection Panel */}
      <div
        className="card"
        style={{
          padding: '1.5rem',
          backgroundColor: '#FFFFFF',
          borderRadius: '14px',
          boxShadow: 'var(--shadow-card)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr)) 180px',
          gap: '1.25rem',
          alignItems: 'flex-end',
        }}
      >
        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label" htmlFor="origSelect" style={{ fontWeight: 700, fontSize: '0.85rem', color: '#1E293B', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <MapPin size={14} color="#059669" />
            Starting Location (Origin)
          </label>
          <select
            id="origSelect"
            className="form-select"
            value={originId}
            onChange={(e) => setOriginId(e.target.value)}
            style={{ height: '44px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
          >
            {handlingPoints.map((p) => (
              <option key={p.id} value={p.id}>
                {getFriendlyLocationName(p.id, p.name)} [{p.id}]
              </option>
            ))}
          </select>
        </div>

        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label" htmlFor="destSelect" style={{ fontWeight: 700, fontSize: '0.85rem', color: '#1E293B', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <MapPin size={14} color="#0878F9" />
            Destination Location (Make-up / Claim)
          </label>
          <select
            id="destSelect"
            className="form-select"
            value={destId}
            onChange={(e) => setDestId(e.target.value)}
            style={{ height: '44px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
          >
            {handlingPoints.map((p) => (
              <option key={p.id} value={p.id}>
                {getFriendlyLocationName(p.id, p.name)} [{p.id}]
              </option>
            ))}
          </select>
        </div>

        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label" htmlFor="objSelect" style={{ fontWeight: 700, fontSize: '0.85rem', color: '#1E293B', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Sliders size={14} color="#00C2D7" />
            Optimization Preference
          </label>
          <select
            id="objSelect"
            className="form-select"
            value={objective}
            onChange={(e) => setObjective(e.target.value)}
            style={{ height: '44px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
          >
            <option value="DISTANCE">Shortest Conveyor Distance (meters)</option>
            <option value="TIME">Fastest Travel Time (seconds)</option>
            <option value="CONGESTION">Avoid Congested Conveyors</option>
            <option value="MAINTENANCE">Avoid Maintenance Areas</option>
            <option value="BALANCED">Balanced Route (Distance & Time)</option>
          </select>
        </div>

        <button
          onClick={computeRoute}
          disabled={loading || originId === destId}
          className="btn btn-primary"
          style={{
            height: '44px',
            fontWeight: 700,
            fontSize: '0.85rem',
            letterSpacing: '0.02em',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            backgroundColor: originId === destId ? '#94A3B8' : 'var(--primary)',
          }}
        >
          <Navigation size={15} />
          FIND BEST ROUTE
        </button>
      </div>

      {originId === destId && (
        <div style={{ padding: '0.85rem 1.25rem', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '10px', color: '#B91C1C', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertCircle size={16} />
          <span>Starting location and destination location must be different. Please select a distinct baggage destination.</span>
        </div>
      )}

      {error && (
        <div style={{ padding: '1rem 1.25rem', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '10px', color: '#B91C1C', fontSize: '0.875rem' }}>
          {error}
        </div>
      )}

      {/* 3. Compact Single-Line Recommended Route Summary */}
      {routeResult && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%' }}>
          <div className="route-summary-banner">
            {/* Left side: Single-line recommended route summary */}
            <div className="route-summary-content">
              <span
                onClick={() => setSelectedAlternativeIndex(0)}
                style={{
                  fontWeight: 800,
                  color: '#0878F9',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  cursor: selectedAlternativeIndex !== 0 ? 'pointer' : 'default',
                }}
                title={selectedAlternativeIndex !== 0 ? 'Click to restore recommended blue route' : 'Recommended Route'}
              >
                <Plane size={15} style={{ color: '#0878F9' }} />
                <span>Recommended Route</span>
              </span>

              <span style={{ color: '#94A3B8', userSelect: 'none' }}>|</span>

              <span>
                Distance: <strong style={{ color: '#0F172A' }}>{routeResult.routeFound ? `${routeResult.totalDistanceMeters} m` : 'N/A'}</strong>
              </span>

              <span style={{ color: '#94A3B8', userSelect: 'none' }}>|</span>

              <span>
                Travel Time: <strong style={{ color: '#0F172A' }}>{routeResult.routeFound ? formatTravelTime(routeResult.estimatedTraversalSeconds) : 'N/A'}</strong>
              </span>

              <span style={{ color: '#94A3B8', userSelect: 'none' }}>|</span>

              <span>
                <strong style={{ color: '#0F172A' }}>{routeResult.routeFound ? (routeResult.handlingPointCount || routeResult.orderedPath?.length || 0) : 0}</strong> Handling Locations
              </span>

              <span style={{ color: '#94A3B8', userSelect: 'none' }}>|</span>

              <span>
                Status:{' '}
                <strong
                  style={{
                    color: routeResult.routeFound
                      ? (routeResult.reroutedDueToBlockage ? '#B45309' : '#059669')
                      : '#DC2626',
                  }}
                >
                  {routeResult.routeFound
                    ? (routeResult.reroutedDueToBlockage ? 'Rerouted (Bypass)' : 'Available')
                    : 'Blocked'}
                </strong>
              </span>

              {selectedAlternativeIndex > 0 && (
                <span
                  style={{
                    marginLeft: '0.4rem',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    padding: '0.2rem 0.55rem',
                    borderRadius: '6px',
                    backgroundColor: '#CCFBF1',
                    color: '#0F766E',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                  }}
                >
                  <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#00C2D7' }}></span>
                  Previewing: {getAltName(currentDisplayedRoute!, selectedAlternativeIndex - 1)} (Cyan on Map)
                </span>
              )}
            </div>

            {/* Right side: Actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
              {selectedAlternativeIndex > 0 && (
                <button
                  onClick={() => setSelectedAlternativeIndex(0)}
                  className="btn btn-sm"
                  style={{
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    padding: '0.25rem 0.65rem',
                    backgroundColor: '#0878F9',
                    color: '#FFFFFF',
                    borderRadius: '6px',
                    border: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    cursor: 'pointer',
                  }}
                  title="Restore the recommended blue route on the map"
                >
                  <RotateCw size={12} />
                  <span>Restore Blue Route</span>
                </button>
              )}

              {alternativeRoutes.length > 0 && (
                <button
                  onClick={() => setShowAlternatives(!showAlternatives)}
                  className="btn btn-sm"
                  style={{
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    padding: '0.28rem 0.7rem',
                    backgroundColor: showAlternatives ? '#DBEAFE' : '#FFFFFF',
                    color: '#1E40AF',
                    borderRadius: '6px',
                    border: '1px solid #93C5FD',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    cursor: 'pointer',
                  }}
                >
                  <Layers size={13} />
                  <span>
                    {showAlternatives ? 'Hide Alternatives' : `View Alternative Routes (${alternativeRoutes.length})`}
                  </span>
                  {showAlternatives ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                </button>
              )}
            </div>
          </div>

          {/* Expandable Alternative Routes Drawer */}
          {showAlternatives && alternativeRoutes.length > 0 && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.45rem',
                padding: '0.75rem 1rem',
                backgroundColor: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '10px',
                fontSize: '0.82rem',
              }}
            >
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Evaluated Alternative Routes ({alternativeRoutes.length})</span>
                <span style={{ fontSize: '0.72rem', fontWeight: 500, color: '#94A3B8' }}>Click Preview to display that route on the interactive map below</span>
              </div>

              {alternativeRoutes.map((alt, i) => {
                const actualIdx = (routeResult.alternatives || []).findIndex((a) => a.routeId === alt.routeId);
                const resolvedIdx = actualIdx >= 0 ? actualIdx : i + 1;
                const isPreviewed = selectedAlternativeIndex === resolvedIdx;
                const altName = getAltName(alt, i);
                const deltaText = getDeltaString(alt);

                return (
                  <div
                    key={alt.routeId || i}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '0.5rem 1rem',
                      padding: '0.55rem 0.95rem',
                      backgroundColor: isPreviewed ? '#F0FDFA' : '#FFFFFF',
                      border: isPreviewed ? '1px solid #00C2D7' : '1px solid #E2E8F0',
                      borderRadius: '8px',
                      boxShadow: isPreviewed ? '0 1px 4px rgba(0, 194, 215, 0.15)' : 'none',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.65rem' }}>
                      <span style={{ fontWeight: 700, color: isPreviewed ? '#0F766E' : '#1E293B' }}>
                        {altName}
                      </span>

                      <span style={{ color: '#94A3B8', userSelect: 'none' }}>|</span>

                      <span style={{ color: '#334155' }}>
                        {alt.totalDistanceMeters} m
                      </span>

                      <span style={{ color: '#94A3B8', userSelect: 'none' }}>|</span>

                      <span style={{ color: '#334155' }}>
                        {formatTravelTime(alt.estimatedTraversalSeconds)}
                      </span>

                      <span style={{ color: '#94A3B8', userSelect: 'none' }}>|</span>

                      <span style={{ color: '#64748B', fontStyle: 'italic' }}>
                        {deltaText}
                      </span>
                    </div>

                    <div>
                      {isPreviewed ? (
                        <button
                          onClick={() => setSelectedAlternativeIndex(0)}
                          className="btn btn-sm"
                          style={{
                            fontSize: '0.75rem',
                            padding: '0.25rem 0.65rem',
                            backgroundColor: '#00C2D7',
                            color: '#FFFFFF',
                            borderRadius: '6px',
                            border: 'none',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                          title="Currently active on map. Click to reset to recommended blue route."
                        >
                          ✓ Active on Map (Click to Reset)
                        </button>
                      ) : (
                        <button
                          onClick={() => setSelectedAlternativeIndex(resolvedIdx)}
                          className="btn btn-sm"
                          style={{
                            fontSize: '0.75rem',
                            padding: '0.25rem 0.65rem',
                            backgroundColor: '#FFFFFF',
                            color: '#0F766E',
                            border: '1px solid #00C2D7',
                            borderRadius: '6px',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          Preview Route
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 5. Interactive Airport Conveyor & Sorting Map */}
      <div className="card" style={{ padding: 0, overflow: 'hidden', borderRadius: '14px', backgroundColor: '#FFFFFF', boxShadow: 'var(--shadow-card)' }}>
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem',
            backgroundColor: '#FFFFFF',
          }}
        >
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#14233B', margin: 0 }}>
              Interactive Airport Conveyor & Sorting Map
            </h3>
            <span style={{ fontSize: '0.8rem', color: '#64748B' }}>
              Click any conveyor segment to inspect its telemetry, or click to toggle a simulated belt stoppage.
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            {routeResult && (
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  padding: '0.3rem 0.65rem',
                  borderRadius: '6px',
                  backgroundColor: routeResult.routingEngine === 'NEO4J_CYPHER' ? '#ECFDF5' : '#EFF6FF',
                  color: routeResult.routingEngine === 'NEO4J_CYPHER' ? '#065F46' : '#1E40AF',
                  border: `1px solid ${routeResult.routingEngine === 'NEO4J_CYPHER' ? '#A7F3D0' : '#BFDBFE'}`,
                }}
              >
                Engine: {routeResult.routingEngine === 'NEO4J_CYPHER' ? 'Neo4j Graph Database' : 'PostgreSQL Topology Solver'}
              </span>
            )}
            <button
              onClick={() => setShowExplanationModal(true)}
              className="btn btn-secondary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', backgroundColor: '#EFF6FF', color: '#1E40AF', border: '1px solid #BFDBFE' }}
            >
              <HelpCircle size={14} />
              <span>Explain This Route</span>
            </button>
          </div>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: '1.5rem', padding: '0.75rem 1.5rem', backgroundColor: '#F8FAFD', borderBottom: '1px solid #E2E8F0', flexWrap: 'wrap', fontSize: '0.75rem', color: '#475569' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#059669', display: 'inline-block' }}></span>
            <span>Origin Station</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#0878F9', display: 'inline-block' }}></span>
            <span>Destination Station</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ width: '20px', height: '4px', backgroundColor: '#0878F9', display: 'inline-block', borderRadius: '2px' }}></span>
            <span>Recommended Route (Blue)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ width: '20px', height: '4px', backgroundColor: '#00C2D7', display: 'inline-block', borderRadius: '2px' }}></span>
            <span>Candidate Alternative (Cyan)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ width: '20px', height: '4px', backgroundColor: '#DC2626', display: 'inline-block', borderTop: '2px dashed #DC2626' }}></span>
            <span>Simulated Blockage (Red)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ width: '20px', height: '3px', backgroundColor: '#CBD5E1', display: 'inline-block' }}></span>
            <span>Operational Conveyor (Inactive)</span>
          </div>
        </div>

        {/* SVG Network Map */}
        <div style={{ backgroundColor: '#F8FAFD', padding: '2rem 1.5rem', display: 'flex', justifyContent: 'center', position: 'relative' }}>
          <svg viewBox="0 0 940 440" style={{ width: '100%', maxWidth: '1020px', height: 'auto', maxHeight: '460px' }}>
            <defs>
              <marker id="arrow-default" viewBox="0 0 10 10" refX="22" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#94A3B8" />
              </marker>
              <marker id="arrow-active" viewBox="0 0 10 10" refX="22" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#0878F9" />
              </marker>
              <marker id="arrow-alt" viewBox="0 0 10 10" refX="22" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#00C2D7" />
              </marker>
              <marker id="arrow-blocked" viewBox="0 0 10 10" refX="22" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#DC2626" />
              </marker>
              <filter id="glow-route" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3.5" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Draw Conveyor Edges */}
            {configuredEdges.map((edge) => {
              const src = nodeCoordinates[edge.from];
              const tgt = nodeCoordinates[edge.to];
              if (!src || !tgt) return null;

              const edgeKey = `${edge.from}->${edge.to}`;
              const isBlocked = blockedConnections.includes(edgeKey);
              const inActiveRoute = isEdgeInActiveRoute(edge.from, edge.to);
              const inRecommendedRoute = isEdgeInRecommendedRoute(edge.from, edge.to);

              let strokeColor = '#CBD5E1';
              let strokeWidth = 2.5;
              let marker = 'url(#arrow-default)';

              if (isBlocked) {
                strokeColor = '#DC2626';
                strokeWidth = 3.5;
                marker = 'url(#arrow-blocked)';
              } else if (inActiveRoute) {
                strokeColor = selectedAlternativeIndex === 0 ? '#0878F9' : '#00C2D7';
                strokeWidth = 4.5;
                marker = selectedAlternativeIndex === 0 ? 'url(#arrow-active)' : 'url(#arrow-alt)';
              } else if (inRecommendedRoute) {
                strokeColor = '#93C5FD';
                strokeWidth = 3;
                marker = 'url(#arrow-active)';
              }

              const midX = (src.x + tgt.x) / 2;
              const midY = (src.y + tgt.y) / 2;

              return (
                <g key={edgeKey} style={{ cursor: 'pointer' }} onClick={() => handleInspectSegment(edge.from, edge.to)}>
                  <line
                    x1={src.x}
                    y1={src.y}
                    x2={tgt.x}
                    y2={tgt.y}
                    stroke={strokeColor}
                    strokeWidth={strokeWidth}
                    strokeDasharray={isBlocked ? '6,6' : !inActiveRoute && inRecommendedRoute ? '4,4' : 'none'}
                    markerEnd={marker}
                    filter={inActiveRoute ? 'url(#glow-route)' : undefined}
                  />
                  {/* Distance label pill */}
                  <rect
                    x={midX - 25}
                    y={midY - 11}
                    width={50}
                    height={22}
                    rx={6}
                    fill={isBlocked ? '#FEE2E2' : inActiveRoute ? '#EFF6FF' : '#FFFFFF'}
                    stroke={isBlocked ? '#FCA5A5' : inActiveRoute ? '#93C5FD' : '#E2E8F0'}
                    filter="drop-shadow(0 1px 2px rgba(0,0,0,0.06))"
                  />
                  <text
                    x={midX}
                    y={midY + 4}
                    textAnchor="middle"
                    fontSize="9.5"
                    fontWeight="700"
                    fill={isBlocked ? '#991B1B' : inActiveRoute ? '#0878F9' : '#64748B'}
                  >
                    {isBlocked ? 'BLOCKED' : `${edge.dist}m`}
                  </text>
                </g>
              );
            })}

            {/* Draw Handling Point Nodes */}
            {Object.entries(nodeCoordinates).map(([id, pos]) => {
              const isOrigin = id === originId;
              const isDest = id === destId;
              const inRoute = currentActivePathIds.includes(id);

              let fillColor = '#FFFFFF';
              let strokeColor = '#94A3B8';
              let textColor = '#0F172A';

              if (isOrigin) {
                fillColor = '#ECFDF5';
                strokeColor = '#059669';
              } else if (isDest) {
                fillColor = '#EFF6FF';
                strokeColor = '#0878F9';
              } else if (inRoute) {
                fillColor = '#F0F9FF';
                strokeColor = '#00C2D7';
              }

              return (
                <g key={id}>
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={24}
                    fill={fillColor}
                    stroke={strokeColor}
                    strokeWidth={isOrigin || isDest || inRoute ? 3.5 : 1.5}
                    filter="drop-shadow(0px 3px 6px rgba(0,0,0,0.08))"
                  />
                  <text
                    x={pos.x}
                    y={pos.y + 4}
                    textAnchor="middle"
                    fontSize="9.5"
                    fontWeight="800"
                    fill={isOrigin ? '#059669' : isDest ? '#0878F9' : inRoute ? '#00C2D7' : textColor}
                  >
                    {pos.code}
                  </text>
                  <text
                    x={pos.x}
                    y={pos.y + 40}
                    textAnchor="middle"
                    fontSize="10"
                    fontWeight="700"
                    fill="#1E293B"
                  >
                    {pos.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Instructional Caption */}
        <div style={{ padding: '0.85rem 1.5rem', backgroundColor: '#FFFFFF', borderTop: '1px solid #E2E8F0', fontSize: '0.82rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Info size={15} color="#0878F9" />
          <span>
            <strong>How to read this map:</strong> Follow the blue line to see the recommended baggage path. Red segments are blocked. Dashed lines indicate alternative connections.
          </span>
        </div>
      </div>

      {/* 5. Step-by-Step Baggage Path */}
      {routeResult && (
        <div className="card" style={{ backgroundColor: '#FFFFFF', borderRadius: '14px', boxShadow: 'var(--shadow-card)' }}>
          <div className="card-header" style={{ padding: '1.15rem 1.5rem', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#14233B', margin: 0 }}>Step-by-Step Baggage Path</h3>
              <span style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 600 }}>
                ({activePathPoints.length} Handling Locations &bull; {activePathEdges.length} Conveyor Belts)
              </span>
              {selectedAlternativeIndex > 0 && (
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    padding: '0.2rem 0.55rem',
                    borderRadius: '6px',
                    backgroundColor: '#CCFBF1',
                    color: '#0F766E',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                  }}
                >
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#00C2D7' }}></span>
                  Previewing Path for {getAltName(currentDisplayedRoute!, selectedAlternativeIndex - 1)}
                </span>
              )}
            </div>

            <button
              onClick={() => setShowExplanationModal(true)}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <HelpCircle size={14} />
              <span>Routing Rationale</span>
            </button>
          </div>

          <div className="card-body" style={{ padding: '1.25rem 1.5rem' }}>
            {routeResult.message && (
              <div
                style={{
                  marginBottom: '1.25rem',
                  padding: '0.75rem 1rem',
                  backgroundColor: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: '8px',
                  fontSize: '0.825rem',
                  color: '#334155',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '0.5rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Info size={15} color="#0878F9" />
                  <span><strong>Operational Note:</strong> {routeResult.message}</span>
                </div>
                <div style={{ fontSize: '0.78rem', color: '#64748B' }}>
                  Optimization Objective: <strong style={{ color: '#0878F9' }}>{objective}</strong>
                </div>
              </div>
            )}

            {!routeResult.routeFound ? (
              <div style={{ color: '#B91C1C', textAlign: 'center', padding: '2rem' }}>
                No valid route is currently available between the selected locations due to conveyor stoppages or disconnected handling points.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {activePathPoints.map((point, idx) => {
                  const isFirst = idx === 0;
                  const isLast = idx === (activePathPoints.length - 1);
                  const prevEdge = idx > 0 && activePathEdges ? activePathEdges[idx - 1] : null;

                  return (
                    <div key={point.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      {/* Conveyor traversal connector info */}
                      {prevEdge && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', paddingLeft: '1.25rem', color: '#64748B', fontSize: '0.75rem' }}>
                          <div style={{ width: '2px', height: '18px', backgroundColor: selectedAlternativeIndex > 0 ? '#00C2D7' : '#0878F9' }}></div>
                          <span style={{ fontStyle: 'italic' }}>
                            Conveyor Belt: {prevEdge.distanceMeters}m &bull; {formatTravelTime(prevEdge.estimatedSeconds)} &bull; {prevEdge.speedMetersPerSecond || 1.3} m/s
                          </span>
                        </div>
                      )}

                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.85rem 1.25rem',
                          backgroundColor: isFirst ? '#F0FDF4' : isLast ? '#EFF6FF' : '#F8FAFD',
                          borderRadius: '10px',
                          border: isFirst ? '1px solid #BBF7D0' : isLast ? '1px solid #BFDBFE' : '1px solid #E2E8F0',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <span
                            style={{
                              width: '30px',
                              height: '30px',
                              borderRadius: '50%',
                              backgroundColor: isFirst ? '#059669' : isLast ? '#0878F9' : '#FFFFFF',
                              color: isFirst ? '#FFFFFF' : isLast ? '#FFFFFF' : '#475569',
                              border: `2px solid ${isFirst ? '#059669' : isLast ? '#0878F9' : '#CBD5E1'}`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 800,
                              fontSize: '0.8rem',
                              flexShrink: 0,
                            }}
                          >
                            {idx + 1}
                          </span>
                          <div>
                            <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0F172A' }}>
                              {getFriendlyLocationName(point.id, point.name)}
                              {isFirst && <span style={{ marginLeft: '0.5rem', fontSize: '0.7rem', color: '#059669', fontWeight: 800 }}>[START]</span>}
                              {isLast && <span style={{ marginLeft: '0.5rem', fontSize: '0.7rem', color: '#0878F9', fontWeight: 800 }}>[DESTINATION]</span>}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.15rem' }}>
                              <code>{point.id}</code> &bull; {getLocationDescription(point.id, point.name)}
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <StatusBadge status={point.category} size="sm" />
                          <StatusBadge status={point.operationalStatus || 'ACTIVE'} size="sm" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 7. Conveyor Segment Inspector Modal */}
      {inspectedSegment && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1050,
            padding: '1rem',
          }}
          onClick={() => setInspectedSegment(null)}
        >
          <div
            className="card"
            style={{
              maxWidth: '520px',
              width: '100%',
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              padding: '1.75rem',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Gauge size={20} color="#0878F9" />
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  Conveyor Segment Details
                </h3>
              </div>
              <button onClick={() => setInspectedSegment(null)} className="btn btn-secondary btn-sm" style={{ padding: '0.3rem' }}>
                <X size={16} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.875rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid #F1F5F9' }}>
                <span style={{ color: '#64748B' }}>Segment Path:</span>
                <div style={{ textAlign: 'right' }}>
                  <strong style={{ color: '#0F172A' }}>
                    {getFriendlyLocationName(inspectedSegment.fromId)} ➔ {getFriendlyLocationName(inspectedSegment.toId)}
                  </strong>
                  <div style={{ fontSize: '0.725rem', color: '#64748B', fontFamily: 'monospace' }}>
                    ({inspectedSegment.fromId} ➔ {inspectedSegment.toId})
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid #F1F5F9' }}>
                <span style={{ color: '#64748B' }}>Segment Length:</span>
                <strong>{inspectedSegment.distanceMeters} meters</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid #F1F5F9' }}>
                <span style={{ color: '#64748B' }}>Traversal Speed:</span>
                <strong>{inspectedSegment.speedMetersPerSecond || 1.35} m/s ({formatTravelTime(inspectedSegment.estimatedSeconds)})</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid #F1F5F9' }}>
                <span style={{ color: '#64748B' }}>Operating Status:</span>
                <span
                  style={{
                    fontWeight: 700,
                    padding: '0.2rem 0.5rem',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    backgroundColor: inspectedSegment.status === 'BLOCKED' ? '#FEE2E2' : '#ECFDF5',
                    color: inspectedSegment.status === 'BLOCKED' ? '#991B1B' : '#065F46',
                  }}
                >
                  {inspectedSegment.status || 'HEALTHY'}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid #F1F5F9' }}>
                <span style={{ color: '#64748B' }}>Used in Active Route:</span>
                <strong>{isEdgeInActiveRoute(inspectedSegment.fromId, inspectedSegment.toId) ? 'Yes' : 'No'}</strong>
              </div>

              {inspectedSegment.restrictionNotes && (
                <div style={{ padding: '0.75rem', backgroundColor: '#FFFBEB', borderRadius: '8px', color: '#B45309', fontSize: '0.8rem' }}>
                  <strong>Maintenance Note: </strong>{inspectedSegment.restrictionNotes}
                </div>
              )}
            </div>

            <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  const edgeKey = `${inspectedSegment.fromId}->${inspectedSegment.toId}`;
                  toggleBlockConnection(edgeKey);
                  setInspectedSegment(null);
                }}
                className={blockedConnections.includes(`${inspectedSegment.fromId}->${inspectedSegment.toId}`) ? 'btn btn-secondary' : 'btn btn-danger'}
                style={{ fontSize: '0.85rem' }}
              >
                {blockedConnections.includes(`${inspectedSegment.fromId}->${inspectedSegment.toId}`)
                  ? 'Restore Conveyor Belt'
                  : 'Simulate Belt Stoppage'}
              </button>
              <button onClick={() => setInspectedSegment(null)} className="btn btn-primary" style={{ fontSize: '0.85rem' }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. "Explain This Route" Modal */}
      {showExplanationModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1050,
            padding: '1rem',
          }}
          onClick={() => setShowExplanationModal(false)}
        >
          <div
            className="card"
            style={{
              maxWidth: '560px',
              width: '100%',
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              padding: '1.75rem',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <HelpCircle size={22} color="#0878F9" />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  Route Calculation Rationale
                </h3>
              </div>
              <button onClick={() => setShowExplanationModal(false)} className="btn btn-secondary btn-sm" style={{ padding: '0.3rem' }}>
                <X size={16} />
              </button>
            </div>

            <div style={{ lineHeight: 1.6, color: '#334155', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
              <p style={{ margin: 0, padding: '1rem', backgroundColor: '#F0F9FF', borderRadius: '10px', border: '1px solid #BAE6FD', color: '#0369A1' }}>
                {routeResult?.explanation || 'Optimal route calculated according to active airport graph topology.'}
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.825rem', color: '#64748B' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Check size={16} color="#059669" />
                <span>Calculated using non-negative cost Dijkstra solver on MAA handling topology.</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Check size={16} color="#059669" />
                <span>Travel time computed from belt distance divided by calibrated mechanical speeds.</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Check size={16} color="#059669" />
                <span>All {blockedConnections.length} simulated stoppages were pruned from traversable paths.</span>
              </div>
            </div>

            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowExplanationModal(false)} className="btn btn-primary" style={{ fontSize: '0.85rem' }}>
                Understood
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
