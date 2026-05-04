import notifee, {
  AndroidImportance,
  AndroidVisibility,
  AndroidCategory,
} from '@notifee/react-native';
import {Platform} from 'react-native';

export const CHANNEL_ID = 'incoming_orders_v5';

export async function setupNotifeeChannel() {
  if (Platform.OS !== 'android') return;
  await notifee.createChannel({
    id: CHANNEL_ID,
    name: 'طلبات جديدة',
    importance: AndroidImportance.HIGH,
    visibility: AndroidVisibility.PUBLIC,
    vibration: true,
    vibrationPattern: [0, 600, 400, 600],
    // res/raw/incoming_order.wav — no extension
    sound: 'incoming_order',
    bypassDnd: true,
  });
}

// ── Repeat loop — re-displays notification every 3s to replay sound ──────────
let _ringInterval = null;

async function _displayOnce(order) {
  await notifee.displayNotification({
    id: 'incoming_order',
    title: '🚗 طلب جديد وارد!',
    body: `${order?.service ?? order?.customerName ?? 'خدمة غسيل'} — ${order?.location ?? ''}`,
    android: {
      channelId: CHANNEL_ID,
      importance: AndroidImportance.HIGH,
      visibility: AndroidVisibility.PUBLIC,
      category: AndroidCategory.CALL,
      sound: 'incoming_order',
      vibrationPattern: [0, 600, 400, 600],
      ongoing: true,
      autoCancel: false,
      onlyAlertOnce: false,   // re-alert every time we update
      lightUpScreen: true,
      pressAction: {id: 'default', launchActivity: 'default'},
      fullScreenAction: {id: 'default', launchActivity: 'default'},
    },
    ios: {
      sound: 'default',
      critical: true,
      criticalVolume: 1.0,
    },
  });
}

export async function showIncomingOrderNotification(order) {
  try {
    await notifee.requestPermission();
    await setupNotifeeChannel();

    // Stop any previous loop first
    stopRinging();

    // Show immediately
    await _displayOnce(order);

    // Re-display every 3s so sound + vibration repeat
    _ringInterval = setInterval(async () => {
      try { await _displayOnce(order); } catch {}
    }, 3000);
  } catch (e) {
    console.log('notifee error:', e);
  }
}

export async function stopRinging() {
  if (_ringInterval) {
    clearInterval(_ringInterval);
    _ringInterval = null;
  }
}

export async function cancelIncomingOrderNotification() {
  try {
    await stopRinging();
    await notifee.cancelNotification('incoming_order');
  } catch {}
}
