# SEC-08: Inconsistent refresh token logic + no JWT expiry check

**Severity:** 🟠 High
**Component:** Authentication / API
**Status:** Open

---

## الوصف

منطق refresh token متناقض بين `api.js` (يحاول refresh) و`authStore.js` (تعليق يقول الباك إند لا يُرجع refresh token). كذلك لا توجد فحوصات JWT expiry محلياً قبل الاستخدام، ما يعني محاولة استخدام token منتهٍ ثم retry على 401 — يُهدر الوقت ويزيد محاولات refresh الفاشلة.

## الأدلة

- [src/services/api.js:76-101](../../src/services/api.js) — `attemptRefresh()` يقرأ `refresh_token` ويستدعي `/auth/refresh`
- [src/store/authStore.js:33](../../src/store/authStore.js) — تعليق: `// No refreshToken — backend response only returns: { token, user }`
- لا فحص `exp` للـ JWT قبل أي طلب
- [src/services/api.js — setUnauthorizedHandler](../../src/services/api.js) — fallback عند فشل refresh

## التأثير

- إذا كان الباك إند يصدر refresh token لكن `setSession` لا يحفظه → كل طلب بعد انتهاء الـ access token سيفشل ويوقّع المستخدم خروجاً
- إذا كان لا يصدره أصلاً → الكود في `attemptRefresh` ميت لكنه يستدعي endpoint قد لا يكون موجوداً
- لا توجد طريقة لتقصير عمر access token دون التضحية بتجربة المستخدم (لا refresh آمن)

## معايير القبول

- [ ] تأكيد العقد مع الباك إند: هل يصدر refresh token؟ ما عمره؟ كيف يُتداول؟
- [ ] إذا نعم: تعديل `setSession(token, user, refreshToken)` لحفظ `refresh_token` (في Keychain — مرتبط بـ SEC-01)
- [ ] إذا لا: حذف `attemptRefresh` كاملاً وإجبار logout على 401
- [ ] إضافة decode JWT خفيف (`jwt-decode` أو parsing يدوي) لقراءة `exp`
- [ ] قبل كل طلب: إذا `exp - now < 60s` → trigger refresh مسبقاً (إن متاح)
- [ ] حماية من race: إذا طلبان متوازيان فشلا 401 معاً، استخدم Promise مشترك للـ refresh

## ملاحظات تقنية

- نمط مقترح:
  ```js
  let refreshPromise = null;
  function refreshOnce() {
    if (!refreshPromise) {
      refreshPromise = attemptRefresh().finally(() => { refreshPromise = null; });
    }
    return refreshPromise;
  }
  ```
- يجب عدم استخدام refresh token لأي طلب آخر غير `/auth/refresh`
- backend يجب أن يبطل refresh tokens القديمة عند الاستخدام (rotation)
