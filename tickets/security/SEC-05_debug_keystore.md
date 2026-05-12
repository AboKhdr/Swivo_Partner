# SEC-05: Release signed with debug keystore

**Severity:** 🔴 Critical
**Component:** Build / Signing
**Status:** Open

---

## الوصف

`buildTypes.release` يستخدم `signingConfigs.debug` — أي أن APK الإنتاج موقّع بمفتاح debug القياسي (كلمة المرور الافتراضية `android`). أي شخص يستطيع توقيع APK بنفس المفتاح وانتحال هوية التطبيق.

## الأدلة

- [android/app/build.gradle:107](../../android/app/build.gradle) — `signingConfig signingConfigs.debug` ضمن release
- [android/app/build.gradle:92-98](../../android/app/build.gradle) — debug config بكلمات مرور `'android'` ثابتة

## التأثير

- استحالة نشر التطبيق بأمان على Google Play (المفتاح معروف عالمياً)
- مهاجم يستطيع بناء نسخة خبيثة بنفس signature → استبدال التطبيق على أجهزة الضحايا (sideload)
- تعطّل آلية update integrity

## معايير القبول

- [ ] إنشاء keystore إنتاج جديد (`keytool -genkey -v -keystore release.keystore ...`)
- [ ] حفظ keystore في مكان آمن (1Password / vault) — لا يُرفع للـ git
- [ ] إضافة `signingConfigs.release` في `build.gradle` تقرأ من `gradle.properties` أو env vars
- [ ] تغيير `buildTypes.release.signingConfig` إلى `signingConfigs.release`
- [ ] إضافة `release.keystore` و`gradle.properties` (إذا تحوي passwords) إلى `.gitignore`
- [ ] توثيق SHA-1 و SHA-256 fingerprints لتسجيلها في Firebase + Google Cloud Console
- [ ] خطة Play App Signing (يفضّل تفعيله ليتولى Google إدارة المفتاح النهائي)

## ملاحظات تقنية

```gradle
signingConfigs {
    release {
        storeFile file(RELEASE_STORE_FILE)
        storePassword RELEASE_STORE_PASSWORD
        keyAlias RELEASE_KEY_ALIAS
        keyPassword RELEASE_KEY_PASSWORD
    }
}
```

- Play App Signing موصى به: ترفع upload key، Google يدير release key
- بعد التغيير سيتغيّر SHA-1 → يجب تحديث Firebase وأي خدمات معتمدة عليه
