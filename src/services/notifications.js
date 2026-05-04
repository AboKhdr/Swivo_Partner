import api from './api';

// ── FCM Token ────────────────────────────────────────────────────────────────

export async function registerFCMToken(fcmToken, role) {
  // role: 'biker' | 'manager'
  return api.post('/notifications/register', {fcmToken, role});
}

export async function unregisterFCMToken(fcmToken) {
  return api.delete('/notifications/register', {fcmToken});
}

// ── Notification List ────────────────────────────────────────────────────────

export async function getNotifications(page = 1) {
  return api.get(`/notifications?page=${page}`);
  // Response: { items[], unreadCount, hasMore }
}

export async function markAsRead(id) {
  return api.patch(`/notifications/${id}/read`);
}

export async function markAllAsRead() {
  return api.patch('/notifications/read-all');
}
