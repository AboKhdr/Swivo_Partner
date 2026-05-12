# CQ-06: Mixed res.data shapes across services

**Severity:** 🟡 Medium
**Component:** API Layer
**Status:** Open

---

## الوصف

`api.js` يُرجع شكلاً موحّداً `{success, data, error}` لكن استخراج payload من `data` يختلف بين الـ callers:
- بعض الأماكن: `res.data?.data ?? res.data`
- بعض الأماكن: `res.data` مباشرة
- بعض الأماكن: `res.data?.user`, `res.data?.token`

CLAUDE.md يوضّح: "the payload is directly in `res.data`, NOT nested under `res.data.data`" لكن الكود لا يتبع هذا بشكل صارم.

## الأدلة (Citations)

- [src/services/auth.js](../../src/services/auth.js) — verifyOTP يحاول كلا الشكلين
- [src/partner/features/orders/OrderDetailsScreen.js:152](../../src/partner/features/orders/OrderDetailsScreen.js) — `const d = res.data?.data ?? res.data;`
- [src/partner/features/orders/OrdersScreen.js:138](../../src/partner/features/orders/OrdersScreen.js) — `const list = res.data?.data ?? res.data ?? [];`
- [src/partner/features/dashboard/DashboardScreen.js](../../src/partner/features/dashboard/DashboardScreen.js) — أشكال أخرى

## التأثير

- defensive code في كل مكان (`?? res.data ?? []`)
- bugs إذا تغيّر backend shape وحسبه القائل أنه آمن
- صعوبة فهم: متى `res.data.data` ومتى `res.data`؟
- صعوبة testing — كل caller يجب أن يختبر كلا الشكلين

## معايير القبول

- [ ] تحديد عقد ثابت مع الـ backend team:
  - شكل قياسي مقترح: `{success, data, message, pagination?}`
  - `data` دائماً يحتوي الـ payload (object أو array)
  - **لا nesting** كـ `data.data`
- [ ] توثيق العقد في `docs/API_CONTRACT.md`
- [ ] إذا الـ backend ثابت على nested: تعديل `api.js` لـ unwrap:
  ```js
  function request(method, path, body, options) {
    // ...
    let data = await res.json();
    // Unwrap nested data shape uniformly
    if (data && typeof data === 'object' && 'data' in data && !Array.isArray(data)) {
      data = data.data;
    }
    return {success: true, data, error: null};
  }
  ```
- [ ] إزالة `res.data?.data ?? res.data` من جميع الـ callers
- [ ] لو غيّر الـ backend الشكل، يكون التعديل في مكان واحد فقط
- [ ] إضافة اختبارات لـ `api.js` تتحقق من unwrap

## ملاحظات تقنية

- البديل: استخدام مكتبة مثل `axios` مع interceptors لكنها overkill
- ربما الـ backend يستخدم middleware مثل `express-jsend` يضيف wrapper — تأكد قبل التعديل
- مرتبط بـ [CQ-05](CQ-05_jsdoc_types_thin.md) — JSDoc للـ ApiResponse يساعد على الوضوح
- يفضّل اختبار العقد مع integration tests، ليس فقط unit tests للـ mock
