import {create} from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import {registerFCMToken} from '../services/notifications';

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
        set({token, user, role: user.role ?? null, isReady: true});
      } else {
        set({isReady: true});
      }
    } catch {
      set({isReady: true});
    }
  },

  // ── Auth Actions ────────────────────────────────────────────────────────
  // No refreshToken — backend response only returns: { token, user }
  setSession: async (token, user) => {
    await Promise.all([
      api.saveToken(token),
      AsyncStorage.setItem('auth_user', JSON.stringify(user)),
    ]);
    set({token, user, role: user.role ?? null});
    AsyncStorage.getItem('fcm_token').then(fcmToken => {
      if (fcmToken) registerFCMToken(fcmToken, user.role).catch(() => {});
    }).catch(() => {});
  },

  logout: async () => {
    await Promise.all([
      api.clearToken(),
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
