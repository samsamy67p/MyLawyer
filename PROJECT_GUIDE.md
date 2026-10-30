# دليل المشروع الهندسي الشامل — MyLawyer (ماي لوير)

هذا الدليل يعكس البنية الفعلية والمتحقق منها لتطبيق **MyLawyer (`com.mylawyer.app`)** بعد إعادة الهيكلة والتنظيف. جميع أسماء الملفات والدوال والمكونات المذكورة هنا مطابقة للكود المصدري الفعلي في `d:\MO7AMEK\my_lawyer`.

---

## 1. الغرض الفعلي للمشروع ونطاقه

**MyLawyer (ماي لوير)** هو تطبيق هجين للهواتف الذكية (Android و iOS عبر **Capacitor 8**) والويب مبني بـ **React 19** و **Vite 8** و **Tailwind CSS v4**، مخصص لربط الموكلين في جمهورية مصر العربية بأقرب المحامين المعتمدين المتاحين حولهم لحظياً، مع توفير:
- تسجيل الدخول أو الدخول كزائر (`LoginScreen`).
- التقاط الموقع الجغرافي الفعلي عبر الـ GPS وتحويله إلى عنوان نصي باللغة العربية (`LocationScreen` + `reverseGeocode`).
- تأكيد الموقع على خريطة تفاعلية مقيدة بحدود مصر (`MapScreen`).
- لوحة خدمات فورية (`HomeScreen`).
- نظام **«محاميك حالاً»** للطلب الفوري عبر خطوتين (`LawyerNowRequestScreen`) لتحديد نوع المشكلة ووصفها، يليها خريطة ملاحة حية (`LawyerNowScreen`) تعرض المحامين الفعليين المربوطين بشبكة الطرق البرية (`Valhalla / OSRM`) مع حساب المسافة الفعلية بالكيلومتر ووقت الوصول بالدقائق، وبطاقات سفلية قابلة للسحب للطي والفتح.

---

## 2. متطلبات التشغيل والبناء والتحقق

### بيئة التشغيل المطلوبة:
- **Node.js:** الإصدار `20.x` أو أحدث (تم التحقق على بيئة Windows مع `npm.cmd`).
- **Java JDK (لبناء Android APK):** **JDK 21** (`C:\Program Files\Java\jdk-21`) مطلوب لتوافق Gradle في Capacitor 8.
- **Android SDK / ADB:** لبناء وتثبيت نسخة الأندرويد عبر `gradlew.bat assembleDebug`.

### الأوامر الفعلية المعتمدة في `package.json`:
```bash
# 1. تشغيل خادم التطوير المحلي (Vite Dev Server)
npm.cmd run dev -- --host

# 2. تشغيل التحليل الساكن للكود (Oxlint - 104 قاعدة)
npm.cmd run lint

# 3. تشغيل اختبارات الوحدات والتكامل والشاشات (35 اختباراً آلياً)
npm.cmd test

# 4. بناء نسخة الإنتاج للويب و Capacitor
npm.cmd run build

# 5. مزامنة وبناء تطبيق Android (عند تعديل إضافات Capacitor الأصلية)
npx.cmd cap sync android
cd android && .\gradlew.bat assembleDebug
```

---

## 3. خريطة المجلدات والملفات ومسؤولية كل ملف

```text
my_lawyer/
├── .env.example                                  # متغيرات البيئة لخوادم المسارات والبلاطات في الإنتاج
├── AGENTS.md                                     # القواعد الإلزامية للنماذج والمطورين قبل أي تعديل
├── PROJECT_GUIDE.md                              # هذا الدليل الهندسي الشامل
├── capacitor.config.json                         # إعدادات Capacitor (appId: com.mylawyer.app)
├── package.json                                  # الاعتماديات وأوامر التشغيل والاختبار والبناء
├── deploy/
│   └── maps-server/                              # إعدادات جاهزة لتشغيل خادم Valhalla + Nginx خاص بمصر
│       ├── docker-compose.yml
│       └── nginx.conf
├── docs/
│   ├── 01_ARCHITECTURE_OVERVIEW.md               # نظرة عامة على المعمارية وهيكل الطبقات الموزعة
│   ├── 02_API_REFERENCE.md                       # الدليل المرجعي الكامل لواجهات برمجة التطبيقات (Fastify REST)
│   ├── 03_DATABASE_SCHEMA.md                     # مخطط قاعدة البيانات PostgreSQL 16 والترحيلات والفهارس
│   ├── 04_MOBILE_ANDROID_IOS.md                  # دليل تطوير وبناء تطبيقات الهواتف الذكية (Android & iOS)
│   ├── 05_SERVER_DEVOPS_DEPLOYMENT.md            # دليل إدارة الخادم والعمليات والنشر الذري والنسخ الاحتياطي
│   ├── 06_DEVELOPER_GUIDE.md                     # دليل المطور وإرشادات المساهمة وقائمة تحقق PR
│   ├── CI_CD_AND_DEPLOYMENT_GUIDE.md             # دليل دورة التطوير والنشر التلقائي الذري وإدارة الإصدارات
│   └── MAPS_PRODUCTION_INFRASTRUCTURE.md         # توثيق تشغيل خادم الخرائط للإنتاج التجاري
├── backend/
│   ├── migrations/                               # ترحيلات SQL المرقمة (001_initial_schema.sql)
│   ├── src/
│   │   ├── config/                               # إعدادات البيئة
│   │   ├── database/                             # مجمع pg ومحرك الترحيل (migrate.ts)
│   │   ├── modules/                              # وحدات auth, users, lawyers, admin
│   │   ├── services/                             # خدمات البريد والتشفير
│   │   ├── utils/                                # دوال الأمان والتحقق
│   │   ├── app.ts                                # إعداد تطبيق Fastify والحماية
│   │   └── server.ts                             # نقطة بدء خادم الـ API
│   └── package.json                              # اعتماديات الباك إند وأوامر build, migrate, lint
└── src/
    ├── main.jsx                                  # نقطة الدخول لـ React 19 وربط شجرة المكونات بـ #root
    ├── App.jsx                                   # الجذر الرئيسي: إدارة التنقل، الجلسة، وزر الرجوع في الهاتف
    ├── index.css                                 # تعريف خط ThmanyahSans، متغيرات الهوية، وقواعد CSS العامة
    ├── assets/
    │   ├── undraw_ask-online_8zdn.svg            # رسمة صفحة "ما مشكلتك" (الخطوة 1)
    │   ├── fonts/
    │   │   ├── thmanyah-sans-Light.otf           # خط ثمانية (وزن خفيف)
    │   │   ├── thmanyah-sans-Regular.otf         # خط ثمانية (وزن عادي 400)
    │   │   ├── thmanyah-sans-Medium.otf          # خط ثمانية (وزن متوسط 500)
    │   │   ├── thmanyah-sans-Bold.otf            # خط ثمانية (وزن عريض 700)
    │   │   └── thmanyah-sans-Black.otf           # خط ثمانية (وزن ثقيل 900)
    │   └── illustrations/
    │       ├── auth-safe.svg                     # رسمة شاشة تسجيل الدخول
    │       ├── location-tracking.svg             # رسمة شاشة تحديد الموقع
    │       ├── undraw_confirmed_c5lo.svg         # رسمة شاشة تأكيد إتمام الدفع («تم الدفع بنجاح»)
    │       ├── undraw_finding-the-way_qp1z.svg   # رسمة مرحلة انتظار قبول المحامي للطلب
    │       ├── undraw_global-team_8jok.svg       # رسمة البنر الترويجي لخدمة "محاميك حالاً" أعلى الرئيسية
    │       ├── undraw_judge_hyqv.svg             # رسمة زر خدمة "محاميك حالاً" في الصفحة الرئيسية
    │       ├── undraw_signed-document_y8vk.svg   # رسمة بنر وصف خدمة "صياغة ومراجعة العقود"
    │       └── undraw_transfer-money_5wd8.svg    # رسمة شاشة ما قبل تأكيد الدفع («تأكيد الطلب والدفع»)
    ├── components/
    │   ├── common/
    │   │   ├── LawyerProfileModal.jsx            # بطاقة ملف المحامي السفلية (منسقة وقابلة للسحب للإغلاق)
    │   │   ├── LawyerProfileModal.css            # تنسيقات بطاقة ملف المحامي ومحاذاة RTL لليمين
    │   │   ├── LawyerOrderStages.jsx             # مراحل طلب المحامي المفصولة (تقييم السعر، الجاهزية، الانتظار، القرار)
    │   │   ├── ServiceRow.jsx                    # صف الخدمة الموحد في الصفحة الرئيسية
    │   │   └── ServiceRow.css                    # تنسيقات صف الخدمة
    │   ├── feedback/
    │   │   ├── OfflineView.jsx                   # شاشة انقطاع الاتصال بالإنترنت مع زر إعادة المحاولة
    │   │   ├── OfflineView.css
    │   │   ├── ScreenErrorBoundary.jsx           # حاجز أخطاء واجهات الشاشات
    │   │   ├── ScreenLoader.jsx                  # مؤشر التحميل الانتقالي بين الشاشات
    │   │   ├── ScreenLoader.css
    │   │   └── ScreenWrapper.jsx                 # غلاف موحد وآمن للشاشات يدمج Suspense مع Error Boundary
    │   ├── layout/
    │   │   ├── Header.jsx                        # الهيدر الرئيسي (MyLawyer في المنتصف، بحث يمين، جرس يسار)
    │   │   ├── Header.css
    │   │   ├── BottomNav.jsx                     # شريط التنقل السفلي الموحد للموكل والمحامي
    │   │   └── BottomNav.css
    │   ├── map/
    │   │   ├── MapActionController.jsx           # التحكم في كاميرا Leaflet، التوسيط فوق البطاقة، و ResizeObserver
    │   │   ├── MapMarkerIcons.js                 # أيقونات دبابيس الخريطة (دبوس المستخدم الأحمر ودبوس المحامي المتوهج)
    │   │   ├── ResilientTileLayer.jsx            # طبقة البلاطات المقاومة للأعطال مع 4 مرايا احتياطية وتعافي تلقائي
    │   │   └── RouteStatusBadge.jsx              # شارة حالة المسار العائمة (LOADING / OK / ERROR) المشتركة
    │   └── ui/
    │       ├── Button.jsx                        # زر موحد بحواف 7px وحالات تحميل وأنماط (primary, secondary, outline)
    │       └── Input.jsx                         # حقل إدخال موحد بحواف 7px ودعم الأيقونات والعناصر الجانبية
    ├── constants/
    │   ├── demoUsers.js                          # حسابات تجريبية للمعاينة السريعة (الموكل الزائر ومحامي الديمو)
    │   ├── geo.js                                # حدود مصر (EGYPT_BOUNDS, EGYPT_MAX_BOUNDS) ودوال التحقق من الإحداثيات
    │   └── theme.js                              # ثوابت الألوان وإعدادات الهوية (APP_CONFIG, THEME_COLORS)
    ├── hooks/
    │   ├── useLawyerNowOrderFlow.js              # آلة الحالة الموحدة لدورة طلب المحامي وتقييم السعر والدفع والقبول
    │   ├── useNearbyLawyersRoute.js              # هوك مشترك لجلب المحامين المربوطين بالطرق وحساب المسار الفعلي
    │   └── useNetworkStatus.js                   # هوك مراقبة حالة الشبكة عبر @capacitor/network
    ├── lib/
    │   ├── security.js                           # أدوات الأمان وفلترة النصوص وتطهير الروابط وJSON الآمن
    │   └── utils.js                              # دالة cn لدمج كلاسات Tailwind عبر clsx و tailwind-merge
    ├── router/
    │   ├── routes.js                             # تعريف مسارات التطبيق المعتمدة (ROUTES) وتطبيع الروابط والتحقق من صحتها
    │   ├── context.js                            # React Context لنظام التوجيه
    │   ├── RouterContext.jsx                     # موفر التوجيه (RouterProvider) وإدارة سجل التنقل والتوافق مع زر الرجوع في Capacitor
    │   ├── useRouter.js                          # هوك مخصص لاستهلاك مسار التنقل ودوال الانتقال (navigate, goBack)
    │   └── index.js                              # نقطة التصدير الموحدة لنظام التوجيه
    ├── screens/
    │   ├── Account/
    │   │   ├── AccountScreen.jsx                 # شاشة الحساب الشخصي وإعدادات التنبيهات والخصوصية وتسجيل الخروج
    │   │   └── AccountScreen.css
    │   ├── Auth/
    │   │   ├── LoginScreen.jsx                   # شاشة تسجيل الدخول ودخول الزائر ودخول المحامي التجريبي
    │   │   ├── LoginScreen.css
    │   │   ├── RegisterScreen.jsx                # شاشة تسجيل حساب جديد
    │   │   ├── OtpVerificationScreen.jsx         # شاشة التحقق من كود الـ OTP
    │   │   ├── AccountStatusScreen.jsx           # شاشة حالة الحساب المعلق أو قيد المراجعة للمحامي
    │   │   └── ForgotPasswordScreen.jsx          # شاشة استعادة كلمة المرور
    │   ├── Home/
    │   │   ├── HomeScreen.jsx                    # الشاشة الرئيسية وعرض شريط الموقع وقائمة الخدمات الفورية
    │   │   └── HomeScreen.css
    │   ├── Location/
    │   │   ├── LocationScreen.jsx                # شاشة التقاط إحداثيات الـ GPS وتحويلها لعنوان نصي
    │   │   └── LocationScreen.css
    │   ├── Map/
    │   │   ├── MapScreen.jsx                     # شاشة تأكيد موقع المستخدم على الخريطة مع تحديث مباشر للموقع
    │   │   └── MapScreen.css
    │   ├── Orders/
    │   │   ├── OrdersScreen.jsx                  # شاشة الطلبات والاستشارات الجارية والسابقة وفلاتر الحالات
    │   │   └── OrdersScreen.css
    │   ├── Wallet/
    │   │   ├── WalletScreen.jsx                  # شاشة المحفظة والرصيد المتاح وسجل المعاملات
    │   │   └── WalletScreen.css
    │   ├── Lawyer/
    │   │   ├── LawyerDashboardScreen.jsx         # شاشة لوحة تحكم المحامي ومنظم التبويبات المتناسق مع تصميم الموكل
    │   │   ├── tabs/
    │   │   │   ├── LawyerHomeTab.jsx             # تبويب رئيسية المحامي (كارت تعريفي، حالة التوفر، إحصائيات سريعة، إجراءات)
    │   │   │   ├── LawyerOrdersTab.jsx           # تبويب طلبات المحامي الواردة مع فلاتر الحالات
    │   │   │   ├── LawyerWalletTab.jsx           # تبويب محفظة أتعاب المحامي وإمكانية سحب الأرباح
    │   │   │   └── LawyerAccountTab.jsx          # تبويب حساب المحامي والمكتب وساعات العمل
    │   │   └── components/
    │   │       └── LawyerWithdrawModal.jsx       # نافذة طلب سحب الأرباح للمحامي (فودافون كاش / إنستاباي / بنكي)
    │   └── LawyerNow/
    │       ├── LawyerNowRequestScreen.jsx        # شاشة "ما مشكلتك" (خطوة 1: اختيار الخدمة، خطوة 2: وصف المشكلة)
    │       ├── LawyerNowRequestScreen.css
    │       ├── LawyerNowScreen.jsx               # شاشة خريطة "محاميك حالاً" والبطاقة السفلية القابلة للسحب
    │       ├── LawyerNowScreen.css
    │       └── components/
    │           ├── LawyerEnRouteSheetContent.jsx # محتوى البطاقة النهائية لتتبع المحامي في الطريق وأزرار الاتصال والمحادثة
    │           └── LawyerNowPaymentOverlay.jsx   # شاشة الدفع وتأكيد الرسوم المقدرة
    ├── services/
    │   ├── apiClient.js                          # عميل الـ API الموحد لإدارة التوكن وجلسات المستخدم
    │   ├── lawyerService.js                      # توليد المحامين المرشحين وربطهم بالطرق وترتيبهم واختيار المحامي البديل وتقييم الرسوم
    │   └── mapService.js                         # محرك التوجيه البري (Valhalla/OSRM)، فك ترميز Polyline6، والـ LRU Cache
    └── tests/
        ├── mapAndRouting.test.js                 # 20 اختباراً آلياً للتحقق من الإحداثيات والمسارات الساحلية وترتيب المحامين البدلاء وآلة حالة الطلب
        ├── routing.test.js                       # 4 اختبارات آلية للتحقق من سلامة نظام التوجيه وتطبيع المسارات ومنع التكرار
        ├── security.test.js                      # 5 اختبارات للأمان وتطهير المدخلات وفحص الهواتف المصرية
        └── splash.test.js                        # 5 اختبارات لشاشة البداية الحركية وتوقيتاتها المزامنة
```

---

## 4. البنية المعمارية وتدفق البيانات والتنقل

### 4.1 لماذا هذه البنية المعمارية؟
يتبع المشروع بنية **Modular Feature + Shared Services/Hooks Architecture**:
- فصل كامل لمنطق الجغرافيا والشبكات في `src/services/` و `src/constants/geo.js` بحيث يعمل بمعزل عن React ويمكن اختباره مباشرة عبر `node --test`.
- استخراج منطق الحالة المشترك بين شاشات الخريطة في الهوك [`useNearbyLawyersRoute`](src/hooks/useNearbyLawyersRoute.js) لمنع تكرار الكود وضمان وحدة مصدر البيانات (Single Source of Truth).
- إبقاء مكونات الشاشات في `src/screens/` مسؤولة فقط عن العرض وتفاعل المستخدم.

### 4.2 آلية التنقل وزر الرجوع الفعلي (`Hardware Back Button` في `App.jsx`)
يدير [`App.jsx`](src/App.jsx) التنقل بين الشاشات مع مستمع مركزي وحيد لحدث `backButton` من `@capacitor/app` وفق الأولويات الصارمة التالية:
1. **الأولوية 1 (`activeModalDismissRef`):** إذا كانت نافذة ملف المحامي (`LawyerProfileModal`) مفتوحة، أو كان المستخدم في الخطوة 2 داخل `LawyerNowRequestScreen`، فإن زر الرجوع يغلق النافذة المنبثقة أو يعود للخطوة 1 فقط دون مغادرة الشاشة.
2. **الأولوية 2 (`isLawyerNowMapOpen`):** إذا كان في خريطة «محاميك حالاً»، يعود إلى شاشة «ما مشكلتك» (`LawyerNowRequestScreen`).
3. **الأولوية 3 (`isLawyerNowOpen`):** إذا كان في شاشة «ما مشكلتك»، يعود إلى الشاشة الرئيسية (`HomeScreen`).
4. **الأولوية 4 (`isMapScreenOpen`):** إذا كان في خريطة تأكيد الموقع (`MapScreen`)، يعود إلى شاشة الموقع (`LocationScreen`).
5. **الأولوية 5 (`!isLocationDone` مع وجود موقع سابق):** يعود إلى الشاشة الرئيسية (`HomeScreen`).
6. **الأولوية 6 (الشاشة الجذرية `HomeScreen` أو `LoginScreen`):** يتطلب ضغطتين متتاليتين خلال ثانيتين (`2000ms`) للخروج من التطبيق مع إظهار إشعار `اضغط مرة أخرى للخروج من التطبيق`.

### 4.3 قاعدة تصفير حالة الخدمات المتكررة (`requestSessionId`)
جميع خدمات التطبيق (مثل «محاميك حالاً») هي خدمات متكررة يطلبها المستخدم أكثر من مرة؛ لذلك يعتمد `App.jsx` على عداد جلسة الطلب (`requestSessionId`) كمفتاح (`key`) لمكوني `LawyerNowRequestScreen` و `LawyerNowScreen`، ولا يتم تخزين نصوص المشكلة أو الاختيارات السابقة بعد مغادرة الشاشة أو العودة إليها، مما يضمن أن يبدأ كل طلب جديد بحقول نصية فارغة تماماً ومن الخطوة الأولى.

---

## 5. الخدمات ومصادر البيانات وعقود الـ API الفعلية

### 5.1 خدمة المسارات والملاحة (`src/services/mapService.js`)
- **`getRoadNavigationRoute(startCoords, endCoords, options)`:**
  - يتحقق أولاً من صحة الإحداثيات ووقوعها داخل نطاق تغطية مصر (`isWithinEgyptBounds`).
  - يدمج الطلبات المتزامنة المتطابقة (`inflightRequests`) ويقرأ من ذاكرة `LRU Cache` بمهلة صلاحية 5 دقائق.
  - يطلب المسار الفعلي للسيارة (`costing: 'auto'`) من محرك **Valhalla** (`/route`)، ويفك ترميز `Polyline6` عبر `decodePolyline`، ويتحقق من سلامة الهندسة عبر `validateRouteGeometry` (يرفض الخطوط المستقيمة الوهمية أو القفزات غير المنطقية).
  - في حال تعذر الوصول لـ Valhalla، ينتقل تلقائياً إلى محرك **OSRM** الاحتياطي مع التحقق الهندسي ذاته.
  - عند فشل الحساب أو وقوع النقطة في البحر، يُرجع `status: 'UNREACHABLE'` أو `'NETWORK_ERROR'` ولا يرسم أبداً خطاً مستقيماً وهمياً.
- **`snapAndComputeRoadMatrix(userCoords, targetCandidates, options)`:**
  - يستخدم نقطة نهاية `/sources_to_targets` في Valhalla لحساب مصفوفة المسافات والأزمنة الفعلية بالسيارة وربط النقاط بأقرب طريق بري.
- **`reverseGeocode(latitude, longitude, options)`:**
  - يحول الإحداثيات إلى عنوان عربي مختصر عبر Nominatim OpenStreetMap API مع التخزين المؤقت.

### 5.2 خدمة المحامين وربطهم بالطرق البرية والترتيب متعدد المعايير وتقييم الرسوم (`src/services/lawyerService.js`)
- **`resolveRoadSnappedLawyers(userLat, userLon, options)`:**
  - يولد 8 مواقع مرشحة في اتجاهات متعددة حول المستخدم، ويفحصها عبر `snapAndComputeRoadMatrix`، ثم يختار أفضل 4 مواقع متباعدة تقع على طرق برية حقيقية قابلة للوصول بالسيارة (مما يمنع ظهور دبابيس المحامين في البحر المتوسط أو البحر الأحمر أو نهر النيل في المدن الساحلية والنهرية).
- **`computeLawyerSuitabilityScore(lawyer)` و `rankLawyersBySuitability(lawyers)`:**
  - آلية الترتيب المركزية الموحدة التي ترتب المحامين حتمياً (دون أي عشوائية) بناءً على توازن ثلاثي المعايير:
    1. **حالة الاتصال الفعلية (`isOnline === true`):** أولوية قصوى للمحامين المتصلين فعلياً (`+45` نقطة) مع عدم افتراض اتصال أي محامي غير متصل.
    2. **القرب الجغرافي البري (`distanceMeters` / `distanceKm`):** درجة قرب متدرجة (`0–55` نقطة) تمنح المحامي الأقرب على شبكة الطرق أفضلية واضحة.
    3. **التقييم والخبرة المهنية (`rating` و `experienceYears`):** درجة جودة (`0–45` نقطة) تضمن تفضيل المحامي الأعلى تقييماً وخبرة عند تقارب المسافات.
- **`selectNextAlternativeLawyer(lawyers, currentLawyerId, visitedLawyerIds)`:**
  - محرك اختيار المحامي البديل عند الضغط على زر **«محامٍ آخر»** داخل `LawyerProfileModal`:
    - يستبعد المحامي المعروض حالياً (`currentLawyerId`) بشكل قاطع حتى لا يظهر كبديل لنفسه.
    - يتجنب تكرار المحامين الذين سبق عرضهم في جلسة التصفح الحالية (`visitedLawyerIds`) طالما توجد خيارات أخرى غير معروضة، مع تقديم البدائل المتصلة (`isOnline === true`) أولاً، ثم البدائل غير المتصلة إن لزم، ولا يعيد الدورة إلا بعد استنفاد جميع البدائل المتاحة.
    - يتكامل مع الهوك `useNearbyLawyersRoute` لتحديث المحامي المستهدف على الخريطة (`activeTargetLawyerId`)، وملف المحامي (`selectedLawyerId`)، وحساب المسار البري الفعلي وتوسيط الكاميرا (`FOCUS_LAWYER`) في آنٍ واحد.
- **`evaluateLawyerNowRequestFee(lawyer, requestDetails)` و `processLawyerNowPayment(payload, options)`:**
  - دالة تقييم حتمية تحسب رسوم الخدمة المصغرة (بالجنيه المصري) بناءً على نوع المشوار المختار في الخطوة الأولى (`police`, `prosecution`, `admin`, `notary`, `certificates`, `quick-session`) والمسافة الفعلية للمحامي على الطريق، لتكون المصدر الوحيد للسعر في بطاقة التقييم وشاشة الدفع.
  - دالة معالجة الدفع `processLawyerNowPayment` تتحقق من صحة البيانات وتدعم الإلغاء عبر `AbortController` ولا تُرجع حالة النجاح (`status: 'SUCCESS'`) ورقم العملية (`transactionId`) إلا بعد اكتمال المعالجة الفعلية بنجاح.

### 5.3 آلة الحالة لدورة طلب «محاميك حالاً» والدفع والرجوع (`src/hooks/useLawyerNowOrderFlow.js`)
يدير الهوك `useLawyerNowOrderFlow` والدالة النقية `transitionLawyerNowOrderState` مراحل الطلب والموافقة المسبقة وتقييم السعر والدفع مع عدادات تسلسل (`flowSeqRef`) وقفل منع تكرار الدفع (`isPaymentInFlightRef`) وتنظيف آلي للمؤقتات (`clearTimeout`):
1. **`PROFILE` (داخل `LawyerProfileModal`):** عرض ملف المحامي وزرّي «طلب الآن» و«محامٍ آخر» وزر الرجوع.
2. **`WAITING_ACCEPTANCE` (داخل `LawyerProfileModal`):** إرسال الطلب للمحامي أولاً وعرض الرسم التوضيحي `undraw_finding-the-way_qp1z.svg` وصورة المحامي مفصولة بصرياً بمسافة متناسقة عن النصوص وعنوان «في انتظار قبول المحامي لطلبك...» قبل تقييم السعر أو فتح الدفع.
3. **`LAWYER_DECISION` (داخل `LawyerProfileModal` لمدة 3 ثوانٍ تنازلياً):**
   - كارت يوضح قرار المحامي في المنتصف مع عداد تنازلي 3 ثوانٍ:
     - **في حالة القبول (`ACCEPTED`):** أيقونة خضراء «وافق المحامي على طلبك»، ثم الانتقال التلقائي لمرحلة تقييم السعر (`EVALUATING_PRICE`).
     - **في حالة الاعتذار (`REJECTED`):** أيقونة حمراء «اعتذر المحامي عن استلام الطلب»، ثم العودة لملف المحامي لتمكين المستخدم من اختيار «محامٍ آخر».
4. **`EVALUATING_PRICE` (داخل `LawyerProfileModal` لمدة 1 ثانية):** بعد موافقة المحامي على الطلب (`isLawyerAccepted: true`)، عرض «جاري تقييم سعر طلبك الآن...».
5. **`PRICE_READY` (داخل `LawyerProfileModal`):** عرض تأكيد موافقة المحامي والسعر المقدر مباشرة بدون حاويات إضافية مع زر «دفع الآن» وزر الرجوع.
6. **`PAYMENT` (`LawyerNowPaymentOverlay`):**
   - مرحلة ما قبل تأكيد الدفع (`PAYMENT_STATUS.IDLE` / `PROCESSING` / `FAILED`) مع الرسم التوضيحي `undraw_transfer-money_5wd8.svg` داخل مساحة ثابتة محجوزة مسبقاً (`165x125px`) مع أنيميشن ظهور ناعم (`Zero Layout Shift`).
   - عند الضغط على «إتمام الدفع»، تظهر حالة التحميل (`PROCESSING`) ويُمنع الضغط المتكرر أو الرجوع العشوائي أثناء المعالجة.
   - في حال فشل الدفع (`FAILED`)، تعرض رسالة الخطأ داخل شاشة الدفع ولا ينتقل المستخدم إلى شاشة النجاح.
   - بعد تأكيد نجاح العملية الفعلي (`CONFIRMED`)، تعرض شاشة **«تم الدفع بنجاح»** مع الرسم التوضيحي `undraw_confirmed_c5lo.svg` داخل مساحة محجوزة مسبقاً مع أنيميشن ظهور ناعم، وجدول منظم لمعلومات الدفع، وعداد تنازلي لمدة 5 ثوانٍ للانتقال مباشرة إلى مرحلة تتبع المحامي في الطريق.
7. **`EN_ROUTE` (`LawyerEnRouteSheetContent`):** البطاقة النهائية «تم طلب المحامي وهو في الطريق إليك الآن» مع الوقت المقدر للوصول والمسافة الفعلية وزرّي «اتصال بالمحامي» و«محادثة فورية» وزر الرجوع الموحد.

### 5.4 نظام الانتقال السلس ومنع الشاشات البيضاء (Smooth Routing Architecture)
- **`startTransition` في [`src/router/RouterContext.jsx`](src/router/RouterContext.jsx):** إبقاء الشاشة الحالية معروضة أثناء استدعاء الشاشات المحمّلة كودياً لمنع الوميض أو الفراغ الأبيض.
- **`ScreenErrorBoundary` في [`src/components/feedback/ScreenErrorBoundary.jsx`](src/components/feedback/ScreenErrorBoundary.jsx):** احتواء أخطاء عرض الشاشات دون إسقاط شجرة التطبيق بالكامل.
- **`OfflineView` كطبقة علوية في [`src/App.jsx`](src/App.jsx):** الحفاظ على حالة الجلسة والتنقل عند فقدان الإنترنت دون إعادة توجيه المستخدم أو تصفير الشاشة.
- **بانرات التمرير في [`src/screens/Home/HomeScreen.jsx`](src/screens/Home/HomeScreen.jsx):** حاوية أفقية `scroll-snap-type: x mandatory` تتيح التمرير اليدوي السلس للمستخدم إلى جانب الانزلاق التلقائي كل 5 ثوانٍ.
- **تسجيل الخروج المباشر في [`src/screens/Account/AccountScreen.jsx`](src/screens/Account/AccountScreen.jsx):** الانتقال الفوري لصفحة الدخول مع تصفير سجل التنقل بالكامل.

### 5.5 شاشة البداية السينمائية المعتمدة على الفيديو (Cinematic Video Splash Screen)
- **المكون:** [`src/components/splash/InteractiveSplashScreen.jsx`](src/components/splash/InteractiveSplashScreen.jsx) مع ملف الأنماط [`src/components/splash/InteractiveSplashScreen.css`](src/components/splash/InteractiveSplashScreen.css).
- **أصل الفيديو (Offline Video Asset):** فيديو بدقة فائقة Full HD 1080x1920 وبخلفية بيضاء نقية دائمة (`#FFFFFF`) مدمج ومضغوط محلياً داخل التطبيق بحجم فائق الخفة (626KB) في [`src/assets/splash_video.mp4`](src/assets/splash_video.mp4).
- **التشغيل الفوري والأداء (Zero Latency & 60fps):**
  - يعمل بدون تحميل شبكي في 0 جزء من الثانية عبر `autoPlay muted playsInline preload="auto"`.
  - تغطية الشاشة بالكامل عبر `object-fit: cover` لمنع أي حواف أو أشرطة سوداء على كافة أبعاد الشاشات.
  - لون خلفية الحاوية الأولية ثابت على الأبيض النقي (`#FFFFFF`) ليتطابق بسلاسة مطلقة مع شاشة تسجيل الدخول (`LoginScreen`).
- **الحل الجذري لأيقونة المشغل (Zero Play-Icon Artifacts):**
  1. *ضبط إعدادات WebView الأصلي:* تفعيل `settings.setMediaPlaybackRequiresUserGesture(false)` في [`MainActivity.java`](android/app/src/main/java/com/mylawyer/app/MainActivity.java) لمنع نظام Android من طلب إيماءة مستخدم وعرض زر التشغيل التلقائي.
  2. *صورة الغلاف الأولية المطابقة:* ربط `poster={splashPoster}` بأول إطار بدقة متطابقة.
  3. *طبقة التغطية الحاجبة (`splash-poster-cover`):* طبقة متطابقة بنسبة 100% تعلو الفيديو ولا تنكشف (`cover-hidden`) إلا عند بدء العرض الفعلي للإطارات (`onPlaying` و `onTimeUpdate`).
  4. *تجريد أدوات التحكم كلياً:* إخفاء كافة مكونات `::-webkit-media-controls` في CSS لمنع ظهور أي أيقونة أو زر تشغيل أو مؤشر تحميل نهائياً.
- **الانتقال المتصل (Seamless Transition):**
  - ينتقل الفيديو بطبيعته من الأزرق الملكي في النصف الأول إلى الأبيض النقي في النصف الثاني مع حركة أمواج وسوائل الحروف.
  - عند انتهاء الفيديو (`onEnded`) أو بحد أقصى للمؤقت الآمن، يتلاشى الغطاء بحركة انحلال ناعمة (`Fade Out`) إلى واجهة تسجيل الدخول البيضاء دون أي انقطاع.
  - إمكانية التخطي الفوري بالنقر في أي لحظة (`onClick`).
- **حماية التنقل:** محمي عبر `sessionStorage` لمنع تكراره عند التنقل الداخلي بين الشاشات أو عند الضغط على زر الرجوع.

---

## 6. القواعد البصرية الصارمة المعتمدة في المشروع

1. **الخط الرسمي:** عائلة خطوط `ThmanyahSans` فقط لكل النصوص العربية والإنجليزية والأرقام.
2. **الحواف الدائرية:** `7px` (`border-radius: 7px` / `rounded-[7px]`) لجميع الأزرار والحقول والبطاقات الداخلية، و `26px` للحواف العلوية فقط في البطاقات السفلية (`lawyer-now-bottom-sheet` و `lawyer-modal-sheet`).
3. **تباعد الأزرار:** لا يقل عن `12px` بين أي زرين متتاليين.
4. **بطاقة المحامين المتاحين وبطاقة ملف المحامي:**
   - كلاهما بنفس الارتفاع (`height: 50vh`) والعرض الأقصى (`max-width: 480px`)، بدون شريط تمرير مرئي (`scrollbar-width: none`)، وقابلتان للسحب للأسفل للإغلاق/الطي وللأعلى للفتح.
   - لا يوجد أي تغبيش (`backdrop-filter: none`) على الخريطة عند فتح ملف المحامي، وتتمركز كاميرا الخريطة تلقائياً بحيث يظهر دبوس المحامي المختار في منتصف المساحة المكشوفة من الخريطة أعلى البطاقة.

---

## 7. كيفية إضافة شاشة أو مكون أو خدمة جديدة

1. **إضافة خدمة جديدة:** أضفها في `src/services/`، والتزم بتمرير `AbortController` (`options.signal`) لأي طلب شبكي ومعالجة الأخطاء بإرجاع كائن حالة واضح، ثم أضف اختبارات لها في `src/tests/`.
2. **إضافة مكون مشترك:** أضفه في `src/components/common/` أو `src/components/ui/` فقط إذا كان يُستخدم في أكثر من شاشة وله مسؤولية واحدة واضحة، والتزم بحواف `7px` وخط `ThmanyahSans`.
3. **إضافة شاشة جديدة:** أنشئ مجلداً لها في `src/screens/NewScreen/`، واربط حالة فتحها وإغلاقها في [`src/App.jsx`](src/App.jsx) مع إضافتها إلى سلسلة أولويات مستمع زر الرجوع `backButton`.

