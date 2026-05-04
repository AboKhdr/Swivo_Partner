import api from './api';
import useAuthStore from '../store/authStore';

export async function login(phone) {
  const res = await api.post('/auth/signin/credentials', {phone});
  return res; // { success, data: { message }, error }
}

export async function verifyOTP(phone, code) {
  const res = await api.post('/auth/otp/verify', {phone, code});
  if (res.success && res.data?.token) {
    const {token, refreshToken, user} = res.data;
    await useAuthStore.getState().setSession(token, refreshToken, user);
  }
  return res;
}

export async function resendOTP(phone) {
  return api.post('/auth/otp/resend', {phone});
}

export async function logout() {
  await useAuthStore.getState().logout();
}
