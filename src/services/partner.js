import api from './api';
import {uploadToCloudinary} from './cloudinary';

function toQuery(filters) {
  const parts = [];
  for (const [k, v] of Object.entries(filters)) {
    if (v !== undefined && v !== null && v !== '') {
      parts.push(`${encodeURIComponent(k)}=${encodeURIComponent(v)}`);
    }
  }
  return parts.length ? `?${parts.join('&')}` : '';
}

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
  // filters: { status?, orderType?, page?, limit? }
  return api.get(`/tenant/orders${toQuery(filters)}`);
  // Response: { data: [], pagination: { total, page, limit, totalPages, hasNextPage, hasPrevPage } }
}

export async function getOrderById(id) {
  return api.get(`/tenant/orders/${id}`);
}

export async function acceptOrder(id) {
  return api.post(`/tenant/orders/${id}/accept`);
  // Response: { success, message, data: { orderId, status: 'ACCEPTED' } }
}

export async function rejectOrder(id, reason, note) {
  // reason must be a stable code from src/shared/constants/rejectReasons.js.
  // `note` is required when reason === 'OTHER', optional otherwise.
  return api.post(`/tenant/orders/${id}/reject`, {
    reason,
    ...(note ? {note} : {}),
  });
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
  return api.get(`/tenant/staff${toQuery(filters)}`);
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
  return api.get(`/tenant/services${toQuery(filters)}`);
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

// ── Additional Services (add-ons) ─────────────────────────────────────────────
// Backend payload shape (flat — NOT nested under name/description):
//   { nameEn, nameAr, descriptionEn?, descriptionAr?, price, serviceId, image?, isActive }

export async function getAdditionalServices(filters = {}) {
  // filters: { serviceId? }
  return api.get(`/tenant/additional-services${toQuery(filters)}`);
}

export async function getAdditionalServiceById(id) {
  return api.get(`/tenant/additional-services/${id}`);
}

export async function createAdditionalService(data) {
  if (data.imageUri) {
    const up = await uploadToCloudinary(data.imageUri);
    if (up.success) data = {...data, image: up.url};
    delete data.imageUri;
  }
  return api.post('/tenant/additional-services', data);
}

export async function updateAdditionalService(id, data) {
  if (data.imageUri) {
    const up = await uploadToCloudinary(data.imageUri);
    if (up.success) data = {...data, image: up.url};
    delete data.imageUri;
  }
  return api.patch(`/tenant/additional-services/${id}`, data);
}

export async function deleteAdditionalService(id) {
  // Soft delete on the backend
  return api.delete(`/tenant/additional-services/${id}`);
}

// ── Packages ──────────────────────────────────────────────────────────────────

export async function getPackages(filters = {}) {
  return api.get(`/tenant/packages${toQuery(filters)}`);
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
  return api.get(`/tenant/skip-requests${toQuery(filters)}`);
}

export async function approveSkipRequest(orderId, phase) {
  // phase: 'before' | 'after'
  return api.post(`/tenant/orders/${orderId}/review-photo-skip`, {
    phase,
    decision: 'APPROVED',
  });
}

export async function rejectSkipRequest(orderId, phase, reviewNote) {
  // phase: 'before' | 'after'
  return api.post(`/tenant/orders/${orderId}/review-photo-skip`, {
    phase,
    decision: 'REJECTED',
    ...(reviewNote ? {reviewNote} : {}),
  });
}

// ── Analytics ─────────────────────────────────────────────────────────────────

export async function getDashboardToday() {
  return api.get('/dashboard/today');
}

export async function getTenantSubscription() {
  return api.get('/tenant/subscription');
}

export async function getAnalytics(filters = {}) {
  // filters: { year?, month? }
  return api.get(`/dashboard/analytics/admin${toQuery(filters)}`);
}

// Branch financial summary. Supervisor → own branch automatically (no params).
// Admin → may pass { branchId } to scope to a specific branch.
export async function getBranchRevenue(filters = {}) {
  return api.get(`/tenant/branch/revenue${toQuery(filters)}`);
  // Response: { data: { branchId, branchName:{ar,en}, revenue:{completed,pending,today},
  //             orders:{completed,active,today}, bikers:[{firstName,lastName,available,totalEarned,totalPayouts}] } }
}

export async function getTransactionStatistics() {
  return api.get('/dashboard/transaction/statistics');
  // Response: { stats:{ totalTransactions, totalCredits, totalDebits, pendingCount }, scope? }
}

// ── Biker Payouts ──────────────────────────────────────────────────────────────

export async function getBikerPayouts(filters = {}) {
  return api.get(`/dashboard/biker/payout${toQuery(filters)}`);
}

export async function createPayout(bikerId, amount, paymentMethod, notes) {
  return api.post('/dashboard/biker/payout', {
    bikerId,
    amount,
    paymentMethod: paymentMethod ?? 'bank_transfer',
    ...(notes ? {notes} : {}),
  });
}

// ── Transactions ──────────────────────────────────────────────────────────────

export async function getTransactions(filters = {}) {
  return api.get(`/dashboard/transaction${toQuery(filters)}`);
  // Response: { success, data: [], pagination }
}

// ── Tenant Wallet ─────────────────────────────────────────────────────────────

export async function getTenantWallet() {
  return api.get('/tenant/wallet');
  // Response: { success, data: { balance, currency, isLocked, lockedAt, lockedReason, updatedAt } }
}

// ── Plans ─────────────────────────────────────────────────────────────────────

export async function getPlans(filters = {}) {
  // filters: { search?, isActive?, isPopular?, billingInterval?, page?, limit? }
  return api.get(`/guest/plans${toQuery(filters)}`);
  // Response: { data: [{ plan:{ name, nameAr, description, descriptionAr,
  //             price:{monthly,yearly,unlimited}, isPopular, image },
  //             features:[{ limit, limitType, featureDetails:{nameAr,nameEn,...} }] }],
  //             pagination }
}

// ── Notifications ─────────────────────────────────────────────────────────────

export async function getNotifications(filters = {}) {
  // filters: { page?, limit?, createdAt?, comparison? }
  return api.get(`/dashboard/notification${toQuery(filters)}`);
}

export async function markNotificationRead(id) {
  return api.put(`/dashboard/notification/read/${id}`);
}

export async function markAllNotificationsRead() {
  return api.put('/dashboard/notification/read-all');
}

// ── Reviews ───────────────────────────────────────────────────────────────────

export async function getReviews(filters = {}) {
  return api.get(`/dashboard/review/admin${toQuery(filters)}`);
}

export async function deleteReview(id) {
  return api.delete(`/dashboard/review/admin?id=${id}`);
}

export async function deleteReviews(ids) {
  // ids: string[]
  return api.delete('/dashboard/review/admin', {ids});
}

// ── Support ───────────────────────────────────────────────────────────────────

export async function sendSupportMessage(subject, message, priority = 'NORMAL') {
  return api.post('/dashboard/support', {subject, message, priority});
}

// ── Offers ────────────────────────────────────────────────────────────────────

export async function getOffers(filters = {}) {
  return api.get(`/tenant/offers${toQuery(filters)}`);
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

// ── Package Subscriptions ─────────────────────────────────────────────────────

export async function getPackageSubscriptions(filters = {}) {
  // filters: { packageId?, status?, page?, limit? }
  return api.get(`/tenant/package-subscriptions${toQuery(filters)}`);
  // Response: { data: [{ _id, user:{firstName,lastName,phoneNumber}, package:{name,price},
  //             status, usedCount, usageLimit, validityDays, startDate, endDate }], total, page, pages }
}

// ── Gallery ───────────────────────────────────────────────────────────────────

export async function getGallery() {
  return api.get('/tenant/gallery');
  // Response: { data: [{ _id, url, caption, order, status, deletionRequest, createdAt }],
  //             meta: { total, max, remaining } }
}

export async function addGalleryPhoto(url, caption) {
  return api.post('/tenant/gallery', {url, ...(caption ? {caption} : {})});
  // 201 → success, 409 → reached max (5)
}

export async function requestGalleryDeletion(photoId, reason, note) {
  return api.post(`/tenant/gallery/${photoId}/request-deletion`, {
    reason,
    ...(note ? {note} : {}),
  });
  // 200 → status becomes pending_deletion, 409 → already pending
}

// ── Settings ──────────────────────────────────────────────────────────────────

export async function getSettings() {
  return api.get('/tenant/settings');
}

export async function updateSettings(data) {
  return api.patch('/tenant/settings', data);
}
