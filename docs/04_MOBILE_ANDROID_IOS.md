# دليل تطوير وبناء تطبيقات الهواتف الذكية (Android & iOS Guide)

**معرف التطبيق (App ID):** `com.mylawyer.app`  
**اسم التطبيق الظاهر (Display Name):** MyLawyer  
**محرك الهجين المعتمد:** Capacitor 8 (`@capacitor/core`, `@capacitor/android`, `@capacitor/ios`)  

---

## 1. بنية وإعدادات Capacitor (`capacitor.config.json`)

يقع ملف الإعداد المركزي في مجلد المشروع [`capacitor.config.json`](file:///d:/MO7AMEK/my_lawyer/capacitor.config.json):

```json
{
  "appId": "com.mylawyer.app",
  "appName": "MyLawyer",
  "webDir": "dist",
  "bundledWebRuntime": false,
  "server": {
    "androidScheme": "https",
    "cleartext": true
  },
  "plugins": {
    "SplashScreen": {
      "launchShowDuration": 2000,
      "launchAutoHide": true,
      "backgroundColor": "#1D4ED8",
      "androidSplashResourceName": "splash",
      "androidScaleType": "CENTER_CROP",
      "showSpinner": false
    }
  }
}
```

---

## 2. إدارة زر وإيماءة الرجوع في أندرويد (Android Back Button & Gesture Navigation)

تمت برمجة معالجة حدث الرجوع في نظام أندرويد عبر معيار شركة معتمد داخل [`App.jsx`](file:///d:/MO7AMEK/my_lawyer/src/App.jsx):

```javascript
App.addListener('backButton', () => {
  // 1. فحص وإغلاق أي نافذة منبثقة أو كارت مفتوح (LIFO Stack)
  if (activeModalDismissRef.current) {
    activeModalDismissRef.current();
    return;
  }

  // 2. إذا كان المستخدم في شاشة فرعية، يتم الرجوع للشاشة السابقة بسجل التنقل
  if (canGoBack && currentRoute !== ROUTES.HOME && currentRoute !== ROUTES.LOGIN) {
    goBack();
    return;
  }

  // 3. إذا كان المستخدم في الشاشة الرئيسية: تفعيل قاعدة الضغط المزدوج للخروج
  const now = Date.now();
  if (now - lastBackPressRef.current < 2000) {
    App.exitApp();
  } else {
    lastBackPressRef.current = now;
    showToast('اضغط مرة أخرى للخروج من التطبيق');
  }
});
```

---

## 3. خطوات بناء حزمة أندرويد (Android APK & AAB)

### 3.1 المتطلبات المسبقة:
- تثبيت **Android Studio Ladybug (أو أحدث)**.
- تثبيت **JDK 17** أو **JDK 21**.
- تثبيت حزم Android SDK (API 34 و API 35).

### 3.2 أوامر البناء والمزامنة:
```bash
# 1. الدخول لمجلد المشروع
cd my_lawyer

# 2. بناء حزمة الواجهة الأمامية أولاً
npm.cmd run build

# 3. مزامنة الملفات المجمعة مع مشروع أندرويد
npx.cmd cap sync android

# 4. فتح المشروع في Android Studio للتوقيع والتصدير
npx.cmd cap open android
```

### 3.3 استخراج APK أو AAB للإنتاج عبر سطر الأوامر:
```bash
cd android
# بناء Debug APK
./gradlew assembleDebug

# بناء Release APK (موقع بمفتاح الإنتاج)
./gradlew assembleRelease

# بناء Android App Bundle (AAB) لمتجر Google Play
./gradlew bundleRelease
```
يتم استخراج الملفات الناتجة داخل:  
`android/app/build/outputs/apk/release/app-release.apk`  
`android/app/build/outputs/bundle/release/app-release.aab`

---

## 4. إعدادات نظام آبل iOS (Xcode & App Store Preparation)

### 4.1 المتطلبات المسبقة:
- جهاز كمبيوتر يعمل بنظام **macOS Sequoia / Sonoma**.
- تثبيت **Xcode 16 (أو أحدث)** و **CocoaPods**.
- حساب مطور آبل معتمد (Apple Developer Program).

### 4.2 تهيئة منصة iOS ومزامنتها:
```bash
# 1. إضافة منصة iOS (إذا لم تكن مضافة مسبقاً)
npx cap add ios

# 2. بناء ومزامنة الأصول
npm run build
npx cap sync ios

# 3. فتح المشروع داخل بيئة Xcode
npx cap open ios
```

### 4.3 الصلاحيات وأذونات الخصوصية في `Info.plist`:
عند تصدير تطبيق iOS، يجب التأكد من وجود مفاتيح وصف الصلاحيات في `ios/App/App/Info.plist`:
```xml
<!-- أذونات الموقع الجغرافي لحساب المسافات وعرض المحامين القريبين -->
<key>NSLocationWhenInUseUsageDescription</key>
<string>يحتاج تطبيق ماي لوير إلى موقعك الجغرافي لعرض المحامين المتاحين بالقرب منك وحساب زمن الوصول بدقة.</string>

<!-- أذونات الكاميرا ومعرض الصور لرفع صورة الكارنيه والبروفايل -->
<key>NSCameraUsageDescription</key>
<string>يحتاج التطبيق للكاميرا لتصوير كارنيه نقابة المحامين أو الصورة الشخصية للاعتماد.</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>يحتاج التطبيق للوصول لمعرض الصور لاختيار مستندات القيد والصورة الشخصية.</string>
```

---

## 5. قواعد فحص الجودة وتجنب أخطاء التقييم في المتاجر

1. **التعامل مع الشاشات المقصوصة والنتوء (Notch & Dynamic Island):**
   - استخدام متغيرات `env(safe-area-inset-top)` و `env(safe-area-inset-bottom)` في جميع العناصر الثابتة مثل الهيدر والشريط السفلي.
2. **منع التكبير العشوائي للخطوط:**
   - ضبط `viewport-fit=cover` و `user-scalable=no` في `index.html`.
3. **حماية اتصالات الشبكة الصادرة:**
   - تفعيل HTTPS لجميع الاتصالات الخارجية والتأكد من مطابقة اشتراطات App Transport Security (ATS) في iOS.

