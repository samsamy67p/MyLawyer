import React from 'react';
import {
  PhoneCall,
  Clock,
  ChevronLeft,
  ShieldCheck,
  Wallet,
  Star,
} from 'lucide-react';
import ServiceRow from '../../../components/common/ServiceRow';

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
      {/* كارت المحامي الثابت المنظم بدلاً من البنرات الترويجية */}
      <section className="home-banners-section" aria-label="كارت المحامي التعريفي">
        <div
          className="home-promo-banner !cursor-pointer hover:!border-blue-400 transition-all"
          onClick={() => onNavigateTab?.('account')}
          role="button"
          tabIndex={0}
        >
          <div className="flex items-center gap-3.5 w-full py-1">
            {/* صورة المحامي الدائرية مع مؤشر التوفر */}
            <div className="relative shrink-0">
              <img
                src={lawyerAvatar}
                alt={dualName}
                className="w-16 h-16 rounded-full object-cover border-2 border-[#1D4ED8] shadow-sm"
              />
              <span
                className={`absolute bottom-0 left-0 w-3.5 h-3.5 rounded-full border-2 border-white ${
                  isAvailable
                    ? 'bg-emerald-500 ring-2 ring-emerald-100 animate-pulse'
                    : 'bg-slate-400'
                }`}
              />
            </div>

            {/* الاسم الثنائي والبيانات المهنية المنظمة */}
            <div className="flex-1 min-w-0 flex flex-col justify-center text-right">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug m-0">
                  {dualName}
                </h3>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#1D4ED8] bg-blue-50 px-2 py-0.5 rounded-[5px] border border-blue-100">
                  <ShieldCheck size={12} />
                  <span>معتمد بالنقابة</span>
                </span>
              </div>

              <p className="text-xs text-slate-600 mt-1 line-clamp-1">
                {user?.degree || 'محامٍ بالاستئناف العالي ومجلس الدولة'}
              </p>

              <div className="flex items-center gap-2 mt-1.5 text-[11px] font-medium text-slate-500 flex-wrap">
                <span>رقم القيد: {user?.syndicateNumber || '482910'}</span>
                <span>•</span>
                <span
                  className={
                    isAvailable
                      ? 'text-emerald-700 font-bold'
                      : 'text-slate-500 font-medium'
                  }
                >
                  {isAvailable ? 'متصل وجاهز للطلبات' : 'غير متصل حالياً'}
                </span>
              </div>
            </div>

            {/* سهم التنقل لصفحة الحساب */}
            <div className="shrink-0 text-slate-400 pl-1">
              <ChevronLeft size={20} />
            </div>
          </div>
        </div>
      </section>

      {/* شريط حالة الاستعداد الميداني وتغيير التوفر */}
      <div className="location-pill-bar" onClick={onToggleAvailability}>
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

      {/* قسم المؤشرات والأداء القانوني */}
      <section className="home-intro-section">
        <h2>مؤشرات الأداء والطلبات</h2>
        <p>إدارة طلبات الموكلين والمحفظة والتقييم الميداني</p>
      </section>

      {/* قائمة الخدمات والإحصائيات */}
      <section className="services-container-list">
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
