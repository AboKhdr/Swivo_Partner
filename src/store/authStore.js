import {create} from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import notifee from '@notifee/react-native';
import {deleteToken, getMessaging, getToken} from '@react-native-firebase/messaging';
import api from '../services/api';
import {registerFCMToken, unregisterFCMToken} from '../services/notifications';
import {cancelIncomingOrderNotification} from '../services/notificationChannel';

const useAuthStore = create((set, get) => ({
  // user shape from verifyOTP: { _id, name, phoneNumber, preferredLanguage, tenantId, role }
  user:    null,
  token:   null,
  role:    null,   // 'biker' | 'admin' | null
  isReady: false,

  // ── Bootstrap ─────────────────────────────────────────────────────────
  hydrate: async () => {
    try {
      const [token, userRaw] = await Promise.all([
        AsyncStorage.getItem('auth_token'),
        AsyncStorage.getItem('auth_user'),
      ]);
      if (token && userRaw) {
        const user = JSON.parse(userRaw);
        const originalRole = user.originalRole ?? user.role;
        const appRole = user.role === 'biker' ? 'biker' : user.role ? 'admin' : null;
        // Keep user_role in sync for the background message handler
        if (appRole) AsyncStorage.setItem('user_role', appRole).catch(() => {});
        set({token, user: {...user, role: appRole, originalRole}, role: appRole, isReady: true});
      } else {
        set({isReady: true});
      }
    } catch {
      set({isReady: true});
    }
  },

  // ── Auth Actions ────────────────────────────────────────────────────────
  // No refreshToken — backend response only returns: { token, user }
  // FCM token is registered server-side inside /auth/verify-otp itself
  // (passed in the request body), so no separate /notifications/register
  // call is needed here.
  setSession: async (token, user) => {
    // backend may return 'client' or 'admin' for partners — normalise to 'admin'
    const appRole = user.role === 'biker' ? 'biker' : 'admin';
    const normUser = {...user, role: appRole, originalRole: user.role};
    await Promise.all([
      api.saveToken(token),
      AsyncStorage.setItem('auth_user', JSON.stringify(normUser)),
      // user_role persisted separately so the background message handler
      // (index.js Headless JS — no Zustand) can read it without parsing auth_user
      AsyncStorage.setItem('user_role', appRole),
    ]);
    set({token, user: normUser, role: appRole});

    // Safety net: verify-otp passes the FCM token in its body, but on a first
    // login the token may not have been resolved yet (permissions still being
    // granted). Re-register here against the freshly-saved auth token so the
    // current device is guaranteed to be in fcmTokens[] — otherwise pushes go
    // to stale tokens from a previous session and never reach this phone.
    try {
      let fcmToken = await AsyncStorage.getItem('fcm_token').catch(() => null);
      if (!fcmToken) {
        fcmToken = await getToken(getMessaging()).catch(() => null);
        if (fcmToken) await AsyncStorage.setItem('fcm_token', fcmToken).catch(() => {});
      }
      if (fcmToken) await registerFCMToken(fcmToken, appRole).catch(() => {});
    } catch {}
  },

  logout: async () => {
    // 1. Read fcm token BEFORE clearing it so we can unregister it on the server
    const fcmToken = await AsyncStorage.getItem('fcm_token').catch(() => null);

    // 2. Tell the server to drop the token from this user (best-effort)
    if (fcmToken) {
      await unregisterFCMToken(fcmToken).catch(() => {});
    }

    // 3. Cancel any ringing/scheduled order notifications on this device
    await cancelIncomingOrderNotification().catch(() => {});
    await notifee.cancelAllNotifications().catch(() => {});

    // 4. Delete the FCM token from the device itself so the next user gets a
    //    fresh token (and Firebase stops delivering pushes for the old one).
    try {
      await deleteToken(getMessaging());
    } catch {}

    // 5. Clear all persisted auth + notification state
    await Promise.all([
      api.clearToken(),
      AsyncStorage.removeItem('auth_user'),
      AsyncStorage.removeItem('refresh_token'),
      AsyncStorage.removeItem('fcm_token'),
      AsyncStorage.removeItem('pending_incoming_order'),
      AsyncStorage.removeItem('pending_notification_nav'),
      AsyncStorage.removeItem('fs_intent_prompted'),
      AsyncStorage.removeItem('user_role'),
    ]);

    set({token: null, user: null, role: null});
  },

  updateUser: (patch) => {
    const updated = {...get().user, ...patch};
    AsyncStorage.setItem('auth_user', JSON.stringify(updated)).catch(() => {});
    set({user: updated});
  },
}));

export default useAuthStore;
