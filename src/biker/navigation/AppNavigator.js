import React, {useState, useEffect, useCallback} from 'react';
import {BackHandler, Platform, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {Home, ClipboardList, Star, User} from 'lucide-react-native';
import {Colors} from '../../shared/constants/colors';
import HomeScreen from '../features/home/HomeScreen';
import OrdersNavigator from '../features/orders/OrdersNavigator';
import ReviewsScreen from '../features/reviews/ReviewsScreen';
import ProfileScreen from '../features/profile/ProfileScreen';

const TABS = [
  {key: 'home',    label: 'الرئيسية', Icon: Home,          Screen: HomeScreen},
  {key: 'orders',  label: 'الطلبات',  Icon: ClipboardList, Screen: OrdersNavigator},
  {key: 'reviews', label: 'التقييم',  Icon: Star,          Screen: ReviewsScreen},
  {key: 'profile', label: 'حسابي',   Icon: User,          Screen: ProfileScreen},
];

export default function AppNavigator() {
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
    <View style={s.root} >
      <View style={s.screen}>
        {TABS.map(({key, Screen}) =>
          mounted[key] ? (
            <View key={key} style={[s.page, activeTab !== key && s.hidden]}>
              <Screen />
            </View>
          ) : null
        )}
      </View>
      <View style={s.tabBar}>
        {TABS.map(({key, label, Icon}) => {
          const isActive = key === activeTab;
          return (
            <TouchableOpacity
              key={key}
              style={s.tabItem}
              onPress={() => handleTabPress(key)}
              activeOpacity={0.7}>
              <Icon size={22} color={isActive ? Colors.primary : '#B0BEC5'} strokeWidth={isActive ? 2.5 : 1.8} />
              <Text style={[s.tabLabel, isActive && s.tabLabelActive]}>{label}</Text>
              {isActive && <View style={s.activeDot} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root:   {flex: 1, backgroundColor: '#F5F7FA', direction : "rtl"},
  screen: {flex: 1},
  page:   {flex: 1},
  hidden: {display: 'none'},
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#EEF2F7',
    paddingBottom: Platform.OS === 'ios' ? 26 : 8,
    paddingTop: 10,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -4},
    shadowOpacity: 0.05,
    shadowRadius: 12,
  },
  tabItem:        {flex: 1, alignItems: 'center', gap: 4},
  tabLabel:       {fontSize: 10, fontWeight: '600', color: '#B0BEC5'},
  tabLabelActive: {color: Colors.primary, fontWeight: '800'},
  activeDot:      {position: 'absolute', bottom: Platform.OS === 'ios' ? -26 : -8, width: 4, height: 4, borderRadius: 2, backgroundColor: Colors.primary},
});
