# SEC-03: HTTP traffic + cleartext debug manifest

**Severity:** 🔴 Critical
**Component:** Network Security / Configuration
**Status:** Open

---

## الوصف

URL أساسي بـ HTTP في `config.js` ومانيفست debug يفعّل cleartext. خطر خلط البيئات قائم — إذا التُقط `BASE_URL1` بدلاً من `BASE_URL` الإنتاجي في build واحد، تنكشف tokens والـ OTP بالشبكة.

## الأدلة

- [src/config.js:3](../../src/config.js) — `BASE_URL1: 'http://192.168.1.5:3000/api'`
- [android/app/src/debug/AndroidManifest.xml:6](../../android/app/src/debug/AndroidManifest.xml) — `android:usesCleartextTraffic="true"`
- لا يوجد فصل واضح بين dev و prod configs (متغيرات بيئة)

## التأثير

- اعتراض كل الترافيك على شبكات Wi-Fi مفتوحة
- تسريب tokens / OTPs / PII في المرحلة التطويرية
- خطر دفع build بـ HTTP إلى المتجر (إذا اختير `BASE_URL1` بالخطأ)

## معايير القبول

- [ ] إزالة `BASE_URL1` من `config.js` نهائياً، أو وضعه خلف `__DEV__` فقط
- [ ] استخدام `react-native-config` أو متغيرات Gradle/Xcode للفصل بين dev/staging/prod
- [ ] التأكد من أن production manifest لا يفعّل `usesCleartextTraffic`
- [ ] إضافة `network_security_config.xml` يمنع cleartext للـ release
- [ ] فحص: `grep -r "http://" src/` يجب أن يرجع نتائج محصورة بـ dev فقط

## ملاحظات تقنية

- `network_security_config.xml` يسمح بـ overrides لـ debug فقط:
  ```xml
  <base-config cleartextTrafficPermitted="false"/>
  <debug-overrides>
    <trust-anchors>
      <certificates src="user"/>
    </trust-anchors>
  </debug-overrides>
  ```
- iOS بالفعل آمن (`NSAllowsArbitraryLoads=false` في Info.plist:31) — التركيز على Android
