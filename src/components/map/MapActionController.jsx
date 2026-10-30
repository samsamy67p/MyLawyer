import { useEffect } from 'react';
import { useMap } from 'react-leaflet';

/**
 * Controller inside Leaflet container for handling:
 * 1. Continuous ResizeObserver + multi-stage invalidation (prevents grey tiles during pageSlideUp 350ms animation)
 * 2. App visibility/resume recovery (redraws tiles when user returns from background)
 * 3. Exact camera framing & centering in both states:
 *    - When a bottom card is open (centers pin/route inside the visible map window above the card)
 *    - When no bottom card is open / collapsed (centers pin/route in the middle of the full screen)
 */
export default function MapActionController({ mapAction }) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    const safeInvalidate = () => {
      try {
        map.invalidateSize({ animate: false, pan: false });
      } catch {
        // Ignore if map container is already unmounted
      }
    };

    // Multi-stage invalidation covering initial mount (50ms), mid-transition (200ms),
    // and post-pageSlideUp animation completion (420ms)
    const t1 = setTimeout(safeInvalidate, 50);
    const t2 = setTimeout(safeInvalidate, 200);
    const t3 = setTimeout(safeInvalidate, 420);

    // Observe container layout changes (e.g. bottom sheet expansion, orientation change, keyboard)
    const container = map.getContainer();
    let resizeObserver = null;
    if (typeof ResizeObserver !== 'undefined' && container) {
      resizeObserver = new ResizeObserver(() => {
        safeInvalidate();
      });
      resizeObserver.observe(container);
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        setTimeout(safeInvalidate, 80);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [map]);

  useEffect(() => {
    if (!mapAction || !map) return;

    try {
      // Stop any ongoing animation and ensure container metrics are up to date before projecting
      map.stop();
      map.invalidateSize({ animate: false, pan: false });
    } catch {
      return;
    }

    const mapSize = map.getSize();
    const mapHeight = mapSize?.y || window.innerHeight || 800;
    const topBarInsetPx = 96;
    const isSheetOpen = mapAction.isSheetOpen !== false;
    const sheetHeightRatio = mapAction.sheetHeightRatio ?? 0.5;
    const collapsedBarPx = mapAction.collapsedBarPx ?? 74;

    const bottomInsetPx = isSheetOpen
      ? mapHeight * sheetHeightRatio
      : collapsedBarPx;

    if (mapAction.type === 'FOCUS_LAWYER') {
      const { coords } = mapAction;
      if (!Array.isArray(coords) || coords.length < 2) return;
      const targetZoom = Math.max(map.getZoom() || 15.5, 15.5);

      // Visible map vertical center between top bar and bottom card/bar
      const visibleCenterY = (topBarInsetPx + (mapHeight - bottomInsetPx)) / 2;
      // Lawyer marker is 84px tall anchored at bottom tip (82px); shift by 38px so avatar+pill center is balanced
      const markerVisualOffsetPx = 38;
      const offsetY = mapHeight / 2 - visibleCenterY - markerVisualOffsetPx;

      const targetPoint = map.project(coords, targetZoom);
      const cameraCenterLatLng = map.unproject(
        targetPoint.add([0, offsetY]),
        targetZoom
      );

      map.flyTo(cameraCenterLatLng, targetZoom, {
        duration: 0.65,
        easeLinearity: 0.25,
      });
    } else if (mapAction.type === 'FIT_USER_AND_TARGET') {
      const { userCoords, targetCoords, routeCoords } = mapAction;
      if (!Array.isArray(userCoords) || !Array.isArray(targetCoords)) return;

      const pointsToFit = [userCoords, targetCoords];
      if (Array.isArray(routeCoords) && routeCoords.length >= 2) {
        pointsToFit.push(...routeCoords);
      }

      try {
        map.fitBounds(pointsToFit, {
          // Extra top padding (topBarInsetPx + 75) accounts for the 82px-tall lawyer marker + floating pill
          paddingTopLeft: [52, topBarInsetPx + 75],
          paddingBottomRight: [52, bottomInsetPx + 42],
          maxZoom: 14.5,
          animate: true,
          duration: 0.8,
        });
      } catch {
        map.flyTo(userCoords, 14, { duration: 0.6 });
      }
    } else if (mapAction.type === 'RECENTER_USER') {
      const { position } = mapAction;
      if (!Array.isArray(position) || position.length < 2) return;
      const targetZoom = 15.5;

      const visibleCenterY = (topBarInsetPx + (mapHeight - bottomInsetPx)) / 2;
      const offsetY = mapHeight / 2 - visibleCenterY;

      const targetPoint = map.project(position, targetZoom);
      const cameraCenterLatLng = map.unproject(
        targetPoint.add([0, offsetY]),
        targetZoom
      );

      map.flyTo(cameraCenterLatLng, targetZoom, {
        duration: 0.7,
      });
    }
  }, [mapAction, map]);

  return null;
}
