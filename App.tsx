import React, {useState} from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
// icons as text components — no external dependency
const Icon = ({name, size = 20, color = '#000'}: {name: string; size?: number; color?: string}) => {
  const map: Record<string, string> = {
    bell: '🔔', mapPin: '📍', chevronDown: '⌄', wallet: '💰',
    star: '★', clock: '🕐', car: '🚗', trendingUp: '↑',
    home: '⌂', clipboardList: '☰', user: '👤', chevronRight: '›',
    logOut: '⎋', edit: '✏', fileText: '📄', shield: '🛡', arrowRight: '→',
  };
  return <Text style={{fontSize: size * 0.9, color, lineHeight: size * 1.2}}>{map[name] ?? '•'}</Text>;
};

// ─── Colors ───────────────────────────────────────────────────────────────────
const C = {
  primary: '#1B7BF5',
  primaryDark: '#1460C7',
  success: '#22C55E',
  warning: '#F59E0B',
  danger: '#EF4444',
  purple: '#8B5CF6',
  bg: '#F8FAFC',
  card: '#FFFFFF',
  textPrimary: '#0F172A',
  textSecondary: '#64748B',
  border: '#E2E8F0',
};

// ─── Mock Data ────────────────────────────────────────────────────────────────
const MOCK_USER = {
  firstName: 'أحمد',
  lastName: 'محمد',
  rating: 4.7,
  wallet: {balance: 1250.0, monthlyEarnings: 850.0, weeklyEarnings: 320.0},
};

type OrderType = {
  _id: string;
  orderNumber: string;
  status: string;
  car: {brand: string; model: string; color: string; plateNumber: string};
  address: string;
  scheduledAt: string;
  scheduledDate: string;
  service: {name: string; price: number};
  client: {firstName: string; lastName: string; phoneNumber: string};
  bikerEarning: number;
  createdAt: string;
};

const MOCK_ORDERS: OrderType[] = [
  {
    _id: '1', orderNumber: 'ORD-1234', status: 'ASSIGNED',
    car: {brand: 'Toyota', model: 'Camry', color: 'أبيض', plateNumber: 'ABC 1234'},
    address: 'حي النزهة، الرياض', scheduledAt: '10:30 ص',
    scheduledDate: 'اليوم',
    service: {name: 'غسيل كامل', price: 50},
    client: {firstName: 'سعد', lastName: 'أحمد', phoneNumber: '0501234567'},
    bikerEarning: 45.00,
    createdAt: '2026-04-27T07:00:00.000Z',
  },
  {
    _id: '2', orderNumber: 'ORD-1235', status: 'ON_THE_WAY',
    car: {brand: 'Honda', model: 'Accord', color: 'أسود', plateNumber: 'XYZ 5678'},
    address: 'حي العليا، الرياض', scheduledAt: '11:00 ص',
    scheduledDate: 'اليوم',
    service: {name: 'غسيل داخلي', price: 40},
    client: {firstName: 'خالد', lastName: 'المطيري', phoneNumber: '0509876543'},
    bikerEarning: 36.00,
    createdAt: '2026-04-27T08:00:00.000Z',
  },
  {
    _id: '3', orderNumber: 'ORD-1236', status: 'STARTED',
    car: {brand: 'BMW', model: 'X5', color: 'رمادي', plateNumber: 'DEF 9012'},
    address: 'حي الملقا، الرياض', scheduledAt: '12:00 م',
    scheduledDate: 'اليوم',
    service: {name: 'تنظيف شامل', price: 80},
    client: {firstName: 'عمر', lastName: 'الشمري', phoneNumber: '0555551234'},
    bikerEarning: 72.00,
    createdAt: '2026-04-27T09:00:00.000Z',
  },
];

const MOCK_PAST_ORDERS: OrderType[] = [
  {
    _id: '4', orderNumber: 'ORD-1230', status: 'COMPLETED',
    car: {brand: 'Lexus', model: 'ES350', color: 'فضي', plateNumber: 'GHI 3456'},
    address: 'حي الروضة، الرياض', scheduledAt: '09:00 ص',
    scheduledDate: 'الأمس',
    service: {name: 'غسيل كامل', price: 50},
    client: {firstName: 'فهد', lastName: 'السعيد', phoneNumber: '0512345678'},
    bikerEarning: 45.00,
    createdAt: '2026-04-26T06:00:00.000Z',
  },
  {
    _id: '5', orderNumber: 'ORD-1229', status: 'COMPLETED',
    car: {brand: 'Kia', model: 'Sportage', color: 'أزرق', plateNumber: 'JKL 7890'},
    address: 'حي الورود، الرياض', scheduledAt: '02:00 م',
    scheduledDate: 'الأمس',
    service: {name: 'غسيل خارجي', price: 30},
    client: {firstName: 'محمد', lastName: 'العتيبي', phoneNumber: '0566667777'},
    bikerEarning: 27.00,
    createdAt: '2026-04-26T11:00:00.000Z',
  },
  {
    _id: '6', orderNumber: 'ORD-1225', status: 'CANCELLED',
    car: {brand: 'Hyundai', model: 'Sonata', color: 'أبيض', plateNumber: 'MNO 1122'},
    address: 'حي السليمانية، الرياض', scheduledAt: '11:00 ص',
    scheduledDate: '25 أبريل',
    service: {name: 'تنظيف شامل', price: 80},
    client: {firstName: 'عبدالله', lastName: 'الدوسري', phoneNumber: '0577778888'},
    bikerEarning: 0,
    createdAt: '2026-04-25T08:00:00.000Z',
  },
];

const MOCK_BRANCHES = [
  {_id: '1', name: 'الفرع الرئيسي — الرياض'},
  {_id: '2', name: 'فرع العليا'},
  {_id: '3', name: 'فرع النزهة'},
  {_id: '4', name: 'فرع الملقا'},
];

const STATUS_MAP: Record<string, {label: string; color: string}> = {
  ASSIGNED:   {label: 'مُسند',    color: C.warning},
  ON_THE_WAY: {label: 'في الطريق', color: C.primary},
  STARTED:    {label: 'جارٍ التنفيذ', color: C.purple},
  COMPLETED:  {label: 'مكتمل',   color: C.success},
  CANCELLED:  {label: 'ملغي',    color: C.danger},
};

const STATUS_STEPS = ['ASSIGNED', 'ON_THE_WAY', 'STARTED', 'COMPLETED'];

// ─── Types ────────────────────────────────────────────────────────────────────
type Screen = 'login' | 'app';
type Tab = 'home' | 'orders' | 'reviews' | 'profile';
type OrdersSubScreen = 'list' | 'details';

type TabDef = {key: Tab; label: string; icon: string};
const TABS: TabDef[] = [
  {key: 'home',    label: 'الرئيسية',  icon: 'home'},
  {key: 'orders',  label: 'الطلبات',   icon: 'clipboardList'},
  {key: 'reviews', label: 'التقييمات', icon: 'star'},
  {key: 'profile', label: 'الملف',     icon: 'user'},
];

// ─── OrderCard ────────────────────────────────────────────────────────────────
function OrderCard({order}: {order: typeof MOCK_ORDERS[0]}): React.JSX.Element {
  const st = STATUS_MAP[order.status] ?? {label: order.status, color: C.textSecondary};
  return (
    <TouchableOpacity style={oSt.card} activeOpacity={0.85}>
      <View style={oSt.header}>
        <Text style={oSt.number}>#{order.orderNumber}</Text>
        <View style={[oSt.badge, {backgroundColor: st.color + '22'}]}>
          <Text style={[oSt.badgeText, {color: st.color}]}>{st.label}</Text>
        </View>
      </View>
      <View style={oSt.carRow}>
        <Icon name="car" size={14} color={C.textSecondary} />
        <Text style={oSt.car}>{order.car.brand} {order.car.model} — {order.car.color}</Text>
      </View>
      <View style={oSt.metaRow}>
        <Icon name="mapPin" size={13} color={C.textSecondary} />
        <Text style={oSt.meta}>{order.address}</Text>
      </View>
      <View style={oSt.metaRow}>
        <Icon name="clock" size={13} color={C.textSecondary} />
        <Text style={oSt.meta}>{order.scheduledAt}</Text>
        <Text style={oSt.service}>{order.service.name}</Text>
      </View>
      <View style={oSt.footer}>
        <Text style={oSt.client}>العميل: {order.client.firstName}</Text>
        <Text style={oSt.plate}>{order.car.plateNumber}</Text>
      </View>
    </TouchableOpacity>
  );
}

const oSt = StyleSheet.create({
  card: {
    width: 264, backgroundColor: C.card, borderRadius: 18,
    padding: 16, marginLeft: 16,
    borderWidth: 1, borderColor: C.border,
    shadowColor: '#000', shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.07, shadowRadius: 12, elevation: 4,
  },
  header: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10},
  number: {fontSize: 13, fontWeight: '700', color: C.textPrimary},
  badge: {paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20},
  badgeText: {fontSize: 11, fontWeight: '700'},
  carRow: {flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6},
  car: {fontSize: 14, fontWeight: '600', color: C.textPrimary},
  metaRow: {flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 4},
  meta: {fontSize: 12, color: C.textSecondary, flex: 1},
  service: {fontSize: 11, color: C.primary, fontWeight: '600'},
  footer: {flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: C.border},
  client: {fontSize: 12, color: C.textSecondary},
  plate: {fontSize: 12, fontWeight: '700', color: C.textPrimary},
});

// ─── HomeScreen ───────────────────────────────────────────────────────────────
function HomeScreen(): React.JSX.Element {
  const [refreshing, setRefreshing] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState(MOCK_BRANCHES[2]);
  const [branchModal, setBranchModal] = useState(false);
  const [tempBranch, setTempBranch] = useState(MOCK_BRANCHES[2]);
  const notifCount = 3;

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1200);
  };

  return (
    <View style={hSt.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.primary} />

      {/* Header */}
      <View style={hSt.header}>
        <View>
          <Text style={hSt.greeting}>مرحباً،</Text>
          <Text style={hSt.name}>{MOCK_USER.firstName} {MOCK_USER.lastName} 👋</Text>
        </View>
        <TouchableOpacity style={hSt.notifBtn} activeOpacity={0.8}>
          <Icon name="bell" size={22} color="#fff" />
          {notifCount > 0 && (
            <View style={hSt.notifBadge}>
              <Text style={hSt.notifBadgeText}>{notifCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={hSt.scroll}
        contentContainerStyle={hSt.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[C.primary]} />}>

        {/* Wallet Card */}
        <View style={hSt.walletCard}>
          <View style={hSt.walletTop}>
            <View style={hSt.walletIconBox}>
              <Icon name="wallet" size={18} color="#fff" />
            </View>
            <Text style={hSt.walletCurrency}>SAR</Text>
          </View>
          <Text style={hSt.walletLabel}>رصيدك الحالي</Text>
          <Text style={hSt.walletBalance}>
            ﷼ {MOCK_USER.wallet.balance.toLocaleString('ar-SA', {minimumFractionDigits: 2})}
          </Text>
          <View style={hSt.walletDivider} />
          <View style={hSt.walletStats}>
            <View style={hSt.walletStat}>
              <Icon name="trendingUp" size={14} color="rgba(255,255,255,0.7)" />
              <Text style={hSt.walletStatLabel}>هذا الشهر</Text>
              <Text style={hSt.walletStatVal}>﷼ {MOCK_USER.wallet.monthlyEarnings.toLocaleString()}</Text>
            </View>
            <View style={hSt.walletStatDivider} />
            <View style={hSt.walletStat}>
              <Icon name="trendingUp" size={14} color="rgba(255,255,255,0.7)" />
              <Text style={hSt.walletStatLabel}>هذا الأسبوع</Text>
              <Text style={hSt.walletStatVal}>﷼ {MOCK_USER.wallet.weeklyEarnings.toLocaleString()}</Text>
            </View>
          </View>
          <TouchableOpacity style={hSt.walletBtn} activeOpacity={0.85}>
            <Text style={hSt.walletBtnText}>عرض المحفظة كاملاً</Text>
            <Icon name="arrowRight" size={16} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Branch Selector */}
        <TouchableOpacity style={hSt.branchBtn} onPress={() => setBranchModal(true)} activeOpacity={0.8}>
          <View style={hSt.branchIconBox}>
            <Icon name="mapPin" size={18} color={C.primary} />
          </View>
          <Text style={hSt.branchText}>{selectedBranch.name}</Text>
          <Icon name="chevronDown" size={18} color={C.textSecondary} />
        </TouchableOpacity>

        {/* Active Orders */}
        <View style={hSt.sectionHeader}>
          <Text style={hSt.sectionTitle}>طلباتك النشطة</Text>
          <View style={hSt.countBadge}>
            <Text style={hSt.countText}>{MOCK_ORDERS.length}</Text>
          </View>
        </View>

        {MOCK_ORDERS.length > 0 ? (
          <FlatList
            data={MOCK_ORDERS}
            keyExtractor={i => i._id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{paddingRight: 16, paddingBottom: 4}}
            renderItem={({item}) => <OrderCard order={item} />}
          />
        ) : (
          <View style={hSt.empty}>
            <Icon name="clipboardList" size={48} color={C.border} />
            <Text style={hSt.emptyText}>لا توجد طلبات نشطة الآن</Text>
          </View>
        )}

        {/* Rating Card */}
        <View style={hSt.ratingCard}>
          <View style={hSt.ratingLeft}>
            <Icon name="star" size={18} color={C.warning} />
            <Text style={hSt.ratingLabel}>تقييمك الحالي</Text>
          </View>
          <View style={hSt.ratingRight}>
            <Text style={hSt.ratingValue}>{MOCK_USER.rating}</Text>
            <Text style={hSt.ratingMax}>/5</Text>
          </View>
        </View>

      </ScrollView>

      {/* Branch Modal */}
      <Modal visible={branchModal} transparent animationType="slide" onRequestClose={() => setBranchModal(false)}>
        <TouchableOpacity style={hSt.modalOverlay} activeOpacity={1} onPress={() => setBranchModal(false)} />
        <View style={hSt.modalSheet}>
          <View style={hSt.modalHandle} />
          <Text style={hSt.modalTitle}>اختر المنطقة</Text>
          {MOCK_BRANCHES.map(b => (
            <TouchableOpacity key={b._id} style={hSt.branchOption} onPress={() => setTempBranch(b)}>
              <View style={[hSt.radio, tempBranch._id === b._id && hSt.radioSelected]}>
                {tempBranch._id === b._id && <View style={hSt.radioInner} />}
              </View>
              <Text style={[hSt.branchOptionText, tempBranch._id === b._id && {color: C.primary, fontWeight: '700'}]}>
                {b.name}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={hSt.modalConfirmBtn} onPress={() => { setSelectedBranch(tempBranch); setBranchModal(false); }}>
            <Text style={hSt.modalConfirmText}>تأكيد</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const hSt = StyleSheet.create({
  root: {flex: 1, backgroundColor: C.bg},
  // Header
  header: {
    backgroundColor: C.primary, paddingTop: 52, paddingBottom: 24,
    paddingHorizontal: 24, flexDirection: 'row',
    justifyContent: 'space-between', alignItems: 'center',
  },
  greeting: {fontSize: 13, color: 'rgba(255,255,255,0.75)'},
  name: {fontSize: 20, fontWeight: '800', color: '#fff', marginTop: 2},
  notifBtn: {width: 46, height: 46, borderRadius: 23, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center'},
  notifBadge: {position: 'absolute', top: 8, right: 8, backgroundColor: C.danger, borderRadius: 6, minWidth: 14, height: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: C.primary},
  notifBadgeText: {color: '#fff', fontSize: 8, fontWeight: '800'},
  // Scroll
  scroll: {flex: 1},
  scrollContent: {paddingBottom: 32},
  // Wallet
  walletCard: {
    margin: 16, borderRadius: 24, padding: 22,
    backgroundColor: C.primaryDark,
    shadowColor: C.primary, shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.35, shadowRadius: 16, elevation: 10,
  },
  walletTop: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14},
  walletIconBox: {width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center'},
  walletCurrency: {fontSize: 12, color: 'rgba(255,255,255,0.55)', fontWeight: '700', letterSpacing: 1},
  walletLabel: {fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 4},
  walletBalance: {fontSize: 36, fontWeight: '800', color: '#fff', marginBottom: 18, letterSpacing: -1},
  walletDivider: {height: 1, backgroundColor: 'rgba(255,255,255,0.15)', marginBottom: 16},
  walletStats: {flexDirection: 'row', marginBottom: 18},
  walletStat: {flex: 1, gap: 4},
  walletStatDivider: {width: 1, backgroundColor: 'rgba(255,255,255,0.15)', marginHorizontal: 16},
  walletStatLabel: {fontSize: 11, color: 'rgba(255,255,255,0.6)'},
  walletStatVal: {fontSize: 15, fontWeight: '700', color: '#fff'},
  walletBtn: {flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12, paddingVertical: 12, alignItems: 'center', justifyContent: 'center', gap: 8},
  walletBtnText: {color: '#fff', fontSize: 14, fontWeight: '600'},
  // Branch
  branchBtn: {
    marginHorizontal: 16, marginBottom: 20,
    backgroundColor: C.card, borderRadius: 16, borderWidth: 1, borderColor: C.border,
    paddingHorizontal: 14, paddingVertical: 14,
    flexDirection: 'row', alignItems: 'center', gap: 10,
    shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.05, elevation: 2,
  },
  branchIconBox: {width: 34, height: 34, borderRadius: 10, backgroundColor: C.primary + '15', alignItems: 'center', justifyContent: 'center'},
  branchText: {flex: 1, fontSize: 14, color: C.textPrimary, fontWeight: '600'},
  // Section
  sectionHeader: {flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 14, gap: 8},
  sectionTitle: {fontSize: 17, fontWeight: '700', color: C.textPrimary},
  countBadge: {backgroundColor: C.primary + '18', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 2},
  countText: {fontSize: 13, color: C.primary, fontWeight: '700'},
  // Empty
  empty: {alignItems: 'center', paddingVertical: 36, gap: 10},
  emptyText: {fontSize: 14, color: C.textSecondary},
  // Rating
  ratingCard: {
    marginHorizontal: 16, marginTop: 16, backgroundColor: C.card, borderRadius: 16,
    borderWidth: 1, borderColor: C.border,
    padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.05, elevation: 2,
  },
  ratingLeft: {flexDirection: 'row', alignItems: 'center', gap: 8},
  ratingLabel: {fontSize: 14, color: C.textSecondary, fontWeight: '500'},
  ratingRight: {flexDirection: 'row', alignItems: 'baseline', gap: 2},
  ratingValue: {fontSize: 24, fontWeight: '800', color: C.textPrimary},
  ratingMax: {fontSize: 13, color: C.textSecondary},
  // Modal
  modalOverlay: {flex: 1, backgroundColor: 'rgba(0,0,0,0.45)'},
  modalSheet: {backgroundColor: C.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40},
  modalHandle: {width: 40, height: 4, backgroundColor: C.border, borderRadius: 2, alignSelf: 'center', marginBottom: 20},
  modalTitle: {fontSize: 17, fontWeight: '700', color: C.textPrimary, textAlign: 'center', marginBottom: 20},
  branchOption: {flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.border, gap: 12},
  radio: {width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: C.border, alignItems: 'center', justifyContent: 'center'},
  radioSelected: {borderColor: C.primary},
  radioInner: {width: 10, height: 10, borderRadius: 5, backgroundColor: C.primary},
  branchOptionText: {fontSize: 15, color: C.textPrimary},
  modalConfirmBtn: {marginTop: 20, backgroundColor: C.primary, borderRadius: 14, paddingVertical: 16, alignItems: 'center'},
  modalConfirmText: {color: '#fff', fontSize: 16, fontWeight: '700'},
});

// ─── OrderListCard ────────────────────────────────────────────────────────────
function OrderListCard({order, onPress}: {order: OrderType; onPress: () => void}): React.JSX.Element {
  const st = STATUS_MAP[order.status] ?? {label: order.status, color: C.textSecondary};
  return (
    <TouchableOpacity style={olSt.card} onPress={onPress} activeOpacity={0.85}>
      {/* Header row */}
      <View style={olSt.cardHeader}>
        <Text style={olSt.orderNum}>#{order.orderNumber}</Text>
        <View style={[olSt.badge, {backgroundColor: st.color + '22'}]}>
          <Text style={[olSt.badgeText, {color: st.color}]}>{st.label}</Text>
        </View>
      </View>
      <View style={olSt.divider} />
      {/* Car */}
      <View style={olSt.row}>
        <Icon name="car" size={14} color={C.textSecondary} />
        <Text style={olSt.carText}>{order.car.brand} {order.car.model} — {order.car.color}</Text>
      </View>
      {/* Client */}
      <View style={olSt.row}>
        <Icon name="user" size={14} color={C.textSecondary} />
        <Text style={olSt.metaText}>العميل: {order.client.firstName} {order.client.lastName}</Text>
      </View>
      {/* Address */}
      <View style={olSt.row}>
        <Icon name="mapPin" size={14} color={C.textSecondary} />
        <Text style={olSt.metaText}>{order.address}</Text>
      </View>
      {/* Time */}
      <View style={olSt.row}>
        <Icon name="clock" size={14} color={C.textSecondary} />
        <Text style={olSt.metaText}>{order.scheduledDate}، {order.scheduledAt}</Text>
      </View>
      {/* Earning */}
      <View style={olSt.row}>
        <Icon name="wallet" size={14} color={C.textSecondary} />
        <Text style={olSt.earningText}>أرباحك: ﷼ {order.bikerEarning.toFixed(2)}</Text>
      </View>
      <View style={olSt.divider} />
      {/* Footer CTA */}
      <TouchableOpacity style={olSt.detailsBtn} onPress={onPress}>
        <Text style={olSt.detailsBtnText}>عرض التفاصيل</Text>
        <Icon name="arrowRight" size={14} color={C.primary} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const olSt = StyleSheet.create({
  card: {
    backgroundColor: C.card, borderRadius: 18, padding: 16,
    borderWidth: 1, borderColor: C.border,
    shadowColor: '#000', shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.07, shadowRadius: 10, elevation: 3,
  },
  cardHeader: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10},
  orderNum: {fontSize: 14, fontWeight: '800', color: C.textPrimary},
  badge: {paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20},
  badgeText: {fontSize: 11, fontWeight: '700'},
  divider: {height: 1, backgroundColor: C.border, marginVertical: 10},
  row: {flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6},
  carText: {fontSize: 14, fontWeight: '600', color: C.textPrimary, flex: 1},
  metaText: {fontSize: 13, color: C.textSecondary, flex: 1},
  earningText: {fontSize: 13, fontWeight: '700', color: C.success, flex: 1},
  detailsBtn: {flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingTop: 2},
  detailsBtnText: {fontSize: 14, fontWeight: '700', color: C.primary},
});

// ─── StatusTracker ────────────────────────────────────────────────────────────
function StatusTracker({status}: {status: string}): React.JSX.Element {
  const stepLabels = ['مُسند', 'في الطريق', 'جارٍ', 'اكتمل'];
  const currentIdx = STATUS_STEPS.indexOf(status);

  return (
    <View style={trackerSt.root}>
      {STATUS_STEPS.map((step, i) => {
        const done = i < currentIdx;
        const active = i === currentIdx;
        return (
          <View key={step} style={trackerSt.stepWrap}>
            {/* connector line before */}
            {i > 0 && (
              <View style={[trackerSt.line, (done || active) && trackerSt.lineActive]} />
            )}
            {/* circle */}
            <View style={[
              trackerSt.circle,
              done && trackerSt.circleDone,
              active && trackerSt.circleActive,
            ]}>
              {done && <Text style={trackerSt.checkMark}>✓</Text>}
              {active && <View style={trackerSt.activeDot} />}
            </View>
            {/* label */}
            <Text style={[trackerSt.label, active && trackerSt.labelActive, done && trackerSt.labelDone]}>
              {stepLabels[i]}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const trackerSt = StyleSheet.create({
  root: {flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center', paddingVertical: 8},
  stepWrap: {alignItems: 'center', flex: 1, position: 'relative'},
  line: {
    position: 'absolute', top: 12, right: '50%', left: '-50%',
    height: 2, backgroundColor: C.border,
  },
  lineActive: {backgroundColor: C.primary},
  circle: {
    width: 26, height: 26, borderRadius: 13,
    borderWidth: 2, borderColor: C.border,
    backgroundColor: C.card,
    alignItems: 'center', justifyContent: 'center', zIndex: 1,
  },
  circleDone: {backgroundColor: C.primary, borderColor: C.primary},
  circleActive: {borderColor: C.primary, backgroundColor: C.card},
  activeDot: {width: 10, height: 10, borderRadius: 5, backgroundColor: C.primary},
  checkMark: {color: '#fff', fontSize: 12, fontWeight: '800'},
  label: {fontSize: 10, color: C.textSecondary, marginTop: 5, textAlign: 'center'},
  labelActive: {color: C.primary, fontWeight: '700'},
  labelDone: {color: C.primary},
});

// ─── OrderDetailsScreen ───────────────────────────────────────────────────────
function OrderDetailsScreen({order, onBack}: {order: OrderType; onBack: () => void}): React.JSX.Element {
  const [currentStatus, setCurrentStatus] = useState(order.status);
  const [actionLoading, setActionLoading] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [photosCount, setPhotosCount] = useState(0);
  const [cancelReason, setCancelReason] = useState('');

  const canCancel = currentStatus === 'ASSIGNED' || currentStatus === 'ON_THE_WAY';

  const actionMap: Record<string, {label: string; nextStatus: string} | null> = {
    ASSIGNED:   {label: '🚗  في الطريق', nextStatus: 'ON_THE_WAY'},
    ON_THE_WAY: {label: '📍  وصلت — ابدأ الخدمة', nextStatus: 'STARTED'},
    STARTED:    {label: '📸  انتهيت — رفع الصور', nextStatus: 'COMPLETED'},
    COMPLETED:  null,
    CANCELLED:  null,
  };

  const handleAction = () => {
    const action = actionMap[currentStatus];
    if (!action) return;
    if (currentStatus === 'STARTED') {
      setShowImageUpload(true);
      return;
    }
    setActionLoading(true);
    // TODO: PATCH /api/biker/order/:id/status  {status: action.nextStatus}
    setTimeout(() => {
      setCurrentStatus(action.nextStatus);
      setActionLoading(false);
    }, 900);
  };

  const handleCompleteWithPhotos = () => {
    if (photosCount === 0) return;
    setShowImageUpload(false);
    setActionLoading(true);
    // TODO: PATCH /api/biker/order/:id/status  {status:'COMPLETED', afterPhotos:[...]}
    setTimeout(() => {
      setCurrentStatus('COMPLETED');
      setActionLoading(false);
      setShowCompletionModal(true);
    }, 1000);
  };

  const handleCancel = () => {
    setShowCancelModal(false);
    setActionLoading(true);
    // TODO: PUT /api/biker/order/:id  {action:'cancel', reason: cancelReason}
    setTimeout(() => {
      setCurrentStatus('CANCELLED');
      setActionLoading(false);
    }, 800);
  };

  const action = actionMap[currentStatus];
  const actionBgColor =
    currentStatus === 'ASSIGNED'   ? C.primary :
    currentStatus === 'ON_THE_WAY' ? C.success  :
    currentStatus === 'STARTED'    ? C.purple   : C.border;

  return (
    <View style={detSt.root}>
      <StatusBar barStyle="dark-content" backgroundColor={C.card} />

      {/* Header */}
      <View style={detSt.header}>
        <TouchableOpacity style={detSt.backBtn} onPress={onBack} hitSlop={{top:12,bottom:12,left:12,right:12}}>
          <Text style={detSt.backArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={detSt.headerTitle}>تفاصيل الطلب</Text>
        <View style={detSt.headerNum}>
          <Text style={detSt.headerNumText}>#{order.orderNumber}</Text>
        </View>
      </View>

      <ScrollView style={detSt.scroll} contentContainerStyle={detSt.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Status Tracker */}
        <View style={detSt.section}>
          <Text style={detSt.sectionTitle}>مسار الطلب</Text>
          <StatusTracker status={currentStatus} />
          {/* current status badge */}
          {STATUS_MAP[currentStatus] && (
            <View style={[detSt.statusBadgeBig, {backgroundColor: STATUS_MAP[currentStatus].color + '18'}]}>
              <Text style={[detSt.statusBadgeBigText, {color: STATUS_MAP[currentStatus].color}]}>
                {STATUS_MAP[currentStatus].label}
              </Text>
            </View>
          )}
        </View>

        {/* Client Info */}
        <View style={detSt.section}>
          <Text style={detSt.sectionTitle}>معلومات العميل</Text>
          <View style={detSt.card}>
            <View style={detSt.infoRow}>
              <Icon name="user" size={16} color={C.primary} />
              <Text style={detSt.infoLabel}>{order.client.firstName} {order.client.lastName}</Text>
            </View>
            <View style={detSt.infoRow}>
              <Text style={detSt.phoneIcon}>📞</Text>
              <Text style={detSt.infoValue}>{order.client.phoneNumber}</Text>
              <TouchableOpacity style={detSt.phoneBtn}>
                <Text style={detSt.phoneBtnText}>اتصال</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[detSt.phoneBtn, detSt.waBtnStyle]}>
                <Text style={detSt.waBtnText}>واتساب</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Car Info */}
        <View style={detSt.section}>
          <Text style={detSt.sectionTitle}>معلومات السيارة</Text>
          <View style={detSt.card}>
            <View style={detSt.infoRow}>
              <Icon name="car" size={16} color={C.primary} />
              <Text style={detSt.infoLabel}>{order.car.brand} {order.car.model} — {order.car.color}</Text>
            </View>
            <View style={detSt.infoRow}>
              <Text style={detSt.plateIcon}>🪪</Text>
              <Text style={detSt.infoValue}>لوحة: {order.car.plateNumber}</Text>
            </View>
            {(currentStatus === 'ASSIGNED' || currentStatus === 'ON_THE_WAY') && (
              <TouchableOpacity style={detSt.changeCarBtn}>
                <Icon name="edit" size={14} color={C.primary} />
                <Text style={detSt.changeCarText}>تغيير السيارة</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Service & Location */}
        <View style={detSt.section}>
          <Text style={detSt.sectionTitle}>الخدمة والموقع</Text>
          <View style={detSt.card}>
            <View style={detSt.infoRow}>
              <Text style={detSt.serviceIcon}>🧹</Text>
              <Text style={detSt.infoLabel}>{order.service.name}</Text>
              <Text style={detSt.priceTag}>﷼ {order.service.price}</Text>
            </View>
            <View style={detSt.infoRow}>
              <Icon name="mapPin" size={16} color={C.primary} />
              <Text style={detSt.infoValue}>{order.address}</Text>
            </View>
            <View style={detSt.infoRow}>
              <Icon name="clock" size={16} color={C.primary} />
              <Text style={detSt.infoValue}>{order.scheduledAt} — {order.scheduledDate}</Text>
            </View>
            <View style={[detSt.infoRow, detSt.earningHighlight]}>
              <Icon name="wallet" size={16} color={C.success} />
              <Text style={detSt.earningText}>أرباحك: ﷼ {order.bikerEarning.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        {/* Action Button */}
        {action && (
          <TouchableOpacity
            style={[detSt.actionBtn, {backgroundColor: actionBgColor}, actionLoading && {opacity: 0.65}]}
            onPress={handleAction}
            disabled={actionLoading}
            activeOpacity={0.85}>
            {actionLoading
              ? <ActivityIndicator color="#fff" />
              : <Text style={detSt.actionBtnText}>{action.label}</Text>}
          </TouchableOpacity>
        )}

        {/* Cancel Button */}
        {canCancel && !actionLoading && (
          <TouchableOpacity style={detSt.cancelBtn} onPress={() => setShowCancelModal(true)}>
            <Text style={detSt.cancelBtnText}>إلغاء الطلب</Text>
          </TouchableOpacity>
        )}

        <View style={{height: 24}} />
      </ScrollView>

      {/* Cancel Modal */}
      <Modal visible={showCancelModal} transparent animationType="fade" onRequestClose={() => setShowCancelModal(false)}>
        <View style={modalSt.overlay}>
          <View style={modalSt.box}>
            <Text style={modalSt.warningIcon}>⚠️</Text>
            <Text style={modalSt.boxTitle}>إلغاء الطلب</Text>
            <Text style={modalSt.boxBody}>هل أنت متأكد من إلغاء الطلب؟{'\n'}هذا الإجراء لا يمكن التراجع عنه</Text>
            <TextInput
              style={modalSt.reasonInput}
              placeholder="سبب الإلغاء (اختياري)"
              placeholderTextColor={C.textSecondary}
              value={cancelReason}
              onChangeText={setCancelReason}
              textAlign="right"
            />
            <View style={modalSt.btnRow}>
              <TouchableOpacity style={modalSt.secondaryBtn} onPress={() => setShowCancelModal(false)}>
                <Text style={modalSt.secondaryBtnText}>تراجع</Text>
              </TouchableOpacity>
              <TouchableOpacity style={modalSt.dangerBtn} onPress={handleCancel}>
                <Text style={modalSt.dangerBtnText}>نعم، إلغاء</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Image Upload Modal */}
      <Modal visible={showImageUpload} transparent animationType="slide" onRequestClose={() => setShowImageUpload(false)}>
        <View style={modalSt.slideOverlay}>
          <View style={modalSt.slideSheet}>
            <View style={modalSt.slideHandle} />
            <Text style={modalSt.slideTitle}>رفع صور الإثبات</Text>
            <Text style={modalSt.slideSubtitle}>📸 الصور الدالة على إتمام الخدمة{'\n'}(مطلوبة صورة واحدة على الأقل)</Text>
            <View style={imgUpSt.grid}>
              {[0, 1, 2, 3].map(i => (
                <TouchableOpacity
                  key={i}
                  style={[imgUpSt.slot, i < photosCount && imgUpSt.slotFilled]}
                  onPress={() => { if (i >= photosCount) setPhotosCount(photosCount + 1); }}>
                  {i < photosCount
                    ? <Text style={imgUpSt.checkIcon}>✓</Text>
                    : <Text style={imgUpSt.plusIcon}>+</Text>}
                </TouchableOpacity>
              ))}
            </View>
            {photosCount > 0 && (
              <Text style={imgUpSt.photoCount}>{photosCount} صورة مرفوعة</Text>
            )}
            <TouchableOpacity
              style={[modalSt.confirmBtn, photosCount === 0 && {opacity: 0.4}]}
              onPress={handleCompleteWithPhotos}
              disabled={photosCount === 0}>
              <Text style={modalSt.confirmBtnText}>تأكيد الإتمام ✓</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Completion Modal */}
      <Modal visible={showCompletionModal} transparent animationType="fade" onRequestClose={() => { setShowCompletionModal(false); onBack(); }}>
        <View style={modalSt.overlay}>
          <View style={modalSt.box}>
            <Text style={modalSt.successIcon}>✅</Text>
            <Text style={modalSt.boxTitle}>أحسنت! الطلب مكتمل</Text>
            <Text style={modalSt.earningLine}>أرباحك من هذا الطلب</Text>
            <Text style={modalSt.earningAmount}>﷼ {order.bikerEarning.toFixed(2)}</Text>
            <TouchableOpacity style={modalSt.confirmBtn} onPress={() => { setShowCompletionModal(false); onBack(); }}>
              <Text style={modalSt.confirmBtnText}>العودة للطلبات</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const detSt = StyleSheet.create({
  root: {flex: 1, backgroundColor: C.bg},
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingTop: 52, paddingBottom: 16, paddingHorizontal: 16,
    backgroundColor: C.card, borderBottomWidth: 1, borderBottomColor: C.border,
    gap: 10,
  },
  backBtn: {width: 36, height: 36, borderRadius: 10, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center'},
  backArrow: {fontSize: 26, color: C.textPrimary, lineHeight: 30},
  headerTitle: {flex: 1, fontSize: 16, fontWeight: '700', color: C.textPrimary, textAlign: 'center'},
  headerNum: {backgroundColor: C.primary + '15', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8},
  headerNumText: {fontSize: 12, fontWeight: '700', color: C.primary},
  scroll: {flex: 1},
  scrollContent: {padding: 16, gap: 4},
  section: {marginBottom: 14},
  sectionTitle: {fontSize: 13, fontWeight: '700', color: C.textSecondary, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5},
  card: {backgroundColor: C.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: C.border, gap: 12},
  infoRow: {flexDirection: 'row', alignItems: 'center', gap: 10},
  infoLabel: {flex: 1, fontSize: 15, fontWeight: '600', color: C.textPrimary},
  infoValue: {flex: 1, fontSize: 14, color: C.textSecondary},
  phoneIcon: {fontSize: 16},
  plateIcon: {fontSize: 16},
  serviceIcon: {fontSize: 16},
  priceTag: {fontSize: 14, fontWeight: '700', color: C.primary},
  earningHighlight: {backgroundColor: C.success + '12', borderRadius: 10, padding: 10, marginTop: 4},
  earningText: {flex: 1, fontSize: 15, fontWeight: '800', color: C.success},
  statusBadgeBig: {marginTop: 12, alignSelf: 'center', paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20},
  statusBadgeBigText: {fontSize: 13, fontWeight: '700'},
  phoneBtn: {backgroundColor: C.primary + '15', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8},
  phoneBtnText: {fontSize: 12, fontWeight: '700', color: C.primary},
  waBtnStyle: {backgroundColor: '#25D366' + '18'},
  waBtnText: {fontSize: 12, fontWeight: '700', color: '#25D366'},
  changeCarBtn: {flexDirection: 'row', alignItems: 'center', gap: 6, paddingTop: 4},
  changeCarText: {fontSize: 13, color: C.primary, fontWeight: '600'},
  actionBtn: {
    marginHorizontal: 0, borderRadius: 16, paddingVertical: 18,
    alignItems: 'center', justifyContent: 'center', marginBottom: 10,
    shadowColor: C.primary, shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.25, shadowRadius: 8, elevation: 5,
  },
  actionBtnText: {color: '#fff', fontSize: 17, fontWeight: '800'},
  cancelBtn: {
    borderRadius: 14, paddingVertical: 14, alignItems: 'center',
    borderWidth: 1.5, borderColor: C.danger + '50',
    backgroundColor: '#FEF2F2',
  },
  cancelBtnText: {color: C.danger, fontSize: 14, fontWeight: '700'},
});

const modalSt = StyleSheet.create({
  overlay: {flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center', padding: 24},
  box: {backgroundColor: C.card, borderRadius: 24, padding: 28, width: '100%', alignItems: 'center'},
  warningIcon: {fontSize: 44, marginBottom: 10},
  successIcon: {fontSize: 56, marginBottom: 10},
  boxTitle: {fontSize: 20, fontWeight: '800', color: C.textPrimary, textAlign: 'center', marginBottom: 10},
  boxBody: {fontSize: 14, color: C.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: 16},
  earningLine: {fontSize: 14, color: C.textSecondary, marginBottom: 4},
  earningAmount: {fontSize: 38, fontWeight: '800', color: C.success, marginBottom: 20},
  reasonInput: {
    width: '100%', borderWidth: 1.5, borderColor: C.border, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: C.textPrimary,
    marginBottom: 16, textAlign: 'right',
  },
  btnRow: {flexDirection: 'row', gap: 10, width: '100%'},
  secondaryBtn: {flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: C.bg, borderWidth: 1, borderColor: C.border, alignItems: 'center'},
  secondaryBtnText: {fontSize: 14, fontWeight: '700', color: C.textPrimary},
  dangerBtn: {flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: C.danger, alignItems: 'center'},
  dangerBtnText: {fontSize: 14, fontWeight: '700', color: '#fff'},
  confirmBtn: {width: '100%', paddingVertical: 16, borderRadius: 14, backgroundColor: C.primary, alignItems: 'center', marginTop: 8},
  confirmBtnText: {color: '#fff', fontSize: 16, fontWeight: '700'},
  slideOverlay: {flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)'},
  slideSheet: {backgroundColor: C.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40},
  slideHandle: {width: 40, height: 4, backgroundColor: C.border, borderRadius: 2, alignSelf: 'center', marginBottom: 20},
  slideTitle: {fontSize: 18, fontWeight: '800', color: C.textPrimary, textAlign: 'center', marginBottom: 8},
  slideSubtitle: {fontSize: 13, color: C.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: 20},
});

const imgUpSt = StyleSheet.create({
  grid: {flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center', marginBottom: 12},
  slot: {
    width: 100, height: 100, borderRadius: 14, borderWidth: 2,
    borderColor: C.border, borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center', backgroundColor: C.bg,
  },
  slotFilled: {borderColor: C.success, borderStyle: 'solid', backgroundColor: C.success + '15'},
  plusIcon: {fontSize: 32, color: C.textSecondary},
  checkIcon: {fontSize: 32, color: C.success},
  photoCount: {fontSize: 13, color: C.success, fontWeight: '700', textAlign: 'center', marginBottom: 8},
});

// ─── OrdersScreen (List + Details) ───────────────────────────────────────────
function OrdersScreen(): React.JSX.Element {
  const [subScreen, setSubScreen] = useState<OrdersSubScreen>('list');
  const [selectedOrder, setSelectedOrder] = useState<OrderType | null>(null);
  const [filter, setFilter] = useState<'active' | 'past'>('active');
  const [refreshing, setRefreshing] = useState(false);

  const allActive = MOCK_ORDERS;
  const allPast = MOCK_PAST_ORDERS;
  const displayList = filter === 'active' ? allActive : allPast;

  // Group by date label
  const grouped: {label: string; data: OrderType[]}[] = [];
  const seenDates = new Set<string>();
  displayList.forEach(o => {
    if (!seenDates.has(o.scheduledDate)) {
      seenDates.add(o.scheduledDate);
      grouped.push({label: o.scheduledDate, data: []});
    }
    grouped[grouped.length - 1].data.push(o);
  });

  const onRefresh = () => {
    setRefreshing(true);
    // TODO: GET /api/biker/order?status=active&page=1&limit=20
    setTimeout(() => setRefreshing(false), 1000);
  };

  const openOrder = (order: OrderType) => {
    setSelectedOrder(order);
    setSubScreen('details');
  };

  if (subScreen === 'details' && selectedOrder) {
    return <OrderDetailsScreen order={selectedOrder} onBack={() => { setSubScreen('list'); setSelectedOrder(null); }} />;
  }

  return (
    <View style={ordListSt.root}>
      <StatusBar barStyle="dark-content" backgroundColor={C.card} />

      {/* Header */}
      <View style={ordListSt.header}>
        <Text style={ordListSt.headerTitle}>طلباتي</Text>
        <View style={[ordListSt.headerBadge, {backgroundColor: filter === 'active' ? C.primary : C.success}]}>
          <Text style={ordListSt.headerBadgeText}>
            {filter === 'active' ? allActive.length : allPast.length}
          </Text>
        </View>
      </View>

      {/* Segmented Control */}
      <View style={ordListSt.segWrap}>
        <TouchableOpacity
          style={[ordListSt.seg, filter === 'active' && ordListSt.segActive]}
          onPress={() => setFilter('active')}>
          <Text style={[ordListSt.segText, filter === 'active' && ordListSt.segTextActive]}>
            نشطة ✓
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[ordListSt.seg, filter === 'past' && ordListSt.segActive]}
          onPress={() => setFilter('past')}>
          <Text style={[ordListSt.segText, filter === 'past' && ordListSt.segTextActive]}>
            السابقة
          </Text>
        </TouchableOpacity>
      </View>

      {/* List */}
      {displayList.length === 0 ? (
        <View style={ordListSt.empty}>
          <Text style={ordListSt.emptyIcon}>📭</Text>
          <Text style={ordListSt.emptyText}>لا توجد طلبات هنا</Text>
        </View>
      ) : (
        <ScrollView
          style={ordListSt.scroll}
          contentContainerStyle={ordListSt.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[C.primary]} />}>
          {grouped.map(group => (
            <View key={group.label}>
              {/* Section Header */}
              <View style={ordListSt.sectionHeader}>
                <View style={ordListSt.sectionLine} />
                <Text style={ordListSt.sectionLabel}>{group.label}</Text>
                <View style={ordListSt.sectionLine} />
              </View>
              {/* Cards */}
              {group.data.map(order => (
                <OrderListCard key={order._id} order={order} onPress={() => openOrder(order)} />
              ))}
            </View>
          ))}
          <View style={{height: 16}} />
        </ScrollView>
      )}
    </View>
  );
}

const ordListSt = StyleSheet.create({
  root: {flex: 1, backgroundColor: C.bg},
  header: {
    paddingTop: 52, paddingBottom: 16, paddingHorizontal: 24,
    backgroundColor: C.card, borderBottomWidth: 1, borderBottomColor: C.border,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
  },
  headerTitle: {fontSize: 20, fontWeight: '800', color: C.textPrimary},
  headerBadge: {paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12},
  headerBadgeText: {color: '#fff', fontSize: 13, fontWeight: '700'},
  segWrap: {flexDirection: 'row', margin: 16, backgroundColor: C.border, borderRadius: 14, padding: 4},
  seg: {flex: 1, paddingVertical: 11, borderRadius: 11, alignItems: 'center'},
  segActive: {
    backgroundColor: C.card,
    shadowColor: '#000', shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.08, elevation: 2,
  },
  segText: {fontSize: 14, fontWeight: '600', color: C.textSecondary},
  segTextActive: {color: C.primary, fontWeight: '800'},
  scroll: {flex: 1},
  scrollContent: {paddingHorizontal: 16, paddingTop: 12, gap: 16},
  sectionHeader: {flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 12},
  sectionLine: {flex: 1, height: 1, backgroundColor: C.border},
  sectionLabel: {fontSize: 12, fontWeight: '700', color: C.textSecondary},
  empty: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  emptyIcon: {fontSize: 56, marginBottom: 12},
  emptyText: {fontSize: 15, color: C.textSecondary},
});

// ─── ReviewsScreen ────────────────────────────────────────────────────────────
const MOCK_REVIEWS = [
  {_id:'1', client:'سعد العتيبي',   rating:5, comment:'خدمة ممتازة وسريعة جداً!',     date:'منذ يومين'},
  {_id:'2', client:'خالد المطيري',  rating:4, comment:'عمل جيد، شكراً',              date:'منذ أسبوع'},
  {_id:'3', client:'فهد الشمري',    rating:5, comment:'أفضل بايكر تعاملت معه',        date:'منذ أسبوعين'},
  {_id:'4', client:'عبدالله السالم',rating:3, comment:'جيد لكن تأخر قليلاً',          date:'منذ شهر'},
];

function ReviewsScreen(): React.JSX.Element {
  const avg = (MOCK_REVIEWS.reduce((a, r) => a + r.rating, 0) / MOCK_REVIEWS.length).toFixed(1);
  return (
    <View style={otherSt.root}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
      <View style={otherSt.header}>
        <Text style={otherSt.headerTitle}>التقييمات</Text>
      </View>
      {/* Summary */}
      <View style={reviewSt.summary}>
        <Text style={reviewSt.avgNum}>{avg}</Text>
        <Text style={reviewSt.stars}>{'⭐'.repeat(Math.round(Number(avg)))}</Text>
        <Text style={reviewSt.total}>من {MOCK_REVIEWS.length} تقييم</Text>
      </View>
      <FlatList
        data={MOCK_REVIEWS}
        keyExtractor={i => i._id}
        contentContainerStyle={{padding: 16, gap: 12}}
        renderItem={({item}) => (
          <View style={reviewSt.card}>
            <View style={reviewSt.cardHeader}>
              <Text style={reviewSt.clientName}>{item.client}</Text>
              <Text style={reviewSt.date}>{item.date}</Text>
            </View>
            <Text style={reviewSt.stars2}>{'⭐'.repeat(item.rating)}</Text>
            <Text style={reviewSt.comment}>{item.comment}</Text>
          </View>
        )}
      />
    </View>
  );
}

const reviewSt = StyleSheet.create({
  summary: {
    backgroundColor: C.primary, margin: 16, borderRadius: 20,
    padding: 24, alignItems: 'center',
  },
  avgNum: {fontSize: 52, fontWeight: '800', color: '#fff'},
  stars: {fontSize: 22, marginVertical: 4},
  total: {fontSize: 13, color: 'rgba(255,255,255,0.8)'},
  card: {
    backgroundColor: C.card, borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: C.border,
  },
  cardHeader: {flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6},
  clientName: {fontSize: 15, fontWeight: '700', color: C.textPrimary},
  date: {fontSize: 12, color: C.textSecondary},
  stars2: {fontSize: 16, marginBottom: 6},
  comment: {fontSize: 14, color: C.textSecondary, lineHeight: 20},
});

// ─── ProfileScreen ────────────────────────────────────────────────────────────
function ProfileScreen({onLogout}: {onLogout: () => void}): React.JSX.Element {
  const items = [
    {icon: '✏️', label: 'تعديل الملف الشخصي'},
    {icon: '💰', label: 'المحفظة'},
    {icon: '🔔', label: 'الإشعارات'},
    {icon: '📄', label: 'التقارير'},
    {icon: '📋', label: 'السياسات والشروط'},
  ];
  return (
    <View style={otherSt.root}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
      <View style={otherSt.header}>
        <Text style={otherSt.headerTitle}>الملف الشخصي</Text>
      </View>
      <ScrollView contentContainerStyle={{paddingBottom: 32}}>
        {/* Avatar */}
        <View style={profileSt.avatarSection}>
          <View style={profileSt.avatar}>
            <Text style={profileSt.avatarText}>
              {MOCK_USER.firstName[0]}{MOCK_USER.lastName[0]}
            </Text>
          </View>
          <Text style={profileSt.name}>{MOCK_USER.firstName} {MOCK_USER.lastName}</Text>
          <View style={profileSt.ratingRow}>
            <Text style={profileSt.ratingStar}>⭐</Text>
            <Text style={profileSt.ratingVal}>{MOCK_USER.rating}</Text>
          </View>
        </View>
        {/* Menu */}
        <View style={profileSt.menu}>
          {items.map((item, i) => (
            <TouchableOpacity key={i} style={profileSt.menuItem} activeOpacity={0.7}>
              <Text style={profileSt.menuIcon}>{item.icon}</Text>
              <Text style={profileSt.menuLabel}>{item.label}</Text>
              <Text style={profileSt.menuChevron}>‹</Text>
            </TouchableOpacity>
          ))}
        </View>
        {/* Logout */}
        <TouchableOpacity style={profileSt.logoutBtn} onPress={onLogout} activeOpacity={0.8}>
          <Text style={profileSt.logoutText}>🚪  تسجيل الخروج</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const profileSt = StyleSheet.create({
  avatarSection: {alignItems: 'center', paddingVertical: 28},
  avatar: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  avatarText: {fontSize: 32, fontWeight: '800', color: '#fff'},
  name: {fontSize: 20, fontWeight: '700', color: C.textPrimary, marginBottom: 6},
  ratingRow: {flexDirection: 'row', alignItems: 'center', gap: 4},
  ratingStar: {fontSize: 16},
  ratingVal: {fontSize: 15, fontWeight: '700', color: C.textPrimary},
  menu: {marginHorizontal: 16, backgroundColor: C.card, borderRadius: 16, borderWidth: 1, borderColor: C.border, overflow: 'hidden'},
  menuItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  menuIcon: {fontSize: 20, marginRight: 14},
  menuLabel: {flex: 1, fontSize: 15, color: C.textPrimary},
  menuChevron: {fontSize: 20, color: C.textSecondary, transform: [{rotate: '180deg'}]},
  logoutBtn: {marginHorizontal: 16, marginTop: 16, backgroundColor: '#FEF2F2', borderRadius: 14, paddingVertical: 16, alignItems: 'center', borderWidth: 1, borderColor: '#FECACA'},
  logoutText: {fontSize: 15, color: C.danger, fontWeight: '700'},
});

// ─── Shared styles ────────────────────────────────────────────────────────────
const otherSt = StyleSheet.create({
  root: {flex: 1, backgroundColor: C.bg},
  header: {paddingTop: 52, paddingBottom: 16, paddingHorizontal: 24, backgroundColor: C.card, borderBottomWidth: 1, borderBottomColor: C.border},
  headerTitle: {fontSize: 20, fontWeight: '800', color: C.textPrimary, textAlign: 'center'},
  filterRow: {flexDirection: 'row', margin: 16, backgroundColor: C.border, borderRadius: 12, padding: 4},
  filterBtn: {flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center'},
  filterBtnActive: {backgroundColor: C.card, shadowColor: '#000', shadowOffset: {width: 0, height: 1}, shadowOpacity: 0.08, elevation: 2},
  filterText: {fontSize: 14, color: C.textSecondary, fontWeight: '600'},
  filterTextActive: {color: C.primary},
  orderCard: {backgroundColor: C.card, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: C.border},
  orderCardHeader: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8},
  orderNum: {fontSize: 14, fontWeight: '700', color: C.textPrimary},
  badge: {paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20},
  badgeText: {fontSize: 11, fontWeight: '700'},
  orderCar: {fontSize: 15, fontWeight: '600', color: C.textPrimary, marginBottom: 6},
  orderMeta: {fontSize: 12, color: C.textSecondary, marginBottom: 3},
  orderFooter: {flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: C.border},
  orderClient: {fontSize: 12, color: C.textSecondary},
  orderPlate: {fontSize: 12, fontWeight: '600', color: C.textPrimary},
  empty: {flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80},
  emptyIcon: {fontSize: 48, marginBottom: 12},
  emptyText: {fontSize: 15, color: C.textSecondary},
});

// ─── Bottom Tab Navigator ─────────────────────────────────────────────────────
function AppTabs({onLogout}: {onLogout: () => void}): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<Tab>('home');

  const renderScreen = () => {
    switch (activeTab) {
      case 'home':    return <HomeScreen />;
      case 'orders':  return <OrdersScreen />;
      case 'reviews': return <ReviewsScreen />;
      case 'profile': return <ProfileScreen onLogout={onLogout} />;
    }
  };

  return (
    <View style={tabSt.root}>
      <View style={tabSt.content}>{renderScreen()}</View>
      <View style={tabSt.tabBar}>
        {TABS.map(({key, label, icon}) => {
          const active = activeTab === key;
          return (
            <TouchableOpacity
              key={key}
              style={tabSt.tabItem}
              onPress={() => setActiveTab(key)}
              activeOpacity={0.7}>
              <View style={[tabSt.iconWrap, active && tabSt.iconWrapActive]}>
                <Icon name={icon} size={22} color={active ? C.primary : C.textSecondary} />
              </View>
              <Text style={[tabSt.label, active && tabSt.labelActive]}>{label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const tabSt = StyleSheet.create({
  root: {flex: 1},
  content: {flex: 1},
  tabBar: {
    flexDirection: 'row', backgroundColor: C.card,
    borderTopWidth: 1, borderTopColor: C.border,
    paddingBottom: Platform.OS === 'ios' ? 24 : 8,
    paddingTop: 8,
  },
  tabItem: {flex: 1, alignItems: 'center', gap: 2},
  iconWrap: {width: 44, height: 28, alignItems: 'center', justifyContent: 'center', borderRadius: 14},
  iconWrapActive: {backgroundColor: C.primary + '18'},
  icon: {fontSize: 20},
  label: {fontSize: 10, color: C.textSecondary, fontWeight: '500'},
  labelActive: {color: C.primary, fontWeight: '700'},
});

// ─── LoginScreen ──────────────────────────────────────────────────────────────
function LoginScreen({onLogin, onGuest}: {onLogin: () => void; onGuest: () => void}): React.JSX.Element {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = () => {
    if (!username.trim() || !password.trim()) {
      setError('الرجاء إدخال رقم الهاتف وكلمة المرور');
      return;
    }
    setError(null);
    setIsLoading(true);
    // TODO: POST /api/auth/signin/credentials
    setTimeout(() => { setIsLoading(false); onLogin(); }, 800);
  };

  return (
    <KeyboardAvoidingView style={loginSt.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
      <ScrollView contentContainerStyle={loginSt.scroll} keyboardShouldPersistTaps="handled">
        <View style={loginSt.logoRow}>
          <Text style={loginSt.logoText}>Swivo</Text>
          <View style={loginSt.logoDot} />
        </View>
        <Text style={loginSt.title}>مرحباً بك في Swivo Biker</Text>
        <Text style={loginSt.subtitle}>سجل دخولك للمتابعة</Text>
        <View style={loginSt.form}>
          <TextInput
            style={loginSt.input}
            placeholder="رقم الهاتف / البريد الإلكتروني"
            placeholderTextColor={C.textSecondary}
            value={username}
            onChangeText={v => { setUsername(v); setError(null); }}
            keyboardType="phone-pad"
            textAlign="right"
            autoCapitalize="none"
            editable={!isLoading}
          />
          <View style={loginSt.passwordRow}>
            <TextInput
              style={loginSt.passwordInput}
              placeholder="كلمة المرور"
              placeholderTextColor={C.textSecondary}
              value={password}
              onChangeText={v => { setPassword(v); setError(null); }}
              secureTextEntry={!showPassword}
              textAlign="right"
              editable={!isLoading}
            />
            <TouchableOpacity onPress={() => setShowPassword(p => !p)} hitSlop={{top:10,bottom:10,left:10,right:10}}>
              <Text style={loginSt.eye}>{showPassword ? '🙈' : '👁'}</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={[loginSt.btn, isLoading && {opacity: 0.65}]} onPress={handleLogin} disabled={isLoading} activeOpacity={0.85}>
            {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={loginSt.btnText}>تسجيل الدخول</Text>}
          </TouchableOpacity>
          {error ? <Text style={loginSt.error}>{error}</Text> : null}
          <View style={loginSt.dividerRow}>
            <View style={loginSt.dividerLine} />
            <Text style={loginSt.dividerText}>أو</Text>
            <View style={loginSt.dividerLine} />
          </View>
          <TouchableOpacity style={loginSt.guestBtn} onPress={onGuest} activeOpacity={0.7}>
            <Text style={loginSt.guestBtnText}>تصفح كزائر</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const loginSt = StyleSheet.create({
  root: {flex: 1, backgroundColor: C.bg},
  scroll: {flexGrow: 1, alignItems: 'center', paddingHorizontal: 24, paddingTop: 100, paddingBottom: 40},
  logoRow: {flexDirection: 'row', alignItems: 'center', marginBottom: 40},
  logoText: {fontSize: 40, fontWeight: '800', color: C.primary, letterSpacing: -1},
  logoDot: {width: 9, height: 9, borderRadius: 5, backgroundColor: C.primary, marginLeft: 3, marginTop: 6},
  title: {fontSize: 22, fontWeight: '700', color: C.textPrimary, textAlign: 'center', marginBottom: 8},
  subtitle: {fontSize: 14, color: C.textSecondary, textAlign: 'center', marginBottom: 36},
  form: {width: '100%', gap: 14},
  input: {height: 52, backgroundColor: C.card, borderWidth: 1.5, borderColor: C.border, borderRadius: 12, paddingHorizontal: 16, fontSize: 15, color: C.textPrimary},
  passwordRow: {height: 52, backgroundColor: C.card, borderWidth: 1.5, borderColor: C.border, borderRadius: 12, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center'},
  passwordInput: {flex: 1, fontSize: 15, color: C.textPrimary, textAlign: 'right'},
  eye: {fontSize: 18, paddingLeft: 10},
  btn: {height: 52, backgroundColor: C.primary, borderRadius: 12, alignItems: 'center', justifyContent: 'center', shadowColor: C.primary, shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4},
  btnText: {color: '#fff', fontSize: 16, fontWeight: '700'},
  error: {color: C.danger, fontSize: 13, textAlign: 'center', marginTop: 4},
  dividerRow: {flexDirection: 'row', alignItems: 'center', gap: 10},
  dividerLine: {flex: 1, height: 1, backgroundColor: C.border},
  dividerText: {color: C.textSecondary, fontSize: 13},
  guestBtn: {height: 52, borderRadius: 12, borderWidth: 1.5, borderColor: C.border, alignItems: 'center', justifyContent: 'center'},
  guestBtnText: {color: C.textSecondary, fontSize: 15, fontWeight: '600'},
});

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App(): React.JSX.Element {
  const [screen, setScreen] = useState<Screen>('login');

  if (screen === 'app') {
    return <AppTabs onLogout={() => setScreen('login')} />;
  }

  return <LoginScreen onLogin={() => setScreen('app')} onGuest={() => setScreen('app')} />;
}
