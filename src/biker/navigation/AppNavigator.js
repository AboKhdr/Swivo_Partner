import React, {useState, useEffect, useCallback} from 'react';
import {BackHandler, Platform, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {Home, ClipboardList, Star, User} from 'lucide-react-native';
import {useTheme} from '../../shared/context/ThemeContext';
import {useI18n} from '../../shared/i18n/I18nContext';
import HomeScreen from '../features/home/HomeScreen';
import OrdersNavigator from '../features/orders/OrdersNavigator';
import ReviewsScreen from '../features/reviews/ReviewsScreen';
import ProfileNavigator from '../features/profile/ProfileNavigator';

const TAB_KEYS = [
  {key: 'home',    labelKey: 'nav.home',    Icon: Home,          Screen: HomeScreen},
  {key: 'orders',  labelKey: 'nav.orders',  Icon: ClipboardList, Screen: OrdersNavigator},
  {key: 'reviews', labelKey: 'nav.reviews', Icon: Star,          Screen: ReviewsScreen},
  {key: 'profile', labelKey: 'nav.profile', Icon: User,          Screen: ProfileNavigator},
];

export default function AppNavigator() {
  const {colors} = useTheme();
  const {t} = useI18n();
  const [activeTab, setActiveTab] = useState('home');
  const [history, setHistory]     = useState(['home']);
  const [mounted, setMounted]     = useState({home: true});

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
      <View style={[s.tabBar, {backgroundColor: colors.card, borderTopColor: colors.border}]}>
        {TAB_KEYS.map(({key, labelKey, Icon}) => {
          const isActive = key === activeTab;
          return (
            <TouchableOpacity
              key={key}
              style={s.tabItem}
              onPress={() => handleTabPress(key)}
              activeOpacity={0.7}>
              <Icon size={22} color={isActive ? colors.primary : colors.textSecondary} strokeWidth={isActive ? 2.5 : 1.8} />
              <Text style={[s.tabLabel, {color: isActive ? colors.primary : colors.textSecondary}, isActive && s.tabLabelActive]}>{t(labelKey)}</Text>
              {isActive && <View style={[s.activeDot, {backgroundColor: colors.primary}]} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root:   {flex: 1},
  screen: {flex: 1},
  page:   {flex: 1},
  hidden: {display: 'none'},
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingBottom: Platform.OS === 'ios' ? 26 : 8,
    paddingTop: 10,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -4},
    shadowOpacity: 0.05,
    shadowRadius: 12,
  },
  tabItem:        {flex: 1, alignItems: 'center', gap: 4},
  tabLabel:       {fontSize: 10, fontWeight: '600'},
  tabLabelActive: {fontWeight: '800'},
  activeDot:      {position: 'absolute', bottom: Platform.OS === 'ios' ? -26 : -8, width: 4, height: 4, borderRadius: 2},
});
