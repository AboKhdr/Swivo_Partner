import api from './api';
import {uploadImage} from './api';

// ── Profile ──────────────────────────────────────────────────────────────────

export async function getBikerProfile() {
  return api.get('/biker/profile');
  // Response: { id, firstName, lastName, phone, email, birthDate, branchName, rating, wallet }
}

export async function updateBikerProfile(data) {
  // data: { firstName?, lastName?, email?, phoneNumber?, image? }
  return api.put('/biker/profile', data);
}

export async function uploadProfilePhoto(uri) {
  const up = await uploadImage(uri, 'photo');
  if (!up.success) return up;
  return api.put('/biker/profile', {image: up.data.url});
}

// ── Duty ─────────────────────────────────────────────────────────────────────
export async function setDutyStatus(isOnDuty) {
  return api.patch('/biker/duty', {isOnDuty});
}

// ── Home Stats ───────────────────────────────────────────────────────────────

export async function getHomeStats() {
  return api.get('/biker/home/stats');
  // Response: { success, data: { weeklyEarnings, ordersCount, rating } }
}

// ── Wallet & Balance ─────────────────────────────────────────────────────────

export async function getWallet() {
  return api.get('/biker/wallet');
  // Response: { balance, monthlyEarnings, weeklyEarnings, transactions[] }
}

export async function getBalance() {
  return api.get('/biker/balance');
  // Response: { success, data: { balance, currency } }
}

// ── Branches ─────────────────────────────────────────────────────────────────

export async function getBranches(params = {}) {
  const qs = new URLSearchParams({page: 1, limit: 50, ...params}).toString();
  return api.get(`/biker/branch?${qs}`);
  // Response: { success, data: [{ _id, name, city }] }
}

// ── Reviews ──────────────────────────────────────────────────────────────────

export async function getBikerReviews(filters = {}) {
  const params = new URLSearchParams(filters).toString();
  return api.get(`/biker/review${params ? `?${params}` : ''}`);
  // Response: { success, data: [], total, page, pages, hasNext }
}

// ── Notifications ─────────────────────────────────────────────────────────────

export async function getNotifications(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return api.get(`/biker/notification${qs ? `?${qs}` : ''}`);
  // Response: { data: [], pagination: {} }
}

export async function markNotificationRead(id) {
  return api.put(`/biker/notification/read/${id}`);
}

// T006: تمييز جميع الإشعارات كمقروءة
export async function markAllNotificationsRead() {
  return api.put('/biker/notification/read-all');
}

// ── Reasons ──────────────────────────────────────────────────────────────────
// T008: يدعم filter بـ type: 'cancel' | 'photo_skip'
export async function getReasons(type) {
  const qs = type ? `?type=${type}` : '';
  return api.get(`/biker/reason${qs}`);
  // Response: { success, reasons: [{ _id, name, type }] }
}

// ── Terms / Support moved to services/shared.js (used by both biker and partner)
