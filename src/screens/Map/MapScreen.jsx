import React, { useRef, useState, useEffect } from 'react';
import { MapContainer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Crosshair,
  MapPin,
  Loader2,
} from 'lucide-react';
import { Geolocation } from '@capacitor/geolocation';
import Header from '../../components/layout/Header';
import { Button } from '../../components/ui/Button';
import LawyerProfileModal from '../../components/common/LawyerProfileModal';
import MapActionController from '../../components/map/MapActionController';
import ResilientTileLayer from '../../components/map/ResilientTileLayer';
import RouteStatusBadge from '../../components/map/RouteStatusBadge';
import { createUserMarkerIcon, createLawyerMarkerIcon } from '../../components/map/MapMarkerIcons';
import { useNearbyLawyersRoute } from '../../hooks/useNearbyLawyersRoute';
import { reverseGeocode } from '../../services/mapService';
import { EGYPT_MAX_BOUNDS } from '../../constants/geo';
import './MapScreen.css';

export default function MapScreen({
  userCoords,
  initialCoords,
  addressTitle,
  initialAddress,
  onConfirmLocation,
  onBack,
  onModalStateChange,
}) {
  const effectiveCoords = userCoords || initialCoords;
  const effectiveAddress = addressTitle || initialAddress;

  const [liveCoords, setLiveCoords] = useState(null);
  const [liveAddress, setLiveAddress] = useState(null);
  const [isRefreshingGps, setIsRefreshingGps] = useState(false);

  const currentCoordsToUse = liveCoords || effectiveCoords;
  const currentAddressToUse = liveAddress || effectiveAddress;

  const {
    position,
    sortedLawyers,
    closestLawyer,
    targetLawyer,
    selectedLawyer,
    selectedLawyerId,
    setSelectedLawyerId,
    setActiveTargetLawyerId,
    markLawyerVisited,
    isSearchingNearby,
    routeStatus,
    activeRouteCoords,
    routeInfo,
    routeErrorMsg,
  } = useNearbyLawyersRoute(currentCoordsToUse);

  const mapRef = useRef(null);
  const hasUserSelectedLawyerRef = useRef(false);
  const actionSeqRef = useRef(0);
  const [mapAction, setMapAction] = useState(null);

  const closestLat = closestLawyer?.coords?.[0];
  const closestLon = closestLawyer?.coords?.[1];
  const targetId = targetLawyer?.id;
  const targetLat = targetLawyer?.coords?.[0];
  const targetLon = targetLawyer?.coords?.[1];
  const isModalOpen = Boolean(selectedLawyer);

  // Initial Camera Framing: Zoom out to show both user position and closest lawyer with their connecting route
  useEffect(() => {
    if (hasUserSelectedLawyerRef.current) return;
    if (!position || closestLat === undefined || closestLon === undefined) return;

    const timer = setTimeout(() => {
      if (hasUserSelectedLawyerRef.current) return;
      actionSeqRef.current += 1;
      setMapAction({
        type: 'FIT_USER_AND_TARGET',
        userCoords: position,
        targetCoords: [closestLat, closestLon],
        routeCoords: activeRouteCoords,
        isSheetOpen: true,
        sheetHeightRatio: 0.25,
        seq: actionSeqRef.current,
      });
    }, 320);

    return () => clearTimeout(timer);
  }, [position, closestLat, closestLon, activeRouteCoords, isSearchingNearby]);

  // Adjust camera when a lawyer is selected or LawyerProfileModal (50vh) opens/closes over confirmation sheet (25vh)
  useEffect(() => {
    if (!hasUserSelectedLawyerRef.current) return;
    if (targetLat === undefined || targetLon === undefined) return;

    actionSeqRef.current += 1;
    setMapAction({
      type: 'FOCUS_LAWYER',
      coords: [targetLat, targetLon],
      isSheetOpen: true,
      sheetHeightRatio: isModalOpen ? 0.5 : 0.25,
      seq: actionSeqRef.current,
    });
  }, [targetId, targetLat, targetLon, isModalOpen]);

  // Notify parent of modal open/close state for centralized single back button handling
  useEffect(() => {
    onModalStateChange?.(Boolean(selectedLawyerId), () => setSelectedLawyerId(null));
    return () => {
      onModalStateChange?.(false, null);
    };
  }, [selectedLawyerId, setSelectedLawyerId, onModalStateChange]);

  const handleSelectLawyer = (lawyer) => {
    if (!lawyer) return;
    hasUserSelectedLawyerRef.current = true;
    setActiveTargetLawyerId(lawyer.id);
    setSelectedLawyerId(lawyer.id);
    markLawyerVisited(lawyer.id);
    if (lawyer.coords) {
      actionSeqRef.current += 1;
      setMapAction({
        type: 'FOCUS_LAWYER',
        coords: lawyer.coords,
        isSheetOpen: true,
        sheetHeightRatio: 0.5,
        seq: actionSeqRef.current,
      });
    }
  };

  const handleRecenter = () => {
    handleRefreshGps();
  };

  const handleRefreshGps = async () => {
    if (isRefreshingGps) return;
    setIsRefreshingGps(true);
    try {
      try {
        await Geolocation.requestPermissions();
      } catch (e) {
        console.warn('GPS permission:', e);
      }
      let coords;
      try {
        coords = await Geolocation.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 10000,
        });
      } catch {
        coords = await Geolocation.getCurrentPosition({
          enableHighAccuracy: false,
          timeout: 10000,
        });
      }
      if (coords?.coords) {
        const { latitude, longitude } = coords.coords;
        setLiveCoords({ latitude, longitude });
        const resolved = await reverseGeocode(latitude, longitude);
        setLiveAddress(resolved);
        actionSeqRef.current += 1;
        setMapAction({
          type: 'RECENTER_USER',
          position: [latitude, longitude],
          isSheetOpen: true,
          sheetHeightRatio: isModalOpen ? 0.5 : 0.25,
          seq: actionSeqRef.current,
        });
      }
    } catch (e) {
      console.warn('Refresh GPS error:', e);
    } finally {
      setIsRefreshingGps(false);
    }
  };

  return (
    <div className="map-screen-wrapper">
      {/* Unified Global Header */}
      <Header
        title="موقعك على الخريطة"
        showBack={true}
        onBack={onBack}
      />

      {/* Map Canvas */}
      <div className="map-canvas-container">
        <MapContainer
          center={position}
          zoom={14}
          minZoom={5}
          maxZoom={19}
          maxBounds={EGYPT_MAX_BOUNDS}
          maxBoundsViscosity={0.85}
          scrollWheelZoom={true}
          zoomControl={false}
          className="leaflet-map-element"
          ref={mapRef}
        >
          <ResilientTileLayer />

          <MapActionController mapAction={mapAction} />

          {/* Verified Road Navigation Route */}
          {routeStatus === 'OK' && activeRouteCoords.length >= 2 && (
            <Polyline
              positions={activeRouteCoords}
              color="#1D4ED8"
              weight={3.5}
              opacity={0.92}
              dashArray="8, 6"
              className="crisp-navigation-line"
            />
          )}

          {/* User Location Marker */}
          <Marker position={position} icon={createUserMarkerIcon()}>
            <Popup className="clean-custom-popup">
              <div className="popup-inner">
                <strong>موقعك المعتمد</strong>
                <p>{currentAddressToUse || 'تم تحديد موقعك بدقة'}</p>
              </div>
            </Popup>
          </Marker>

          {/* Nearby Lawyer Markers */}
          {sortedLawyers.map((lawyer) => (
            <Marker
              key={lawyer.id}
              position={lawyer.coords}
              icon={createLawyerMarkerIcon(
                lawyer.avatar,
                lawyer.name,
                lawyer.rating,
                lawyer.isOnline,
                targetLawyer?.id === lawyer.id
              )}
              eventHandlers={{
                click: () => handleSelectLawyer(lawyer),
              }}
            />
          ))}
        </MapContainer>

        {/* Floating Recenter (GPS) Button */}
        <button
          type="button"
          onClick={handleRecenter}
          disabled={isRefreshingGps}
          className="map-recenter-float"
          aria-label="إعادة التمركز على موقعي"
        >
          {isRefreshingGps ? (
            <Loader2 size={21} className="text-[#1D4ED8] animate-spin" />
          ) : (
            <Crosshair size={21} className="text-[#1D4ED8]" />
          )}
        </button>

        {/* Floating Route Distance/Duration Badge */}
        <RouteStatusBadge
          routeStatus={routeStatus}
          routeInfo={routeInfo}
          routeErrorMsg={routeErrorMsg}
          badgeClassName="map-route-badge-float"
          showLawyerName={false}
          durationSuffix="دقيقة بالسيارة"
        />
      </div>

      {/* Bottom Confirmation Sheet */}
      <div className="map-bottom-sheet">
        <div className="map-sheet-handle"></div>

        <div className="map-location-summary">
          <div className="map-summary-icon">
            <MapPin size={22} className="text-[#1D4ED8]" />
          </div>
          <div className="map-summary-text">
            <span className="map-summary-label">الموقع المحدد للخدمة</span>
            <h4 className="map-summary-address">{currentAddressToUse || 'مصر'}</h4>
          </div>
          <button
            type="button"
            onClick={handleRefreshGps}
            disabled={isRefreshingGps}
            aria-busy={isRefreshingGps ? 'true' : undefined}
            className="mr-auto text-xs font-bold text-[#1D4ED8] bg-blue-50 hover:bg-blue-100 py-1.5 px-3 rounded-full flex items-center justify-center gap-1.5 transition-colors shrink-0 relative"
          >
            {isRefreshingGps && (
              <span
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
                aria-hidden="true"
              >
                <Loader2 size={13} className="animate-spin text-[#1D4ED8]" />
                <span className="sr-only">جاري تحديث الموقع...</span>
              </span>
            )}
            <span
              className={
                isRefreshingGps
                  ? 'invisible opacity-0 select-none pointer-events-none inline-flex items-center gap-1.5'
                  : 'inline-flex items-center gap-1.5'
              }
              aria-hidden={isRefreshingGps ? 'true' : undefined}
            >
              <Crosshair size={13} className="text-[#1D4ED8]" />
              <span>تحديث موقعي</span>
            </span>
          </button>
        </div>

        <Button
          variant="primary"
          size="lg"
          className="w-full h-12 text-[15px] font-bold rounded-[7px] bg-[#1D4ED8] hover:bg-[#1E40AF] text-white shadow-sm flex items-center justify-center"
          onClick={() =>
            onConfirmLocation?.(
              { latitude: position[0], longitude: position[1] },
              currentAddressToUse
            )
          }
        >
          <span>التالي</span>
        </Button>
      </div>

      {/* Lawyer Profile Sheet Modal - ReadOnly for Location Preview */}
      {selectedLawyer && (
        <LawyerProfileModal
          lawyer={selectedLawyer}
          readOnly={true}
          hasAlternativeLawyer={false}
          onClose={() => setSelectedLawyerId(null)}
        />
      )}
    </div>
  );
}
