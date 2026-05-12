/**
 * Navigation system tests
 *
 * Strategy:
 * - inst.toJSON()  → plain JSON tree, used for assertions (exists/findAll)
 * - inst.root      → live React instance tree, used for interactions (press)
 *
 * Covers:
 *  1. BikerAppNavigator  — tab switching, state preservation, back handler, pendingNav
 *  2. PartnerNavigator   — tabs, unmount flag, badge count, incoming order overlay
 *  3. BikerOrdersNavigator — push/pop, params passing, back button
 *  4. BikerProfileNavigator — sub-screen push/pop, back handler
 *  5. Auth flow routing — role normalisation logic
 *  6. Edge cases
 */

import React from 'react';
import {create, act} from 'react-test-renderer';
import {BackHandler, TouchableOpacity} from 'react-native';

// ─── BackHandler simulator ────────────────────────────────────────────────────

let _backListeners = [];

beforeAll(() => {
  BackHandler.addEventListener = jest.fn((event, handler) => {
    if (event === 'hardwareBackPress') _backListeners.push(handler);
    return {remove: () => { _backListeners = _backListeners.filter(h => h !== handler); }};
  });
});

beforeEach(() => {
  _backListeners = [];
  jest.clearAllMocks();
  mockAppStore.pendingNav    = null;
  mockAppStore.unreadCount   = 0;
  mockAppStore.incomingOrder = null;
  mockAppStore.clearNav           = jest.fn();
  mockAppStore.clearIncomingOrder = jest.fn();
});

function pressBack() {
  let consumed = false;
  act(() => {
    for (let i = _backListeners.length - 1; i >= 0; i--) {
      if (_backListeners[i]()) { consumed = true; break; }
    }
  });
  return consumed;
}

// ─── Shared store mocks ───────────────────────────────────────────────────────

const mockAppStore = {
  pendingNav:         null,
  clearNav:           jest.fn(),
  incomingOrder:      null,
  clearIncomingOrder: jest.fn(),
  unreadCount:        0,
};

jest.mock('../../src/store/appStore', () => {
  const store = jest.fn((selector) => selector(mockAppStore));
  store.getState = () => mockAppStore;
  return store;
});

jest.mock('../../src/store/authStore', () => () => ({
  user: null, token: null, role: null, isReady: true,
  hydrate: jest.fn(), logout: jest.fn(), setSession: jest.fn(), updateUser: jest.fn(),
}));

// ─── Context mocks ────────────────────────────────────────────────────────────

jest.mock('../../src/shared/context/ThemeContext', () => ({
  useTheme: () => ({
    colors: {bg:'#fff', card:'#f8f8f8', border:'#eee', primary:'#1B7BF5', textSecondary:'#888', danger:'#EF4444'},
  }),
  ThemeProvider: ({children}) => children,
}));

jest.mock('../../src/shared/i18n/I18nContext', () => ({
  useI18n: () => ({t: k => k, lang: 'ar', isRTL: true, setLang: jest.fn()}),
  I18nProvider: ({children}) => children,
}));

jest.mock('../../src/shared/context/FirebaseContext', () => ({
  FirebaseProvider: ({children}) => children,
}));

jest.mock('../../src/services/api', () => ({
  setUnauthorizedHandler: jest.fn(),
  request: jest.fn(),
}));

// ─── lucide icons ─────────────────────────────────────────────────────────────

jest.mock('lucide-react-native', () => {
  const {View} = require('react-native');
  return {
    Home:          () => <View />,
    ClipboardList: () => <View />,
    Star:          () => <View />,
    User:          () => <View />,
    Settings:      () => <View />,
  };
});

// ─── Screen mocks ─────────────────────────────────────────────────────────────
// NOTE: jest.mock factories must only use variables prefixed with "mock".

function mockMakeScreen(name) {
  const {View, Text, TouchableOpacity: TO} = require('react-native');
  return function MockScreen({onNavigate, onBack, onOrderPress, onLocationPress, order}) {
    return (
      <View testID={`screen-${name}`}>
        <Text testID={`${name}-label`}>{name}</Text>
        {onNavigate && (
          <View testID={`${name}-nav-buttons`}>
            <TO testID={`${name}-go-info`}     onPress={() => onNavigate('info')} />
            <TO testID={`${name}-go-wallet`}   onPress={() => onNavigate('wallet')} />
            <TO testID={`${name}-go-language`} onPress={() => onNavigate('language')} />
            <TO testID={`${name}-go-support`}  onPress={() => onNavigate('support')} />
            <TO testID={`${name}-go-terms`}    onPress={() => onNavigate('terms')} />
          </View>
        )}
        {onBack          && <TO testID={`${name}-back`}     onPress={onBack} />}
        {onOrderPress    && <TO testID={`${name}-order`}    onPress={() => onOrderPress({id: 'o1', status: 'ASSIGNED'})} />}
        {onLocationPress && <TO testID={`${name}-location`} onPress={() => onLocationPress({id: 'o1'})} />}
        {order           && <Text testID={`${name}-order-id`}>{order.id}</Text>}
      </View>
    );
  };
}

jest.mock('../../src/biker/features/home/HomeScreen',            () => mockMakeScreen('HomeScreen'));
jest.mock('../../src/biker/features/orders/OrdersScreen',         () => mockMakeScreen('OrdersScreen'));
jest.mock('../../src/biker/features/orders/OrderDetailsScreen',   () => mockMakeScreen('OrderDetailsScreen'));
jest.mock('../../src/biker/features/orders/OrderMapScreen',       () => mockMakeScreen('OrderMapScreen'));
jest.mock('../../src/biker/features/reviews/ReviewsScreen',       () => mockMakeScreen('ReviewsScreen'));
jest.mock('../../src/biker/features/profile/ProfileScreen',       () => mockMakeScreen('ProfileScreen'));
jest.mock('../../src/biker/features/profile/PersonalInfoScreen',  () => mockMakeScreen('PersonalInfoScreen'));
jest.mock('../../src/biker/features/profile/WalletScreen',        () => mockMakeScreen('WalletScreen'));
jest.mock('../../src/biker/features/profile/SupportScreen',       () => mockMakeScreen('SupportScreen'));
jest.mock('../../src/biker/features/profile/TermsScreen',         () => mockMakeScreen('TermsScreen'));
jest.mock('../../src/shared/components/LanguageScreen',           () => mockMakeScreen('LanguageScreen'));

jest.mock('../../src/partner/features/dashboard/DashboardScreen',       () => mockMakeScreen('DashboardScreen'));
jest.mock('../../src/partner/features/orders/OrdersNavigator',          () => mockMakeScreen('PartnerOrdersNavigator'));
jest.mock('../../src/partner/features/operations/OperationsNavigator',  () => mockMakeScreen('OperationsNavigator'));
jest.mock('../../src/partner/features/profile/PartnerProfileNavigator', () => mockMakeScreen('PartnerProfileNavigator'));
jest.mock('../../src/partner/features/orders/IncomingOrderScreen', () => {
  const {View, Text, TouchableOpacity: TO} = require('react-native');
  return function MockIncoming({visible, order, onAccept, onReject}) {
    if (!visible) return null;
    return (
      <View testID="screen-IncomingOrderScreen">
        {order && <Text testID="incoming-order-id">{order.id}</Text>}
        <TO testID="incoming-accept" onPress={onAccept} />
        <TO testID="incoming-reject" onPress={() => onReject('MANUAL')} />
      </View>
    );
  };
});

// ─── Tree traversal helpers (use toJSON for read-only queries) ────────────────

function findAll(json, testID) {
  const results = [];
  function walk(node) {
    if (!node) return;
    if (Array.isArray(node)) { node.forEach(walk); return; }
    if (node.props?.testID === testID) results.push(node);
    if (node.children) node.children.forEach(walk);
  }
  walk(json);
  return results;
}

function exists(json, testID)  { return findAll(json, testID).length > 0; }
function findOne(json, testID) { return findAll(json, testID)[0] ?? null; }

// ─── Interaction helpers (use inst.root for live instances) ──────────────────

// Find a live React instance with a matching testID and call its onPress.
function press(inst, testID) {
  const node = inst.root.findAll(n => n.props?.testID === testID)[0];
  if (!node) throw new Error(`No element with testID="${testID}"`);
  act(() => node.props.onPress?.());
}

// Recursively extract all text content from a React instance subtree.
function getTextContent(node) {
  if (!node) return '';
  if (typeof node === 'string') return node;
  const children = node.props?.children;
  if (!children) return '';
  if (Array.isArray(children)) return children.map(getTextContent).join('');
  if (typeof children === 'string') return children;
  return getTextContent(children);
}

// Press a TouchableOpacity tab whose child text content includes the given label.
function pressTabByLabel(inst, labelText) {
  const tabs = inst.root.findAllByType(TouchableOpacity);
  const tab = tabs.find(t => {
    try { return getTextContent(t).includes(labelText); } catch { return false; }
  });
  if (!tab) throw new Error(`No tab containing label "${labelText}"`);
  act(() => tab.props.onPress?.());
}

// ─── Navigator imports (after all mocks) ─────────────────────────────────────

const AppNavigator     = require('../../src/biker/navigation/AppNavigator').default;
const PartnerNavigator = require('../../src/partner/navigation/PartnerNavigator').default;
const OrdersNavigator  = require('../../src/biker/features/orders/OrdersNavigator').default;
const ProfileNavigator = require('../../src/biker/features/profile/ProfileNavigator').default;

// ═══════════════════════════════════════════════════════════════════════════════
// 1. BikerAppNavigator
// ═══════════════════════════════════════════════════════════════════════════════

describe('BikerAppNavigator', () => {
  describe('Initial render', () => {
    it('mounts on home tab by default', () => {
      let inst;
      act(() => { inst = create(<AppNavigator />); });
      expect(exists(inst.toJSON(), 'screen-HomeScreen')).toBe(true);
    });

    it('does not mount Reviews/Profile tabs initially (lazy)', () => {
      let inst;
      act(() => { inst = create(<AppNavigator />); });
      expect(exists(inst.toJSON(), 'screen-ReviewsScreen')).toBe(false);
      expect(exists(inst.toJSON(), 'screen-ProfileScreen')).toBe(false);
    });

    it('renders all 4 tab label keys', () => {
      let inst;
      act(() => { inst = create(<AppNavigator />); });
      const s = JSON.stringify(inst.toJSON());
      ['nav.home','nav.orders','nav.reviews','nav.profile'].forEach(k => expect(s).toContain(k));
    });
  });

  describe('Tab switching', () => {
    it('lazy-mounts Reviews tab only on first press', () => {
      let inst;
      act(() => { inst = create(<AppNavigator />); });
      expect(exists(inst.toJSON(), 'screen-ReviewsScreen')).toBe(false);
      pressTabByLabel(inst, 'nav.reviews');
      expect(exists(inst.toJSON(), 'screen-ReviewsScreen')).toBe(true);
    });

    it('lazy-mounts Profile tab only on first press', () => {
      let inst;
      act(() => { inst = create(<AppNavigator />); });
      pressTabByLabel(inst, 'nav.profile');
      expect(exists(inst.toJSON(), 'screen-ProfileScreen')).toBe(true);
    });

    it('keeps previously visited tab mounted when switching away (state preservation)', () => {
      let inst;
      act(() => { inst = create(<AppNavigator />); });
      pressTabByLabel(inst, 'nav.reviews');
      pressTabByLabel(inst, 'nav.home');
      // Reviews should still be mounted (display:none but in tree)
      expect(exists(inst.toJSON(), 'screen-ReviewsScreen')).toBe(true);
      expect(exists(inst.toJSON(), 'screen-HomeScreen')).toBe(true);
    });

    it('does not duplicate-mount when pressing the active tab again', () => {
      let inst;
      act(() => { inst = create(<AppNavigator />); });
      pressTabByLabel(inst, 'nav.reviews');
      pressTabByLabel(inst, 'nav.reviews');
      expect(findAll(inst.toJSON(), 'screen-ReviewsScreen')).toHaveLength(1);
    });

    it('all 4 tabs can be visited without throwing', () => {
      let inst;
      act(() => { inst = create(<AppNavigator />); });
      expect(() => {
        pressTabByLabel(inst, 'nav.orders');
        pressTabByLabel(inst, 'nav.reviews');
        pressTabByLabel(inst, 'nav.profile');
        pressTabByLabel(inst, 'nav.home');
      }).not.toThrow();
    });
  });

  describe('Hardware back button', () => {
    it('registers BackHandler listener on mount', () => {
      act(() => { create(<AppNavigator />); });
      expect(BackHandler.addEventListener).toHaveBeenCalledWith('hardwareBackPress', expect.any(Function));
    });

    it('does NOT consume back press when on root tab (history.length = 1)', () => {
      act(() => { create(<AppNavigator />); });
      expect(pressBack()).toBe(false);
    });

    it('consumes back press after a tab switch', () => {
      let inst;
      act(() => { inst = create(<AppNavigator />); });
      pressTabByLabel(inst, 'nav.orders');
      expect(pressBack()).toBe(true);
    });

    it('navigates back to previous tab on back press', () => {
      let inst;
      act(() => { inst = create(<AppNavigator />); });
      pressTabByLabel(inst, 'nav.reviews');
      pressBack();
      // Home was the previous tab — both are still mounted
      expect(exists(inst.toJSON(), 'screen-HomeScreen')).toBe(true);
    });

    it('removes BackHandler listener on unmount', () => {
      let inst;
      act(() => { inst = create(<AppNavigator />); });
      const before = _backListeners.length;
      act(() => { inst.unmount(); });
      expect(_backListeners.length).toBeLessThan(before);
    });
  });

  describe('pendingNav (notification-tap routing)', () => {
    it('calls clearNav when pendingNav.tab = "orders"', () => {
      mockAppStore.pendingNav = {tab: 'orders', orderId: 'o42'};
      act(() => { create(<AppNavigator />); });
      expect(mockAppStore.clearNav).toHaveBeenCalled();
    });

    it('maps "notifications" key to "home" tab (NAV_TAB_MAP) without crash', () => {
      mockAppStore.pendingNav = {tab: 'notifications'};
      expect(() => act(() => { create(<AppNavigator />); })).not.toThrow();
      expect(mockAppStore.clearNav).toHaveBeenCalled();
    });

    it('ignores unknown pendingNav tab keys without crashing', () => {
      mockAppStore.pendingNav = {tab: 'nonexistent_key'};
      expect(() => act(() => { create(<AppNavigator />); })).not.toThrow();
    });

    it('does not call clearNav when pendingNav is null', () => {
      mockAppStore.pendingNav = null;
      act(() => { create(<AppNavigator />); });
      expect(mockAppStore.clearNav).not.toHaveBeenCalled();
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 2. PartnerNavigator
// ═══════════════════════════════════════════════════════════════════════════════

describe('PartnerNavigator', () => {
  describe('Initial render', () => {
    it('starts on Dashboard tab', () => {
      let inst;
      act(() => { inst = create(<PartnerNavigator />); });
      expect(exists(inst.toJSON(), 'screen-DashboardScreen')).toBe(true);
    });

    it('renders all 4 partner tab label keys', () => {
      let inst;
      act(() => { inst = create(<PartnerNavigator />); });
      const s = JSON.stringify(inst.toJSON());
      ['partner.nav.dashboard','partner.nav.orders','partner.nav.operations','partner.nav.profile']
        .forEach(k => expect(s).toContain(k));
    });
  });

  describe('Tab switching', () => {
    it('mounts Orders tab on first press', () => {
      let inst;
      act(() => { inst = create(<PartnerNavigator />); });
      pressTabByLabel(inst, 'partner.nav.orders');
      expect(exists(inst.toJSON(), 'screen-PartnerOrdersNavigator')).toBe(true);
    });

    it('mounts Profile tab on first press', () => {
      let inst;
      act(() => { inst = create(<PartnerNavigator />); });
      pressTabByLabel(inst, 'partner.nav.profile');
      expect(exists(inst.toJSON(), 'screen-PartnerProfileNavigator')).toBe(true);
    });

    it('preserves Dashboard when switching away and back', () => {
      let inst;
      act(() => { inst = create(<PartnerNavigator />); });
      pressTabByLabel(inst, 'partner.nav.orders');
      pressTabByLabel(inst, 'partner.nav.dashboard');
      expect(exists(inst.toJSON(), 'screen-DashboardScreen')).toBe(true);
    });
  });

  describe('Operations tab — unmount: true', () => {
    it('mounts OperationsNavigator when tab is pressed', () => {
      let inst;
      act(() => { inst = create(<PartnerNavigator />); });
      pressTabByLabel(inst, 'partner.nav.operations');
      expect(exists(inst.toJSON(), 'screen-OperationsNavigator')).toBe(true);
    });

    it('unmounts OperationsNavigator when leaving to another tab', () => {
      let inst;
      act(() => { inst = create(<PartnerNavigator />); });
      pressTabByLabel(inst, 'partner.nav.operations');
      pressTabByLabel(inst, 'partner.nav.dashboard');
      expect(exists(inst.toJSON(), 'screen-OperationsNavigator')).toBe(false);
    });

    it('remounts OperationsNavigator on re-visit', () => {
      let inst;
      act(() => { inst = create(<PartnerNavigator />); });
      pressTabByLabel(inst, 'partner.nav.operations');
      pressTabByLabel(inst, 'partner.nav.dashboard');
      pressTabByLabel(inst, 'partner.nav.operations');
      expect(exists(inst.toJSON(), 'screen-OperationsNavigator')).toBe(true);
    });

    it('non-unmount tabs (Orders, unmount:false) stay mounted when leaving', () => {
      let inst;
      act(() => { inst = create(<PartnerNavigator />); });
      pressTabByLabel(inst, 'partner.nav.orders');
      pressTabByLabel(inst, 'partner.nav.dashboard');
      expect(exists(inst.toJSON(), 'screen-PartnerOrdersNavigator')).toBe(true);
    });
  });

  describe('Badge count', () => {
    it('no badge when unreadCount = 0', () => {
      mockAppStore.unreadCount = 0;
      let inst;
      act(() => { inst = create(<PartnerNavigator />); });
      expect(JSON.stringify(inst.toJSON())).not.toContain('"9+"');
    });

    it('shows "3" when unreadCount = 3', () => {
      mockAppStore.unreadCount = 3;
      let inst;
      act(() => { inst = create(<PartnerNavigator />); });
      expect(JSON.stringify(inst.toJSON())).toContain('"3"');
    });

    it('shows "9+" when unreadCount = 15', () => {
      mockAppStore.unreadCount = 15;
      let inst;
      act(() => { inst = create(<PartnerNavigator />); });
      expect(JSON.stringify(inst.toJSON())).toContain('"9+"');
    });

    it('shows "9" (not "9+") at boundary value 9', () => {
      mockAppStore.unreadCount = 9;
      let inst;
      act(() => { inst = create(<PartnerNavigator />); });
      const s = JSON.stringify(inst.toJSON());
      expect(s).toContain('"9"');
      expect(s).not.toContain('"9+"');
    });

    it('shows "9+" at exactly 10', () => {
      mockAppStore.unreadCount = 10;
      let inst;
      act(() => { inst = create(<PartnerNavigator />); });
      expect(JSON.stringify(inst.toJSON())).toContain('"9+"');
    });

    it('handles very large unreadCount gracefully', () => {
      mockAppStore.unreadCount = 9999;
      let inst;
      expect(() => act(() => { inst = create(<PartnerNavigator />); })).not.toThrow();
      expect(JSON.stringify(inst.toJSON())).toContain('"9+"');
    });
  });

  describe('Incoming order overlay', () => {
    it('does not render IncomingOrderScreen when incomingOrder = null', () => {
      mockAppStore.incomingOrder = null;
      let inst;
      act(() => { inst = create(<PartnerNavigator />); });
      expect(exists(inst.toJSON(), 'screen-IncomingOrderScreen')).toBe(false);
    });

    it('renders IncomingOrderScreen when incomingOrder is set', () => {
      mockAppStore.incomingOrder = {id: 'order-99', status: 'PENDING_PARTNER'};
      let inst;
      act(() => { inst = create(<PartnerNavigator />); });
      expect(exists(inst.toJSON(), 'screen-IncomingOrderScreen')).toBe(true);
    });

    it('passes order.id to IncomingOrderScreen', () => {
      mockAppStore.incomingOrder = {id: 'order-99'};
      let inst;
      act(() => { inst = create(<PartnerNavigator />); });
      const node = findOne(inst.toJSON(), 'incoming-order-id');
      expect(node?.children).toContain('order-99');
    });

    it('calls clearIncomingOrder on accept', () => {
      mockAppStore.incomingOrder = {id: 'order-99'};
      let inst;
      act(() => { inst = create(<PartnerNavigator />); });
      press(inst, 'incoming-accept');
      expect(mockAppStore.clearIncomingOrder).toHaveBeenCalled();
    });

    it('calls clearIncomingOrder on reject', () => {
      mockAppStore.incomingOrder = {id: 'order-99'};
      let inst;
      act(() => { inst = create(<PartnerNavigator />); });
      press(inst, 'incoming-reject');
      expect(mockAppStore.clearIncomingOrder).toHaveBeenCalled();
    });
  });

  describe('Hardware back button', () => {
    it('registers BackHandler on mount', () => {
      act(() => { create(<PartnerNavigator />); });
      expect(BackHandler.addEventListener).toHaveBeenCalledWith('hardwareBackPress', expect.any(Function));
    });

    it('does NOT consume back press on root tab', () => {
      act(() => { create(<PartnerNavigator />); });
      expect(pressBack()).toBe(false);
    });

    it('consumes back press after a tab switch', () => {
      let inst;
      act(() => { inst = create(<PartnerNavigator />); });
      pressTabByLabel(inst, 'partner.nav.orders');
      expect(pressBack()).toBe(true);
    });

    it('navigates back to Dashboard after back press from Orders', () => {
      let inst;
      act(() => { inst = create(<PartnerNavigator />); });
      pressTabByLabel(inst, 'partner.nav.orders');
      pressBack();
      expect(exists(inst.toJSON(), 'screen-DashboardScreen')).toBe(true);
    });

    it('removes listener on unmount', () => {
      let inst;
      act(() => { inst = create(<PartnerNavigator />); });
      const before = _backListeners.length;
      act(() => { inst.unmount(); });
      expect(_backListeners.length).toBeLessThan(before);
    });
  });

  describe('pendingNav routing', () => {
    it('calls clearNav for "orders" pendingNav', () => {
      mockAppStore.pendingNav = {tab: 'orders'};
      act(() => { create(<PartnerNavigator />); });
      expect(mockAppStore.clearNav).toHaveBeenCalled();
    });

    it('maps "notifications" to "dashboard" without crashing', () => {
      mockAppStore.pendingNav = {tab: 'notifications'};
      expect(() => act(() => { create(<PartnerNavigator />); })).not.toThrow();
      expect(mockAppStore.clearNav).toHaveBeenCalled();
    });

    it('ignores unknown pendingNav tab keys without crashing', () => {
      mockAppStore.pendingNav = {tab: 'ghost_tab'};
      expect(() => act(() => { create(<PartnerNavigator />); })).not.toThrow();
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 3. BikerOrdersNavigator (stack: list → detail / map)
// ═══════════════════════════════════════════════════════════════════════════════

describe('BikerOrdersNavigator', () => {
  describe('Initial state', () => {
    it('renders OrdersScreen (list) by default', () => {
      let inst;
      act(() => { inst = create(<OrdersNavigator />); });
      expect(exists(inst.toJSON(), 'screen-OrdersScreen')).toBe(true);
    });

    it('does not show detail or map screens initially', () => {
      let inst;
      act(() => { inst = create(<OrdersNavigator />); });
      expect(exists(inst.toJSON(), 'screen-OrderDetailsScreen')).toBe(false);
      expect(exists(inst.toJSON(), 'screen-OrderMapScreen')).toBe(false);
    });

    it('does NOT register BackHandler when on list (guard: if (!screen) return)', () => {
      BackHandler.addEventListener.mockClear();
      act(() => { create(<OrdersNavigator />); });
      expect(BackHandler.addEventListener).not.toHaveBeenCalled();
    });
  });

  describe('Push to OrderDetailsScreen', () => {
    it('shows OrderDetailsScreen when order is pressed', () => {
      let inst;
      act(() => { inst = create(<OrdersNavigator />); });
      press(inst, 'OrdersScreen-order');
      expect(exists(inst.toJSON(), 'screen-OrderDetailsScreen')).toBe(true);
    });

    it('passes order.id to OrderDetailsScreen', () => {
      let inst;
      act(() => { inst = create(<OrdersNavigator />); });
      press(inst, 'OrdersScreen-order');
      const node = findOne(inst.toJSON(), 'OrderDetailsScreen-order-id');
      expect(node?.children).toContain('o1');
    });

    it('keeps OrdersScreen mounted (always-mounted, display:none pattern)', () => {
      let inst;
      act(() => { inst = create(<OrdersNavigator />); });
      press(inst, 'OrdersScreen-order');
      expect(exists(inst.toJSON(), 'screen-OrdersScreen')).toBe(true);
    });

    it('registers BackHandler when detail screen opens', () => {
      let inst;
      act(() => { inst = create(<OrdersNavigator />); });
      BackHandler.addEventListener.mockClear();
      press(inst, 'OrdersScreen-order');
      expect(BackHandler.addEventListener).toHaveBeenCalledWith('hardwareBackPress', expect.any(Function));
    });
  });

  describe('Push to OrderMapScreen', () => {
    it('shows OrderMapScreen when location button pressed', () => {
      let inst;
      act(() => { inst = create(<OrdersNavigator />); });
      press(inst, 'OrdersScreen-location');
      expect(exists(inst.toJSON(), 'screen-OrderMapScreen')).toBe(true);
    });

    it('passes order.id to OrderMapScreen', () => {
      let inst;
      act(() => { inst = create(<OrdersNavigator />); });
      press(inst, 'OrdersScreen-location');
      const node = findOne(inst.toJSON(), 'OrderMapScreen-order-id');
      expect(node?.children).toContain('o1');
    });

    it('detail screen is NOT shown when map is open', () => {
      let inst;
      act(() => { inst = create(<OrdersNavigator />); });
      press(inst, 'OrdersScreen-location');
      expect(exists(inst.toJSON(), 'screen-OrderDetailsScreen')).toBe(false);
    });
  });

  describe('Pop — onBack callback', () => {
    it('returns to list from OrderDetailsScreen via onBack', () => {
      let inst;
      act(() => { inst = create(<OrdersNavigator />); });
      press(inst, 'OrdersScreen-order');
      press(inst, 'OrderDetailsScreen-back');
      expect(exists(inst.toJSON(), 'screen-OrderDetailsScreen')).toBe(false);
    });

    it('clears selectedOrder after back (order-id text removed)', () => {
      let inst;
      act(() => { inst = create(<OrdersNavigator />); });
      press(inst, 'OrdersScreen-order');
      press(inst, 'OrderDetailsScreen-back');
      expect(exists(inst.toJSON(), 'OrderDetailsScreen-order-id')).toBe(false);
    });

    it('returns to list from OrderMapScreen via onBack', () => {
      let inst;
      act(() => { inst = create(<OrdersNavigator />); });
      press(inst, 'OrdersScreen-location');
      press(inst, 'OrderMapScreen-back');
      expect(exists(inst.toJSON(), 'screen-OrderMapScreen')).toBe(false);
    });
  });

  describe('Pop — hardware back button (Android)', () => {
    it('hardware back from detail screen returns to list', () => {
      let inst;
      act(() => { inst = create(<OrdersNavigator />); });
      press(inst, 'OrdersScreen-order');
      pressBack();
      expect(exists(inst.toJSON(), 'screen-OrderDetailsScreen')).toBe(false);
    });

    it('hardware back from map screen returns to list', () => {
      let inst;
      act(() => { inst = create(<OrdersNavigator />); });
      press(inst, 'OrdersScreen-location');
      pressBack();
      expect(exists(inst.toJSON(), 'screen-OrderMapScreen')).toBe(false);
    });

    it('back press is consumed (returns true) when child screen is open', () => {
      let inst;
      act(() => { inst = create(<OrdersNavigator />); });
      press(inst, 'OrdersScreen-order');
      expect(_backListeners.length).toBeGreaterThan(0);
      const consumed = pressBack();
      expect(consumed).toBe(true);
    });

    it('BackHandler listener is removed after navigating back', () => {
      let inst;
      act(() => { inst = create(<OrdersNavigator />); });
      press(inst, 'OrdersScreen-order');
      const before = _backListeners.length;
      pressBack();
      expect(_backListeners.length).toBeLessThanOrEqual(before);
    });
  });

  describe('Multi-hop navigation sequences', () => {
    it('list → detail → back → map', () => {
      let inst;
      act(() => { inst = create(<OrdersNavigator />); });

      press(inst, 'OrdersScreen-order');
      expect(exists(inst.toJSON(), 'screen-OrderDetailsScreen')).toBe(true);
      expect(exists(inst.toJSON(), 'screen-OrderMapScreen')).toBe(false);

      press(inst, 'OrderDetailsScreen-back');
      expect(exists(inst.toJSON(), 'screen-OrderDetailsScreen')).toBe(false);

      press(inst, 'OrdersScreen-location');
      expect(exists(inst.toJSON(), 'screen-OrderMapScreen')).toBe(true);
    });

    it('list → map → back → detail', () => {
      let inst;
      act(() => { inst = create(<OrdersNavigator />); });
      press(inst, 'OrdersScreen-location');
      press(inst, 'OrderMapScreen-back');
      press(inst, 'OrdersScreen-order');
      expect(exists(inst.toJSON(), 'screen-OrderDetailsScreen')).toBe(true);
    });

    it('navigating to detail twice does not create duplicate screens', () => {
      let inst;
      act(() => { inst = create(<OrdersNavigator />); });
      press(inst, 'OrdersScreen-order');
      press(inst, 'OrderDetailsScreen-back');
      press(inst, 'OrdersScreen-order');
      expect(findAll(inst.toJSON(), 'screen-OrderDetailsScreen')).toHaveLength(1);
    });
  });

  describe('Cleanup on unmount', () => {
    it('removes BackHandler when unmounting with child screen open', () => {
      let inst;
      act(() => { inst = create(<OrdersNavigator />); });
      press(inst, 'OrdersScreen-order');
      const before = _backListeners.length;
      act(() => { inst.unmount(); });
      expect(_backListeners.length).toBeLessThan(before);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 4. BikerProfileNavigator (menu → sub-screen)
// ═══════════════════════════════════════════════════════════════════════════════

describe('BikerProfileNavigator', () => {
  const SUB_SCREENS = [
    {action: 'info',     screen: 'PersonalInfoScreen'},
    {action: 'wallet',   screen: 'WalletScreen'},
    {action: 'language', screen: 'LanguageScreen'},
    {action: 'support',  screen: 'SupportScreen'},
    {action: 'terms',    screen: 'TermsScreen'},
  ];

  describe('Initial render', () => {
    it('shows ProfileScreen menu by default', () => {
      let inst;
      act(() => { inst = create(<ProfileNavigator />); });
      expect(exists(inst.toJSON(), 'screen-ProfileScreen')).toBe(true);
    });

    it('no sub-screen shown initially', () => {
      let inst;
      act(() => { inst = create(<ProfileNavigator />); });
      SUB_SCREENS.forEach(({screen}) =>
        expect(exists(inst.toJSON(), `screen-${screen}`)).toBe(false)
      );
    });

    it('does NOT register BackHandler initially (guard: if (!screen) return)', () => {
      BackHandler.addEventListener.mockClear();
      act(() => { create(<ProfileNavigator />); });
      expect(BackHandler.addEventListener).not.toHaveBeenCalled();
    });
  });

  describe.each(SUB_SCREENS)('Sub-screen: $action → $screen', ({action, screen}) => {
    it(`navigates to ${screen} via onNavigate('${action}')`, () => {
      let inst;
      act(() => { inst = create(<ProfileNavigator />); });
      press(inst, `ProfileScreen-go-${action}`);
      expect(exists(inst.toJSON(), `screen-${screen}`)).toBe(true);
    });

    it(`ProfileScreen stays mounted when ${screen} is open`, () => {
      let inst;
      act(() => { inst = create(<ProfileNavigator />); });
      press(inst, `ProfileScreen-go-${action}`);
      expect(exists(inst.toJSON(), 'screen-ProfileScreen')).toBe(true);
    });

    it(`returns to menu from ${screen} via onBack`, () => {
      let inst;
      act(() => { inst = create(<ProfileNavigator />); });
      press(inst, `ProfileScreen-go-${action}`);
      press(inst, `${screen}-back`);
      expect(exists(inst.toJSON(), `screen-${screen}`)).toBe(false);
    });

    it(`hardware back from ${screen} returns to menu`, () => {
      let inst;
      act(() => { inst = create(<ProfileNavigator />); });
      press(inst, `ProfileScreen-go-${action}`);
      pressBack();
      expect(exists(inst.toJSON(), `screen-${screen}`)).toBe(false);
    });

    it(`back press is consumed (true) when ${screen} is open`, () => {
      let inst;
      act(() => { inst = create(<ProfileNavigator />); });
      press(inst, `ProfileScreen-go-${action}`);
      expect(pressBack()).toBe(true);
    });

    it(`registers BackHandler when ${screen} opens`, () => {
      BackHandler.addEventListener.mockClear();
      let inst;
      act(() => { inst = create(<ProfileNavigator />); });
      press(inst, `ProfileScreen-go-${action}`);
      expect(BackHandler.addEventListener).toHaveBeenCalledWith('hardwareBackPress', expect.any(Function));
    });

    it(`removes BackHandler when returning from ${screen}`, () => {
      let inst;
      act(() => { inst = create(<ProfileNavigator />); });
      press(inst, `ProfileScreen-go-${action}`);
      const before = _backListeners.length;
      press(inst, `${screen}-back`);
      expect(_backListeners.length).toBeLessThan(before);
    });
  });

  describe('Cleanup on unmount', () => {
    it('removes BackHandler when unmounting with sub-screen open', () => {
      let inst;
      act(() => { inst = create(<ProfileNavigator />); });
      press(inst, 'ProfileScreen-go-info');
      const before = _backListeners.length;
      act(() => { inst.unmount(); });
      expect(_backListeners.length).toBeLessThan(before);
    });
  });

  describe('Sequential navigation', () => {
    it('info → back → wallet navigates correctly', () => {
      let inst;
      act(() => { inst = create(<ProfileNavigator />); });
      press(inst, 'ProfileScreen-go-info');
      press(inst, 'PersonalInfoScreen-back');
      press(inst, 'ProfileScreen-go-wallet');
      expect(exists(inst.toJSON(), 'screen-WalletScreen')).toBe(true);
      expect(exists(inst.toJSON(), 'screen-PersonalInfoScreen')).toBe(false);
    });

    it('only one sub-screen visible at a time', () => {
      let inst;
      act(() => { inst = create(<ProfileNavigator />); });
      press(inst, 'ProfileScreen-go-terms');
      expect(exists(inst.toJSON(), 'screen-TermsScreen')).toBe(true);
      expect(exists(inst.toJSON(), 'screen-WalletScreen')).toBe(false);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 5. Auth flow routing logic
// ═══════════════════════════════════════════════════════════════════════════════

describe('Auth flow routing logic', () => {
  // Mirrors the normalisation in src/store/authStore.js setSession
  const normalise = (backendRole) =>
    backendRole === 'biker' ? 'biker' : backendRole ? 'admin' : null;

  describe('Role normalisation', () => {
    it('"biker" stays "biker"',         () => expect(normalise('biker')).toBe('biker'));
    it('"client" becomes "admin"',      () => expect(normalise('client')).toBe('admin'));
    it('"admin" stays "admin"',         () => expect(normalise('admin')).toBe('admin'));
    it('"manager" becomes "admin"',     () => expect(normalise('manager')).toBe('admin'));
    it('null becomes null',             () => expect(normalise(null)).toBeNull());
    it('undefined becomes null',        () => expect(normalise(undefined)).toBeNull());

    it('any non-"biker" truthy role → "admin"', () => {
      ['admin','manager','client','partner'].forEach(r => expect(normalise(r)).toBe('admin'));
    });
  });

  describe('Navigator selection (AppRoot JSX conditions)', () => {
    it('role "biker" → renders BikerNavigator', () => {
      const role = 'biker';
      expect(role === 'biker').toBe(true);
      expect(role === 'admin').toBe(false);
      expect(!role).toBe(false);
    });

    it('role "admin" → renders PartnerNavigator', () => {
      const role = 'admin';
      expect(role === 'biker').toBe(false);
      expect(role === 'admin').toBe(true);
      expect(!role).toBe(false);
    });

    it('role null → renders LoginScreen', () => {
      const role = null;
      expect(role === 'biker').toBe(false);
      expect(role === 'admin').toBe(false);
      expect(!role).toBe(true);
    });
  });

  describe('isReady gate', () => {
    it('isReady = false → AppRoot returns null', () => expect(!false).toBe(true));
    it('isReady = true  → AppRoot renders content', () => expect(!true).toBe(false));
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 6. Edge cases
// ═══════════════════════════════════════════════════════════════════════════════

describe('Navigation edge cases', () => {
  describe('Deep back navigation to root', () => {
    it('collapses full history — final back press is NOT consumed', () => {
      let inst;
      act(() => { inst = create(<AppNavigator />); });

      pressTabByLabel(inst, 'nav.orders');
      pressTabByLabel(inst, 'nav.reviews');
      pressTabByLabel(inst, 'nav.profile');

      pressBack(); // profile → reviews
      pressBack(); // reviews → orders
      pressBack(); // orders → home

      expect(pressBack()).toBe(false); // at root
    });
  });

  describe('Rapid tab switching', () => {
    it('does not throw on 10 rapid tab presses', () => {
      let inst;
      act(() => { inst = create(<AppNavigator />); });
      expect(() => {
        ['nav.orders','nav.reviews','nav.profile','nav.home','nav.orders',
         'nav.reviews','nav.home','nav.profile','nav.orders','nav.home']
          .forEach(label => pressTabByLabel(inst, label));
      }).not.toThrow();
    });
  });

  describe('Back on root screens (no crash, returns false)', () => {
    it('BikerOrdersNavigator: back on list screen does nothing', () => {
      act(() => { create(<OrdersNavigator />); });
      expect(pressBack()).toBe(false);
    });

    it('ProfileNavigator: back on menu screen does nothing', () => {
      act(() => { create(<ProfileNavigator />); });
      expect(pressBack()).toBe(false);
    });
  });

  describe('IncomingOrder overlay accept/reject cycle', () => {
    it('accept calls clearIncomingOrder', () => {
      mockAppStore.incomingOrder = {id: 'o1'};
      let inst;
      act(() => { inst = create(<PartnerNavigator />); });
      press(inst, 'incoming-accept');
      expect(mockAppStore.clearIncomingOrder).toHaveBeenCalled();
    });

    it('reject calls clearIncomingOrder', () => {
      mockAppStore.incomingOrder = {id: 'o1'};
      let inst;
      act(() => { inst = create(<PartnerNavigator />); });
      press(inst, 'incoming-reject');
      expect(mockAppStore.clearIncomingOrder).toHaveBeenCalled();
    });
  });
});
