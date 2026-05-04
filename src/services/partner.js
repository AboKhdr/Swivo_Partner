import api from './api';
import {uploadImage} from './api';

// ── Dashboard ────────────────────────────────────────────────────────────────

export async function getDashboardStats() {
  return api.get('/partner/stats');
  // Response: { todayOrders, pendingOrders, completedOrders, bikersOnDuty, recentOrders[] }
}

// ── Services ─────────────────────────────────────────────────────────────────

export async function getServices() {
  return api.get('/partner/services');
}

export async function createService(data) {
  // data: { nameAr, nameEn, category, priceS, priceM, priceL, isActive, image? }
  if (data.image) {
    const up = await uploadImage(data.image, 'image');
    if (up.success) data = {...data, imageUrl: up.data.url};
  }
  return api.post('/partner/services', data);
}

export async function updateService(id, data) {
  if (data.image) {
    const up = await uploadImage(data.image, 'image');
    if (up.success) data = {...data, imageUrl: up.data.url};
  }
  return api.patch(`/partner/services/${id}`, data);
}

export async function deleteService(id) {
  return api.delete(`/partner/services/${id}`);
}

export async function toggleService(id, isActive) {
  return api.patch(`/partner/services/${id}/toggle`, {isActive});
}

// ── Packages ─────────────────────────────────────────────────────────────────

export async function getPackages() {
  return api.get('/partner/packages');
}

export async function createPackage(data) {
  // data: { nameAr, nameEn, serviceIds[], priceS, priceM, priceL, validityDays, usesCount, isActive, banner? }
  if (data.banner) {
    const up = await uploadImage(data.banner, 'banner');
    if (up.success) data = {...data, bannerUrl: up.data.url};
  }
  return api.post('/partner/packages', data);
}

export async function updatePackage(id, data) {
  if (data.banner) {
    const up = await uploadImage(data.banner, 'banner');
    if (up.success) data = {...data, bannerUrl: up.data.url};
  }
  return api.patch(`/partner/packages/${id}`, data);
}

export async function deletePackage(id) {
  return api.delete(`/partner/packages/${id}`);
}

export async function togglePackage(id, isActive) {
  return api.patch(`/partner/packages/${id}/toggle`, {isActive});
}

// ── Offers ───────────────────────────────────────────────────────────────────

export async function getOffers() {
  return api.get('/partner/offers');
}

export async function createOffer(data) {
  // data: { nameAr, serviceId, endDate, priceS?, priceM?, priceL?, isActive }
  return api.post('/partner/offers', data);
}

export async function updateOffer(id, data) {
  return api.patch(`/partner/offers/${id}`, data);
}

export async function deleteOffer(id) {
  return api.delete(`/partner/offers/${id}`);
}

export async function toggleOffer(id, isActive) {
  return api.patch(`/partner/offers/${id}/toggle`, {isActive});
}

// ── Branches ─────────────────────────────────────────────────────────────────

export async function getBranches() {
  return api.get('/partner/branches');
}

export async function updateBranch(id, data) {
  // data: { nameAr, address, workingDays: { [key]: { enabled, slots: [{from, to}] } }, banner? }
  if (data.banner) {
    const up = await uploadImage(data.banner, 'banner');
    if (up.success) data = {...data, bannerUrl: up.data.url};
  }
  return api.patch(`/partner/branches/${id}`, data);
}

// ── Staff ────────────────────────────────────────────────────────────────────

export async function getStaff() {
  return api.get('/partner/staff');
  // Response: { bikers[], managers[] }
}

export async function createBiker(data) {
  // data: { nameAr, phone, nationalId }
  return api.post('/partner/staff/bikers', data);
}

export async function updateBiker(id, data) {
  return api.patch(`/partner/staff/bikers/${id}`, data);
}

export async function deleteBiker(id) {
  return api.delete(`/partner/staff/bikers/${id}`);
}

export async function toggleBikerDuty(id, isOnDuty) {
  return api.patch(`/partner/staff/bikers/${id}/duty`, {isOnDuty});
}

export async function toggleBikerActive(id, isActive) {
  return api.patch(`/partner/staff/bikers/${id}/active`, {isActive});
}

// ── Reviews ──────────────────────────────────────────────────────────────────

export async function getPartnerReviews(filters = {}) {
  const params = new URLSearchParams(filters).toString();
  return api.get(`/partner/reviews${params ? `?${params}` : ''}`);
}

export async function replyToReview(id, reply) {
  return api.post(`/partner/reviews/${id}/reply`, {reply});
}

// ── Payments ─────────────────────────────────────────────────────────────────

export async function getPayments(filters = {}) {
  const params = new URLSearchParams(filters).toString();
  return api.get(`/partner/payments${params ? `?${params}` : ''}`);
}

// ── Skip Review Requests ──────────────────────────────────────────────────────

export async function getSkipRequests() {
  return api.get('/partner/skip-requests');
}

export async function approveSkipRequest(id) {
  return api.post(`/partner/skip-requests/${id}/approve`);
}

export async function rejectSkipRequest(id) {
  return api.post(`/partner/skip-requests/${id}/reject`);
}

// ── Settings ─────────────────────────────────────────────────────────────────

export async function getPartnerProfile() {
  return api.get('/partner/profile');
}

export async function updatePartnerProfile(data) {
  return api.patch('/partner/profile', data);
}

export async function setAutoAccept(enabled) {
  return api.patch('/partner/settings/auto-accept', {enabled});
}
