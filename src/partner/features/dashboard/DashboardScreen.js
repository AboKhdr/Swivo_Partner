import React, {useState, useCallback} from 'react';
import {FlatList, Image, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {Bell, Info, Car, Phone, MapPin} from 'lucide-react-native';
import {useTheme} from '../../../shared/context/ThemeContext';
import {useI18n} from '../../../shared/i18n/I18nContext';
import NotificationsScreen from './NotificationsScreen';

const MOCK_BRANCH = {
  name: 'مغسلة الكروية',
  managerName: 'خالد',
  todayRevenue: '285.00',
  totalOrders: 6,
  activeOrders: 4,
  pendingOrders: 4,
};

const MOCK_PENDING = [
  {id: '1', service: 'غسيل داخلي + خارجي', location: 'حي الملقا، الرياض', price: '120', time: 'قبل 2 دقيقة',  status: 'PENDING_PARTNER'},
  {id: '2', service: 'غسيل خارجي',          location: 'حي الملقا، الرياض', price: '80',  time: 'قبل 10 دقيقة', status: 'PENDING_PARTNER'},
  {id: '3', service: 'غسيل كامل - تشحيم',   location: 'حي الملقا، الرياض', price: '50',  time: 'قبل 24 دقيقة', status: 'PENDING_PARTNER'},
];

const MOCK_BIKERS = [
  {id: '1', name: 'يحيى الصفدي',       status: 'متاح', dotColor: '#F59E0B'},
  {id: '2', name: 'غيث الكفرسوسائي', status: 'متاح', dotColor: '#22C55E'},
];

function OrderCard({item, colors, t, onPress}) {
  return (
    <TouchableOpacity
      style={[s.pendingCard, {backgroundColor: colors.card, borderColor: colors.border}]}
      onPress={() => onPress(item)}
      activeOpacity={0.75}>
      <View style={[s.pendingBadge, {backgroundColor: '#F59E0B18'}]}>
        <Text style={[s.pendingBadgeText, {color: '#F59E0B'}]}>• {t('partner.dashboard.pending')}</Text>
      </View>
      <View style={s.pendingRow}>
        <View style={[s.carIconBox, {backgroundColor: colors.bg}]}>
          <Car size={22} color={colors.textSecondary} />
        </View>
        <View style={s.pendingInfo}>
          <Text style={[s.pendingService, {color: colors.textPrimary}]}>{item.service}</Text>
          <Text style={[s.pendingLocation, {color: colors.textSecondary}]}><MapPin color={"gray"} size={16}/> {item.location}</Text>
        </View>
        <View style={s.pendingPriceCol}>
          <Text style={[s.pendingPrice, {color: colors.primary}]}> {item.price}</Text>
          <Text style={[s.pendingTime, {color: colors.textSecondary}]}>{item.time}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function BikerCard({item, colors}) {
  return (
    <View style={[s.bikerCard, {backgroundColor: colors.card, borderColor: colors.border}]}>
      <View style={s.bikerTextCol}>
        <View style={s.bikerNameRow}>
          {/* <View style={[s.statusDot, {backgroundColor: item.dotColor}]} /> */}
          <Text style={[s.bikerName, {color: colors.textPrimary}]}>{item.name}</Text>
        </View>
        <Text style={[s.bikerStatus, {color: colors.textSecondary}]}>{item.status}</Text>
      </View>
      <TouchableOpacity style={[s.bikerActionBtn, {backgroundColor: colors.bg, borderColor: colors.border}]} activeOpacity={0.75}>
        <Phone size={18} color={colors.textSecondary} />
      </TouchableOpacity>
    </View>
  );
}

export default function DashboardScreen() {
  const {colors} = useTheme();
  const {t} = useI18n();
  const [refreshing, setRefreshing]       = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1200);
  }, []);

  if (showNotifications) {
    return <NotificationsScreen onBack={() => setShowNotifications(false)} />;
  }

  return (
    <View style={[s.root, {backgroundColor: colors.bg}]}>
      <View style={[s.topBar]}>
        <TouchableOpacity style={[s.topBarBtn, {backgroundColor : colors.primary + '15', borderRadius : 50 , borderColor : colors.primary , borderWidth : 1}]} activeOpacity={0.75} onPress={() => setShowNotifications(true)}>
          <Bell size={22} color={colors.primary} />
        </TouchableOpacity>
        <View>
          <Image source={require('../../../../public/logo.png')} style={{width: 50, height: 40 , objectFit : "contain"}} />
        </View>
        <TouchableOpacity style={[s.topBarBtn, {backgroundColor : colors.warning + '15', borderRadius : 50 , borderColor : colors.warning , borderWidth : 1}]} activeOpacity={0.75}>
          <Text style={{color: colors.warning}} >أ</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={s.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}>

        <View style={{paddingHorizontal: 16, paddingTop: 20}}>
          <Text style={s.heroGreeting}>{t('partner.dashboard.title')}، {MOCK_BRANCH.managerName}</Text>
          <Text style={s.heroBranchName}>{MOCK_BRANCH.name}</Text>
        </View>
        <View style={[s.heroCard, {backgroundColor: colors.primary}]}>
          <Text style={s.heroRevenueLabel}>{t('partner.dashboard.revenue')}</Text>
          <Text style={s.heroRevenue}> {MOCK_BRANCH.todayRevenue}</Text>
          <View style={s.heroStats}>
            <View style={s.heroStatItem}>
              <Text style={s.heroStatValue}>{MOCK_BRANCH.pendingOrders}</Text>
              <Text style={s.heroStatLabel}>{t('partner.dashboard.pending')}</Text>
            </View>
            <View style={s.heroStatItem}>
              <Text style={s.heroStatValue}>{MOCK_BRANCH.activeOrders}</Text>
              <Text style={s.heroStatLabel}>{t('partner.dashboard.active')}</Text>
            </View>
            <View style={s.heroStatItem}>
              <Text style={s.heroStatValue}>{MOCK_BRANCH.totalOrders}</Text>
              <Text style={s.heroStatLabel}>{t('partner.dashboard.orders')}</Text>
            </View>
          </View>
        </View>

        <View style={s.section}>
          <Text style={[s.sectionTitle, {color: colors.textPrimary}]}>{t('partner.dashboard.pendingOrders')}</Text>
          {MOCK_PENDING.map(item => (
            <OrderCard key={item.id} item={item} colors={colors} t={t} onPress={() => {}} />
          ))}
        </View>

        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={[s.sectionTitle, {color: colors.textPrimary}]}>{t('partner.dashboard.activeBikers')}</Text>
            <TouchableOpacity activeOpacity={0.75}>
              <Text style={[s.viewAll, {color: colors.primary}]}>{t('partner.dashboard.viewAll')}</Text>
            </TouchableOpacity>
          </View>
          {MOCK_BIKERS.map(item => (
            <BikerCard key={item.id} item={item} colors={colors} />
          ))}
        </View>

        <View style={s.bottomPad} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root:             {flex: 1},
  topBar:           {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12},
  topBarBtn:        {width: 36, height: 36, alignItems: 'center', justifyContent: 'center'},
  logoText:         {fontSize: 20, fontWeight: '900', letterSpacing: -0.5},
  logoPlusBadge:    {paddingHorizontal: 4, paddingVertical: 1, borderRadius: 4, marginLeft: 2},
  logoPlusText:     {fontSize: 10, color: '#fff', fontWeight: '900'},
  scroll:           {flex: 1},
  heroCard:         {marginHorizontal: 16, marginBottom: 8, borderRadius: 20, padding: 20, gap: 4},
  heroGreeting:     {fontSize: 12, color: '#9CA3AF', fontWeight: '500'},
  heroBranchName:   {fontSize: 18, fontWeight: '800', color: '#9CA3AF', marginBottom: 4},
  heroRevenueLabel: {fontSize: 13, color: 'rgba(255,255,255,0.75)', marginBottom: 2},
  heroRevenue:      {fontSize: 38, color: '#fff', fontWeight: '900', marginBottom: 20},
  heroStats:        {flexDirection: 'row', justifyContent: 'space-between', gap: 10},
  heroStatItem:     {flex: 1, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 14, paddingVertical: 12, gap: 4},
  heroStatValue:    {fontSize: 20, color: '#fff', fontWeight: '800'},
  heroStatLabel:    {fontSize: 12, color: 'rgba(255,255,255,0.8)'},
  section:          {paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4},
  sectionHeader:    {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12},
  sectionTitle:     {fontSize: 16, fontWeight: '700', marginBottom: 12},
  viewAll:          {fontSize: 13, fontWeight: '600'},
  pendingCard:      {borderRadius: 14, paddingHorizontal: 14, paddingTop: 10, paddingBottom: 14, borderWidth: 1, marginBottom: 10, gap: 10},
  pendingBadge:     {alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20},
  pendingBadgeText: {fontSize: 11, fontWeight: '700'},
  pendingRow:       {flexDirection: 'row', alignItems: 'center', gap: 10},
  carIconBox:       {width: 46, height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center'},
  pendingInfo:      {flex: 1, gap: 5},
  pendingService:   {fontSize: 15, fontWeight: '700', },
  pendingLocation:  {fontSize: 12 , display : "flex", alignItems : "center", gap: 1},
  pendingPriceCol:  {alignItems: 'flex-start', gap: 4, minWidth: 56},
  pendingPrice:     {fontSize: 14, textAlign:"center" ,fontWeight: '800'},
  pendingTime:      {fontSize: 11},
  bikerCard:        {flexDirection: 'row', alignItems: 'center', borderRadius: 14, padding: 14, borderWidth: 1, marginBottom: 10, gap: 10},
  bikerInfoBox:     {justifyContent: 'center'},
  bikerInfoBtn:     {width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1},
  bikerTextCol:     {flex: 1, gap: 4},
  bikerNameRow:     {flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', gap: 8},
  bikerName:        {fontSize: 15, fontWeight: '700'},
  statusDot:        {width: 10, height: 10, borderRadius: 5},
  bikerStatus:      {fontSize: 12, },
  bikerActionBtn:   {width: 36, height: 36, borderRadius: 50, alignItems: 'center', justifyContent: 'center', borderWidth: 1},
  bottomPad:        {height: 24},
});
