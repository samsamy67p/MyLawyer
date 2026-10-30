import { useState, useMemo, useEffect, useCallback } from 'react';
import { CAIRO_DEFAULT_COORDS, normalizeCoords } from '../constants/geo.js';
import {
  resolveRoadSnappedLawyers,
  rankLawyersBySuitability,
  selectNextAlternativeLawyer,
} from '../services/lawyerService.js';
import { getRoadNavigationRoute } from '../services/mapService.js';

/**
 * Shared hook for managing nearby road-snapped lawyers, target selection,
 * and live road navigation routing (Valhalla/OSRM) with AbortController cancellation.
 *
 * Ensures a clean loading phase (`isSearchingNearby`) on every new request session
 * before revealing the lawyers list, even when road-snapped coordinates are served from cache.
 */
export function useNearbyLawyersRoute(userCoords) {
  const rawLat = Array.isArray(userCoords) ? userCoords[0] : userCoords?.latitude;
  const rawLon = Array.isArray(userCoords) ? userCoords[1] : userCoords?.longitude;

  const position = useMemo(
    () => normalizeCoords([rawLat, rawLon], CAIRO_DEFAULT_COORDS),
    [rawLat, rawLon]
  );

  const userLat = position[0];
  const userLon = position[1];

  const [selectedLawyerId, setSelectedLawyerId] = useState(null);
  const [activeTargetLawyerId, setActiveTargetLawyerId] = useState(null);
  const [visitedLawyerIds, setVisitedLawyerIds] = useState([]);

  // Lawyers list: loaded dynamically from real backend API (empty by default)
  const [lawyersList, setLawyersList] = useState([]);

  const [isSearchingNearby, setIsSearchingNearby] = useState(true);

  // Route state: 'IDLE' | 'LOADING' | 'OK' | 'ERROR'
  const [routeStatus, setRouteStatus] = useState('IDLE');
  const [activeRouteCoords, setActiveRouteCoords] = useState([]);
  const [routeInfo, setRouteInfo] = useState(null);
  const [routeErrorMsg, setRouteErrorMsg] = useState('');

  // Resolve road-snapped lawyer positions & real driving matrix on mount / user location change
  // Always displays a brief, smooth loading state (minimum 900ms) on every new request
  useEffect(() => {
    const abortCtrl = new AbortController();
    let loadingTimer = null;
    const startTime = Date.now();
    const minLoadingMs = 900;

    Promise.resolve().then(() => {
      if (abortCtrl.signal.aborted) return;
      setIsSearchingNearby(true);
      setVisitedLawyerIds([]);
      setLawyersList([]);
    });

    resolveRoadSnappedLawyers(userLat, userLon, {
      signal: abortCtrl.signal,
    })
      .then((snappedLawyers) => {
        if (!abortCtrl.signal.aborted && Array.isArray(snappedLawyers)) {
          setLawyersList(snappedLawyers);
        }
      })
      .catch(() => {
        // Ignored if aborted
      })
      .finally(() => {
        if (abortCtrl.signal.aborted) return;
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, minLoadingMs - elapsed);
        if (remaining > 0) {
          loadingTimer = setTimeout(() => {
            if (!abortCtrl.signal.aborted) {
              setIsSearchingNearby(false);
            }
          }, remaining);
        } else {
          setIsSearchingNearby(false);
        }
      });

    return () => {
      abortCtrl.abort();
      if (loadingTimer) clearTimeout(loadingTimer);
    };
  }, [userLat, userLon]);

  // Rank lawyers deterministically by connection status (online first), road proximity, and rating
  const sortedLawyers = useMemo(() => {
    return rankLawyersBySuitability(lawyersList);
  }, [lawyersList]);

  const closestLawyer = sortedLawyers[0] || null;

  // Resolve active target lawyer object from current sortedLawyers (ensuring fresh metrics)
  const targetLawyer = useMemo(() => {
    if (activeTargetLawyerId) {
      const found = sortedLawyers.find((l) => l.id === activeTargetLawyerId);
      if (found) return found;
    }
    return closestLawyer;
  }, [sortedLawyers, activeTargetLawyerId, closestLawyer]);

  // Resolve modal lawyer object from current sortedLawyers (ensuring modal always shows updated distance/ETA)
  const selectedLawyer = useMemo(() => {
    if (!selectedLawyerId) return null;
    return sortedLawyers.find((l) => l.id === selectedLawyerId) || null;
  }, [sortedLawyers, selectedLawyerId]);

  // Record any viewed lawyer in visitedLawyerIds so "محامٍ آخر" won't repeat already-seen profiles
  const markLawyerVisited = useCallback((lawyerId) => {
    if (!lawyerId) return;
    setVisitedLawyerIds((prev) =>
      prev.includes(lawyerId) ? prev : [...prev, lawyerId]
    );
  }, []);

  // Whether at least one alternative lawyer exists excluding the currently displayed lawyer
  const hasAlternativeLawyer = useMemo(() => {
    const activeId = selectedLawyerId || activeTargetLawyerId || closestLawyer?.id;
    if (!activeId) return sortedLawyers.length > 1;
    return sortedLawyers.some((l) => l.id !== activeId);
  }, [sortedLawyers, selectedLawyerId, activeTargetLawyerId, closestLawyer]);

  // Deterministically select the next best alternative lawyer and synchronize target + modal + visited history
  const selectAlternativeLawyer = useCallback(
    (explicitCurrentId) => {
      const currentId =
        explicitCurrentId ||
        selectedLawyerId ||
        activeTargetLawyerId ||
        closestLawyer?.id ||
        null;

      const result = selectNextAlternativeLawyer(
        sortedLawyers,
        currentId,
        visitedLawyerIds
      );

      if (result.nextLawyer) {
        setVisitedLawyerIds(result.updatedVisitedIds);
        setActiveTargetLawyerId(result.nextLawyer.id);
        setSelectedLawyerId(result.nextLawyer.id);
      }

      return result;
    },
    [sortedLawyers, selectedLawyerId, activeTargetLawyerId, closestLawyer, visitedLawyerIds]
  );

  const targetId = targetLawyer?.id;
  const targetName = targetLawyer?.name;
  const targetLat = targetLawyer?.coords?.[0];
  const targetLon = targetLawyer?.coords?.[1];

  // Real, Dynamic Road Navigation Route Calculation with AbortController & Sequence Guard
  useEffect(() => {
    if (!targetId || targetLat === undefined || targetLon === undefined) return;

    const abortCtrl = new AbortController();

    Promise.resolve().then(() => {
      if (abortCtrl.signal.aborted) return;
      setRouteStatus('LOADING');
      setRouteErrorMsg('');
    });

    getRoadNavigationRoute([userLat, userLon], [targetLat, targetLon], {
      signal: abortCtrl.signal,
    })
      .then((routeRes) => {
        if (abortCtrl.signal.aborted) return;

        if (routeRes && routeRes.status === 'OK' && routeRes.coords.length >= 2) {
          setActiveRouteCoords(routeRes.coords);
          setRouteInfo({
            lawyerId: targetId,
            lawyerName: targetName,
            distanceMeters: routeRes.distanceMeters,
            durationSeconds: routeRes.durationSeconds,
            distanceKm: routeRes.distanceKm,
            formattedDistanceKm: routeRes.formattedDistanceKm,
            formattedDurationMins: routeRes.formattedDurationMins,
            hasFerry: routeRes.hasFerry,
          });
          setRouteStatus('OK');

          // Synchronize exact route distance & duration back into the lawyer item so list, badge, and modal match 100%
          setLawyersList((prev) =>
            prev.map((item) =>
              item.id === targetId
                ? {
                  ...item,
                  coords: routeRes.snappedEnd || item.coords,
                  distanceMeters: routeRes.distanceMeters,
                  distanceKm: routeRes.distanceKm,
                  formattedDistanceKm: routeRes.formattedDistanceKm,
                  durationSeconds: routeRes.durationSeconds,
                  formattedDurationMins: routeRes.formattedDurationMins,
                  isRoadSnapped: true,
                }
                : item
            )
          );
        } else {
          // Never draw a fake or straight line on failure! Clear route and show clear status
          setActiveRouteCoords([]);
          setRouteInfo(null);
          setRouteStatus('ERROR');
          setRouteErrorMsg(
            routeRes?.errorMessage || 'تعذر التحقق من المسار البري إلى الوجهة.'
          );
        }
      })
      .catch((err) => {
        if (err.name === 'AbortError' || abortCtrl.signal.aborted) return;
        setActiveRouteCoords([]);
        setRouteInfo(null);
        setRouteStatus('ERROR');
        setRouteErrorMsg('تعذر الاتصال بخدمة المسارات حالياً.');
      });

    return () => {
      abortCtrl.abort();
    };
  }, [userLat, userLon, targetId, targetName, targetLat, targetLon]);

  return {
    position,
    sortedLawyers,
    closestLawyer,
    targetLawyer,
    selectedLawyer,
    selectedLawyerId,
    setSelectedLawyerId,
    activeTargetLawyerId,
    setActiveTargetLawyerId,
    visitedLawyerIds,
    markLawyerVisited,
    hasAlternativeLawyer,
    selectAlternativeLawyer,
    isSearchingNearby,
    routeStatus,
    activeRouteCoords,
    routeInfo,
    routeErrorMsg,
  };
}
