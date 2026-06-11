/**
 * Tests for src/store/appStore.js
 * Covers: loading keys, toasts, incomingOrder, navigation, unread count
 */

import useAppStore from '../../src/store/appStore';

beforeEach(() => {
  jest.useFakeTimers();
  useAppStore.setState({
    loadingKeys: {},
    toasts: [],
    incomingOrder: null,
    autoAccept: false,
    unreadCount: 0,
    pendingNav: null,
  });
});

afterEach(() => {
  jest.useRealTimers();
});

// ── Loading Keys ──────────────────────────────────────────────────────────────

describe('loading keys', () => {
  it('startLoading adds key, isLoading returns true', () => {
    useAppStore.getState().startLoading('orders');
    expect(useAppStore.getState().isLoading('orders')).toBe(true);
  });

  it('stopLoading removes key, isLoading returns false', () => {
    useAppStore.getState().startLoading('profile');
    useAppStore.getState().stopLoading('profile');
    expect(useAppStore.getState().isLoading('profile')).toBe(false);
  });

  it('supports multiple concurrent loading keys independently', () => {
    useAppStore.getState().startLoading('a');
    useAppStore.getState().startLoading('b');
    useAppStore.getState().stopLoading('a');
    expect(useAppStore.getState().isLoading('a')).toBe(false);
    expect(useAppStore.getState().isLoading('b')).toBe(true);
  });

  it('isLoading returns false for unknown key', () => {
    expect(useAppStore.getState().isLoading('nonexistent')).toBe(false);
  });

  it('stopLoading on non-existent key does not throw', () => {
    expect(() => useAppStore.getState().stopLoading('ghost')).not.toThrow();
  });
});

// ── Toast System ──────────────────────────────────────────────────────────────

describe('showToast', () => {
  it('adds toast to queue with correct fields', () => {
    useAppStore.getState().showToast('Something went wrong', 'error');
    const {toasts} = useAppStore.getState();
    expect(toasts).toHaveLength(1);
    expect(toasts[0].message).toBe('Something went wrong');
    expect(toasts[0].type).toBe('error');
    expect(typeof toasts[0].id).toBe('number');
  });

  it('defaults type to "error" when not specified', () => {
    useAppStore.getState().showToast('msg');
    expect(useAppStore.getState().toasts[0].type).toBe('error');
  });

  it('auto-dismisses toast after 3500ms', () => {
    useAppStore.getState().showToast('Auto dismiss');
    expect(useAppStore.getState().toasts).toHaveLength(1);
    jest.advanceTimersByTime(3500);
    expect(useAppStore.getState().toasts).toHaveLength(0);
  });

  it('does not dismiss toast before 3500ms', () => {
    useAppStore.getState().showToast('Still here');
    jest.advanceTimersByTime(3000);
    expect(useAppStore.getState().toasts).toHaveLength(1);
  });

  it('supports multiple toasts simultaneously', () => {
    useAppStore.getState().showToast('Toast 1');
    useAppStore.getState().showToast('Toast 2');
    useAppStore.getState().showToast('Toast 3');
    expect(useAppStore.getState().toasts).toHaveLength(3);
  });

  it('each toast dismisses independently', () => {
    useAppStore.getState().showToast('First');
    jest.advanceTimersByTime(200); // move time forward so 'Second' gets a later id/timeout
    useAppStore.getState().showToast('Second');
    jest.advanceTimersByTime(3400); // now 3600ms from start: First gone (3500 from its creation), Second still alive (only 3400ms old)
    expect(useAppStore.getState().toasts).toHaveLength(1);
    expect(useAppStore.getState().toasts[0].message).toBe('Second');
  });

  it('handles empty string message', () => {
    useAppStore.getState().showToast('');
    expect(useAppStore.getState().toasts[0].message).toBe('');
  });
});

describe('dismissToast', () => {
  it('removes toast by id immediately', () => {
    useAppStore.getState().showToast('Manual dismiss');
    const id = useAppStore.getState().toasts[0].id;
    useAppStore.getState().dismissToast(id);
    expect(useAppStore.getState().toasts).toHaveLength(0);
  });

  it('does not affect other toasts when dismissing one', () => {
    useAppStore.getState().showToast('Keep');
    jest.advanceTimersByTime(1); // ensure distinct Date.now() values
    useAppStore.getState().showToast('Remove');
    const {toasts} = useAppStore.getState();
    const removeId = toasts.find(t => t.message === 'Remove').id;
    useAppStore.getState().dismissToast(removeId);
    expect(useAppStore.getState().toasts).toHaveLength(1);
    expect(useAppStore.getState().toasts[0].message).toBe('Keep');
  });

  it('does not throw when dismissing non-existent id', () => {
    expect(() => useAppStore.getState().dismissToast(99999)).not.toThrow();
  });
});

// ── Incoming Order ────────────────────────────────────────────────────────────

describe('incomingOrder', () => {
  const order = {_id: 'o1', service: 'Wash', customerName: 'Fahad'};

  it('setIncomingOrder stores order', () => {
    useAppStore.getState().setIncomingOrder(order);
    expect(useAppStore.getState().incomingOrder).toEqual(order);
  });

  it('clearIncomingOrder sets to null', () => {
    useAppStore.getState().setIncomingOrder(order);
    useAppStore.getState().clearIncomingOrder();
    expect(useAppStore.getState().incomingOrder).toBeNull();
  });

  it('setIncomingOrder with null clears order', () => {
    useAppStore.getState().setIncomingOrder(order);
    useAppStore.getState().setIncomingOrder(null);
    expect(useAppStore.getState().incomingOrder).toBeNull();
  });

  it('setIncomingOrder with empty object stores it', () => {
    useAppStore.getState().setIncomingOrder({});
    expect(useAppStore.getState().incomingOrder).toEqual({});
  });
});

// ── Auto Accept ───────────────────────────────────────────────────────────────

describe('autoAccept', () => {
  it('defaults to false', () => {
    expect(useAppStore.getState().autoAccept).toBe(false);
  });

  it('setAutoAccept toggles to true', () => {
    useAppStore.getState().setAutoAccept(true);
    expect(useAppStore.getState().autoAccept).toBe(true);
  });

  it('setAutoAccept toggles back to false', () => {
    useAppStore.getState().setAutoAccept(true);
    useAppStore.getState().setAutoAccept(false);
    expect(useAppStore.getState().autoAccept).toBe(false);
  });
});

// ── Unread Count ──────────────────────────────────────────────────────────────

describe('unreadCount', () => {
  it('setUnreadCount sets value', () => {
    useAppStore.getState().setUnreadCount(5);
    expect(useAppStore.getState().unreadCount).toBe(5);
  });

  it('decrementUnread decreases count by 1', () => {
    useAppStore.getState().setUnreadCount(3);
    useAppStore.getState().decrementUnread();
    expect(useAppStore.getState().unreadCount).toBe(2);
  });

  it('decrementUnread does not go below 0', () => {
    useAppStore.getState().setUnreadCount(0);
    useAppStore.getState().decrementUnread();
    expect(useAppStore.getState().unreadCount).toBe(0);
  });

  it('setUnreadCount with 0', () => {
    useAppStore.getState().setUnreadCount(10);
    useAppStore.getState().setUnreadCount(0);
    expect(useAppStore.getState().unreadCount).toBe(0);
  });
});

// ── Navigation ────────────────────────────────────────────────────────────────

describe('navigation', () => {
  it('requestNav sets pendingNav with tab and orderId', () => {
    useAppStore.getState().requestNav('orders', 'o123');
    expect(useAppStore.getState().pendingNav).toEqual({tab: 'orders', orderId: 'o123', screen: null});
  });

  it('requestNav sets orderId to null when not provided', () => {
    useAppStore.getState().requestNav('home');
    expect(useAppStore.getState().pendingNav).toEqual({tab: 'home', orderId: null, screen: null});
  });

  it('clearNav sets pendingNav to null', () => {
    useAppStore.getState().requestNav('orders', 'o1');
    useAppStore.getState().clearNav();
    expect(useAppStore.getState().pendingNav).toBeNull();
  });
});
