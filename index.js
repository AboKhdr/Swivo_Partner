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
} from '@notifee/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import App from './App';
import {name as appName} from './app.json';

const CHANNEL_ID = 'incoming_orders_v5';

async function displayOrderNotification(order) {
  await notifee.createChannel({
    id: CHANNEL_ID,
    name: 'طلبات جديدة',
    importance: AndroidImportance.HIGH,
    visibility: AndroidVisibility.PUBLIC,
    vibration: true,
    vibrationPattern: [0, 600, 400, 600],
    sound: 'incoming_order',
    bypassDnd: true,
  });

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
      lightUpScreen: true,
      onlyAlertOnce: false,
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

notifee.onBackgroundEvent(async ({type, detail}) => {
  if (type === EventType.PRESS && detail?.notification?.id === 'incoming_order') {
    await notifee.cancelNotification('incoming_order');
  }
});

setBackgroundMessageHandler(getMessaging(), async remoteMessage => {
  const {data} = remoteMessage;
  if (data?.type === 'NEW_ORDER' && data?.order) {
    await AsyncStorage.setItem('pending_incoming_order', data.order).catch(() => {});
    try {
      await displayOrderNotification(JSON.parse(data.order));
    } catch (e) {
      console.log('BG notification error:', e);
    }
  }
});

AppRegistry.registerComponent(appName, () => App);
