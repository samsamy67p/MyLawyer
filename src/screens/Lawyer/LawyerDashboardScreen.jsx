import React, { useState } from 'react';
import { UserCheck, ShieldCheck, Bell, LogOut, ToggleLeft, ToggleRight, Phone } from 'lucide-react';
import Header from '../../components/layout/Header';
import { Button } from '../../components/ui/Button';

export default function LawyerDashboardScreen({ user, onLogout }) {
  const [isAvailable, setIsAvailable] = useState(true);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-12" dir="rtl">
      <Header title="لوحة المحامي" />

      <main className="p-4 max-w-[480px] mx-auto w-full flex flex-col gap-4">
        {/* Availability Card */}
        <div className="bg-white p-4 rounded-[7px] border border-slate-200 flex items-center justify-between shadow-xs">
          <div>
            <h3 className="text-sm font-bold text-slate-900">حالة الاستعداد الميداني</h3>
            <p className="text-xs text-slate-500">
              {isAvailable ? 'أنت متصل الآن وتستقبل طلبات الموكلين حولك' : 'أنت غير متاح لتلقي طلبات جديدة'}
            </p>
          </div>
          <button
            type="button"
            className="border-none bg-transparent cursor-pointer p-1"
            onClick={() => setIsAvailable(!isAvailable)}
          >
            {isAvailable ? (
              <ToggleRight size={36} className="text-emerald-600" />
            ) : (
              <ToggleLeft size={36} className="text-slate-400" />
            )}
          </button>
        </div>

        {/* Profile Summary Card */}
        <div className="bg-white p-5 rounded-[7px] border border-slate-200 flex items-center gap-4 shadow-xs">
          <div className="w-14 h-14 rounded-full bg-blue-50 text-blue-700 border-2 border-blue-600 flex items-center justify-center font-bold text-lg overflow-hidden">
            {user?.profilePhotoPath ? (
              <img src={user.profilePhotoPath} alt="الصورة الشخصية" className="w-full h-full object-cover" />
            ) : (
              <UserCheck size={28} />
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">{user?.fullName || 'محامٍ معتمد'}</h2>
              <span className="bg-emerald-50 text-emerald-700 text-[11px] font-bold px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                <ShieldCheck size={12} />
                <span>معتمد</span>
              </span>
            </div>
            <div className="text-xs text-slate-500 flex items-center gap-1 mt-1">
              <Phone size={12} />
              <span>{user?.phone}</span>
            </div>
          </div>
        </div>

        {/* Incoming Requests Section Placeholder */}
        <div className="bg-white p-5 rounded-[7px] border border-slate-200 text-center py-10 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 mx-auto flex items-center justify-center mb-3">
            <Bell size={24} />
          </div>
          <h4 className="text-sm font-bold text-slate-800 mb-1">بانتظار طلبات الموكلين</h4>
          <p className="text-xs text-slate-500 max-w-[280px] mx-auto">
            ستصلك إشعارات وتنبيهات فورية عند قيام موكل قريب منك بطلب خدمة «محاميك حالاً».
          </p>
        </div>

        {/* Logout */}
        <Button variant="secondary" onClick={onLogout} className="w-full flex items-center justify-center gap-2 mt-4">
          <LogOut size={16} />
          <span>تسجيل الخروج من الحساب</span>
        </Button>
      </main>
    </div>
  );
}
