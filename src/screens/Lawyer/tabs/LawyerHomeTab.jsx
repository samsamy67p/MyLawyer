import React from 'react';
import {
  PhoneCall,
  Clock,
  ShieldCheck,
  Wallet,
  Star,
  Scale,
} from 'lucide-react';
import ServiceRow from '../../../components/common/ServiceRow';
import Switch from '../../../components/ui/Switch';

const DEFAULT_LAWYER_AVATAR =
  'https://images.unsplash.com/photo-1556157382-97eda2d62296?auto=format&fit=crop&q=80&w=240';

/**
 * استخراج الاسم الثنائي للمحامي مع تنظيف الألقاب والرتب
 */
function getDualName(fullName) {
  if (!fullName || typeof fullName !== 'string') return 'أحمد فهمي';
  const clean = fullName
    .replace(/^(المستشار\s*(\/|-)?|الأستاذ\s*(\/|-)?|المحامي\s*(\/|-)?|د\.\s*|دكتور\s*(\/|-)?)\s*/gi, '')
    .trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]} ${parts[1]}`;
  }
  return clean || 'أحمد فهمي';
}

export default function LawyerHomeTab({
  user,
  availableBalance = 14850,
  isAvailable,
  onToggleAvailability,
  onNavigateTab,
}) {
  const dualName = getDualName(user?.fullName);
  const lawyerAvatar =
    user?.avatar ||
    user?.profilePhoto ||
    user?.profile_photo_path ||
    DEFAULT_LAWYER_AVATAR;

  return (
    <main className="home-main-content">
      {/* 1. كارت المحامي الثابت المنسق مع فراغات واضحة بين السطور وطول متناسق */}
      <section aria-label="كارت المحامي التعريفي">
        <div className="lawyer-hero-banner select-none">
          {/* صورة المحامي الدائرية الأنيقة */}
          <div className="shrink-0">
            <img
              src={lawyerAvatar}
              alt={dualName}
              className="w-18 h-18 sm:w-20 sm:h-20 rounded-full object-cover border-2 border-[#1D4ED8] shadow-sm"
            />
          </div>

          {/* تفاصيل المحامي المهنية مع فراغات مدروسة وموزعة بشكل مريح */}
          <div className="flex-1 min-w-0 flex flex-col justify-center text-right gap-2">
            {/* السطر الأول: الاسم الثنائي وشارة الاعتماد بدون حاوية ملونة */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug m-0">
                {dualName}
              </h3>
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#1D4ED8]">
                <ShieldCheck size={14} />
                <span>معتمد بالنقابة</span>
              </span>
            </div>

            {/* السطر الثاني: الدرجة القضائية مع تباعد سليم */}
            <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed m-0">
              {user?.degree || 'محامٍ بالاستئناف العالي ومجلس الدولة'}
            </p>

            {/* السطر الثالث: رقم القيد وسنوات الخبرة والمحافظة */}
            <div className="flex items-center gap-2 text-[11px] sm:text-xs text-slate-500 font-medium flex-wrap pt-0.5">
              <div className="flex items-center gap-1.5 text-slate-600">
                <Scale size={13} className="text-[#1D4ED8]" />
                <span>قيد: {user?.syndicateNumber || '482910'}</span>
              </div>
              <span>•</span>
              <span>خبرة 12 عاماً</span>
              <span>•</span>
              <span>الجيزة والقاهرة</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. بطاقة تفعيل وإيقاف التواجد الميداني الموسعة مع زر السويتش وبدون نقاط */}
      <section aria-label="حالة التواجد الميداني">
        <div className="lawyer-presence-card">
          <div className="flex flex-col gap-1 text-right min-w-0 flex-1 pl-3">
            <h4 className="text-sm sm:text-base font-bold text-slate-900 m-0 leading-snug">
              {isAvailable ? 'حالة التواجد: متصل الآن' : 'حالة التواجد: غير متاح'}
            </h4>
            <p className="text-xs text-slate-500 m-0 leading-relaxed mt-0.5">
              {isAvailable
                ? 'جاهز لاستقبال طلبات الموكلين المباشرة في نطاق موقعك وتلقي الإشعارات الفورية'
                : 'تم إيقاف استقبال الطلبات الميدانية مؤقتاً، يمكنك تفعيل التواجد في أي وقت'}
            </p>
          </div>

          <div className="shrink-0 flex items-center justify-center pr-1">
            <Switch
              id="lawyer-presence-toggle"
              checked={isAvailable}
              onChange={onToggleAvailability}
              ariaLabel="تفعيل أو إيقاف التواجد الميداني"
            />
          </div>
        </div>
      </section>

      {/* 3. قائمة الخدمات والإحصائيات */}
      <section className="services-container-list mt-1">
        <ServiceRow
          icon={Wallet}
          title={`${availableBalance.toLocaleString()} ج.م — رصيد أتعابك المتاح`}
          desc="سحب أرباحك فوراً عبر إنستاباي أو الحساب البنكي أو المحفظة"
          isHighlighted={true}
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
          icon={Star}
          title="تقييم الموكلين: 4.95 (ممتاز)"
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
