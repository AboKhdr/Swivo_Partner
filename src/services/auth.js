import AsyncStorage from '@react-native-async-storage/async-storage';
import {getMessaging, getToken} from '@react-native-firebase/messaging';
import api from './api';
import useAuthStore from '../store/authStore';

export async function login({phone, prefix = '966'}) {
  return api.post('/auth/generate-otp', {phoneNumber: phone, prefix});
}

export async function verifyOTP({phone, prefix = '966', code}) {
  // Resolve the FCM token before verify-otp so the server can persist it in
  // the same request — replaces the separate POST /notifications/register.
  let fcmToken = await AsyncStorage.getItem('fcm_token').catch(() => null);
  if (!fcmToken) {
    fcmToken = await getToken(getMessaging()).catch(() => null);
    if (fcmToken) await AsyncStorage.setItem('fcm_token', fcmToken).catch(() => {});
  }

  const res = await api.post('/auth/verify-otp', {
    phoneNumber: phone,
    prefix,
    otp: code,
    fcmToken,
  });
  if (res.success) {
    const payload = res.data?.token ? res.data : res.data?.data;
    if (payload?.token) {
      await useAuthStore.getState().setSession(payload.token, payload.user);
    }
  }
  return res;
}

export async function resendOTP({phone, prefix = '966'}) {
  return api.post('/auth/generate-otp', {phoneNumber: phone, prefix});
}

export async function logout() {
  await useAuthStore.getState().logout();
}

export async function deleteAccount({reason} = {}) {
  const res = await api.delete('/auth/account', reason ? {reason} : null);
  if (res.success) {
    await useAuthStore.getState().logout();
  }
  return res;
}
