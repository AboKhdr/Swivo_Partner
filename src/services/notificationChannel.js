import notifee, {
  AndroidImportance,
  AndroidVisibility,
  AndroidCategory,
} from '@notifee/react-native';
import {Platform} from 'react-native';

export const CHANNEL_ID = 'incoming_orders_v6';

// ── Ring loop — re-posts notification every 3s to replay sound ───────────────
let _ringInterval = null;

export async function showIncomingOrderNotification(order) {
  console.log('[notifee] showIncomingOrderNotification called', order?._id);

  // 1. Permission
  const settings = await notifee.requestPermission();
  console.log('[notifee] permission status:', settings.authorizationStatus);

  // 2. Channel (Android only)
  if (Platform.OS === 'android') {
    const channelId = await notifee.createChannel({
      id: CHANNEL_ID,
      name: 'طلبات جديدة',
      importance: AndroidImportance.HIGH,
      visibility: AndroidVisibility.PUBLIC,
      vibration: true,
      vibrationPattern: [600, 400, 600, 400],
      sound: 'incoming_order',
      bypassDnd: true,
    });
    console.log('[notifee] channel created:', channelId);
  }

  // 3. Stop any previous loop
  stopRinging();

  const body = `${order?.service ?? order?.customerName ?? 'خدمة غسيل'} — ${order?.location ?? ''}`;
  let tick = 0;

  // Android only plays sound on NEW notification id — cancel+redisplay every 8s to re-ring
  const show = async () => {
    // Cancel previous then display with new id to force sound replay
    await notifee.cancelNotification(`incoming_order_${(tick + 1) % 2}`).catch(() => {});
    const id = `incoming_order_${tick % 2}`;
    tick++;
    await notifee.displayNotification({
      id,
      title: '🚗 طلب جديد وارد!',
      body,
      android: {
        channelId: CHANNEL_ID,
        importance: AndroidImportance.HIGH,
        visibility: AndroidVisibility.PUBLIC,
        category: AndroidCategory.CALL,
        sound: 'incoming_order',
        vibrationPattern: [600, 400, 600, 400],
        ongoing: true,
        autoCancel: false,
        onlyAlertOnce: false,
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
  };

  await show();
  // Repeat every 8s — matches typical ringtone loop length
  _ringInterval = setInterval(show, 8000);
}

export function stopRinging() {
  if (_ringInterval) {
    clearInterval(_ringInterval);
    _ringInterval = null;
  }
}

export async function cancelIncomingOrderNotification() {
  stopRinging();
  await Promise.all([
    notifee.cancelNotification('incoming_order_0').catch(() => {}),
    notifee.cancelNotification('incoming_order_1').catch(() => {}),
  ]);
  console.log('[notifee] notification cancelled');
}
