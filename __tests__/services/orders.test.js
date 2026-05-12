/**
 * Tests for src/services/orders.js (biker-side order service)
 * Covers:
 *   - getOrders / getOrderById: request states, filters, empty data
 *   - updateOrderStatus: success, error, all status transitions
 *   - uploadOrderPhoto: Cloudinary integration, fallback on failure
 *   - skipOrderPhoto: phase + reason forwarding
 *   - cancelOrder: reason forwarding
 *   - Re-exports from partner.js (acceptOrder, rejectOrder, assignBiker)
 */

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockGet    = jest.fn();
const mockPost   = jest.fn();
const mockPatch  = jest.fn();
const mockPut    = jest.fn();
const mockCloudinary = jest.fn();
const mockAcceptOrder = jest.fn();
const mockRejectOrder = jest.fn();
const mockAssignBiker = jest.fn();

jest.mock('../../src/services/api', () => ({
  __esModule: true,
  default: {
    get:   mockGet,
    post:  mockPost,
    patch: mockPatch,
    put:   mockPut,
  },
}));

jest.mock('../../src/services/cloudinary', () => ({
  uploadToCloudinary: mockCloudinary,
}));

jest.mock('../../src/services/partner', () => ({
  acceptOrder: mockAcceptOrder,
  rejectOrder: mockRejectOrder,
  assignBiker: mockAssignBiker,
}));

const {
  getOrders,
  getOrderById,
  updateOrderStatus,
  uploadOrderPhoto,
  skipOrderPhoto,
  cancelOrder,
  acceptOrder,
  rejectOrder,
  assignBiker,
} = require('../../src/services/orders');

// ── Helpers ───────────────────────────────────────────────────────────────────

const OK  = (data = {}) => ({success: true,  data,  error: null});
const ERR = (error = 'NETWORK_ERROR') => ({success: false, data: null, error});

beforeEach(() => jest.clearAllMocks());

// ══════════════════════════════════════════════════════════════════════════════
// getOrders
// ══════════════════════════════════════════════════════════════════════════════

describe('getOrders', () => {
  it('GETs /biker/order without filters', async () => {
    mockGet.mockResolvedValue(OK({data: []}));
    await getOrders();
    expect(mockGet).toHaveBeenCalledWith('/biker/order');
  });

  it('appends status filter', async () => {
    mockGet.mockResolvedValue(OK({data: []}));
    await getOrders({status: 'ASSIGNED'});
    const url = mockGet.mock.calls[0][0];
    expect(url).toContain('status=ASSIGNED');
  });

  it('appends multiple filters', async () => {
    mockGet.mockResolvedValue(OK({data: []}));
    await getOrders({filter: 'active', page: 1, limit: 20});
    const url = mockGet.mock.calls[0][0];
    expect(url).toContain('filter=active');
    expect(url).toContain('page=1');
    expect(url).toContain('limit=20');
  });

  it('omits null / undefined / empty-string filter values', async () => {
    mockGet.mockResolvedValue(OK({data: []}));
    await getOrders({status: null, filter: '', page: undefined});
    expect(mockGet).toHaveBeenCalledWith('/biker/order');
  });

  it('returns success:true with order list', async () => {
    const orders = [{_id: 'o1', status: 'ASSIGNED'}, {_id: 'o2', status: 'ON_THE_WAY'}];
    mockGet.mockResolvedValue(OK({data: orders}));
    const res = await getOrders();
    expect(res.success).toBe(true);
    expect(res.data.data).toHaveLength(2);
  });

  it('handles empty list (empty state)', async () => {
    mockGet.mockResolvedValue(OK({data: []}));
    const res = await getOrders({filter: 'active'});
    expect(res.success).toBe(true);
    expect(res.data.data).toHaveLength(0);
  });

  it('returns NETWORK_ERROR when offline', async () => {
    mockGet.mockResolvedValue(ERR('NETWORK_ERROR'));
    const res = await getOrders();
    expect(res.success).toBe(false);
    expect(res.error).toBe('NETWORK_ERROR');
  });

  it('returns TIMEOUT error', async () => {
    mockGet.mockResolvedValue(ERR('TIMEOUT'));
    const res = await getOrders();
    expect(res.error).toBe('TIMEOUT');
  });

  it('comma-separated status values are passed through', async () => {
    mockGet.mockResolvedValue(OK({data: []}));
    await getOrders({status: 'ON_THE_WAY,STARTED'});
    const url = mockGet.mock.calls[0][0];
    expect(url).toContain('ON_THE_WAY%2CSTARTED');
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// getOrderById
// ══════════════════════════════════════════════════════════════════════════════

describe('getOrderById', () => {
  it('GETs /biker/order/:id', async () => {
    mockGet.mockResolvedValue(OK({_id: 'o1', status: 'ASSIGNED'}));
    const res = await getOrderById('o1');
    expect(mockGet).toHaveBeenCalledWith('/biker/order/o1');
    expect(res.data._id).toBe('o1');
  });

  it('returns 404 for unknown order', async () => {
    mockGet.mockResolvedValue(ERR('HTTP_404'));
    const res = await getOrderById('nonexistent');
    expect(res.success).toBe(false);
    expect(res.error).toBe('HTTP_404');
    expect(res.data).toBeNull();
  });

  it('returns 500 on server error', async () => {
    mockGet.mockResolvedValue(ERR('HTTP_500'));
    const res = await getOrderById('o1');
    expect(res.success).toBe(false);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// updateOrderStatus
// ══════════════════════════════════════════════════════════════════════════════

describe('updateOrderStatus', () => {
  const STATUSES = ['ON_THE_WAY', 'ARRIVED', 'STARTED', 'COMPLETED'];

  it('PATCHes /biker/order/:id/status with status', async () => {
    mockPatch.mockResolvedValue(OK({status: 'ON_THE_WAY'}));
    await updateOrderStatus('o1', 'ON_THE_WAY');
    expect(mockPatch).toHaveBeenCalledWith('/biker/order/o1/status', {status: 'ON_THE_WAY'});
  });

  STATUSES.forEach(status => {
    it(`accepts status transition to ${status}`, async () => {
      mockPatch.mockResolvedValue(OK({status}));
      const res = await updateOrderStatus('o1', status);
      expect(res.success).toBe(true);
      expect(mockPatch).toHaveBeenCalledWith('/biker/order/o1/status', {status});
    });
  });

  it('returns error when order already completed', async () => {
    mockPatch.mockResolvedValue(ERR('HTTP_400'));
    const res = await updateOrderStatus('o1', 'COMPLETED');
    expect(res.success).toBe(false);
  });

  it('returns NETWORK_ERROR when offline', async () => {
    mockPatch.mockResolvedValue(ERR('NETWORK_ERROR'));
    const res = await updateOrderStatus('o1', 'STARTED');
    expect(res.error).toBe('NETWORK_ERROR');
  });

  it('returns TIMEOUT on slow network', async () => {
    mockPatch.mockResolvedValue(ERR('TIMEOUT'));
    const res = await updateOrderStatus('o1', 'STARTED');
    expect(res.error).toBe('TIMEOUT');
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// uploadOrderPhoto
// ══════════════════════════════════════════════════════════════════════════════

describe('uploadOrderPhoto', () => {
  it('uploads to Cloudinary then POSTs URL to backend', async () => {
    mockCloudinary.mockResolvedValue({success: true, url: 'https://cdn.test/before.jpg'});
    mockPost.mockResolvedValue(OK({phase: 'before'}));

    const res = await uploadOrderPhoto('o1', 'file:///photo.jpg', 'before');

    expect(mockCloudinary).toHaveBeenCalledWith('file:///photo.jpg');
    expect(mockPost).toHaveBeenCalledWith('/biker/order/o1/proof/photos', {
      phase: 'before',
      url: 'https://cdn.test/before.jpg',
    });
    expect(res.success).toBe(true);
  });

  it('returns Cloudinary error without calling backend', async () => {
    mockCloudinary.mockResolvedValue({success: false, error: 'UPLOAD_FAILED'});

    const res = await uploadOrderPhoto('o1', 'file:///photo.jpg', 'after');

    expect(mockPost).not.toHaveBeenCalled();
    expect(res.success).toBe(false);
    expect(res.error).toBe('UPLOAD_FAILED');
    expect(res.data).toBeNull();
  });

  it('supports phase=before', async () => {
    mockCloudinary.mockResolvedValue({success: true, url: 'https://cdn.test/b.jpg'});
    mockPost.mockResolvedValue(OK());

    await uploadOrderPhoto('o1', 'file:///b.jpg', 'before');
    expect(mockPost.mock.calls[0][1].phase).toBe('before');
  });

  it('supports phase=after', async () => {
    mockCloudinary.mockResolvedValue({success: true, url: 'https://cdn.test/a.jpg'});
    mockPost.mockResolvedValue(OK());

    await uploadOrderPhoto('o1', 'file:///a.jpg', 'after');
    expect(mockPost.mock.calls[0][1].phase).toBe('after');
  });

  it('returns backend error when POST fails after successful upload', async () => {
    mockCloudinary.mockResolvedValue({success: true, url: 'https://cdn.test/img.jpg'});
    mockPost.mockResolvedValue(ERR('HTTP_500'));

    const res = await uploadOrderPhoto('o1', 'file:///img.jpg', 'before');
    expect(res.success).toBe(false);
    expect(res.error).toBe('HTTP_500');
  });

  it('returns TIMEOUT when Cloudinary times out', async () => {
    mockCloudinary.mockResolvedValue({success: false, error: 'TIMEOUT'});

    const res = await uploadOrderPhoto('o1', 'file:///img.jpg', 'before');
    expect(res.error).toBe('TIMEOUT');
    expect(mockPost).not.toHaveBeenCalled();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// skipOrderPhoto
// ══════════════════════════════════════════════════════════════════════════════

describe('skipOrderPhoto', () => {
  it('POSTs to /biker/order/:id/proof/skip with phase and reason', async () => {
    mockPost.mockResolvedValue(OK());
    await skipOrderPhoto('o1', 'before', 'CUSTOMER_NOT_PRESENT');
    expect(mockPost).toHaveBeenCalledWith('/biker/order/o1/proof/skip', {
      phase: 'before',
      reason: 'CUSTOMER_NOT_PRESENT',
    });
  });

  it('POSTs skip for after phase', async () => {
    mockPost.mockResolvedValue(OK());
    await skipOrderPhoto('o1', 'after', 'CAR_NOT_READY');
    expect(mockPost.mock.calls[0][1]).toEqual({phase: 'after', reason: 'CAR_NOT_READY'});
  });

  it('returns success:true on 200', async () => {
    mockPost.mockResolvedValue(OK({skipped: true}));
    const res = await skipOrderPhoto('o1', 'before', 'reason');
    expect(res.success).toBe(true);
  });

  it('returns error when skip not allowed', async () => {
    mockPost.mockResolvedValue(ERR('HTTP_403'));
    const res = await skipOrderPhoto('o1', 'before', 'reason');
    expect(res.success).toBe(false);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// cancelOrder
// ══════════════════════════════════════════════════════════════════════════════

describe('cancelOrder', () => {
  it('PUTs /biker/order/:id with reason', async () => {
    mockPut.mockResolvedValue(OK());
    await cancelOrder('o1', 'CUSTOMER_CANCELLED');
    expect(mockPut).toHaveBeenCalledWith('/biker/order/o1', {reason: 'CUSTOMER_CANCELLED'});
  });

  it('returns success:true on 200', async () => {
    mockPut.mockResolvedValue(OK({status: 'CANCELLED'}));
    const res = await cancelOrder('o1', 'BIKER_ISSUE');
    expect(res.success).toBe(true);
  });

  it('returns error when order cannot be cancelled', async () => {
    mockPut.mockResolvedValue(ERR('HTTP_400'));
    const res = await cancelOrder('o1', 'reason');
    expect(res.success).toBe(false);
  });

  it('returns NETWORK_ERROR when offline', async () => {
    mockPut.mockResolvedValue(ERR('NETWORK_ERROR'));
    const res = await cancelOrder('o1', 'reason');
    expect(res.error).toBe('NETWORK_ERROR');
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Re-exports from partner.js
// ══════════════════════════════════════════════════════════════════════════════

describe('partner re-exports', () => {
  it('acceptOrder is re-exported from partner.js', async () => {
    mockAcceptOrder.mockResolvedValue(OK({status: 'ACCEPTED'}));
    const res = await acceptOrder('o1');
    expect(mockAcceptOrder).toHaveBeenCalledWith('o1');
    expect(res.success).toBe(true);
  });

  it('rejectOrder is re-exported from partner.js', async () => {
    mockRejectOrder.mockResolvedValue(OK({status: 'REJECTED'}));
    const res = await rejectOrder('o1', 'NOT_AVAILABLE');
    expect(mockRejectOrder).toHaveBeenCalledWith('o1', 'NOT_AVAILABLE');
    expect(res.success).toBe(true);
  });

  it('assignBiker is re-exported from partner.js', async () => {
    mockAssignBiker.mockResolvedValue(OK({status: 'ASSIGNED'}));
    const res = await assignBiker('o1', 'biker-1');
    expect(mockAssignBiker).toHaveBeenCalledWith('o1', 'biker-1');
    expect(res.success).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Integration — request lifecycle (loading → success / error)
// ══════════════════════════════════════════════════════════════════════════════

describe('request lifecycle', () => {
  it('multiple sequential calls succeed independently', async () => {
    mockGet
      .mockResolvedValueOnce(OK({data: [{_id: 'o1'}]}))
      .mockResolvedValueOnce(OK({_id: 'o1', status: 'ASSIGNED'}));

    const list = await getOrders({filter: 'active'});
    const detail = await getOrderById('o1');

    expect(list.success).toBe(true);
    expect(detail.success).toBe(true);
    expect(detail.data._id).toBe('o1');
  });

  it('error on list fetch does not affect detail fetch', async () => {
    mockGet
      .mockResolvedValueOnce(ERR('NETWORK_ERROR'))
      .mockResolvedValueOnce(OK({_id: 'o1'}));

    const [list, detail] = await Promise.all([
      getOrders(),
      getOrderById('o1'),
    ]);

    expect(list.success).toBe(false);
    expect(detail.success).toBe(true);
  });

  it('updateOrderStatus and uploadOrderPhoto can run concurrently', async () => {
    mockPatch.mockResolvedValue(OK({status: 'STARTED'}));
    mockCloudinary.mockResolvedValue({success: true, url: 'https://cdn.test/x.jpg'});
    mockPost.mockResolvedValue(OK());

    const [status, photo] = await Promise.all([
      updateOrderStatus('o1', 'STARTED'),
      uploadOrderPhoto('o1', 'file:///x.jpg', 'before'),
    ]);

    expect(status.success).toBe(true);
    expect(photo.success).toBe(true);
  });
});
