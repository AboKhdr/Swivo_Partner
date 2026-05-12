import notifee, {
  AndroidImportance,
  AndroidVisibility,
  AndroidCategory,
} from '@notifee/react-native';
import {Platform} from 'react-native';

// ── Channel IDs ───────────────────────────────────────────────────────────────

export const CHANNEL_INCOMING  = 'incoming_orders_v6';
export const CHANNEL_NEW_ORDER = 'new_order_v2';
export const CHANNEL_UPDATES   = 'order_updates';
export const CHANNEL_ALERTS    = 'biker_alerts';
export const CHANNEL_GENERAL   = 'general';

// ── Setup all channels once at app launch ────────────────────────────────────

export async function setupNotifeeChannel() {
  if (Platform.OS !== 'android') return;

  await notifee.createChannel({
    id:               CHANNEL_INCOMING,
    name:             'طلبات جديدة (رنين)',
    importance:       AndroidImportance.HIGH,
    visibility:       AndroidVisibility.PUBLIC,
    vibration:        true,
    vibrationPattern: [600, 400, 600, 400],
    sound:            'incoming_order',
    bypassDnd:        true,
  });

  await notifee.createChannel({
    id:               CHANNEL_NEW_ORDER,
    name:             'New Orders',
    importance:       AndroidImportance.HIGH,
    vibration:        true,
    vibrationPattern: [300, 150, 300, 150, 300],
    sound:            'default',
  });

  await notifee.createChannel({
    id:               CHANNEL_UPDATES,
    name:             'Order Updates',
    importance:       AndroidImportance.HIGH,
    vibration:        true,
    vibrationPattern: [200, 100, 200],
    sound:            'default',
  });

  await notifee.createChannel({
    id:               CHANNEL_ALERTS,
    name:             'Biker Alerts',
    importance:       AndroidImportance.HIGH,
    vibration:        true,
    vibrationPattern: [200, 100, 200],
    sound:            'default',
  });

  await notifee.createChannel({
    id:         CHANNEL_GENERAL,
    name:       'General',
    importance: AndroidImportance.DEFAULT,
    sound:      'default',
  });
}

// ── Display a generic notification on the correct channel ────────────────────

export async function displayNotification({title, body, notificationType, data = {}}) {
  const channelId = resolveChannel(notificationType);

  await notifee.displayNotification({
    title,
    body,
    data,
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

export function resolveChannel(notificationType) {
  switch (notificationType) {
    case 'new_order':             return CHANNEL_NEW_ORDER;
    case 'order_updates':         return CHANNEL_UPDATES;
    case 'biker_alerts':          return CHANNEL_ALERTS;
    case 'dashboard_notification':
    default:                      return CHANNEL_GENERAL;
  }
}

// ── Incoming order ring loop (partner → biker) ────────────────────────────────

// Ring duration before converting to a silent "missed order" notification.
// Matches the WhatsApp-call style: 60s ring → missed call.
export const RING_MAX_MS = 60_000;
// Number of ring repeats scheduled from the background handler (kept in sync
// with index.js so cancellation covers every scheduled trigger).
export const RING_COUNT  = 8;

let _ringInterval = null;
let _ringTimeout  = null;

export async function showIncomingOrderNotification(order) {
  if (Platform.OS === 'android') {
    await notifee.createChannel({
      id:               CHANNEL_INCOMING,
      name:             'طلبات جديدة (رنين)',
      importance:       AndroidImportance.HIGH,
      visibility:       AndroidVisibility.PUBLIC,
      vibration:        true,
      vibrationPattern: [600, 400, 600, 400],
      sound:            'incoming_order',
      bypassDnd:        true,
    });
  }

  stopRinging();

  const body = `${order?.service ?? order?.customerName ?? 'خدمة غسيل'} — ${order?.location ?? ''}`;
  let tick = 0;

  const show = async () => {
    await notifee.cancelNotification(`incoming_order_${(tick + 1) % 2}`).catch(() => {});
    const id = `incoming_order_${tick % 2}`;
    tick++;
    await notifee.displayNotification({
      id,
      title: '🚗 طلب جديد وارد!',
      body,
      android: {
        channelId:        CHANNEL_INCOMING,
        importance:       AndroidImportance.HIGH,
        visibility:       AndroidVisibility.PUBLIC,
        category:         AndroidCategory.CALL,
        sound:            'incoming_order',
        vibrationPattern: [600, 400, 600, 400],
        ongoing:          true,
        autoCancel:       false,
        onlyAlertOnce:    false,
        lightUpScreen:    true,
        pressAction:      {id: 'default', launchActivity: 'default'},
        fullScreenAction: {id: 'default', launchActivity: 'default'},
      },
      ios: {
        sound:          'default',
        critical:       true,
        criticalVolume: 1.0,
      },
    });
  };

  await show();
  _ringInterval = setInterval(show, 8000);

  // Auto-stop after RING_MAX_MS — convert to silent "missed order" notification.
  _ringTimeout = setTimeout(() => {
    convertToMissedNotification(order).catch(() => {});
  }, RING_MAX_MS);
}

export function stopRinging() {
  if (_ringInterval) {
    clearInterval(_ringInterval);
    _ringInterval = null;
  }
  if (_ringTimeout) {
    clearTimeout(_ringTimeout);
    _ringTimeout = null;
  }
}

export async function cancelIncomingOrderNotification() {
  stopRinging();
  // Cancel both displayed and scheduled-trigger ring notifications.
  // The foreground loop uses incoming_order_0 / _1 (toggled). The background
  // handler schedules incoming_order_0 .. _(RING_COUNT-1) as TimestampTriggers.
  const cancels = [];
  for (let i = 0; i < Math.max(RING_COUNT, 2); i++) {
    cancels.push(notifee.cancelNotification(`incoming_order_${i}`).catch(() => {}));
    cancels.push(notifee.cancelTriggerNotification(`incoming_order_${i}`).catch(() => {}));
  }
  await Promise.all(cancels);
}

// Converts the ringing call into a silent persistent notification — the
// WhatsApp "missed call" equivalent. Tapping it re-opens the partner app.
export async function convertToMissedNotification(order) {
  stopRinging();
  await Promise.all([
    notifee.cancelNotification('incoming_order_0').catch(() => {}),
    notifee.cancelNotification('incoming_order_1').catch(() => {}),
  ]);

  const id = `missed_order_${order?.id || Date.now()}`;
  const body = `${order?.service ?? order?.customerName ?? 'خدمة غسيل'} — ${order?.location ?? ''}`;

  await notifee.displayNotification({
    id,
    title: '⏰ طلب فائت',
    body,
    data: {
      notificationType: 'order_updates',
      orderId: String(order?.id || ''),
      missed: '1',
    },
    android: {
      channelId:   CHANNEL_GENERAL,
      smallIcon:   'ic_notification',
      importance:  AndroidImportance.DEFAULT,
      autoCancel:  true,
      pressAction: {id: 'default', launchActivity: 'default'},
    },
    ios: {
      sound: 'default',
    },
  });
}
