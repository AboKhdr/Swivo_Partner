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

const MOCK_ORDERS = [
  {
    _id: '1', orderNumber: 'ORD-1234', status: 'ASSIGNED',
    car: {brand: 'Toyota', model: 'Camry', color: 'أبيض', plateNumber: 'ABC 1234'},
    address: 'الرياض - حي النزهة', scheduledAt: '10:30 ص',
    service: {name: 'غسيل كامل'}, client: {firstName: 'سعد'},
  },
  {
    _id: '2', orderNumber: 'ORD-1235', status: 'ON_THE_WAY',
    car: {brand: 'Honda', model: 'Accord', color: 'أسود', plateNumber: 'XYZ 5678'},
    address: 'الرياض - حي العليا', scheduledAt: '11:00 ص',
    service: {name: 'غسيل داخلي'}, client: {firstName: 'خالد'},
  },
  {
    _id: '3', orderNumber: 'ORD-1236', status: 'STARTED',
    car: {brand: 'BMW', model: 'X5', color: 'رمادي', plateNumber: 'DEF 9012'},
    address: 'الرياض - حي الملقا', scheduledAt: '12:00 م',
    service: {name: 'تنظيف شامل'}, client: {firstName: 'عمر'},
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
  STARTED:    {label: 'جارٍ',     color: C.purple},
};

// ─── Types ────────────────────────────────────────────────────────────────────
type Screen = 'login' | 'app';
type Tab = 'home' | 'orders' | 'reviews' | 'profile';

const TABS: {key: Tab; label: string; icon: string}[] = [
  {key: 'home',    label: 'الرئيسية', icon: '🏠'},
  {key: 'orders',  label: 'الطلبات',  icon: '📋'},
  {key: 'reviews', label: 'التقييمات', icon: '⭐'},
  {key: 'profile', label: 'الملف',    icon: '👤'},
];

// ─── OrderCard ────────────────────────────────────────────────────────────────
function OrderCard({order}: {order: typeof MOCK_ORDERS[0]}): React.JSX.Element {
  const st = STATUS_MAP[order.status] ?? {label: order.status, color: C.textSecondary};
  return (
    <TouchableOpacity style={orderSt.card} activeOpacity={0.85}>
      <View style={orderSt.header}>
        <Text style={orderSt.number}>#{order.orderNumber}</Text>
        <View style={[orderSt.badge, {backgroundColor: st.color + '22'}]}>
          <Text style={[orderSt.badgeText, {color: st.color}]}>{st.label}</Text>
        </View>
      </View>
      <Text style={orderSt.car}>{order.car.brand} {order.car.model} — {order.car.color}</Text>
      <View style={orderSt.row}>
        <Text style={orderSt.meta}>📍 {order.address}</Text>
      </View>
      <View style={orderSt.row}>
        <Text style={orderSt.meta}>🕐 {order.scheduledAt}</Text>
        <Text style={orderSt.service}>{order.service.name}</Text>
      </View>
      <View style={orderSt.footer}>
        <Text style={orderSt.client}>العميل: {order.client.firstName}</Text>
        <Text style={orderSt.plateNum}>{order.car.plateNumber}</Text>
      </View>
    </TouchableOpacity>
  );
}

const orderSt = StyleSheet.create({
  card: {
    width: 260, backgroundColor: C.card, borderRadius: 16,
    padding: 16, marginLeft: 16,
    borderWidth: 1, borderColor: C.border,
    shadowColor: '#000', shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  header: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8},
  number: {fontSize: 14, fontWeight: '700', color: C.textPrimary},
  badge: {paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20},
  badgeText: {fontSize: 11, fontWeight: '700'},
  car: {fontSize: 15, fontWeight: '600', color: C.textPrimary, marginBottom: 8},
  row: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4},
  meta: {fontSize: 12, color: C.textSecondary},
  service: {fontSize: 12, color: C.primary, fontWeight: '600'},
  footer: {
    flexDirection: 'row', justifyContent: 'space-between',
    marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: C.border,
  },
  client: {fontSize: 12, color: C.textSecondary},
  plateNum: {fontSize: 12, color: C.textPrimary, fontWeight: '600'},
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
    <View style={homeSt.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.primary} />

      {/* Header */}
      <View style={homeSt.header}>
        <View>
          <Text style={homeSt.greeting}>مرحباً 👋</Text>
          <Text style={homeSt.name}>{MOCK_USER.firstName} {MOCK_USER.lastName}</Text>
        </View>
        <TouchableOpacity style={homeSt.notifBtn} activeOpacity={0.8}>
          <Text style={homeSt.notifIcon}>🔔</Text>
          {notifCount > 0 && (
            <View style={homeSt.badge}>
              <Text style={homeSt.badgeText}>{notifCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={homeSt.scroll}
        contentContainerStyle={homeSt.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[C.primary]} />}>

        {/* Wallet Card */}
        <View style={homeSt.walletCard}>
          <View style={homeSt.walletTop}>
            <Text style={homeSt.walletLabel}>🏦  رصيدك الحالي</Text>
            <Text style={homeSt.walletCurrency}>SAR</Text>
          </View>
          <Text style={homeSt.walletBalance}>
            ﷼ {MOCK_USER.wallet.balance.toLocaleString('ar-SA', {minimumFractionDigits: 2})}
          </Text>
          <View style={homeSt.walletDivider} />
          <View style={homeSt.walletRow}>
            <Text style={homeSt.walletRowLabel}>أرباح هذا الشهر</Text>
            <Text style={homeSt.walletRowValue}>﷼ {MOCK_USER.wallet.monthlyEarnings.toLocaleString()}</Text>
          </View>
          <View style={homeSt.walletRow}>
            <Text style={homeSt.walletRowLabel}>أرباح هذا الأسبوع</Text>
            <Text style={homeSt.walletRowValue}>﷼ {MOCK_USER.wallet.weeklyEarnings.toLocaleString()}</Text>
          </View>
          <TouchableOpacity style={homeSt.walletBtn} activeOpacity={0.85}>
            <Text style={homeSt.walletBtnText}>عرض المحفظة كاملاً ←</Text>
          </TouchableOpacity>
        </View>

        {/* Branch Selector */}
        <TouchableOpacity style={homeSt.branchBtn} onPress={() => setBranchModal(true)} activeOpacity={0.8}>
          <Text style={homeSt.branchIcon}>📍</Text>
          <Text style={homeSt.branchText}>{selectedBranch.name}</Text>
          <Text style={homeSt.branchChevron}>▾</Text>
        </TouchableOpacity>

        {/* Active Orders */}
        <View style={homeSt.sectionHeader}>
          <Text style={homeSt.sectionTitle}>طلباتك النشطة</Text>
          <View style={homeSt.countBadge}>
            <Text style={homeSt.countText}>{MOCK_ORDERS.length}</Text>
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
          <View style={homeSt.empty}>
            <Text style={homeSt.emptyIcon}>📭</Text>
            <Text style={homeSt.emptyText}>لا توجد طلبات نشطة الآن</Text>
          </View>
        )}

        {/* Rating */}
        <View style={homeSt.ratingCard}>
          <Text style={homeSt.ratingLabel}>تقييمك الحالي</Text>
          <View style={homeSt.ratingRow}>
            <Text style={homeSt.ratingStar}>⭐</Text>
            <Text style={homeSt.ratingValue}>{MOCK_USER.rating}</Text>
            <Text style={homeSt.ratingMax}> / 5.0</Text>
          </View>
        </View>

      </ScrollView>

      {/* Branch Modal */}
      <Modal visible={branchModal} transparent animationType="slide" onRequestClose={() => setBranchModal(false)}>
        <TouchableOpacity style={homeSt.modalOverlay} activeOpacity={1} onPress={() => setBranchModal(false)} />
        <View style={homeSt.modalSheet}>
          <View style={homeSt.modalHandle} />
          <Text style={homeSt.modalTitle}>اختر المنطقة</Text>
          {MOCK_BRANCHES.map(b => (
            <TouchableOpacity
              key={b._id}
              style={homeSt.branchOption}
              onPress={() => setTempBranch(b)}>
              <View style={[homeSt.radio, tempBranch._id === b._id && homeSt.radioSelected]} />
              <Text style={[homeSt.branchOptionText, tempBranch._id === b._id && {color: C.primary, fontWeight: '700'}]}>
                {b.name}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={homeSt.modalConfirmBtn}
            onPress={() => { setSelectedBranch(tempBranch); setBranchModal(false); }}>
            <Text style={homeSt.modalConfirmText}>تأكيد</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const homeSt = StyleSheet.create({
  root: {flex: 1, backgroundColor: C.bg},
  // Header
  header: {
    backgroundColor: C.primary, paddingTop: 52, paddingBottom: 20,
    paddingHorizontal: 24, flexDirection: 'row',
    justifyContent: 'space-between', alignItems: 'center',
  },
  greeting: {fontSize: 13, color: 'rgba(255,255,255,0.8)', marginBottom: 2},
  name: {fontSize: 20, fontWeight: '700', color: '#fff'},
  notifBtn: {width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center'},
  notifIcon: {fontSize: 20},
  badge: {
    position: 'absolute', top: 6, right: 6,
    backgroundColor: C.danger, borderRadius: 8,
    minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center',
  },
  badgeText: {color: '#fff', fontSize: 9, fontWeight: '800'},
  // Scroll
  scroll: {flex: 1},
  scrollContent: {paddingBottom: 32},
  // Wallet
  walletCard: {
    margin: 16, borderRadius: 20, padding: 20,
    backgroundColor: C.primaryDark,
    shadowColor: C.primary, shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 8,
  },
  walletTop: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8},
  walletLabel: {fontSize: 13, color: 'rgba(255,255,255,0.8)'},
  walletCurrency: {fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: '600'},
  walletBalance: {fontSize: 34, fontWeight: '800', color: '#fff', marginBottom: 16},
  walletDivider: {height: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginBottom: 12},
  walletRow: {flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6},
  walletRowLabel: {fontSize: 13, color: 'rgba(255,255,255,0.7)'},
  walletRowValue: {fontSize: 13, color: '#fff', fontWeight: '600'},
  walletBtn: {
    marginTop: 16, backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 10, paddingVertical: 10, alignItems: 'center',
  },
  walletBtnText: {color: '#fff', fontSize: 14, fontWeight: '600'},
  // Branch
  branchBtn: {
    marginHorizontal: 16, marginBottom: 16,
    backgroundColor: C.card, borderRadius: 14, borderWidth: 1, borderColor: C.border,
    paddingHorizontal: 16, paddingVertical: 14,
    flexDirection: 'row', alignItems: 'center',
    shadowColor: '#000', shadowOffset: {width: 0, height: 1}, shadowOpacity: 0.04, elevation: 1,
  },
  branchIcon: {fontSize: 18, marginRight: 8},
  branchText: {flex: 1, fontSize: 15, color: C.textPrimary, fontWeight: '500'},
  branchChevron: {fontSize: 14, color: C.textSecondary},
  // Section
  sectionHeader: {flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 12, gap: 8},
  sectionTitle: {fontSize: 17, fontWeight: '700', color: C.textPrimary},
  countBadge: {backgroundColor: C.primary + '1A', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 2},
  countText: {fontSize: 13, color: C.primary, fontWeight: '700'},
  // Empty
  empty: {alignItems: 'center', paddingVertical: 32, paddingHorizontal: 16},
  emptyIcon: {fontSize: 40, marginBottom: 12},
  emptyText: {fontSize: 15, color: C.textSecondary},
  // Rating
  ratingCard: {
    margin: 16, backgroundColor: C.card, borderRadius: 14,
    borderWidth: 1, borderColor: C.border,
    padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  ratingLabel: {fontSize: 14, color: C.textSecondary},
  ratingRow: {flexDirection: 'row', alignItems: 'center'},
  ratingStar: {fontSize: 18},
  ratingValue: {fontSize: 22, fontWeight: '800', color: C.textPrimary, marginLeft: 4},
  ratingMax: {fontSize: 14, color: C.textSecondary, marginTop: 4},
  // Logout
  logoutBtn: {marginHorizontal: 16, marginTop: 4, paddingVertical: 14, alignItems: 'center'},
  logoutText: {fontSize: 14, color: C.danger, fontWeight: '600'},
  // Modal
  modalOverlay: {flex: 1, backgroundColor: 'rgba(0,0,0,0.4)'},
  modalSheet: {
    backgroundColor: C.card, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 40,
  },
  modalHandle: {width: 40, height: 4, backgroundColor: C.border, borderRadius: 2, alignSelf: 'center', marginBottom: 20},
  modalTitle: {fontSize: 17, fontWeight: '700', color: C.textPrimary, textAlign: 'center', marginBottom: 20},
  branchOption: {flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.border},
  radio: {width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: C.border, marginRight: 12},
  radioSelected: {borderColor: C.primary, backgroundColor: C.primary},
  branchOptionText: {fontSize: 15, color: C.textPrimary},
  modalConfirmBtn: {
    marginTop: 20, backgroundColor: C.primary, borderRadius: 14,
    paddingVertical: 16, alignItems: 'center',
  },
  modalConfirmText: {color: '#fff', fontSize: 16, fontWeight: '700'},
});

// ─── OrdersScreen ─────────────────────────────────────────────────────────────
function OrdersScreen(): React.JSX.Element {
  const [filter, setFilter] = useState<'active' | 'done'>('active');
  const filtered = filter === 'active' ? MOCK_ORDERS : [];

  return (
    <View style={otherSt.root}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
      <View style={otherSt.header}>
        <Text style={otherSt.headerTitle}>الطلبات</Text>
      </View>
      <View style={otherSt.filterRow}>
        {(['active','done'] as const).map(f => (
          <TouchableOpacity
            key={f}
            style={[otherSt.filterBtn, filter === f && otherSt.filterBtnActive]}
            onPress={() => setFilter(f)}>
            <Text style={[otherSt.filterText, filter === f && otherSt.filterTextActive]}>
              {f === 'active' ? 'النشطة' : 'المنجزة'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {filtered.length > 0 ? (
        <FlatList
          data={filtered}
          keyExtractor={i => i._id}
          contentContainerStyle={{padding: 16, gap: 12}}
          renderItem={({item}) => {
            const st = STATUS_MAP[item.status] ?? {label: item.status, color: C.textSecondary};
            return (
              <TouchableOpacity style={otherSt.orderCard} activeOpacity={0.85}>
                <View style={otherSt.orderCardHeader}>
                  <Text style={otherSt.orderNum}>#{item.orderNumber}</Text>
                  <View style={[otherSt.badge, {backgroundColor: st.color + '22'}]}>
                    <Text style={[otherSt.badgeText, {color: st.color}]}>{st.label}</Text>
                  </View>
                </View>
                <Text style={otherSt.orderCar}>{item.car.brand} {item.car.model} — {item.car.color}</Text>
                <Text style={otherSt.orderMeta}>📍 {item.address}</Text>
                <Text style={otherSt.orderMeta}>🕐 {item.scheduledAt}  ·  {item.service.name}</Text>
                <View style={otherSt.orderFooter}>
                  <Text style={otherSt.orderClient}>العميل: {item.client.firstName}</Text>
                  <Text style={otherSt.orderPlate}>{item.car.plateNumber}</Text>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      ) : (
        <View style={otherSt.empty}>
          <Text style={otherSt.emptyIcon}>📭</Text>
          <Text style={otherSt.emptyText}>لا توجد طلبات هنا</Text>
        </View>
      )}
    </View>
  );
}

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
        {TABS.map(tab => {
          const active = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={tabSt.tabItem}
              onPress={() => setActiveTab(tab.key)}
              activeOpacity={0.7}>
              <View style={[tabSt.iconWrap, active && tabSt.iconWrapActive]}>
                <Text style={tabSt.icon}>{tab.icon}</Text>
              </View>
              <Text style={[tabSt.label, active && tabSt.labelActive]}>{tab.label}</Text>
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
