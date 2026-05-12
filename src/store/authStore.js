import {create} from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import notifee from '@notifee/react-native';
import {deleteToken, getMessaging} from '@react-native-firebase/messaging';
import api from '../services/api';
import {unregisterFCMToken} from '../services/notifications';
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
        const appRole = user.role === 'biker' ? 'biker' : user.role ? 'admin' : null;
        set({token, user: {...user, role: appRole}, role: appRole, isReady: true});
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
    const normUser = {...user, role: appRole};
    await Promise.all([
      api.saveToken(token),
      AsyncStorage.setItem('auth_user', JSON.stringify(normUser)),
    ]);
    set({token, user: normUser, role: appRole});
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
      AsyncStorage.removeItem('fs_intent_prompted'),
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
