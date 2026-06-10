# 📡 مرجع نقاط النهاية (API Endpoints)

> توثيق شامل لجميع نقاط النهاية المستخدمة في تطبيق Tamam (البايكر + الشريك).
> مُستخرَج من ملفات الخدمات في [`src/services/`](../src/services/).

## القاعدة (Base URL)

| البيئة | الرابط |
|---|---|
| **Production** | `https://sterile-sherry-april.ngrok-free.dev/api` |
| **Development** | `http://192.168.1.104:3000/api` |

- يُضبط في [`src/config.js`](../src/config.js) عبر `BASE_URL1`.
- كل المسارات أدناه **نسبية** وتُلحَق بالقاعدة (مثال: `/biker/profile` → `…/api/biker/profile`).

## المصادقة (Authentication)

- يُرفَق `Authorization: Bearer <token>` تلقائياً من `AsyncStorage` في [`src/services/api.js`](../src/services/api.js).
- عند استجابة **401** تُحاوَل إعادة تجديد الرمز، وإلا يُستدعى معالِج `_onUnauthorized`.
- مهلة الطلب 30 ثانية (`AbortController`).
- شكل الاستجابة الموحّد: `{ success, data, error }`.

---

## 🔐 المصادقة — `auth.js`

| الدالة | الطريقة | المسار | الجسم / المعطيات |
|---|---|---|---|
| `login` | `POST` | `/auth/generate-otp` | `{ phoneNumber, prefix }` |
| `verifyOTP` | `POST` | `/auth/verify-otp` | `{ phoneNumber, otp, prefix }` |
| `resendOTP` | `POST` | `/auth/generate-otp` | `{ phoneNumber, prefix }` |
| `deleteAccount` | `DELETE` | `/auth/account` | `{ reason? }` |

---

## 🛵 البايكر — `biker.js`

| الدالة | الطريقة | المسار | ملاحظات |
|---|---|---|---|
| `getBikerProfile` | `GET` | `/biker/profile` | يُرجِع `{ firstName, lastName, phone, email, branchName, rating, wallet }` |
| `updateBikerProfile` | `PUT` | `/biker/profile` | `{ firstName?, lastName?, email?, phoneNumber?, image? }` |
| `uploadBikerPhoto` | `PUT` | `/biker/profile` | `{ image }` (بعد رفع Cloudinary) |
| `setDutyStatus` | `PATCH` | `/biker/duty` | `{ isOnDuty }` |
| `getHomeStats` | `GET` | `/biker/home/stats` | إحصائيات الرئيسية |
| `getWallet` | `GET` | `/biker/wallet` | الرصيد |
| `getBalance` | `GET` | `/biker/balance` | الرصيد المختصر |
| `getBranches` | `GET` | `/biker/branch?<query>` | فروع البايكر |
| `getReviews` | `GET` | `/biker/review?<query>` | تقييمات العملاء |
| `getNotifications` | `GET` | `/biker/notification?<query>` | قائمة الإشعارات |
| `markNotificationRead` | `PUT` | `/biker/notification/read/:id` | تعليم إشعار كمقروء |
| `markAllNotificationsRead` | `PUT` | `/biker/notification/read-all` | تعليم الكل كمقروء |
| `getReasons` | `GET` | `/biker/reason?<query>` | أسباب (إلغاء/تخطّي) |
| `getClientTransactions` | `GET` | `/biker/transactions` | سجلّ المعاملات |
| `getTenantGallery` | `GET` | `/client/tenant/:tenantId/gallery` | معرض صور المغسلة |

### طلبات البايكر — `orders.js`

| الدالة | الطريقة | المسار | الجسم |
|---|---|---|---|
| `getOrders` | `GET` | `/biker/order?<query>` | فلاتر القائمة |
| `getOrderById` | `GET` | `/biker/order/:id` | — |
| `updateOrderStatus` | `PATCH` | `/biker/order/:id/status` | `{ status }` |
| `uploadOrderPhoto` | `POST` | `/biker/order/:id/proof/photos` | `{ phase, photos[] }` |
| `skipOrderPhoto` | `POST` | `/biker/order/:id/proof/skip` | `{ phase, reason, note? }` |
| `cancelOrder` | `PUT` | `/biker/order/:id` | `{ reason }` |

---

## 🏬 الشريك — `partner.js`

### الملف الشخصي

| الدالة | الطريقة | المسار | الجسم |
|---|---|---|---|
| `getPartnerProfile` | `GET` | `/dashboard/profile` | — |
| `updatePartnerProfile` | `PUT` | `/dashboard/profile` | `{ firstName?, lastName?, image? }` |
| `changePassword` | `PATCH` | `/dashboard/change-password` | `{ oldPassword, newPassword, confirmPassword }` |
| `uploadPartnerPhoto` | `PUT` | `/dashboard/profile` | `{ image }` |

### الطلبات

| الدالة | الطريقة | المسار | الجسم |
|---|---|---|---|
| `getOrders` | `GET` | `/tenant/orders?<query>` | `{ status?, orderType?, page?, limit? }` |
| `getOrderById` | `GET` | `/tenant/orders/:id` | — |
| `acceptOrder` | `POST` | `/tenant/orders/:id/accept` | — |
| `rejectOrder` | `POST` | `/tenant/orders/:id/reject` | `{ reason, note? }` |
| `assignBiker` | `POST` | `/tenant/orders/:orderId/assign-biker` | `{ bikerId }` |
| `reviewPhotoSkip` | `POST` | `/tenant/orders/:orderId/review-photo-skip` | `{ decision, reviewNote? }` |
| `startOnshopOrder` | `POST` | `/tenant/orders/:orderId/start` | `{ photo? }` |
| `completeOnshopOrder` | `POST` | `/tenant/orders/:orderId/complete` | `{ photos[] }` |

### الطاقم (Staff)

| الدالة | الطريقة | المسار | الجسم |
|---|---|---|---|
| `getStaff` | `GET` | `/tenant/staff?<query>` | `{ role?, branch?, page?, limit?, sort? }` |
| `addStaff` | `POST` | `/tenant/staff` | `{ phoneNumber, firstName?, lastName?, branchId, role }` |
| `setDutyStatus` | `PATCH` | `/tenant/staff/:staffId/duty` | `{ isOnDuty }` |
| `getStaffById` | `GET` | `/tenant/staff/:staffId` | — |
| `updateStaff` | `PATCH` | `/tenant/staff/:staffId` | `{ branchId? }` |
| `setStaffStatus` | `PATCH` | `/tenant/staff/:staffId/status` | `{ status }` (suspended/deactivated/active) |
| `removeStaff` | `DELETE` | `/tenant/staff/:staffId` | — |

### الخدمات (Services)

| الدالة | الطريقة | المسار | الجسم |
|---|---|---|---|
| `getServices` | `GET` | `/tenant/services?<query>` | `{ includeInactive?, categoryId?, availableFor? }` |
| `getCategoryServices` | `GET` | `/tenant/category/services` | — |
| `createService` | `POST` | `/tenant/services` | بيانات الخدمة |
| `updateService` | `PUT` | `/tenant/services/:id` | بيانات الخدمة |
| `deleteService` | `DELETE` | `/tenant/services/:id` | — |
| `toggleService` | `PATCH` | `/tenant/services/:id/toggle` | `{ isActive }` |
| `getCategories` | `GET` | `/tenant/categories` | — |

### الخدمات الإضافية (Add-ons)

| الدالة | الطريقة | المسار | الجسم |
|---|---|---|---|
| `getAdditionalServices` | `GET` | `/tenant/additional-services?<query>` | `{ serviceId? }` |
| `getAdditionalServiceById` | `GET` | `/tenant/additional-services/:id` | — |
| `createAdditionalService` | `POST` | `/tenant/additional-services` | `{ nameAr, nameEn, price, serviceId, ... }` |
| `updateAdditionalService` | `PATCH` | `/tenant/additional-services/:id` | بيانات جزئية |
| `deleteAdditionalService` | `DELETE` | `/tenant/additional-services/:id` | حذف ناعم |

### الباقات (Packages)

| الدالة | الطريقة | المسار | الجسم |
|---|---|---|---|
| `getPackages` | `GET` | `/tenant/packages?<query>` | — |
| `createPackage` | `POST` | `/tenant/packages` | `{ name, serviceIds[], price, ... }` |
| `updatePackage` | `PATCH` | `/tenant/packages/:id` | بيانات جزئية |
| `deletePackage` | `DELETE` | `/tenant/packages/:id` | — |
| `togglePackage` | `PATCH` | `/tenant/packages/:id/toggle` | `{ isActive }` |

### الفروع (Branches)

| الدالة | الطريقة | المسار | الجسم |
|---|---|---|---|
| `getBranches` | `GET` | `/tenant/branches` | — |
| `updateBranch` | `PUT` | `/tenant/branches/:id` | `{ name?, address?, workingHours?, ... }` |
| `updateBranchBanner` | `PATCH` | `/tenant/branches/:id/banner` | `{ banner }` (أو `null` للإزالة) |
| `getBranchServices` | `GET` | `/tenant/branches/:branchId/services` | — |
| `toggleBranchService` | `PATCH` | `/tenant/branches/:branchId/services/:serviceId` | — |

### طلبات تخطّي الصور (Skip Requests)

| الدالة | الطريقة | المسار | الجسم |
|---|---|---|---|
| `getSkipRequests` | `GET` | `/tenant/skip-requests?<query>` | `{ status?, page?, limit? }` |
| `approveSkipRequest` | `POST` | `/tenant/orders/:orderId/review-photo-skip` | `{ phase, decision: 'APPROVED' }` |
| `rejectSkipRequest` | `POST` | `/tenant/orders/:orderId/review-photo-skip` | `{ phase, decision: 'REJECTED', reviewNote? }` |

### التحليلات والمالية

| الدالة | الطريقة | المسار | الجسم |
|---|---|---|---|
| `getDashboardToday` | `GET` | `/dashboard/today` | إحصائيات اليوم |
| `getTenantSubscription` | `GET` | `/tenant/subscription` | الاشتراك الحالي + الميزات |
| `getAnalytics` | `GET` | `/dashboard/analytics/admin?<query>` | `{ year?, month? }` |
| `getBikerPayouts` | `GET` | `/dashboard/biker/payout?<query>` | مدفوعات البايكرز |
| `createPayout` | `POST` | `/dashboard/biker/payout` | `{ bikerId, amount, paymentMethod, notes? }` |
| `getTransactions` | `GET` | `/dashboard/transaction?<query>` | المعاملات + الرصيد |
| `getTenantWallet` | `GET` | `/tenant/wallet` | `{ balance, currency, isLocked, ... }` |
| `getPlans` | `GET` | `/guest/plans?<query>` | الخطط المتاحة |

### الإشعارات (Partner)

| الدالة | الطريقة | المسار |
|---|---|---|
| `getNotifications` | `GET` | `/dashboard/notification?<query>` |
| `markNotificationRead` | `PUT` | `/dashboard/notification/read/:id` |
| `markAllNotificationsRead` | `PUT` | `/dashboard/notification/read-all` |

### التقييمات (Reviews)

| الدالة | الطريقة | المسار | الجسم |
|---|---|---|---|
| `getReviews` | `GET` | `/dashboard/review/admin?<query>` | `{ branchId?, limit? }` |
| `deleteReview` | `DELETE` | `/dashboard/review/admin?id=:id` | — |
| `deleteReviews` | `DELETE` | `/dashboard/review/admin` | `{ ids[] }` |

### العروض (Offers)

| الدالة | الطريقة | المسار | الجسم |
|---|---|---|---|
| `getOffers` | `GET` | `/tenant/offers?<query>` | — |
| `createOffer` | `POST` | `/tenant/offers` | `{ name, serviceIds[], prices, endDate?, isActive }` |
| `updateOffer` | `PUT` | `/tenant/offers/:id` | بيانات العرض |
| `deleteOffer` | `DELETE` | `/tenant/offers/:id` | — |
| `toggleOffer` | `PATCH` | `/tenant/offers/:id/toggle` | `{ isActive }` |

### الاشتراكات والمعرض والإعدادات

| الدالة | الطريقة | المسار | الجسم |
|---|---|---|---|
| `getPackageSubscriptions` | `GET` | `/tenant/package-subscriptions?<query>` | `{ packageId?, status?, page?, limit? }` |
| `getGallery` | `GET` | `/tenant/gallery` | — |
| `addGalleryPhoto` | `POST` | `/tenant/gallery` | `{ url, caption? }` |
| `requestGalleryDeletion` | `POST` | `/tenant/gallery/:photoId/request-deletion` | `{ reason, note? }` |
| `getSettings` | `GET` | `/tenant/settings` | — |
| `updateSettings` | `PATCH` | `/tenant/settings` | `{ autoAcceptOrders?, ... }` |

### الدعم (Partner)

| الدالة | الطريقة | المسار | الجسم |
|---|---|---|---|
| `sendSupportMessage` | `POST` | `/dashboard/support` | `{ subject, message, priority }` |

---

## 🔔 الإشعارات العامة (مُوجَّهة حسب الدور) — `notifications.js`

> `scope()` يُرجِع `/biker/notification` للبايكر و`/dashboard/notification` للشريك.

| الدالة | الطريقة | المسار |
|---|---|---|
| `registerFCMToken` | `POST` | `/notifications/register` (`{ fcmToken, role }`) |
| `unregisterFCMToken` | `DELETE` | `/notifications/register` (`{ fcmToken }`) |
| `getNotifications` | `GET` | `<scope>?<query>` |
| `markAsRead` | `PUT` | `<scope>/read/:id` |
| `markAllAsRead` | `PUT` | `<scope>/read-all` |

---

## 🌐 المشترك — `shared.js`

| الدالة | الطريقة | المسار | الجسم |
|---|---|---|---|
| `getTerms` | `GET` | `/terms` | الشروط والأحكام |
| `sendSupportMessage` | `POST` | `/support` | `{ subject, message, priority }` |

---

## ☁️ خارجي — Cloudinary

| الغرض | الطريقة | الرابط |
|---|---|---|
| رفع الصور | `POST` | `https://api.cloudinary.com/v1_1/<CLOUD_NAME>/image/upload` |

> رفع غير موقّع عبر preset `tteamdashboard` ([`src/services/cloudinary.js`](../src/services/cloudinary.js)). الصور تُرفَع هنا أولاً ثم يُحفظ الرابط الناتج في الـ backend.

---

## 📊 ملخّص بالبادئات

| البادئة | الاستخدام | عدد تقريبي |
|---|---|---|
| `/auth/*` | المصادقة | 3 |
| `/biker/*` | تطبيق البايكر | ~20 |
| `/tenant/*` | تطبيق الشريك (المغسلة) | ~40 |
| `/dashboard/*` | لوحة تحكّم الشريك (بروفايل/مالية/إشعارات/تقييمات) | ~13 |
| `/guest/*` | عام (الخطط) | 1 |
| `/notifications/*` | تسجيل FCM | 2 |
| `/terms`, `/support`, `/client/*` | مشترك | 3 |
