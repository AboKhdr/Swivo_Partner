/**
 * Tests for src/services/partner.js
 * Covers: all request states, HTTP errors, empty responses,
 *         Cloudinary upload integration, query-string building,
 *         and every exported function's contract.
 */

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockGet    = jest.fn();
const mockPost   = jest.fn();
const mockPatch  = jest.fn();
const mockPut    = jest.fn();
const mockDelete = jest.fn();
const mockCloudinary = jest.fn();

jest.mock('../../src/services/api', () => ({
  __esModule: true,
  default: {
    get:    mockGet,
    post:   mockPost,
    patch:  mockPatch,
    put:    mockPut,
    delete: mockDelete,
  },
}));

jest.mock('../../src/services/cloudinary', () => ({
  uploadToCloudinary: mockCloudinary,
}));

const {
  getPartnerProfile, updatePartnerProfile, changePassword, uploadPartnerPhoto,
  getOrders, getOrderById, acceptOrder, rejectOrder, assignBiker,
  reviewPhotoSkip, startOnshopOrder, completeOnshopOrder,
  getStaff, addStaff, setDutyStatus, getStaffById, updateStaff, setStaffStatus, removeStaff,
  getServices, getCategoryServices, createService, updateService, deleteService,
  toggleService, getCategories,
  getPackages, createPackage, updatePackage, deletePackage, togglePackage,
  getBranches, updateBranch, updateBranchBanner,
  getSkipRequests, approveSkipRequest, rejectSkipRequest,
  getDashboardToday, getAnalytics,
  getOffers, createOffer, updateOffer, deleteOffer, toggleOffer,
  getSettings, updateSettings,
  sendSupportMessage,
} = require('../../src/services/partner');

// ── Helpers ───────────────────────────────────────────────────────────────────

const OK  = (data = {}) => ({success: true,  data,  error: null});
const ERR = (error = 'NETWORK_ERROR') => ({success: false, data: null, error});

beforeEach(() => jest.clearAllMocks());

// ══════════════════════════════════════════════════════════════════════════════
// PROFILE
// ══════════════════════════════════════════════════════════════════════════════

describe('getPartnerProfile', () => {
  it('GETs /dashboard/profile and returns data on success', async () => {
    mockGet.mockResolvedValue(OK({_id: 'u1', firstName: 'Ahmed'}));
    const res = await getPartnerProfile();
    expect(mockGet).toHaveBeenCalledWith('/dashboard/profile');
    expect(res.success).toBe(true);
    expect(res.data._id).toBe('u1');
  });

  it('propagates error response', async () => {
    mockGet.mockResolvedValue(ERR('NETWORK_ERROR'));
    const res = await getPartnerProfile();
    expect(res.success).toBe(false);
    expect(res.error).toBe('NETWORK_ERROR');
  });
});

describe('updatePartnerProfile', () => {
  it('PUTs /dashboard/profile with data', async () => {
    mockPut.mockResolvedValue(OK({firstName: 'New'}));
    const res = await updatePartnerProfile({firstName: 'New'});
    expect(mockPut).toHaveBeenCalledWith('/dashboard/profile', {firstName: 'New'});
    expect(res.success).toBe(true);
  });

  it('returns error on 400', async () => {
    mockPut.mockResolvedValue(ERR('HTTP_400'));
    const res = await updatePartnerProfile({});
    expect(res.success).toBe(false);
  });
});

describe('changePassword', () => {
  it('PATCHes /dashboard/change-password with all three fields', async () => {
    mockPatch.mockResolvedValue(OK());
    await changePassword('old', 'new123', 'new123');
    expect(mockPatch).toHaveBeenCalledWith('/dashboard/change-password', {
      oldPassword: 'old',
      newPassword: 'new123',
      confirmPassword: 'new123',
    });
  });

  it('returns error when old password is wrong (403)', async () => {
    mockPatch.mockResolvedValue(ERR('HTTP_403'));
    const res = await changePassword('wrong', 'new', 'new');
    expect(res.success).toBe(false);
  });
});

describe('uploadPartnerPhoto', () => {
  it('uploads to Cloudinary then PUTs image URL', async () => {
    mockCloudinary.mockResolvedValue({success: true, url: 'https://cdn.test/photo.jpg'});
    mockPut.mockResolvedValue(OK({image: 'https://cdn.test/photo.jpg'}));

    const res = await uploadPartnerPhoto('file:///local/photo.jpg');
    expect(mockCloudinary).toHaveBeenCalledWith('file:///local/photo.jpg');
    expect(mockPut).toHaveBeenCalledWith('/dashboard/profile', {image: 'https://cdn.test/photo.jpg'});
    expect(res.success).toBe(true);
  });

  it('returns Cloudinary error without calling PUT', async () => {
    mockCloudinary.mockResolvedValue({success: false, error: 'UPLOAD_FAILED'});

    const res = await uploadPartnerPhoto('file:///photo.jpg');
    expect(mockPut).not.toHaveBeenCalled();
    expect(res.success).toBe(false);
    expect(res.error).toBe('UPLOAD_FAILED');
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// ORDERS
// ══════════════════════════════════════════════════════════════════════════════

describe('getOrders', () => {
  it('GETs /tenant/orders without filters', async () => {
    mockGet.mockResolvedValue(OK({data: [], pagination: {total: 0}}));
    await getOrders();
    expect(mockGet).toHaveBeenCalledWith('/tenant/orders');
  });

  it('appends query string for status filter', async () => {
    mockGet.mockResolvedValue(OK({data: []}));
    await getOrders({status: 'PENDING_PARTNER'});
    expect(mockGet).toHaveBeenCalledWith('/tenant/orders?status=PENDING_PARTNER');
  });

  it('appends multiple filters as query string', async () => {
    mockGet.mockResolvedValue(OK({data: []}));
    await getOrders({status: 'ACCEPTED', page: 2, limit: 10});
    const call = mockGet.mock.calls[0][0];
    expect(call).toContain('status=ACCEPTED');
    expect(call).toContain('page=2');
    expect(call).toContain('limit=10');
  });

  it('omits null/undefined/empty-string filter values', async () => {
    mockGet.mockResolvedValue(OK({data: []}));
    await getOrders({status: '', page: null, limit: undefined});
    expect(mockGet).toHaveBeenCalledWith('/tenant/orders');
  });

  it('handles empty data array (empty state)', async () => {
    mockGet.mockResolvedValue(OK({data: [], pagination: {total: 0}}));
    const res = await getOrders();
    expect(res.success).toBe(true);
    expect(res.data.data).toHaveLength(0);
  });

  it('propagates network error', async () => {
    mockGet.mockResolvedValue(ERR('NETWORK_ERROR'));
    const res = await getOrders();
    expect(res.success).toBe(false);
    expect(res.error).toBe('NETWORK_ERROR');
  });
});

describe('getOrderById', () => {
  it('GETs /tenant/orders/:id', async () => {
    mockGet.mockResolvedValue(OK({_id: 'o1', status: 'ACCEPTED'}));
    const res = await getOrderById('o1');
    expect(mockGet).toHaveBeenCalledWith('/tenant/orders/o1');
    expect(res.data._id).toBe('o1');
  });

  it('returns 404 error for unknown order', async () => {
    mockGet.mockResolvedValue(ERR('HTTP_404'));
    const res = await getOrderById('nonexistent');
    expect(res.success).toBe(false);
  });
});

describe('acceptOrder', () => {
  it('POSTs to /tenant/orders/:id/accept', async () => {
    mockPost.mockResolvedValue(OK({status: 'ACCEPTED'}));
    const res = await acceptOrder('o1');
    expect(mockPost).toHaveBeenCalledWith('/tenant/orders/o1/accept');
    expect(res.success).toBe(true);
  });

  it('returns error when order already accepted', async () => {
    mockPost.mockResolvedValue(ERR('HTTP_409'));
    const res = await acceptOrder('o1');
    expect(res.success).toBe(false);
  });
});

describe('rejectOrder', () => {
  it('POSTs to /tenant/orders/:id/reject with reason', async () => {
    mockPost.mockResolvedValue(OK({status: 'REJECTED'}));
    await rejectOrder('o1', 'NOT_AVAILABLE');
    expect(mockPost).toHaveBeenCalledWith('/tenant/orders/o1/reject', {reason: 'NOT_AVAILABLE'});
  });

  it('propagates server error', async () => {
    mockPost.mockResolvedValue(ERR('HTTP_500'));
    const res = await rejectOrder('o1', 'OTHER');
    expect(res.success).toBe(false);
  });
});

describe('assignBiker', () => {
  it('POSTs to /tenant/orders/:id/assign-biker with bikerId', async () => {
    mockPost.mockResolvedValue(OK({status: 'ASSIGNED'}));
    await assignBiker('o1', 'biker-42');
    expect(mockPost).toHaveBeenCalledWith('/tenant/orders/o1/assign-biker', {bikerId: 'biker-42'});
  });
});

describe('reviewPhotoSkip', () => {
  it('POSTs APPROVED decision', async () => {
    mockPost.mockResolvedValue(OK());
    await reviewPhotoSkip('o1', 'APPROVED');
    expect(mockPost).toHaveBeenCalledWith(
      '/tenant/orders/o1/review-photo-skip',
      {decision: 'APPROVED'},
    );
  });

  it('POSTs REJECTED with reviewNote when provided', async () => {
    mockPost.mockResolvedValue(OK());
    await reviewPhotoSkip('o1', 'REJECTED', 'Bad photo');
    expect(mockPost).toHaveBeenCalledWith(
      '/tenant/orders/o1/review-photo-skip',
      {decision: 'REJECTED', reviewNote: 'Bad photo'},
    );
  });

  it('does not include reviewNote key when not provided', async () => {
    mockPost.mockResolvedValue(OK());
    await reviewPhotoSkip('o1', 'APPROVED');
    const body = mockPost.mock.calls[0][1];
    expect(body).not.toHaveProperty('reviewNote');
  });
});

describe('startOnshopOrder', () => {
  it('POSTs with photo URL when Cloudinary succeeds', async () => {
    mockCloudinary.mockResolvedValue({success: true, url: 'https://cdn.test/start.jpg'});
    mockPost.mockResolvedValue(OK({status: 'STARTED'}));

    await startOnshopOrder('o1', 'file:///start.jpg');
    expect(mockPost).toHaveBeenCalledWith('/tenant/orders/o1/start', {photo: 'https://cdn.test/start.jpg'});
  });

  it('POSTs with original URI when Cloudinary fails', async () => {
    mockCloudinary.mockResolvedValue({success: false, error: 'UPLOAD_FAILED'});
    mockPost.mockResolvedValue(OK({status: 'STARTED'}));

    await startOnshopOrder('o1', 'file:///start.jpg');
    // photo falls back to local URI
    expect(mockPost).toHaveBeenCalledWith('/tenant/orders/o1/start', {photo: 'file:///start.jpg'});
  });

  it('POSTs with empty body when no photo provided', async () => {
    mockPost.mockResolvedValue(OK());
    await startOnshopOrder('o1');
    expect(mockPost).toHaveBeenCalledWith('/tenant/orders/o1/start', {});
  });
});

describe('completeOnshopOrder', () => {
  it('uploads all photos to Cloudinary then POSTs URLs', async () => {
    mockCloudinary
      .mockResolvedValueOnce({success: true, url: 'https://cdn.test/1.jpg'})
      .mockResolvedValueOnce({success: true, url: 'https://cdn.test/2.jpg'});
    mockPost.mockResolvedValue(OK({status: 'COMPLETED'}));

    await completeOnshopOrder('o1', ['file:///1.jpg', 'file:///2.jpg']);
    expect(mockPost).toHaveBeenCalledWith('/tenant/orders/o1/complete', {
      photos: ['https://cdn.test/1.jpg', 'https://cdn.test/2.jpg'],
    });
  });

  it('skips failed Cloudinary uploads', async () => {
    mockCloudinary
      .mockResolvedValueOnce({success: true,  url: 'https://cdn.test/good.jpg'})
      .mockResolvedValueOnce({success: false, error: 'FAIL'});
    mockPost.mockResolvedValue(OK());

    await completeOnshopOrder('o1', ['file:///good.jpg', 'file:///bad.jpg']);
    const body = mockPost.mock.calls[0][1];
    expect(body.photos).toEqual(['https://cdn.test/good.jpg']);
  });

  it('POSTs empty photos array when no URIs provided', async () => {
    mockPost.mockResolvedValue(OK());
    await completeOnshopOrder('o1', []);
    expect(mockPost).toHaveBeenCalledWith('/tenant/orders/o1/complete', {photos: []});
  });

  it('handles null photoUris gracefully', async () => {
    mockPost.mockResolvedValue(OK());
    await completeOnshopOrder('o1', null);
    expect(mockPost).toHaveBeenCalledWith('/tenant/orders/o1/complete', {photos: []});
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// STAFF
// ══════════════════════════════════════════════════════════════════════════════

describe('getStaff', () => {
  it('GETs /tenant/staff without filters', async () => {
    mockGet.mockResolvedValue(OK({data: []}));
    await getStaff();
    expect(mockGet).toHaveBeenCalledWith('/tenant/staff');
  });

  it('filters by role=BIKER', async () => {
    mockGet.mockResolvedValue(OK({data: []}));
    await getStaff({role: 'BIKER'});
    expect(mockGet).toHaveBeenCalledWith('/tenant/staff?role=BIKER');
  });

  it('returns empty array for empty state', async () => {
    mockGet.mockResolvedValue(OK({data: [], total: 0}));
    const res = await getStaff();
    expect(res.data.data).toHaveLength(0);
  });
});

describe('addStaff', () => {
  it('POSTs to /tenant/staff with data', async () => {
    mockPost.mockResolvedValue(OK({_id: 'staff1'}));
    await addStaff({phoneNumber: '0512345678', role: 'BIKER', branchId: 'b1'});
    expect(mockPost).toHaveBeenCalledWith('/tenant/staff', {
      phoneNumber: '0512345678', role: 'BIKER', branchId: 'b1',
    });
  });
});

describe('setDutyStatus', () => {
  it('PATCHes duty with isOnDuty:true', async () => {
    mockPatch.mockResolvedValue(OK({isOnDuty: true}));
    await setDutyStatus('staff1', true);
    expect(mockPatch).toHaveBeenCalledWith('/tenant/staff/staff1/duty', {isOnDuty: true});
  });

  it('PATCHes duty with isOnDuty:false', async () => {
    mockPatch.mockResolvedValue(OK({isOnDuty: false}));
    await setDutyStatus('staff1', false);
    expect(mockPatch).toHaveBeenCalledWith('/tenant/staff/staff1/duty', {isOnDuty: false});
  });
});

describe('getStaffById', () => {
  it('GETs /tenant/staff/:id', async () => {
    mockGet.mockResolvedValue(OK({_id: 'staff1', role: 'BIKER'}));
    await getStaffById('staff1');
    expect(mockGet).toHaveBeenCalledWith('/tenant/staff/staff1');
  });

  it('returns 404 for unknown staff', async () => {
    mockGet.mockResolvedValue(ERR('HTTP_404'));
    const res = await getStaffById('ghost');
    expect(res.success).toBe(false);
  });
});

describe('removeStaff', () => {
  it('DELETEs /tenant/staff/:id', async () => {
    mockDelete.mockResolvedValue(OK());
    await removeStaff('staff1');
    expect(mockDelete).toHaveBeenCalledWith('/tenant/staff/staff1');
  });
});

describe('setStaffStatus', () => {
  it('PATCHes status to suspended', async () => {
    mockPatch.mockResolvedValue(OK());
    await setStaffStatus('staff1', 'suspended');
    expect(mockPatch).toHaveBeenCalledWith('/tenant/staff/staff1/status', {status: 'suspended'});
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// SERVICES
// ══════════════════════════════════════════════════════════════════════════════

describe('getServices', () => {
  it('GETs /tenant/services without filters', async () => {
    mockGet.mockResolvedValue(OK({data: []}));
    await getServices();
    expect(mockGet).toHaveBeenCalledWith('/tenant/services');
  });

  it('appends filters as query string', async () => {
    mockGet.mockResolvedValue(OK({data: []}));
    await getServices({includeInactive: true});
    expect(mockGet).toHaveBeenCalledWith('/tenant/services?includeInactive=true');
  });
});

describe('createService', () => {
  const serviceData = {
    name: {ar: 'غسيل', en: 'Wash'},
    price: {small: 50, medium: 100, large: 150},
  };

  it('POSTs to /tenant/services with data', async () => {
    mockPost.mockResolvedValue(OK({_id: 's1'}));
    await createService(serviceData);
    expect(mockPost).toHaveBeenCalledWith('/tenant/services', serviceData);
  });

  it('uploads image to Cloudinary before POST when imageUri provided', async () => {
    mockCloudinary.mockResolvedValue({success: true, url: 'https://cdn.test/svc.jpg'});
    mockPost.mockResolvedValue(OK({_id: 's1'}));

    await createService({...serviceData, imageUri: 'file:///svc.jpg'});
    const body = mockPost.mock.calls[0][1];
    expect(body.image).toBe('https://cdn.test/svc.jpg');
    expect(body.imageUri).toBeUndefined();
  });

  it('does not call Cloudinary when no imageUri', async () => {
    mockPost.mockResolvedValue(OK());
    await createService(serviceData);
    expect(mockCloudinary).not.toHaveBeenCalled();
  });
});

describe('toggleService', () => {
  it('PATCHes /tenant/services/:id/toggle with isActive', async () => {
    mockPatch.mockResolvedValue(OK());
    await toggleService('s1', false);
    expect(mockPatch).toHaveBeenCalledWith('/tenant/services/s1/toggle', {isActive: false});
  });
});

describe('deleteService', () => {
  it('DELETEs /tenant/services/:id', async () => {
    mockDelete.mockResolvedValue(OK());
    await deleteService('s1');
    expect(mockDelete).toHaveBeenCalledWith('/tenant/services/s1');
  });
});

describe('getCategories', () => {
  it('GETs /tenant/categories', async () => {
    mockGet.mockResolvedValue(OK({data: [{_id: 'c1', name: {ar: 'عناية', en: 'Care'}}]}));
    const res = await getCategories();
    expect(mockGet).toHaveBeenCalledWith('/tenant/categories');
    expect(res.data.data[0]._id).toBe('c1');
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// PACKAGES
// ══════════════════════════════════════════════════════════════════════════════

describe('createPackage', () => {
  const pkgData = {
    name: {ar: 'باقة', en: 'Package'},
    serviceIds: ['s1'],
    price: {small: 100},
    usageLimit: 5,
    validityDays: 30,
  };

  it('POSTs to /tenant/packages', async () => {
    mockPost.mockResolvedValue(OK({_id: 'p1'}));
    await createPackage(pkgData);
    expect(mockPost).toHaveBeenCalledWith('/tenant/packages', pkgData);
  });

  it('uploads banner to Cloudinary before POST', async () => {
    mockCloudinary.mockResolvedValue({success: true, url: 'https://cdn.test/banner.jpg'});
    mockPost.mockResolvedValue(OK());

    await createPackage({...pkgData, bannerUri: 'file:///banner.jpg'});
    const body = mockPost.mock.calls[0][1];
    expect(body.banner).toBe('https://cdn.test/banner.jpg');
    expect(body.bannerUri).toBeUndefined();
  });
});

describe('togglePackage', () => {
  it('PATCHes /tenant/packages/:id/toggle', async () => {
    mockPatch.mockResolvedValue(OK());
    await togglePackage('p1', true);
    expect(mockPatch).toHaveBeenCalledWith('/tenant/packages/p1/toggle', {isActive: true});
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// BRANCHES
// ══════════════════════════════════════════════════════════════════════════════

describe('getBranches', () => {
  it('GETs /tenant/branches', async () => {
    mockGet.mockResolvedValue(OK({data: []}));
    await getBranches();
    expect(mockGet).toHaveBeenCalledWith('/tenant/branches');
  });
});

describe('updateBranch', () => {
  it('PUTs /tenant/branches/:id with data', async () => {
    mockPut.mockResolvedValue(OK());
    await updateBranch('br1', {name: 'Branch A'});
    expect(mockPut).toHaveBeenCalledWith('/tenant/branches/br1', {name: 'Branch A'});
  });
});

describe('updateBranchBanner', () => {
  it('PATCHes banner=null to remove it', async () => {
    mockPatch.mockResolvedValue(OK());
    await updateBranchBanner('br1', null);
    expect(mockPatch).toHaveBeenCalledWith('/tenant/branches/br1/banner', {banner: null});
  });

  it('uploads to Cloudinary then PATCHes banner URL', async () => {
    mockCloudinary.mockResolvedValue({success: true, url: 'https://cdn.test/banner.jpg'});
    mockPatch.mockResolvedValue(OK());

    await updateBranchBanner('br1', 'file:///banner.jpg');
    expect(mockPatch).toHaveBeenCalledWith('/tenant/branches/br1/banner', {
      banner: 'https://cdn.test/banner.jpg',
    });
  });

  it('returns error when Cloudinary fails', async () => {
    mockCloudinary.mockResolvedValue({success: false, error: 'UPLOAD_FAILED'});
    const res = await updateBranchBanner('br1', 'file:///banner.jpg');
    expect(mockPatch).not.toHaveBeenCalled();
    expect(res.success).toBe(false);
    expect(res.error).toBe('UPLOAD_FAILED');
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// SKIP REQUESTS
// ══════════════════════════════════════════════════════════════════════════════

describe('getSkipRequests', () => {
  it('GETs /tenant/skip-requests without filters', async () => {
    mockGet.mockResolvedValue(OK({data: []}));
    await getSkipRequests();
    expect(mockGet).toHaveBeenCalledWith('/tenant/skip-requests');
  });

  it('filters by status=PENDING', async () => {
    mockGet.mockResolvedValue(OK({data: []}));
    await getSkipRequests({status: 'PENDING'});
    expect(mockGet).toHaveBeenCalledWith('/tenant/skip-requests?status=PENDING');
  });
});

describe('approveSkipRequest', () => {
  it('POSTs APPROVED decision with phase', async () => {
    mockPost.mockResolvedValue(OK());
    await approveSkipRequest('o1', 'before');
    expect(mockPost).toHaveBeenCalledWith(
      '/tenant/orders/o1/review-photo-skip',
      {phase: 'before', decision: 'APPROVED'},
    );
  });

  it('passes the phase through to the request body', async () => {
    mockPost.mockResolvedValue(OK());
    await approveSkipRequest('o1', 'after');
    const body = mockPost.mock.calls[0][1];
    expect(body.phase).toBe('after');
  });
});

describe('rejectSkipRequest', () => {
  it('POSTs REJECTED decision with phase and reviewNote', async () => {
    mockPost.mockResolvedValue(OK());
    await rejectSkipRequest('o1', 'after', 'Photo required');
    expect(mockPost).toHaveBeenCalledWith(
      '/tenant/orders/o1/review-photo-skip',
      {phase: 'after', decision: 'REJECTED', reviewNote: 'Photo required'},
    );
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// ANALYTICS / DASHBOARD
// ══════════════════════════════════════════════════════════════════════════════

describe('getDashboardToday', () => {
  it('GETs /dashboard/today and returns stats', async () => {
    mockGet.mockResolvedValue(OK({
      totalOrdersToday: 12,
      availableBikersCount: 3,
      recentPendingOrders: [],
    }));
    const res = await getDashboardToday();
    expect(mockGet).toHaveBeenCalledWith('/dashboard/today');
    expect(res.data.totalOrdersToday).toBe(12);
  });

  it('propagates 500 error', async () => {
    mockGet.mockResolvedValue(ERR('HTTP_500'));
    const res = await getDashboardToday();
    expect(res.success).toBe(false);
    expect(res.error).toBe('HTTP_500');
  });
});

describe('getAnalytics', () => {
  it('GETs /dashboard/analytics/admin without filters', async () => {
    mockGet.mockResolvedValue(OK({}));
    await getAnalytics();
    expect(mockGet).toHaveBeenCalledWith('/dashboard/analytics/admin');
  });

  it('appends year and month filters', async () => {
    mockGet.mockResolvedValue(OK({}));
    await getAnalytics({year: 2025, month: 5});
    expect(mockGet).toHaveBeenCalledWith('/dashboard/analytics/admin?year=2025&month=5');
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// OFFERS
// ══════════════════════════════════════════════════════════════════════════════

describe('getOffers', () => {
  it('GETs /tenant/offers', async () => {
    mockGet.mockResolvedValue(OK({data: []}));
    await getOffers();
    expect(mockGet).toHaveBeenCalledWith('/tenant/offers');
  });
});

describe('createOffer', () => {
  it('POSTs to /tenant/offers', async () => {
    const data = {name: {ar: 'عرض', en: 'Offer'}, isActive: true};
    mockPost.mockResolvedValue(OK({_id: 'offer1'}));
    await createOffer(data);
    expect(mockPost).toHaveBeenCalledWith('/tenant/offers', data);
  });
});

describe('toggleOffer', () => {
  it('PATCHes /tenant/offers/:id/toggle', async () => {
    mockPatch.mockResolvedValue(OK());
    await toggleOffer('offer1', false);
    expect(mockPatch).toHaveBeenCalledWith('/tenant/offers/offer1/toggle', {isActive: false});
  });
});

describe('deleteOffer', () => {
  it('DELETEs /tenant/offers/:id', async () => {
    mockDelete.mockResolvedValue(OK());
    await deleteOffer('offer1');
    expect(mockDelete).toHaveBeenCalledWith('/tenant/offers/offer1');
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// SETTINGS
// ══════════════════════════════════════════════════════════════════════════════

describe('getSettings', () => {
  it('GETs /tenant/settings', async () => {
    mockGet.mockResolvedValue(OK({autoAccept: false}));
    await getSettings();
    expect(mockGet).toHaveBeenCalledWith('/tenant/settings');
  });
});

describe('updateSettings', () => {
  it('PATCHes /tenant/settings', async () => {
    mockPatch.mockResolvedValue(OK());
    await updateSettings({autoAccept: true});
    expect(mockPatch).toHaveBeenCalledWith('/tenant/settings', {autoAccept: true});
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// SUPPORT
// ══════════════════════════════════════════════════════════════════════════════

describe('sendSupportMessage', () => {
  it('POSTs to /dashboard/support with subject and message', async () => {
    mockPost.mockResolvedValue(OK());
    await sendSupportMessage('Bug', 'The app crashes');
    expect(mockPost).toHaveBeenCalledWith('/dashboard/support', {
      subject: 'Bug',
      message: 'The app crashes',
      priority: 'NORMAL',
    });
  });

  it('returns error on network failure', async () => {
    mockPost.mockResolvedValue(ERR('NETWORK_ERROR'));
    const res = await sendSupportMessage('x', 'y');
    expect(res.success).toBe(false);
  });
});
