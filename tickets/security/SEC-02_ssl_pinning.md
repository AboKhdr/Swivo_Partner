# SEC-02: No SSL/Certificate Pinning

**Severity:** 🔴 Critical
**Component:** Network Security
**Status:** Open

---

## الوصف

التطبيق لا يطبّق SSL Pinning. الاتصال يعتمد كلياً على ثقة OS بمخزن CAs، ما يجعله عرضة لـ MITM عبر شهادات CA مخترقة، Proxies (Charles, mitmproxy)، أو تثبيت شهادات root على الجهاز.

## الأدلة

- بحث `grep` لكلمات `pinning`, `certificate`, `trustkit`, `react-native-ssl-pinning` لم يُرجع أي نتائج
- [package.json](../../package.json) — لا توجد مكتبة pinning
- [src/services/api.js](../../src/services/api.js) — `fetch` العادي بدون أي pinning hooks

## التأثير

- اعتراض كامل للحركة بما فيها tokens و OTP عبر proxy عادي
- بايلود الـ orders والمعاملات قابل للمعالجة من mitm

## معايير القبول

- [ ] اختيار آلية: `react-native-ssl-pinning` أو Network Security Config (Android) + `pinned-certificates` (iOS)
- [ ] الحصول على SHA-256 hash للشهادة الإنتاجية (وشهادة backup)
- [ ] تطبيق Pinning على كل طلبات `apiRequest` في api.js
- [ ] إستراتيجية Fallback في حال فشل التحقق (logout + رسالة للمستخدم — لا يستمر الاتصال)
- [ ] خطة rotation: إضافة backup pin قبل تجديد الشهادة

## ملاحظات تقنية

- يُفضّل pinning على SubjectPublicKeyInfo (SPKI) بدل الشهادة كاملة
- ضع pin للشهادة الحالية + pin احتياطي للتالية
- على Android: `network_security_config.xml` يدعم pinning بدون مكتبة خارجية
