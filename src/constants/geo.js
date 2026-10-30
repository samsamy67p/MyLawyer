// Geographical Constants for Egypt boundaries & Map Configuration
export const EGYPT_BOUNDS = [
  [21.8, 24.5], // South-West (Aswan / Border)
  [31.9, 37.1], // North-East (Mediterranean / Sinai / Red Sea)
];

// Padded bounds for Leaflet maxBounds to prevent panning into empty grey oceans
export const EGYPT_MAX_BOUNDS = [
  [21.0, 24.0],
  [32.5, 37.5],
];

export const CAIRO_DEFAULT_COORDS = [30.0444, 31.2357];

/**
 * Validates that a coordinate pair [lat, lon] is finite and within valid WGS84 ranges
 */
export function isValidCoordinate(coords) {
  if (!Array.isArray(coords) || coords.length < 2) return false;
  const [lat, lon] = coords;
  return (
    typeof lat === 'number' &&
    typeof lon === 'number' &&
    Number.isFinite(lat) &&
    Number.isFinite(lon) &&
    lat >= -90 &&
    lat <= 90 &&
    lon >= -180 &&
    lon <= 180
  );
}

/**
 * Validates whether a coordinate pair lies within Egypt's geographical coverage box
 */
export function isWithinEgyptBounds(coords) {
  if (!isValidCoordinate(coords)) return false;
  const [lat, lon] = coords;
  return (
    lat >= EGYPT_BOUNDS[0][0] &&
    lat <= EGYPT_BOUNDS[1][0] &&
    lon >= EGYPT_BOUNDS[0][1] &&
    lon <= EGYPT_BOUNDS[1][1]
  );
}

/**
 * Normalizes any coordinate input ({latitude, longitude} or [lat, lon]) into [lat, lon]
 */
export function normalizeCoords(input, fallback = CAIRO_DEFAULT_COORDS) {
  if (Array.isArray(input) && isValidCoordinate(input)) {
    return [Number(input[0]), Number(input[1])];
  }
  if (
    input &&
    typeof input === 'object' &&
    typeof input.latitude === 'number' &&
    typeof input.longitude === 'number' &&
    Number.isFinite(input.latitude) &&
    Number.isFinite(input.longitude)
  ) {
    return [Number(input.latitude), Number(input.longitude)];
  }
  return fallback;
}

// Storage keys
export const STORAGE_KEYS = {
  USER: 'mylawyer_user',
  LOCATION: 'mylawyer_location',
  LOCATION_DONE: 'mylawyer_location_done',
  ROUTE_CACHE: 'mylawyer_route_cache_v1',
};
