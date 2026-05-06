import api from './api';
import {uploadToCloudinary} from './cloudinary';

// ── Shared ──────────────────────────────────────────────────────────────────

// filters: { filter?, status?, schedule?, from?, comparison?, page?, limit? }
// filter:     'active' | 'past'
// status:     'ASSIGNED' | 'ON_THE_WAY,STARTED' (comma-separated)
// schedule:   ISO date — orders for a specific day
// from:       ISO date — combined with schedule+comparison for range
// comparison: 'gte' | 'lt'
// page/limit: pagination
export async function getOrders(filters = {}) {
  const clean = Object.fromEntries(
    Object.entries(filters).filter(([, v]) => v !== undefined && v !== null && v !== ''),
  );
  const params = new URLSearchParams(clean).toString();
  return api.get(`/biker/order${params ? `?${params}` : ''}`);
}

export async function getOrderById(id) {
  return api.get(`/biker/order/${id}`);
}

// ── Biker ───────────────────────────────────────────────────────────────────

export async function updateOrderStatus(id, status) {
  return api.patch(`/biker/order/${id}/status`, {status});
}

export async function uploadOrderPhoto(id, uri, phase) {
  const cloudRes = await uploadToCloudinary(uri);
  if (!cloudRes.success) return {success: false, error: cloudRes.error, data: null};
  return api.post(`/biker/order/${id}/proof/photos`, {
    phase,               // 'before' | 'after'
    url: cloudRes.url,
  });
}

// T002: طلب تخطي الصور — reason يأتي من GET /biker/reason (type=photo_skip)
export async function skipOrderPhoto(id, phase, reason) {
  return api.post(`/biker/order/${id}/proof/skip`, {phase, reason});
}

// T007: إلغاء الطلب — path موحّد + reason في الـ body
export async function cancelOrder(id, reason) {
  return api.put(`/biker/order/${id}`, {reason});
}

// ── Partner — re-exported from partner.js for backwards compatibility ─────────
// استخدم src/services/partner.js مباشرةً للكود الجديد
export {
  acceptOrder,
  rejectOrder,
  assignBiker,
} from './partner';
