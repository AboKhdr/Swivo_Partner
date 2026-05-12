# SEC-01: Token storage in AsyncStorage (no Keychain)

**Severity:** 🔴 Critical
**Component:** Authentication / Storage
**Status:** Open

---

## الوصف

Auth tokens, refresh tokens, ومعلومات المستخدم الكاملة (PII) مخزّنة في AsyncStorage بدون تشفير. أي جهاز بصلاحيات root أو وصول لـ `/data/data/<package>/` يكشف كل الجلسات.

## الأدلة (Citations)

- [src/services/api.js:7-20](../../src/services/api.js) — `getToken()` / `saveToken()` تستخدم AsyncStorage مباشرة
- [src/services/api.js:78,93](../../src/services/api.js) — refresh token أيضاً في AsyncStorage
- [src/store/authStore.js:18,40,58](../../src/store/authStore.js) — `auth_user` (name, phone, role) بصيغة JSON عادي
- [package.json](../../package.json) — لا يوجد `react-native-keychain` ولا أي مكتبة تخزين آمن

## التأثير

- استخراج Token من جهاز مسروق/مرشّش يتيح انتحال الهوية
- PII (رقم هاتف، بريد، اسم) قابلة للقراءة عبر أدوات backup adb
- لا يوجد طبقة تشفير حتى عند الـ Backup السحابي

## معايير القبول

- [ ] تثبيت `react-native-keychain`
- [ ] استبدال `getToken/saveToken/clearToken` لتستخدم Keychain (iOS) / Keystore (Android)
- [ ] نقل refresh token إلى Keychain
- [ ] نقل `auth_user` إلى Keychain (أو على الأقل تشفير بمفتاح من Keychain)
- [ ] التأكد من حذف كل البيانات في `clearSession`
- [ ] اختبار: قراءة AsyncStorage بعد login يجب ألا تُظهر `auth_token`

## ملاحظات تقنية

- استخدم `setGenericPassword(username, token, { accessible: ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY })`
- على Android، Keystore-backed AES افتراضي مع `react-native-keychain` ≥ 8
- يجب الحفاظ على نفس API الخارجي في `api.js` لتجنّب تعديل المستدعِين
