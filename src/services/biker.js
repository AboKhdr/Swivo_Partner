import api from './api';
import {uploadImage} from './api';

// ── Profile ──────────────────────────────────────────────────────────────────

export async function getBikerProfile() {
  return api.get('/biker/profile');
  // Response: { id, firstName, lastName, phone, email, birthDate, branchName, rating, wallet }
}

export async function updateBikerProfile(data) {
  // data: { firstName?, lastName?, email?, birthDate? }
  return api.patch('/biker/profile', data);
}

export async function uploadProfilePhoto(uri) {
  const up = await uploadImage(uri, 'photo');
  if (!up.success) return up;
  return api.patch('/biker/profile', {photoUrl: up.data.url});
}

// ── Duty ─────────────────────────────────────────────────────────────────────

export async function setDutyStatus(isActive) {
  return api.patch('/biker/duty', {isActive});
  // Response: { isActive }
}

// ── Wallet ───────────────────────────────────────────────────────────────────

export async function getWallet() {
  return api.get('/biker/wallet');
  // Response: { balance, monthlyEarnings, weeklyEarnings, transactions[] }
}

// ── Reviews ──────────────────────────────────────────────────────────────────

export async function getBikerReviews(filters = {}) {
  const params = new URLSearchParams(filters).toString();
  return api.get(`/biker/reviews${params ? `?${params}` : ''}`);
  // Response: { avgRating, totalCount, items[] }
}

// ── Support ──────────────────────────────────────────────────────────────────

export async function sendSupportMessage(message) {
  return api.post('/support', {message});
}
