import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  PhoneCall,
  UserCheck,
  Clock,
  ChevronLeft,
  ShieldCheck,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  CheckCircle2,
  FileText,
  MapPin,
  Bell,
  Shield,
  HelpCircle,
  LogOut,
} from 'lucide-react';
import Header from '../../components/layout/Header';
import BottomNav from '../../components/layout/BottomNav';
import ServiceRow from '../../components/common/ServiceRow';
import { Button } from '../../components/ui/Button';

// Exact illustrations from Client Home
import judgeIllustration from '../../assets/illustrations/undraw_judge_hyqv.svg';
import globalTeamBannerSvg from '../../assets/illustrations/undraw_global-team_8jok.svg';
import signedDocumentSvg from '../../assets/illustrations/undraw_signed-document_y8vk.svg';

// Reusing the exact client stylesheets for 100% visual parity
import '../Home/HomeScreen.css';
import '../Orders/OrdersScreen.css';
import '../Wallet/WalletScreen.css';
import '../Account/AccountScreen.css';

export default function LawyerDashboardScreen({ user, onLogout }) {
  // Navigation tab: 'home' | 'orders' | 'wallet' | 'account'
  const [activeNavTab, setActiveNavTab] = useState('home');

  // Operational availability toggle
  const [isAvailable, setIsAvailable] = useState(true);

  // Orders State & Filtering (matching OrdersScreen)
  const [ordersFilter, setOrdersFilter] = useState('INCOMING'); // 'INCOMING' | 'ACTIVE' | 'COMPLETED'
  const [ordersList, setOrdersList] = useState([
    {
      id: 'ORD-8922',
      serviceTitle: 'محاميك حالاً: تحرير محضر إثبات حالة بقسم الشرطة',
      clientName: 'أ/ كمال محمود',
      specialty: 'قسم شرطة الدقي — 1.8 كم (6 دقائق)',
      status: 'INCOMING',
      statusLabel: 'طلب وارد مباشر',
      date: 'اليوم، منذ دقيقتين',
      price: 350,
      clientPhone: '01098765432',
    },
    {
      id: 'ORD-8921',
      serviceTitle: 'حضور تحقيق نيابة وحراسة قضائية',
      clientName: 'أ/ طارق عبد الرحمن',
      specialty: 'نيابة العجوزة الابتدائية',
      status: 'ACTIVE',
      statusLabel: 'جاري التنفيذ',
      date: 'اليوم، 1:30 م',
      price: 600,
      clientPhone: '01123456789',
    },
    {
      id: 'ORD-7612',
      serviceTitle: 'صياغة وتوثيق عقد إيجار مقهى تجاري',
      clientName: 'شركة النور للمقاولات',
      specialty: 'عقود وشركات تجارية',
      status: 'COMPLETED',
      statusLabel: 'مكتمل بنجاح',
      date: '28 أكتوبر 2026',
      price: 900,
      clientPhone: '01234567890',
    },
  ]);

  // Wallet State
  const [availableBalance, setAvailableBalance] = useState(1850);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [withdrawMethod, setWithdrawMethod] = useState('instapay');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawAccount, setWithdrawAccount] = useState('');
  const [withdrawSuccess, setWithdrawSuccess] = useState(false);

  // Banners Carousel Logic (Identical to HomeScreen.jsx)
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
    if (activeNavTab !== 'home') return;
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
  }, [activeNavTab]);

  // Order Actions
  const handleAcceptOrder = (orderId) => {
    setOrdersList((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? { ...o, status: 'ACTIVE', statusLabel: 'جاري التنفيذ' }
          : o
      )
    );
    setOrdersFilter('ACTIVE');
  };

  const handleRejectOrder = (orderId) => {
    setOrdersList((prev) => prev.filter((o) => o.id !== orderId));
  };

  const handleCompleteOrder = (orderId, amount) => {
    setOrdersList((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? { ...o, status: 'COMPLETED', statusLabel: 'مكتمل بنجاح' }
          : o
      )
    );
    setAvailableBalance((prev) => prev + amount);
    setOrdersFilter('COMPLETED');
  };

  // Withdraw Action
  const handleConfirmWithdraw = (e) => {
    e.preventDefault();
    const num = parseFloat(withdrawAmount);
    if (!num || num <= 0 || num > availableBalance) return;
    setAvailableBalance((prev) => prev - num);
    setWithdrawSuccess(true);
    setTimeout(() => {
      setWithdrawSuccess(false);
      setIsWithdrawOpen(false);
      setWithdrawAmount('');
      setWithdrawAccount('');
    }, 1800);
  };

  // Dynamic Header Title
  const getHeaderTitle = () => {
    switch (activeNavTab) {
      case 'orders':
        return 'الطلبات';
      case 'wallet':
        return 'المحفظة';
      case 'account':
        return 'الحساب';
      case 'home':
      default:
        return 'MyLawyer';
    }
  };

  return (
    <>
      {/* ========================================================================= */}
      {/* TAB 1: HOME (نسخة طبق الأصل من تصميم الموكل)                                */}
      {/* ========================================================================= */}
      {activeNavTab === 'home' && (
        <div className="home-screen-layout">
          <Header
            title={getHeaderTitle()}
            onSearchClick={() => {}}
            onNotificationClick={() => setActiveNavTab('orders')}
          />

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
                  onClick={() => setActiveNavTab('orders')}
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
                  onClick={() => setActiveNavTab('wallet')}
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
                  onClick={() => setActiveNavTab('account')}
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
              onClick={() => setIsAvailable(!isAvailable)}
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
                onAction={() => setActiveNavTab('account')}
              />

              <ServiceRow
                icon={Wallet}
                title={`${availableBalance.toLocaleString()} ج.م — رصيد أتعابك المتاح`}
                desc="سحب أرباحك فوراً عبر إنستاباي أو الحساب البنكي أو المحفظة"
                isHighlighted={false}
                onAction={() => setActiveNavTab('wallet')}
              />

              <ServiceRow
                icon={Clock}
                title="الطلبات الواردة (يوجد طلب مباشر جديد)"
                desc="طلب محاميك حالاً: قسم شرطة الدقي — 350 ج.م"
                isHighlighted={false}
                onAction={() => setActiveNavTab('orders')}
              />

              <ServiceRow
                icon={ShieldCheck}
                title="تقييم الموكلين: 4.95 ⭐ (ممتاز)"
                desc="إجمالي 34 طلباً منجزاً • متوسط سرعة الاستجابة 4 دقائق"
                isHighlighted={false}
                onAction={() => setActiveNavTab('account')}
              />

              <ServiceRow
                icon={PhoneCall}
                title="استشارات هاتفية عاجلة"
                desc="جاهزية استقبال مكالمات الاستشارة القانونية الصوتية"
                isHighlighted={false}
                onAction={() => setActiveNavTab('orders')}
              />
            </section>
          </main>

          <BottomNav
            activeTab={activeNavTab}
            onTabChange={(tabId) => setActiveNavTab(tabId)}
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: ORDERS (نسخة طبق الأصل من OrdersScreen)                             */}
      {/* ========================================================================= */}
      {activeNavTab === 'orders' && (
        <div className="orders-screen-layout">
          <Header
            title={getHeaderTitle()}
            onSearchClick={() => {}}
            onNotificationClick={() => {}}
          />

          <main className="orders-main-content">
            <div className="orders-page-header">
              <h2>طلبات الموكلين</h2>
              <p>إدارة ومتابعة طلبات الموكلين الواردة والجارية</p>
            </div>

            {/* Filter Pills matching OrdersScreen.css 1:1 */}
            <div className="orders-filter-row">
              <button
                type="button"
                className={`orders-filter-pill ${ordersFilter === 'ALL' ? 'active' : ''}`}
                onClick={() => setOrdersFilter('ALL')}
              >
                <span>الكل</span>
                <span className="filter-count-badge">{ordersList.length}</span>
              </button>
              <button
                type="button"
                className={`orders-filter-pill ${ordersFilter === 'INCOMING' ? 'active' : ''}`}
                onClick={() => setOrdersFilter('INCOMING')}
              >
                <span>الواردة</span>
                <span className="filter-count-badge">
                  {ordersList.filter((o) => o.status === 'INCOMING').length}
                </span>
              </button>
              <button
                type="button"
                className={`orders-filter-pill ${ordersFilter === 'ACTIVE' ? 'active' : ''}`}
                onClick={() => setOrdersFilter('ACTIVE')}
              >
                <span>الجارية</span>
                <span className="filter-count-badge">
                  {ordersList.filter((o) => o.status === 'ACTIVE').length}
                </span>
              </button>
              <button
                type="button"
                className={`orders-filter-pill ${ordersFilter === 'COMPLETED' ? 'active' : ''}`}
                onClick={() => setOrdersFilter('COMPLETED')}
              >
                <span>المكتملة</span>
                <span className="filter-count-badge">
                  {ordersList.filter((o) => o.status === 'COMPLETED').length}
                </span>
              </button>
            </div>

            {/* Orders Cards List */}
            <div className="orders-cards-list">
              {ordersList
                .filter((o) => {
                  if (ordersFilter === 'ALL') return true;
                  return o.status === ordersFilter;
                })
                .map((order) => (
                  <div key={order.id} className="order-card-item">
                    <div className="order-card-top">
                      <span className="order-id-badge">#{order.id}</span>
                      <span
                        className={`order-status-tag ${
                          order.status === 'ACTIVE' || order.status === 'INCOMING'
                            ? 'status-active'
                            : 'status-done'
                        }`}
                      >
                        {order.status === 'COMPLETED' ? (
                          <CheckCircle2 size={13} className="text-emerald-600" />
                        ) : (
                          <Clock size={13} className="animate-spin text-amber-600" />
                        )}
                        <span>{order.statusLabel}</span>
                      </span>
                    </div>

                    <div className="order-card-body">
                      <h4 className="order-service-name">{order.serviceTitle}</h4>
                      <div className="order-lawyer-line">
                        <span className="order-lawyer-name">الموكل: {order.clientName}</span>
                        <span className="order-lawyer-dot">•</span>
                        <span className="order-lawyer-spec">{order.specialty}</span>
                      </div>
                    </div>

                    <div className="order-card-footer">
                      <div className="order-meta-info">
                        <span className="order-date-item">
                          <Calendar size={13} />
                          <span>{order.date}</span>
                        </span>
                        <span className="order-price-val">{order.price} ج.م</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {order.status === 'INCOMING' && (
                          <>
                            <Button
                              type="button"
                              variant="primary"
                              size="sm"
                              onClick={() => handleAcceptOrder(order.id)}
                              className="h-8 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
                            >
                              قبول الطلب
                            </Button>
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              onClick={() => handleRejectOrder(order.id)}
                              className="h-8 text-xs font-bold text-rose-600"
                            >
                              اعتذار
                            </Button>
                          </>
                        )}

                        {order.status === 'ACTIVE' && (
                          <>
                            <a
                              href={`tel:${order.clientPhone}`}
                              className="h-8 px-2.5 text-xs font-bold rounded-[6px] bg-blue-50 text-[#1D4ED8] flex items-center gap-1 border border-blue-200"
                            >
                              اتصال
                            </a>
                            <Button
                              type="button"
                              variant="primary"
                              size="sm"
                              onClick={() => handleCompleteOrder(order.id, order.price)}
                              className="h-8 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
                            >
                              إنهاء الإجراء
                            </Button>
                          </>
                        )}

                        {order.status === 'COMPLETED' && (
                          <button type="button" className="order-view-details-btn">
                            <span>الفاتورة</span>
                            <ChevronLeft size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </main>

          <BottomNav
            activeTab={activeNavTab}
            onTabChange={(tabId) => setActiveNavTab(tabId)}
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: WALLET (نسخة طبق الأصل من WalletScreen)                             */}
      {/* ========================================================================= */}
      {activeNavTab === 'wallet' && (
        <div className="wallet-screen-layout">
          <Header
            title={getHeaderTitle()}
            onSearchClick={() => {}}
            onNotificationClick={() => {}}
          />

          <main className="wallet-main-content">
            <div className="wallet-page-header">
              <h2>محفظة المحامي</h2>
              <p>رصيدك من الأتعاب المحصلة وسحب الأموال لحسابك</p>
            </div>

            {/* Balance Card matching WalletScreen 1:1 */}
            <div className="wallet-balance-card">
              <div className="wallet-balance-top">
                <span className="balance-title">رصيد الأتعاب القابل للسحب</span>
                <span className="wallet-badge-secure">
                  <ShieldCheck size={14} />
                  <span>محفظة معتمدة ومحمية</span>
                </span>
              </div>

              <div className="wallet-balance-amount">
                <span className="amount-number">{availableBalance.toLocaleString()}</span>
                <span className="amount-currency">جنيه مصري</span>
              </div>

              <div className="wallet-actions-row">
                <button
                  type="button"
                  className="wallet-action-btn primary"
                  onClick={() => setIsWithdrawOpen(true)}
                >
                  <ArrowUpRight size={17} />
                  <span>طلب سحب الأرباح الآن</span>
                </button>
              </div>
            </div>

            {/* History Section matching WalletScreen 1:1 */}
            <section className="wallet-history-section">
              <div className="history-header-line">
                <h4>سجل تحصيل الأتعاب</h4>
                <span className="history-count">آخر 3 عمليات</span>
              </div>

              <div className="transactions-list">
                <div className="txn-card-item">
                  <div className="txn-icon-wrap">
                    <ArrowDownLeft size={18} className="text-emerald-600" />
                  </div>
                  <div className="txn-info-box">
                    <h5 className="txn-title">أتعاب: حضور تحقيق نيابة العجوزة</h5>
                    <span className="txn-sub">الموكل: أ/ طارق عبد الرحمن</span>
                    <span className="txn-date">أمس، 2:15 م</span>
                  </div>
                  <div className="txn-amount-val amount-credit">+600 ج.م</div>
                </div>

                <div className="txn-card-item">
                  <div className="txn-icon-wrap">
                    <ArrowDownLeft size={18} className="text-emerald-600" />
                  </div>
                  <div className="txn-info-box">
                    <h5 className="txn-title">أتعاب: استشارة قانونية عاجلة (محاميك حالاً)</h5>
                    <span className="txn-sub">الموكل: أ/ كمال محمود</span>
                    <span className="txn-date">28 أكتوبر 2026</span>
                  </div>
                  <div className="txn-amount-val amount-credit">+350 ج.م</div>
                </div>

                <div className="txn-card-item">
                  <div className="txn-icon-wrap">
                    <ArrowDownLeft size={18} className="text-emerald-600" />
                  </div>
                  <div className="txn-info-box">
                    <h5 className="txn-title">أتعاب: صياغة وتوثيق عقد إيجار مقهى تجاري</h5>
                    <span className="txn-sub">شركة النور للمقاولات</span>
                    <span className="txn-date">25 أكتوبر 2026</span>
                  </div>
                  <div className="txn-amount-val amount-credit">+900 ج.م</div>
                </div>
              </div>
            </section>
          </main>

          <BottomNav
            activeTab={activeNavTab}
            onTabChange={(tabId) => setActiveNavTab(tabId)}
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: ACCOUNT (نسخة طبق الأصل من AccountScreen)                            */}
      {/* ========================================================================= */}
      {activeNavTab === 'account' && (
        <div className="account-screen-layout">
          <Header
            title={getHeaderTitle()}
            onSearchClick={() => {}}
            onNotificationClick={() => {}}
          />

          <main className="account-main-content">
            <div className="account-profile-card">
              <div className="account-avatar-wrap">
                {user?.profilePhotoPath ? (
                  <img src={user.profilePhotoPath} alt="الصورة الشخصية" className="w-full h-full object-cover rounded-full" />
                ) : (
                  <UserCheck size={26} className="text-[#1D4ED8]" />
                )}
              </div>

              <div className="account-user-details">
                <h3 className="account-user-name">
                  {user?.fullName || 'المستشار / أحمد فهمي'}
                </h3>
                <span className="account-user-phone">
                  {user?.phone || '01012345678'}
                </span>
                <span className="account-user-loc">
                  نقابة المحامين • قيد رقم 482910 (استئناف عالي)
                </span>
              </div>
            </div>

            <div className="account-menu-list">
              <button type="button" className="account-menu-row">
                <div className="account-menu-icon-box">
                  <FileText size={18} />
                </div>
                <span className="account-menu-title">بيانات القيد والدرجة القضائية المعتمدة</span>
                <ChevronLeft size={18} className="text-slate-400" />
              </button>

              <button type="button" className="account-menu-row">
                <div className="account-menu-icon-box">
                  <MapPin size={18} />
                </div>
                <span className="account-menu-title">عنوان المكتب ومواعيد المقابلات</span>
                <ChevronLeft size={18} className="text-slate-400" />
              </button>

              <button type="button" className="account-menu-row">
                <div className="account-menu-icon-box">
                  <Bell size={18} />
                </div>
                <span className="account-menu-title">إعدادات تنبيهات خدمة «محاميك حالاً»</span>
                <ChevronLeft size={18} className="text-slate-400" />
              </button>

              <button type="button" className="account-menu-row">
                <div className="account-menu-icon-box">
                  <Shield size={18} />
                </div>
                <span className="account-menu-title">ميثاق العمل والسرية المهنية</span>
                <ChevronLeft size={18} className="text-slate-400" />
              </button>

              <button type="button" className="account-menu-row">
                <div className="account-menu-icon-box">
                  <HelpCircle size={18} />
                </div>
                <span className="account-menu-title">الدعم الفني المخصص للمحامين</span>
                <ChevronLeft size={18} className="text-slate-400" />
              </button>
            </div>

            <button type="button" className="account-logout-btn" onClick={onLogout}>
              <LogOut size={18} />
              <span>تسجيل الخروج من الحساب</span>
            </button>
          </main>

          <BottomNav
            activeTab={activeNavTab}
            onTabChange={(tabId) => setActiveNavTab(tabId)}
          />
        </div>
      )}

      {/* Withdrawal Modal */}
      {isWithdrawOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setIsWithdrawOpen(false)}
        >
          <div
            className="bg-white rounded-t-[12px] sm:rounded-[7px] max-w-[480px] w-full p-5 flex flex-col gap-3 shadow-xl"
            onClick={(e) => e.stopPropagation()}
            dir="rtl"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Wallet size={20} className="text-[#1D4ED8]" />
                <h3 className="text-sm font-bold text-slate-900 m-0">طلب سحب الأتعاب</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsWithdrawOpen(false)}
                className="text-slate-400 hover:text-slate-600 border-none bg-transparent cursor-pointer text-lg p-1"
              >
                ✕
              </button>
            </div>

            {withdrawSuccess ? (
              <div className="py-6 text-center">
                <CheckCircle2 size={44} className="text-emerald-600 mx-auto mb-2 animate-bounce" />
                <h4 className="text-sm font-bold text-emerald-900 mb-1">تم إرسال طلب السحب بنجاح!</h4>
                <p className="text-xs text-emerald-700 m-0">
                  سيتم تحويل المبلغ إلى حسابك المحدد في غضون دقائق معدودة.
                </p>
              </div>
            ) : (
              <form onSubmit={handleConfirmWithdraw} className="flex flex-col gap-3">
                <div className="text-xs text-slate-600">
                  الرصيد المتاح للسحب: <strong className="text-emerald-600 font-bold">{availableBalance} ج.م</strong>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700">وسيلة التحويل:</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setWithdrawMethod('instapay')}
                      className={`p-2 text-xs font-bold rounded-[6px] border text-center transition-all ${
                        withdrawMethod === 'instapay'
                          ? 'bg-blue-50 border-blue-600 text-[#1D4ED8]'
                          : 'bg-white border-slate-200 text-slate-600'
                      }`}
                    >
                      إنستاباي (IPA)
                    </button>
                    <button
                      type="button"
                      onClick={() => setWithdrawMethod('vodafone_cash')}
                      className={`p-2 text-xs font-bold rounded-[6px] border text-center transition-all ${
                        withdrawMethod === 'vodafone_cash'
                          ? 'bg-blue-50 border-blue-600 text-[#1D4ED8]'
                          : 'bg-white border-slate-200 text-slate-600'
                      }`}
                    >
                      محفظة كاش
                    </button>
                    <button
                      type="button"
                      onClick={() => setWithdrawMethod('bank')}
                      className={`p-2 text-xs font-bold rounded-[6px] border text-center transition-all ${
                        withdrawMethod === 'bank'
                          ? 'bg-blue-50 border-blue-600 text-[#1D4ED8]'
                          : 'bg-white border-slate-200 text-slate-600'
                      }`}
                    >
                      حساب بنكي (IBAN)
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-700">
                    {withdrawMethod === 'instapay'
                      ? 'عنوان الدفع اللحظي (IPA / رقم الهاتف):'
                      : withdrawMethod === 'vodafone_cash'
                      ? 'رقم المحفظة الإلكترونية:'
                      : 'رقم الآيبان (IBAN) البنكي:'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={
                      withdrawMethod === 'instapay'
                        ? 'username@instapay'
                        : withdrawMethod === 'vodafone_cash'
                        ? '010XXXXXXXX'
                        : 'EGXXXXXXXXXXXXXXXXXXXX'
                    }
                    value={withdrawAccount}
                    onChange={(e) => setWithdrawAccount(e.target.value)}
                    className="h-10 px-3 text-xs border border-slate-300 rounded-[6px] focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-700">المبلغ المطلوب (ج.م):</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      required
                      min="50"
                      max={availableBalance}
                      placeholder="أدخل المبلغ"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      className="flex-1 h-10 px-3 text-xs border border-slate-300 rounded-[6px] focus:outline-none focus:border-blue-600"
                    />
                    <button
                      type="button"
                      onClick={() => setWithdrawAmount(String(availableBalance))}
                      className="px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-[6px] border border-slate-300"
                    >
                      الكل
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full h-11 text-xs font-bold mt-2 bg-[#1D4ED8] hover:bg-[#1E40AF] text-white"
                >
                  تأكيد وسحب المبلغ فوراً
                </Button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
