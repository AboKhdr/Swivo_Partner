import { Alert } from 'react-native';
import api from './api';
import {uploadToCloudinary} from './cloudinary';

// ── Profile ───────────────────────────────────────────────────────────────────

export async function getPartnerProfile() {
  return api.get('/dashboard/profile');
  // Response: { _id, firstName, lastName, email, phoneNumber, image, roles[] }
}

export async function updatePartnerProfile(data) {
  // data: { firstName?, lastName?, image? }
  return api.put('/dashboard/profile', data);
}

export async function changePassword(oldPassword, newPassword, confirmPassword) {
  return api.patch('/dashboard/change-password', {
    oldPassword,
    newPassword,
    confirmPassword,
  });
}

export async function uploadPartnerPhoto(uri) {
  const up = await uploadToCloudinary(uri);
  if (!up.success) return {success: false, error: up.error, data: null};
  return api.put('/dashboard/profile', {image: up.url});
}

// ── Orders ────────────────────────────────────────────────────────────────────

export async function getOrders(filters = {}) {
  // filters: { status?, page?, limit? }
  const params = new URLSearchParams(filters).toString();
  return api.get(`/tenant/orders${params ? `?${params}` : ''}`);
  // Response: { data: [], pagination: { total, page, limit, totalPages, hasNextPage, hasPrevPage } }
}

export async function getOrderById(id) {
  return api.get(`/tenant/orders/${id}`);
}

export async function acceptOrder(id) {
  return api.post(`/tenant/orders/${id}/accept`);
  // Response: { success, message, data: { orderId, status: 'ACCEPTED' } }
}

export async function rejectOrder(id, reason) {
  return api.post(`/tenant/orders/${id}/reject`, {reason});
  // Response: { success, message, data: { orderId, status: 'REJECTED' } }
}

export async function assignBiker(orderId, bikerId) {
  return api.post(`/tenant/orders/${orderId}/assign-biker`, {bikerId});
  // Response: { success, message, data: { orderId, status: 'ASSIGNED', biker } }
}

export async function reviewPhotoSkip(orderId, decision, reviewNote) {
  // decision: 'APPROVED' | 'REJECTED'
  return api.post(`/tenant/orders/${orderId}/review-photo-skip`, {
    decision,
    ...(reviewNote ? {reviewNote} : {}),
  });
}

export async function startOnshopOrder(orderId, photoUri) {
  let photo = photoUri;
  if (photoUri) {
    const up = await uploadToCloudinary(photoUri);
    if (up.success) photo = up.url;
  }
  return api.post(`/tenant/orders/${orderId}/start`, photo ? {photo} : {});
  // Response: { success, data: { orderId, status: 'STARTED' } }
}

export async function completeOnshopOrder(orderId, photoUris) {
  const photos = [];
  for (const uri of (photoUris ?? [])) {
    const up = await uploadToCloudinary(uri);
    if (up.success) photos.push(up.url);
  }
  return api.post(`/tenant/orders/${orderId}/complete`, {photos});
  // Response: { success, data: { orderId, status: 'COMPLETED' } }
}

// ── Staff ─────────────────────────────────────────────────────────────────────

export async function getStaff(filters = {}) {
  // filters: { role?: 'BIKER'|'MANAGER', branch?, page?, limit?, sort?, orderId? }
  const params = new URLSearchParams(filters).toString();
  return api.get(`/tenant/staff${params ? `?${params}` : ''}`);
  // Response: { data: [{ _id, userId, branchId, role, isOnDuty, isActive }], total, page, pages }
}

export async function addStaff(data) {
  // data: { phoneNumber, firstName?, lastName?, branchId, role: 'BIKER'|'MANAGER' }
  return api.post('/tenant/staff', data);
}

export async function setDutyStatus(staffId, isOnDuty) {
  return api.patch(`/tenant/staff/${staffId}/duty`, {isOnDuty});
  // Response: { success, message, data: { _id, isOnDuty } }
}

export async function getStaffById(staffId) {
  return api.get(`/tenant/staff/${staffId}`);
  // Response: { _id, userId:{firstName,lastName,phoneNumber,image}, role, branchId,
  //             isOnDuty, status, activeOrdersCount, completedOrdersCount, rating, ratingCount }
}

export async function updateStaff(staffId, data) {
  // data: { branchId? }
  return api.patch(`/tenant/staff/${staffId}`, data);
}

export async function setStaffStatus(staffId, status) {
  // status: 'suspended' | 'deactivated' | 'active'
  return api.patch(`/tenant/staff/${staffId}/status`, {status});
}

export async function removeStaff(staffId) {
  return api.delete(`/tenant/staff/${staffId}`);
}

// ── Services ──────────────────────────────────────────────────────────────────

export async function getServices(filters = {}) {
  // filters: { includeInactive?, categoryId?, availableFor? }
  const params = new URLSearchParams(filters).toString();
  return api.get(`/tenant/services${params ? `?${params}` : ''}`);
}

export async function getCategoryServices() {
  return api.get('/tenant/category/services');
}

export async function createService(data) {
  // data: { name: {ar,en}, description?: {ar,en}, price: {small,medium,large},
  //         estimationTime, categoryId?, availableFor, imageUri? }
  if (data.imageUri) {
    const up = await uploadToCloudinary(data.imageUri);
    if (up.success) data = {...data, image: up.url};
    delete data.imageUri;
  }
  return api.post('/tenant/services', data);
}

export async function updateService(id, data) {
  if (data.imageUri) {
    const up = await uploadToCloudinary(data.imageUri);
    if (up.success) data = {...data, image: up.url};
    delete data.imageUri;
  }
  return api.put(`/tenant/services/${id}`, data);
}

export async function deleteService(id) {
  return api.delete(`/tenant/services/${id}`);
}

export async function toggleService(id, isActive) {
  return api.patch(`/tenant/services/${id}/toggle`, {isActive});
}

export async function getCategories() {
  return api.get('/tenant/categories');
  // Response: { data: [{ _id, name: { ar, en } }] }
}

// ── Packages ──────────────────────────────────────────────────────────────────

export async function getPackages(filters = {}) {
  const params = new URLSearchParams(filters).toString();
  return api.get(`/tenant/packages${params ? `?${params}` : ''}`);
}

export async function createPackage(data) {
  // data: { name: {ar,en}, serviceIds[], price: {small,medium,large},
  //         usageLimit, validityDays, bannerUri? }
  if (data.bannerUri) {
    const up = await uploadToCloudinary(data.bannerUri);
    if (up.success) data = {...data, banner: up.url};
    delete data.bannerUri;
  }
  return api.post('/tenant/packages', data);
}

export async function updatePackage(id, data) {
  if (data.bannerUri) {
    const up = await uploadToCloudinary(data.bannerUri);
    if (up.success) data = {...data, banner: up.url};
    delete data.bannerUri;
  }
  return api.patch(`/tenant/packages/${id}`, data);
}

export async function deletePackage(id) {
  return api.delete(`/tenant/packages/${id}`);
}

export async function togglePackage(id, isActive) {
  return api.patch(`/tenant/packages/${id}/toggle`, {isActive});
}

// ── Branches ──────────────────────────────────────────────────────────────────

export async function getBranches() {
  return api.get('/tenant/branches');
}

export async function updateBranch(id, data) {
  // data: { name?, address?, workingHours?, slotDuration?, bufferTime? }
  return api.put(`/tenant/branches/${id}`, data);
}

export async function updateBranchBanner(id, uri) {
  // uri: local file URI or null to remove
  if (uri === null) {
    return api.patch(`/tenant/branches/${id}/banner`, {banner: null});
  }
  const up = await uploadToCloudinary(uri);
  if (!up.success) return {success: false, error: up.error, data: null};
  return api.patch(`/tenant/branches/${id}/banner`, {banner: up.url});
}

export async function getBranchServices(branchId) {
  return api.get(`/tenant/branches/${branchId}/services`);
}

export async function toggleBranchService(branchId) {
  return api.patch(`/tenant/branches/${branchId}/services/123123`);
}

// ── Skip Requests ─────────────────────────────────────────────────────────────

export async function getSkipRequests(filters = {}) {
  // filters: { status?: 'PENDING'|'APPROVED'|'REJECTED', page?, limit? }
  const params = new URLSearchParams(filters).toString();
  return api.get(`/tenant/skip-requests${params ? `?${params}` : ''}`);
}

export async function approveSkipRequest(orderId, reviewNote) {
  return api.post(`/tenant/orders/${orderId}/review-photo-skip`, {
    decision: 'APPROVED',
    ...(reviewNote ? {reviewNote} : {}),
  });
}

export async function rejectSkipRequest(orderId, reviewNote) {
  return api.post(`/tenant/orders/${orderId}/review-photo-skip`, {
    decision: 'REJECTED',
    ...(reviewNote ? {reviewNote} : {}),
  });
}

// ── Analytics ─────────────────────────────────────────────────────────────────

export async function getDashboardToday() {
  return api.get('/dashboard/today');
  // Response: { todayRevenue, pendingOrdersCount, activeOrdersCount, totalOrdersToday,
  //             availableBikersCount, recentPendingOrders[] }
}

export async function getAnalytics(filters = {}) {
  // filters: { year?, month? }
  const params = new URLSearchParams(filters).toString();
  return api.get(`/dashboard/analytics/admin${params ? `?${params}` : ''}`);
}

// ── Biker Payouts ──────────────────────────────────────────────────────────────

export async function getBikerPayouts(filters = {}) {
  const params = new URLSearchParams(filters).toString();
  return api.get(`/dashboard/biker/payout${params ? `?${params}` : ''}`);
}

export async function createPayout(bikerId, amount, paymentMethod, notes) {
  return api.post('/dashboard/biker/payout', {
    bikerId,
    amount,
    paymentMethod: paymentMethod ?? 'bank_transfer',
    ...(notes ? {notes} : {}),
  });
}

// ── Notifications ─────────────────────────────────────────────────────────────

export async function getNotifications(filters = {}) {
  // filters: { page?, limit?, createdAt?, comparison? }
  const params = new URLSearchParams(filters).toString();
  return api.get(`/dashboard/notification${params ? `?${params}` : ''}`);
}

// ── Reviews ───────────────────────────────────────────────────────────────────

export async function getReviews(filters = {}) {
  const params = new URLSearchParams(filters).toString();
  return api.get(`/dashboard/review/admin${params ? `?${params}` : ''}`);
}

export async function deleteReview(id) {
  return api.delete(`/dashboard/review/admin?id=${id}`);
}

export async function deleteReviews(ids) {
  // ids: string[]
  return api.delete('/dashboard/review/admin', {body: JSON.stringify({ids})});
}

// ── Support ───────────────────────────────────────────────────────────────────

export async function sendSupportMessage(subject, message) {
  return api.post('/dashboard/support', {subject, message});
}

// ── Offers ────────────────────────────────────────────────────────────────────

export async function getOffers(filters = {}) {
  const params = new URLSearchParams(filters).toString();
  return api.get(`/tenant/offers${params ? `?${params}` : ''}`);
  // Response: { data: [{ _id, name:{ar,en}, serviceIds[], prices:{serviceId:{small,medium,large}}, endDate, isActive }] }
}

export async function createOffer(data) {
  // data: { name:{ar,en}, serviceIds:[], prices:{serviceId:{small,medium,large}}, endDate?, isActive }
  return api.post('/tenant/offers', data);
}

export async function updateOffer(id, data) {
  return api.put(`/tenant/offers/${id}`, data);
}

export async function deleteOffer(id) {
  return api.delete(`/tenant/offers/${id}`);
}

export async function toggleOffer(id, isActive) {
  return api.patch(`/tenant/offers/${id}/toggle`, {isActive});
}

// ── Settings ──────────────────────────────────────────────────────────────────

export async function getSettings() {
  return api.get('/tenant/settings');
}

export async function updateSettings(data) {
  return api.patch('/tenant/settings', data);
}
