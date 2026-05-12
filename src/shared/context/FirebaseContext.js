import React, {createContext, useContext, useEffect} from 'react';
import {Alert, Platform} from 'react-native';
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
  displayNotification,
} from '../../services/notificationChannel';
import {
  canUseFullScreen,
  openFullScreenSettings,
} from '../../services/fullScreenIntent';
import {useI18n} from '../i18n/I18nContext';

const FirebaseContext = createContext(null);

// ── bootstrap: permissions + channels + token ────────────────────────────────
//
// Caches the FCM token in AsyncStorage and sets up notifee channels. We do
// NOT call /notifications/register here — that happens once in
// authStore.setSession right after verify-otp, and again on onTokenRefresh.
// Registering on every mount of FirebaseProvider produced a duplicate POST
// on the first dashboard render after login.
async function bootstrap() {
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
  } catch {}
}

// Prompt the user once to grant USE_FULL_SCREEN_INTENT (Android 14+ requires this
// for the WhatsApp-call style pop-up). Stored in AsyncStorage so we don't nag.
async function ensureFullScreenPermission(t) {
  if (Platform.OS !== 'android') return;
  try {
    const allowed = await canUseFullScreen();
    if (allowed) return;
    const dismissed = await AsyncStorage.getItem('fs_intent_prompted');
    if (dismissed) return;
    Alert.alert(
      t('permissions.fullScreenTitle'),
      t('permissions.fullScreenMessage'),
      [
        {text: t('permissions.later'), style: 'cancel'},
        {
          text:    t('permissions.fullScreenCta'),
          onPress: () => openFullScreenSettings(),
        },
      ],
    );
    await AsyncStorage.setItem('fs_intent_prompted', '1').catch(() => {});
  } catch {}
}

// ── navigation helper ────────────────────────────────────────────────────────
// Dispatches to appStore.requestNav — navigators watch pendingNav and switch tabs

function handleNavigate(data = {}) {
  const {notificationType, orderId} = data;
  const requestNav = useAppStore.getState().requestNav;

  switch (notificationType) {
    case 'new_order':
      requestNav('orders');
      break;
    case 'order_updates':
      requestNav('orders', orderId);
      break;
    case 'biker_alerts':
      requestNav(orderId ? 'orders' : 'notifications', orderId);
      break;
    case 'dashboard_notification':
    default:
      requestNav('notifications');
      break;
  }
}

// ── Provider ─────────────────────────────────────────────────────────────────

export function FirebaseProvider({children}) {
  const {role}                                  = useAuthStore();
  const {setIncomingOrder, setUnreadCount}      = useAppStore();
  const {t}                                     = useI18n();

  // ── 1. bootstrap + token refresh ──────────────────────────────────────────
  useEffect(() => {
    bootstrap().then(() => ensureFullScreenPermission(t));

    const unsubRefresh = onTokenRefresh(getMessaging(), async newToken => {
      await AsyncStorage.setItem('fcm_token', newToken).catch(() => {});
      if (role) registerFCMToken(newToken, role).catch(() => {});
    });

    return () => unsubRefresh();
  }, [role, t]);

  // ── 2. Foreground messages ────────────────────────────────────────────────
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

      // Backend sends data-only messages — title/body are in data, not notification
      const notificationType = data?.notificationType ?? 'general';
      const title = data?.title || notification?.title;
      const body  = data?.body  || notification?.body || '';
      if (title) {
        await displayNotification({
          title,
          body,
          notificationType,
          data: data ?? {},
        });
      }
    });
    return () => unsub();
  }, [setIncomingOrder, setUnreadCount]);

  // ── 3. Background tap + quit tap + pending recovery ───────────────────────
  useEffect(() => {
    const unsubOpened = onNotificationOpenedApp(getMessaging(), remoteMessage => {
      const {data} = remoteMessage;
      if (data?.type === 'NEW_ORDER' && data?.order) {
        try {
          setIncomingOrder(JSON.parse(data.order));
          cancelIncomingOrderNotification().catch(() => {});
        } catch {}
        return;
      }
      handleNavigate(data ?? {});
    });

    getInitialNotification(getMessaging()).then(remoteMessage => {
      if (!remoteMessage) return;
      const {data} = remoteMessage;
      if (data?.type === 'NEW_ORDER' && data?.order) {
        try { setIncomingOrder(JSON.parse(data.order)); } catch {}
        return;
      }
      handleNavigate(data ?? {});
    });

    // طلب معلق من حالة background
    AsyncStorage.getItem('pending_incoming_order').then(raw => {
      if (!raw) return;
      AsyncStorage.removeItem('pending_incoming_order').catch(() => {});
      try {
        const parsed = JSON.parse(raw);
        // Cancel scheduled background ring triggers — the foreground modal
        // takes over with its own in-process ring loop.
        cancelIncomingOrderNotification().catch(() => {});
        setIncomingOrder(parsed);
      } catch {}
    });

    return () => unsubOpened();
  }, [setIncomingOrder]);

  // ── 4. Notifee foreground tap ─────────────────────────────────────────────
  useEffect(() => {
    const unsub = notifee.onForegroundEvent(({type, detail}) => {
      if (type !== EventType.PRESS) return;
      cancelIncomingOrderNotification().catch(() => {});
      const data = detail?.notification?.data ?? {};
      if (data.notificationType) handleNavigate(data);
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
