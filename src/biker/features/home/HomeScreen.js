import React, {useState, useRef, useEffect, useCallback} from 'react';
import {
  Animated, FlatList, Platform, RefreshControl,
  ScrollView, StatusBar, StyleSheet, Text,
  TouchableOpacity, View,
} from 'react-native';
import {Bell, DollarSign, Droplets, Star, MapPin, Car, CircleUserRound} from 'lucide-react-native';
import {useTheme} from '../../../shared/context/ThemeContext';
import {useI18n} from '../../../shared/i18n/I18nContext';
import {MOCK_USER, MOCK_ORDERS} from '../../../shared/data/mockData';

// ─── Service Circle Button ────────────────────────────────────────────────────
function ServiceButton({active, onToggle, colors, t}) {
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
      <TouchableOpacity onPress={handlePress} activeOpacity={1}>
        <Animated.View style={[
          sb.circle,
          active
            ? {backgroundColor: colors.primary, shadowColor: colors.primary, shadowOffset: {width: 0, height: 8}, shadowOpacity: 0.4, shadowRadius: 20, elevation: 10}
            : {backgroundColor: colors.card, borderWidth: 2, borderColor: colors.primary + '35', shadowColor: '#000', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4},
          {transform: [{scale}]},
        ]}>
          <View style={[sb.innerCircle, {borderColor: active ? 'rgba(255,255,255,0.35)' : colors.primary + '20'}]}>
            <Bell size={32} color={iconColor} strokeWidth={active ? 2 : 1.8} />
            <Text style={[sb.statusLabel, {color: labelColor}]}>
              {active ? t('home.inService') : t('home.outOfService')}
            </Text>
            <Text style={[sb.tapHint, {color: hintColor}]}>
              {active ? t('home.tapToStop') : t('home.tapToStart')}
            </Text>
          </View>
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatItem({IconComponent, iconBg, iconColor, label, value, unit, delay, colors}) {
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
        {unit ? <Text style={[st.unit, {color: colors.textPrimary}]}>{unit} </Text> : null}
        <Text style={[st.value, {color: colors.textPrimary}]}>{value}</Text>
      </View>
      <Text style={[st.label, {color: colors.textSecondary}]}>{label}</Text>
    </Animated.View>
  );
}

// ─── New Order Card ───────────────────────────────────────────────────────────
function NewOrderCard({order, colors}) {
  return (
    <View style={[nc.card, {backgroundColor: colors.card, borderColor: colors.border}]}>
      <View style={nc.topRow}>
        <Text style={[nc.serviceName, {color: colors.textPrimary}]}>{order.service.name}</Text>
      </View>
      <View style={nc.addrRow}>
        <Text style={[nc.addr, {color: colors.textSecondary}]} numberOfLines={1}>{order.address}</Text>
        <MapPin size={13} color={colors.textSecondary} strokeWidth={2} />
      </View>
      <View style={[nc.divider, {backgroundColor: colors.border}]} />
      <View style={nc.metaRow}>
        <View style={nc.metaItem}>
          <View style={[nc.metaIconBox, {backgroundColor: colors.bg}]}>
            <CircleUserRound size={15} color={colors.textSecondary} strokeWidth={1.8} />
          </View>
          <View>
            <Text style={[nc.metaLabel, {color: colors.textSecondary}]}>اللوحة</Text>
            <Text style={[nc.metaValue, {color: colors.textPrimary}]}>{order.car.plateNumber}</Text>
          </View>
        </View>
        <View style={nc.metaItem}>
          <View style={[nc.metaIconBox, {backgroundColor: colors.primary + '15'}]}>
            <Car size={15} color={colors.primary} strokeWidth={1.8} />
          </View>
          <View>
            <Text style={[nc.metaLabel, {color: colors.textSecondary}]}>نوع السيارة</Text>
            <Text style={[nc.metaValue, {color: colors.textPrimary}]}>{order.car.brand} {order.car.model}</Text>
          </View>
        </View>
      </View>
      <TouchableOpacity style={[nc.btn, {backgroundColor: colors.primary}]} activeOpacity={0.85}>
        <Text style={nc.btnText}>بدء الغسيل</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const {colors, isDark} = useTheme();
  const {t} = useI18n();
  const [active, setActive] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerY       = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerOpacity, {toValue: 1, duration: 400, useNativeDriver: true}),
      Animated.spring(headerY, {toValue: 0, useNativeDriver: true, tension: 60, friction: 9}),
    ]).start();
  }, [headerOpacity, headerY]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const renderOrder = useCallback(({item}) => <NewOrderCard order={item} colors={colors} />, [colors]);

  return (
    <View style={[s.root, {backgroundColor: colors.bg}]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.bg} />

      <Animated.View style={[s.header, {backgroundColor: colors.bg, opacity: headerOpacity, transform: [{translateY: headerY}]}]}>
        <View style={s.avatarBox}>
          <View style={[s.avatar, {backgroundColor: colors.primary}]}>
            <Text style={s.avatarText}>{MOCK_USER.firstName.charAt(0)}</Text>
          </View>
          <Text style={[s.userName, {color: colors.textPrimary}]}>{MOCK_USER.firstName} {MOCK_USER.lastName}</Text>
        </View>
        <TouchableOpacity style={[s.notifBtn, {backgroundColor: colors.card}]} activeOpacity={0.7}>
          <Bell size={20} color={colors.textSecondary} strokeWidth={1.8} />
        </TouchableOpacity>
      </Animated.View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}>

        <ServiceButton active={active} onToggle={() => setActive(v => !v)} colors={colors} t={t} />

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
            label={t('home.earnings')} value={`${MOCK_USER.wallet.weeklyEarnings}`} unit="﷼"
            delay={200} colors={colors}
          />
          <StatItem
            IconComponent={Droplets}
            iconBg={colors.primary + '18'} iconColor={colors.primary}
            label={t('home.ordersCount')} value={`${MOCK_ORDERS.length}`}
            delay={300} colors={colors}
          />
          <StatItem
            IconComponent={Star}
            iconBg="#F59E0B20" iconColor="#F59E0B"
            label={t('home.rating')} value={`${MOCK_USER.rating}`}
            delay={400} colors={colors}
          />
        </View>

        {active && MOCK_ORDERS.length > 0 && (
          <View style={s.section}>
            <View style={s.sectionHeader}>
              <Text style={[s.sectionTitle, {color: colors.textPrimary}]}>{t('home.newOrder')}</Text>
              <TouchableOpacity activeOpacity={0.7}>
                <Text style={[s.seeAll, {color: colors.primary}]}>{t('home.seeAll')}</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={MOCK_ORDERS}
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
  scroll:        {flex: 1},
  scrollContent: {paddingBottom: 16, alignItems: 'center'},
  statusPill:    {flexDirection: 'row', alignItems: 'center', gap: 7, borderWidth: 1, borderRadius: 30, paddingHorizontal: 18, paddingVertical: 9, marginTop: 16},
  statusDot:     {width: 7, height: 7, borderRadius: 3.5},
  statusPillText:{fontSize: 13, fontWeight: '500'},
  statusHint:    {fontSize: 12, textAlign: 'center', marginTop: 10, marginBottom: 22, paddingHorizontal: 28, lineHeight: 19},
  statsRow:      {flexDirection: 'row', gap: 10, marginBottom: 24, paddingHorizontal: 20, width: '100%'},
  section:       {width: '100%', paddingHorizontal: 20, marginBottom: 16},
  sectionHeader: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12},
  sectionTitle:  {fontSize: 17, fontWeight: '700'},
  seeAll:        {fontSize: 13, fontWeight: '600'},
  orderList:     {gap: 12},
  offlineCard:   {marginHorizontal: 20, marginTop: 8, borderRadius: 20, padding: 28, alignItems: 'center', gap: 6, borderWidth: 1},
  offlineTitle:  {fontSize: 16, fontWeight: '700'},
  offlineSub:    {fontSize: 13, textAlign: 'center'},
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
  value:    {fontSize: 20, fontWeight: '900'},
  label:    {fontSize: 11, fontWeight: '500'},
});

const nc = StyleSheet.create({
  card:        {borderRadius: 18, padding: 16, borderWidth: 1, shadowColor: '#000', shadowOffset: {width: 0, height: 3}, shadowOpacity: 0.07, elevation: 3, gap: 12},
  topRow:      {flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between'},
  serviceName: {fontSize: 16, fontWeight: '700', textAlign: 'right', flex: 1, paddingLeft: 8},
  addrRow:     {flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 5},
  addr:        {fontSize: 12, textAlign: 'right'},
  divider:     {height: 1},
  metaRow:     {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'},
  metaItem:    {flexDirection: 'row', alignItems: 'center', gap: 8},
  metaIconBox: {width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center'},
  metaLabel:   {fontSize: 10, textAlign: 'right'},
  metaValue:   {fontSize: 13, fontWeight: '700', textAlign: 'right'},
  btn:         {borderRadius: 14, paddingVertical: 15, alignItems: 'center', justifyContent: 'center'},
  btnText:     {color: '#fff', fontSize: 15, fontWeight: '700'},
});
