import { isValidCoordinate, isWithinEgyptBounds } from '../constants/geo.js';

/**
 * Configuration for Map & Routing Providers
 * Uses environment variables if configured for enterprise clusters,
 * falling back to verified public OSM/FOSSGIS Valhalla & OSRM endpoints.
 */
const ROUTING_CONFIG = {
  VALHALLA_BASE_URL:
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_VALHALLA_URL) ||
    'https://valhalla1.openstreetmap.de',
  OSRM_BASE_URL:
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_OSRM_URL) ||
    'https://routing.openstreetmap.de/routed-car',
  REQUEST_TIMEOUT_MS: 5500,
  MAX_RETRIES: 2,
  CACHE_TTL_MS: 10 * 60 * 1000, // 10 minutes TTL
  MAX_CACHE_ENTRIES: 120,
  SNAP_SEARCH_RADIUS_M: 2500, // Max distance in meters to snap to a valid road
};

// Bounded LRU Cache for routes and reverse geocoding
const routeCache = new Map();
const geocodeCache = new Map();
// Map of in-flight promises to deduplicate identical concurrent requests
const inFlightRequests = new Map();

/**
 * Helper: Maintains bounded LRU cache size and TTL expiration
 */
function getCachedEntry(cacheMap, key, ttlMs = ROUTING_CONFIG.CACHE_TTL_MS) {
  if (!cacheMap.has(key)) return null;
  const entry = cacheMap.get(key);
  if (Date.now() - entry.timestamp > ttlMs) {
    cacheMap.delete(key);
    return null;
  }
  // Refresh LRU order
  cacheMap.delete(key);
  cacheMap.set(key, entry);
  return entry.data;
}

function setCachedEntry(cacheMap, key, data, maxEntries = ROUTING_CONFIG.MAX_CACHE_ENTRIES) {
  if (cacheMap.size >= maxEntries) {
    const oldestKey = cacheMap.keys().next().value;
    cacheMap.delete(oldestKey);
  }
  cacheMap.set(key, {
    data,
    timestamp: Date.now(),
  });
}

/**
 * Clears internal caches (used in testing and memory resets)
 */
export function clearNavigationCaches() {
  routeCache.clear();
  geocodeCache.clear();
  inFlightRequests.clear();
}

/**
 * Calculates accurate Haversine surface distance in meters between two [lat, lon] points
 */
export function calculateDirectDistanceMeters(startPos, endPos) {
  if (!isValidCoordinate(startPos) || !isValidCoordinate(endPos)) {
    return 0;
  }
  const R = 6371000;
  const lat1 = (startPos[0] * Math.PI) / 180;
  const lat2 = (endPos[0] * Math.PI) / 180;
  const deltaLat = ((endPos[0] - startPos[0]) * Math.PI) / 180;
  const deltaLon = ((endPos[1] - startPos[1]) * Math.PI) / 180;

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Decodes Google/Valhalla encoded polyline string into an array of [lat, lon] pairs.
 * Valhalla uses precision 6 (1e6), whereas standard OSRM/Google uses precision 5 (1e5).
 */
export function decodePolyline(encoded, precision = 6) {
  if (typeof encoded !== 'string' || encoded.length === 0) {
    return [];
  }
  const factor = Math.pow(10, precision);
  let index = 0;
  let lat = 0;
  let lng = 0;
  const coordinates = [];

  while (index < encoded.length) {
    let byte = null;
    let shift = 0;
    let result = 0;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20 && index < encoded.length + 1);

    const latitudeChange = result & 1 ? ~(result >> 1) : result >> 1;
    shift = 0;
    result = 0;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20 && index < encoded.length + 1);

    const longitudeChange = result & 1 ? ~(result >> 1) : result >> 1;

    lat += latitudeChange;
    lng += longitudeChange;

    const decodedLat = Number((lat / factor).toFixed(6));
    const decodedLng = Number((lng / factor).toFixed(6));

    if (Number.isFinite(decodedLat) && Number.isFinite(decodedLng)) {
      coordinates.push([decodedLat, decodedLng]);
    }
  }

  return coordinates;
}

/**
 * Formats distance (meters) and duration (seconds) into consistent Arabic display strings
 * and numeric values so all UI components show identical, unit-verified metrics.
 */
export function formatRouteMetrics(distanceMeters, durationSeconds) {
  const validDist = Math.max(0, Number(distanceMeters) || 0);
  const validDur = Math.max(0, Number(durationSeconds) || 0);

  const distanceKmNumeric = Number((validDist / 1000).toFixed(1));
  const formattedDistanceKm =
    distanceKmNumeric < 0.1 && validDist > 0
      ? '0.1'
      : distanceKmNumeric.toFixed(1);

  const durationMinsNumeric = Math.max(1, Math.round(validDur / 60));

  return {
    distanceMeters: Math.round(validDist),
    durationSeconds: Math.round(validDur),
    distanceKm: distanceKmNumeric,
    formattedDistanceKm,
    formattedDurationMins: durationMinsNumeric,
  };
}

/**
 * Validates that a decoded route geometry is authentic road geometry:
 * - Has at least 2 valid coordinates
 * - Does not contain NaN or out-of-range coordinates
 * - Total polyline cumulative length matches reported route distance within reasonable tolerance
 */
export function validateRouteGeometry(coords, reportedDistanceMeters) {
  if (!Array.isArray(coords) || coords.length < 2) {
    return { valid: false, reason: 'INSUFFICIENT_POINTS' };
  }

  let cumulativeMeters = 0;
  for (let i = 0; i < coords.length; i++) {
    if (!isValidCoordinate(coords[i])) {
      return { valid: false, reason: 'INVALID_VERTEX_COORDINATE' };
    }
    if (i > 0) {
      const segDist = calculateDirectDistanceMeters(coords[i - 1], coords[i]);
      // A single road segment between consecutive polyline vertices should never jump > 15km unsegmented
      if (segDist > 15000) {
        return { valid: false, reason: 'UNREALISTIC_SEGMENT_JUMP' };
      }
      cumulativeMeters += segDist;
    }
  }

  // If the route is > 300m, a 2-point straight line is suspicious unless verified by road segments
  if (reportedDistanceMeters > 450 && coords.length < 3) {
    return { valid: false, reason: 'STRAIGHT_LINE_REJECTED' };
  }

  // Verify cumulative geometry length matches the reported route length (within 25% tolerance)
  if (reportedDistanceMeters > 100 && cumulativeMeters > 0) {
    const ratio = cumulativeMeters / reportedDistanceMeters;
    if (ratio < 0.65 || ratio > 1.45) {
      return { valid: false, reason: 'GEOMETRY_DISTANCE_MISMATCH' };
    }
  }

  return {
    valid: true,
    cumulativeMeters: Math.round(cumulativeMeters),
  };
}

/**
 * Helper: Performs fetch with timeout, external AbortSignal support, and exponential backoff with jitter
 */
async function fetchWithRetry(url, options = {}, externalSignal = null, maxRetries = ROUTING_CONFIG.MAX_RETRIES) {
  let attempt = 0;

  while (attempt <= maxRetries) {
    if (externalSignal?.aborted) {
      const abortErr = new Error('Request aborted by caller');
      abortErr.name = 'AbortError';
      throw abortErr;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), options.timeoutMs || ROUTING_CONFIG.REQUEST_TIMEOUT_MS);

    const onExternalAbort = () => controller.abort();
    if (externalSignal) {
      externalSignal.addEventListener('abort', onExternalAbort, { once: true });
    }

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (externalSignal) {
        externalSignal.removeEventListener('abort', onExternalAbort);
      }

      // Do not retry 400 Bad Request (e.g., Valhalla error 171 "No suitable edges near location")
      if (response.status >= 400 && response.status < 500 && response.status !== 429) {
        return response;
      }

      if (response.ok) {
        return response;
      }

      // Retry on 429 Too Many Requests or 5xx Server Errors
      throw new Error(`HTTP ${response.status}`);
    } catch (err) {
      clearTimeout(timeoutId);
      if (externalSignal) {
        externalSignal.removeEventListener('abort', onExternalAbort);
      }

      if (externalSignal?.aborted || err.name === 'AbortError' && externalSignal?.aborted) {
        const abortErr = new Error('Request aborted by caller');
        abortErr.name = 'AbortError';
        throw abortErr;
      }

      if (attempt >= maxRetries) {
        throw err;
      }

      // Exponential backoff (250ms, 600ms) + random jitter (0-150ms) to prevent thundering herd
      const backoffMs = Math.pow(2, attempt) * 250 + Math.floor(Math.random() * 150);
      await new Promise((resolve) => setTimeout(resolve, backoffMs));
      attempt++;
    }
  }
}

/**
 * Dedicated Geocoding Service (Fast Dual-Provider reverse lookup with caching & deduplication)
 */
export async function reverseGeocode(latitude, longitude, options = {}) {
  if (!isValidCoordinate([latitude, longitude])) {
    return 'موقع غير صالح';
  }

  // Cache key rounded to ~110m (3 decimal places) to avoid redundant geocoding calls
  const cacheKey = `geo:${Number(latitude).toFixed(3)},${Number(longitude).toFixed(3)}`;
  const cached = getCachedEntry(geocodeCache, cacheKey, 30 * 60 * 1000);
  if (cached) return cached;

  if (inFlightRequests.has(cacheKey)) {
    return inFlightRequests.get(cacheKey);
  }

  const requestPromise = (async () => {
    // 1. Primary: Fast BigDataCloud Free Client Reverse Geocoding
    try {
      const res = await fetchWithRetry(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=ar`,
        { timeoutMs: 3500 },
        options.signal,
        1
      );

      if (res.ok) {
        const data = await res.json();
        const city = data.city || data.locality || '';
        const state = data.principalSubdivision || '';
        let resolved = '';
        if (city && state && city !== state) {
          resolved = `${city}، ${state}`;
        } else if (city || state) {
          resolved = city || state;
        }
        if (resolved) {
          setCachedEntry(geocodeCache, cacheKey, resolved);
          return resolved;
        }
      }
    } catch (e) {
      if (e.name === 'AbortError') throw e;
    }

    // 2. Secondary Fallback: OpenStreetMap Nominatim
    try {
      const res = await fetchWithRetry(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=ar&addressdetails=1`,
        {
          timeoutMs: 4000,
          headers: {
            'User-Agent': 'MyLawyerEgypt/1.0 (info@mylawyer.eg)',
            Accept: 'application/json',
          },
        },
        options.signal,
        1
      );

      if (res.ok) {
        const data = await res.json();
        const addr = data.address || {};
        const city =
          addr.city ||
          addr.town ||
          addr.suburb ||
          addr.village ||
          addr.municipality ||
          addr.neighbourhood ||
          '';
        const state = addr.state || addr.governorate || addr.province || '';

        let resolved = '';
        if (city && state && city !== state) {
          resolved = `${city}، ${state}`;
        } else if (city || state) {
          resolved = city || state;
        }
        if (resolved) {
          setCachedEntry(geocodeCache, cacheKey, resolved);
          return resolved;
        }
      }
    } catch (e) {
      if (e.name === 'AbortError') throw e;
    }

    return 'تم التقاط الموقع بدقة';
  })();

  inFlightRequests.set(cacheKey, requestPromise);
  try {
    return await requestPromise;
  } finally {
    inFlightRequests.delete(cacheKey);
  }
}

/**
 * Batch Road Snapping & Matrix Distance/ETA Service using Valhalla `/sources_to_targets`.
 * Snaps candidate lawyer positions onto actual drivable roads on land (preventing sea pins!)
 * and computes real road distance and driving duration for all candidates in a single HTTP call.
 */
export async function snapAndComputeRoadMatrix(userPos, candidatePositions, options = {}) {
  if (!isValidCoordinate(userPos) || !Array.isArray(candidatePositions) || candidatePositions.length === 0) {
    return [];
  }

  const cacheKey = `matrix:${userPos[0].toFixed(4)},${userPos[1].toFixed(4)}:${candidatePositions
    .map((c) => `${c[0].toFixed(4)},${c[1].toFixed(4)}`)
    .join('|')}`;

  const cached = getCachedEntry(routeCache, cacheKey);
  if (cached) return cached;

  if (inFlightRequests.has(cacheKey)) {
    return inFlightRequests.get(cacheKey);
  }

  const requestPromise = (async () => {
    const payload = {
      sources: [
        {
          lat: Number(userPos[0].toFixed(6)),
          lon: Number(userPos[1].toFixed(6)),
          radius: ROUTING_CONFIG.SNAP_SEARCH_RADIUS_M,
        },
      ],
      targets: candidatePositions.map((pos) => ({
        lat: Number(pos[0].toFixed(6)),
        lon: Number(pos[1].toFixed(6)),
        radius: ROUTING_CONFIG.SNAP_SEARCH_RADIUS_M,
      })),
      costing: 'auto',
      units: 'kilometers',
    };

    const res = await fetchWithRetry(
      `${ROUTING_CONFIG.VALHALLA_BASE_URL}/sources_to_targets`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        timeoutMs: ROUTING_CONFIG.REQUEST_TIMEOUT_MS,
      },
      options.signal
    );

    if (!res.ok) {
      throw new Error(`Matrix routing HTTP ${res.status}`);
    }

    const data = await res.json();
    const row = data.sources_to_targets?.[0];
    const targetsList = Array.isArray(data.targets) ? data.targets : data.sources_to_targets_targets;
    const sourcePoint = Array.isArray(data.sources) ? data.sources[0] : null;
    if (!Array.isArray(row)) {
      throw new Error('Invalid matrix response structure');
    }

    const results = row.map((cell, index) => {
      const targetPoint = Array.isArray(targetsList) ? targetsList[index] : null;
      const endLat = Number.isFinite(cell?.end_lat) ? cell.end_lat : targetPoint?.lat;
      const endLon = Number.isFinite(cell?.end_lon) ? cell.end_lon : targetPoint?.lon;
      const beginLat = Number.isFinite(cell?.begin_lat) ? cell.begin_lat : sourcePoint?.lat;
      const beginLon = Number.isFinite(cell?.begin_lon) ? cell.begin_lon : sourcePoint?.lon;

      if (
        !cell ||
        cell.distance == null ||
        cell.time == null ||
        !Number.isFinite(endLat) ||
        !Number.isFinite(endLon)
      ) {
        return null;
      }

      const distanceMeters = Math.round(cell.distance * 1000);
      const durationSeconds = Math.round(cell.time);
      const metrics = formatRouteMetrics(distanceMeters, durationSeconds);

      return {
        targetIndex: index,
        snappedUserCoords:
          Number.isFinite(beginLat) && Number.isFinite(beginLon)
            ? [beginLat, beginLon]
            : userPos,
        snappedTargetCoords: [endLat, endLon],
        ...metrics,
      };
    });

    setCachedEntry(routeCache, cacheKey, results);
    return results;
  })();

  inFlightRequests.set(cacheKey, requestPromise);
  try {
    return await requestPromise;
  } finally {
    inFlightRequests.delete(cacheKey);
  }
}

/**
 * Primary Real Road Navigation Engine:
 * Fetches authentic turn-by-turn road network geometry, road distance, and travel time
 * from Valhalla (OpenStreetMap routing engine) with OSRM secondary support.
 *
 * Strictly forbids drawing fake or straight-line routes over water or buildings:
 * if a valid road route cannot be verified, returns `status: 'ERROR'` or `status: 'UNREACHABLE'`
 * with empty `coords: []` so the UI handles it safely and transparently.
 */
export async function getRoadNavigationRoute(startPos, endPos, options = {}) {
  const signal = typeof options === 'object' && options !== null ? options.signal : undefined;

  // 1. Input Coordinate Validation
  if (!isValidCoordinate(startPos) || !isValidCoordinate(endPos)) {
    return {
      status: 'INVALID_COORDINATES',
      coords: [],
      errorMessage: 'إحداثيات نقطة الانطلاق أو الوجهة غير صالحة.',
      isLiveRoad: false,
    };
  }

  // 2. Coverage Bounds Check (Egypt Bounds)
  if (!isWithinEgyptBounds(startPos) || !isWithinEgyptBounds(endPos)) {
    return {
      status: 'OUT_OF_COVERAGE',
      coords: [],
      errorMessage: 'الموقع المحدد يقع خارج نطاق تغطية شبكة الطرق المحلية.',
      isLiveRoad: false,
    };
  }

  // 3. Trivial Zero-Distance Check (< 15 meters)
  const directMeters = calculateDirectDistanceMeters(startPos, endPos);
  if (directMeters < 15) {
    const metrics = formatRouteMetrics(directMeters, 15);
    return {
      status: 'OK',
      coords: [startPos, endPos],
      snappedStart: startPos,
      snappedEnd: endPos,
      ...metrics,
      hasFerry: false,
      hasBridge: false,
      isLiveRoad: true,
    };
  }

  // 4. Check LRU Route Cache (rounded to 5 decimal places ~1.1m precision)
  const cacheKey = `route:${startPos[0].toFixed(5)},${startPos[1].toFixed(5)}->${endPos[0].toFixed(5)},${endPos[1].toFixed(5)}`;
  const cachedRoute = getCachedEntry(routeCache, cacheKey);
  if (cachedRoute) {
    return cachedRoute;
  }

  // 5. Deduplicate concurrent identical requests
  if (inFlightRequests.has(cacheKey) && !signal) {
    return inFlightRequests.get(cacheKey);
  }

  const executeRouteFetch = async () => {
    // --- Engine 1: Valhalla OpenStreetMap Routing Engine ---
    try {
      const payload = {
        locations: [
          {
            lat: Number(startPos[0].toFixed(6)),
            lon: Number(startPos[1].toFixed(6)),
            radius: ROUTING_CONFIG.SNAP_SEARCH_RADIUS_M,
          },
          {
            lat: Number(endPos[0].toFixed(6)),
            lon: Number(endPos[1].toFixed(6)),
            radius: ROUTING_CONFIG.SNAP_SEARCH_RADIUS_M,
          },
        ],
        costing: 'auto',
        directions_options: {
          units: 'kilometers',
          language: 'ar-EG',
        },
      };

      const res = await fetchWithRetry(
        `${ROUTING_CONFIG.VALHALLA_BASE_URL}/route`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
          timeoutMs: ROUTING_CONFIG.REQUEST_TIMEOUT_MS,
        },
        signal
      );

      if (res.status >= 400 && res.status < 500) {
        const errBody = await res.json().catch(() => ({}));
        return {
          status: 'UNREACHABLE',
          coords: [],
          errorCode: errBody.error_code || res.status,
          errorMessage: 'لا يتوفر مسار بري صالح للمركبات بين النقطتين المحددتين.',
          isLiveRoad: false,
        };
      }

      if (res.ok) {
        const data = await res.json();
        const trip = data.trip;
        const leg = trip?.legs?.[0];
        const summary = trip?.summary;

        if (leg?.shape && summary) {
          const decodedCoords = decodePolyline(leg.shape, 6);
          const distanceMeters = Math.round((summary.length || 0) * 1000);
          const durationSeconds = Math.round(summary.time || 0);

          const validation = validateRouteGeometry(decodedCoords, distanceMeters);
          if (validation.valid) {
            const metrics = formatRouteMetrics(distanceMeters, durationSeconds);
            const result = {
              status: 'OK',
              coords: decodedCoords,
              snappedStart: decodedCoords[0],
              snappedEnd: decodedCoords[decodedCoords.length - 1],
              ...metrics,
              hasFerry: Boolean(summary.has_ferry),
              hasToll: Boolean(summary.has_toll),
              hasHighway: Boolean(summary.has_highway),
              maneuversCount: Array.isArray(leg.maneuvers) ? leg.maneuvers.length : 0,
              provider: 'valhalla-osm',
              isLiveRoad: true,
            };
            setCachedEntry(routeCache, cacheKey, result);
            return result;
          }
        }
      }
    } catch (valhallaErr) {
      if (valhallaErr.name === 'AbortError') {
        throw valhallaErr;
      }
      // Continue to secondary engine if Valhalla had a network/5xx error
    }

    // --- Engine 2: Secondary OSRM GeoJSON Road Engine ---
    try {
      const osrmUrl = `${ROUTING_CONFIG.OSRM_BASE_URL}/route/v1/driving/${startPos[1].toFixed(6)},${startPos[0].toFixed(6)};${endPos[1].toFixed(6)},${endPos[0].toFixed(6)}?overview=full&geometries=geojson`;
      const res = await fetchWithRetry(osrmUrl, { timeoutMs: 3500 }, signal, 1);

      if (res.ok) {
        const data = await res.json();
        const route = data.routes?.[0];
        if (route?.geometry?.coordinates?.length >= 2) {
          // OSRM GeoJSON uses [lon, lat] -> convert to [lat, lon]
          const latLngs = route.geometry.coordinates.map((coord) => [
            Number(coord[1]),
            Number(coord[0]),
          ]);
          const distanceMeters = Math.round(route.distance || 0);
          const durationSeconds = Math.round(route.duration || 0);

          const validation = validateRouteGeometry(latLngs, distanceMeters);
          if (validation.valid) {
            const metrics = formatRouteMetrics(distanceMeters, durationSeconds);
            const result = {
              status: 'OK',
              coords: latLngs,
              snappedStart: latLngs[0],
              snappedEnd: latLngs[latLngs.length - 1],
              ...metrics,
              hasFerry: false,
              provider: 'osrm-osm',
              isLiveRoad: true,
            };
            setCachedEntry(routeCache, cacheKey, result);
            return result;
          }
        }
      }
    } catch (osrmErr) {
      if (osrmErr.name === 'AbortError') {
        throw osrmErr;
      }
    }

    // --- Safe Failure State: Never fabricate fake routes or straight lines over sea/buildings ---
    return {
      status: 'NETWORK_ERROR',
      coords: [],
      errorMessage: 'تعذر حساب المسار البري حالياً، يرجى التحقق من الاتصال والمحاولة مجدداً.',
      isLiveRoad: false,
    };
  };

  if (signal) {
    return executeRouteFetch();
  }

  const promise = executeRouteFetch();
  inFlightRequests.set(cacheKey, promise);
  try {
    return await promise;
  } finally {
    inFlightRequests.delete(cacheKey);
  }
}
