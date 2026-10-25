/**
 * Centralized Location Name & Description Mapping for FlyTrack Airport.
 *
 * Replaces complex technical airport engineering terminology with user-friendly,
 * professional plain English across all UI views.
 *
 * IMPORTANT:
 * - Technical IDs (e.g. MAA-CHECKIN-01) are preserved for database keys, routing algorithms,
 *   conveyor graphs, and API contracts.
 * - This mapping only transforms the presentation layer (UI display).
 */

export interface LocationDetail {
  id: string;
  technicalName: string;
  friendlyName: string;
  shortLabel: string;
  description: string;
}

export const LOCATION_MAPPINGS: Record<string, LocationDetail> = {
  'MAA-ARRIVAL-01': {
    id: 'MAA-ARRIVAL-01',
    technicalName: 'Inbound Aircraft Unload Receiving Induction',
    friendlyName: 'Arriving Baggage Unloading',
    shortLabel: 'Arriving Unload',
    description: 'Bags are unloaded from arriving aircraft and entered into the baggage handling system.',
  },
  'MAA-CHECKIN-01': {
    id: 'MAA-CHECKIN-01',
    technicalName: 'Check-in Desks Terminal 2 Zone A',
    friendlyName: 'Check-in Area — Terminal 2, Zone A',
    shortLabel: 'Check-in Area',
    description: 'Passengers hand over their bags before departure.',
  },
  'MAA-CLAIM-01': {
    id: 'MAA-CLAIM-01',
    technicalName: 'Domestic Reclaim Carousel Belt 03',
    friendlyName: 'Domestic Baggage Collection — Belt 03',
    shortLabel: 'Baggage Collection',
    description: 'Passengers collect their baggage after arriving on a domestic flight.',
  },
  'MAA-CONVEYOR-01': {
    id: 'MAA-CONVEYOR-01',
    technicalName: 'Main Inter-Pier High-Speed Belt',
    friendlyName: 'Main Connecting Conveyor',
    shortLabel: 'Connecting Conveyor',
    description: 'Moves baggage between different airport handling areas.',
  },
  'MAA-LOADING-01': {
    id: 'MAA-LOADING-01',
    technicalName: 'Airside Tug Cart Make-up Carousel 01',
    friendlyName: 'Flight Loading Preparation — Area 1',
    shortLabel: 'Flight Loading 1',
    description: 'Bags are grouped and prepared for loading onto the correct flight.',
  },
  'MAA-LOADING-02': {
    id: 'MAA-LOADING-02',
    technicalName: 'Airside Tug Cart Make-up Carousel 02',
    friendlyName: 'Flight Loading Preparation — Area 2',
    shortLabel: 'Flight Loading 2',
    description: 'An additional area for grouping and preparing bags for flight loading.',
  },
  'MAA-SECURITY-01': {
    id: 'MAA-SECURITY-01',
    technicalName: 'Standard Screening Level 1 X-Ray',
    friendlyName: 'Baggage Security Screening',
    shortLabel: 'Security Screening',
    description: 'Baggage passes through security screening equipment.',
  },
  'MAA-SECURITY-02': {
    id: 'MAA-SECURITY-02',
    technicalName: 'Secondary Explosive Detection CTX',
    friendlyName: 'Additional Security Screening',
    shortLabel: 'Additional Security',
    description: 'Baggage receives additional security checks when required by the screening process.',
  },
  'MAA-SORTING-01': {
    id: 'MAA-SORTING-01',
    technicalName: 'Automated Main Sorter Core Loop',
    friendlyName: 'Automatic Baggage Sorting System',
    shortLabel: 'Automatic Sorting',
    description: 'Automatically directs baggage towards the appropriate handling area.',
  },
  'MAA-SORTING-02': {
    id: 'MAA-SORTING-02',
    technicalName: 'High-Speed Cross-Belt Diverter',
    friendlyName: 'Baggage Route Direction System',
    shortLabel: 'Route Direction',
    description: 'Directs baggage onto the appropriate conveyor or handling route.',
  },
  'MAA-TRANSFER-01': {
    id: 'MAA-TRANSFER-01',
    technicalName: 'International Transfer Baggage Induction',
    friendlyName: 'International Transfer Baggage Entry',
    shortLabel: 'Transfer Baggage Entry',
    description: 'Baggage arriving from another flight enters the system for further processing.',
  },
};

// Reverse index: technical name to friendly name
const TECHNICAL_TO_FRIENDLY_MAP: Record<string, string> = {};
const TECHNICAL_TO_DESC_MAP: Record<string, string> = {};

Object.values(LOCATION_MAPPINGS).forEach((loc) => {
  TECHNICAL_TO_FRIENDLY_MAP[loc.technicalName.toLowerCase().trim()] = loc.friendlyName;
  TECHNICAL_TO_DESC_MAP[loc.technicalName.toLowerCase().trim()] = loc.description;
});

/**
 * Returns the user-friendly display name for a baggage location.
 * Resolves by handlingPointId first, then by technicalName, falling back safely.
 */
export function getFriendlyLocationName(id?: string | null, rawName?: string | null): string {
  if (id && LOCATION_MAPPINGS[id]) {
    return LOCATION_MAPPINGS[id].friendlyName;
  }
  if (rawName) {
    const matched = TECHNICAL_TO_FRIENDLY_MAP[rawName.toLowerCase().trim()];
    if (matched) return matched;
  }
  return rawName || id || 'Airport Location';
}

/**
 * Returns the short/compact display label for map nodes and compact badges.
 */
export function getShortLocationLabel(id?: string | null, rawName?: string | null): string {
  if (id && LOCATION_MAPPINGS[id]) {
    return LOCATION_MAPPINGS[id].shortLabel;
  }
  return getFriendlyLocationName(id, rawName);
}

/**
 * Returns the plain-English description for a baggage location.
 */
export function getLocationDescription(id?: string | null, rawName?: string | null): string {
  if (id && LOCATION_MAPPINGS[id]) {
    return LOCATION_MAPPINGS[id].description;
  }
  if (rawName) {
    const matched = TECHNICAL_TO_DESC_MAP[rawName.toLowerCase().trim()];
    if (matched) return matched;
  }
  return 'Airport baggage handling checkpoint.';
}

/**
 * Resolves an array of connected handling point IDs into friendly names and technical codes.
 * If a code cannot be resolved, preserves the existing code.
 */
export function getFriendlyConnectedLocations(connectedIds?: string[] | null): Array<{ id: string; name: string }> {
  if (!connectedIds || connectedIds.length === 0) {
    return [];
  }
  return connectedIds.map((cid) => {
    const item = LOCATION_MAPPINGS[cid];
    return {
      id: cid,
      name: item ? item.friendlyName : cid,
    };
  });
}
