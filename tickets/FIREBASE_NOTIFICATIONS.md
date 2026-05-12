# Firebase FCM — Notifications Guide
> تاريخ: 2026-05-10
> Platform: React Native CLI (Biker App + Partner/Tenant App)

---

## البنية العامة

```
Backend (sendNotification.js)
    ↓ يرسل FCM push عبر Firebase Admin SDK
Firebase Cloud Messaging
    ↓
index.js → setBackgroundMessageHandler     (تطبيق مغلق / خلفية)
    ↓
FirebaseContext.js → onMessage             (تطبيق مفتوح)
    ↓
notificationChannel.js → displayNotification / showIncomingOrderNotification
    ↓
يُوجَّه للـ channel الصحيح بناءً على notificationType
```

---

## الـ Channels (Android)

| Channel ID | الصوت | الاستخدام |
|------------|-------|----------|
| `incoming_orders_v6` | `incoming_order.mp3` (رنة مخصصة) | طلب جديد وارد — loop كل 8 ثوانٍ |
| `new_order_v2` | `default` | إشعار طلب جديد عادي |
| `order_updates` | `default` | تحديثات الطلب |
| `biker_alerts` | `default` | تنبيهات البايكر |
| `general` | `default` | إشعارات dashboard وغيرها |

> ⚠️ Android يحفظ إعدادات الـ channel بعد أول إنشاء ولا يعدّلها — لتغيير الصوت يجب تغيير الـ channel ID.
> iOS لا تحتاج channels.

---

## شكل الـ data payload (يصل في remoteMessage.data)

```json
{
  "type": "NEW_ORDER",
  "notificationType": "order_updates",
  "orderId": "...",
  "status": "on_road",
  "order": "{...JSON string للطلب — فقط عند type=NEW_ORDER}",
  "timestamp": "2026-05-10T10:00:00.000Z"
}
```

> ⚠️ جميع القيم في `remoteMessage.data` تأتي كـ **string**.
> عند `type === 'NEW_ORDER'` يأتي `order` كـ JSON string — استخدم `JSON.parse(data.order)`.

---

## السيناريوهات

### Biker App

| الحدث | `type` | `notificationType` | Channel | الصوت |
|-------|--------|-------------------|---------|-------|
| طلب جديد وارد | `NEW_ORDER` | — | `incoming_orders_v6` | رنة مخصصة (loop) |
| العميل ألغى الطلب | — | `biker_alerts` | `biker_alerts` | default |
| المدير وافق على photo skip | — | `biker_alerts` | `biker_alerts` | default |
| المدير رفض photo skip | — | `biker_alerts` | `biker_alerts` | default |

### Partner App (Tenant)

| الحدث | `notificationType` | Channel | الصوت |
|-------|-------------------|---------|-------|
| إشعار يدوي من Dashboard | `dashboard_notification` | `general` | default |

### Client App

| الحدث | `notificationType` | `status` | Channel |
|-------|-------------------|----------|---------|
| البايكر في الطريق | `order_updates` | `on_road` | `order_updates` |
| البايكر وصل | `order_updates` | `arrived` | `order_updates` |
| بدأ الغسيل | `order_updates` | `start_process` | `order_updates` |
| اكتمل الطلب | `order_updates` | `completed` | `order_updates` |

---

## الملفات المسؤولة

### `index.js` — Background / Quit handler
- `setBackgroundMessageHandler` يعالج الرسائل عند إغلاق التطبيق أو وجوده في الخلفية
- `type === 'NEW_ORDER'` → يحفظ في AsyncStorage كـ `pending_incoming_order` + يعرض إشعار رنة على `incoming_orders_v6`
- غير ذلك → `displayGenericNotification()` يعرض الإشعار على الـ channel المناسب بصوت `default`
- `notifee.onBackgroundEvent PRESS` → يلغي إشعار الرنة عند الضغط عليه

### `src/services/notificationChannel.js` — Channel definitions + display
- `setupNotifeeChannel()` — ينشئ جميع الـ channels عند launch (Android فقط)
- `displayNotification({title, body, notificationType, data})` — عرض إشعار عادي على الـ channel الصحيح
- `showIncomingOrderNotification(order)` — loop كل 8 ثوانٍ على `incoming_orders_v6` بصوت الرنة
- `cancelIncomingOrderNotification()` — يوقف الـ loop ويلغي الإشعارات
- `stopRinging()` — يوقف الـ loop فقط

### `src/shared/context/FirebaseContext.js` — Foreground handler
- `bootstrap(role)` — يطلب الإذن + ينشئ الـ channels + يجلب الـ token + يرفعه للـ backend
- `onTokenRefresh` — يحدّث الـ token في AsyncStorage والـ backend تلقائياً
- `onMessage` foreground:
  - `NEW_ORDER` → `setIncomingOrder()` + `showIncomingOrderNotification()`
  - غير ذلك → `displayNotification()` بصوت `default`
- `onNotificationOpenedApp` + `getInitialNotification` — عند الضغط على الإشعار:
  - `NEW_ORDER` → `setIncomingOrder()` + `cancelIncomingOrderNotification()`
  - غير ذلك → `handleNavigate()` يفتح الـ tab الصحيح
- `notifee.onForegroundEvent PRESS` → `handleNavigate()`
- `handleNavigate(data)` → يستدعي `appStore.requestNav(tab, orderId)`

### `src/store/appStore.js` — Navigation bridge
```js
pendingNav: null,            // { tab, orderId } | null
requestNav(tab, orderId),    // يُعيّن pendingNav
clearNav(),                  // يُصفّر pendingNav
```

### `src/biker/navigation/AppNavigator.js`
- يراقب `pendingNav` من appStore
- `NAV_TAB_MAP`: `orders → orders` / `notifications → home`

### `src/partner/navigation/PartnerNavigator.js`
- يراقب `pendingNav` من appStore
- `NAV_TAB_MAP`: `orders → orders` / `notifications → dashboard`

---

## FCM Token

- يُجلب عبر `getToken(getMessaging())` في `bootstrap()`
- يُحفظ في `AsyncStorage` بالمفتاح `fcm_token`
- يُرسل للـ backend عبر `registerFCMToken(token, role)` ← `POST /notifications/token`
- يتجدد تلقائياً عبر `onTokenRefresh` ويُحدَّث في كلا المكانين

---

## ملاحظات

- ملف الرنة: `/android/app/src/main/res/raw/incoming_order.mp3`
- الأيقونة: `ic_notification` في `/android/app/src/main/res/drawable/`
- `pending_incoming_order` في AsyncStorage يُقرأ عند فتح التطبيق ويُحذف فوراً
- إذا ظهر `"no push tokens found"` من الـ backend → المستخدم لم يسجّل دخول أو الـ token لم يُرفع
