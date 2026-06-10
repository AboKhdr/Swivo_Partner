import {create} from 'zustand';

const useAppStore = create((set, get) => ({
  // ── Global loading overlay ─────────────────────────────────────────────
  loadingKeys: {},   // { [key]: true } — multiple concurrent loaders
  isLoading: (key) => !!get().loadingKeys[key],
  startLoading: (key) => set(s => ({loadingKeys: {...s.loadingKeys, [key]: true}})),
  stopLoading:  (key) => set(s => {
    const next = {...s.loadingKeys};
    delete next[key];
    return {loadingKeys: next};
  }),

  // ── Toast / error banners ──────────────────────────────────────────────
  toasts: [],
  showToast: (message, type = 'error', duration = 3500) => {
    const id = Date.now();
    set(s => ({toasts: [...s.toasts, {id, message, type}]}));
    setTimeout(() => {
      set(s => ({toasts: s.toasts.filter(t => t.id !== id)}));
    }, duration);
  },
  // Order toast — stays until user dismisses (no auto-hide), carries order data
  showOrderToast: (order) => {
    const id = Date.now();
    set(s => ({toasts: [...s.toasts, {id, type: 'order', order}]}));
  },
  dismissToast: (id) => set(s => ({toasts: s.toasts.filter(t => t.id !== id)})),

  // ── Incoming order (partner) ─────────────────────────────────────────
  incomingOrder: null,
  setIncomingOrder: (order) => set({incomingOrder: order}),
  clearIncomingOrder: () => set({incomingOrder: null}),

  // ── Auto-accept toggle (partner, persisted per session) ───────────────
  autoAccept: false,
  setAutoAccept: (val) => set({autoAccept: val}),

  // ── Unread notifications badge ─────────────────────────────────────────
  unreadCount: 0,
  setUnreadCount: (n) => set({unreadCount: n}),
  decrementUnread: () => set(s => ({unreadCount: Math.max(0, s.unreadCount - 1)})),

  // ── Notification-tap navigation ───────────────────────────────────────
  // navigators watch this and switch tabs when it changes
  pendingNav: null,   // { tab: string, orderId?: string, screen?: string } | null
  requestNav: (tab, orderId, screen) => set({pendingNav: {tab, orderId: orderId ?? null, screen: screen ?? null}}),
  clearNav:   () => set({pendingNav: null}),

  // ── HomeScreen → OrdersNavigator cross-tab navigation ─────────────────
  pendingOrderNav: null,  // { type: 'detail' | 'map', order: object } | null
  setPendingOrderNav: (nav) => set({pendingOrderNav: nav}),
  clearPendingOrderNav: () => set({pendingOrderNav: null}),

  // ── Order refresh signal — tells OrderDetailsScreen to reload ──────────
  // Incremented when a foreground notification requires a refresh (e.g. photo_skip_decision)
  orderRefreshSignal: 0,
  triggerOrderRefresh: () => set(s => ({orderRefreshSignal: s.orderRefreshSignal + 1})),
}));

export default useAppStore;
