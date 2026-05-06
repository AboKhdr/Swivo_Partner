import React, {useState, useEffect, useCallback} from 'react';
import {
  ActivityIndicator, Image, RefreshControl, ScrollView,
  StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import {Bell, Car, MapPin, Phone} from 'lucide-react-native';
import {useTheme} from '../../../shared/context/ThemeContext';
import {useI18n} from '../../../shared/i18n/I18nContext';
import useAuthStore from '../../../store/authStore';
import {getDashboardToday, getStaff} from '../../../services/partner';
import NotificationsScreen from './NotificationsScreen';

// ── Order Card ────────────────────────────────────────────────────────────────
function OrderCard({item, colors, t, onPress}) {
  const serviceName =
    item.itemsSnapshot?.[0]?.nameSnapshot?.ar
    ?? item.itemsSnapshot?.[0]?.nameSnapshot?.en
    ?? item.items?.[0]?.service?.name?.ar
    ?? item.items?.[0]?.service?.name?.en
    ?? item.items?.[0]?.name?.ar
    ?? item.items?.[0]?.name?.en
    ?? item.service?.name?.ar
    ?? item.service?.name?.en
    ?? (typeof item.service?.name === 'string' ? item.service.name : '')
    ?? '';
  const branchName = item.branch?.name?.ar ?? item.branch?.name?.en ?? item.branch?.name ?? '';
  const location = item.addressSnapshot?.addressText
    ?? item.addressSnapshot?.district
    ?? branchName;
  const price = item.tenantNetSnapshot ?? item.totalAmount ?? '';
  const timeStr = item.scheduledAt
    ? new Date(item.scheduledAt).toLocaleTimeString('ar-SA', {hour: '2-digit', minute: '2-digit'})
    : '';

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
          <Text style={[s.pendingService, {color: colors.textPrimary}]}>{serviceName}</Text>
          {!!location && (
            <View style={s.pendingLocationRow}>
              <MapPin size={12} color={colors.textSecondary} strokeWidth={2} />
              <Text style={[s.pendingLocation, {color: colors.textSecondary}]} numberOfLines={1}>{location}</Text>
            </View>
          )}
        </View>
        <View style={s.pendingPriceCol}>
          {!!price && <Text style={[s.pendingPrice, {color: colors.primary}]}>{price} ﷼</Text>}
          {!!timeStr && <Text style={[s.pendingTime, {color: colors.textSecondary}]}>{timeStr}</Text>}
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ── Biker Card ────────────────────────────────────────────────────────────────
function BikerCard({item, colors, t}) {
  const name = item.userId
    ? `${item.userId.firstName ?? ''} ${item.userId.lastName ?? ''}`.trim()
    : (item.name?.ar ?? item.name?.en ?? item.name ?? '');
  const phone = item.userId?.phoneNumber ?? '';
  const isActive = item.isActive ?? item.isOnDuty ?? false;
  const dotColor = isActive ? '#22C55E' : '#94A3B8';

  return (
    <View style={[s.bikerCard, {backgroundColor: colors.card, borderColor: colors.border}]}>
      <View style={[s.bikerAvatar, {backgroundColor: colors.primary + '20'}]}>
        <Text style={[s.bikerAvatarText, {color: colors.primary}]}>{(name.charAt(0) || '؟').toUpperCase()}</Text>
      </View>
      <View style={s.bikerTextCol}>
        <Text style={[s.bikerName, {color: colors.textPrimary}]}>{name}</Text>
        <View style={s.bikerDutyRow}>
          <View style={[s.dutyDot, {backgroundColor: dotColor}]} />
          <Text style={[s.bikerStatus, {color: colors.textSecondary}]}>
            {isActive ? t('partner.dashboard.active') : t('partner.dashboard.inactive') ?? 'غير نشط'}
          </Text>
        </View>
      </View>
      {!!phone && (
        <TouchableOpacity
          style={[s.bikerActionBtn, {backgroundColor: colors.bg, borderColor: colors.border}]}
          activeOpacity={0.75}
          onPress={() => {
            const {Linking} = require('react-native');
            Linking.openURL(`tel:${phone}`);
          }}>
          <Phone size={16} color={colors.primary} strokeWidth={2} />
        </TouchableOpacity>
      )}
    </View>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function DashboardScreen({onOrderPress}) {
  const {colors} = useTheme();
  const {t} = useI18n();
  const user = useAuthStore(s => s.user);

  const [loading, setLoading]           = useState(true);
  const [refreshing, setRefreshing]     = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const [stats, setStats]               = useState(null);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [activeBikers, setActiveBikers] = useState([]);

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    const [todayRes, bikersRes] = await Promise.all([
      getDashboardToday(),
      getStaff({role: 'BIKER', isOnDuty: true, limit: 10}),
    ]);

    if (todayRes.success) {
      const d = todayRes.data?.data ?? todayRes.data ?? {};
      setStats({
        todayRevenue:    d.todayRevenue    ?? 0,
        pendingCount:    d.pendingOrdersCount ?? 0,
        activeCount:     d.activeOrdersCount  ?? 0,
        totalOrders:     d.totalOrdersToday   ?? 0,
      });
      setPendingOrders(d.recentPendingOrders ?? []);
    }

    if (bikersRes.success) {
      const list = bikersRes.data?.data ?? bikersRes.data ?? [];
      setActiveBikers(Array.isArray(list) ? list : []);
    }

    if (!silent) setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData(true);
    setRefreshing(false);
  }, [fetchData]);

  const managerName = user
    ? `${user.firstName ?? user.name ?? ''}`.trim()
    : '';

  if (showNotifications) {
    return <NotificationsScreen onBack={() => setShowNotifications(false)} />;
  }

  return (
    <View style={[s.root, {backgroundColor: colors.bg}]}>
      {/* Top bar */}
      <View style={s.topBar}>
        <TouchableOpacity
          style={[s.topBarBtn, {backgroundColor: colors.primary + '15', borderColor: colors.primary, borderWidth: 1}]}
          activeOpacity={0.75}
          onPress={() => setShowNotifications(true)}>
          <Bell size={22} color={colors.primary} />
        </TouchableOpacity>
        <Image source={require('../../../../public/logo.png')} style={s.logo} resizeMode="contain" />
        <View style={[s.topBarBtn, {backgroundColor: colors.primary + '15', borderColor: colors.primary, borderWidth: 1}]}>
          <Text style={[s.avatarLetter, {color: colors.primary}]}>
            {(managerName.charAt(0) || 'م').toUpperCase()}
          </Text>
        </View>
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          style={s.scroll}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}>

          {/* Greeting */}
          <View style={s.greetingWrap}>
            <Text style={[s.heroGreeting, {color: colors.textSecondary}]}>
              {t('partner.dashboard.title')}{managerName ? `، ${managerName}` : ''}
            </Text>
          </View>

          {/* Hero card */}
          <View style={[s.heroCard, {backgroundColor: colors.primary}]}>
            <Text style={s.heroRevenueLabel}>{t('partner.dashboard.revenue')}</Text>
            <Text style={s.heroRevenue}>{stats?.todayRevenue ?? 0} ﷼</Text>
            <View style={s.heroStats}>
              <View style={s.heroStatItem}>
                <Text style={s.heroStatValue}>{stats?.pendingCount ?? 0}</Text>
                <Text style={s.heroStatLabel}>{t('partner.dashboard.pending')}</Text>
              </View>
              <View style={s.heroStatItem}>
                <Text style={s.heroStatValue}>{stats?.activeCount ?? 0}</Text>
                <Text style={s.heroStatLabel}>{t('partner.dashboard.active')}</Text>
              </View>
              <View style={s.heroStatItem}>
                <Text style={s.heroStatValue}>{stats?.totalOrders ?? 0}</Text>
                <Text style={s.heroStatLabel}>{t('partner.dashboard.orders')}</Text>
              </View>
            </View>
          </View>

          {/* Pending orders */}
          {pendingOrders.length > 0 && (
            <View style={s.section}>
              <Text style={[s.sectionTitle, {color: colors.textPrimary}]}>{t('partner.dashboard.pendingOrders')}</Text>
              {pendingOrders.map(item => (
                <OrderCard
                  key={item._id ?? item.id}
                  item={item}
                  colors={colors}
                  t={t}
                  onPress={onOrderPress ?? (() => {})}
                />
              ))}
            </View>
          )}

          {/* Active bikers */}
          {activeBikers.length > 0 && (
            <View style={s.section}>
              <Text style={[s.sectionTitle, {color: colors.textPrimary}]}>{t('partner.dashboard.activeBikers')}</Text>
              {activeBikers.map(item => (
                <BikerCard key={item._id} item={item} colors={colors} t={t} />
              ))}
            </View>
          )}

          <View style={s.bottomPad} />
        </ScrollView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root:             {flex: 1},
  center:           {flex: 1, alignItems: 'center', justifyContent: 'center'},
  topBar:           {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12},
  topBarBtn:        {width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center'},
  avatarLetter:     {fontSize: 15, fontWeight: '800'},
  logo:             {width: 50, height: 40},
  scroll:           {flex: 1},
  greetingWrap:     {paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8},
  heroGreeting:     {fontSize: 14, fontWeight: '500'},
  heroCard:         {marginHorizontal: 16, marginBottom: 20, borderRadius: 20, padding: 20, gap: 4},
  heroRevenueLabel: {fontSize: 13, color: 'rgba(255,255,255,0.75)', marginBottom: 2},
  heroRevenue:      {fontSize: 38, color: '#fff', fontWeight: '900', marginBottom: 20},
  heroStats:        {flexDirection: 'row', justifyContent: 'space-between', gap: 10},
  heroStatItem:     {flex: 1, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 14, paddingVertical: 12, gap: 4},
  heroStatValue:    {fontSize: 20, color: '#fff', fontWeight: '800'},
  heroStatLabel:    {fontSize: 12, color: 'rgba(255,255,255,0.8)'},
  section:          {paddingHorizontal: 16, paddingBottom: 8, marginBottom: 8},
  sectionTitle:     {fontSize: 16, fontWeight: '700', marginBottom: 12},
  pendingCard:      {borderRadius: 14, paddingHorizontal: 14, paddingTop: 10, paddingBottom: 14, borderWidth: 1, marginBottom: 10, gap: 10},
  pendingBadge:     {alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20},
  pendingBadgeText: {fontSize: 11, fontWeight: '700'},
  pendingRow:       {flexDirection: 'row', alignItems: 'center', gap: 10},
  carIconBox:       {width: 46, height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center'},
  pendingInfo:      {flex: 1, gap: 5},
  pendingService:   {fontSize: 15, fontWeight: '700'},
  pendingLocationRow:{flexDirection: 'row', alignItems: 'center', gap: 4},
  pendingLocation:  {fontSize: 12, flex: 1},
  pendingPriceCol:  {alignItems: 'flex-end', gap: 4, minWidth: 60},
  pendingPrice:     {fontSize: 14, fontWeight: '800'},
  pendingTime:      {fontSize: 11},
  bikerCard:        {flexDirection: 'row', alignItems: 'center', borderRadius: 14, padding: 14, borderWidth: 1, marginBottom: 10, gap: 12},
  bikerAvatar:      {width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center'},
  bikerAvatarText:  {fontSize: 16, fontWeight: '800'},
  bikerTextCol:     {flex: 1, gap: 4},
  bikerName:        {fontSize: 15, fontWeight: '700'},
  bikerDutyRow:     {flexDirection: 'row', alignItems: 'center', gap: 6},
  dutyDot:          {width: 7, height: 7, borderRadius: 4},
  bikerStatus:      {fontSize: 12},
  bikerActionBtn:   {width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 1},
  bottomPad:        {height: 40},
});
