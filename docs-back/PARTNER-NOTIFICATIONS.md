# Partner (Tenant Staff) Notifications — Frontend Integration Guide

> دليل شامل لكل إشعار يستقبله الـ partner (tenant owner / admin / supervisor / manager) مع كود الربط الكامل على:
> - **Web Dashboard** (FCM web — `firebase-messaging-sw.js`)
> - **Mobile Partner App** (Expo / React Native — مع ringing UI لطلب جديد)

---

## 1. من هو الـ Partner؟

| Role | تعريف | كيف يصله الإشعار |
|---|---|---|
| `admin` | مالك التينانت (أول user عند التسجيل) | Web + Mobile partner app |
| `supervisor` | موظف صلاحيات محدودة | Web + Mobile partner app |
| `manager` | مدير فرع (`TenantStaffModel.role='MANAGER'`) | Mobile partner app |
| Tenant Owner | مالك المنصة (`tenant.ownerUserId`) | Mobile partner app (incoming-call screen) |

> **مهم:** قواعد الـ recipients تتغير حسب الإشعار. لاحظ بدقة من المرسَل إليه في كل قسم.

---

## 2. ملخص — كل إشعارات الـ Partner

| # | الإشعار | متى | Type | notificationType | Channel | المستلمون |
|---|---------|-----|------|------------------|---------|-----------|
| 1 | **طلب جديد (Ring)** | عند `POST /api/client/order` | `1` | `new_order` | `incoming_orders_v6` | `tenant.ownerUserId` |
| 2 | طلب جديد ينتظر القبول | بعد TAP authorize webhook | `0` | `new_order` | `new_order` | كل `MANAGER` |
| 3 | تحديث حالة طلب من البايكر | البايكر يحدث الحالة | `0` | `order_updates` | `order_updates` | كل `admin`/`supervisor` |
| 4 | إلغاء طلب من العميل | العميل يلغي | `0` | `order_updates` | `order_updates` | owner + كل `admin`/`supervisor` |
| 5 | طلب موافقة تخطي صورة | البايكر يطلب skip | `0` | `order_updates` | `order_updates` | `MANAGER` أو `admin`/`supervisor` |
| 6 | Broadcast من superadmin | superadmin يرسل | متغير | `dashboard_notification` | `general` | حسب الفلتر |

---

## 3. تفاصيل كل إشعار

### 3.1 📞 طلب جديد — Ring (NEW_ORDER for partner)

> **هذا الإشعار خاص جداً** — Data-only FCM لتشغيل واجهة "Incoming Call" مع loop ring.

**متى يُرسَل:**
عند `POST /api/client/order` — بعد إنشاء الطلب مباشرةً.

**Backend file:** `libs/notifications/sendNewOrderToPartner.js:31`

**Recipients:** **مالك التينانت فقط** — `tenant.ownerUserId`

**Payload الذي يصلك:**
```json
{
  "type":  "NEW_ORDER",
  "order": "{\"id\":\"65f1...\",\"service\":\"Premium Wash\",\"customerName\":\"Mohammed Ali\",\"location\":\"Al Olaya, Riyadh\",\"orderNumber\":\"ORD-2024-0042\",\"total\":120}"
}
```

> **ملاحظة مهمة:**
> - `data.order` هو **JSON string**، لازم `JSON.parse(data.order)` على الـ client.
> - **لا** يحوي `title` أو `body` — الـ app يبني الـ UI من البيانات.
> - `notificationType` غير موجود في هذا الإشعار — استخدم `data.type === 'NEW_ORDER'` للكشف.
> - Android Channel: `incoming_orders_v6` (يجب صوت ring loop).

**Frontend Handling — Mobile Partner App:**

```js
// background handler
Notifications.addNotificationReceivedListener(notification => {
  const data = notification.request.content.data

  if (data.type === 'NEW_ORDER') {
    // افتح شاشة Incoming Call فوراً
    const order = JSON.parse(data.order)
    showIncomingOrderScreen(order)
    startRingLoop()
  }
})
```

**شاشة Incoming Call:**
```jsx
function IncomingOrderScreen({ order }) {
  return (
    <View style={styles.fullScreen}>
      <Text style={styles.label}>طلب جديد</Text>
      <Text style={styles.customerName}>{order.customerName}</Text>
      <Text style={styles.service}>{order.service}</Text>
      <Text style={styles.location}>{order.location}</Text>
      <Text style={styles.total}>{order.total} SAR</Text>

      <View style={styles.actions}>
        <Button title="رفض" color="red" onPress={() => rejectOrder(order.id)} />
        <Button title="قبول" color="green" onPress={() => acceptOrder(order.id)} />
      </View>
    </View>
  )
}
```

---

### 3.2 ⏳ طلب جديد ينتظر القبول (NEW_ORDER_PENDING)

**متى يُرسَل:**
عند TAP webhook authorize event ينجح — الطلب صار جاهز للقبول.

**Backend file:** `libs/webhookHandlers/handleAuthorizeWebhook.js:149`

**Recipients:** كل `MANAGER` نشط في التينانت:
```js
TenantStaffModel.find({ tenantId, role: 'MANAGER', isActive: true })
```

**Payload:**
```json
{
  "title":            "New order waiting ⏳",
  "body":             "Order #ORD-2024-0042 is awaiting your acceptance.",
  "type":             "0",
  "notificationType": "new_order",
  "orderId":          "65f1...",
  "url":              "/",
  "timestamp":        "..."
}
```

**رسالة (EN/AR):**
- EN: `"New order waiting ⏳"` — `Order #${orderNumber} is awaiting your acceptance.`
- AR: `"طلب جديد بانتظارك ⏳"` — `الطلب #${orderNumber} بانتظار قبولك.`

**Frontend Action:**
```js
navigation.navigate('PendingOrderDetails', { orderId: data.orderId })
```

---

### 3.3 🔄 تحديث حالة طلب من البايكر (PARTNER_ORDER_STATUS_CHANGED)

**متى يُرسَل:**
عند `PATCH /api/biker/order/[id]/status` — البايكر يحدث حالة الطلب.

**Backend file:** `app/api/biker/order/[id]/status/route.js:138`

**Recipients:** كل `admin` و `supervisor` في نفس التينانت:
```js
UserModel.find({ tenantId: auth.tenantId, role: { $in: ['admin','supervisor'] } })
```

**Payload:**
```json
{
  "title":            "Order #ORD-2024-0042 — ON_THE_WAY",
  "body":             "Biker updated order #ORD-2024-0042 to ON_THE_WAY.",
  "type":             "0",
  "notificationType": "order_updates",
  "orderId":          "65f1...",
  "status":           "ON_THE_WAY",
  "url":              "/",
  "timestamp":        "..."
}
```

**رسالة (EN/AR):**
- EN title: `Order #${orderNumber} — ${newStatus}`
- AR title: `الطلب #${orderNumber} — ${newStatus}`
- EN body: `Biker updated order #${orderNumber} to ${newStatus}.`
- AR body: `قام البايكر بتحديث الطلب #${orderNumber} إلى ${newStatus}.`

**Frontend Action:**
```js
// تحديث القائمة في realtime + إشعار سريع
refreshOrdersList()
navigation.navigate('OrderDetails', { orderId: data.orderId })
```

---

### 3.4 ❌ إلغاء طلب من العميل (Tenant-side)

**متى يُرسَل:**
عند `PATCH /api/client/order/[id]/cancel` — العميل يلغي.

**Backend file:** `app/api/client/order/[id]/cancel/route.js:168`

**Recipients:** **مالك التينانت + كل admin + كل supervisor**:
```js
// union of:
tenant.ownerUserId
UserModel.find({ tenantId, role: { $in: ['admin', 'supervisor'] } })
```

**Payload:**
```json
{
  "title":            "Order Cancelled",
  "body":             "Order #ORD-2024-0042 was cancelled by the customer",
  "type":             "0",
  "notificationType": "order_updates",
  "orderId":          "65f1...",
  "status":           "CANCELLED",
  "url":              "/",
  "timestamp":        "..."
}
```

**رسالة (EN/AR):**
- EN: `"Order Cancelled"` — `Order #${orderNumber} was cancelled by the customer`
- AR: `"تم إلغاء الطلب"` — `تم إلغاء الطلب #${orderNumber} من قبل العميل`

---

### 3.5 📷 طلب الموافقة على تخطي الصورة (PHOTO_SKIP_REQUESTED)

**متى يُرسَل:**
1. `POST /api/tenant/orders/[id]/request-photo-skip` (داخلي) → للـ `MANAGER`s
2. `POST /api/biker/order/[id]/proof/skip` (من تطبيق البايكر) → للـ `admin`/`supervisor`

**Backend files:**
- `app/api/tenant/orders/[id]/request-photo-skip/route.js:101`
- `app/api/biker/order/[id]/proof/skip/route.js:125`

**Payload:**
```json
{
  "title":            "Photo skip approval needed 📷",
  "body":             "Order #ORD-2024-0042: biker requested to skip the after-photo.",
  "type":             "0",
  "notificationType": "order_updates",
  "orderId":          "65f1...",
  "phase":            "after",
  "action":           "photo_skip_review",
  "url":              "/",
  "timestamp":        "..."
}
```

**رسالة (EN/AR):**
- EN: `"Photo skip approval needed 📷"` — `Order #${orderNumber}: biker requested to skip the after-photo.`
- AR: `"موافقة على تخطي الصورة 📷"` — `الطلب #${orderNumber}: طلب البايكر تخطي صورة ما بعد الغسيل.`

**Frontend Action:**
```js
if (data.action === 'photo_skip_review') {
  navigation.navigate('PhotoSkipReview', { orderId: data.orderId, phase: data.phase })
}
```

---

### 3.6 📢 Broadcast من Superadmin

**متى يُرسَل:**
عند `POST /api/notification/send` من dashboard superadmin بفلتر مناسب.

**Payload:** أي title/body + `data.notificationType = 'dashboard_notification'` + `data.url` (default: `/biker/notifications`).

---

## 4. الربط على Web Dashboard (Partner Browser)

### 4.1 الـ Service Worker (موجود مسبقاً)

ملف `public/firebase-messaging-sw.js` يستقبل الإشعارات في الـ background ويبث للـ tabs.

### 4.2 استخدام `FCMTokenManager`

```js
// libs/firebase/messaging.js (موجود)
import fcmTokenManager from '@/libs/firebase/messaging'

// عند الـ login:
await fcmTokenManager.initialize()
```

الـ manager يقوم تلقائياً بـ:
1. طلب إذن الإشعارات (مع modal مخصص).
2. تسجيل SW (`/firebase-messaging-sw.js`).
3. الحصول على FCM token عبر VAPID key.
4. إرسال الـ token للـ backend عبر `POST /api/fcm/token`.
5. ربط `onMessage` (foreground) و SW message listener.
6. تجديد الـ token كل 5 دقائق.

### 4.3 Hook للـ Real-Time Badge

```jsx
// hooks/useRealtimeNotification.js (موجود)
import useRealtimeNotification from '@/hooks/useRealtimeNotification'

function NotificationBadge() {
  const { unreadCount, clear, hasNew } = useRealtimeNotification()
  const router = useRouter()

  return (
    <button
      onClick={() => {
        clear()
        router.push('/dashboard/notifications')
      }}
      className="relative"
    >
      <Bell size={20} />
      {hasNew && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1.5">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </button>
  )
}
```

### 4.4 Toast على Foreground

`fcmTokenManager` يعرض toast تلقائياً عبر `react-toastify`. الـ click يفتح `data.url`.

### 4.5 Routing على ضغط الإشعار

في `libs/firebase/messaging.js → showForegroundNotification`، الـ click يستخدم `data.url`. لكن **يجب** تحسينه للـ partner ليفتح الصفحة الصحيحة:

```js
// مقترح: ضع هذا في component يقرأ من useRealtimeNotification
useEffect(() => {
  const unsub = fcmTokenManager.addMessageListener(msg => {
    const data = msg?.data
    if (!data) return

    // إشعار طلب جديد للـ partner
    if (data.type === 'NEW_ORDER') {
      const order = JSON.parse(data.order)
      // افتح modal مخصص (سيمولاتور للـ mobile incoming call)
      showNewOrderModal(order)
      return
    }

    // إشعارات order_updates، new_order pending، إلخ
    switch (data.notificationType) {
      case 'new_order':
        router.push(`/dashboard/orders/${data.orderId}`)
        break
      case 'order_updates':
        router.push(`/dashboard/orders/${data.orderId}`)
        break
      default:
        router.push('/dashboard/notifications')
    }
  })

  return unsub
}, [router])
```

---

## 5. الربط على Mobile Partner App (Expo / React Native)

### 5.1 المتطلبات

```bash
npx expo install expo-notifications expo-device expo-av
# expo-av للـ ringing loop
```

### 5.2 تسجيل Android Channels

```js
import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'

async function setupPartnerChannels() {
  if (Platform.OS !== 'android') return

  // أهم channel للـ partner: incoming_orders_v6 مع ringing
  await Notifications.setNotificationChannelAsync('incoming_orders_v6', {
    name:             'Incoming Orders',
    importance:       Notifications.AndroidImportance.MAX,
    sound:            'ring_loop',  // ← ملف داخل android/app/src/main/res/raw/ring_loop.mp3
    vibrationPattern: [0, 1000, 500, 1000, 500, 1000],
    enableLights:     true,
    lightColor:       '#FF0000',
    enableVibrate:    true,
    showBadge:        true,
    bypassDnd:        true,  // يتجاوز Do Not Disturb
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
  })

  await Notifications.setNotificationChannelAsync('new_order', {
    name:       'New Orders',
    importance: Notifications.AndroidImportance.MAX,
    sound:      'default',
    vibrationPattern: [0, 500, 200, 500],
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

### 5.3 تسجيل Token

```js
import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'

export async function registerPartnerForPush(jwt) {
  if (!Device.isDevice) return null

  const { status: existing } = await Notifications.getPermissionsAsync()
  let finalStatus = existing
  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync()
    finalStatus = status
  }
  if (finalStatus !== 'granted') return null

  const tokenData = await Notifications.getExpoPushTokenAsync({
    projectId: process.env.EXPO_PROJECT_ID,
  })
  const token = tokenData.data

  await fetch(`${API_URL}/api/notifications/register`, {
    method:  'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization:  `Bearer ${jwt}`,
    },
    body: JSON.stringify({ fcmToken: token }),
  })

  return token
}
```

### 5.4 Foreground Handler + Ring Logic

```js
import * as Notifications from 'expo-notifications'
import { Audio } from 'expo-av'

let ringSound = null

async function startRingLoop() {
  try {
    if (ringSound) await stopRingLoop()

    const { sound } = await Audio.Sound.createAsync(
      require('./assets/ring_loop.mp3'),
      { shouldPlay: true, isLooping: true, volume: 1.0 }
    )
    ringSound = sound
  } catch (e) {
    console.error('ring failed', e)
  }
}

async function stopRingLoop() {
  try {
    if (ringSound) {
      await ringSound.stopAsync()
      await ringSound.unloadAsync()
      ringSound = null
    }
  } catch {}
}

Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    const data = notification.request.content.data

    // طلب جديد — خلي الـ system يعرضه + شغل ring loop
    if (data.type === 'NEW_ORDER') {
      startRingLoop()
      return {
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge:  true,
        priority: Notifications.AndroidNotificationPriority.MAX,
      }
    }

    return {
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge:  true,
    }
  },
})
```

### 5.5 Hook كامل للـ partner

```js
// hooks/usePartnerNotifications.js
import { useEffect, useRef } from 'react'
import * as Notifications from 'expo-notifications'
import { useNavigation } from '@react-navigation/native'

export default function usePartnerNotifications() {
  const navigation = useNavigation()
  const recvSub    = useRef()
  const respSub    = useRef()

  useEffect(() => {
    recvSub.current = Notifications.addNotificationReceivedListener(notification => {
      const data = notification.request.content.data
      handlePartnerForeground(data, navigation)
    })

    respSub.current = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data
      routePartnerNotification(data, navigation)
    })

    Notifications.getLastNotificationResponseAsync().then(response => {
      if (response) {
        const data = response.notification.request.content.data
        routePartnerNotification(data, navigation)
      }
    })

    return () => {
      Notifications.removeNotificationSubscription(recvSub.current)
      Notifications.removeNotificationSubscription(respSub.current)
    }
  }, [navigation])
}

function handlePartnerForeground(data, navigation) {
  // إذا طلب جديد — افتح شاشة Incoming Call فوراً
  if (data.type === 'NEW_ORDER') {
    try {
      const order = JSON.parse(data.order)
      navigation.navigate('IncomingOrder', { order })
    } catch (e) {
      console.error('parse order failed', e)
    }
  }
}

function routePartnerNotification(data, navigation) {
  // طلب جديد — شاشة Incoming Call
  if (data.type === 'NEW_ORDER') {
    const order = JSON.parse(data.order)
    navigation.navigate('IncomingOrder', { order })
    return
  }

  const orderId = data.orderId

  switch (data.notificationType) {
    case 'new_order':
      navigation.navigate('PendingOrderDetails', { orderId })
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

### 5.6 شاشة Incoming Order (ملء الشاشة)

```jsx
import { useEffect } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'

export default function IncomingOrderScreen({ route, navigation }) {
  const { order } = route.params

  useEffect(() => {
    // ابدأ الـ ring لو لم يكن شغّال
    startRingLoop()

    return () => stopRingLoop()
  }, [])

  async function accept() {
    stopRingLoop()
    try {
      const res = await fetch(`${API_URL}/api/tenant/orders/${order.id}/accept`, {
        method:  'POST',
        headers: { Authorization: `Bearer ${jwt}` },
      })
      if (res.ok) {
        navigation.replace('OrderDetails', { orderId: order.id })
      }
    } catch (e) {
      console.error(e)
    }
  }

  async function reject() {
    stopRingLoop()
    await fetch(`${API_URL}/api/tenant/orders/${order.id}/reject`, {
      method:  'POST',
      headers: { Authorization: `Bearer ${jwt}` },
    })
    navigation.goBack()
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>طلب جديد</Text>
      <Text style={styles.customer}>{order.customerName}</Text>
      <Text style={styles.service}>{order.service}</Text>
      <Text style={styles.location}>{order.location}</Text>
      <Text style={styles.total}>{order.total} SAR</Text>

      <View style={styles.buttons}>
        <TouchableOpacity style={styles.reject} onPress={reject}>
          <Text style={styles.btnText}>رفض</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.accept} onPress={accept}>
          <Text style={styles.btnText}>قبول</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1B7BF5', justifyContent: 'center', alignItems: 'center', padding: 24 },
  label:     { fontSize: 28, color: 'white', marginBottom: 24 },
  customer:  { fontSize: 32, fontWeight: 'bold', color: 'white', marginBottom: 12 },
  service:   { fontSize: 20, color: 'white', marginBottom: 8 },
  location:  { fontSize: 16, color: 'white', marginBottom: 12 },
  total:     { fontSize: 36, fontWeight: 'bold', color: 'white', marginBottom: 48 },
  buttons:   { flexDirection: 'row', gap: 16, marginTop: 24 },
  reject:    { backgroundColor: '#E53E3E', paddingHorizontal: 32, paddingVertical: 16, borderRadius: 999 },
  accept:    { backgroundColor: '#38A169', paddingHorizontal: 32, paddingVertical: 16, borderRadius: 999 },
  btnText:   { color: 'white', fontSize: 18, fontWeight: 'bold' },
})
```

### 5.7 الاستخدام في `App.js`

```js
function App() {
  const { user, jwt } = useAuth()

  usePartnerNotifications()

  useEffect(() => {
    if (user?.role === 'admin' || user?.role === 'supervisor') {
      setupPartnerChannels()
      registerPartnerForPush(jwt)
    }
  }, [user, jwt])

  return <YourNavigator />
}
```

---

## 6. APIs لجلب وإدارة الإشعارات

### 6.1 قائمة الإشعارات

```http
GET /api/notification?page=1&limit=20
Authorization: Bearer <jwt>
```

> الـ tenant staff يستخدم `/api/notification` (وليس `/biker/*` أو `/client/*`).

### 6.2 إشعار واحد

```http
GET /api/notification/:id
Authorization: Bearer <jwt>
```

### 6.3 إرسال إشعار (للـ Superadmin/Admin)

```http
POST /api/notification/send
Authorization: Bearer <jwt>
Content-Type: application/json

{
  "title":          "إعلان",
  "body":           "...",
  "type":           2,
  "userIds":        [],
  "groupIds":       [],
  "audienceFilter": "bikers",
  "data":           { "url": "/biker/orders" }
}
```

---

## 7. Checklist تكامل الـ Partner — 100%

### Web Dashboard
- [ ] `firebase-messaging-sw.js` موجود في `public/`.
- [ ] استدعاء `fcmTokenManager.initialize()` بعد الـ login.
- [ ] `useRealtimeNotification()` في الـ Sidebar/Header لعرض الـ badge.
- [ ] `clear()` على فتح صفحة الإشعارات.
- [ ] Listener مخصص للـ `data.type === 'NEW_ORDER'` يفتح modal.

### Mobile Partner App
- [ ] `expo-notifications`, `expo-device`, `expo-av` مثبتَين.
- [ ] ملف `ring_loop.mp3` في `assets/` وفي `android/app/src/main/res/raw/`.
- [ ] طلب الإذن **بعد** الـ login.
- [ ] تسجيل `incoming_orders_v6`, `new_order`, `order_updates`, `general` channels.
- [ ] `sound: 'ring_loop'` على channel `incoming_orders_v6`.
- [ ] `setNotificationHandler` يميّز `data.type === 'NEW_ORDER'` ويشغل ring.
- [ ] `addNotificationReceivedListener` يفتح Incoming Order screen في foreground.
- [ ] `addNotificationResponseReceivedListener` للـ tap routing.
- [ ] `getLastNotificationResponseAsync` للـ cold-start.
- [ ] `JSON.parse(data.order)` للـ NEW_ORDER payload.
- [ ] `stopRingLoop()` في accept/reject/dismiss.
- [ ] حذف الـ token عند logout.
- [ ] احذر: على Android، النشاط الذي يفتح فوق lock screen يحتاج `Activity.setShowWhenLocked(true)` (Expo dev build أو bare workflow).

---

## 8. ملاحظات حرجة (Partner-Specific)

### 8.1 NEW_ORDER لا يحوي title/body
هذا متعمد لتجنب عرض الإشعار العادي من Android — الـ app **يجب** أن يعرض شاشة Incoming Call مخصصة.

> إذا الـ app غير مهيأ لاستقبال `data.type === 'NEW_ORDER'`، الـ partner لن يرى شيئاً!

### 8.2 الـ Order data هو JSON string
**خطأ شائع:** الـ Expo `Notifications` تسلسل الـ data كـ object، لكن FCM يرسل كل قيمة كـ string. يجب:
```js
const order = typeof data.order === 'string' ? JSON.parse(data.order) : data.order
```

### 8.3 الـ Ring Loop يستهلك بطارية
- **لا تستخدم** `Audio.Sound` بدون `unloadAsync()` بعد الانتهاء.
- على Android، الـ Notification channel sound (`ring_loop`) أفضل من JS-based Audio loop.
- اضبط timeout (مثلاً 30 ثانية) ثم أوقف الـ ring تلقائياً.

### 8.4 Doze Mode على Android
- استخدم `priority: 'high'` في FCM payload.
- channel `incoming_orders_v6` بـ `bypassDnd: true`.
- على Samsung/Xiaomi، الـ user يجب أن يضيف الـ app في "Auto-start" و "Battery — Unrestricted".

### 8.5 الـ Owner vs Admins
- إشعار **NEW_ORDER (ring)** يصل **فقط لمالك التينانت** (`tenant.ownerUserId`).
- إشعار **NEW_ORDER_PENDING** (بعد TAP authorize) يصل **لكل MANAGER**.
- إذا الـ admin مش الـ owner، يصلهم `order_updates` فقط (مش الـ ring).

---

## 9. Debugging

### الـ NEW_ORDER ring لا يظهر

1. **افحص أنك مالك التينانت:**
   ```js
   GET /api/tenant/me
   // ownerUserId === user._id ؟
   ```
2. **افحص الـ data.type === 'NEW_ORDER':**
   ```js
   console.log('payload data:', JSON.stringify(data))
   ```
3. **افحص channel `incoming_orders_v6` مسجّل:**
   ```js
   const channels = await Notifications.getNotificationChannelsAsync()
   console.log(channels.find(c => c.id === 'incoming_orders_v6'))
   ```
4. **افحص الـ sound موجود فعلاً:**
   - `android/app/src/main/res/raw/ring_loop.mp3` (lowercase, no spaces)

### الإشعار يصل لكن الـ tap لا يفتح الشاشة الصحيحة

- تأكد `data.notificationType` موجود.
- تأكد الـ navigation ref جاهز (`useNavigation` خارج NavigationContainer لا يعمل).
- استخدم `NavigationContainer` ref مع deep linking للـ cold start.

---

## 10. مرجع سريع (Cheatsheet)

| الإشعار | الـ key للكشف | الشاشة |
|---------|---------------|---------|
| طلب جديد (ring) | `data.type === 'NEW_ORDER'` | `IncomingOrder` |
| طلب pending acceptance | `notificationType: 'new_order'` (بدون type=NEW_ORDER) | `PendingOrderDetails` |
| تحديث حالة طلب | `notificationType: 'order_updates'` (بدون action) | `OrderDetails` |
| طلب موافقة skip صورة | `notificationType: 'order_updates'` + `action: 'photo_skip_review'` | `PhotoSkipReview` |
| إلغاء طلب | `notificationType: 'order_updates'` + `status: 'CANCELLED'` | `OrderDetails` + alert |
| broadcast | `notificationType: 'dashboard_notification'` | `Notifications` |
