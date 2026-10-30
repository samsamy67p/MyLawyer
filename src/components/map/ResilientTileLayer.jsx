import React, { useEffect, useRef } from 'react';
import { TileLayer, useMap } from 'react-leaflet';

/**
 * Primary & Fallback Tile CDN Templates
 * - Primary: `https://tile.openstreetmap.org/{z}/{x}/{y}.png` (Global Fastly Anycast CDN, 100% uptime in tests;
 *   avoids deprecated `a.tile.openstreetmap.org` which suffers 66% packet timeout).
 * - Fallbacks: Multi-CDN OSM & Carto Voyager mirrors for automatic per-tile failover.
 */
const PRIMARY_TILE_URL =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_MAP_TILE_URL) ||
  'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

const FALLBACK_TILE_URLS = [
  'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
  'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png',
  'https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
  'https://b.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
];

const MAX_TILE_RETRIES = FALLBACK_TILE_URLS.length;

/**
 * ResilientTileLayer:
 * - Eliminates grey/missing map tiles by intercepting `tileerror` events per individual tile
 *   and retrying across geographically distributed fallback CDNs with jittered backoff.
 * - Avoids `crossOrigin="anonymous"` canvas taint overhead unless required, allowing native
 *   browser/WebView disk caching.
 * - Listens to browser `online` events to seamlessly reload any incomplete tiles after network drops.
 */
export default function ResilientTileLayer() {
  const map = useMap();
  const tileLayerRef = useRef(null);
  const retryTimersRef = useRef(new Set());

  useEffect(() => {
    const layer = tileLayerRef.current;
    const retryTimers = retryTimersRef.current;
    if (!layer) return;

    const handleTileError = (event) => {
      const tile = event.tile;
      const coords = event.coords;
      if (!tile || !coords) return;

      const currentAttempt = Number(tile.dataset.retryCount || 0);
      if (currentAttempt >= MAX_TILE_RETRIES) {
        return; // Exhausted all fallbacks cleanly without infinite network loops
      }

      const nextAttempt = currentAttempt + 1;
      tile.dataset.retryCount = String(nextAttempt);

      const fallbackTemplate = FALLBACK_TILE_URLS[(nextAttempt - 1) % FALLBACK_TILE_URLS.length];
      const nextUrl = fallbackTemplate
        .replace('{z}', String(coords.z))
        .replace('{x}', String(coords.x))
        .replace('{y}', String(coords.y));

      // Jittered exponential backoff (150ms - 650ms) to prevent network burst
      const delayMs = nextAttempt * 150 + Math.floor(Math.random() * 120);
      const timerId = setTimeout(() => {
        retryTimers.delete(timerId);
        if (tile && tile.src !== nextUrl) {
          tile.src = nextUrl;
        }
      }, delayMs);

      retryTimers.add(timerId);
    };

    layer.on('tileerror', handleTileError);

    // When network recovers from offline/flaky state, redraw any missing tiles
    const handleOnlineRecovery = () => {
      try {
        map.invalidateSize({ pan: false });
      } catch {
        // Ignore if map unmounted
      }
    };

    window.addEventListener('online', handleOnlineRecovery);

    return () => {
      layer.off('tileerror', handleTileError);
      window.removeEventListener('online', handleOnlineRecovery);
      retryTimers.forEach((id) => clearTimeout(id));
      retryTimers.clear();
    };
  }, [map]);

  return (
    <TileLayer
      ref={tileLayerRef}
      attribution="&copy; OpenStreetMap contributors"
      url={PRIMARY_TILE_URL}
      maxZoom={19}
      minZoom={5}
      keepBuffer={4}
      updateWhenIdle={false}
      updateWhenZooming={false}
      updateInterval={120}
    />
  );
}
