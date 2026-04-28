import React, {useState, useRef, useEffect} from 'react';
import {Animated, Platform, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {Colors} from '../shared/constants/colors';
import HomeScreen from '../features/home/HomeScreen';
import OrdersScreen from '../features/orders/OrdersScreen';
import ReviewsScreen from '../features/reviews/ReviewsScreen';
import ProfileScreen from '../features/profile/ProfileScreen';

const TABS = [
  {key: 'home',    label: 'الرئيسية', emoji: '🏠'},
  {key: 'orders',  label: 'طلباتي',   emoji: '📋'},
  {key: 'reviews', label: 'التقييمات', emoji: '⭐'},
  {key: 'profile', label: 'حسابي',    emoji: '👤'},
];

function TabBar({active, onPress}) {
  return (
    <View style={s.tabBar}>
      {TABS.map(tab => {
        const isActive = tab.key === active;
        return (
          <TouchableOpacity
            key={tab.key}
            style={s.tabItem}
            onPress={() => onPress(tab.key)}
            activeOpacity={0.7}>
            <Text style={[s.tabEmoji, isActive && s.tabEmojiActive]}>{tab.emoji}</Text>
            <Text style={[s.tabLabel, isActive && s.tabLabelActive]}>{tab.label}</Text>
            {isActive && <View style={s.activeDot} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function AppNavigator() {
  const [activeTab, setActiveTab] = useState('home');
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const handleTabPress = (key) => {
    if (key === activeTab) return;
    Animated.sequence([
      Animated.timing(fadeAnim, {toValue: 0, duration: 100, useNativeDriver: true}),
    ]).start(() => {
      setActiveTab(key);
      Animated.timing(fadeAnim, {toValue: 1, duration: 180, useNativeDriver: true}).start();
    });
  };

  const renderScreen = () => {
    switch (activeTab) {
      case 'home':    return <HomeScreen />;
      case 'orders':  return <OrdersScreen />;
      case 'reviews': return <ReviewsScreen />;
      case 'profile': return <ProfileScreen />;
      default:        return <HomeScreen />;
    }
  };

  return (
    <View style={s.root}>
      <Animated.View style={[s.screenWrap, {opacity: fadeAnim}]}>
        {renderScreen()}
      </Animated.View>
      <TabBar active={activeTab} onPress={handleTabPress} />
    </View>
  );
}

const s = StyleSheet.create({
  root: {flex: 1, backgroundColor: Colors.bg},
  screenWrap: {flex: 1},
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingBottom: Platform.OS === 'ios' ? 24 : 8,
    paddingTop: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -3},
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 8,
  },
  tabItem: {flex: 1, alignItems: 'center', gap: 3, position: 'relative'},
  tabEmoji: {fontSize: 20, opacity: 0.4},
  tabEmojiActive: {opacity: 1},
  tabLabel: {fontSize: 10, fontWeight: '600', color: Colors.textSecondary},
  tabLabelActive: {color: Colors.primary, fontWeight: '800'},
  activeDot: {position: 'absolute', bottom: -6, width: 4, height: 4, borderRadius: 2, backgroundColor: Colors.primary},
});
