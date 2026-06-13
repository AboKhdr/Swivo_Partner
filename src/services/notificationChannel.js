import notifee, {
  AndroidImportance,
  AndroidVisibility,
  AndroidCategory,
} from '@notifee/react-native';
import {Platform} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─────────────────────────────────────────────────────────────────────────────
// Channel IDs
// ─────────────────────────────────────────────────────────────────────────────
//
//  CHANNEL_NEW_ORDER   → biker + partner: طلب جديد وارد (نغمة new_order_alert، رنين متكرر كل 8ث)
//  CHANNEL_UPDATES     → biker + partner: تحديثات الطلب (default)
//  CHANNEL_ALERTS      → biker: تنبيهات خاصة بالبايكر (default)
//  CHANNEL_GENERAL     → كل شيء آخر / الطلبات الفائتة (صامت)

export const CHANNEL_NEW_ORDER = 'new_order_v4';
export const CHANNEL_INCOMING  = CHANNEL_NEW_ORDER;       // alias — same channel for biker ring
export const CHANNEL_UPDATES   = 'order_updates_v2';
export const CHANNEL_ALERTS    = 'biker_alerts_v2';
export const CHANNEL_GENERAL   = 'general_v2';

// ─────────────────────────────────────────────────────────────────────────────
// Setup — call once at app launch (FirebaseContext.bootstrap)
// ─────────────────────────────────────────────────────────────────────────────

// Channel definitions — change `sound` or `importance` here and the app will
// auto-delete + recreate the channel on next launch without touching the ID.
const CHANNEL_DEFINITIONS = [
  {
    id:               CHANNEL_NEW_ORDER,
    name:             'طلب جديد وارد',
    importance:       AndroidImportance.HIGH,
    visibility:       AndroidVisibility.PUBLIC,
    vibration:        true,
    vibrationPattern: [400, 200, 400, 200],
    sound:            'new_order_alert',
    bypassDnd:        true,
  },
  {
    id:               CHANNEL_UPDATES,
    name:             'تحديثات الطلبات',
    importance:       AndroidImportance.HIGH,
    vibration:        true,
    vibrationPattern: [200, 100, 200, 100],
    sound:            'default',
  },
  {
    id:               CHANNEL_ALERTS,
    name:             'تنبيهات البايكر',
    importance:       AndroidImportance.HIGH,
    vibration:        true,
    vibrationPattern: [200, 100, 200, 100],
    sound:            'default',
  },
  {
    id:         CHANNEL_GENERAL,
    name:       'عام',
    importance: AndroidImportance.DEFAULT,
    sound:      'default',
  },
]

// Recreates a channel only if its sound or importance changed.
// Android caches channel settings on first creation — the only way to update
// them is to delete + recreate. We track a hash of (sound + importance) in
// AsyncStorage so this check runs once per app version, not on every launch.
async function ensureChannel(def) {
  const key         = `ch_sig_${def.id}`
  const vp          = (def.vibrationPattern ?? []).join(',')
  const sig         = `${def.sound}|${def.importance}|${vp}`
  const storedSig   = await AsyncStorage.getItem(key).catch(() => null)

  if (storedSig !== sig) {
    // Settings changed (or first install) — delete old channel and recreate
    await notifee.deleteChannel(def.id).catch(() => {})
    await notifee.createChannel(def)
    await AsyncStorage.setItem(key, sig).catch(() => {})
  } else {
    // No change — still call createChannel (no-op if already exists)
    await notifee.createChannel(def)
  }
}

export async function setupNotifeeChannels() {
  if (Platform.OS !== 'android') return
  await Promise.all(CHANNEL_DEFINITIONS.map(ensureChannel))
}

// Backward-compat alias used in FirebaseContext.bootstrap
export const setupNotifeeChannel = setupNotifeeChannels;

// ─────────────────────────────────────────────────────────────────────────────
// resolveChannel — maps notificationType + role → channelId
// ─────────────────────────────────────────────────────────────────────────────

export function resolveChannel(notificationType) {
  switch (notificationType) {
    case 'new_order':
      return CHANNEL_NEW_ORDER;
    case 'order_updates':
      return CHANNEL_UPDATES;
    case 'biker_alerts':
      return CHANNEL_ALERTS;
    case 'dashboard_notification':
    default:
      return CHANNEL_GENERAL;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// displayNotification — generic one-shot notification
// ─────────────────────────────────────────────────────────────────────────────

export async function displayNotification({title, body, notificationType, data = {}}) {
  const channelId = resolveChannel(notificationType);

  await notifee.displayNotification({
    title,
    body,
    data,
    android: {
      channelId,
      smallIcon:   'ic_notification',
      importance:  AndroidImportance.HIGH,
      pressAction: {id: 'default'},
    },
    ios: {
      sound: notificationType === 'new_order' ? 'new_order_alert.aiff' : 'default',
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Incoming-order ring loop (biker + partner) — نغمة تتكرر كل 8ث لمدة 3 دقائق
// ─────────────────────────────────────────────────────────────────────────────

export const RING_MAX_MS = 180_000;
export const RING_COUNT  = 23;       // 23 × 8s = 184s ≥ 180s

let _ringInterval = null;
let _ringTimeout  = null;

export async function showIncomingOrderNotification(order) {
  stopRinging();

  const body = [
    order?.service ?? order?.customerName ?? 'خدمة غسيل',
    order?.location,
  ].filter(Boolean).join(' — ');

  let tick = 0;

  const ring = async () => {
    // Cancel the other slot first so Android re-triggers the sound
    await notifee.cancelNotification(`incoming_order_${(tick + 1) % 2}`).catch(() => {});
    const id = `incoming_order_${tick % 2}`;
    tick++;
    await notifee.displayNotification({
      id,
      title:   '🚗 طلب جديد وارد!',
      body,
      data: {
        notificationType: 'new_order',
        orderId:          String(order?.id ?? ''),
      },
      android: {
        channelId:        CHANNEL_INCOMING,
        importance:       AndroidImportance.HIGH,
        visibility:       AndroidVisibility.PUBLIC,
        category:         AndroidCategory.CALL,
        sound:            'new_order_alert',
        vibrationPattern: [400, 200, 400, 200],
        ongoing:          true,
        autoCancel:       false,
        onlyAlertOnce:    false,
        lightUpScreen:    true,
        pressAction:      {id: 'default', launchActivity: 'default'},
        fullScreenAction: {id: 'default', launchActivity: 'default'},
      },
      ios: {
        sound:          'new_order_alert.aiff',
        critical:       true,
        criticalVolume: 1.0,
      },
    });
  };

  await ring();
  _ringInterval = setInterval(ring, 8000);

  _ringTimeout = setTimeout(() => {
    convertToMissedNotification(order).catch(() => {});
  }, RING_MAX_MS);
}

export function stopRinging() {
  if (_ringInterval) { clearInterval(_ringInterval); _ringInterval = null; }
  if (_ringTimeout)  { clearTimeout(_ringTimeout);   _ringTimeout  = null; }
}

export async function cancelIncomingOrderNotification(orderId) {
  stopRinging();
  const cancels = [];
  for (let i = 0; i < Math.max(RING_COUNT, 2); i++) {
    cancels.push(notifee.cancelNotification(`incoming_order_${i}`).catch(() => {}));
    cancels.push(notifee.cancelTriggerNotification(`incoming_order_${i}`).catch(() => {}));
  }
  if (orderId) {
    cancels.push(notifee.cancelTriggerNotification(`missed_order_${orderId}`).catch(() => {}));
    cancels.push(notifee.cancelNotification(`missed_order_${orderId}`).catch(() => {}));
  }
  await Promise.all(cancels);
}

// ─────────────────────────────────────────────────────────────────────────────
// Missed-order notification — صامتة بعد انتهاء وقت الرنين
// ─────────────────────────────────────────────────────────────────────────────

export async function convertToMissedNotification(order) {
  stopRinging();
  await Promise.all([
    notifee.cancelNotification('incoming_order_0').catch(() => {}),
    notifee.cancelNotification('incoming_order_1').catch(() => {}),
  ]);

  const body = [
    order?.service ?? order?.customerName ?? 'خدمة غسيل',
    order?.location,
  ].filter(Boolean).join(' — ');

  await notifee.displayNotification({
    id:    `missed_order_${order?.id ?? Date.now()}`,
    title: '⏰ طلب فائت',
    body,
    data: {
      notificationType: 'order_updates',
      orderId:          String(order?.id ?? ''),
      missed:           '1',
    },
    android: {
      channelId:   CHANNEL_GENERAL,
      smallIcon:   'ic_notification',
      importance:  AndroidImportance.DEFAULT,
      autoCancel:  true,
      pressAction: {id: 'default', launchActivity: 'default'},
    },
    ios: {sound: 'default'},
  });
}
