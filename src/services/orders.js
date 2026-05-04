import api from './api';
import {uploadImage} from './api';

// ── Shared ──────────────────────────────────────────────────────────────────

export async function getOrders(filters = {}) {
  const params = new URLSearchParams(filters).toString();
  return api.get(`/orders${params ? `?${params}` : ''}`);
}

export async function getOrderById(id) {
  return api.get(`/orders/${id}`);
}

// ── Biker ───────────────────────────────────────────────────────────────────

export async function updateOrderStatus(id, status) {
  return api.patch(`/biker/orders/${id}/status`, {status});
}

export async function uploadOrderPhoto(id, uri, phase) {
  const uploadRes = await uploadImage(uri, 'photo');
  if (!uploadRes.success) return uploadRes;
  return api.post(`/biker/orders/${id}/photos`, {
    phase,            // 'before' | 'after'
    url: uploadRes.data.url,
  });
}

export async function skipOrderPhoto(id, phase, reason) {
  return api.post(`/biker/orders/${id}/skip-photos`, {phase, reason});
}

export async function cancelOrder(id, reason) {
  return api.put(`/biker/orders/${id}`, {action: 'cancel', reason});
}

// ── Partner ─────────────────────────────────────────────────────────────────

export async function acceptOrder(id) {
  return api.post(`/partner/orders/${id}/accept`);
}

export async function rejectOrder(id, reason, note) {
  return api.post(`/partner/orders/${id}/reject`, {reason, note});
}

export async function assignBiker(orderId, bikerId) {
  return api.post(`/partner/orders/${orderId}/assign`, {bikerId});
}
