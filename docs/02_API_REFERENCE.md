# الدليل المرجعي الكامل لواجهات برمجة التطبيقات (API Reference)

**الإصدار:** v1.0.0  
**المسار الأساسي (Base URL):** `http://13.140.141.32/api/v1` (أو محلياً `/api/v1`)  
**صيغة تبادل البيانات:** JSON (`application/json`) أو `multipart/form-data` للملفات  

---

## 1. الفحص والجاهزية العامة (Health Checks)

### GET `/health`
- **الوصف:** فحص جاهزية الخادم وحالة الاتصال بقاعدة بيانات PostgreSQL.
- **الصلاحية:** عام (Public).
- **الاستجابة الناجحة (200 OK):**
```json
{
  "status": "UP",
  "database": "CONNECTED",
  "timestamp": "2026-10-30T19:30:00.000Z",
  "version": "1.0.0"
}
```

---

## 2. وحدة المصادقة والحسابات (`/auth`)

### POST `/auth/register`
- **الوصف:** تسجيل حساب جديد (موكل `client` أو محامٍ `lawyer`) وتوليد رمز تحقق OTP وإرساله عبر البريد الإلكتروني.
- **جسم الطلب (Body):**
```json
{
  "phone": "01012345678",
  "email": "user@example.com",
  "password": "StrongPassword123",
  "role": "client", // أو "lawyer"
  "fullName": "الاسم الكامل (مطلوب في حال اختيار محامٍ)",
  "syndicateNumber": "123456" // اختياري للمحامي
}
```
- **الاستجابة الناجحة (201 Created):**
```json
{
  "success": true,
  "message": "تم إنشاء الحساب بنجاح، يرجى إدخال رمز التحقق (OTP) المرسل إلى بريدك الإلكتروني",
  "data": {
    "userId": "d290f1ee-6c54-4b01-90e6-d701748f0851",
    "email": "user@example.com",
    "phone": "01012345678",
    "role": "client",
    "status": "pending_email_verification"
  }
}
```

---

### POST `/auth/verify-otp`
- **الوصف:** التحقق من رمز OTP المدخل من المستخدم وتأكيد ملكية البريد الإلكتروني.
- **جسم الطلب (Body):**
```json
{
  "email": "user@example.com",
  "otp": "482910"
}
```
- **الاستجابة الناجحة (200 OK):**
```json
{
  "success": true,
  "message": "تم تأكيد البريد الإلكتروني وتفعيل الحساب بنجاح",
  "data": {
    "accessToken": "eyJhbGciOi...",
    "refreshToken": "7a8f9c1b...",
    "user": {
      "id": "d290f1ee-6c54-4b01-90e6-d701748f0851",
      "email": "user@example.com",
      "role": "client",
      "status": "active"
    }
  }
}
```

---

### POST `/auth/resend-otp`
- **الوصف:** طلب إعادة إرسال رمز تحقق OTP جديد مع مهلة زمنية 60 ثانية لحماية الخادم من الإغراق.
- **جسم الطلب (Body):**
```json
{
  "email": "user@example.com"
}
```

---

### POST `/auth/login`
- **الوصف:** تسجيل الدخول للمستخدم بواسطة رقم الهاتف أو البريد الإلكتروني وكلمة المرور المشفرة بـ Argon2id.
- **جسم الطلب (Body):**
```json
{
  "identifier": "01012345678", // أو "user@example.com"
  "password": "StrongPassword123",
  "rememberMe": true
}
```
- **الاستجابة الناجحة (200 OK):**
```json
{
  "success": true,
  "message": "تم تسجيل الدخول بنجاح",
  "data": {
    "accessToken": "eyJhbGciOi...",
    "refreshToken": "7a8f9c1b...",
    "user": {
      "id": "d290f1ee-6c54-4b01-90e6-d701748f0851",
      "email": "user@example.com",
      "role": "client",
      "status": "active"
    }
  }
}
```

---

### POST `/auth/refresh`
- **الوصف:** تجديد صلاحية التوكن (Token Rotation) بإرسال Refresh Token ساري واستلام Access Token و Refresh Token جديدين مع إبطال القديم.
- **جسم الطلب (Body):**
```json
{
  "refreshToken": "7a8f9c1b..."
}
```

---

### POST `/auth/logout`
- **الوصف:** تسجيل الخروج وإبطال الـ Refresh Token في قاعدة البيانات.
- **الترويسات:** `Authorization: Bearer <accessToken>`
- **جسم الطلب (Body):**
```json
{
  "refreshToken": "7a8f9c1b..."
}
```

---

### POST `/auth/forgot-password`
- **الوصف:** طلب استعادة كلمة المرور عبر البريد الإلكتروني وإرسال رمز تحقق ذو استخدام واحد.
- **جسم الطلب (Body):**
```json
{
  "email": "user@example.com"
}
```

---

### POST `/auth/reset-password`
- **الوصف:** تعيين كلمة مرور جديدة بعد تأكيد رمز استعادة كلمة المرور.
- **جسم الطلب (Body):**
```json
{
  "email": "user@example.com",
  "otp": "123456",
  "newPassword": "NewStrongPassword123"
}
```

---

## 3. وحدة المستخدمين (`/users`)

### GET `/users/me`
- **الوصف:** جلب الملف الشخصي الكامل للمستخدم المسجل حالياً، وحالته، وصلاحياته.
- **الترويسات:** `Authorization: Bearer <accessToken>`
- **الاستجابة الناجحة (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "d290f1ee-6c54-4b01-90e6-d701748f0851",
    "phone": "01012345678",
    "email": "user@example.com",
    "role": "client",
    "status": "active",
    "emailVerifiedAt": "2026-10-30T18:00:00.000Z",
    "fullName": "أحمد محمود",
    "profilePhotoPath": "/uploads/avatars/avatar_123.jpg"
  }
}
```

---

### PATCH `/users/me`
- **الوصف:** تحديث بيانات المستخدم الأساسية (الاسم، النبذة التعريفية).
- **الترويسات:** `Authorization: Bearer <accessToken>`
- **جسم الطلب (Body):**
```json
{
  "fullName": "الاسم المحدث",
  "bio": "النبذة التعريفية المحدثة"
}
```

---

### POST `/users/me/change-password`
- **الوصف:** تغيير كلمة المرور بعد التحقق من كلمة المرور الحالية.
- **الترويسات:** `Authorization: Bearer <accessToken>`
- **جسم الطلب (Body):**
```json
{
  "currentPassword": "OldPassword123",
  "newPassword": "NewPassword456",
  "confirmNewPassword": "NewPassword456"
}
```

---

## 4. وحدة المحامين (`/lawyers`)

### GET `/lawyers/me`
- **الوصف:** جلب تفاصيل ملف المحامي الحالي، والمستندات المرفوعة، وحالة الموافقة من النقابة والإدارة (`pending`, `approved`, `rejected`, `suspended`).
- **الترويسات:** `Authorization: Bearer <lawyerAccessToken>`

---

### POST `/lawyers/me/profile-photo`
- **الوصف:** رفع وتحديث الصورة الشخصية للمحامي (JPEG, PNG, WEBP حتى 10MB).
- **الترويسات:** `Authorization: Bearer <lawyerAccessToken>`
- **نوع المحتوى:** `multipart/form-data` (حقل `file`).

---

### POST `/lawyers/me/documents`
- **الوصف:** رفع صورة كارنيه المحاماة أو الوثائق الرسمية وتخزينها في مسار مشفر ومعزول غير متاح للعامة.
- **الترويسات:** `Authorization: Bearer <lawyerAccessToken>`
- **نوع المحتوى:** `multipart/form-data` (حقل `file`).

---

## 5. وحدة الإدارة (`/admin`)

### GET `/admin/lawyers/pending`
- **الوصف:** استعراض طلبات المحامين الجدد المعلقة للمراجعة والمطابقة مع نقابة المحامين.
- **الترويسات:** `Authorization: Bearer <adminAccessToken>`

---

### POST `/admin/lawyers/:id/decision`
- **الوصف:** اتخاذ قرار إداري بشأن طلب المحامي (قبول `approved`, رفض `rejected`, إيقاف `suspended`, إعادة تفعيل `reactivated`) مع تسجيل السبب في سجل التدقيق التاريخي.
- **الترويسات:** `Authorization: Bearer <adminAccessToken>`
- **جسم الطلب (Body):**
```json
{
  "decision": "approved", // أو "rejected", "suspended", "reactivated"
  "reason": "تمت مراجعة القيد بنقابة المحامين والتأكد من سريانه"
}
```

