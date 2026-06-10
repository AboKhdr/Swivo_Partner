import api from './api';
import useAuthStore from '../store/authStore';

// ── FCM Token ────────────────────────────────────────────────────────────────

export async function registerFCMToken(fcmToken, role) {
  // role: 'biker' | 'admin'
  return api.post('/notifications/register', {fcmToken, role});
}

export async function unregisterFCMToken(fcmToken) {
  return api.delete('/notifications/register', {fcmToken});
}

// ── Notification List ────────────────────────────────────────────────────────
//
// The notification endpoints are role-scoped on the backend:
//   biker  → /biker/notification
//   admin  → /dashboard/notification (partner)
// Use the role-specific module (services/biker.js or services/partner.js) when
// you need the typed accessor. These generic helpers dispatch by the current
// auth role and return the same response shape: { data: [...], pagination }.

function scope() {
  const role = useAuthStore.getState().role;
  return role === 'biker' ? '/biker/notification' : '/dashboard/notification';
}

export async function getNotifications(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return api.get(`${scope()}${qs ? `?${qs}` : ''}`);
  // Response: { data: [...], pagination: { hasNextPage, total, ... } }
}

export async function markAsRead(id) {
  return api.put(`${scope()}/read/${id}`);
}

export async function markAllAsRead() {
  return api.put(`${scope()}/read-all`);
}
