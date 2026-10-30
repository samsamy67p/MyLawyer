import React, { useRef, useEffect, useCallback } from 'react';
import {
  PhoneCall,
  Clock,
  ChevronLeft,
  ShieldCheck,
  Wallet,
} from 'lucide-react';
import ServiceRow from '../../../components/common/ServiceRow';

import judgeIllustration from '../../../assets/illustrations/undraw_judge_hyqv.svg';
import globalTeamBannerSvg from '../../../assets/illustrations/undraw_global-team_8jok.svg';
import signedDocumentSvg from '../../../assets/illustrations/undraw_signed-document_y8vk.svg';

export default function LawyerHomeTab({
  user,
  availableBalance,
  isAvailable,
  onToggleAvailability,
  onNavigateTab,
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
    <main className="home-main-content">
      {/* Promotional Banners Section (Matching Client Layout 1:1) */}
      <section className="home-banners-section" aria-label="عروض وخدمات المحامي">
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
          onMouseDown={() => {
            isInteractingRef.current = true;
          }}
          onMouseUp={() => {
            isInteractingRef.current = false;
          }}
        >
          {/* Banner 1: استقبال طلبات محاميك حالاً */}
          <div
            className="home-promo-banner"
            onClick={() => onNavigateTab?.('orders')}
            role="button"
            tabIndex={0}
          >
            <div className="promo-banner-content">
              <h3 className="promo-banner-title">طلبات محاميك حالاً</h3>
              <p className="promo-banner-desc">
                أنت متصل وجاهز لتلقي طلبات الموكلين حولك في نطاق 5 كم فوراً
              </p>
              <span className="promo-banner-cta">
                <span>عرض الطلبات الواردة</span>
                <ChevronLeft size={15} />
              </span>
            </div>
            <div className="promo-banner-art">
              <img
                src={globalTeamBannerSvg}
                alt="محاميك حالاً للمحامي"
                className="promo-banner-img"
              />
            </div>
          </div>

          {/* Banner 2: رصيد الأتعاب والمحفظة */}
          <div
            className="home-promo-banner banner-charter"
            onClick={() => onNavigateTab?.('wallet')}
            role="button"
            tabIndex={0}
          >
            <div className="promo-banner-content">
              <h3 className="promo-banner-title">محفظة الأتعاب القانونية</h3>
              <p className="promo-banner-desc">
                أتعابك المتاحة: {availableBalance.toLocaleString()} ج.م، جاهزة للتحويل اللحظي
              </p>
              <span className="promo-banner-cta">
                <span>سحب الأرباح الآن</span>
                <ChevronLeft size={15} />
              </span>
            </div>
            <div className="promo-banner-art">
              <div className="undraw-counter-graphic" aria-hidden="true">
                <div className="undraw-counter-blob"></div>
                <div className="undraw-counter-card">
                  <div className="undraw-counter-top-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                  <div className="undraw-counter-ring">
                    <span className="undraw-counter-num">{availableBalance}</span>
                    <span className="undraw-counter-unit">ج.م متاح</span>
                  </div>
                  <div className="undraw-counter-shield">
                    <ShieldCheck size={14} strokeWidth={2.5} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Banner 3: الاعتماد المهني والنقابي */}
          <div
            className="home-promo-banner banner-contracts"
            onClick={() => onNavigateTab?.('account')}
            role="button"
            tabIndex={0}
          >
            <div className="promo-banner-content">
              <h3 className="promo-banner-title">الاعتماد المهني بالنقابة</h3>
              <p className="promo-banner-desc">
                رقم القيد: 482910 • الدرجة: استئناف عالي ومجلس الدولة
              </p>
              <span className="promo-banner-cta">
                <span>معاينة بيانات القيد</span>
                <ChevronLeft size={15} />
              </span>
            </div>
            <div className="promo-banner-art">
              <img
                src={signedDocumentSvg}
                alt="الاعتماد النقابي"
                className="promo-banner-img"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Field Status & Availability Bar (Identical to Client location-pill-bar) */}
      <div
        className="location-pill-bar"
        onClick={onToggleAvailability}
      >
        <div className="location-pill-info">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              isAvailable ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
            }`}
          />
          <span className="location-pill-text">
            {isAvailable
              ? 'حالة الاستعداد الميداني: متصل الآن وتستقبل طلبات الموكلين'
              : 'حالة الاستعداد الميداني: غير متاح حالياً لاستقبال الطلبات'}
          </span>
        </div>
        <button type="button" className="location-change-link">
          {isAvailable ? 'إيقاف' : 'تفعيل'}
        </button>
      </div>

      {/* Intro Section (Identical to Client home-intro-section) */}
      <section className="home-intro-section">
        <h2>كارت المحامي والإحصائيات</h2>
        <p>بياناتك المعتمدة ومؤشرات الأداء القانوني الميداني</p>
      </section>

      {/* Services List using ServiceRow (Identical to Client) */}
      <section className="services-container-list">
        <ServiceRow
          imageSrc={judgeIllustration}
          title={user?.fullName || 'المستشار / أحمد فهمي'}
          desc="محامٍ معتمد بالنقابة • استئناف عالي ومجلس الدولة • قيد: 482910"
          isHighlighted={true}
          onAction={() => onNavigateTab?.('account')}
        />

        <ServiceRow
          icon={Wallet}
          title={`${availableBalance.toLocaleString()} ج.م — رصيد أتعابك المتاح`}
          desc="سحب أرباحك فوراً عبر إنستاباي أو الحساب البنكي أو المحفظة"
          isHighlighted={false}
          onAction={() => onNavigateTab?.('wallet')}
        />

        <ServiceRow
          icon={Clock}
          title="الطلبات الواردة (يوجد طلب مباشر جديد)"
          desc="طلب محاميك حالاً: قسم شرطة الدقي — 350 ج.م"
          isHighlighted={false}
          onAction={() => onNavigateTab?.('orders')}
        />

        <ServiceRow
          icon={ShieldCheck}
          title="تقييم الموكلين: 4.95 ⭐ (ممتاز)"
          desc="إجمالي 34 طلباً منجزاً • متوسط سرعة الاستجابة 4 دقائق"
          isHighlighted={false}
          onAction={() => onNavigateTab?.('account')}
        />

        <ServiceRow
          icon={PhoneCall}
          title="استشارات هاتفية عاجلة"
          desc="جاهزية استقبال مكالمات الاستشارة القانونية الصوتية"
          isHighlighted={false}
          onAction={() => onNavigateTab?.('orders')}
        />
      </section>
    </main>
  );
}
