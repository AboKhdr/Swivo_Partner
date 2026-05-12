# PERF-01: MapContainer needs valid Maps key + restrictions

**Severity:** 🔴 Critical
**Component:** Maps / WebView
**Status:** Open

---

## الوصف

`MapContainer.js` يستخدم WebView لعرض Google Maps. المفتاح في `src/config.js` لكن:
1. غير مُقيَّد في Google Cloud (BUILD-02, SEC-09)
2. WebView يحقن المفتاح في HTML مباشرة (سهل الاستخراج)
3. لا يوجد fallback graceful إذا فشل التحميل
4. مكرر بين `MapContainer.js` و `OrderMapScreen.js`

النتيجة: تجربة مستخدم سيئة على شبكات بطيئة + مخاطر أمنية + تكلفة Cloud عالية.

## الأدلة (Citations)

- [src/shared/components/MapContainer.js:360-369](../../src/shared/components/MapContainer.js)
- [src/biker/features/orders/OrderMapScreen.js:149-153](../../src/biker/features/orders/OrderMapScreen.js)
- [src/config.js:5](../../src/config.js)

## التأثير

- تجربة سيئة: شاشة بيضاء بدون feedback إذا فشلت الشبكة
- استنزاف الكوتا إذا أُسيء استخدام المفتاح
- crashes محتملة إذا كانت lat/lng غير صالحة (لا يوجد sanitization)

## معايير القبول

- [ ] توحيد كود الخريطة في `MapContainer.js` فقط (إزالة التكرار من OrderMapScreen)
- [ ] تقييد المفتاح في Cloud Console (مرتبط بـ BUILD-02)
- [ ] إضافة loading state (skeleton أو spinner)
- [ ] إضافة error state ("تعذّر تحميل الخريطة" مع زر إعادة محاولة)
- [ ] التحقق من sanitization لـ lat/lng:
  ```js
  const safeLat = Number.isFinite(lat) ? lat : 24.7136;
  const safeLng = Number.isFinite(lng) ? lng : 46.6753;
  ```
- [ ] استخدام `injectedJavaScriptBeforeContentLoaded` بدلاً من حقن المفتاح في HTML
- [ ] إضافة `onError`, `onHttpError` handlers
- [ ] اختبار: قطع الشبكة → يظهر fallback لائق

## ملاحظات تقنية

- البديل الأمثل: استخدام `react-native-maps` أصلية بدل WebView (لكن يتطلب تكوين iOS/Android)
- إذا بقي WebView: استخدام `cacheEnabled={true}` + `domStorageEnabled={true}` لتحسين الأداء
- مرتبط بـ [SEC-04](../security/SEC-04_webview_security.md), [BUILD-02](../build/BUILD-02_hardcoded_api_keys.md)
