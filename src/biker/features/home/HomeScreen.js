import React, {useState, useRef, useEffect, useCallback} from 'react';
import {
  ActivityIndicator, Animated, FlatList, Modal, Platform, RefreshControl,
  ScrollView, StatusBar, StyleSheet, Text,
  TouchableOpacity, View,
} from 'react-native';
import {Bell, DollarSign, Droplets, Star, MapPin, Car, CircleUserRound, ChevronDown, Check} from 'lucide-react-native';
import {useTheme} from '../../../shared/context/ThemeContext';
import {useI18n} from '../../../shared/i18n/I18nContext';
import useAuthStore from '../../../store/authStore';
import useAppStore from '../../../store/appStore';
import {getBikerProfile, setDutyStatus, getHomeStats, getBranches, getNotifications} from '../../../services/biker';
import {getOrders} from '../../../services/orders';
import NotificationsScreen from './NotificationsScreen';
import RiyalIcon from '../../../shared/components/RiyalIcon';

// ─── Service Circle Button ────────────────────────────────────────────────────
function ServiceButton({active, onToggle, loading, colors, t}) {
  const pulse = useRef(new Animated.Value(1)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (active) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, {toValue: 1.13, duration: 1600, useNativeDriver: true}),
          Animated.timing(pulse, {toValue: 1,    duration: 1600, useNativeDriver: true}),
        ])
      );
      loop.start();
      return () => loop.stop();
    } else {
      pulse.setValue(1);
    }
  }, [active, pulse]);

  const handlePress = () => {
    if (loading) return;
    Animated.sequence([
      Animated.spring(scale, {toValue: 0.93, useNativeDriver: true, tension: 120, friction: 8}),
      Animated.spring(scale, {toValue: 1,    useNativeDriver: true, tension: 80,  friction: 7}),
    ]).start();
    onToggle();
  };

  const iconColor  = active ? '#fff' : colors.primary;
  const labelColor = active ? '#fff' : colors.primary;
  const hintColor  = active ? 'rgba(255,255,255,0.75)' : colors.primary + 'BB';

  return (
    <View style={sb.wrap}>
      {active && (
        <Animated.View style={[sb.outerRing, {backgroundColor: colors.primary + '28', transform: [{scale: pulse}]}]} />
      )}
      <TouchableOpacity onPress={handlePress} activeOpacity={1} disabled={loading}>
        <Animated.View style={[
          sb.circle,
          active
            ? {backgroundColor: colors.primary, shadowColor: colors.primary, shadowOffset: {width: 0, height: 8}, shadowOpacity: 0.4, shadowRadius: 20, elevation: 10}
            : {backgroundColor: colors.card, borderWidth: 2, borderColor: colors.primary + '35', shadowColor: '#000', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4},
          {transform: [{scale}]},
        ]}>
          {loading ? (
            <ActivityIndicator size="large" color={active ? '#fff' : colors.primary} />
          ) : (
            <View style={[sb.innerCircle, {borderColor: active ? 'rgba(255,255,255,0.35)' : colors.primary + '20'}]}>
              <Bell size={32} color={iconColor} strokeWidth={active ? 2 : 1.8} />
              <Text style={[sb.statusLabel, {color: labelColor}]}>
                {active ? t('home.inService') : t('home.outOfService')}
              </Text>
              <Text style={[sb.tapHint, {color: hintColor}]}>
                {active ? t('home.tapToStop') : t('home.tapToStart')}
              </Text>
            </View>
          )}
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatItem({IconComponent, iconBg, iconColor, label, value, unit, riyalUnit, delay, colors}) {
  const translateY = useRef(new Animated.Value(20)).current;
  const opacity    = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {toValue: 1, duration: 350, delay, useNativeDriver: true}),
      Animated.spring(translateY, {toValue: 0, delay, useNativeDriver: true, tension: 65, friction: 9}),
    ]).start();
  }, [delay, opacity, translateY]);

  return (
    <Animated.View style={[st.wrap, {backgroundColor: colors.card, opacity, transform: [{translateY}]}]}>
      <View style={[st.iconBox, {backgroundColor: iconBg}]}>
        <IconComponent size={18} color={iconColor} strokeWidth={2} />
      </View>
      <View style={st.valueRow}>
        {riyalUnit ? <RiyalIcon size={18} color={colors.textPrimary} style={st.unitIcon} /> : null}
        {unit ? <Text style={[st.unit, {color: colors.textPrimary}]}>{unit} </Text> : null}
        <Text style={[st.value, {color: colors.textPrimary}]}>{value}</Text>
      </View>
      <Text style={[st.label, {color: colors.textSecondary}]}>{label}</Text>
    </Animated.View>
  );
}

// ─── Branch Picker Modal ──────────────────────────────────────────────────────
function BranchPicker({branches, selectedId, onSelect, colors, t}) {
  const [visible, setVisible] = useState(false);
  const selected = branches.find(b => b._id === selectedId);

  const keyExtractor = useCallback(b => b._id, []);
  const renderItem = useCallback(({item}) => (
    <TouchableOpacity
      style={[bp.row, {borderBottomColor: colors.border}]}
      onPress={() => { onSelect(item._id); setVisible(false); }}
      activeOpacity={0.7}>
      <Text style={[bp.rowText, {color: colors.textPrimary}]}>{item.name}</Text>
      {item._id === selectedId && <Check size={16} color={colors.primary} strokeWidth={2.5} />}
    </TouchableOpacity>
  ), [colors.border, colors.textPrimary, colors.primary, onSelect, selectedId]);

  return (
    <>
      <TouchableOpacity
        style={[bp.trigger, {backgroundColor: colors.card, borderColor: colors.border}]}
        onPress={() => setVisible(true)}
        activeOpacity={0.8}>
        <MapPin size={15} color={colors.primary} strokeWidth={2} />
        <Text style={[bp.triggerText, {color: colors.textPrimary}]} numberOfLines={1}>
          {selected ? selected.name : t('home.selectBranch')}
        </Text>
        <ChevronDown size={15} color={colors.textSecondary} strokeWidth={2} />
      </TouchableOpacity>

      <Modal visible={visible} transparent animationType="slide" onRequestClose={() => setVisible(false)}>
        <TouchableOpacity style={bp.overlay} activeOpacity={1} onPress={() => setVisible(false)} />
        <View style={[bp.sheet, {backgroundColor: colors.card}]}>
          <View style={[bp.handle, {backgroundColor: colors.border}]} />
          <Text style={[bp.sheetTitle, {color: colors.textPrimary}]}>{t('home.selectBranch')}</Text>
          <FlatList
            data={branches}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            ListEmptyComponent={
              <Text style={[bp.empty, {color: colors.textSecondary}]}>{t('home.noBranches')}</Text>
            }
          />
        </View>
      </Modal>
    </>
  );
}

// ─── New Order Card ───────────────────────────────────────────────────────────
function NewOrderCard({order, colors, t, onPress, onLocationPress}) {
  // client — new: client.name  |  legacy: firstName + lastName
  const clientName = order.client?.name
    ?? (order.client ? `${order.client.firstName ?? ''} ${order.client.lastName ?? ''}`.trim() : '');
  // car — new: car.brand/model/plateNumber  |  legacy: userCar.brand.name
  // brand/model might come as {ar,en} objects from some backends
  const strVal = v => (!v ? '' : typeof v === 'string' ? v : v.ar ?? v.en ?? '');
  const brand = strVal(order.car?.brand) || strVal(order.userCar?.brand?.name);
  const model = strVal(order.car?.model) || strVal(order.userCar?.model?.name);
  const plate = order.car?.plateNumber ?? order.userCar?.plateNumber ?? '';
  // address — new: location.addressText  |  legacy: addressSnapshot
  const address = order.location?.addressText
    ?? order.addressSnapshot?.addressText
    ?? order.addressSnapshot?.district
    ?? order.branch?.address
    ?? order.address
    ?? '';
  // service — new: services[0].name  |  legacy: itemsSnapshot[0].nameSnapshot
  const firstSvc    = order.services?.[0];
  const firstItem   = order.itemsSnapshot?.[0];
  const serviceName = strVal(firstSvc?.name)
    || strVal(firstItem?.nameSnapshot)
    || strVal(order.service?.name);

  return (
    <View style={[nc.card, {backgroundColor: colors.card, borderColor: colors.border}]}>
      <View style={nc.topRow}>
        <Text style={[nc.serviceName, {color: colors.textPrimary}]}>{serviceName}</Text>
      </View>
      <TouchableOpacity style={nc.addrRow} onPress={onLocationPress} activeOpacity={0.7}>
        <Text style={[nc.addr, {color: colors.textSecondary}]} numberOfLines={1}>{address}</Text>
        <MapPin size={13} color={colors.primary} strokeWidth={2} />
      </TouchableOpacity>
      <View style={[nc.divider, {backgroundColor: colors.border}]} />
      <View style={nc.metaRow}>
        <View style={nc.metaItem}>
          <View style={[nc.metaIconBox, {backgroundColor: colors.bg}]}>
            <CircleUserRound size={15} color={colors.textSecondary} strokeWidth={1.8} />
          </View>
          <View>
            <Text style={[nc.metaLabel, {color: colors.textSecondary}]}>{t('orderMap.customer')}</Text>
            <Text style={[nc.metaValue, {color: colors.textPrimary}]}>{clientName}</Text>
          </View>
        </View>
        <View style={nc.metaItem}>
          <View style={[nc.metaIconBox, {backgroundColor: colors.primary + '15'}]}>
            <Car size={15} color={colors.primary} strokeWidth={1.8} />
          </View>
          <View>
            <Text style={[nc.metaLabel, {color: colors.textSecondary}]}>{t('orders.fields.carType')}</Text>
            <Text style={[nc.metaValue, {color: colors.textPrimary}]}>{brand} {model}{plate ? ` | ${plate}` : ''}</Text>
          </View>
        </View>
      </View>
      <TouchableOpacity style={[nc.btn, {backgroundColor: colors.primary}]} onPress={onPress} activeOpacity={0.85}>
        <Text style={nc.btnText}>{t('orderDetails.actions.ASSIGNED')}</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const {colors, isDark} = useTheme();
  const {t} = useI18n();
  const user                = useAuthStore(s => s.user);
  const showToast           = useAppStore(s => s.showToast);
  const setPendingOrderNav  = useAppStore(s => s.setPendingOrderNav);

  const [loading, setLoading]             = useState(true);
  const [active, setActive]               = useState(false);
  const [dutyLoading, setDutyLoading]     = useState(false);
  const [refreshing, setRefreshing]       = useState(false);
  const [showNotifications, setShowNotif] = useState(false);
  const [orders, setOrders]               = useState([]);
  const [profile, setProfile]             = useState(null);
  const [stats, setStats]                 = useState({weeklyEarnings: 0, ordersCount: 0, rating: 0});
  const [branches, setBranches]           = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [unreadCount, setUnreadCount]     = useState(0);

  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerY       = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerOpacity, {toValue: 1, duration: 400, useNativeDriver: true}),
      Animated.spring(headerY, {toValue: 0, useNativeDriver: true, tension: 60, friction: 9}),
    ]).start();
  }, [headerOpacity, headerY]);

  const selectedBranchRef = useRef(null);

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    const results = await Promise.allSettled([
      getBikerProfile(),
      getOrders({filter: 'active', limit: 10}),
      getHomeStats(),
      getBranches(),
      getNotifications({page: 1, limit: 1}),
    ]);

    const [profileRes, ordersRes, statsRes, branchesRes, notifRes] = results.map(r =>
      r.status === 'fulfilled' ? r.value : {success: false},
    );

    if (profileRes.success) {
      const p = profileRes.data?.data ?? profileRes.data ?? {};
      setProfile(p);
      setActive(p.isActive ?? p.isOnDuty ?? false);
    }

    if (ordersRes.success) {
      const data = ordersRes.data?.data ?? ordersRes.data ?? [];
      setOrders(Array.isArray(data) ? data : []);
    }

    if (statsRes.success) {
      const d = statsRes.data?.data ?? statsRes.data ?? {};
      setStats({
        weeklyEarnings: d.weeklyEarnings ?? 0,
        ordersCount:    d.ordersCount    ?? 0,
        rating:         d.rating         ?? 0,
      });
    }

    if (branchesRes.success) {
      const list = branchesRes.data?.data ?? branchesRes.data ?? [];
      setBranches(Array.isArray(list) ? list : []);
      if (list.length > 0 && !selectedBranchRef.current) {
        selectedBranchRef.current = list[0]._id;
        setSelectedBranch(list[0]._id);
      }
    }

    if (notifRes.success) {
      const list = Array.isArray(notifRes.data)
        ? notifRes.data
        : Array.isArray(notifRes.data?.data) ? notifRes.data.data : [];
      const count = notifRes.data?.unreadCount
        ?? list.filter(n => !(n.isRead ?? n.read ?? (n.readAt != null))).length;
      setUnreadCount(count);
    }

    const anyFailed = results.some(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value?.success));
    if (anyFailed && !silent) showToast(t('common.loadError') ?? 'تعذّر تحميل البيانات', 'error');

    setLoading(false);
  }, [showToast, t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData(true);
    setRefreshing(false);
  }, [fetchData]);

  const handleToggleDuty = useCallback(async () => {
    const prev = active;
    setActive(!prev);
    setDutyLoading(true);
    const res = await setDutyStatus(!prev);
    if (res.success) {
      const profileRes = await getBikerProfile();
      if (profileRes.success && profileRes.data?.data) {
        const p = profileRes.data.data;
        setProfile(p);
        setActive(p.isActive ?? p.isOnDuty ?? !prev);
      }
    } else {
      setActive(prev);
      showToast(t('common.actionError') ?? 'فشل تغيير حالة الخدمة', 'error');
    }
    setDutyLoading(false);
  }, [active, showToast, t]);

  const renderOrder = useCallback(({item}) => (
    <NewOrderCard
      order={item}
      colors={colors}
      t={t}
      onPress={() => setPendingOrderNav({type: 'detail', order: item})}
      onLocationPress={() => setPendingOrderNav({type: 'map', order: item})}
    />
  ), [colors, t, setPendingOrderNav]);

  const displayName = profile
    ? (profile.name ?? `${profile.firstName ?? ''} ${profile.lastName ?? ''}`.trim())
    : (user?.name ?? '');

  const avatarLetter   = displayName.charAt(0) || '؟';
  const weeklyEarnings = stats.weeklyEarnings;
  const ordersCount    = stats.ordersCount;
  const rating         = stats.rating;

  const handleCloseNotifications = useCallback(() => {
    setShowNotif(false);
  }, []);

  if (showNotifications) {
    return (
      <NotificationsScreen
        onBack={handleCloseNotifications}
        onUnreadCountChange={setUnreadCount}
      />
    );
  }

  return (
    <View style={[s.root, {backgroundColor: colors.bg}]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.bg} />

      <Animated.View style={[s.header, {backgroundColor: colors.bg, opacity: headerOpacity, transform: [{translateY: headerY}]}]}>
        <View style={s.avatarBox}>
          <View style={[s.avatar, {backgroundColor: colors.primary}]}>
            <Text style={s.avatarText}>{avatarLetter}</Text>
          </View>
          <Text style={[s.userName, {color: colors.textPrimary}]}>{displayName}</Text>
        </View>
        <TouchableOpacity style={[s.notifBtn, {backgroundColor: colors.card}]} onPress={() => setShowNotif(true)} activeOpacity={0.7}>
          <Bell size={20} color={colors.textSecondary} strokeWidth={1.8} />
          {unreadCount > 0 && (
            <View style={[s.badge, {backgroundColor: colors.error ?? '#EF4444'}]}>
              <Text style={s.badgeText}>{unreadCount > 99 ? '99+' : `${unreadCount}`}</Text>
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>

      {loading ? (
        <View style={s.skeletonRoot}>
          <View style={[s.skeletonCircle, {backgroundColor: colors.card}]} />
          <View style={[s.skeletonPill,   {backgroundColor: colors.card}]} />
          <View style={s.statsRow}>
            {[0,1,2].map(i => (
              <View key={i} style={[st.wrap, {backgroundColor: colors.card, flex: 1}]}>
                <View style={[s.skeletonIconBox, {backgroundColor: colors.border}]} />
                <View style={[s.skeletonLine, {width: 40, backgroundColor: colors.border}]} />
                <View style={[s.skeletonLine, {width: 60, backgroundColor: colors.border}]} />
              </View>
            ))}
          </View>
          <View style={[s.skeletonCard, {backgroundColor: colors.card, borderColor: colors.border}]} />
          <View style={[s.skeletonCard, {backgroundColor: colors.card, borderColor: colors.border}]} />
          <ActivityIndicator size="small" color={colors.primary} style={{marginTop: 8}} />
        </View>
      ) : (
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}>

        <ServiceButton active={active} onToggle={handleToggleDuty} loading={dutyLoading} colors={colors} t={t} />

        <View style={[s.statusPill, {backgroundColor: colors.card, borderColor: colors.border}]}>
          <View style={[s.statusDot, {backgroundColor: active ? colors.success : colors.textSecondary}]} />
          <Text style={[s.statusPillText, {color: colors.textSecondary}]}>
            {active ? t('home.activeNow') : t('home.noOrders')}
          </Text>
        </View>
        <Text style={[s.statusHint, {color: colors.textSecondary}]}>
          {t('home.hint')}
        </Text>

        <View style={s.statsRow}>
          <StatItem
            IconComponent={DollarSign}
            iconBg={colors.success + '20'} iconColor={colors.success}
            label={t('home.earnings')} value={`${weeklyEarnings}`} riyalUnit
            delay={200} colors={colors}
          />
          <StatItem
            IconComponent={Droplets}
            iconBg={colors.primary + '18'} iconColor={colors.primary}
            label={t('home.orders')} value={`${ordersCount}`}
            delay={300} colors={colors}
          />
          <StatItem
            IconComponent={Star}
            iconBg="#F59E0B20" iconColor="#F59E0B"
            label={t('home.rating')} value={rating ? rating.toFixed(1) : '0.0'}
            delay={400} colors={colors}
          />
        </View>


        {/* Branch Selector */}
        {branches.length > 0 && (
          <View style={[s.branchSection, {paddingHorizontal: 20}]}>
            <BranchPicker
              branches={branches}
              selectedId={selectedBranch}
              onSelect={id => { selectedBranchRef.current = id; setSelectedBranch(id); }}
              colors={colors}
              t={t}
            />
          </View>
        )}

        {active && orders.length > 0 && (
          <View style={s.section}>
            <View style={s.sectionHeader}>
              <Text style={[s.sectionTitle, {color: colors.textPrimary}]}>{t('home.newOrder')}</Text>
              <TouchableOpacity activeOpacity={0.7}>
                <Text style={[s.seeAll, {color: colors.primary}]}>{t('home.viewAll')}</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={orders}
              keyExtractor={i => i._id}
              renderItem={renderOrder}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={s.orderList}
              scrollEnabled={false}
            />
          </View>
        )}

        {!active && (
          <View style={[s.offlineCard, {backgroundColor: colors.card, borderColor: colors.border}]}>
            <Text style={[s.offlineTitle, {color: colors.textPrimary}]}>{t('home.outOfService')}</Text>
            <Text style={[s.offlineSub, {color: colors.textSecondary}]}>{t('home.tapToStart')}</Text>
          </View>
        )}

        <View style={{height: 24}} />
      </ScrollView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root:          {flex: 1},
  header:        {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 56 : 48, paddingBottom: 14,
    paddingHorizontal: 20,
  },
  avatarBox:     {flexDirection: 'row', alignItems: 'center', gap: 10},
  avatar:        {width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center'},
  avatarText:    {color: '#fff', fontSize: 16, fontWeight: '800'},
  userName:      {fontSize: 16, fontWeight: '700'},
  notifBtn:      {width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.08, elevation: 3},
  badge:         {position: 'absolute', top: 0, right: 0, minWidth: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3},
  badgeText:     {color: '#fff', fontSize: 9, fontWeight: '800'},
  scroll:        {flex: 1},
  scrollContent: {paddingBottom: 16, alignItems: 'center'},
  statusPill:    {flexDirection: 'row', alignItems: 'center', gap: 7, borderWidth: 1, borderRadius: 30, paddingHorizontal: 18, paddingVertical: 9, marginTop: 16},
  statusDot:     {width: 7, height: 7, borderRadius: 3.5},
  statusPillText:{fontSize: 13, fontWeight: '500'},
  statusHint:    {fontSize: 12, textAlign: 'center', marginTop: 10, marginBottom: 22, paddingHorizontal: 28, lineHeight: 19},
  statsRow:      {flexDirection: 'row', gap: 10, marginBottom: 20, paddingHorizontal: 20, width: '100%'},
  walletCard:    {marginHorizontal: 20, marginBottom: 16, borderRadius: 20, padding: 18, borderWidth: 1, width: '100%', gap: 8, alignSelf: 'stretch'},
  walletTop:     {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'},
  walletLabel:   {fontSize: 12, fontWeight: '500'},
  walletCurrency:{fontSize: 12, fontWeight: '600'},
  walletAmount:  {fontSize: 28, fontWeight: '900'},
  walletDivider: {height: 1},
  walletRow:     {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'},
  walletSubLabel:{fontSize: 12},
  walletSubValue:{fontSize: 14, fontWeight: '700'},
  branchSection: {width: '100%', marginBottom: 20},
  section:       {width: '100%', paddingHorizontal: 20, marginBottom: 16},
  sectionHeader: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12},
  sectionTitle:  {fontSize: 17, fontWeight: '700'},
  seeAll:        {fontSize: 13, fontWeight: '600'},
  orderList:     {gap: 12},
  offlineCard:   {marginHorizontal: 20, marginTop: 8, borderRadius: 20, padding: 28, alignItems: 'center', gap: 6, borderWidth: 1},
  offlineTitle:  {fontSize: 16, fontWeight: '700'},
  offlineSub:    {fontSize: 13, textAlign: 'center'},
  skeletonRoot:  {flex: 1, alignItems: 'center', paddingTop: 32, paddingHorizontal: 20},
  skeletonCircle:{width: 190, height: 190, borderRadius: 95, marginBottom: 20},
  skeletonPill:  {width: 140, height: 34, borderRadius: 30, marginBottom: 22},
  skeletonIconBox:{width: 40, height: 40, borderRadius: 20, marginBottom: 8},
  skeletonLine:  {height: 12, borderRadius: 6, marginBottom: 6},
  skeletonCard:  {width: '100%', height: 120, borderRadius: 18, borderWidth: 1, marginBottom: 12},
});

const sb = StyleSheet.create({
  wrap:        {alignItems: 'center', justifyContent: 'center', marginTop: 32, marginBottom: 20},
  outerRing:   {position: 'absolute', width: 222, height: 222, borderRadius: 111},
  circle:      {width: 190, height: 190, borderRadius: 95, alignItems: 'center', justifyContent: 'center'},
  innerCircle: {width: 160, height: 160, borderRadius: 80, borderWidth: 2, alignItems: 'center', justifyContent: 'center', gap: 6},
  statusLabel: {fontSize: 17, fontWeight: '800'},
  tapHint:     {fontSize: 11},
});

const st = StyleSheet.create({
  wrap:     {flex: 1, borderRadius: 18, padding: 14, alignItems: 'center', gap: 4, shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.06, elevation: 2},
  iconBox:  {width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 2},
  valueRow: {flexDirection: 'row', alignItems: 'flex-end'},
  unit:     {fontSize: 12, fontWeight: '700', marginBottom: 2},
  unitIcon: {marginBottom: 2, marginRight: 2},
  value:    {fontSize: 20, fontWeight: '900'},
  label:    {fontSize: 11, fontWeight: '500'},
});

const bp = StyleSheet.create({
  trigger:     {flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 14, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 12},
  triggerText: {flex: 1, fontSize: 14, fontWeight: '600'},
  overlay:     {flex: 1, backgroundColor: 'rgba(0,0,0,0.4)'},
  sheet:       {borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '60%'},
  handle:      {width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 16},
  sheetTitle:  {fontSize: 17, fontWeight: '700', marginBottom: 12},
  row:         {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: 1},
  rowText:     {fontSize: 15},
  empty:       {textAlign: 'center', paddingTop: 24, fontSize: 14},
});

const nc = StyleSheet.create({
  card:        {borderRadius: 18, padding: 16, borderWidth: 1, shadowColor: '#000', shadowOffset: {width: 0, height: 3}, shadowOpacity: 0.07, elevation: 3, gap: 12},
  topRow:      {flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between'},
  serviceName: {fontSize: 16, fontWeight: '700', flex: 1, paddingLeft: 8},
  addrRow:     {flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 5},
  addr:        {fontSize: 12},
  divider:     {height: 1},
  metaRow:     {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'},
  metaItem:    {flexDirection: 'row', alignItems: 'center', gap: 8},
  metaIconBox: {width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center'},
  metaLabel:   {fontSize: 10},
  metaValue:   {fontSize: 13, fontWeight: '700'},
  btn:         {borderRadius: 14, paddingVertical: 15, alignItems: 'center', justifyContent: 'center'},
  btnText:     {color: '#fff', fontSize: 15, fontWeight: '700'},
});
