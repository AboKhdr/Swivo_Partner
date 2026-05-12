/**
 * Tests for src/store/ordersStore.js
 * Covers: fetchOrders, fetchOrderById, updateOrderStatus, assignBiker,
 *         acceptOrder, rejectOrder, localUpdateStatus, helpers
 */

jest.mock('../../src/services/api', () => ({
  __esModule: true,
  default: {
    get:   jest.fn(),
    post:  jest.fn(),
    patch: jest.fn(),
  },
}));

import useOrdersStore from '../../src/store/ordersStore';
import api from '../../src/services/api';

const ORDERS = [
  {id: 'o1', status: 'ASSIGNED', bikerId: null},
  {id: 'o2', status: 'ON_THE_WAY', bikerId: 'b1'},
];

beforeEach(() => {
  jest.clearAllMocks();
  useOrdersStore.setState({
    orders: [], activeOrder: null, loading: false, refreshing: false, error: null,
  });
});

// ── fetchOrders ───────────────────────────────────────────────────────────────

describe('fetchOrders', () => {
  it('sets loading:true then stores orders on success', async () => {
    api.get.mockResolvedValue({success: true, data: ORDERS});
    const promise = useOrdersStore.getState().fetchOrders();
    expect(useOrdersStore.getState().loading).toBe(true);
    await promise;
    expect(useOrdersStore.getState().orders).toEqual(ORDERS);
    expect(useOrdersStore.getState().loading).toBe(false);
    expect(useOrdersStore.getState().error).toBeNull();
  });

  it('sets error on failure', async () => {
    api.get.mockResolvedValue({success: false, error: 'NETWORK_ERROR'});
    await useOrdersStore.getState().fetchOrders();
    expect(useOrdersStore.getState().error).toBe('NETWORK_ERROR');
    expect(useOrdersStore.getState().loading).toBe(false);
  });

  it('builds query string from filters', async () => {
    api.get.mockResolvedValue({success: true, data: []});
    await useOrdersStore.getState().fetchOrders({status: 'ASSIGNED', page: 2});
    const url = api.get.mock.calls[0][0];
    expect(url).toContain('status=ASSIGNED');
    expect(url).toContain('page=2');
  });

  it('calls /orders with no query when filters is empty', async () => {
    api.get.mockResolvedValue({success: true, data: []});
    await useOrdersStore.getState().fetchOrders();
    expect(api.get.mock.calls[0][0]).toBe('/orders');
  });

  it('clears previous error on new fetch', async () => {
    useOrdersStore.setState({error: 'OLD_ERROR'});
    api.get.mockResolvedValue({success: true, data: []});
    await useOrdersStore.getState().fetchOrders();
    expect(useOrdersStore.getState().error).toBeNull();
  });
});

// ── refreshOrders ─────────────────────────────────────────────────────────────

describe('refreshOrders', () => {
  it('uses refreshing flag instead of loading', async () => {
    api.get.mockResolvedValue({success: true, data: []});
    const promise = useOrdersStore.getState().refreshOrders();
    expect(useOrdersStore.getState().refreshing).toBe(true);
    expect(useOrdersStore.getState().loading).toBe(false);
    await promise;
    expect(useOrdersStore.getState().refreshing).toBe(false);
  });

  it('stores new orders on success', async () => {
    api.get.mockResolvedValue({success: true, data: ORDERS});
    await useOrdersStore.getState().refreshOrders();
    expect(useOrdersStore.getState().orders).toEqual(ORDERS);
  });
});

// ── fetchOrderById ────────────────────────────────────────────────────────────

describe('fetchOrderById', () => {
  it('sets activeOrder on success', async () => {
    api.get.mockResolvedValue({success: true, data: ORDERS[0]});
    await useOrdersStore.getState().fetchOrderById('o1');
    expect(useOrdersStore.getState().activeOrder).toEqual(ORDERS[0]);
  });

  it('returns the response object', async () => {
    const mockRes = {success: true, data: ORDERS[0]};
    api.get.mockResolvedValue(mockRes);
    const res = await useOrdersStore.getState().fetchOrderById('o1');
    expect(res).toEqual(mockRes);
  });

  it('sets error on failure', async () => {
    api.get.mockResolvedValue({success: false, error: 'NOT_FOUND'});
    await useOrdersStore.getState().fetchOrderById('bad-id');
    expect(useOrdersStore.getState().error).toBe('NOT_FOUND');
    expect(useOrdersStore.getState().activeOrder).toBeNull();
  });

  it('calls correct endpoint', async () => {
    api.get.mockResolvedValue({success: true, data: {}});
    await useOrdersStore.getState().fetchOrderById('order-xyz');
    expect(api.get).toHaveBeenCalledWith('/orders/order-xyz');
  });
});

// ── updateOrderStatus ─────────────────────────────────────────────────────────

describe('updateOrderStatus', () => {
  beforeEach(() => {
    useOrdersStore.setState({orders: [...ORDERS], activeOrder: {...ORDERS[0]}});
  });

  it('updates status in orders list on success', async () => {
    api.patch.mockResolvedValue({success: true, data: {}});
    await useOrdersStore.getState().updateOrderStatus('o1', 'ON_THE_WAY');
    const updated = useOrdersStore.getState().orders.find(o => o.id === 'o1');
    expect(updated.status).toBe('ON_THE_WAY');
  });

  it('updates activeOrder status when ids match', async () => {
    api.patch.mockResolvedValue({success: true, data: {}});
    await useOrdersStore.getState().updateOrderStatus('o1', 'STARTED');
    expect(useOrdersStore.getState().activeOrder.status).toBe('STARTED');
  });

  it('does not update activeOrder when id does not match', async () => {
    api.patch.mockResolvedValue({success: true, data: {}});
    await useOrdersStore.getState().updateOrderStatus('o2', 'COMPLETED');
    expect(useOrdersStore.getState().activeOrder.status).toBe('ASSIGNED');
  });

  it('does not mutate state on failure', async () => {
    api.patch.mockResolvedValue({success: false, error: 'SERVER_ERROR'});
    await useOrdersStore.getState().updateOrderStatus('o1', 'COMPLETED');
    expect(useOrdersStore.getState().orders[0].status).toBe('ASSIGNED');
  });

  it('returns response object', async () => {
    const mockRes = {success: true, data: {}};
    api.patch.mockResolvedValue(mockRes);
    const res = await useOrdersStore.getState().updateOrderStatus('o1', 'STARTED');
    expect(res).toEqual(mockRes);
  });
});

// ── assignBiker ───────────────────────────────────────────────────────────────

describe('assignBiker', () => {
  beforeEach(() => {
    useOrdersStore.setState({orders: [...ORDERS]});
  });

  it('updates order status to ASSIGNED and sets bikerId', async () => {
    api.post.mockResolvedValue({success: true, data: {}});
    await useOrdersStore.getState().assignBiker('o1', 'biker-123');
    const order = useOrdersStore.getState().orders.find(o => o.id === 'o1');
    expect(order.status).toBe('ASSIGNED');
    expect(order.bikerId).toBe('biker-123');
  });

  it('does not mutate on failure', async () => {
    api.post.mockResolvedValue({success: false, error: 'CONFLICT'});
    await useOrdersStore.getState().assignBiker('o1', 'biker-123');
    expect(useOrdersStore.getState().orders[0].bikerId).toBeNull();
  });
});

// ── acceptOrder ───────────────────────────────────────────────────────────────

describe('acceptOrder', () => {
  beforeEach(() => {
    useOrdersStore.setState({orders: [...ORDERS]});
  });

  it('sets order status to ACCEPTED on success', async () => {
    api.post.mockResolvedValue({success: true, data: {}});
    await useOrdersStore.getState().acceptOrder('o1');
    const order = useOrdersStore.getState().orders.find(o => o.id === 'o1');
    expect(order.status).toBe('ACCEPTED');
  });

  it('calls correct endpoint', async () => {
    api.post.mockResolvedValue({success: true, data: {}});
    await useOrdersStore.getState().acceptOrder('o1');
    expect(api.post).toHaveBeenCalledWith('/partner/orders/o1/accept');
  });
});

// ── rejectOrder ───────────────────────────────────────────────────────────────

describe('rejectOrder', () => {
  beforeEach(() => {
    useOrdersStore.setState({orders: [...ORDERS]});
  });

  it('removes order from list on success', async () => {
    api.post.mockResolvedValue({success: true, data: {}});
    await useOrdersStore.getState().rejectOrder('o1', 'BUSY', 'Too far');
    const order = useOrdersStore.getState().orders.find(o => o.id === 'o1');
    expect(order).toBeUndefined();
  });

  it('sends reason and note in body', async () => {
    api.post.mockResolvedValue({success: true, data: {}});
    await useOrdersStore.getState().rejectOrder('o1', 'BUSY', 'note here');
    expect(api.post).toHaveBeenCalledWith(
      '/partner/orders/o1/reject',
      {reason: 'BUSY', note: 'note here'},
    );
  });

  it('does not remove order on failure', async () => {
    api.post.mockResolvedValue({success: false, error: 'ERR'});
    await useOrdersStore.getState().rejectOrder('o1', 'BUSY');
    expect(useOrdersStore.getState().orders).toHaveLength(2);
  });

  it('handles undefined note', async () => {
    api.post.mockResolvedValue({success: true, data: {}});
    await expect(
      useOrdersStore.getState().rejectOrder('o1', 'BUSY')
    ).resolves.not.toThrow();
  });
});

// ── localUpdateStatus ─────────────────────────────────────────────────────────

describe('localUpdateStatus', () => {
  beforeEach(() => {
    useOrdersStore.setState({orders: [...ORDERS], activeOrder: {...ORDERS[0]}});
  });

  it('updates order in list immediately (optimistic)', () => {
    useOrdersStore.getState().localUpdateStatus('o1', 'COMPLETED');
    expect(useOrdersStore.getState().orders[0].status).toBe('COMPLETED');
  });

  it('updates activeOrder when id matches', () => {
    useOrdersStore.getState().localUpdateStatus('o1', 'STARTED');
    expect(useOrdersStore.getState().activeOrder.status).toBe('STARTED');
  });

  it('does not affect other orders', () => {
    useOrdersStore.getState().localUpdateStatus('o1', 'COMPLETED');
    expect(useOrdersStore.getState().orders[1].status).toBe('ON_THE_WAY');
  });

  it('does not throw for unknown order id', () => {
    expect(() =>
      useOrdersStore.getState().localUpdateStatus('nonexistent', 'DONE')
    ).not.toThrow();
  });
});

// ── Helpers ───────────────────────────────────────────────────────────────────

describe('setActiveOrder / clearError', () => {
  it('setActiveOrder stores order', () => {
    useOrdersStore.getState().setActiveOrder(ORDERS[1]);
    expect(useOrdersStore.getState().activeOrder).toEqual(ORDERS[1]);
  });

  it('setActiveOrder with null clears activeOrder', () => {
    useOrdersStore.setState({activeOrder: ORDERS[0]});
    useOrdersStore.getState().setActiveOrder(null);
    expect(useOrdersStore.getState().activeOrder).toBeNull();
  });

  it('clearError sets error to null', () => {
    useOrdersStore.setState({error: 'SOME_ERROR'});
    useOrdersStore.getState().clearError();
    expect(useOrdersStore.getState().error).toBeNull();
  });
});
