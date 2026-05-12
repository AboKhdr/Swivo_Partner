# Firebase Push Notifications — Swivo Native App

## المكتبات المستخدمة

| المكتبة | الغرض |
|---|---|
| `@react-native-firebase/messaging` | استقبال FCM messages من الـ backend |
| `@notifee/react-native` | عرض الإشعارات على الشاشة بـ channels مخصصة |

---

## نوع الـ Message المُرسَل من الـ Backend

**data-only message** — بدون `notification` field.

```js
// libs/sendNotification.js
await firebaseAdmin.messaging().send({
  data: {
    title: 'عنوان الإشعار',
    body:  'نص الإشعار',
    type:  '0',
    notificationType: 'general',   // يحدد الـ channel
    url:   '/',
    timestamp: new Date().toISOString()
  },
  token,
  android: { priority: 'high' },
  apns: { payload: { aps: { alert: { title, body }, sound: 'default', badge: 1 } } }
})
```

> **لماذا data-only؟**
> إذا أُرسل `notification: { title, body }` مع الـ message، Android يعترضه ويعرضه
> مباشرة على الـ system default channel — ولا يمرره لـ `setBackgroundMessageHandler`.
> بـ data-only نجبر Firebase على تمرير كل message للـ handler فيعرضها notifee
> على الـ channel الصحيح.

---

## Android Channels

مُعرَّفة في `src/services/notificationChannel.js` وتُنشأ عند بداية التطبيق.

| Channel ID | الثابت | الاستخدام | الأهمية | صوت | يتجاوز DND |
|---|---|---|---|---|---|
| `incoming_orders_v6` | `CHANNEL_INCOMING` | طلب جديد للبايكر (رنين متكرر) | HIGH | `incoming_order` | ✅ |
| `new_order_v2` | `CHANNEL_NEW_ORDER` | إشعار طلب جديد عادي | HIGH | default | ❌ |
| `order_updates` | `CHANNEL_UPDATES` | تحديثات حالة الطلب | HIGH | default | ❌ |
| `biker_alerts` | `CHANNEL_ALERTS` | تنبيهات البايكر | HIGH | default | ❌ |
| `general` | `CHANNEL_GENERAL` | إشعارات عامة / dashboard | DEFAULT | default | ❌ |

### ربط notificationType بالـ Channel

```
notificationType         → channelId
─────────────────────────────────────
'new_order'              → new_order_v2
'order_updates'          → order_updates
'biker_alerts'           → biker_alerts
'dashboard_notification' → general
(default)                → general
```

---

## تسجيل الـ FCM Token

### عند الـ Login (OTP)

```
generate-otp  →  يحفظ fcmToken في user إذا أُرسل مع الـ request
verify-otp    →  نفس الشيء
```

### عند فتح التطبيق (FirebaseContext bootstrap)

```js
const token = await getToken(getMessaging())
await registerFCMToken(token, role)  // POST /api/notifications/register
```

### Endpoint تسجيل الـ Token

```
POST /api/notifications/register
Body: { fcmToken: string, role: 'biker' | 'admin' }
Auth: Bearer JWT

DELETE /api/notifications/register
Body: { fcmToken: string }
Auth: Bearer JWT
```

يُخزَّن في `user.fcmTokens[]` (آخر 5 tokens) + `user.fcmToken` (legacy).

---

## حالات الـ App وكيفية معالجة الإشعارات

### Foreground (التطبيق مفتوح ومرئي)

**الملف:** `src/shared/context/FirebaseContext.js`

```
onMessage(remoteMessage)
  ├── type === 'NEW_ORDER' + data.order
  │     → setIncomingOrder()
  │     → showIncomingOrderNotification()  ← رنين متكرر كل 8 ثواني
  │
  └── غير ذلك
        → displayNotification({ title, body, notificationType })
          → notifee.displayNotification على الـ channel الصحيح
```

> في الـ foreground، Firebase يمرر الـ message لـ `onMessage` ولا يعرض إشعاراً تلقائياً.
> لذلك notifee يتولى العرض يدوياً.

---

### Background (التطبيق في الخلفية)

**الملف:** `index.js`

```
setBackgroundMessageHandler(remoteMessage)
  ├── data.type === 'NEW_ORDER' + data.order
  │     → AsyncStorage.setItem('pending_incoming_order')  ← يُسترجع عند فتح التطبيق
  │     → displayOrderNotification()  ← notifee على CHANNEL_INCOMING
  │
  └── غير ذلك
        → displayGenericNotification()
            → title = data.title || notification.title
            → notifee.displayNotification على الـ channel الصحيح
```

> **مهم:** `remoteMessage.notification` يكون `undefined` في الـ background handler
> لأن الـ backend يرسل data-only. لذلك نقرأ `data.title` و `data.body` مباشرة.

---

### Quit (التطبيق مغلق كلياً)

**الملف:** `index.js` — نفس `setBackgroundMessageHandler`

يعمل نفس الـ background handler. الفرق أن `pending_incoming_order` يُسترجع
في `getInitialNotification` عند إعادة فتح التطبيق.

---

## Tap Handling (الضغط على الإشعار)

| الحالة | Handler | الإجراء |
|---|---|---|
| Foreground tap على notifee | `notifee.onForegroundEvent` | `handleNavigate(data)` |
| Background tap على FCM | `onNotificationOpenedApp` | `handleNavigate(data)` |
| Quit tap على FCM | `getInitialNotification` | `handleNavigate(data)` |
| Background tap على notifee | `notifee.onBackgroundEvent` | إلغاء incoming order notification |

### منطق الـ navigation عند الضغط

```
notificationType         → الوجهة
──────────────────────────────────────────────────
'new_order'              → تبويب Orders
'order_updates'          → تبويب Orders + orderId
'biker_alerts'           → Orders أو Notifications
(default)                → تبويب Notifications
```

---

## طلب البايكر الجديد (حالة خاصة)

يُرسَل كـ data-only message بـ `type: 'NEW_ORDER'` و `data.order` (JSON string).

```js
// Backend
data: {
  type:  'NEW_ORDER',
  order: JSON.stringify({ orderId, service, customerName, location, ... })
}
```

### Foreground
→ `setIncomingOrder()` يفتح الـ incoming order modal
→ `showIncomingOrderNotification()` يعرض إشعار رنين كل 8 ثواني على `CHANNEL_INCOMING`

### Background / Quit
→ يُحفظ في `AsyncStorage` كـ `pending_incoming_order`
→ عند فتح التطبيق يُسترجع ويُمرر لـ `setIncomingOrder()`

---

## Small Icon (Android)

الملف: `android/app/src/main/res/drawable/ic_notification.png`
المصدر: `public/logo.png`

> Android يرفض عرض الإشعار صامتاً إذا كان `smallIcon` غير موجود.
> يجب أن يكون الـ icon أبيض على خلفية شفافة (monochrome) — متطلب Android.
> بعد تغيير الملف يلزم **rebuild** (`npx react-native run-android`).

---

## Token Refresh

إذا تغيّر الـ FCM token (إعادة تثبيت التطبيق أو تحديث Firebase):

```js
onTokenRefresh(getMessaging(), async newToken => {
  await AsyncStorage.setItem('fcm_token', newToken)
  await registerFCMToken(newToken, role)  // يُحدَّث في الـ DB
})
```

الـ tokens القديمة والمنتهية تُحذف تلقائياً من الـ DB عند فشل الإرسال
(`messaging/registration-token-not-registered`).

---

## Backend — sendNotification API

**الملف:** `libs/sendNotification.js`

| الدالة | الاستخدام |
|---|---|
| `sendNotification({ title, body, userIds, tenantId, ... })` | إرسال لمستخدمين محددين |
| `sendNotificationToUser(userId, { title, body })` | إرسال لمستخدم واحد |
| `sendBroadcastNotification({ title, body })` | إرسال لكل المستخدمين |
| `sendLocalizedNotification({ titleByLang, bodyByLang, userIds })` | إرسال بلغة كل مستخدم |

### notificationType القيم المقبولة (backend → client)

```
'new_order'              → channel: new_order_v2
'order_updates'          → channel: order_updates
'biker_alerts'           → channel: biker_alerts
'dashboard_notification' → channel: general
'general'                → channel: general
```

---

## ملاحظات مهمة

- **لا تُضف `notification: { title, body }`** للـ FCM message — يكسر الـ background handler على Android
- **iOS** يعمل عبر `apns` في الـ backend payload — لا يتأثر بـ data-only
- **Expo tokens** (`ExponentPushToken[...]`) تُرسَل عبر Expo Push API وليس FCM مباشرة
- Channel settings (صوت، اهتزاز) لا تتغير بعد إنشاء الـ channel — المستخدم يتحكم بها من إعدادات الجهاز
- لاختبار إشعار مباشرة من الـ terminal: انظر `scripts/` أو استخدم Firebase Console
