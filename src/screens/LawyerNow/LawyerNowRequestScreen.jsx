import React, { useState, useEffect } from 'react';
import {
  FileText,
  ShieldAlert,
  Scale,
  Stamp,
  FileSearch,
  CalendarClock,
  Search,
  ArrowRight,
} from 'lucide-react';
import { sanitizeText } from '../../lib/security';
import Header from '../../components/layout/Header';
import askOnlineSvg from '../../assets/undraw_ask-online_8zdn.svg';
import './LawyerNowRequestScreen.css';

/**
 * قائمة الخدمات الميدانية والمصغرة الفورية في "محاميك حالاً" (تُنجز خلال ساعات أو 24 ساعة كحد أقصى).
 * تم استبعاد كل ما يخص صياغة ومراجعة وكتابة العقود والمحررات لأنها خدمة منفصلة.
 */
const PROBLEM_TYPES = [
  {
    id: 'police',
    title: 'محاضر وأقسام شرطة',
    desc: 'عمل محضر، إثبات حالة، صلح، أو حضور فوري معاك في القسم',
    icon: ShieldAlert,
    placeholder: 'مثال: محتاج محامي يحضر معايا حالاً في قسم الشرطة لعمل محضر...',
    quickExamples: [
      'حضور فوري في قسم الشرطة',
      'عمل محضر إثبات حالة',
      'إتمام صلح في القسم',
    ],
  },
  {
    id: 'prosecution',
    title: 'تحقيق نيابة عامة',
    desc: 'حضور تحقيق عاجل، طلب إخلاء سبيل، أو متابعة محضر في النيابة',
    icon: Scale,
    placeholder: 'مثال: في تحقيق شغال دلوقتي في النيابة ومحتاج محامي يحضر فوراً...',
    quickExamples: [
      'حضور تحقيق عاجل بالنيابة',
      'تقديم طلب إخلاء سبيل',
      'الاطلاع على قرار نيابة اليوم',
    ],
  },
  {
    id: 'admin',
    title: 'أعمال وتخليص أوراق حكومية',
    desc: 'سجل تجاري، ضرائب، مرور، تأمينات، أو مشاوير إدارية سريعة',
    icon: FileText,
    placeholder: 'مثال: محتاج تخليص مستند رسمي من السجل التجاري أو الضرائب أو المرور...',
    quickExamples: [
      'استخراج مستخرج سجل تجاري',
      'تخليص إجراء في الضرائب أو التأمينات',
      'إنهاء أوراق وتراخيص إدارية',
    ],
  },
  {
    id: 'notary',
    title: 'إجراءات شهر عقاري وتوكيلات',
    desc: 'عمل توكيل رسمي أو إنهاء إجراء توثيق سريع في الشهر العقاري',
    icon: Stamp,
    placeholder: 'مثال: محتاج محامي معايا في الشهر العقاري لإنهاء إجراءات توكيل رسمي...',
    quickExamples: [
      'إنهاء إجراء في الشهر العقاري',
      'عمل توكيل رسمي',
      'استخراج صورة رسمية من توكيل',
    ],
  },
  {
    id: 'certificates',
    title: 'شهادات وكشف رسمي من المحكمة',
    desc: 'استخراج شهادة من الجدول، صورة رسمية من حكم، أو كشف عن أحكام',
    icon: FileSearch,
    placeholder: 'مثال: محتاج استخراج شهادة من الجدول أو صورة رسمية من حكم...',
    quickExamples: [
      'استخراج شهادة رسمية من الجدول',
      'استخراج صورة رسمية من حكم',
      'الاستعلام عن موقف قضية أو حكم',
    ],
  },
  {
    id: 'quick-session',
    title: 'حضور جلسة اليوم (تأجيل أو إثبات حضور)',
    desc: 'محامي يحضر عنك جلسة واحدة سريعة لإثبات الحضور أو تقديم ورق',
    icon: CalendarClock,
    placeholder: 'مثال: عندي جلسة النهاردة ومحتاج محامي يحضر لإثبات الحضور أو طلب أجل...',
    quickExamples: [
      'إثبات حضور وطلب تأجيل جلسة',
      'تقديم مستندات في جلسة اليوم',
      'حضور جلسة إجرائية سريعة',
    ],
  },
];

export default function LawyerNowRequestScreen({
  initialDetails = null,
  onBack,
  onProceedToMap,
  onSubmitDetails,
  onModalStateChange,
}) {
  // Step 1: اختيار نوع الخدمة المصغرة
  // Step 2: كتابة تفاصيل الطلب باختصار (تبدأ فارغة دائماً لكل طلب جديد، وتحتفظ بالبيانات عند الرجوع من الخريطة)
  const [currentStep, setCurrentStep] = useState(() =>
    initialDetails?.serviceType ? 2 : 1
  );
  const [selectedType, setSelectedType] = useState(() => {
    if (!initialDetails?.serviceType) return null;
    return (
      PROBLEM_TYPES.find((item) => item.id === initialDetails.serviceType) || null
    );
  });
  const [problemDescription, setProblemDescription] = useState(
    () => initialDetails?.description || ''
  );
  const [isSearching, setIsSearching] = useState(false);

  // Register hardware back button handler when on Step 2 so hardware back returns to Step 1
  useEffect(() => {
    onModalStateChange?.(currentStep === 2, () => setCurrentStep(1));
    return () => {
      onModalStateChange?.(false, null);
    };
  }, [currentStep, onModalStateChange]);

  const handleSelectService = (item) => {
    if (selectedType?.id !== item.id) {
      setProblemDescription('');
    }
    setSelectedType(item);
    setCurrentStep(2);
  };

  const handleSearchLawyers = () => {
    if (isSearching) return;
    setIsSearching(true);
    setTimeout(() => {
      setIsSearching(false);
      const details = {
        serviceType: selectedType?.id,
        serviceTitle: selectedType?.title,
        description: sanitizeText(problemDescription, 400),
      };
      if (onProceedToMap) {
        onProceedToMap(details);
      } else if (onSubmitDetails) {
        onSubmitDetails(details);
      }
    }, 240);
  };

  const handleBackStep = () => {
    if (currentStep === 2) {
      setCurrentStep(1);
    } else {
      onBack?.();
    }
  };

  const handleQuickExampleClick = (exampleText) => {
    setProblemDescription((prev) =>
      prev.trim() ? `${prev.trim()} - ${exampleText}` : exampleText
    );
  };

  return (
    <div className="request-screen-wrapper">
      {/* Global Persistent Header */}
      <Header
        title="محاميك حالاً"
        showBack={true}
        onBack={handleBackStep}
      />

      {/* Main Container */}
      <main className="request-content-container">
        {/* Step Indicator Progress Bar */}
        <div className="request-step-indicator">
          <div className="step-track">
            <div
              className="step-progress"
              style={{ width: currentStep === 1 ? '50%' : '100%' }}
            ></div>
          </div>
          <div className="step-number-text">
            <span>الخطوة {currentStep} من 2</span>
          </div>
        </div>

        {/* STEP 1: اختيار الخدمة المصغرة (تُنجز خلال 24 ساعة كحد أقصى) */}
        {currentStep === 1 && (
          <div className="step-pane step-fade-in">
            {/* SVG Illustration Hero */}
            <div className="request-hero-box">
              <img
                src={askOnlineSvg}
                alt="ما مشكلتك"
                className="request-hero-illustration"
              />
              <h2 className="request-hero-title">إيه المشوار أو الموقف اللي محتاج فيه محامي؟</h2>
              <p className="request-hero-subtitle request-hero-subtitle-blue">
                <span>الخدمة دي مخصصة للمهام والمشاوير القانونية السريعة</span>
                <span>اللي بتخلص فوراً أو خلال 24 ساعة بالكتير</span>
              </p>
            </div>

            {/* Service Selection Cards */}
            <div className="request-options-grid">
              {PROBLEM_TYPES.map((item) => {
                const IconComponent = item.icon;
                const isSelected = selectedType?.id === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`request-option-card ${isSelected ? 'option-selected' : ''}`}
                    onClick={() => handleSelectService(item)}
                  >
                    <div className="option-icon-box">
                      <IconComponent size={21} className="text-[#1D4ED8]" />
                    </div>
                    <div className="option-text-box">
                      <h4 className="option-title">{item.title}</h4>
                      <p className="option-desc">{item.desc}</p>
                    </div>
                    <ArrowRight size={17} className="option-arrow text-slate-400 rotate-180" />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 2: كتابة وصف الطلب أو المشكلة باختصار */}
        {currentStep === 2 && (
          <div className="step-pane step-fade-in">
            <div className="request-hero-box step2-hero">
              <h2 className="request-hero-title">اكتب طلبك أو مشكلتك باختصار</h2>
              <p className="request-hero-subtitle">
                اكتب كلمتين يفهموا المحامي المطلوب بالظبط عشان يوصلك جاهز ويخلصلك المصلحة في أسرع وقت
              </p>
            </div>

            {/* Quick Tap Suggestions tailored to the selected 24h micro-service */}
            {selectedType?.quickExamples?.length > 0 && (
              <div className="quick-examples-row">
                {selectedType.quickExamples.map((ex, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="quick-example-chip"
                    onClick={() => handleQuickExampleClick(ex)}
                  >
                    + {ex}
                  </button>
                ))}
              </div>
            )}

            {/* Input Box - Direct (Not in an extra nested card) */}
            <div className="request-input-wrapper">
              <textarea
                id="problem-desc"
                rows={4}
                value={problemDescription}
                onChange={(e) => setProblemDescription(e.target.value)}
                placeholder={
                  selectedType?.placeholder ||
                  'اكتب هنا اللي حابب المحامي يعرفه قبل ما يوصلك (اختياري)...'
                }
                className="request-textarea"
                maxLength={400}
                autoFocus
              />
              <div className="textarea-footer">
                <span className="char-count">{problemDescription.length}/400</span>
                <span className="safe-notice">بياناتك محمية ومش بتظهر غير للمحامي المقبول</span>
              </div>
            </div>

            {/* Actions: Search Button + Back to previous step button */}
            <div className="request-action-bar">
              <button
                type="button"
                className="request-submit-btn"
                disabled={isSearching}
                onClick={handleSearchLawyers}
              >
                {isSearching ? (
                  <span
                    className="inline-block w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"
                    aria-label="جاري التحميل"
                  />
                ) : (
                  <>
                    <Search size={19} />
                    <span>بحث عن أقرب محامين متاحين</span>
                  </>
                )}
              </button>

              <button
                type="button"
                className="request-prev-step-btn"
                disabled={isSearching}
                onClick={handleBackStep}
              >
                <span>العودة للخطوة السابقة</span>
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
