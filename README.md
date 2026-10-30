# MyLawyer (ماي لوير) ⚖️📱

> **تطبيق هجين قانوني يربط الموكلين بأقرب المحامين المعتمدين والمتاحين فورياً حولهم في جمهورية مصر العربية مع ملاحة الطرق الحية وحساب المسافات وتتبع الوصول.**

[![Code Quality: Oxlint](https://img.shields.io/badge/Linter-Oxlint%20(104%20rules)-green)](https://oxc.rs)
[![Tests: Node Native Test](https://img.shields.io/badge/Tests-34%20Passing-brightgreen)](./src/tests/)
[![React](https://img.shields.io/badge/React-19.3.1-61DAFB?logo=react)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-8.3.5-646CFF?logo=vite)](https://vitejs.dev)
[![Capacitor](https://img.shields.io/badge/Capacitor-8.6.0-119EFF?logo=capacitor)](https://capacitorjs.com)
[![Platform](https://img.shields.io/badge/Platform-Android%20%7C%20iOS%20%7C%20Web-blue)]()

---

## 🌟 مميزات التطبيق الأساسية (Core Features)

1. **شاشة إقلاع سينمائية مدمجة (Interactive Splash Screen):** فيديو Full HD 1080p مدمج محلياً بخلفية بيضاء نقية وتأخير 0 ثانية بدون أي أيقونات تشغيل أو أشرطة سوداء.
2. **التقاط الموقع ومطابقته بحدود مصر (GPS & Boundary Check):** التقاط إحداثيات GPS وتحويلها لعنوان عربي مختصر عبر Nominatim مع منع الإحداثيات خارج مصر.
3. **خدمة «محاميك حالاً» (Lawyer Now):** خريطة ملاحة حية (Leaflet + Valhalla) تعرض أقرب المحامين المعتمدين المربوطين بشبكة الطرق الأسفلتية الحقيقية مع حساب المسافة وزمن الوصول بالسيارة (ETA).
4. **آلة حالة متكاملة لدورة الطلب (Order Lifecycle FSM):** فحص الملف الشخصي، اختيار محامٍ بديل («محامٍ آخر»)، إرسال الطلب، موافقة المحامي، تقييم السعر، الدفع، وتتبع المحامي في الطريق (`EN_ROUTE`).
5. **نظام توجيه داخلي مقاوم لإعادة التحميل (Zero-Reload Hash Router):** مسارات داخلية محصنة ضد أخطاء 404 مع دعم زر الرجوع الفعلي للهواتف الذكية.
6. **هوية بصرية موحدة:** عائلة خطوط `ThmanyahSans`، حواف ناعمة `7px` للأزرار والحقول، وبطاقات سفلية `50vh` قابلة للسحب للطي والفتح.

---

## 🏗️ البنية المعمارية للمشروع (Architecture Overview)

```text
my_lawyer/
├── .github/workflows/          # خطوط النشر التلقائي واختبارات الجودة (CI/CD)
├── android/                    # كود مشروع أندرويد الأصلي (Capacitor 8 + Gradle)
├── ios/                        # كود مشروع iOS الأصلي (Capacitor 8)
├── deploy/                     # إعدادات نشر خادم الخرائط والـ VPS (Docker & Nginx)
├── docs/                       # التوثيق المعماري والبنية التحتية
├── src/
│   ├── assets/                 # الخطوط الرسمية ThmanyahSans والفيديو والرسوم التوضيحية
│   ├── components/             # المكونات المشتركة (Buttons, Inputs, Headers, Map, Modals)
│   ├── constants/              # حدود جمهورية مصر، ألوان الهوية، الثوابت الجغرافية
│   ├── hooks/                  # آلات الحالة (useLawyerNowOrderFlow, useNearbyLawyersRoute)
│   ├── lib/                    # مكتبة الأمان وتطهير النصوص (security.js)
│   ├── router/                 # نظام التوجيه الداخلي المستقر (RouterContext & useRouter)
│   ├── screens/                # شاشات التطبيق الرئيسية (Auth, Home, Location, LawyerNow, Orders, Wallet, Account)
│   ├── services/               # محركات التوجيه البري والترتيب (mapService.js, lawyerService.js)
│   └── tests/                  # 34 اختباراً آلياً شاملاً للوحدات والتكامل
├── AGENTS.md                   # القواعد الإلزامية الصارمة للمطورين ونماذج الذكاء الاصطناعي
├── PROJECT_GUIDE.md            # الدليل الهندسي الشامل لكافة خدمات وملفات المشروع
├── SERVER_ACCESS_AND_STATUS.md # دليل بيانات الاتصال وإدارة خادم VPS
└── SERVER_AND_ARCHITECTURE_REPORT.md # تقرير التحليل المعماري الشامل وخطة الباك إند
```

---

## 🚀 أوامر التشغيل والتحقق السريع (Commands)

```bash
# 1. تثبيت الاعتماديات
npm install

# 2. تشغيل السيرفر المحلي للتطوير
npm run dev

# 3. تشغيل الفحص والتحليل الساكن للكود (Oxlint)
npm run lint

# 4. تشغيل الاختبارات الآلية (34 اختبار وحدة وتكامل)
npm test

# 5. بناء نسخة الإنتاج للويب
npm run build

# 6. مزامنة تطبيق أندرويد وبناء APK
npx cap sync android
cd android && ./gradlew assembleDebug
```

---

## 🔒 الأمان والمصادقة (Security Policy)

- تطهير كافة المدخلات ضد هجمات XSS وحقن النصوص عبر `sanitizeText`.
- التحقق الصارم من صحة أرقام الهواتف المصرية والبروتوكولات الآمنة.
- منع ثغرات Prototype Pollution عبر `safeJsonParse`.
- عدم حفظ أي كلمات مرور أو مفاتيح سرية في الكود المصدري؛ تُدار جميع الأسرار عبر متغيرات البيئة و GitHub Secrets.

---

## 📄 التوثيق المرجعي
- [AGENTS.md](./AGENTS.md): القواعد السبعة عشر الإلزامية للمطورين.
- [PROJECT_GUIDE.md](./PROJECT_GUIDE.md): الدليل الهندسي وخريطة الخدمات.
- [SERVER_ACCESS_AND_STATUS.md](./SERVER_ACCESS_AND_STATUS.md): بيانات خادم VPS والمنافذ المحمية.
- [SERVER_AND_ARCHITECTURE_REPORT.md](./SERVER_AND_ARCHITECTURE_REPORT.md): التقرير التقني الشامل وخيارات الباك إند.
