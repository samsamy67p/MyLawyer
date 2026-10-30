import React, { useRef, useEffect, useCallback } from 'react';
import { PhoneCall, UserCheck, Clock, MapPin, ChevronLeft, ShieldCheck } from 'lucide-react';
import Header from '../../components/layout/Header';
import BottomNav from '../../components/layout/BottomNav';
import ServiceRow from '../../components/common/ServiceRow';
import judgeIllustration from '../../assets/illustrations/undraw_judge_hyqv.svg';
import globalTeamBannerSvg from '../../assets/illustrations/undraw_global-team_8jok.svg';
import signedDocumentSvg from '../../assets/illustrations/undraw_signed-document_y8vk.svg';
import './HomeScreen.css';

const SERVICES = [
  {
    id: 'mo7amek-now',
    title: 'محاميك حالاً',
    desc: 'ابحث عن أقرب محامي معتمد حولك واطلبه فوراً',
    imageSrc: judgeIllustration,
    isHighlighted: true,
    actionText: 'استكشف',
  },
  {
    id: 'instant-call',
    title: 'استشارة هاتفية سريعة',
    desc: 'مكالمة مع محامي مختص فوراً',
    icon: PhoneCall,
    actionText: 'طلب',
  },
  {
    id: 'contract-review',
    title: 'مراجعة وصياغة عقد',
    desc: 'نكتب ونصيغ أو نراجع عقدك ونرسله لك جاهزاً',
    imageSrc: signedDocumentSvg,
    actionText: 'طلب',
  },
  {
    id: 'session-attend',
    title: 'حضور جلسة أو تحقيق',
    desc: 'انتداب محامي لحضور الإجراءات الرسمية',
    icon: UserCheck,
    actionText: 'طلب',
  },
  {
    id: 'case-tracking',
    title: 'متابعة دعوى قضائية',
    desc: 'تتبع فوري لكافة الجلسات والقرارات',
    icon: Clock,
    actionText: 'طلب',
  },
];

export default function HomeScreen({
  userLocation,
  onChangeLocation,
  onOpenLiveMap,
  activeNavTab = 'home',
  onNavTabChange,
}) {
  const bannersViewportRef = useRef(null);
  const activeIndexRef = useRef(0);
  const isInteractingRef = useRef(false);

  const handleBannerScroll = useCallback(() => {
    const viewportEl = bannersViewportRef.current;
    if (!viewportEl || !viewportEl.children.length) return;
    const viewportLeft = viewportEl.getBoundingClientRect().left;
    let closestIdx = 0;
    let minDiff = Infinity;
    for (let i = 0; i < viewportEl.children.length; i += 1) {
      const diff = Math.abs(
        viewportEl.children[i].getBoundingClientRect().left - viewportLeft
      );
      if (diff < minDiff) {
        minDiff = diff;
        closestIdx = i;
      }
    }
    activeIndexRef.current = closestIdx;
  }, []);

  // Auto-slide promotional banners every 5 seconds when user is not manually scrolling
  useEffect(() => {
    const timer = setInterval(() => {
      if (isInteractingRef.current) return;
      const viewportEl = bannersViewportRef.current;
      if (!viewportEl || viewportEl.children.length < 2) return;
      const nextIdx = (activeIndexRef.current + 1) % viewportEl.children.length;
      const targetEl = viewportEl.children[nextIdx];
      if (targetEl) {
        const deltaLeft =
          targetEl.getBoundingClientRect().left -
          viewportEl.getBoundingClientRect().left;
        viewportEl.scrollBy({ left: deltaLeft, behavior: 'smooth' });
        activeIndexRef.current = nextIdx;
      }
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="home-screen-layout">
      {/* Top Header */}
      <Header
        onSearchClick={() => {}}
        onNotificationClick={() => {}}
      />

      <main className="home-main-content">
        {/* Promotional Banners Section (3 Services - Horizontal Sliding & Manual Scroll) */}
        <section className="home-banners-section" aria-label="عروض وخدمات مميزة">
          <div
            ref={bannersViewportRef}
            className="home-banners-viewport"
            onScroll={handleBannerScroll}
            onTouchStart={() => {
              isInteractingRef.current = true;
            }}
            onTouchEnd={() => {
              isInteractingRef.current = false;
            }}
            onTouchCancel={() => {
              isInteractingRef.current = false;
            }}
            onMouseDown={() => {
              isInteractingRef.current = true;
            }}
            onMouseUp={() => {
              isInteractingRef.current = false;
            }}
            onMouseLeave={() => {
              isInteractingRef.current = false;
            }}
          >
            {/* Banner 1: محاميك حالاً */}
            <div
              className="home-promo-banner"
              onClick={onOpenLiveMap}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onOpenLiveMap?.();
                }
              }}
            >
              <div className="promo-banner-content">
                <h3 className="promo-banner-title">محاميك حالاً جنبك</h3>
                <p className="promo-banner-desc">
                  أقرب محامي معتمد على الخريطة يوصلك فوراً لإنجاز مشوارك القانوني
                </p>
                <span className="promo-banner-cta">
                  <span>اطلب محاميك الآن</span>
                  <ChevronLeft size={15} />
                </span>
              </div>
              <div className="promo-banner-art">
                <img
                  src={globalTeamBannerSvg}
                  alt="محاميك حالاً"
                  className="promo-banner-img"
                />
              </div>
            </div>

            {/* Banner 2: الميثاق القانوني (تأمين قانوني لمدة عام - عداد 365 يوم برمجي بستايل unDraw) */}
            <div
              className="home-promo-banner banner-charter"
              role="button"
              tabIndex={0}
            >
              <div className="promo-banner-content">
                <h3 className="promo-banner-title">الميثاق القانوني</h3>
                <p className="promo-banner-desc">
                  تأمين وحماية قانونية شاملة لك ولأسرتك طوال العام بدون قلق
                </p>
                <span className="promo-banner-cta">
                  <span>اشترك في الميثاق</span>
                  <ChevronLeft size={15} />
                </span>
              </div>
              <div className="promo-banner-art">
                {/* Programmatic 365 Days Counter in exact unDraw flat vector aesthetic */}
                <div className="undraw-counter-graphic" aria-hidden="true">
                  <div className="undraw-counter-blob"></div>
                  <div className="undraw-counter-card">
                    <div className="undraw-counter-top-dots">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                    <div className="undraw-counter-ring">
                      <span className="undraw-counter-num">365</span>
                      <span className="undraw-counter-unit">يوم حماية</span>
                    </div>
                    <div className="undraw-counter-shield">
                      <ShieldCheck size={14} strokeWidth={2.5} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Banner 3: صياغة وكتابة ومراجعة العقود */}
            <div
              className="home-promo-banner banner-contracts"
              role="button"
              tabIndex={0}
            >
              <div className="promo-banner-content">
                <h3 className="promo-banner-title">صياغة ومراجعة العقود</h3>
                <p className="promo-banner-desc">
                  نكتب ونصيغ عقدك من الصفر أو نراجعه بدقة ونبعتهولك جاهز ومضمون
                </p>
                <span className="promo-banner-cta">
                  <span>اطلب عقدك الآن</span>
                  <ChevronLeft size={15} />
                </span>
              </div>
              <div className="promo-banner-art">
                <img
                  src={signedDocumentSvg}
                  alt="صياغة ومراجعة العقود"
                  className="promo-banner-img"
                />
              </div>
            </div>
          </div>
        </section>

        {/* User Current Location Indicator Bar (Below Banner Container) */}
        {userLocation && (
          <div className="location-pill-bar" onClick={onChangeLocation}>
            <div className="location-pill-info">
              <MapPin size={14} className="text-[#1D4ED8] shrink-0" />
              <span className="location-pill-text">{userLocation.address || 'موقعك الحالي'}</span>
            </div>
            <button type="button" className="location-change-link">تغيير</button>
          </div>
        )}

        <section className="home-intro-section">
          <h2>خدمات فورية</h2>
          <p>اختر الخدمة وتواصل مع محامي متاح الآن</p>
        </section>

        <section className="services-container-list">
          {SERVICES.map((service) => (
            <ServiceRow
              key={service.id}
              icon={service.icon}
              imageSrc={service.imageSrc}
              title={service.title}
              desc={service.desc}
              isHighlighted={service.isHighlighted}
              onAction={() => {
                if (service.id === 'mo7amek-now') {
                  onOpenLiveMap?.();
                }
              }}
            />
          ))}
        </section>
      </main>

      {/* Bottom Navigation Header/Bar */}
      <BottomNav
        activeTab={activeNavTab}
        onTabChange={(tabId, route) => {
          onNavTabChange?.(tabId, route);
        }}
      />
    </div>
  );
}
