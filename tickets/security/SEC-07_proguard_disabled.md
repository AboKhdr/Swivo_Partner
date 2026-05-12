# SEC-07: ProGuard disabled in release builds

**Severity:** 🟠 High
**Component:** Build / Obfuscation
**Status:** Open

---

## الوصف

`enableProguardInReleaseBuilds = false` يعني APK الإنتاج بدون obfuscation أو shrinking. كل أسماء الكلاسات، endpoints، constants، ومنطق الأعمال قابلة للقراءة بسهولة عبر `jadx` أو `apktool`.

## الأدلة

- [android/app/build.gradle:61](../../android/app/build.gradle) — `enableProguardInReleaseBuilds = false`

## التأثير

- كشف منطق التوجيه بالأدوار (admin/biker normalization)
- كشف أسماء endpoints الباك إند بسهولة (`/biker/order`, `/tenant/orders`, `/notifications/register` ...)
- تسهيل الـ reverse engineering وكتابة بوتات/سكريبتات تُحاكي التطبيق
- زيادة حجم APK (لا shrinking)

## معايير القبول

- [ ] `enableProguardInReleaseBuilds = true`
- [ ] إضافة قواعد keep لمكتبات RN في `proguard-rules.pro`:
  - React Native core
  - Notifee, Firebase
  - lucide-react-native, image-picker
  - Hermes / JSC
- [ ] اختبار release build كامل (login → orders flow → notifications → logout)
- [ ] التحقق من حجم APK قبل/بعد
- [ ] فحص `mapping.txt` يُولَّد ويُرفع لـ Crashlytics لفك تشفير الـ stack traces

## ملاحظات تقنية

- يتزامن مع SEC-05 — كلاهما إعدادات release
- ProGuard لا يحمي من reverse engineering كلياً، لكنه يرفع التكلفة بشكل ملحوظ
- إذا أراد الفريق حماية أعلى: NDK + native checks، أو DexGuard التجاري
