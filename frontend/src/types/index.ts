// TypeScript Definitions for AEROTRACE MAA

export interface User {
  id?: number;
  username: string;
  email?: string;
  fullName: string;
  role: string;
  airport?: string;
  active?: boolean;
  createdAt?: string;
}

export interface AuthResponse {
  token: string;
  tokenType: string;
  username: string;
  fullName: string;
  role: string;
  airport: string;
}

export interface Flight {
  id: number;
  flightNumber: string;
  airlineCode: string;
  airlineName: string;
  originIata: string;
  destinationIata: string;
  scheduledDeparture: string;
  scheduledArrival: string;
  terminal: string;
  gate: string;
  status: string;
  totalExpectedBags: number;
  totalLoadedBags: number;
  loadingProgressPercent: number;
}

export interface BaggageMovement {
  id: number;
  baggageTag: string;
  handlingPointId: string;
  handlingPointName: string;
  previousPointId?: string;
  previousPointName?: string;
  statusBefore: string;
  statusAfter: string;
  scannerId?: string;
  scanType: string;
  operatorUsername: string;
  recordedAt: string;
  notes?: string;
}

export interface Baggage {
  id: number;
  baggageTag: string;
  flightId: number;
  flightNumber: string;
  airlineName: string;
  passengerName: string;
  passengerPnr: string;
  originIata: string;
  destinationIata: string;
  weightKg: number;
  currentStatus: string;
  currentHandlingPointId?: string;
  currentHandlingPointName?: string;
  lastScanTime?: string;
  delayed: boolean;
  misrouted: boolean;
  rush: boolean;
  registeredAt: string;
  updatedAt: string;
  movementHistory?: BaggageMovement[];
  expectedNextHandlingPointId?: string;
  expectedNextHandlingPointName?: string;
}

export interface BaggageRegistrationRequest {
  baggageTag: string;
  flightId: number;
  passengerName: string;
  passengerPnr: string;
  originIata: string;
  destinationIata: string;
  weightKg: number;
  initialHandlingPointId: string;
}

export interface HandlingPoint {
  id: string;
  airportCode: string;
  name: string;
  category: string;
  zone: string;
  operationalStatus: string;
  capacityPerHour: number;
  connectedToIds?: string[];
  activeScannerCount?: number;
}

export interface RouteCalculationRequest {
  originPointId: string;
  destinationPointId: string;
  blockedConnectionIds?: string[];
  objective?: string;
  optimizationObjective?: string;
}

export interface BaggageTransitionRequest {
  targetStatus: string;
  handlingPointId?: string;
  notes?: string;
  scannerId?: string;
}

export interface SystemSetting {
  settingKey: string;
  settingValue: string;
  category: string;
  description: string;
  updatedAt?: string;
  updatedBy?: string;
}

export interface WarehouseRefreshResponse {
  recordsProcessed: number;
  durationMs: number;
  message: string;
  timestamp: string;
}

export interface RouteEdge {
  fromId: string;
  toId: string;
  fromName?: string;
  toName?: string;
  distanceMeters: number;
  estimatedSeconds: number;
  speedMetersPerSecond?: number;
  active: boolean;
  status?: string;
  restrictionNotes?: string;
}

export interface AlternativeRoute {
  routeId: string;
  label: string;
  recommended: boolean;
  available: boolean;
  orderedPath: HandlingPoint[];
  edges: RouteEdge[];
  totalDistanceMeters: number;
  estimatedTraversalSeconds: number;
  deltaDistanceMeters?: number;
  deltaSeconds?: number;
  description?: string;
}

export interface RouteResponse {
  routeFound: boolean;
  originPointId: string;
  destinationPointId: string;
  orderedPath: HandlingPoint[];
  edges: RouteEdge[];
  totalDistanceMeters: number;
  estimatedTraversalSeconds: number;
  routingEngine: string;
  reroutedDueToBlockage: boolean;
  message: string;
  explanation?: string;
  optimizationObjective?: string;
  blockedSegmentsAvoidedCount?: number;
  conveyorSegmentCount?: number;
  handlingPointCount?: number;
  alternatives?: AlternativeRoute[];
}

export interface ScannerEventRequest {
  baggageTag: string;
  scannerId: string;
  handlingPointId: string;
  scanType?: string;
  idempotencyKey?: string;
  opticalConfidenceScore?: number;
  notes?: string;
}

export interface ScanResultResponse {
  success: boolean;
  message: string;
  baggageTag: string;
  scannerId: string;
  handlingPointId: string;
  handlingPointName: string;
  previousStatus: string;
  newStatus: string;
  idempotencyKey: string;
  duplicate: boolean;
  telemetryPersistedMongo: boolean;
  operationalPersistedPostgres: boolean;
  processedAt: string;
}

export interface BaggageException {
  id: number;
  baggageTag: string;
  exceptionType: string;
  severity: string;
  description: string;
  handlingPointId: string;
  handlingPointName: string;
  status: string;
  reportedAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
  resolutionNotes?: string;
}

export interface DatabaseCheckResult {
  databaseName: string;
  role: string;
  status: 'PASS' | 'FAIL' | 'BLOCKED' | 'NOT CONFIGURED';
  connected: boolean;
  endpointSafe: string;
  details: string;
  latencyMs: number;
  recordCount: number;
  lastVerified: string;
}

export interface DatabaseHealth {
  checkedAt: string;
  overallOperational: boolean;
  databases: DatabaseCheckResult[];
}

export interface AnalyticsSummary {
  totalBaggageProcessed: number;
  awaitingSecurity: number;
  inSorting: number;
  readyForLoading: number;
  loaded: number;
  awaitingCollection: number;
  delayedCount: number;
  misroutedCount: number;
  openExceptionsCount: number;
  overallProcessingSuccessRate: number;
  statusDistribution: Record<string, number>;
  hourlyThroughput: { hour: string; bagsProcessed: number; scansRecorded: number }[];
  stageDistribution: { stage: string; count: number }[];
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}
