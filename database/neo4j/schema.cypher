// Neo4j Schema & Seed for CARGOFLIGHT Airport Baggage Handling Graph
// Airport: Chennai International Airport (MAA)

// 1. Constraints
CREATE CONSTRAINT point_id_unique IF NOT EXISTS
FOR (p:HandlingPoint) REQUIRE p.id IS UNIQUE;

// 2. Create MAA Handling Point Nodes
MERGE (c1:HandlingPoint {id: 'MAA-CHECKIN-01'})
SET c1.name = 'Check-in Desks Terminal 2 Zone A',
    c1.category = 'CHECK_IN',
    c1.zone = 'TERMINAL_2_LEVEL_1',
    c1.status = 'ACTIVE',
    c1.capacityPerHour = 1200;

MERGE (s1:HandlingPoint {id: 'MAA-SECURITY-01'})
SET s1.name = 'Standard Screening Level 1 X-Ray',
    s1.category = 'SECURITY',
    s1.zone = 'BHS_BASEMENT_ZONE_A',
    s1.status = 'ACTIVE',
    s1.capacityPerHour = 1500;

MERGE (s2:HandlingPoint {id: 'MAA-SECURITY-02'})
SET s2.name = 'Secondary Explosive Detection CTX',
    s2.category = 'SECURITY',
    s2.zone = 'BHS_BASEMENT_ZONE_B',
    s2.status = 'ACTIVE',
    s2.capacityPerHour = 450;

MERGE (srt1:HandlingPoint {id: 'MAA-SORTING-01'})
SET srt1.name = 'Automated Main Sorter Core Loop',
    srt1.category = 'SORTING',
    srt1.zone = 'SORTING_HALL_CENTRAL',
    srt1.status = 'ACTIVE',
    srt1.capacityPerHour = 3000;

MERGE (srt2:HandlingPoint {id: 'MAA-SORTING-02'})
SET srt2.name = 'High-Speed Cross-Belt Diverter',
    srt2.category = 'SORTING',
    srt2.zone = 'SORTING_HALL_SOUTH',
    srt2.status = 'ACTIVE',
    srt2.capacityPerHour = 2200;

MERGE (cnv1:HandlingPoint {id: 'MAA-CONVEYOR-01'})
SET cnv1.name = 'Main Inter-Pier High-Speed Belt',
    cnv1.category = 'CONVEYOR',
    cnv1.zone = 'TUNNEL_SPINE_PIER_1',
    cnv1.status = 'ACTIVE',
    cnv1.capacityPerHour = 2500;

MERGE (trf1:HandlingPoint {id: 'MAA-TRANSFER-01'})
SET trf1.name = 'International Transfer Baggage Induction',
    trf1.category = 'TRANSFER',
    trf1.zone = 'TERMINAL_1_CONNECT_CORRIDOR',
    trf1.status = 'ACTIVE',
    trf1.capacityPerHour = 800;

MERGE (ld1:HandlingPoint {id: 'MAA-LOADING-01'})
SET ld1.name = 'Airside Tug Cart Make-up Carousel 01',
    ld1.category = 'LOADING',
    ld1.zone = 'AIRSIDE_RAMP_GATE_11_15',
    ld1.status = 'ACTIVE',
    ld1.capacityPerHour = 900;

MERGE (ld2:HandlingPoint {id: 'MAA-LOADING-02'})
SET ld2.name = 'Airside Tug Cart Make-up Carousel 02',
    ld2.category = 'LOADING',
    ld2.zone = 'AIRSIDE_RAMP_GATE_16_20',
    ld2.status = 'ACTIVE',
    ld2.capacityPerHour = 900;

MERGE (arv1:HandlingPoint {id: 'MAA-ARRIVAL-01'})
SET arv1.name = 'Inbound Aircraft Unload Receiving Induction',
    arv1.category = 'ARRIVAL',
    arv1.zone = 'AIRSIDE_INBOUND_DECK',
    arv1.status = 'ACTIVE',
    arv1.capacityPerHour = 1800;

MERGE (clm1:HandlingPoint {id: 'MAA-CLAIM-01'})
SET clm1.name = 'Domestic Reclaim Carousel Belt 03',
    clm1.category = 'CLAIM',
    clm1.zone = 'ARRIVALS_HALL_GROUND',
    clm1.status = 'ACTIVE',
    clm1.capacityPerHour = 1200;

// 3. Connect Handling Points with Distance (meters) and Estimated Traversal Time (seconds)
MATCH (from:HandlingPoint {id: 'MAA-CHECKIN-01'}), (to:HandlingPoint {id: 'MAA-SECURITY-01'})
MERGE (from)-[r:CONNECTED_TO]->(to)
SET r.distanceMeters = 85.0, r.estimatedTimeSeconds = 65, r.status = 'ACTIVE';

MATCH (from:HandlingPoint {id: 'MAA-SECURITY-01'}), (to:HandlingPoint {id: 'MAA-SORTING-01'})
MERGE (from)-[r:CONNECTED_TO]->(to)
SET r.distanceMeters = 140.0, r.estimatedTimeSeconds = 110, r.status = 'ACTIVE';

MATCH (from:HandlingPoint {id: 'MAA-SECURITY-01'}), (to:HandlingPoint {id: 'MAA-SECURITY-02'})
MERGE (from)-[r:CONNECTED_TO]->(to)
SET r.distanceMeters = 40.0, r.estimatedTimeSeconds = 35, r.status = 'ACTIVE';

MATCH (from:HandlingPoint {id: 'MAA-SECURITY-02'}), (to:HandlingPoint {id: 'MAA-SORTING-01'})
MERGE (from)-[r:CONNECTED_TO]->(to)
SET r.distanceMeters = 110.0, r.estimatedTimeSeconds = 85, r.status = 'ACTIVE';

MATCH (from:HandlingPoint {id: 'MAA-SORTING-01'}), (to:HandlingPoint {id: 'MAA-CONVEYOR-01'})
MERGE (from)-[r:CONNECTED_TO]->(to)
SET r.distanceMeters = 220.0, r.estimatedTimeSeconds = 140, r.status = 'ACTIVE';

MATCH (from:HandlingPoint {id: 'MAA-SORTING-01'}), (to:HandlingPoint {id: 'MAA-SORTING-02'})
MERGE (from)-[r:CONNECTED_TO]->(to)
SET r.distanceMeters = 60.0, r.estimatedTimeSeconds = 45, r.status = 'ACTIVE';

MATCH (from:HandlingPoint {id: 'MAA-SORTING-02'}), (to:HandlingPoint {id: 'MAA-CONVEYOR-01'})
MERGE (from)-[r:CONNECTED_TO]->(to)
SET r.distanceMeters = 190.0, r.estimatedTimeSeconds = 125, r.status = 'ACTIVE';

MATCH (from:HandlingPoint {id: 'MAA-CONVEYOR-01'}), (to:HandlingPoint {id: 'MAA-LOADING-01'})
MERGE (from)-[r:CONNECTED_TO]->(to)
SET r.distanceMeters = 175.0, r.estimatedTimeSeconds = 115, r.status = 'ACTIVE';

MATCH (from:HandlingPoint {id: 'MAA-CONVEYOR-01'}), (to:HandlingPoint {id: 'MAA-LOADING-02'})
MERGE (from)-[r:CONNECTED_TO]->(to)
SET r.distanceMeters = 240.0, r.estimatedTimeSeconds = 160, r.status = 'ACTIVE';

MATCH (from:HandlingPoint {id: 'MAA-TRANSFER-01'}), (to:HandlingPoint {id: 'MAA-SECURITY-01'})
MERGE (from)-[r:CONNECTED_TO]->(to)
SET r.distanceMeters = 115.0, r.estimatedTimeSeconds = 90, r.status = 'ACTIVE';

MATCH (from:HandlingPoint {id: 'MAA-ARRIVAL-01'}), (to:HandlingPoint {id: 'MAA-CLAIM-01'})
MERGE (from)-[r:CONNECTED_TO]->(to)
SET r.distanceMeters = 160.0, r.estimatedTimeSeconds = 130, r.status = 'ACTIVE';
