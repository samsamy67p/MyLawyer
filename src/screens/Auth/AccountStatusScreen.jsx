import React from 'react';
import { Clock, ShieldAlert, LogOut, Info } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export default function AccountStatusScreen({ user, onLogout }) {
  const isPending = user?.status === 'pending_admin_approval';
  const isRejected = user?.status === 'rejected';
  const isSuspended = user?.status === 'suspended';

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center max-w-[440px] mx-auto" dir="rtl">
      {isPending && (
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mb-5">
            <Clock size={36} />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">طلب الاعتماد قيد المراجعة</h2>
          <p className="text-sm text-slate-600 leading-relaxed mb-6">
            أهلاً بك أ/ <strong>{user?.fullName || 'المحامي'}</strong>.<br />
            تم استلام بياناتك وصورة كارنيه النقابة بنجاح، ويقوم فريق الإدارة بمراجعة المستندات للتأكد من القيد بنقابة المحامين.
          </p>
          <div className="bg-amber-50/70 border border-amber-200 rounded-[7px] p-4 text-xs text-amber-800 mb-8 text-right w-full flex items-start gap-2.5">
            <Info size={16} className="text-amber-700 shrink-0 mt-0.5" />
            <span className="leading-relaxed">تستغرق عملية المراجعة عادة من ساعتين إلى 24 ساعة عمل بحد أقصى. ستتمكن من تسجيل الدخول فور اعتماد الحساب.</span>
          </div>
        </div>
      )}

      {isRejected && (
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-red-50 text-red-600 flex items-center justify-center mb-5">
            <ShieldAlert size={36} />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">تم رفض طلب التسجيل</h2>
          <p className="text-sm text-slate-600 leading-relaxed mb-4">
            نعتذر منك، لم يتم قبول طلب توثيق الحساب للأسباب التالية:
          </p>
          <div className="bg-red-50 border border-red-200 rounded-[7px] p-4 text-xs text-red-700 mb-6 text-right w-full font-medium">
            {user?.reason || 'صورة كارنيه المحاماة غير واضحة أو غير مطابقة للبيانات المسجلة.'}
          </div>
        </div>
      )}

      {isSuspended && (
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-red-50 text-red-600 flex items-center justify-center mb-5">
            <ShieldAlert size={36} />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">تم إيقاف هذا الحساب</h2>
          <p className="text-sm text-slate-600 leading-relaxed mb-6">
            تم تعليق الوصول إلى هذا الحساب مؤقتاً بقرار إداري. يرجى التواصل مع الدعم الفني للاستفسار.
          </p>
        </div>
      )}

      <Button variant="secondary" onClick={onLogout} className="w-full flex items-center justify-center gap-2">
        <LogOut size={16} />
        <span>تسجيل الخروج والعودة</span>
      </Button>
    </div>
  );
}
