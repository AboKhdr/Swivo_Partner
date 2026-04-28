import React, {useState, useRef, useEffect, useCallback} from 'react';
import {
  Animated, FlatList, Platform, RefreshControl,
  ScrollView, StatusBar, StyleSheet, Text,
  TouchableOpacity, View,
} from 'react-native';
import {Bell, DollarSign, Droplets, Star, MapPin, Car, CircleUserRound} from 'lucide-react-native';
import {Colors} from '../../../shared/constants/colors';
import {MOCK_USER, MOCK_ORDERS} from '../../../shared/data/mockData';

// ─── Service Circle Button ────────────────────────────────────────────────────
function ServiceButton({active, onToggle}) {
  const pulse = useRef(new Animated.Value(1)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (active) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, {toValue: 1.13, duration: 1600, useNativeDriver: true}),
          Animated.timing(pulse, {toValue: 1, duration: 1600, useNativeDriver: true}),
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
      Animated.spring(scale, {toValue: 1, useNativeDriver: true, tension: 80, friction: 7}),
    ]).start();
    onToggle();
  };

  const iconColor  = active ? '#fff' : Colors.primary;
  const labelColor = active ? '#fff' : Colors.primary;
  const hintColor  = active ? 'rgba(255,255,255,0.75)' : Colors.primary + 'BB';

  return (
    <View style={sb.wrap}>
      {active && (
        <Animated.View style={[sb.outerRing, {transform: [{scale: pulse}]}]} />
      )}
      <TouchableOpacity onPress={handlePress} activeOpacity={1}>
        <Animated.View style={[
          sb.circle,
          active ? sb.circleActive : sb.circleInactive,
          {transform: [{scale}]},
        ]}>
          <View style={[sb.innerCircle, !active && sb.innerCircleInactive]}>
            <Bell size={32} color={iconColor} strokeWidth={active ? 2 : 1.8} />
            <Text style={[sb.statusLabel, {color: labelColor}]}>
              {active ? 'في الخدمة' : 'خارج الخدمة'}
            </Text>
            <Text style={[sb.tapHint, {color: hintColor}]}>
              {active ? 'انقر لإيقاف الخدمة' : 'انقر لبدء الخدمة'}
            </Text>
          </View>
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatItem({IconComponent, iconBg, iconColor, label, value, unit, delay}) {
  const translateY = useRef(new Animated.Value(20)).current;
  const opacity    = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {toValue: 1, duration: 350, delay, useNativeDriver: true}),
      Animated.spring(translateY, {toValue: 0, delay, useNativeDriver: true, tension: 65, friction: 9}),
    ]).start();
  }, [delay, opacity, translateY]);

  return (
    <Animated.View style={[st.wrap, {opacity, transform: [{translateY}]}]}>
      <View style={[st.iconBox, {backgroundColor: iconBg}]}>
        <IconComponent size={18} color={iconColor} strokeWidth={2} />
      </View>
      <View style={st.valueRow}>
        {unit ? <Text style={st.unit}>{unit} </Text> : null}
        <Text style={st.value}>{value}</Text>
      </View>
      <Text style={st.label}>{label}</Text>
    </Animated.View>
  );
}

// ─── Order Card ───────────────────────────────────────────────────────────────
function NewOrderCard({order}) {
  return (
    <View style={nc.card}>
      <View style={nc.topRow}>
        <Text style={nc.serviceName}>{order.service.name}</Text>
      </View>
      <View style={nc.addrRow}>
        <Text style={nc.addr} numberOfLines={1}>{order.address}</Text>
        <MapPin size={13} color={Colors.textSecondary} strokeWidth={2} />
      </View>
      <View style={nc.divider} />
      <View style={nc.metaRow}>
        <View style={nc.metaItem}>
          <View style={nc.metaIconBox}>
            <CircleUserRound size={15} color={Colors.textSecondary} strokeWidth={1.8} />
          </View>
          <View>
            <Text style={nc.metaLabel}>اللوحة</Text>
            <Text style={nc.metaValue}>{order.car.plateNumber}</Text>
          </View>
        </View>
        <View style={nc.metaItem}>
          <View style={[nc.metaIconBox, nc.metaIconBoxCar]}>
            <Car size={15} color={Colors.primary} strokeWidth={1.8} />
          </View>
          <View>
            <Text style={nc.metaLabel}>نوع السيارة</Text>
            <Text style={nc.metaValue}>{order.car.brand} {order.car.model}</Text>
          </View>
        </View>
      </View>
      <TouchableOpacity style={nc.btn} activeOpacity={0.85}>
        <Text style={nc.btnText}>بدء الغسيل</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function HomeScreen() {
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

  const renderOrder = useCallback(({item}) => <NewOrderCard order={item} />, []);

  return (
    <View style={s.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F7FA" />

      {/* Header */}
      <Animated.View style={[s.header, {opacity: headerOpacity, transform: [{translateY: headerY}]}]}>
        <View style={s.avatarBox}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{MOCK_USER.firstName.charAt(0)}</Text>
          </View>
          <Text style={s.userName}>{MOCK_USER.firstName} {MOCK_USER.lastName}</Text>
        </View>
        <TouchableOpacity style={s.notifBtn} activeOpacity={0.7}>
          <Bell size={20} color={Colors.textSecondary} strokeWidth={1.8} />
        </TouchableOpacity>
      </Animated.View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}>

        {/* Service Toggle */}
        <ServiceButton active={active} onToggle={() => setActive(v => !v)} />

        {/* Status pill */}
        <View style={s.statusPill}>
          <View style={[s.statusDot, active && {backgroundColor: Colors.success}]} />
          <Text style={s.statusPillText}>
            {active ? 'نشط الان لاستقبال اي طلب' : 'لن يتم استلام أي طلب'}
          </Text>
        </View>
        <Text style={s.statusHint}>
          {'انقر على الزر الأعلى لتغيير حالتك واستلام الطلبات لبدء العمل .'}
        </Text>

        {/* Stats Row */}
        <View style={s.statsRow}>
          <StatItem
            IconComponent={DollarSign}
            iconBg="#E6F8F1" iconColor="#22C55E"
            label="الإيرادات" value={`${MOCK_USER.wallet.weeklyEarnings}`} unit="﷼"
            delay={200}
          />
          <StatItem
            IconComponent={Droplets}
            iconBg="#E8F2FF" iconColor={Colors.primary}
            label="الطلبات" value={`${MOCK_ORDERS.length}`}
            delay={300}
          />
          <StatItem
            IconComponent={Star}
            iconBg="#FFF8E1" iconColor="#F59E0B"
            label="تقييم" value={`${MOCK_USER.rating}`}
            delay={400}
          />
        </View>

        {/* Active orders */}
        {active && MOCK_ORDERS.length > 0 && (
          <View style={s.section}>
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>طلب جديد قادم</Text>
              <TouchableOpacity activeOpacity={0.7}>
                <Text style={s.seeAll}>عرض الكل</Text>
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
          <View style={s.offlineCard}>
            <Text style={s.offlineTitle}>أنت خارج الخدمة</Text>
            <Text style={s.offlineSub}>اضغط الزر أعلاه لبدء استقبال الطلبات</Text>
          </View>
        )}

        <View style={{height: 24}} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: {flex: 1, backgroundColor: '#F5F7FA'},
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 56 : 48, paddingBottom: 14,
    paddingHorizontal: 20, backgroundColor: '#F5F7FA',
  },
  avatarBox: {flexDirection: 'row', alignItems: 'center', gap: 10},
  avatar: {width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center'},
  avatarText: {color: '#fff', fontSize: 16, fontWeight: '800'},
  userName: {fontSize: 16, fontWeight: '700', color: Colors.textPrimary},
  notifBtn: {width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.08, elevation: 3},
  scroll: {flex: 1},
  scrollContent: {paddingBottom: 16, alignItems: 'center'},
  statusPill: {flexDirection: 'row', alignItems: 'center', gap: 7, borderWidth: 1.2, borderColor: '#D1D5DB', borderRadius: 30, paddingHorizontal: 18, paddingVertical: 9, marginTop: 16, backgroundColor: '#fff'},
  statusDot: {width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#9CA3AF'},
  statusPillText: {fontSize: 13, color: '#6B7280', fontWeight: '500'},
  statusHint: {fontSize: 12, color: '#9CA3AF', textAlign: 'center', marginTop: 10, marginBottom: 22, paddingHorizontal: 28, lineHeight: 19},
  statsRow: {flexDirection: 'row', gap: 10, marginBottom: 24, paddingHorizontal: 20, width: '100%'},
  section: {width: '100%', paddingHorizontal: 20, marginBottom: 16},
  sectionHeader: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12},
  sectionTitle: {fontSize: 17, fontWeight: '700', color: Colors.textPrimary},
  seeAll: {fontSize: 13, fontWeight: '600', color: Colors.primary},
  orderList: {gap: 12},
  offlineCard: {marginHorizontal: 20, marginTop: 8, backgroundColor: '#fff', borderRadius: 20, padding: 28, alignItems: 'center', gap: 6, borderWidth: 1, borderColor: Colors.border},
  offlineTitle: {fontSize: 16, fontWeight: '700', color: Colors.textPrimary},
  offlineSub: {fontSize: 13, color: Colors.textSecondary, textAlign: 'center'},
});

const sb = StyleSheet.create({
  wrap: {alignItems: 'center', justifyContent: 'center', marginVertical: 8, marginTop : 32, marginBottom : 20},
  outerRing: {
    position: 'absolute',
    width: 222, height: 222, borderRadius: 111,
    backgroundColor: Colors.primary + '28',
  },
  circle: {
    width: 190, height: 190, borderRadius: 95,
    alignItems: 'center', justifyContent: 'center',
  },
  circleActive: {
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  circleInactive: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: Colors.primary + '35',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  innerCircle: {
    width: 160, height: 160, borderRadius: 80,
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  innerCircleInactive: {borderColor: Colors.primary + '20'},
  statusLabel: {fontSize: 17, fontWeight: '800'},
  tapHint: {fontSize: 11},
});

const st = StyleSheet.create({
  wrap: {flex: 1, backgroundColor: '#fff', borderRadius: 18, padding: 14, alignItems: 'center', gap: 4, shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.06, elevation: 2},
  iconBox: {width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 2},
  valueRow: {flexDirection: 'row', alignItems: 'flex-end'},
  unit: {fontSize: 12, fontWeight: '700', color: Colors.textPrimary, marginBottom: 2},
  value: {fontSize: 20, fontWeight: '900', color: Colors.textPrimary},
  label: {fontSize: 11, color: Colors.textSecondary, fontWeight: '500'},
});

const nc = StyleSheet.create({
  card: {
    backgroundColor: '#fff', borderRadius: 18, padding: 16,
    borderWidth: 1, borderColor: Colors.border,
    shadowColor: '#000', shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.07, elevation: 3, gap: 12,
  },
  topRow: {flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between'},
  serviceName: {fontSize: 16, fontWeight: '700', color: Colors.textPrimary, textAlign: 'right', flex: 1, paddingLeft: 8},
  priceRow: {flexDirection: 'row', alignItems: 'flex-end', gap: 3},
  currency: {fontSize: 14, fontWeight: '700', color: Colors.primary, marginBottom: 2},
  earning: {fontSize: 26, fontWeight: '900', color: Colors.primary, lineHeight: 30},
  addrRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 5},
  addr: {fontSize: 12, color: Colors.textSecondary, textAlign: 'right'},
  divider: {height: 1, backgroundColor: Colors.border},
  metaRow: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'},
  metaItem: {flexDirection: 'row', alignItems: 'center', gap: 8},
  metaIconBox: {width: 34, height: 34, borderRadius: 17, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center'},
  metaIconBoxCar: {backgroundColor: Colors.primary + '15'},
  metaLabel: {fontSize: 10, color: Colors.textSecondary, textAlign: 'right'},
  metaValue: {fontSize: 13, fontWeight: '700', color: Colors.textPrimary, textAlign: 'right'},
  btn: {backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 15, alignItems: 'center', justifyContent: 'center', shadowColor: Colors.primary, shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5},
  btnText: {color: '#fff', fontSize: 15, fontWeight: '700'},
});
