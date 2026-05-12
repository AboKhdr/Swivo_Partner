# SEC-09: Exposed API keys (Google Maps + Firebase)

**Severity:** 🟠 High
**Component:** Configuration / 3rd party
**Status:** Open

---

## الوصف

مفاتيح Google Maps و Firebase موجودة بصورة plain في الكود وفي `google-services.json`. هذا قابل للاستخراج من APK خلال ثوانٍ. في حد ذاته ليس ثغرة (المفاتيح ليست secrets نهائية)، لكن غياب التقييد يفتح الباب لاستنزاف الكوتا و billing attacks.

## الأدلة

- [src/config.js:5](../../src/config.js) — Google Maps key: `AIzaSyDKpfDr07ynPbVVkdeWg-3Cs9yH-rMQApE`
- [src/biker/features/orders/OrderMapScreen.js:14](../../src/biker/features/orders/OrderMapScreen.js) — نفس المفتاح مكرر
- [src/shared/components/MapContainer.js:19](../../src/shared/components/MapContainer.js) — نفس المفتاح مكرر
- [android/app/google-services.json:23](../../android/app/google-services.json) — Firebase API key: `AIzaSyBvBIM9bBp2CKAHQ_wF9a8pnc6F76oEteo`
- [android/app/google-services.json:17,46](../../android/app/google-services.json) — OAuth client IDs

## التأثير

- استخدام مفاتيحك لتشغيل تطبيقات أخرى (يُضاف لفاتورتك)
- استنزاف كوتا Maps / Firebase
- إذا قواعد Firestore/RTDB ضعيفة على الباك إند → قراءة/كتابة مباشرة باستخدام Firebase key

## معايير القبول

- [ ] **Google Maps key:** تقييد في Google Cloud Console:
  - Application restriction: Android apps
  - Package name: `com.partnerappnew` (أو الاسم الفعلي)
  - SHA-1 fingerprint: مفتاح release الإنتاجي (مرتبط بـ SEC-05)
  - API restriction: Maps SDK + Geocoding فقط
- [ ] **Firebase key:** تقييد مماثل في Cloud Console
- [ ] مراجعة Firestore / Realtime DB security rules — يجب أن تتطلب auth صحيحة لكل عملية
- [ ] توحيد مفتاح Maps في مكان واحد ([config.js:5](../../src/config.js)) وحذف التكرار في OrderMapScreen.js و MapContainer.js
- [ ] إعداد budget alerts في GCP (مثلاً $50/شهر)

## ملاحظات تقنية

- لا تخزن المفتاح في secret manager — كونه client-side يجب أن يبقى في الكود؛ التقييد هو الحماية الفعلية
- بعد إصدار release بـ SHA-1 جديد (SEC-05): إضافة كلا الـ SHA-1 (debug + release) للمفتاح خلال فترة الانتقال
