/**
 * @format
 */

import {AppRegistry} from 'react-native';
import {
  getMessaging,
  setBackgroundMessageHandler,
  onMessage,
} from '@react-native-firebase/messaging';
import notifee, {
  AndroidImportance,
  AndroidVisibility,
  AndroidCategory,
  EventType,
  TriggerType,
  AlarmType,
} from '@notifee/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import App from './App';
import {name as appName} from './app.json';
import {
  CHANNEL_INCOMING,
  CHANNEL_NEW_ORDER,
  CHANNEL_GENERAL,
  resolveChannel,
  setupNotifeeChannels,
} from './src/services/notificationChannel';
import {launchIncomingOrder} from './src/services/fullScreenIntent';

// Ring loop config — matches RING_MAX_MS (180s = 3 min) in notificationChannel.js
// 23 × 8s = 184s ensures the ring covers the full 180s window even with small
// delays between scheduled alarms firing. The ring tone file is 8s long.
const RING_INTERVAL_MS = 8000;
const RING_COUNT       = 23;
const MISSED_DELAY_MS  = 180_000;  // Show "missed" notification at 3 minutes

// Schedules a ringing loop of `RING_COUNT` notifications (one immediate + repeats
// every RING_INTERVAL_MS) plus a final "missed order" notification at MISSED_DELAY_MS.
// Each notification has the same channel + sound so Android keeps ringing.
async function displayOrderNotification(order) {
  await notifee.createChannel({
    id:               CHANNEL_INCOMING,
    name:             'طلبات جديدة — رنين البايكر',
    importance:       AndroidImportance.HIGH,
    visibility:       AndroidVisibility.PUBLIC,
    vibration:        true,
    vibrationPattern: [600, 400, 600, 400],
    sound:            'new_order_alert',
    bypassDnd:        true,
  });
  await setupNotifeeChannels();

  const baseBody = `${order?.service ?? order?.customerName ?? 'خدمة غسيل'} — ${order?.location ?? ''}`;
  const baseAndroid = {
    channelId:        CHANNEL_INCOMING,
    importance:       AndroidImportance.HIGH,
    visibility:       AndroidVisibility.PUBLIC,
    category:         AndroidCategory.CALL,
    sound:            'new_order_alert',
    vibrationPattern: [600, 400, 600, 400],
    ongoing:          true,
    autoCancel:       false,
    lightUpScreen:    true,
    onlyAlertOnce:    false,
    pressAction:      {id: 'default', launchActivity: 'default'},
    fullScreenAction: {id: 'default', launchActivity: 'default'},
  };
  const baseIos = {sound: 'default', critical: true, criticalVolume: 1.0};

  // Cancel any leftover ring from a prior order before starting fresh.
  for (let i = 0; i < RING_COUNT; i++) {
    await notifee.cancelTriggerNotification(`incoming_order_${i}`).catch(() => {});
    await notifee.cancelNotification(`incoming_order_${i}`).catch(() => {});
  }

  // First ring — immediate
  await notifee.displayNotification({
    id:    'incoming_order_0',
    title: '🚗 طلب جديد وارد!',
    body:  baseBody,
    data:  {orderId: String(order?.id || ''), notificationType: 'new_order'},
    android: baseAndroid,
    ios:    baseIos,
  });

  // Subsequent rings — scheduled via TimestampTrigger so Headless JS can return
  const now = Date.now();
  for (let i = 1; i < RING_COUNT; i++) {
    await notifee.createTriggerNotification(
      {
        id:    `incoming_order_${i}`,
        title: '🚗 طلب جديد وارد!',
        body:  baseBody,
        data:  {orderId: String(order?.id || ''), notificationType: 'new_order'},
        android: baseAndroid,
        ios:    baseIos,
      },
      {
        type:      TriggerType.TIMESTAMP,
        timestamp: now + i * RING_INTERVAL_MS,
        alarmManager: {type: AlarmType.SET_AND_ALLOW_WHILE_IDLE},
      },
    ).catch(() => {});
  }

  // Silent "missed order" notification at 60s — WhatsApp missed-call equivalent
  await notifee.createTriggerNotification(
    {
      id:    `missed_order_${order?.id || now}`,
      title: '⏰ طلب فائت',
      body:  baseBody,
      data:  {orderId: String(order?.id || ''), notificationType: 'order_updates', missed: '1'},
      android: {
        channelId:   CHANNEL_GENERAL,
        smallIcon:   'ic_notification',
        importance:  AndroidImportance.DEFAULT,
        autoCancel:  true,
        pressAction: {id: 'default', launchActivity: 'default'},
      },
      ios: {sound: 'default'},
    },
    {
      type:      TriggerType.TIMESTAMP,
      timestamp: now + MISSED_DELAY_MS,
      alarmManager: {type: AlarmType.SET_AND_ALLOW_WHILE_IDLE},
    },
  ).catch(() => {});
}

// Cancel any pending ring triggers (called when the app opens and recovers the order)
async function cancelPendingRingTriggers() {
  for (let i = 0; i < RING_COUNT; i++) {
    await notifee.cancelTriggerNotification(`incoming_order_${i}`).catch(() => {});
    await notifee.cancelNotification(`incoming_order_${i}`).catch(() => {});
  }
}

async function displayGenericNotification(remoteMessage) {
  const {data, notification} = remoteMessage;
  // Backend sends data-only messages — title/body are in data, not notification.
  // Fall back across common key spellings the backend might use.
  const title =
    data?.title || data?.notificationTitle || notification?.title || 'تمام';
  const body =
    data?.body || data?.message || data?.notificationBody || notification?.body || '';

  const notificationType = data?.notificationType ?? data?.type ?? 'general';
  // Honor an explicit channel from the backend (data.androidChannelId), falling
  // back to type-based resolution. The backend now sends true data-only messages
  // and carries the resolved channel here.
  const channelId = data?.androidChannelId || resolveChannel(notificationType);

  // In the background/headless task the channel may not exist yet — create the
  // exact channel we're about to use *before* displaying, instead of relying on
  // setupNotifeeChannels() (which reads AsyncStorage and can be flaky here).
  await notifee.createChannel({
    id:         channelId,
    name:       'الإشعارات',
    importance: AndroidImportance.HIGH,
    visibility: AndroidVisibility.PUBLIC,
    sound:      'default',
  }).catch(() => {});
  await setupNotifeeChannels().catch(() => {});

  await notifee.displayNotification({
    title,
    body,
    data:  data ?? {},
    android: {
      channelId,
      smallIcon:   'ic_notification',
      importance:  AndroidImportance.HIGH,
      visibility:  AndroidVisibility.PUBLIC,
      pressAction: {id: 'default'},
    },
    ios: {
      sound: 'default',
    },
  });
}

notifee.onBackgroundEvent(async ({type, detail}) => {
  if (type !== EventType.PRESS) return;

  const notifId = detail?.notification?.id ?? '';
  const data    = detail?.notification?.data ?? {};

  // ── Biker: ضغط على إشعار الرنين → إلغاء الرنين + فتح IncomingOrderScreen ──
  if (notifId.startsWith('incoming_order_')) {
    await cancelPendingRingTriggers();
    // IncomingOrderScreen يُفتح تلقائياً عبر pending_incoming_order في FirebaseContext
    return;
  }

  // ── Biker/Partner: ضغط على أي إشعار آخر → navigate لتفاصيل الطلب ──────────
  // نحفظ الـ navigation intent في AsyncStorage لأن FirebaseContext لم يُشغَّل بعد
  const orderId          = data.orderId || data.order_id || data.id || '';
  const notificationType = data.notificationType || data.type || '';

  if (orderId && (notificationType === 'order_updates' || notificationType === 'new_order' || notificationType === 'biker_alerts')) {
    await AsyncStorage.setItem(
      'pending_notification_nav',
      JSON.stringify({notificationType, orderId, action: data.action ?? '', status: data.status ?? '', decision: data.decision ?? ''}),
    ).catch(() => {});
  }
});

// Partner: one-shot alert with new_order_alert sound (no looping)
async function displayPartnerNewOrderNotification(order) {
  // Create the channel explicitly first (Android must register it before we can
  // use it in the same background task — setupNotifeeChannels runs after).
  await notifee.createChannel({
    id:               CHANNEL_NEW_ORDER,
    name:             'طلبات جديدة — تنبيه المغسلة',
    importance:       AndroidImportance.HIGH,
    visibility:       AndroidVisibility.PUBLIC,
    vibration:        true,
    sound:            'new_order_alert',
    bypassDnd:        true,
  });
  await setupNotifeeChannels();

  const body = [
    order?.service ?? order?.customerName ?? 'خدمة غسيل',
    order?.location,
  ].filter(Boolean).join(' — ');

  const orderNo = order?.orderNumber ?? order?.number ?? order?.orderNo
    ?? (order?.id ? String(order.id).slice(-6).toUpperCase() : '');
  const title = orderNo ? `🔔 طلب جديد #${orderNo}` : '🔔 طلب جديد!';

  await notifee.displayNotification({
    id:    `new_order_${order?.id ?? Date.now()}`,
    title,
    body,
    data: {
      notificationType: 'new_order',
      orderId:          String(order?.id ?? ''),
    },
    android: {
      channelId:        CHANNEL_NEW_ORDER,
      smallIcon:        'ic_notification',
      importance:       AndroidImportance.HIGH,
      visibility:       AndroidVisibility.PUBLIC,
      sound:            'new_order_alert',
      vibrationPattern: [400, 200, 400, 200, 400],
      autoCancel:       true,
      pressAction:      {id: 'default', launchActivity: 'default'},
    },
    ios: {
      sound:          'new_order_alert.mp3',
      critical:       true,
      criticalVolume: 1.0,
    },
  });
}

// ─── Handler for Foreground messages (when app is open) ───────────────────────
onMessage(getMessaging(), async remoteMessage => {
  console.log('TAMAM_FG', JSON.stringify({
    data: remoteMessage?.data ?? null,
    notification: remoteMessage?.notification ?? null,
  }));

  const {data} = remoteMessage;

  if (data?.type === 'NEW_ORDER' && data?.order) {
    let parsedOrder = null;
    try { parsedOrder = JSON.parse(data.order); } catch {}

    const role = await AsyncStorage.getItem('user_role').catch(() => null);
    const isBiker = role === 'biker';

    await AsyncStorage.setItem('pending_incoming_order', data.order).catch(() => {});

    if (isBiker) {
      if (parsedOrder) await displayOrderNotification(parsedOrder);
      await launchIncomingOrder(parsedOrder?.id ?? '', data.order).catch(() => {});
    } else {
      if (parsedOrder) await displayPartnerNewOrderNotification(parsedOrder);
    }
    return;
  }

  await displayGenericNotification(remoteMessage);
});

// ─── Handler for Background/Closed messages ──────────────────────────────────
setBackgroundMessageHandler(getMessaging(), async remoteMessage => {
  const {data} = remoteMessage;

  // TEMP DIAGNOSTIC — يطبع الرسالة الكاملة في logcat لفحص أسماء الحقول الفعلية.
  // افحصها بـ:  adb logcat -s ReactNativeJS | grep TAMAM_BG
  // احذفه بعد تأكيد بنية الـ payload.
  console.log('TAMAM_BG', JSON.stringify({
    data: remoteMessage?.data ?? null,
    notification: remoteMessage?.notification ?? null,
  }));

  if (data?.type === 'NEW_ORDER' && data?.order) {
    let parsedOrder = null;
    try { parsedOrder = JSON.parse(data.order); } catch {}

    // قرأ الـ role من AsyncStorage لنحدد بايكر أم partner
    const role = await AsyncStorage.getItem('user_role').catch(() => null);
    const isBiker = role === 'biker';

    await AsyncStorage.setItem('pending_incoming_order', data.order).catch(() => {});

    if (isBiker) {
      // بايكر: رنين متكرر + فتح الشاشة فوق شاشة القفل
      if (parsedOrder) await displayOrderNotification(parsedOrder);
      await launchIncomingOrder(
        parsedOrder?.id ?? '',
        data.order,
      ).catch(() => {});
    } else {
      // partner: نغمة تنبيه واحدة فقط — لا رنين
      if (parsedOrder) await displayPartnerNewOrderNotification(parsedOrder);
    }
    return;
  }

  await displayGenericNotification(remoteMessage);
});

AppRegistry.registerComponent(appName, () => App);