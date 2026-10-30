import React from 'react';
import { Loader2, CheckCircle, Star } from 'lucide-react';
import { InAppBrowser } from '@capgo/capacitor-inappbrowser';
import { isSafeUrl } from '../../lib/security';

const DEFAULT_MAPS_LINK =
  'https://www.google.com/maps/place/Karim+El+Deeb+Law+firm/@27.8524719,38.9149491,7z/data=!4m10!1m2!2m1!1z2YPYsdmK2YUg2KfZhNiv2YrYqCDYp9mE2YXYrdin2YXZig!3m6!1s0x14533b795f408809:0xe1a6736b3b31231d!8m2!3d27.8524719!4d34.3006913!15sCiLZg9ix2YrZhSDYp9mE2K_ZitioINin2YTZhdit2KfZhdmKWiQiItmD2LHZitmFINin2YTYr9mK2Kgg2KfZhNmF2K3Yp9mF2YqSAQZsYXd5ZXKaAURDaTlEUVVsUlFVTnZaRU5vZEhsalJqbHZUMnRhVTFac1NuTlpiVlY0Vm10U2VFNXROWEZOVm1oMVUyNVNlbUZXUlJBQuABAPoBBAgAEC4!16s%2Fg%2F11zk2rfm_s?entry=ttu&g_ep=EgoyMDI2MTAyNy4wIKXMDSoASAFQAw%3D%3D';

export function EvaluatingPriceStage({ lawyer }) {
  return (
    <div className="modal-stage-center stage-fade-in">
      <Loader2 size={28} className="text-[#1D4ED8] animate-spin mb-3" />
      <h4 className="modal-stage-title">جاري تقييم سعر طلبك الآن...</h4>
      <p className="modal-stage-sub">
        بنحسب التكلفة بناءً على نوع المشوار والمسافة الفعلية للمحامي {lawyer.name}
      </p>
    </div>
  );
}

export function PriceReadyStage({ lawyer, evaluatedPrice }) {
  return (
    <div className="modal-price-ready-box stage-fade-in">
      <div className="modal-mini-lawyer-bar">
        <img src={lawyer.avatar} alt={lawyer.name} className="modal-mini-avatar" />
        <div className="modal-mini-info">
          <h4>{lawyer.name}</h4>
          <p>
            وافق المحامي على طلبك • يبعد {lawyer.formattedDistanceKm || lawyer.distanceKm} كم • يصل خلال ~
            {lawyer.formattedDurationMins || '12'} د
          </p>
        </div>
      </div>

      <div className="modal-evaluated-price-card">
        <span className="evaluated-price-label">سعر الخدمة المقدر لطلبك</span>
        <div className="evaluated-price-value">
          <strong>{evaluatedPrice}</strong>
          <span>ج.م</span>
        </div>
        <p className="evaluated-price-note">
          شامل الانتقال الفوري وإنجاز الإجراء القانوني بالكامل
        </p>
      </div>
    </div>
  );
}

export function WaitingAcceptanceStage({ lawyer }) {
  return (
    <div className="modal-waiting-stage stage-fade-in">
      <div className="waiting-lawyer-identity">
        <div className="waiting-lawyer-avatar-wrap">
          <img
            src={lawyer.avatar}
            alt={lawyer.name}
            className="waiting-lawyer-avatar"
          />
          <span className="waiting-pulse-ring"></span>
        </div>
        <span className="waiting-lawyer-name">{lawyer.name}</span>
      </div>

      <div className="waiting-stage-texts">
        <div className="waiting-title-row">
          <Loader2 size={18} className="text-[#1D4ED8] animate-spin shrink-0" />
          <h4 className="modal-stage-title m-0">في انتظار قبول المحامي لطلبك...</h4>
        </div>
        <p className="modal-stage-sub">
          تم إرسال تفاصيل طلبك للمحامي وبانتظار موافقته قبل إتمام الدفع
        </p>
      </div>
    </div>
  );
}

export function LawyerDecisionStage({
  lawyer,
  lawyerDecisionStatus,
  lawyerDecisionCountdown,
}) {
  return (
    <div className="modal-decision-stage stage-fade-in">
      <div className="decision-avatar-container">
        <img
          src={lawyer.avatar}
          alt={lawyer.name}
          className={`decision-lawyer-avatar-hero ${
            lawyerDecisionStatus === 'ACCEPTED'
              ? 'border-emerald-500'
              : 'border-rose-500'
          }`}
        />
      </div>

      <h4 className="decision-lawyer-name-center">{lawyer.name}</h4>

      {lawyerDecisionStatus === 'ACCEPTED' ? (
        <span className="decision-direct-text-green">تم القبول</span>
      ) : (
        <span className="decision-direct-text-red">اعتذر عن الطلب</span>
      )}

      <div className="decision-texts-box">
        <h3
          className={`decision-headline ${
            lawyerDecisionStatus === 'ACCEPTED'
              ? 'text-emerald-700'
              : 'text-rose-700'
          }`}
        >
          {lawyerDecisionStatus === 'ACCEPTED'
            ? 'وافق المحامي على طلبك'
            : 'اعتذر المحامي عن استلام الطلب'}
        </h3>
        <p className="decision-subtext">
          {lawyerDecisionStatus === 'ACCEPTED'
            ? 'المحامي جاهز لتنفيذ طلبك، وسيتم الانتقال لتقييم السعر فوراً'
            : 'يمكنك اختيار محامي اخر متاح بجوارك لإنجاز طلبك الآن'}
        </p>
      </div>

      <div className="decision-countdown-pill">
        <span>سيتم المتابعة تلقائياً خلال</span>
        <strong className="decision-countdown-number">
          {lawyerDecisionCountdown}
        </strong>
        <span>ثوانٍ...</span>
      </div>
    </div>
  );
}

export function LawyerProfileDetails({ lawyer }) {
  const handleOpenMaps = async () => {
    const targetUrl = isSafeUrl(lawyer.mapsUrl) ? lawyer.mapsUrl : DEFAULT_MAPS_LINK;
    try {
      let pageListener = null;
      pageListener = await InAppBrowser.addListener(
        'browserPageLoaded',
        async () => {
          const autoDismissScript = `
            (function() {
              function clickWebButton() {
                const elements = Array.from(document.querySelectorAll('button, a, div, span'));
                for (const el of elements) {
                  const txt = (el.innerText || el.textContent || '').trim();
                  if (
                    txt === 'الاستمرار على الويب' ||
                    txt === 'الاستمرار عبر الويب' ||
                    txt === 'Stay on web' ||
                    txt === 'Continue on web'
                  ) {
                    el.click();
                    return true;
                  }
                }
                return false;
              }

              if (!clickWebButton()) {
                let attempts = 0;
                const interval = setInterval(function() {
                  attempts++;
                  if (clickWebButton() || attempts > 15) {
                    clearInterval(interval);
                  }
                }, 200);
              }
            })();
          `;

          try {
            await InAppBrowser.executeScript({ code: autoDismissScript });
          } catch (e) {
            console.warn('Auto dismiss script error:', e);
          }
        }
      );

      let closeListener = null;
      closeListener = await InAppBrowser.addListener('closeEvent', () => {
        if (pageListener?.remove) pageListener.remove();
        if (closeListener?.remove) closeListener.remove();
      });

      await InAppBrowser.openWebView({
        url: targetUrl,
        title: lawyer.name ? `مكتب ${lawyer.name}` : 'موقع ومراجعات المكتب',
        toolbarColor: '#1D4ED8',
        toolbarType: 'blank',
        showToolbar: true,
        preventDeeplink: true,
        isPresentAfterPageLoad: false,
      });
    } catch {
      window.open(targetUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <>
      {/* Lawyer Hero Info */}
      <div className="lawyer-profile-hero">
        <div className="lawyer-hero-top-row">
          <div className="lawyer-avatar-box">
            <img
              src={lawyer.avatar}
              alt={lawyer.name}
              className="lawyer-avatar-img"
            />
            <span
              className={
                lawyer.isOnline ? 'online-badge-dot' : 'offline-badge-dot'
              }
            ></span>
          </div>

          <div className="lawyer-titles">
            <div className="flex items-center gap-1.5 justify-start flex-wrap">
              <h3 className="lawyer-name">{lawyer.name}</h3>
              <CheckCircle size={16} className="text-[#1D4ED8] shrink-0" />
            </div>
            <p className="lawyer-spec">{lawyer.specialty}</p>
            <span className="lawyer-degree-tag">{lawyer.degree}</span>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="lawyer-stats-strip">
          <div className="stat-cell">
            <div className="stat-rating">
              <Star size={14} className="fill-amber-400 text-amber-400" />
              <span className="stat-val">{lawyer.rating}</span>
            </div>
            <span className="stat-lbl">({lawyer.reviewsCount} تقييم)</span>
          </div>

          <div className="stat-divider"></div>

          <div className="stat-cell">
            <span className="stat-val">{lawyer.experienceYears} سنوات</span>
            <span className="stat-lbl">الخبرة المهنية</span>
          </div>

          <div className="stat-divider"></div>

          <div className="stat-cell">
            <span className="stat-val text-[#1D4ED8]">
              {lawyer.formattedDistanceKm || lawyer.distanceKm} كم
            </span>
            <span className="stat-lbl">
              {lawyer.formattedDurationMins
                ? `~${lawyer.formattedDurationMins} د وصول`
                : 'يبعد عنك'}
            </span>
          </div>
        </div>
      </div>

      {/* Bio & Details */}
      <div className="lawyer-details-body">
        <div className="detail-section">
          <h5 className="detail-heading">نبذة مهنية</h5>
          <p className="detail-text">{lawyer.bio}</p>
        </div>

        <div className="detail-section">
          <h5 className="detail-heading">مجالات الاختصاص</h5>
          <div className="spec-tags-flow">
            {lawyer.tags?.map((tag, idx) => (
              <span key={idx} className="spec-tag-item">
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Google Maps Profile Action Button */}
        <div className="detail-section">
          <button
            type="button"
            className="lawyer-gmaps-btn"
            onClick={handleOpenMaps}
          >
            <svg
              className="google-icon-svg"
              viewBox="0 0 24 24"
              width="18"
              height="18"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.14-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.04 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
            <span>عرض موقع ومراجعات المكتب على خرائط Google</span>
          </button>
        </div>
      </div>
    </>
  );
}

