import {create} from 'zustand';
import api from '../services/api';

const useOrdersStore = create((set, get) => ({
  // ── State ──────────────────────────────────────────────────────────────
  orders:       [],
  activeOrder:  null,   // currently open order detail
  loading:      false,
  refreshing:   false,
  error:        null,

  // ── Fetch ──────────────────────────────────────────────────────────────
  fetchOrders: async (filters = {}) => {
    set({loading: true, error: null});
    const params = new URLSearchParams(filters).toString();
    const res = await api.get(`/orders${params ? `?${params}` : ''}`);
    if (res.success) {
      set({orders: res.data, loading: false});
    } else {
      set({error: res.error, loading: false});
    }
  },

  refreshOrders: async (filters = {}) => {
    set({refreshing: true, error: null});
    const params = new URLSearchParams(filters).toString();
    const res = await api.get(`/orders${params ? `?${params}` : ''}`);
    if (res.success) {
      set({orders: res.data, refreshing: false});
    } else {
      set({error: res.error, refreshing: false});
    }
  },

  fetchOrderById: async (id) => {
    set({loading: true, error: null});
    const res = await api.get(`/orders/${id}`);
    if (res.success) {
      set({activeOrder: res.data, loading: false});
    } else {
      set({error: res.error, loading: false});
    }
    return res;
  },

  // ── Mutations ──────────────────────────────────────────────────────────
  updateOrderStatus: async (id, status) => {
    const res = await api.patch(`/orders/${id}/status`, {status});
    if (res.success) {
      set(state => ({
        orders: state.orders.map(o => o.id === id ? {...o, status} : o),
        activeOrder: state.activeOrder?.id === id
          ? {...state.activeOrder, status}
          : state.activeOrder,
      }));
    }
    return res;
  },

  assignBiker: async (orderId, bikerId) => {
    const res = await api.post(`/orders/${orderId}/assign`, {bikerId});
    if (res.success) {
      set(state => ({
        orders: state.orders.map(o =>
          o.id === orderId ? {...o, status: 'ASSIGNED', bikerId} : o
        ),
      }));
    }
    return res;
  },

  acceptOrder: async (orderId) => {
    const res = await api.post(`/partner/orders/${orderId}/accept`);
    if (res.success) {
      set(state => ({
        orders: state.orders.map(o =>
          o.id === orderId ? {...o, status: 'ACCEPTED'} : o
        ),
      }));
    }
    return res;
  },

  rejectOrder: async (orderId, reason, note) => {
    const res = await api.post(`/partner/orders/${orderId}/reject`, {reason, note});
    if (res.success) {
      set(state => ({
        orders: state.orders.filter(o => o.id !== orderId),
      }));
    }
    return res;
  },

  // ── Local helpers ──────────────────────────────────────────────────────
  setActiveOrder: (order) => set({activeOrder: order}),
  clearError:     ()      => set({error: null}),

  // Optimistic local status update (used by biker swipe)
  localUpdateStatus: (id, status) => {
    set(state => ({
      orders: state.orders.map(o => o.id === id ? {...o, status} : o),
      activeOrder: state.activeOrder?.id === id
        ? {...state.activeOrder, status}
        : state.activeOrder,
    }));
  },
}));

export default useOrdersStore;
