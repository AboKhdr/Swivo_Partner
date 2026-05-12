/**
 * @format
 */

import {AppRegistry} from 'react-native';
import {
  getMessaging,
  setBackgroundMessageHandler,
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
  CHANNEL_GENERAL,
  resolveChannel,
} from './src/services/notificationChannel';
import {launchIncomingOrder} from './src/services/fullScreenIntent';

// Ring loop config — matches RING_MAX_MS (60s) in notificationChannel.js
// 8 × 8s = 64s ensures the ring covers the full 60s window even with small
// delays between scheduled alarms firing.
const RING_INTERVAL_MS = 8000;
const RING_COUNT       = 8;
const MISSED_DELAY_MS  = 60_000;   // Show "missed" notification at 60s

// Schedules a ringing loop of `RING_COUNT` notifications (one immediate + repeats
// every RING_INTERVAL_MS) plus a final "missed order" notification at MISSED_DELAY_MS.
// Each notification has the same channel + sound so Android keeps ringing.
async function displayOrderNotification(order) {
  await notifee.createChannel({
    id:               CHANNEL_INCOMING,
    name:             'طلبات جديدة',
    importance:       AndroidImportance.HIGH,
    visibility:       AndroidVisibility.PUBLIC,
    vibration:        true,
    vibrationPattern: [600, 400, 600, 400],
    sound:            'incoming_order',
    bypassDnd:        true,
  });

  const baseBody = `${order?.service ?? order?.customerName ?? 'خدمة غسيل'} — ${order?.location ?? ''}`;
  const baseAndroid = {
    channelId:        CHANNEL_INCOMING,
    importance:       AndroidImportance.HIGH,
    visibility:       AndroidVisibility.PUBLIC,
    category:         AndroidCategory.CALL,
    sound:            'incoming_order',
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
  // Backend sends data-only messages — title/body are in data, not notification
  const title = data?.title || notification?.title;
  const body  = data?.body  || notification?.body  || '';
  if (!title) return;

  const notificationType = data?.notificationType ?? 'general';
  const channelId = resolveChannel(notificationType);

  await notifee.createChannel({
    id:         channelId,
    name:       channelId,
    importance: AndroidImportance.HIGH,
  });

  await notifee.displayNotification({
    title,
    body,
    data:  data ?? {},
    android: {
      channelId,
      smallIcon:   'ic_notification',
      pressAction: {id: 'default'},
    },
    ios: {
      sound: 'default',
    },
  });
}

notifee.onBackgroundEvent(async ({type, detail}) => {
  if (type !== EventType.PRESS) return;
  const id = detail?.notification?.id ?? '';
  // User tapped any ringing notification — cancel the whole ring loop
  if (id.startsWith('incoming_order_')) {
    await cancelPendingRingTriggers();
  }
});

setBackgroundMessageHandler(getMessaging(), async remoteMessage => {
  const {data} = remoteMessage;

  if (data?.type === 'NEW_ORDER' && data?.order) {
    await AsyncStorage.setItem('pending_incoming_order', data.order).catch(() => {});

    let parsedOrder = null;
    try { parsedOrder = JSON.parse(data.order); } catch {}

    // 1) Schedule the ringing notification loop (provides sound + fallback
    //    heads-up if the system blocks the activity launch).
    if (parsedOrder) await displayOrderNotification(parsedOrder);

    // 2) Bring the IncomingOrderActivity to the foreground over the lock
    //    screen — WhatsApp-style. Requires USE_FULL_SCREEN_INTENT to be
    //    granted (prompted in FirebaseContext.ensureFullScreenPermission).
    await launchIncomingOrder(
      parsedOrder?.id ?? '',
      data.order,
    ).catch(() => {});
    return;
  }

  await displayGenericNotification(remoteMessage);
});

AppRegistry.registerComponent(appName, () => App);
