import React from 'react';
import { Navigation, AlertCircle, Loader2 } from 'lucide-react';

/**
 * Shared floating navigation status badge used on both `LawyerNowScreen` and `MapScreen`.
 * Preserves the exact styling class and text format of each screen.
 */
export default function RouteStatusBadge({
  routeStatus,
  routeInfo,
  routeErrorMsg,
  badgeClassName = 'lawyer-now-route-badge',
  showLawyerName = true,
  durationSuffix = 'دقيقة وصول',
}) {
  if (routeStatus === 'LOADING') {
    return (
      <div className={badgeClassName}>
        <Loader2 size={14} className="text-[#1D4ED8] animate-spin" />
        <span className="route-time-text">جاري حساب المسار البري الفعلي...</span>
      </div>
    );
  }

  if (routeStatus === 'OK' && routeInfo) {
    return (
      <div className={badgeClassName}>
        <Navigation size={14} className="text-[#1D4ED8]" />
        {showLawyerName && routeInfo.lawyerName && (
          <span className="route-lawyer-tag">{routeInfo.lawyerName}:</span>
        )}
        <span className="route-dist-text">
          {routeInfo.formattedDistanceKm} كم
        </span>
        <span className="route-dot-sep">•</span>
        <span className="route-time-text">
          {routeInfo.formattedDurationMins} {durationSuffix}
        </span>
      </div>
    );
  }

  if (routeStatus === 'ERROR') {
    return (
      <div className={`${badgeClassName} border-amber-300 bg-amber-50/95`}>
        <AlertCircle size={14} className="text-amber-600" />
        <span className="route-time-text text-amber-800">{routeErrorMsg}</span>
      </div>
    );
  }

  return null;
}

