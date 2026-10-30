# نظرة عامة على المعمارية وهيكل النظام (System Architecture Overview)

**اسم المشروع:** MyLawyer (تطبيق ماي لوير)  
**معرف الحزمة (App Identifier):** `com.mylawyer.app`  
**المستودع الرسمي:** [`https://github.com/samsamy67p/MyLawyer`](https://github.com/samsamy67p/MyLawyer)  
**سيرفر الإنتاج:** Contabo VPS (`13.140.141.32` - Ubuntu 24.04 LTS)  

---

## 1. المخطط المعماري العام (High-Level Architecture)

يعتمد تطبيق **MyLawyer** على معمارية معيارية حديثة مفصولة وموزعة لضمان أقصى درجات الأداء والأمان وسهولة التوسع والصيانة:

```mermaid
flowchart TB
    subgraph MobileClients["أجهزة المستخدمين (Mobile & Web Clients)"]
        AndroidApp["تطبيق أندرويد الأصلي (Capacitor 8)"]
        IOSApp["تطبيق آبل iOS الأصلي (Capacitor 8)"]
        WebBrowser["متصفح الويب (PWA Ready)"]
    end

    subgraph EdgeProxy["بوابة الحماية والخدمة (Edge Reverse Proxy)"]
        NginxProxy["Nginx Web & Reverse Proxy (HTTP/2, SSL, Rate Limit)"]
    end

    subgraph ApplicationServices["خدمات التطبيق (Application Layer)"]
        FrontendSPA["الواجهة الأمامية المجمعة (React 19 + Tailwind v4 + Vite)"]
        BackendAPI["خادم واجهة البرمجة (Node.js 20 + Fastify 5 + TypeScript)"]
        OSRMServer["محرك التوجيه الجغرافي المستضاف ذاتياً (OSRM Engine)"]
    end

    subgraph DataAndStorage["قاعدة البيانات والتخزين (Persistence Layer)"]
        PostgresDB["PostgreSQL 16 (UUID, JSONB, Pgcrypto, Indexes)"]
        PrivateStorage["التخزين المحمي للمستندات والوثائق (/storage/private_docs)"]
        PublicStorage["التخزين العام لصور البروفايل (/storage/public/avatars)"]
    end

    subgraph ExternalAndMail["خدمات المراسلة والبريد (Communication Layer)"]
        PostfixDaemon["Postfix Local SMTP Relay (127.0.0.1:25)"]
        OpenDKIM["خدمة التوقيع الرقمي للبريد (OpenDKIM :8891)"]
    end

    AndroidApp -->|HTTPS / WSS| NginxProxy
    IOSApp -->|HTTPS / WSS| NginxProxy
    WebBrowser -->|HTTPS| NginxProxy

    NginxProxy -->|Static Bundle /| FrontendSPA
    NginxProxy -->|Proxy /api/v1/*| BackendAPI
    NginxProxy -->|Proxy /route/v1/*| OSRMServer

    BackendAPI -->|pg Connection Pool| PostgresDB
    BackendAPI -->|File Stream (Protected)| PrivateStorage
    BackendAPI -->|File Stream (Public)| PublicStorage
    BackendAPI -->|SMTP Port 25| PostfixDaemon
    PostfixDaemon --> OpenDKIM
```

---

## 2. تفكيك طبقات النظام (System Layers Breakdown)

### 2.1 طبقة الواجهة الأمامية (Frontend Layer)
- **المكتبات الأساسية:** React 19، Vite 6، Tailwind CSS v4.
- **التصميم والهوية البصرية:** الخط العربي المعتمد `ThmanyahSans`، ألوان رئيسية محددة (`#1D4ED8` للأزرق الأساسي، `#0F172A` للكحلي الداكن، `#F8FAFC` للخلفيات)، حواف بنصف قطر `7px` للأزرار والحقول، `5px` للهيدر، و `26px` للبطاقات السفلية.
- **نظام التوجيه الداخلي (Router):** نظام موجه Hash داخلي مخصص ومستقل تماماً عن المتصفح ومصمم خصيصاً لبيئة Capacitor WebView لمنع أي أخطاء 404 وتفادي إعادة تحميل الصفحة أو الشاشات البيضاء.
- **إدارة الحالة المشتركة (State Management):**
  - سياق التوجيه وسجل التنقل (`RouterContext.jsx`).
  - سياق المصادقة والتحقق من الجلسات وتجديد التوكن التلقائي (`AuthContext.jsx`).
  - هوكات إدارة دورة حياة الطلبات (`useLawyerNowOrderFlow.js`).
  - هوك إدارة مسارات وخوارزميات ترتيب المحامين الأقرب جغرافياً (`useNearbyLawyersRoute.js`).

### 2.2 طبقة الهاتف النقال (Mobile Hybrid Layer - Capacitor 8)
- حزمة الهجين الرسمية `@capacitor/core`, `@capacitor/android`, `@capacitor/ios` بالإصدار الثامن الحديث.
- معالجة أحداث الهاتف الأصلية:
  - إدارة إيماءة وزر الرجوع المادي في أندرويد (`App.addListener('backButton')`) بنظام الحزمة المتدرجة (LIFO Modal Stack) والتأكيد المزدوج للخروج خلال ثانيتين.
  - قفل الاتجاه الرأسي في ملف الإعداد ومنع التدوير العشوائي للشاشة.
  - التوافق مع حواف الأمان (`env(safe-area-inset-top)` و `env(safe-area-inset-bottom)`).

### 2.3 طبقة خادم واجهة التطبيقات (Backend API Layer)
- **الإطار المعتمد:** Fastify v5 مع TypeScript الصارم.
- **الوحدات الرئيسية:**
  - `auth`: التسجيل، تسجيل الدخول، التحقق من رمز OTP للبريد الإلكتروني، إدارة التوكن والتجديد المستمر، واستعادة كلمة المرور المفقودة.
  - `users`: جلب وتحديث الملف الشخصي وتغيير كلمة المرور.
  - `lawyers`: استعلام ملف المحامي، رفع المستندات الرسمية (كارنيه النقابة، البطاقة)، ورفع الصورة الشخصية.
  - `admin`: مراجعة طلبات المحامين المعلقة، والاعتماد أو الرفض أو الإيقاف مع تسجيل سجل تدقيق تاريخي كامل.
- **معايير الأمان:**
  - تشفير كلمات المرور باستخدام **Argon2id** المقاوم لهجمات القوة الغاشمة و GPU.
  - تشفير رموز OTP في قاعدة البيانات كـ SHA-256 Hashes.
  - تحديد معدل الطلبات عبر `@fastify/rate-limit` (120 طلب / دقيقة).
  - حماية الترويسات بواسطة `@fastify/helmet`.
  - معالجة واستقبال الملفات عبر `@fastify/multipart` بحد أقصى 10 ميجابايت مع التحقق من أنواع الملفات MIME.

### 2.4 طبقة البيانات والمستودع (Database & Persistence Layer)
- **المحرك:** PostgreSQL 16 LTS.
- **الامتدادات النشطة:** `uuid-ossp`, `pgcrypto`.
- **نظام الترحيل (Migrations):** ترحيلات SQL نقية مع جدول تتبع مستقل `schema_migrations`، مع دعم التحديث الذري داخل Transactions.

### 2.5 طبقة التوجيه والخرائط المستضافة ذاتياً (Self-Hosted Maps & Routing)
- محرك **OSRM (Open Source Routing Machine)** العامل عبر Docker داخل الخادم، يقدم مسارات قيادة برية حقيقية بالمسافات والأزمنة الدقيقة لشوارع مصر والقاهرة بدون أي اعتمادية خارجية أو تكلفة متكررة على واجهات Google Maps API.

---

## 3. عقود الاتصال وتدفق البيانات (Data Flow Contracts)

1. **المصادقة (JWT Architecture):**
   - **Access Token:** صلاحية قصيرة (15 دقيقة)، يُحفظ في الذاكرة مع تخزين مؤقت آمن.
   - **Refresh Token:** صلاحية طويلة (30 يوماً)، يُخزن مشفراً في قاعدة البيانات (`user_sessions`) ويخضع لعملية تدوير التوكن التلقائية (Token Rotation) عند كل تجديد، ويُبطل فورياً عند تسجيل الخروج.
2. **بروتوكول الخطأ الموحد:**
   جميع الردود ترجع بصيغة JSON موحدة:
   - في حالة النجاح: `{ "success": true, "data": { ... }, "message": "..." }`
   - في حالة الفشل: `{ "success": false, "error": "رسالة الخطأ التوضيحية" }`

