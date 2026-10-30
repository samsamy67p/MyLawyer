import React, { useRef, useState, useEffect, useCallback } from 'react';
import { MapContainer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import {
  ChevronRight,
  Crosshair,
  Star,
  Loader2,
  ShieldAlert,
} from 'lucide-react';
import LawyerProfileModal from '../../components/common/LawyerProfileModal';
import Header from '../../components/layout/Header';
import MapActionController from '../../components/map/MapActionController';
import ResilientTileLayer from '../../components/map/ResilientTileLayer';
import RouteStatusBadge from '../../components/map/RouteStatusBadge';
import { createUserMarkerIcon, createLawyerMarkerIcon } from '../../components/map/MapMarkerIcons';
import { useNearbyLawyersRoute } from '../../hooks/useNearbyLawyersRoute';
import { useLawyerNowOrderFlow, DISPATCH_STAGES } from '../../hooks/useLawyerNowOrderFlow';
import LawyerNowPaymentOverlay from './components/LawyerNowPaymentOverlay';
import LawyerEnRouteSheetContent from './components/LawyerEnRouteSheetContent';
import { EGYPT_MAX_BOUNDS } from '../../constants/geo';
import './LawyerNowScreen.css';

/**
 * Dedicated On-Demand Live Lawyer Dispatch & Map Screen ("محاميك حالاً")
 * - Uses road-snapped lawyer coordinates (preventing sea/water markers).
 * - Fetches real turn-by-turn road geometry via Valhalla/OSRM with AbortController cancellation.
 * - Synchronizes exact route distance and ETA across the map badge, vertical list, and profile modal.
 * - Orchestrates the booking, payment, confirmation, waiting, and en-route lifecycle via `useLawyerNowOrderFlow`.
 */
export default function LawyerNowScreen({
  userCoords,
  addressTitle,
  requestDetails = null,
  onBack,
  onModalStateChange,
  onNavigateToOrders,
  onStartNewRequest,
}) {
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
    hasAlternativeLawyer,
    selectAlternativeLawyer,
    isSearchingNearby,
    routeStatus,
    activeRouteCoords,
    routeInfo,
    routeErrorMsg,
  } = useNearbyLawyersRoute(userCoords);

  const mapRef = useRef(null);
  const listScrollRef = useRef(null);
  const dragStartYRef = useRef(null);
  const hasUserSelectedLawyerRef = useRef(false);
  const actionSeqRef = useRef(0);

  // Draggable Bottom Sheet State (Open = false, Collapsed = true)
  const [isSheetCollapsed, setIsSheetCollapsed] = useState(false);
  const [sheetDragY, setSheetDragY] = useState(0);
  const [isSheetDragging, setIsSheetDragging] = useState(false);
  const [mapAction, setMapAction] = useState(null);

  const handleOrderAcceptedEnRoute = useCallback(
    (acceptedLawyer) => {
      setIsSheetCollapsed(false);
      if (acceptedLawyer?.coords && position) {
        actionSeqRef.current += 1;
        setMapAction({
          type: 'FIT_USER_AND_TARGET',
          userCoords: position,
          targetCoords: acceptedLawyer.coords,
          routeCoords: activeRouteCoords,
          isSheetOpen: true,
          sheetHeightRatio: 0.5,
          seq: actionSeqRef.current,
        });
      }
    },
    [position, activeRouteCoords]
  );

  const {
    dispatchStage,
    cardStage,
    bookedLawyerId,
    selectedPaymentMethod,
    evaluatedPrice,
    paymentStatus,
    paymentError,
    paymentReceipt,
    confirmationCountdown,
    lawyerDecisionStatus,
    lawyerDecisionCountdown,
    resetCardToProfile,
    closeLawyerModal,
    startPriceEvaluation,
    proceedToPayment,
    proceedFromConfirmedPayment,
    backFromPayment,
    stepBackInFlow,
    setSelectedPaymentMethod,
    confirmPayment,
  } = useLawyerNowOrderFlow({
    requestDetails,
    setSelectedLawyerId,
    setActiveTargetLawyerId,
    onOrderAcceptedEnRoute: handleOrderAcceptedEnRoute,
  });

  const bookedLawyer =
    sortedLawyers.find((l) => l.id === bookedLawyerId) || targetLawyer || closestLawyer;

  const isAnySheetExpanded = Boolean(selectedLawyer) || !isSheetCollapsed;

  const closestLat = closestLawyer?.coords?.[0];
  const closestLon = closestLawyer?.coords?.[1];
  const targetId = targetLawyer?.id;
  const targetLat = targetLawyer?.coords?.[0];
  const targetLon = targetLawyer?.coords?.[1];

  // 1. Initial Overview Camera Framing:
  // When opening the map for a new request (before user clicks a specific lawyer),
  // zoom out appropriately to frame user location, closest lawyer, and their route in the visible map area.
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
        isSheetOpen: isAnySheetExpanded,
        sheetHeightRatio: 0.5,
        seq: actionSeqRef.current,
      });
    }, 320);

    return () => clearTimeout(timer);
  }, [position, closestLat, closestLon, activeRouteCoords, isSearchingNearby, isAnySheetExpanded]);

  // 2. Reactive Target Lawyer Centering:
  // Whenever a lawyer is focused and either their snapped coordinates update OR the bottom card
  // opens/closes (`isAnySheetExpanded`), keep the lawyer pin accurately centered:
  // - In the visible upper map area when a card is open (`isAnySheetExpanded === true`)
  // - In the exact center of the full screen when no card is open (`isAnySheetExpanded === false`)
  useEffect(() => {
    if (!hasUserSelectedLawyerRef.current) return;
    if (dispatchStage === DISPATCH_STAGES.EN_ROUTE) return;
    if (targetLat === undefined || targetLon === undefined) return;

    actionSeqRef.current += 1;
    setMapAction({
      type: 'FOCUS_LAWYER',
      coords: [targetLat, targetLon],
      isSheetOpen: isAnySheetExpanded,
      sheetHeightRatio: 0.5,
      seq: actionSeqRef.current,
    });
  }, [targetId, targetLat, targetLon, isAnySheetExpanded, dispatchStage]);

  // Unified Back Action across all stages (Card, Payment, En-Route, or Screen Back)
  const handleUnifiedBack = useCallback(() => {
    const handledInFlow = stepBackInFlow(bookedLawyer);
    if (handledInFlow) return;

    if (selectedLawyerId) {
      closeLawyerModal();
      return;
    }

    onBack?.();
  }, [bookedLawyer, closeLawyerModal, onBack, selectedLawyerId, stepBackInFlow]);

  // Notify parent of modal/step open/close state for centralized hardware back button handling
  useEffect(() => {
    if (dispatchStage === DISPATCH_STAGES.PAYMENT) {
      onModalStateChange?.(true, () => backFromPayment(bookedLawyer));
    } else if (dispatchStage === DISPATCH_STAGES.EN_ROUTE) {
      onModalStateChange?.(true, () => stepBackInFlow(bookedLawyer));
    } else if (selectedLawyerId) {
      onModalStateChange?.(true, () => {
        if (!stepBackInFlow(bookedLawyer)) {
          closeLawyerModal();
        }
      });
    } else {
      onModalStateChange?.(false, null);
    }
    return () => {
      onModalStateChange?.(false, null);
    };
  }, [
    dispatchStage,
    selectedLawyerId,
    bookedLawyer,
    backFromPayment,
    stepBackInFlow,
    closeLawyerModal,
    onModalStateChange,
  ]);

  // Lawyer Pin or Card Click: update target route, open profile modal & center map camera accurately
  const handleSelectLawyer = (lawyer, openModal = true) => {
    if (!lawyer || dispatchStage === DISPATCH_STAGES.EN_ROUTE) return;
    hasUserSelectedLawyerRef.current = true;
    setActiveTargetLawyerId(lawyer.id);
    markLawyerVisited(lawyer.id);

    if (openModal) {
      resetCardToProfile();
      setSelectedLawyerId(lawyer.id);
    }

    const willSheetBeOpen = Boolean(openModal) || Boolean(selectedLawyerId) || !isSheetCollapsed;

    if (lawyer.coords) {
      actionSeqRef.current += 1;
      setMapAction({
        type: 'FOCUS_LAWYER',
        coords: lawyer.coords,
        isSheetOpen: willSheetBeOpen,
        sheetHeightRatio: 0.5,
        seq: actionSeqRef.current,
      });
    }
  };

  // Switch to the next recommended alternative lawyer ("محامٍ آخر") and synchronize map, route, list & modal
  const handleSelectAlternativeLawyer = (currentLawyer) => {
    if (dispatchStage === DISPATCH_STAGES.EN_ROUTE) return;
    hasUserSelectedLawyerRef.current = true;
    resetCardToProfile();

    const result = selectAlternativeLawyer(currentLawyer?.id || selectedLawyerId);
    if (result?.nextLawyer?.coords) {
      actionSeqRef.current += 1;
      setMapAction({
        type: 'FOCUS_LAWYER',
        coords: result.nextLawyer.coords,
        isSheetOpen: true,
        sheetHeightRatio: 0.5,
        seq: actionSeqRef.current,
      });
    }
  };

  const handleRecenter = () => {
    actionSeqRef.current += 1;
    setMapAction({
      type: 'RECENTER_USER',
      position,
      isSheetOpen: isAnySheetExpanded,
      sheetHeightRatio: 0.5,
      seq: actionSeqRef.current,
    });
  };

  // Drag handlers for "المحامون المتاحون بالقرب منك" bottom sheet (drag down to collapse, drag up to expand)
  const isOrderProcessActive =
    dispatchStage !== DISPATCH_STAGES.BROWSE || cardStage !== 'PROFILE';

  const handleSheetDragStart = (e, fromHeader = false) => {
    if (isOrderProcessActive) return;
    const listEl = listScrollRef.current;
    if (!fromHeader && !isSheetCollapsed && listEl && listEl.scrollTop > 4) {
      return;
    }
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    dragStartYRef.current = clientY;
    setIsSheetDragging(true);
  };

  const handleSheetDragMove = (e) => {
    if (isOrderProcessActive || !isSheetDragging || dragStartYRef.current === null) return;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const deltaY = clientY - dragStartYRef.current;

    if (!isSheetCollapsed) {
      setSheetDragY(Math.max(0, deltaY));
    } else {
      setSheetDragY(Math.min(0, deltaY));
    }
  };

  const handleSheetDragEnd = () => {
    if (isOrderProcessActive) {
      setIsSheetDragging(false);
      dragStartYRef.current = null;
      setSheetDragY(0);
      return;
    }
    if (!isSheetDragging) return;
    setIsSheetDragging(false);
    dragStartYRef.current = null;

    if (!isSheetCollapsed && sheetDragY > 55) {
      setIsSheetCollapsed(true);
    } else if (isSheetCollapsed && sheetDragY < -35) {
      setIsSheetCollapsed(false);
    }
    setSheetDragY(0);
  };

  return (
    <div className="lawyer-now-screen-wrapper">
      {/* Global Persistent Header */}
      <Header
        title="محاميك حالاً"
        showBack={true}
        onBack={handleUnifiedBack}
      />

      {/* Map Canvas */}
      <div className="lawyer-now-map-container">
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

          {/* Verified Road Navigation Route (Only rendered when status === 'OK') */}
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
                <p>{addressTitle || 'تم تحديد موقعك بدقة'}</p>
              </div>
            </Popup>
          </Marker>

          {/* All Available Lawyer Markers (or only booked lawyer when EN_ROUTE) */}
          {(dispatchStage === DISPATCH_STAGES.EN_ROUTE && bookedLawyer
            ? [bookedLawyer]
            : sortedLawyers
          ).map((lawyer) => (
            <Marker
              key={lawyer.id}
              position={lawyer.coords}
              icon={createLawyerMarkerIcon(
                lawyer.avatar,
                lawyer.name,
                lawyer.rating,
                lawyer.isOnline,
                targetLawyer?.id === lawyer.id || bookedLawyer?.id === lawyer.id
              )}
              eventHandlers={{
                click: () => handleSelectLawyer(lawyer, true),
              }}
            />
          ))}
        </MapContainer>

        {/* Floating Recenter (GPS) Button */}
        <button
          type="button"
          onClick={handleRecenter}
          className={`lawyer-now-recenter-float ${isAnySheetExpanded ? 'sheet-expanded' : 'sheet-collapsed'}`}
          aria-label="إعادة التمركز على موقعي"
        >
          <Crosshair size={21} className="text-[#1D4ED8]" />
        </button>

        {/* Floating Navigation Status / Info Badge */}
        <RouteStatusBadge
          routeStatus={routeStatus}
          routeInfo={routeInfo}
          routeErrorMsg={routeErrorMsg}
          badgeClassName="lawyer-now-route-badge"
          showLawyerName={true}
          durationSuffix="دقيقة وصول"
        />
      </div>

      {/* Bottom Dispatch Sheet with Vertical List View or Active En-Route View */}
      <div
        className={`lawyer-now-bottom-sheet ${isSheetCollapsed ? 'is-collapsed' : ''} ${isSheetDragging ? 'is-dragging' : ''}`}
        style={{
          transform: isSheetDragging
            ? isSheetCollapsed
              ? `translateY(calc(100% - 74px + ${sheetDragY}px))`
              : `translateY(${sheetDragY}px)`
            : undefined,
        }}
        onTouchStart={(e) => handleSheetDragStart(e, false)}
        onTouchMove={handleSheetDragMove}
        onTouchEnd={handleSheetDragEnd}
        onMouseDown={(e) => handleSheetDragStart(e, false)}
        onMouseMove={handleSheetDragMove}
        onMouseUp={handleSheetDragEnd}
        onMouseLeave={handleSheetDragEnd}
      >
        <div
          className="bottom-sheet-drag-zone"
          onTouchStart={(e) => {
            e.stopPropagation();
            handleSheetDragStart(e, true);
          }}
          onMouseDown={(e) => {
            e.stopPropagation();
            handleSheetDragStart(e, true);
          }}
          onClick={() => {
            if (isSheetCollapsed) {
              setIsSheetCollapsed(false);
            }
          }}
        >
          <div className="bottom-sheet-top-controls">
            <button
              type="button"
              className="bottom-sheet-back-btn"
              onClick={(e) => {
                e.stopPropagation();
                handleUnifiedBack();
              }}
              aria-label="رجوع"
            >
              <ChevronRight size={19} />
            </button>
            <div className="bottom-sheet-drag-handle"></div>
            <div className="w-[32px]"></div>
          </div>

          {dispatchStage === DISPATCH_STAGES.EN_ROUTE ? (
            <div className="bottom-sheet-header en-route-sheet-header">
              <h4 className="bottom-sheet-title">تم طلب المحامي وهو في الطريق إليك الآن</h4>
            </div>
          ) : (
            <div className="bottom-sheet-header">
              <div className="flex items-center justify-center">
                <h4 className="bottom-sheet-title">المحامون المتاحون بالقرب منك</h4>
              </div>
              <span className="bottom-sheet-hint">مرتبة حسب المسار الفعلي والأعلى تقييماً</span>
            </div>
          )}
        </div>

        {/* Sheet Body: Either Active En-Route Tracking OR Vertical List of Lawyers */}
        <div className="lawyer-vertical-list" ref={listScrollRef}>
          {dispatchStage === DISPATCH_STAGES.EN_ROUTE && bookedLawyer ? (
            <LawyerEnRouteSheetContent
              bookedLawyer={bookedLawyer}
              routeInfo={routeInfo}
              onNavigateToOrders={onNavigateToOrders}
              onStartNewRequest={onStartNewRequest}
            />
          ) : isSearchingNearby ? (
            <div className="sheet-loading-container">
              <Loader2 size={26} className="sheet-pure-spinner animate-spin" />
              <h4 className="sheet-loading-title">جاري البحث عن أقرب محامي ليك...</h4>
              <p className="sheet-loading-sub">بنحدد المحامين المتاحين حالياً على شبكة الطرق</p>
            </div>
          ) : sortedLawyers.length === 0 ? (
            <div className="sheet-empty-container flex flex-col items-center justify-center py-10 px-4 text-center select-none">
              <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3 shadow-inner">
                <ShieldAlert size={26} className="text-[#1D4ED8]" />
              </div>
              <h4 className="text-[15px] font-bold text-slate-800 mb-1">لا يوجد محامون متاحون حالياً</h4>
              <p className="text-[13px] text-slate-500 max-w-[270px] leading-relaxed mb-4">
                لا يوجد محامون معتمدون متاحون في نطاقك الجغرافي حالياً. يمكنك إعادة المحاولة بعد قليل.
              </p>
            </div>
          ) : (
            sortedLawyers.map((lawyer, index) => {
              const isSelectedTarget = targetLawyer?.id === lawyer.id;
              return (
                <div
                  key={lawyer.id}
                  className={`lawyer-list-item ${index === 0 ? 'closest-item' : ''} ${isSelectedTarget ? 'active-target-item' : ''}`}
                  onClick={() => handleSelectLawyer(lawyer, true)}
                >
                  {/* Lawyer Avatar + Online Status */}
                  <div className="list-avatar-box">
                    <img
                      src={lawyer.avatar}
                      alt={lawyer.name}
                      className="list-avatar-img"
                    />
                    <span
                      className={
                        lawyer.isOnline ? 'list-status-green' : 'list-status-red'
                      }
                    ></span>
                  </div>

                  {/* Info Center */}
                  <div className="list-info-box">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <div className="flex items-center gap-1.5">
                        <h5 className="list-name">{lawyer.name}</h5>
                      </div>
                      <div className="list-rating">
                        <Star size={11} className="fill-amber-400 text-amber-400" />
                        <span>{lawyer.rating}</span>
                      </div>
                    </div>

                    <p className="list-spec">{lawyer.specialty}</p>

                    <div className="list-meta-row">
                      <span className="list-dist">
                        {lawyer.formattedDistanceKm || lawyer.distanceKm} كم
                      </span>
                      <span className="meta-sep">•</span>
                      <span className="list-exp">
                        {lawyer.formattedDurationMins
                          ? `${lawyer.formattedDurationMins} د بالسيارة`
                          : `${lawyer.experienceYears} سنوات خبرة`}
                      </span>
                      <span className="meta-sep">•</span>
                      <span className={lawyer.isOnline ? 'text-emerald-600 font-semibold' : 'text-slate-400'}>
                        {lawyer.isOnline ? 'متاح الآن' : 'غير متصل'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Lawyer Full Profile Bottom Sheet Modal (Handles PROFILE -> WAITING_ACCEPTANCE -> LAWYER_DECISION -> EVALUATING_PRICE -> PRICE_READY) */}
      {selectedLawyer && dispatchStage === DISPATCH_STAGES.BROWSE && (
        <LawyerProfileModal
          lawyer={selectedLawyer}
          cardStage={cardStage}
          evaluatedPrice={evaluatedPrice}
          lawyerDecisionStatus={lawyerDecisionStatus}
          lawyerDecisionCountdown={lawyerDecisionCountdown}
          hasAlternativeLawyer={hasAlternativeLawyer}
          onClose={closeLawyerModal}
          onStepBack={stepBackInFlow}
          onStartPriceEvaluation={startPriceEvaluation}
          onSelectAlternativeLawyer={handleSelectAlternativeLawyer}
          onProceedToPayment={proceedToPayment}
        />
      )}

      {/* Payment & Confirmation Screen Overlay */}
      {dispatchStage === DISPATCH_STAGES.PAYMENT && bookedLawyer && (
        <LawyerNowPaymentOverlay
          bookedLawyer={bookedLawyer}
          evaluatedPrice={evaluatedPrice}
          selectedPaymentMethod={selectedPaymentMethod}
          paymentStatus={paymentStatus}
          paymentError={paymentError}
          paymentReceipt={paymentReceipt}
          confirmationCountdown={confirmationCountdown}
          onSelectPaymentMethod={setSelectedPaymentMethod}
          onBack={backFromPayment}
          onConfirmPayment={confirmPayment}
          onContinueAfterConfirmation={proceedFromConfirmedPayment}
        />
      )}
    </div>
  );
}
