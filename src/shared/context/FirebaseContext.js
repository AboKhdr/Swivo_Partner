import React, {createContext, useContext, useEffect} from 'react';
import {Platform} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getMessaging,
  getToken,
  onMessage,
  onTokenRefresh,
  onNotificationOpenedApp,
  getInitialNotification,
  requestPermission,
  AuthorizationStatus,
} from '@react-native-firebase/messaging';
import notifee, {EventType} from '@notifee/react-native';
import useAppStore from '../../store/appStore';
import useAuthStore from '../../store/authStore';
import {registerFCMToken} from '../../services/notifications';
import {
  setupNotifeeChannel,
  showIncomingOrderNotification,
  cancelIncomingOrderNotification,
} from '../../services/notificationChannel';

const FirebaseContext = createContext(null);

async function bootstrap(role) {
  try {
    await notifee.requestPermission();
    await setupNotifeeChannel();

    if (Platform.OS === 'ios') {
      const authStatus = await requestPermission(getMessaging());
      if (
        authStatus !== AuthorizationStatus.AUTHORIZED &&
        authStatus !== AuthorizationStatus.PROVISIONAL
      ) return;
    }

    const token = await getToken(getMessaging());
    if (!token) return;
    await AsyncStorage.setItem('fcm_token', token);
    if (role) await registerFCMToken(token, role).catch(() => {});
  } catch (e) {
    console.log('bootstrap error:', e);
  }
}

export function FirebaseProvider({children}) {
  const {role} = useAuthStore();
  const {setIncomingOrder, setUnreadCount, showToast} = useAppStore();

  useEffect(() => {
    bootstrap(role);

    const unsubRefresh = onTokenRefresh(getMessaging(), async newToken => {
      await AsyncStorage.setItem('fcm_token', newToken).catch(() => {});
      if (role) registerFCMToken(newToken, role).catch(() => {});
    });

    return () => unsubRefresh();
  }, [role]);

  // Foreground Firebase messages
  useEffect(() => {
    const unsub = onMessage(getMessaging(), async remoteMessage => {
      const {data, notification} = remoteMessage;
      setUnreadCount(useAppStore.getState().unreadCount + 1);

      if (data?.type === 'NEW_ORDER' && data?.order) {
        try {
          const parsed = JSON.parse(data.order);
          setIncomingOrder(parsed);
          await showIncomingOrderNotification(parsed);
        } catch {}
        return;
      }
      if (notification?.title) showToast(notification.title, 'info');
    });
    return () => unsub();
  }, [setIncomingOrder, setUnreadCount, showToast]);

  // Background tap + quit tap + pending recovery
  useEffect(() => {
    const unsubOpened = onNotificationOpenedApp(getMessaging(), remoteMessage => {
      const {data} = remoteMessage;
      if (data?.type === 'NEW_ORDER' && data?.order) {
        try {
          setIncomingOrder(JSON.parse(data.order));
          cancelIncomingOrderNotification().catch(() => {});
        } catch {}
      }
    });

    getInitialNotification(getMessaging()).then(remoteMessage => {
      if (!remoteMessage) return;
      const {data} = remoteMessage;
      if (data?.type === 'NEW_ORDER' && data?.order) {
        try { setIncomingOrder(JSON.parse(data.order)); } catch {}
      }
    });

    AsyncStorage.getItem('pending_incoming_order').then(raw => {
      if (!raw) return;
      AsyncStorage.removeItem('pending_incoming_order').catch(() => {});
      try { setIncomingOrder(JSON.parse(raw)); } catch {}
    });

    return () => unsubOpened();
  }, [setIncomingOrder]);

  // Notifee foreground tap
  useEffect(() => {
    const unsub = notifee.onForegroundEvent(({type}) => {
      if (type === EventType.PRESS) cancelIncomingOrderNotification().catch(() => {});
    });
    return () => unsub();
  }, []);

  return (
    <FirebaseContext.Provider value={null}>
      {children}
    </FirebaseContext.Provider>
  );
}

export function useFirebase() {
  return useContext(FirebaseContext);
}
