import React, { useState } from 'react';
import {
  UserCheck,
  ShieldCheck,
  Bell,
  LogOut,
  ToggleLeft,
  ToggleRight,
  Phone,
  Wallet,
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  FileText,
  Star,
  ArrowUpRight,
} from 'lucide-react';
import Header from '../../components/layout/Header';
import { Button } from '../../components/ui/Button';

export default function LawyerDashboardScreen({ user, onLogout }) {
  const [isAvailable, setIsAvailable] = useState(true);
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'wallet' | 'profile'
  const [incomingOrderState, setIncomingOrderState] = useState('PENDING'); // 'PENDING' | 'ACCEPTED' | 'REJECTED'

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-12 font-sans" dir="rtl">
      {/* Top Header */}
      <Header
        title="بوابة المحامي المعتمد"
        leftAction={
          <button
            type="button"
            onClick={onLogout}
            className="p-2 text-slate-500 hover:text-rose-600 transition-colors"
            title="تسجيل الخروج"
          >
            <LogOut size={20} />
          </button>
        }
      />

      <main className="p-4 max-w-[480px] mx-auto w-full flex flex-col gap-4">
        {/* Availability Toggle Card */}
        <div className={`p-4 rounded-[7px] border transition-all ${
          isAvailable
            ? 'bg-emerald-50/50 border-emerald-200'
            : 'bg-white border-slate-200'
        } flex items-center justify-between shadow-xs`}>
          <div>
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${isAvailable ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
              <h3 className="text-sm font-bold text-slate-900">حالة الاستعداد الميداني</h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {isAvailable ? 'متصل الآن وتستقبل طلبات الموكلين حولك في نطاقك' : 'غير متاح حالياً لتلقي طلبات جديدة'}
            </p>
          </div>
          <button
            type="button"
            className="border-none bg-transparent cursor-pointer p-1"
            onClick={() => setIsAvailable(!isAvailable)}
          >
            {isAvailable ? (
              <ToggleRight size={38} className="text-emerald-600" />
            ) : (
              <ToggleLeft size={38} className="text-slate-400" />
            )}
          </button>
        </div>

        {/* Lawyer Profile Hero */}
        <div className="bg-white p-4 rounded-[7px] border border-slate-200 flex items-center gap-4 shadow-xs">
          <div className="w-14 h-14 rounded-full bg-blue-50 text-[#1D4ED8] border-2 border-blue-600 flex items-center justify-center font-bold text-lg overflow-hidden shrink-0">
            {user?.profilePhotoPath ? (
              <img src={user.profilePhotoPath} alt="الصورة الشخصية" className="w-full h-full object-cover" />
            ) : (
              <UserCheck size={28} />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 truncate">{user?.fullName || 'المستشار القانوني'}</h2>
              <span className="bg-emerald-50 text-emerald-700 text-[11px] font-bold px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1 shrink-0">
                <ShieldCheck size={12} />
                <span>معتمد</span>
              </span>
            </div>
            <div className="text-xs text-slate-500 flex items-center gap-1 mt-1 truncate">
              <Phone size={12} className="shrink-0" />
              <span>{user?.phone || '01012345678'}</span>
              <span className="mx-1">•</span>
              <span className="text-[#1D4ED8] font-medium">نقابة المحامين (استئناف)</span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white p-3 rounded-[7px] border border-slate-200 text-center shadow-xs">
            <span className="text-[11px] text-slate-500 block mb-1">الرصيد المتاح</span>
            <div className="flex items-center justify-center gap-1 text-emerald-600 font-bold text-base">
              <span>1,850</span>
              <span className="text-[10px] text-slate-500 font-normal">ج.م</span>
            </div>
          </div>
          <div className="bg-white p-3 rounded-[7px] border border-slate-200 text-center shadow-xs">
            <span className="text-[11px] text-slate-500 block mb-1">الطلبات المنجزة</span>
            <div className="flex items-center justify-center gap-1 text-[#1D4ED8] font-bold text-base">
              <span>34</span>
              <span className="text-[10px] text-slate-500 font-normal">طلب</span>
            </div>
          </div>
          <div className="bg-white p-3 rounded-[7px] border border-slate-200 text-center shadow-xs">
            <span className="text-[11px] text-slate-500 block mb-1">تقييم الموكلين</span>
            <div className="flex items-center justify-center gap-1 text-amber-500 font-bold text-base">
              <Star size={13} fill="currentColor" />
              <span>4.95</span>
            </div>
          </div>
        </div>

        {/* Dashboard Tabs Switcher */}
        <div className="flex border-b border-slate-200 bg-white rounded-[7px] p-1 shadow-xs">
          <button
            type="button"
            onClick={() => setActiveTab('orders')}
            className={`flex-1 py-2 text-xs font-bold rounded-[5px] transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'orders'
                ? 'bg-[#1D4ED8] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Bell size={14} />
            <span>الطلبات الواردة</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('wallet')}
            className={`flex-1 py-2 text-xs font-bold rounded-[5px] transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'wallet'
                ? 'bg-[#1D4ED8] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Wallet size={14} />
            <span>محفظة الأتعاب</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`flex-1 py-2 text-xs font-bold rounded-[5px] transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'profile'
                ? 'bg-[#1D4ED8] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText size={14} />
            <span>بيانات القيد</span>
          </button>
        </div>

        {/* TAB 1: Orders Tab */}
        {activeTab === 'orders' && (
          <div className="flex flex-col gap-3">
            {isAvailable ? (
              <>
                {/* Simulated Real-Time Incoming Request Card */}
                {incomingOrderState === 'PENDING' && (
                  <div className="bg-white border-2 border-blue-500 rounded-[7px] p-4 shadow-sm animate-pulse-border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="bg-blue-100 text-[#1D4ED8] text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Clock size={12} />
                        <span>طلب فوري جديد (محاميك حالاً)</span>
                      </span>
                      <span className="text-xs font-bold text-slate-500">منذ دقيقة</span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 mb-1">تحرير محضر إثبات حالة بقسم الشرطة</h4>
                    <div className="flex items-center gap-1 text-xs text-slate-600 mb-2">
                      <MapPin size={13} className="text-[#1D4ED8]" />
                      <span>قسم شرطة الدقي — على بُعد 1.8 كم (6 دقائق بالسيارة)</span>
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded-[5px] border border-slate-200 mb-3 text-xs text-slate-600">
                      <strong>تفاصيل الموكل:</strong> الأستاذ كمال محمود — بحاجة لحضور المحامي فوراً لمتابعة قيد محضر رسمي.
                    </div>

                    <div className="flex items-center justify-between mb-3 text-xs">
                      <span className="text-slate-500">الأتعاب المقترحة:</span>
                      <span className="text-base font-bold text-emerald-600">350 ج.م</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        type="button"
                        variant="primary"
                        onClick={() => setIncomingOrderState('ACCEPTED')}
                        className="w-full text-xs font-bold h-10 bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-1"
                      >
                        <CheckCircle2 size={15} />
                        <span>قبول الطلب فوراً</span>
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => setIncomingOrderState('REJECTED')}
                        className="w-full text-xs font-bold h-10 text-rose-600 hover:bg-rose-50 flex items-center justify-center gap-1"
                      >
                        <XCircle size={15} />
                        <span>اعتذار</span>
                      </Button>
                    </div>
                  </div>
                )}

                {incomingOrderState === 'ACCEPTED' && (
                  <div className="bg-emerald-50 border border-emerald-300 rounded-[7px] p-4 text-center">
                    <CheckCircle2 size={32} className="text-emerald-600 mx-auto mb-2" />
                    <h4 className="text-sm font-bold text-emerald-900 mb-1">تم قبول الطلب بنجاح!</h4>
                    <p className="text-xs text-emerald-700 mb-3">
                      تم إشعار الموكل بجاهزيتك وتأكيد مسار التحرك لقسم شرطة الدقي.
                    </p>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setIncomingOrderState('PENDING')}
                      className="text-xs"
                    >
                      إعادة تجربة طلب وارد آخر
                    </Button>
                  </div>
                )}

                {incomingOrderState === 'REJECTED' && (
                  <div className="bg-slate-100 border border-slate-200 rounded-[7px] p-4 text-center">
                    <h4 className="text-sm font-bold text-slate-800 mb-1">تم الاعتذار عن الطلب</h4>
                    <p className="text-xs text-slate-500 mb-3">
                      تم توجيه الطلب تلقائياً للمحامي البديل التالي بجوار الموكل.
                    </p>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setIncomingOrderState('PENDING')}
                      className="text-xs"
                    >
                      إعادة تجربة طلب وارد آخر
                    </Button>
                  </div>
                )}

                {/* Passive Waiting Info */}
                <div className="bg-white p-4 rounded-[7px] border border-slate-200 text-center shadow-xs">
                  <span className="text-xs text-slate-500">
                    رادارك الميداني نشط • يتم مسح المحيط الجغرافي للطلبات كل 10 ثوانٍ
                  </span>
                </div>
              </>
            ) : (
              <div className="bg-white p-8 rounded-[7px] border border-slate-200 text-center shadow-xs">
                <ToggleLeft size={36} className="text-slate-400 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-slate-800 mb-1">حسابك غير متصل حالياً</h4>
                <p className="text-xs text-slate-500 max-w-[280px] mx-auto mb-3">
                  قم بتفعيل زر "حالة الاستعداد الميداني" بالأعلى لبدء استقبال طلبات الموكلين من حولك.
                </p>
                <Button
                  type="button"
                  variant="primary"
                  onClick={() => setIsAvailable(true)}
                  className="text-xs h-9"
                >
                  تفعيل الاتصال الآن
                </Button>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Wallet Tab */}
        {activeTab === 'wallet' && (
          <div className="flex flex-col gap-3">
            <div className="bg-white p-4 rounded-[7px] border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 block mb-1">إجمالي الأتعاب المحصلة هذا الشهر</span>
              <div className="text-2xl font-bold text-slate-900 mb-3">
                1,850 <span className="text-sm text-slate-500 font-normal">ج.م</span>
              </div>
              <Button type="button" variant="primary" className="w-full text-xs font-bold h-10 flex items-center justify-center gap-1.5">
                <ArrowUpRight size={16} />
                <span>طلب سحب الأرباح إلى المحفظة / الحساب البنكي</span>
              </Button>
            </div>

            <div className="bg-white p-4 rounded-[7px] border border-slate-200 shadow-xs">
              <h4 className="text-xs font-bold text-slate-800 mb-2">سجل العمليات الأخيرة</h4>
              <div className="flex flex-col divide-y divide-slate-100 text-xs">
                <div className="py-2.5 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-800 block">حضور تحقيق نيابة العجوزة</span>
                    <span className="text-[11px] text-slate-400">أمس، 2:15 م</span>
                  </div>
                  <span className="font-bold text-emerald-600">+600 ج.م</span>
                </div>
                <div className="py-2.5 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-800 block">استشارة قانونية عاجلة (محاميك حالاً)</span>
                    <span className="text-[11px] text-slate-400">28 أكتوبر، 11:30 ص</span>
                  </div>
                  <span className="font-bold text-emerald-600">+350 ج.م</span>
                </div>
                <div className="py-2.5 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-800 block">صياغة وتوثيق عقد إيجار تجاري</span>
                    <span className="text-[11px] text-slate-400">25 أكتوبر، 5:00 م</span>
                  </div>
                  <span className="font-bold text-emerald-600">+900 ج.م</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Registry Profile Tab */}
        {activeTab === 'profile' && (
          <div className="bg-white p-4 rounded-[7px] border border-slate-200 flex flex-col gap-3 shadow-xs text-xs">
            <h4 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">بيانات الاعتماد المهني</h4>

            <div className="flex items-center justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-500">رقم القيد بالنقابة:</span>
              <span className="font-bold text-slate-800">482910 / عامة</span>
            </div>

            <div className="flex items-center justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-500">الدرجة القضائية:</span>
              <span className="font-bold text-slate-800">محامٍ بالاستئناف العالي ومجلس الدولة</span>
            </div>

            <div className="flex items-center justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-500">التخصصات الأساسية:</span>
              <span className="font-bold text-[#1D4ED8]">جنائي • مدني • تأسيس شركات</span>
            </div>

            <div className="flex items-center justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-500">عنوان المكتب المعتمد:</span>
              <span className="font-bold text-slate-800">ش جامعة الدول العربية، المهندسين</span>
            </div>

            <div className="flex items-center justify-between py-1.5">
              <span className="text-slate-500">الرقم القومي:</span>
              <span className="font-bold text-slate-800">2890514****** (تم التحقق)</span>
            </div>
          </div>
        )}

        {/* Bottom Direct Logout Button */}
        <Button
          variant="secondary"
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 mt-4 text-xs font-bold text-slate-600"
        >
          <LogOut size={16} />
          <span>تسجيل الخروج والعودة لشاشة الدخول</span>
        </Button>
      </main>
    </div>
  );
}
