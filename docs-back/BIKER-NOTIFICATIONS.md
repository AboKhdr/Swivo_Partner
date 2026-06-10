# Biker Notifications — Frontend Integration Guide

> دليل شامل لكل إشعار يستقبله البايكر، مع تعليمات الربط الكاملة على تطبيق الموبايل (Expo / React Native) للوصول لـ 100% تكامل.

---

## 1. ملخص — كل الإشعارات للبايكر

| # | الإشعار | متى | Type | notificationType | Channel | الأولوية |
|---|---------|-----|------|------------------|---------|----------|
| 1 | تعيين طلب جديد | عند `assign-biker` | `0` | `new_order` | `new_order` | MAX |
| 2 | قرار تخطي الصورة (قبول/رفض) | المدير يقبل/يرفض | `0` | `biker_alerts` | `biker_alerts` | HIGH |
| 3 | إلغاء طلب من العميل | العميل يلغي | `0` | `biker_alerts` | `biker_alerts` | HIGH |
| 4 | تذكير طلب قادم (template جاهز) | cron / مجدول | `0` | `order_updates` | `order_updates` | DEFAULT |
| 5 | إشعار broadcast من dashboard | Admin يرسل | متغير | `dashboard_notification` | `general` | DEFAULT |

---

## 2. تفاصيل كل إشعار

### 2.1 🏍️ تعيين طلب جديد (BIKER_ASSIGNED)

**متى يُرسَل:**
- عند `POST /api/tenant/orders/[id]/assign-biker` — admin/supervisor يعين بايكر
- أو من `libs/order/autoAssignBiker.js` — auto-assignment

**Backend file:** `libs/order/autoAssignBiker.js:57` + `app/api/tenant/orders/[id]/assign-biker/route.js:82`

**Recipients:** البايكر المحدد فقط — `[bikerId.toString()]`

**Payload يصلك على الموبايل:**
```json
{
  "title":            "New order assigned 🏍️",
  "body":             "Order #ORD-2024-0042 has been assigned to you.",
  "type":             "0",
  "notificationType": "new_order",
  "orderId":          "65f1a2b3c4d5e6f7a8b9c0d1",
  "status":           "assigned",
  "url":              "/",
  "timestamp":        "2026-05-16T10:30:00.000Z"
}
```

**رسالة (EN/AR):**
- EN title: `"New order assigned 🏍️"`
- AR title: `"تم تعيين طلب جديد لك 🏍️"`
- EN body: `Order #${orderNumber} has been assigned to you.`
- AR body: `تم تعيين الطلب #${orderNumber} لك.`

**Frontend Action (عند الضغط):**
```js
navigation.navigate('OrderDetails', { orderId: data.orderId })
// أو شاشة "Incoming Order" لطلب فيه قبول/رفض
```

---

### 2.2 📷 قرار تخطي الصورة (PHOTO_SKIP_DECISION)

**متى يُرسَل:**
عند `POST /api/tenant/orders/[id]/review-photo-skip` — المدير يقبل أو يرفض طلب البايكر بتخطي الصور.

**Backend file:** `app/api/tenant/orders/[id]/review-photo-skip/route.js:87`

**Recipients:** البايكر — `[order.biker.toString()]`

**Payload:**
```json
{
  "title":            "Photo skip approved ✅",
  "body":             "Skip approved for order #ORD-2024-0042. You can complete the order now.",
  "type":             "0",
  "notificationType": "biker_alerts",
  "orderId":          "65f1...",
  "phase":            "after",
  "action":           "photo_skip_decision",
  "decision":         "APPROVED",
  "url":              "/",
  "timestamp":        "..."
}
```

**رسالة (Approved):**
- EN: `"Photo skip approved ✅"` — `"Skip approved for order #${orderNumber}. You can complete the order now."`
- AR: `"تم قبول تخطي الصورة ✅"` — `"تم قبول التخطي للطلب #${orderNumber}. يمكنك إنهاء الطلب الآن."`

**رسالة (Rejected):**
- EN: `"Photo skip rejected ❌"` — `"Skip rejected for order #${orderNumber}. Please upload after-photos."`
- AR: `"تم رفض تخطي الصورة ❌"` — `"تم رفض التخطي للطلب #${orderNumber}. يرجى رفع صور ما بعد الغسيل."`

**Frontend Action:**
```js
if (data.decision === 'APPROVED') {
  // البايكر يقدر يكمل الطلب
  navigation.navigate('OrderDetails', { orderId: data.orderId, autoComplete: true })
} else {
  // لازم يرفع الصور
  navigation.navigate('UploadProofPhotos', { orderId: data.orderId, phase: data.phase })
}
```

---

### 2.3 ❌ إلغاء طلب من العميل

**متى يُرسَل:**
عند `PATCH /api/client/order/[id]/cancel` — العميل يلغي طلباً معيناً للبايكر.

**Backend file:** `app/api/client/order/[id]/cancel/route.js:142`

**Recipients:** البايكر — `[order.biker.toString()]`

**Payload:**
```json
{
  "title":            "Order Cancelled",
  "body":             "Order #ORD-2024-0042 was cancelled by the customer",
  "type":             "0",
  "notificationType": "biker_alerts",
  "orderId":          "65f1...",
  "status":           "CANCELLED",
  "url":              "/",
  "timestamp":        "..."
}
```

**رسالة (EN/AR):**
- EN: `"Order Cancelled"` — `Order #${orderNumber} was cancelled by the customer`
- AR: `"تم إلغاء الطلب"` — `تم إلغاء الطلب #${orderNumber} من قبل العميل`

**Frontend Action:**
```js
// أوقف أي navigation للطلب، وأظهر alert
showAlert({
  title: 'تم إلغاء الطلب',
  message: data.body,
  onPress: () => navigation.navigate('BikerHome')
})
```

---

### 2.4 ⏰ تذكير طلب قادم (BIKER_ORDER_REMINDER)

**Template موجود لكن غير مفعّل في كود حالي.** عند تفعيله:

**Recipients:** البايكر

**Payload:**
- EN: `"Upcoming order reminder ⏰"` — `Reminder: order #${orderNumber} is scheduled soon.`
- AR: `"تذكير بطلب قادم ⏰"` — `تذكير: الطلب #${orderNumber} مجدول قريباً.`

---

### 2.5 📢 إشعار broadcast من الـ Dashboard

**متى يُرسَل:**
عند `POST /api/notification/send` بفلتر `audienceFilter: 'bikers'` أو userIds محددة.

**Payload:** أي title/body من الـ admin + `data.notificationType = 'dashboard_notification'`.

**Frontend Action:** انتقل لصفحة الإشعارات أو URL محدد في `data.url`.

---

## 3. الربط الكامل على Mobile App (Expo / React Native)

### 3.1 المتطلبات

```bash
npx expo install expo-notifications expo-device
```

### 3.2 تسجيل الـ Android Channels (ضع في `App.js` عند الـ mount)

```js
import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'

async function setupAndroidChannels() {
  if (Platform.OS !== 'android') return

  await Notifications.setNotificationChannelAsync('new_order', {
    name:             'New Orders',
    importance:       Notifications.AndroidImportance.MAX,
    sound:            'default',
    vibrationPattern: [0, 500, 200, 500],
    enableLights:     true,
    lightColor:       '#1B7BF5',
    enableVibrate:    true,
    showBadge:        true,
  })

  await Notifications.setNotificationChannelAsync('biker_alerts', {
    name:             'Biker Alerts',
    importance:       Notifications.AndroidImportance.HIGH,
    sound:            'default',
    vibrationPattern: [0, 250, 250, 250],
  })

  await Notifications.setNotificationChannelAsync('order_updates', {
    name:       'Order Updates',
    importance: Notifications.AndroidImportance.HIGH,
    sound:      'default',
  })

  await Notifications.setNotificationChannelAsync('general', {
    name:       'General',
    importance: Notifications.AndroidImportance.DEFAULT,
  })
}
```

### 3.3 طلب الإذن + الحصول على Token

```js
import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'

export async function registerBikerForPushNotifications(jwt) {
  if (!Device.isDevice) {
    console.warn('Must use physical device')
    return null
  }

  // 1. الإذن
  const { status: existing } = await Notifications.getPermissionsAsync()
  let finalStatus = existing
  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync()
    finalStatus = status
  }
  if (finalStatus !== 'granted') {
    console.warn('Notifications permission denied')
    return null
  }

  // 2. Token
  const tokenData = await Notifications.getExpoPushTokenAsync({
    projectId: process.env.EXPO_PROJECT_ID,
  })
  const token = tokenData.data

  // 3. أرسل للـ backend
  const res = await fetch(`${API_URL}/api/notifications/register`, {
    method:  'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization:  `Bearer ${jwt}`,
    },
    body: JSON.stringify({ fcmToken: token }),
  })

  if (!res.ok) {
    console.error('Failed to register push token')
    return null
  }

  return token
}
```

### 3.4 Foreground Handler (عرض الإشعار حتى لو التطبيق مفتوح)

```js
import * as Notifications from 'expo-notifications'

Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    const data = notification.request.content.data
    const channelId = data?.notificationType || 'general'

    return {
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge:  true,
      // priority حسب نوع الإشعار:
      priority: channelId === 'new_order'
        ? Notifications.AndroidNotificationPriority.MAX
        : Notifications.AndroidNotificationPriority.HIGH,
    }
  },
})
```

### 3.5 Hook كامل للاستقبال + Routing

```js
// hooks/useBikerNotifications.js
import { useEffect, useRef } from 'react'
import * as Notifications from 'expo-notifications'
import { useNavigation } from '@react-navigation/native'

export default function useBikerNotifications() {
  const navigation = useNavigation()
  const recvSub    = useRef()
  const respSub    = useRef()

  useEffect(() => {
    // 1. إشعار وصل والتطبيق مفتوح
    recvSub.current = Notifications.addNotificationReceivedListener(notification => {
      const data = notification.request.content.data
      handleForeground(data)
    })

    // 2. المستخدم ضغط على الإشعار (foreground/background/cold-start)
    respSub.current = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data
      routeBikerNotification(data, navigation)
    })

    // 3. cold-start (التطبيق كان مغلق وفُتح بإشعار)
    Notifications.getLastNotificationResponseAsync().then(response => {
      if (response) {
        const data = response.notification.request.content.data
        routeBikerNotification(data, navigation)
      }
    })

    return () => {
      Notifications.removeNotificationSubscription(recvSub.current)
      Notifications.removeNotificationSubscription(respSub.current)
    }
  }, [navigation])
}

function handleForeground(data) {
  // مثلاً: تحديث الـ unread badge في context أو store
  const t = Number(data.type)
  if (t === 0 && data.notificationType === 'new_order') {
    // طلب جديد — شغّل صوت اضافي إذا تحتاج
    playCustomSound()
  }
}

function routeBikerNotification(data, navigation) {
  const orderId = data.orderId

  switch (data.notificationType) {
    case 'new_order':
      // فتح شاشة طلب جديد
      navigation.navigate('IncomingOrder', { orderId })
      break

    case 'biker_alerts':
      // قرار تخطي صورة أو إلغاء — تفاصيل الطلب
      if (data.action === 'photo_skip_decision') {
        navigation.navigate('OrderDetails', {
          orderId,
          showSkipResult: true,
          decision: data.decision
        })
      } else if (data.status === 'CANCELLED') {
        // طلب اتلغى — انتقل للـ Home وأظهر alert
        navigation.navigate('BikerHome')
        showCancelAlert(data)
      } else {
        navigation.navigate('OrderDetails', { orderId })
      }
      break

    case 'order_updates':
      navigation.navigate('OrderDetails', { orderId })
      break

    case 'dashboard_notification':
      navigation.navigate('Notifications')
      break

    default:
      navigation.navigate('Notifications')
  }
}
```

### 3.6 الاستخدام في `App.js`

```js
import { useEffect } from 'react'
import useBikerNotifications from './hooks/useBikerNotifications'
import { useAuth } from './contexts/AuthContext'

function App() {
  const { user, jwt } = useAuth()

  // الإشعارات
  useBikerNotifications()

  // التسجيل بعد الـ login
  useEffect(() => {
    if (user?.role === 'biker' && jwt) {
      setupAndroidChannels()
      registerBikerForPushNotifications(jwt)
    }
  }, [user, jwt])

  return <YourNavigator />
}
```

### 3.7 إزالة الـ token عند Logout

```js
async function logoutBiker() {
  const token = await Notifications.getExpoPushTokenAsync({
    projectId: process.env.EXPO_PROJECT_ID,
  })

  await fetch(`${API_URL}/api/notifications/register`, {
    method:  'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization:  `Bearer ${jwt}`,
    },
    body: JSON.stringify({ fcmToken: token.data }),
  })

  await clearAuthState()
}
```

---

## 4. جلب قائمة الإشعارات (للـ Notification Center)

```http
GET /api/biker/notification?page=1&limit=20
Authorization: Bearer <jwt>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "title": "New order assigned 🏍️",
      "body": "Order #ORD-2024-0042 has been assigned to you.",
      "type": 0,
      "data": { "orderId": "...", "notificationType": "new_order" },
      "isRead": false,
      "createdAt": "2026-05-16T10:30:00.000Z"
    }
  ],
  "pagination": { "total": 42, "page": 1, "limit": 20, "totalPages": 3, "hasNextPage": true, "hasPrevPage": false }
}
```

### تعليم كمقروء

```http
PUT /api/biker/notification/read/:id
Authorization: Bearer <jwt>
```

### تفاصيل إشعار واحد

```http
GET /api/biker/notification/:id
Authorization: Bearer <jwt>
```

---

## 5. أمثلة شاشات نموذجية

### 5.1 شاشة Notification Center

```jsx
import { useEffect, useState } from 'react'
import { FlatList, Text, TouchableOpacity, View } from 'react-native'

export default function BikerNotificationsScreen() {
  const [notifications, setNotifications] = useState([])
  const [page, setPage] = useState(1)

  useEffect(() => { load() }, [page])

  async function load() {
    const res = await fetch(`${API_URL}/api/biker/notification?page=${page}&limit=20`, {
      headers: { Authorization: `Bearer ${jwt}` },
    })
    const json = await res.json()
    setNotifications(prev => page === 1 ? json.data : [...prev, ...json.data])
  }

  async function markRead(id) {
    await fetch(`${API_URL}/api/biker/notification/read/${id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${jwt}` },
    })
    setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n))
  }

  return (
    <FlatList
      data={notifications}
      keyExtractor={n => n._id}
      renderItem={({ item }) => (
        <TouchableOpacity
          onPress={() => {
            markRead(item._id)
            routeBikerNotification(item.data, navigation)
          }}
          style={{ padding: 16, backgroundColor: item.isRead ? '#fff' : '#f0f7ff' }}
        >
          <Text style={{ fontWeight: 'bold' }}>{item.title}</Text>
          <Text>{item.body}</Text>
          <Text style={{ fontSize: 12, color: '#666' }}>
            {new Date(item.createdAt).toLocaleString()}
          </Text>
        </TouchableOpacity>
      )}
      onEndReached={() => setPage(p => p + 1)}
      onEndReachedThreshold={0.5}
    />
  )
}
```

---

## 6. Checklist تكامل البايكر — 100%

- [ ] `expo-notifications` و `expo-device` مثبتَين.
- [ ] طلب الإذن **بعد** الـ login مباشرةً.
- [ ] الحصول على `ExponentPushToken` وحفظه في state.
- [ ] إرسال الـ token عبر `POST /api/notifications/register` مع JWT.
- [ ] تسجيل **كل** Android channels (`new_order`, `biker_alerts`, `order_updates`, `general`).
- [ ] `setNotificationHandler` لـ foreground.
- [ ] `addNotificationReceivedListener` لتحديث الـ UI.
- [ ] `addNotificationResponseReceivedListener` للـ routing عند الضغط.
- [ ] `getLastNotificationResponseAsync` للـ cold-start.
- [ ] Switch على `data.notificationType` للـ routing — **ليس** على `data.type`.
- [ ] `Number(data.type)` إذا تحتاج enum check (لأنه string).
- [ ] حذف الـ token عند logout.
- [ ] إعادة تسجيل الـ token عند:
  - تغيّر المستخدم.
  - رفض الإذن ثم القبول لاحقاً.
- [ ] جلب القائمة عبر `GET /api/biker/notification`.
- [ ] تعليم كمقروء عبر `PUT /api/biker/notification/read/:id`.
- [ ] handling للحالة لو الـ token فشل تسجيله (retry بـ backoff).

---

## 7. Debugging

### الـ token لم يتسجل

```js
// تأكد أن الـ token موجود في DB:
GET /api/biker/profile  // يجب أن يحوي fcmToken أو fcmTokens

// تحقق من خطأ صريح
const res = await fetch(`${API_URL}/api/notifications/register`, { ... })
console.log('register status:', res.status)
console.log('register body:', await res.text())
```

### الإشعار لا يصل

1. **افحص الـ token صالح:**
   - Expo: https://expo.dev/notifications (Push notifications tool)
2. **افحص أن الإشعار محفوظ في DB:**
   - `Notification.findOne({ "analytics.recipients": userId }).sort('-createdAt')`
3. **افحص الـ Android channel مسجّل:**
   ```js
   const channels = await Notifications.getNotificationChannelsAsync()
   console.log(channels)
   ```
4. **افحص الـ priority على Android:** يجب MAX أو HIGH للظهور وقت Doze mode.

### الإشعار يصل لكن الـ tap لا يفتح الشاشة الصحيحة

تأكد أن:
- `data.notificationType` موجود في الـ payload (افحص `notification.request.content.data`).
- الـ switch case يطابق exactly (`'new_order'` وليس `'NewOrder'`).
- الـ navigation reference جاهز قبل الـ navigate (استخدم `NavigationContainer` ref إذا الـ navigation أحياناً غير mounted).

---

## 8. مرجع سريع (Cheatsheet)

| الإشعار | notificationType | data.action | الشاشة |
|---------|------------------|-------------|--------|
| طلب جديد | `new_order` | — | `IncomingOrder` / `OrderDetails` |
| تخطي صورة قُبل | `biker_alerts` | `photo_skip_decision` (APPROVED) | `OrderDetails` |
| تخطي صورة رُفض | `biker_alerts` | `photo_skip_decision` (REJECTED) | `UploadProofPhotos` |
| طلب أُلغي | `biker_alerts` | (status=CANCELLED) | `BikerHome` + alert |
| Broadcast من admin | `dashboard_notification` | — | `Notifications` |
