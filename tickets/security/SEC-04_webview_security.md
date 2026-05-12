# SEC-04: WebView insecure configuration

**Severity:** 🔴 Critical
**Component:** WebView / XSS
**Status:** Open

---

## الوصف

WebViews الخاصة بالخرائط مفتوحة على مصراعيها: `originWhitelist=['*']`، `javaScriptEnabled`، و`mixedContentMode='always'`. كذلك Google Maps API key مدمج مباشرة في HTML المُحقَن داخل WebView.

> ملاحظة: CLAUDE.md يصرّح بأن `react-native-webview` غير مثبّت، لكن الاستخدام موجود فعلياً في الكود — يجب التحقق من `package.json` ومعالجة التناقض.

## الأدلة

- [src/biker/features/orders/OrderMapScreen.js:149-153](../../src/biker/features/orders/OrderMapScreen.js) — `originWhitelist={['*']}`, `javaScriptEnabled`, `mixedContentMode="always"`
- [src/biker/features/orders/OrderMapScreen.js:14](../../src/biker/features/orders/OrderMapScreen.js) — Google Maps API key مدمج
- [src/shared/components/MapContainer.js:360-369](../../src/shared/components/MapContainer.js) — نفس الإعدادات
- [src/shared/components/MapContainer.js:19,43,251](../../src/shared/components/MapContainer.js) — API key في `buildMapHtml()`

## التأثير

- إذا تسرّبت معطيات للـ HTML من مصدر خارجي (مثلاً عنوان طلب يحتوي علامات HTML)، XSS داخل WebView ممكن
- API key قابل للاستخراج بسهولة من الـ HTML
- `mixedContentMode='always'` يسمح بتحميل موارد HTTP داخل صفحة HTTPS

## معايير القبول

- [ ] تحديد `originWhitelist={['https://*.googleapis.com', 'https://*.gstatic.com']}` بدل `['*']`
- [ ] تغيير `mixedContentMode` إلى `'never'`
- [ ] تمرير API key عبر `injectedJavaScriptBeforeContentLoaded` بدلاً من تضمينه في source HTML
- [ ] تطبيق Content Security Policy في الـ HTML المُولَّد
- [ ] Sanitize كل القيم الديناميكية (lat/lng/labels) قبل الحقن في HTML
- [ ] تقييد API key على Android package + SHA-1 في Google Cloud Console (مرتبط بـ SEC-09)

## ملاحظات تقنية

- استخدم `escapeHtml()` لأي قيمة نصية تُحقَن في HTML
- يفضّل postMessage بين RN و WebView بدل بناء HTML ديناميكياً
- إذا تم تثبيت `react-native-webview` بالفعل، حدّث CLAUDE.md ليعكس الواقع
