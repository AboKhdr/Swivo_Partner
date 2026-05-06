import api from './api';
import useAuthStore from '../store/authStore';

export async function login({phone, prefix = '966'}) {
  return api.post('/auth/generate-otp', {phoneNumber: phone, prefix});
}

export async function verifyOTP({phone, prefix = '966', code}) {
  const res = await api.post('/auth/verify-otp', {
    phoneNumber: phone,
    prefix,
    otp: code,
  });
  // Response shape: { success, token, user: { _id, name, phoneNumber, preferredLanguage, tenantId, role } }
  if (res.success && res.data?.token) {
    const {token, user} = res.data;
    await useAuthStore.getState().setSession(token, user);
  }
  return res;
}

export async function resendOTP({phone, prefix = '966'}) {
  return api.post('/auth/generate-otp', {phoneNumber: phone, prefix});
}

export async function logout() {
  await useAuthStore.getState().logout();
}
