# SEC-12: FCM token + PII stored unencrypted

**Severity:** 🟡 Medium
**Component:** Storage
**Status:** Open

---

## الوصف

FCM token و user PII (اسم، هاتف، رقم) مخزّنة في AsyncStorage بدون تشفير. مرتبط جزئياً بـ SEC-01 لكن هذا التذكرة تركّز على الـ FCM token تحديداً والتعامل معه عند logout / تغيير المستخدم.

## الأدلة

- [src/shared/context/FirebaseContext.js:44,84](../../src/shared/context/FirebaseContext.js) — FCM token محفوظ في AsyncStorage
- [src/store/authStore.js:18,40,58](../../src/store/authStore.js) — user object كامل في AsyncStorage

## التأثير

- مهاجم يقرأ FCM token → يرسل push notifications مزيّفة لجهاز الضحية (إذا كان يعرف server key)
- إذا لم يُلغَ تسجيل token عند logout → المستخدم القادم على نفس الجهاز يستقبل إشعارات المستخدم السابق
- PII مكشوفة عبر backup adb على جهاز debuggable

## معايير القبول

- [ ] نقل FCM token إلى Keychain (مع SEC-01)
- [ ] في `logout`: استدعاء `messaging().deleteToken()` لإبطال الـ token حالياً
- [ ] استدعاء endpoint الباك إند لإزالة الـ token من قاعدة البيانات (إن وُجد)
- [ ] في `setSession` لمستخدم جديد: التأكد من تسجيل token جديد وليس reuse للقديم
- [ ] تشفير `auth_user` أو الاحتفاظ بحقول حساسة في Keychain فقط

## ملاحظات تقنية

- `messaging().deleteToken()` يولّد token جديد عند الطلب التالي تلقائياً
- يجب على الباك إند أيضاً delete-on-logout endpoint:
  ```
  POST /notifications/unregister
  body: { token }
  ```
- مرتبط بـ SEC-01 — لو نُفّذ Keychain شاملاً فقد يحلّ هذا تلقائياً
