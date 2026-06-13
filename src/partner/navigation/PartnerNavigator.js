import React, {useState, useEffect, useCallback} from 'react';
import {BackHandler, Platform, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {Home, ClipboardList, Settings, User, Wallet} from 'lucide-react-native';
import {useTheme} from '../../shared/context/ThemeContext';
import {useI18n} from '../../shared/i18n/I18nContext';
import DashboardScreen from '../features/dashboard/DashboardScreen';
import OrdersNavigator from '../features/orders/OrdersNavigator';
import OperationsNavigator from '../features/operations/OperationsNavigator';
import PaymentsScreen from '../features/operations/PaymentsScreen';
import PartnerProfileNavigator from '../features/profile/PartnerProfileNavigator';
import IncomingOrderScreen from '../features/orders/IncomingOrderScreen';
import useAppStore from '../../store/appStore';
import useAuthStore from '../../store/authStore';
import {acceptOrder, rejectOrder} from '../../services/partner';

// Notification tab keys → partner tab keys
const NAV_TAB_MAP = {
  orders:        'orders',
  notifications: 'dashboard',
};

// unmount: true → tab is destroyed when leaving (no state to preserve)
const TAB_KEYS = [
  {key: 'dashboard',  labelKey: 'partner.nav.dashboard',  Icon: Home,          Screen: DashboardScreen,         unmount: false},
  {key: 'orders',     labelKey: 'partner.nav.orders',     Icon: ClipboardList, Screen: OrdersNavigator,         unmount: false},
  {key: 'operations', labelKey: 'partner.nav.operations', Icon: Settings,      Screen: OperationsNavigator,     unmount: true},
  {key: 'wallet',     labelKey: 'partner.nav.wallet',     Icon: Wallet,        Screen: PaymentsScreen,          unmount: false},
  {key: 'profile',    labelKey: 'partner.nav.profile',    Icon: User,          Screen: PartnerProfileNavigator, unmount: false},
];

export default function PartnerNavigator() {
  const {colors} = useTheme();
  const {t} = useI18n();
  const user = useAuthStore(s => s.user);
  const isSupervisor = user?.originalRole === 'supervisor';

  const tabs = TAB_KEYS;

  const [activeTab, setActiveTab] = useState('dashboard');
  const [history, setHistory]     = useState(['dashboard']);
  const [mounted, setMounted]     = useState({dashboard: true});

  const pendingNav      = useAppStore(s => s.pendingNav);
  const clearNav        = useAppStore(s => s.clearNav);
  const incomingOrder   = useAppStore(s => s.incomingOrder);
  const clearIncoming   = useAppStore(s => s.clearIncomingOrder);

  const handleIncomingAccept = useCallback(async (order) => {
    const id = order?._id ?? order?.id;
    if (id) await acceptOrder(id).catch(() => {});
    clearIncoming();
    if (id) useAppStore.getState().requestNav('orders', id, 'detail');
  }, [clearIncoming]);

  const handleIncomingReject = useCallback(async ({reason, note}) => {
    // AUTO_TIMEOUT is NOT a backend reject code (rejectReasons whitelist). The
    // server times the order out on its own side, so on timeout we only dismiss
    // locally — sending it would 400 and desync local vs. backend order state.
    if (reason !== 'AUTO_TIMEOUT') {
      const current = useAppStore.getState().incomingOrder;
      const id = current?._id ?? current?.id;
      if (id) await rejectOrder(id, reason, note).catch(() => {});
    }
    clearIncoming();
  }, [clearIncoming]);

  const handleTabPress = useCallback((key) => {
    if (key === activeTab) return;
    const leavingTab = tabs.find(t => t.key === activeTab);
    setMounted(prev => {
      const next = leavingTab?.unmount ? {...prev, [leavingTab.key]: false} : prev;
      return next[key] ? next : {...next, [key]: true};
    });
    setHistory(prev => [...prev, key]);
    setActiveTab(key);
  }, [activeTab]);

  // Respond to notification-tap / quick-action navigation
  useEffect(() => {
    if (!pendingNav) return;
    const tab = NAV_TAB_MAP[pendingNav.tab] ?? pendingNav.tab;
    const tabExists = tabs.some(k => k.key === tab);

    if (tabExists) {
      // Mount the tab first, then let the child navigator consume pendingNav.
      // We do NOT clearNav here when screen/orderId are present — the child
      // navigator (OrdersNavigator) watches pendingNav and clears it itself.
      setMounted(prev => prev[tab] ? prev : {...prev, [tab]: true});
      setHistory(prev => [...prev, tab]);
      setActiveTab(tab);
    }

    // Only clear immediately when there is no deep navigation target.
    if (!pendingNav.screen && !pendingNav.orderId) {
      clearNav();
    }
  }, [pendingNav, clearNav]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (history.length > 1) {
        const prev = history[history.length - 2];
        setHistory(h => h.slice(0, -1));
        setActiveTab(prev);
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [history]);

  return (
    <View style={[s.root, {backgroundColor: colors.bg}]}>
      <IncomingOrderScreen
        visible={!!incomingOrder}
        order={incomingOrder}
        onAccept={handleIncomingAccept}
        onReject={handleIncomingReject}
      />
      <View style={s.screen}>
        {tabs.map(({key, Screen}) =>
          mounted[key] ? (
            <View key={key} style={[s.page, activeTab !== key && s.hidden]}>
              <Screen />
            </View>
          ) : null
        )}
      </View>

      <View style={[s.tabBar, {backgroundColor: colors.card}]}>
        {tabs.map(({key, labelKey, Icon}) => {
          const isActive = key === activeTab;
          return (
            <TouchableOpacity
              key={key}
              style={s.tabItem}
              onPress={() => handleTabPress(key)}
              activeOpacity={0.8}>
              <View style={s.iconOuter}>
                <View style={[s.iconWrap, isActive && {backgroundColor: colors.primary, borderRadius: 50}]}>
                  <Icon
                    size={22}
                    color={isActive ? '#fff' : colors.textSecondary}
                    strokeWidth={isActive ? 2.5 : 1.8}
                  />
                </View>
              </View>
              <Text style={[s.tabLabel, {color: colors.textSecondary}]}>
                {t(labelKey)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

    </View>
  );
}

const s = StyleSheet.create({
  root:     {flex: 1},
  screen:   {flex: 1},
  page:     {flex: 1},
  hidden:   {display: 'none'},
  tabBar: {
    flexDirection:     'row',
    paddingBottom:     Platform.OS === 'ios' ? 28 : 10,
    paddingTop:        10,
    paddingHorizontal: 8,
    elevation:         12,
    shadowColor:       '#000',
    shadowOffset:      {width: 0, height: -3},
    shadowOpacity:     0.06,
    shadowRadius:      10,
  },
  tabItem:   {flex: 1, alignItems: 'center', gap: 5},
  iconOuter: {position: 'relative'},
  iconWrap:  {width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center'},
  tabLabel:  {fontSize: 10, fontWeight: '500'},
});
