# Tickets — NativeTamam

## 🔴 حرجة

---

### TICKET-001 — حذف devRole وتنظيف auth flow
**الملفات:** `App.tsx` + `LoginScreen.js` + `OtpScreen.js`
**الحالة:** ✅ مكتمل
**ما تم:** حذف `devRole` من `App.tsx` كاملاً. `LoginScreen` لا يستقبل `onLogin`/`onGuest` بعد الآن. `OtpScreen` يعتمد على `authStore` مباشرة — `role` يتغير تلقائياً بعد `verifyOTP` فيُعيد App الـ render.

---

### TICKET-002 — إضافة Error Boundary
**الملف:** `App.tsx`
**الحالة:** ✅ مكتمل
**ما تم:** إضافة `ErrorBoundary` class component يعرض شاشة fallback عربية مع زر "إعادة المحاولة" عند أي crash.

---

### TICKET-003 — إصلاح Silent Error Handling
**الملفات:** `HomeScreen.js` + `DashboardScreen.js` + `StaffScreen.js`
**الحالة:** ✅ مكتمل
**ما تم:** إضافة `showToast` من `appStore` في الشاشات الثلاث. كل عملية فاشلة تُظهر رسالة خطأ للمستخدم.

---

### TICKET-004 — إصلاح Optimistic Update Rollback
**الملفات:** `HomeScreen.js` + `StaffScreen.js`
**الحالة:** ✅ مكتمل
**ما تم:**
- `HomeScreen`: حفظ `prev` قبل toggle وإعادته + toast عند الفشل
- `StaffScreen`: rollback كان موجوداً، أضفنا toast عند الفشل

---

## 🟠 مهمة

---

### TICKET-005 — إصلاح Animation Leaks
**الملفات:** `StatusTracker.js` + `HomeScreen.js`
**الحالة:** ✅ مكتمل
**ما تم:** `StatusTracker` لا يستخدم `Animated` — الـ pulse هو View ثابت. `ServiceButton` في `HomeScreen` كان يعود `() => loop.stop()` بالفعل — لا leak.

---

### TICKET-006 — عزل Promise.all() failures
**الملفات:** `HomeScreen.js` + `DashboardScreen.js` + `StaffScreen.js`
**الحالة:** ✅ مكتمل
**ما تم:** استبدال `Promise.all()` بـ `Promise.allSettled()` في الشاشات الثلاث. كل endpoint يُعالج بشكل مستقل.

---

### TICKET-007 — توحيد resolveChannel
**الملفات:** `notificationChannel.js` + `index.js`
**الحالة:** ✅ مكتمل
**ما تم:** `resolveChannel` أصبحت `export` من `notificationChannel.js`. `index.js` يستوردها بدلاً من تعريفها من جديد. حُذفت الـ channel ID constants المكررة من `index.js`.

---

### TICKET-008 — إصلاح AbortController memory leak
**الملف:** `src/services/api.js`
**الحالة:** ✅ مكتمل
**ما تم:** نقل `clearTimeout(timer)` إلى `finally` block لضمان تنظيفه دائماً سواء نجح الـ request أو فشل.

---

## 🟡 تحسينات

---

### TICKET-009 — إضافة Error State في DashboardScreen
**الملف:** `src/partner/features/dashboard/DashboardScreen.js`
**الحالة:** ✅ مكتمل
**ما تم:** إضافة `error` state — عند فشل `getDashboardToday` تظهر رسالة "تعذّر تحميل البيانات" مع زر "إعادة المحاولة".

---

### TICKET-010 — إصلاح Pulse Animation cleanup في StatusTracker
**الملف:** `src/shared/components/StatusTracker.js`
**الحالة:** ✅ مكتمل (لم يكن هناك Animated.loop — الـ pulse هو View ثابت وليس animation)
