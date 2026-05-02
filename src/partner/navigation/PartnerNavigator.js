import React, {useState, useEffect, useCallback} from 'react';
import {BackHandler, Platform, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {Home, ClipboardList, Settings, User} from 'lucide-react-native';
import {useTheme} from '../../shared/context/ThemeContext';
import {useI18n} from '../../shared/i18n/I18nContext';
import DashboardScreen from '../features/dashboard/DashboardScreen';
import OrdersNavigator from '../features/orders/OrdersNavigator';
import OperationsNavigator from '../features/operations/OperationsNavigator';
import PartnerProfileNavigator from '../features/profile/PartnerProfileNavigator';

const TAB_KEYS = [
  {key: 'dashboard',  labelKey: 'partner.nav.dashboard',  Icon: Home,          Screen: DashboardScreen},
  {key: 'orders',     labelKey: 'partner.nav.orders',     Icon: ClipboardList, Screen: OrdersNavigator},
  {key: 'operations', labelKey: 'partner.nav.operations', Icon: Settings,      Screen: OperationsNavigator},
  {key: 'profile',    labelKey: 'partner.nav.profile',    Icon: User,          Screen: PartnerProfileNavigator},
];

export default function PartnerNavigator() {
  const {colors} = useTheme();
  const {t} = useI18n();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [history, setHistory]     = useState(['dashboard']);
  const [mounted, setMounted]     = useState({dashboard: true});

  const handleTabPress = useCallback((key) => {
    if (key === activeTab) return;
    setMounted(prev => prev[key] ? prev : {...prev, [key]: true});
    setHistory(prev => [...prev, key]);
    setActiveTab(key);
  }, [activeTab]);

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
      <View style={s.screen}>
        {TAB_KEYS.map(({key, Screen}) =>
          mounted[key] ? (
            <View key={key} style={[s.page, activeTab !== key && s.hidden]}>
              <Screen />
            </View>
          ) : null
        )}
      </View>

      <View style={[s.tabBar, {backgroundColor: colors.card}]}>
        {TAB_KEYS.map(({key, labelKey, Icon}) => {
          const isActive = key === activeTab;
          return (
            <TouchableOpacity
              key={key}
              style={s.tabItem}
              onPress={() => handleTabPress(key)}
              activeOpacity={0.8}>
              <View style={[s.iconWrap, isActive && {backgroundColor: colors.primary , borderRadius : 50}]}>
                <Icon
                  size={22}
                  color={isActive ? '#fff' : colors.textSecondary}
                  strokeWidth={isActive ? 2.5 : 1.8}
                />
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
    flexDirection:  'row',
    paddingBottom:  Platform.OS === 'ios' ? 28 : 10,
    paddingTop:     10,
    paddingHorizontal: 8,
    elevation:      12,
    shadowColor:    '#000',
    shadowOffset:   {width: 0, height: -3},
    shadowOpacity:  0.06,
    shadowRadius:   10,
  },
  tabItem:  {flex: 1, alignItems: 'center', gap: 5},
  iconWrap: {width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center'},
  tabLabel: {fontSize: 10, fontWeight: '500'},
});
