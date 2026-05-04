import {create} from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import {registerFCMToken} from '../services/notifications';

const useAuthStore = create((set, get) => ({
  user:    null,   // { id, firstName, lastName, phone, role, avatar? }
  token:   null,
  role:    null,   // 'biker' | 'manager' | null
  isReady: false,  // hydration complete

  // ── Bootstrap ─────────────────────────────────────────────────────────
  hydrate: async () => {
    try {
      const [token, userRaw] = await Promise.all([
        AsyncStorage.getItem('auth_token'),
        AsyncStorage.getItem('auth_user'),
      ]);
      if (token && userRaw) {
        const user = JSON.parse(userRaw);
        set({token, user, role: user.role, isReady: true});
      } else {
        set({isReady: true});
      }
    } catch {
      set({isReady: true});
    }
  },

  // ── Auth Actions ────────────────────────────────────────────────────────
  setSession: async (token, refreshToken, user) => {
    await Promise.all([
      api.saveToken(token),
      AsyncStorage.setItem('refresh_token', refreshToken ?? ''),
      AsyncStorage.setItem('auth_user', JSON.stringify(user)),
    ]);
    set({token, user, role: user.role});
    // Send stored FCM token to backend now that user is authenticated
    AsyncStorage.getItem('fcm_token').then(fcmToken => {
      if (fcmToken) registerFCMToken(fcmToken, user.role).catch(() => {});
    }).catch(() => {});
  },

  logout: async () => {
    await Promise.all([
      api.clearToken(),
      AsyncStorage.removeItem('refresh_token'),
      AsyncStorage.removeItem('auth_user'),
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
