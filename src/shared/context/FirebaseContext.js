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
  setupNotifeeChannels,
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
    await setupNotifeeChannels();

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
//
// Backend may send orderId under different keys depending on the event type.
// We normalise here so every caller gets a consistent orderId string.

function extractOrderId(data = {}) {
  return (
    data.orderId   ||   // our own notifications
    data.order_id  ||   // backend snake_case variant
    data.id        ||
    null
  );
}

export function handleNavigate(data = {}) {
  const action    = data.action ?? '';
  const status    = data.status ?? '';
  // _itemType is NOT sent by the backend push payload — it's injected locally
  // by the in-app inbox (NotificationsScreen) from the saved Notification.type
  // when a row is tapped, so type-2 (System/photo-skip) rows route correctly
  // even when `action` wasn't persisted on the row's data.
  const itemType  = data._itemType;
  const orderId   = extractOrderId(data);

  const requestNav = useAppStore.getState().requestNav;
  const showToast  = useAppStore.getState().showToast;

  // type === 2 (System) + PHOTO_SKIP_REQUESTED → skip-review page (partner)
  if (itemType === 2 || action === 'photo_skip_review') {
    requestNav('operations', orderId, 'skipReview');
    return;
  }

  if (action === 'photo_skip_decision') {
    const decision = (data.decision ?? '').toUpperCase();
    if (decision === 'APPROVED') {
      showToast('تم قبول تخطي الصورة — يمكنك إنهاء الطلب', 'success');
    } else if (decision === 'REJECTED') {
      showToast('تم رفض تخطي الصورة — يرجى رفع الصور', 'error');
    }
    if (orderId) requestNav('orders', orderId, 'detail');
    return;
  }

  // type === 0 (Order) or any notification with an orderId → order details
  if (orderId) {
    if (status === 'CANCELLED') showToast('تم إلغاء الطلب من قبل العميل', 'error');
    requestNav('orders', orderId, 'detail');
    return;
  }

  requestNav('notifications', null, null);
}


export function FirebaseProvider({children}) {
  const {role}                                               = useAuthStore();
  const {setUnreadCount, triggerOrderRefresh, showOrderToast} = useAppStore();
  const {t}                                                  = useI18n();

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
      const showToast = useAppStore.getState().showToast;

      // NEW_ORDER — ring + show appropriate UI per role.
      // No unread bump here: the modal (partner) / order toast (biker) IS the UI;
      // it isn't a "message to read", and nothing decrements it afterwards.
      if (data?.type === 'NEW_ORDER' && data?.order) {
        try {
          const parsed = JSON.parse(data.order);
          await showIncomingOrderNotification(parsed);
          if (role === 'biker') {
            showOrderToast(parsed);
          } else if (role === 'admin') {
            useAppStore.getState().setIncomingOrder(parsed);
          }
        } catch {}
        return;
      }

      setUnreadCount(useAppStore.getState().unreadCount + 1);

      const action = data?.action ?? '';

      // photo_skip_decision — refresh OrderDetailsScreen immediately + toast
      if (action === 'photo_skip_decision') {
        const decision = (data?.decision ?? '').toUpperCase();
        if (decision === 'APPROVED') {
          showToast('تم قبول تخطي الصورة — يمكنك إنهاء الطلب', 'success', 4000);
        } else if (decision === 'REJECTED') {
          showToast('تم رفض تخطي الصورة — يرجى رفع الصور', 'error', 4000);
        }
        triggerOrderRefresh();
        return;
      }

      // All other foreground notifications — show system notification banner + toast
      const notificationType = data?.notificationType ?? 'general';
      const title = data?.title || notification?.title;
      const body  = data?.body  || notification?.body || '';
      const toastMsg = [title, body].filter(Boolean).join(' — ');
      if (toastMsg) showToast(toastMsg, 'info', 4000);
      if (title) {
        await displayNotification({
          title,
          body,
          notificationType,
          data:  data ?? {},
        });
      }
    });
    return () => unsub();
  }, [role, setUnreadCount, triggerOrderRefresh]);

  // ── 3. Background tap + quit tap + pending recovery ───────────────────────
  useEffect(() => {
    const unsubOpened = onNotificationOpenedApp(getMessaging(), remoteMessage => {
      const {data} = remoteMessage;
      if (data?.type === 'NEW_ORDER' && data?.order) {
        try {
          const parsed = JSON.parse(data.order);
          const orderId = parsed._id ?? parsed.id;
          // Pass orderId so the matching missed_order trigger is also cancelled.
          cancelIncomingOrderNotification(orderId).catch(() => {});
          if (useAuthStore.getState().role === 'admin') {
            // partner: re-open the accept/reject modal instead of jumping to detail
            useAppStore.getState().setIncomingOrder(parsed);
          } else if (orderId) {
            useAppStore.getState().requestNav('orders', orderId, 'detail');
          }
        } catch {}
        return;
      }
      handleNavigate(data ?? {});
    });

    getInitialNotification(getMessaging()).then(remoteMessage => {
      if (!remoteMessage) return;
      const {data} = remoteMessage;
      if (data?.type === 'NEW_ORDER' && data?.order) {
        try {
          const parsed = JSON.parse(data.order);
          const orderId = parsed._id ?? parsed.id;
          if (orderId) setTimeout(() => useAppStore.getState().requestNav('orders', orderId, 'detail'), 600);
        } catch {}
        return;
      }
      handleNavigate(data ?? {});
    });

    // ── طلب رنين معلق من background (بايكر) ────────────────────────────────
    AsyncStorage.getItem('pending_incoming_order').then(raw => {
      if (!raw) return;
      AsyncStorage.removeItem('pending_incoming_order').catch(() => {});
      try {
        const parsed = JSON.parse(raw);
        const orderId = parsed._id ?? parsed.id;
        cancelIncomingOrderNotification(orderId).catch(() => {});
        // partner: re-open the accept/reject modal; biker: persistent order toast
        if (useAuthStore.getState().role === 'admin') {
          useAppStore.getState().setIncomingOrder(parsed);
        } else {
          showOrderToast(parsed);
        }
      } catch {}
    });

    // ── navigation intent محفوظة من background tap (notifee.onBackgroundEvent) ─
    AsyncStorage.getItem('pending_notification_nav').then(raw => {
      if (!raw) return;
      AsyncStorage.removeItem('pending_notification_nav').catch(() => {});
      try {
        const navData = JSON.parse(raw);
        setTimeout(() => handleNavigate(navData), 600);
      } catch {}
    });

    return () => unsubOpened();
  }, [showOrderToast]);

  // ── 4. Notifee foreground tap ─────────────────────────────────────────────
  useEffect(() => {
    const unsub = notifee.onForegroundEvent(({type, detail}) => {
      if (type !== EventType.PRESS) return;
      const data = detail?.notification?.data ?? {};
      const orderId = data.orderId || data.order_id || data.id || null;
      // Pass orderId so the matching missed_order trigger is also cancelled.
      cancelIncomingOrderNotification(orderId).catch(() => {});
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
