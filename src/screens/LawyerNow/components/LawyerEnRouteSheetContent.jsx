import React from 'react';
import { Clock, Navigation, Star, Phone, MessageSquare, CheckCircle2, ArrowRight, RotateCcw } from 'lucide-react';

/**
 * Final En-Route Tracking & Direct Actions Content ("تم طلب المحامي وهو في الطريق إليك الآن").
 * Rendered inside the bottom sheet once payment is confirmed and the lawyer accepts the request.
 */
export default function LawyerEnRouteSheetContent({
  bookedLawyer,
  routeInfo,
  onNavigateToOrders,
  onStartNewRequest,
}) {
  if (!bookedLawyer) return null;

  const etaMins =
    routeInfo?.formattedDurationMins ||
    routeInfo?.durationMins ||
    bookedLawyer.formattedDurationMins ||
    '12';

  const distanceKm =
    routeInfo?.formattedDistanceKm ||
    routeInfo?.distanceKm ||
    bookedLawyer.formattedDistanceKm ||
    bookedLawyer.distanceKm;

  return (
    <div className="en-route-card-content">
      {/* Estimated Arrival Time & Road Distance */}
      <div className="en-route-eta-box">
        <div className="en-route-eta-item">
          <Clock size={18} className="text-[#1D4ED8] shrink-0" />
          <div className="en-route-eta-texts">
            <span className="en-route-eta-label">الوقت المقدر للوصول</span>
            <strong className="en-route-eta-val">{etaMins} دقيقة</strong>
          </div>
        </div>
        <div className="en-route-eta-divider"></div>
        <div className="en-route-eta-item">
          <Navigation size={17} className="text-[#1D4ED8] shrink-0" />
          <div className="en-route-eta-texts">
            <span className="en-route-eta-label">المسافة الفعلية</span>
            <strong className="en-route-eta-val">{distanceKm} كم</strong>
          </div>
        </div>
      </div>

      {/* Booked Lawyer Summary Row */}
      <div className="en-route-lawyer-row">
        <div className="list-avatar-box">
          <img
            src={bookedLawyer.avatar}
            alt={bookedLawyer.name}
            className="list-avatar-img"
          />
          <span className="list-status-green"></span>
        </div>
        <div className="list-info-box">
          <div className="flex items-center justify-between gap-1 mb-0.5">
            <h5 className="list-name">{bookedLawyer.name}</h5>
            <div className="list-rating">
              <Star size={11} className="fill-amber-400 text-amber-400" />
              <span>{bookedLawyer.rating}</span>
            </div>
          </div>
          <p className="list-spec">{bookedLawyer.specialty}</p>
          <span className="en-route-degree-text">{bookedLawyer.degree}</span>
        </div>
      </div>

      {/* Action Buttons: Call & Chat */}
      <div className="en-route-actions-row">
        <a
          href={`tel:${bookedLawyer.phone || '01000000000'}`}
          className="en-route-action-btn action-call-btn"
        >
          <Phone size={17} />
          <span>اتصال بالمحامي</span>
        </a>
        <button
          type="button"
          className="en-route-action-btn action-chat-btn"
          onClick={() => alert(`بدء محادثة فورية مع ${bookedLawyer.name}`)}
        >
          <MessageSquare size={17} />
          <span>محادثة فورية</span>
        </button>
      </div>

      {/* Success Notification Text & Action Buttons ("طلباتي" و "عملية أخرى") */}
      <div className="en-route-success-footer">
        <div className="en-route-success-message">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
          <p className="en-route-success-text">
            تمت العملية بنجاح! يمكنك إيجاد الطلب والتواصل مع المحامي ومتابعة حالة طلبك في أي وقت من خلال صفحة الطلبات.
          </p>
        </div>

        <div className="en-route-footer-actions-grid">
          <button
            type="button"
            className="en-route-footer-btn en-route-orders-btn"
            onClick={() => {
              if (onNavigateToOrders) {
                onNavigateToOrders();
              } else {
                alert('التوجه إلى صفحة طلباتي');
              }
            }}
          >
            <span>التوجه إلى طلباتي</span>
            <ArrowRight size={15} className="rotate-180 shrink-0" />
          </button>

          <button
            type="button"
            className="en-route-footer-btn en-route-new-op-btn"
            onClick={() => {
              if (onStartNewRequest) {
                onStartNewRequest();
              } else {
                window.location.reload();
              }
            }}
          >
            <RotateCcw size={15} className="shrink-0" />
            <span>عملية أخرى</span>
          </button>
        </div>
      </div>
    </div>
  );
}
