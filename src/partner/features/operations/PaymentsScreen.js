import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import {
  ArrowRight,
  ArrowDownLeft,
  ArrowUpRight,
  CalendarDays,
  Check,
  TrendingUp,
  TrendingDown,
  Wallet,
  Lock,
} from 'lucide-react-native';
import {useTheme} from '../../../shared/context/ThemeContext';
import {getTransactions, getTenantWallet} from '../../../services/partner';
import RiyalIcon from '../../../shared/components/RiyalIcon';


const DATE_FILTERS = [
  {key: 'all',   label: 'الكل'},
  {key: 'today', label: 'اليوم'},
  {key: '3days', label: 'آخر 3 أيام'},
  {key: 'week',  label: 'هذا الأسبوع'},
  {key: 'month', label: 'هذا الشهر'},
];


// ─── Helpers ──────────────────────────────────────────────────────────────────
function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

function filterByDate(payments, key) {
  const now = new Date();
  if (key === 'all') return payments;
  if (key === 'today') return payments.filter(p => isSameDay(new Date(p.date), now));
  if (key === '3days') {
    const limit = new Date(now); limit.setDate(now.getDate() - 2);
    return payments.filter(p => new Date(p.date) >= limit);
  }
  if (key === 'week') {
    const limit = new Date(now); limit.setDate(now.getDate() - 6);
    return payments.filter(p => new Date(p.date) >= limit);
  }
  if (key === 'month') {
    return payments.filter(p => {
      const d = new Date(p.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
  }
  return payments;
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  const months = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
  return `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]}`;
}

function groupByDate(payments) {
  const groups = {};
  payments.forEach(p => {
    if (!groups[p.date]) groups[p.date] = [];
    groups[p.date].push(p);
  });
  return Object.keys(groups)
    .sort((a, b) => new Date(b) - new Date(a))
    .map(date => ({date, items: groups[date]}));
}

// ─── Filter Modal ─────────────────────────────────────────────────────────────
function FilterModal({visible, dateFilter, onDateChange, onClose, colors}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={fm.overlay} />
      </TouchableWithoutFeedback>
      <View style={fm.sheet}>
        <View style={[fm.card, {backgroundColor: colors.card}]}>
          <View style={[fm.handle, {backgroundColor: colors.border}]} />

          <Text style={[fm.section, {color: colors.textPrimary}]}>الفترة الزمنية</Text>
          <View style={fm.optionsWrap}>
            {DATE_FILTERS.map(f => {
              const active = dateFilter === f.key;
              return (
                <TouchableOpacity
                  key={f.key}
                  style={[fm.chip, {
                    backgroundColor: active ? colors.primary : colors.bg,
                    borderColor:     active ? colors.primary : colors.border,
                  }]}
                  onPress={() => onDateChange(f.key)}
                  activeOpacity={0.75}>
                  <Text style={[fm.chipTxt, {color: active ? '#FFF' : colors.textSecondary}]}>
                    {f.label}
                  </Text>
                  {active && <Check size={13} color="#FFF" />}
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity
            style={[fm.doneBtn, {backgroundColor: colors.primary}]}
            onPress={onClose}
            activeOpacity={0.85}>
            <Text style={fm.doneTxt}>تطبيق</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const fm = StyleSheet.create({
  overlay:     {position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)'},
  sheet:       {flex: 1, justifyContent: 'flex-end'},
  card:        {borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 32},
  handle:      {width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 16},
  section:     {fontSize: 14, fontWeight: '800', paddingHorizontal: 20, marginBottom: 12},
  optionsWrap: {flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 20},
  chip:        {flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 50, borderWidth: 1},
  chipTxt:     {fontSize: 13, fontWeight: '600'},
  divider:     {height: 1, marginVertical: 16},
  doneBtn:     {marginHorizontal: 20, marginTop: 20, paddingVertical: 14, borderRadius: 14, alignItems: 'center'},
  doneTxt:     {color: '#FFF', fontSize: 15, fontWeight: '700'},
});

// ─── Status helpers ───────────────────────────────────────────────────────────
// status: 0=pending/yellow  1=completed/green  2=failed/red  3=cancelled/grey
const STATUS_COLOR = {
  0: '#F59E0B',
  1: '#22C55E',
  2: '#EF4444',
  3: '#9CA3AF',
};
const STATUS_LABEL = {
  0: 'قيد الانتظار',
  1: 'مكتملة',
  2: 'فشلت',
  3: 'ملغاة',
};

// paymentMethod display map
const METHOD_LABEL = {
  wallet:        'محفظة',
  card:          'بطاقة',
  apple_pay:     'Apple Pay',
  google_pay:    'Google Pay',
  mada:          'مدى',
  cash:          'نقداً',
  bank_transfer: 'تحويل بنكي',
  voucher:       'كود هدية',
  'wallet & card': 'محفظة + بطاقة',
};

// ─── Transaction Detail Modal ─────────────────────────────────────────────────
function TxDetailModal({item, colors, onClose}) {
  if (!item) return null;
  const isIn        = item.entryType === 'credit';
  const statusColor = STATUS_COLOR[item.status] ?? '#9CA3AF';
  const statusLabel = STATUS_LABEL[item.status] ?? '';
  const methodDisplay = METHOD_LABEL[item.paymentMethod] ?? item.paymentMethod ?? null;
  const amountColor = isIn ? colors.success : colors.danger;

  function Row({label, value, valueColor}) {
    if (!value && value !== 0) return null;
    return (
      <View style={dm.row}>
        <Text style={[dm.rowLabel, {color: colors.textSecondary}]}>{label}</Text>
        <Text style={[dm.rowValue, {color: valueColor ?? colors.textPrimary}]} numberOfLines={2}>{value}</Text>
      </View>
    );
  }

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={dm.overlay} />
      </TouchableWithoutFeedback>

      <View style={dm.sheet}>
        <View style={[dm.card, {backgroundColor: colors.card}]}>
          <View style={[dm.handle, {backgroundColor: colors.border}]} />

          {/* Amount hero */}
          <View style={dm.hero}>
            <View style={dm.amountRow}>
              <Text style={[dm.heroAmount, {color: amountColor}]}>
                {isIn ? '+' : '-'}{Number(item.amount ?? 0).toFixed(2)}
              </Text>
              <RiyalIcon size={30} color={amountColor} />
            </View>
            <View style={[dm.heroBadge, {backgroundColor: statusColor + '22'}]}>
              <Text style={[dm.heroBadgeTxt, {color: statusColor}]}>{statusLabel}</Text>
            </View>
          </View>

          <Text style={[dm.title, {color: colors.textPrimary}]} numberOfLines={2}>{item.label}</Text>

          <View style={[dm.divider, {backgroundColor: colors.border}]} />

          <Row label="التاريخ"       value={item.date ? formatDate(item.date) : null} />
          <Row label="المستخدم"      value={item.userFullName || null} />
          <Row label="طريقة الدفع"  value={methodDisplay} />
          <Row label="المرجع"        value={item.reference} />
          <Row label="الاتجاه"       value={isIn ? 'دخول (credit)' : 'خروج (debit)'} valueColor={amountColor} />

          <TouchableOpacity
            style={[dm.closeBtn, {backgroundColor: colors.primary}]}
            onPress={onClose}
            activeOpacity={0.85}>
            <Text style={dm.closeTxt}>إغلاق</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const dm = StyleSheet.create({
  overlay:      {position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.45)'},
  sheet:        {flex: 1, justifyContent: 'flex-end'},
  card:         {borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingBottom: 36, paddingHorizontal: 20},
  handle:       {width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 20},
  hero:         {flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 6},
  amountRow:    {flexDirection: 'row', alignItems: 'center', gap: 4},
  heroAmount:   {fontSize: 32, fontWeight: '900'},
  heroBadge:    {paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10},
  heroBadgeTxt: {fontSize: 13, fontWeight: '700'},
  title:        {fontSize: 16, fontWeight: '700', marginBottom: 16},
  divider:      {height: 1, marginBottom: 14},
  row:          {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingVertical: 9, gap: 12},
  rowLabel:     {fontSize: 13, fontWeight: '500', flexShrink: 0},
  rowValue:     {fontSize: 13, fontWeight: '700', flexShrink: 1},
  closeBtn:     {marginTop: 20, paddingVertical: 14, borderRadius: 14, alignItems: 'center'},
  closeTxt:     {color: '#FFF', fontSize: 15, fontWeight: '700'},
});

// ─── Payment Card ─────────────────────────────────────────────────────────────
function PaymentCard({item, colors, onPress}) {
  const isIn        = item.entryType === 'credit';
  const iconColor   = isIn ? colors.success : colors.danger;
  const statusColor = STATUS_COLOR[item.status] ?? '#9CA3AF';
  const statusLabel = STATUS_LABEL[item.status] ?? '';
  const methodDisplay = METHOD_LABEL[item.paymentMethod] ?? item.paymentMethod ?? null;

  return (
    <TouchableOpacity
      style={[pc.card, {backgroundColor: colors.card}]}
      onPress={onPress}
      activeOpacity={0.75}>
      <View style={[pc.iconWrap, {backgroundColor: iconColor + '15'}]}>
        {isIn
          ? <ArrowDownLeft size={20} color={iconColor} />
          : <ArrowUpRight  size={20} color={iconColor} />
        }
      </View>

      <View style={pc.info}>
        <Text style={[pc.label, {color: colors.textPrimary}]} numberOfLines={1}>{item.label}</Text>
        <View style={pc.meta}>
          {methodDisplay ? (
            <Text style={[pc.method, {color: colors.textSecondary}]} numberOfLines={1}>
              {[item.userFullName, methodDisplay].filter(Boolean).join(' · ')}
            </Text>
          ) : item.userFullName ? (
            <Text style={[pc.method, {color: colors.textSecondary}]} numberOfLines={1}>{item.userFullName}</Text>
          ) : null}
          <View style={[pc.statusBadge, {backgroundColor: statusColor + '22'}]}>
            <Text style={[pc.statusTxt, {color: statusColor}]}>{statusLabel}</Text>
          </View>
        </View>
      </View>

      <View style={pc.amountRow}>
        <Text style={[pc.amount, {color: isIn ? colors.success : colors.danger}]}>
          {isIn ? '+' : '-'}{Number(item.amount ?? 0).toFixed(2)}
        </Text>
        <RiyalIcon size={15} color={isIn ? colors.success : colors.danger} />
      </View>
    </TouchableOpacity>
  );
}

const pc = StyleSheet.create({
  card:        {flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 16, padding: 14, elevation: 1, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: {width: 0, height: 1}},
  iconWrap:    {width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center'},
  info:        {flex: 1, gap: 4},
  label:       {fontSize: 14, fontWeight: '700'},
  meta:        {flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap'},
  method:      {fontSize: 12, flexShrink: 1},
  statusBadge: {paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6},
  statusTxt:   {fontSize: 11, fontWeight: '700'},
  amountRow:   {flexDirection: 'row', alignItems: 'center', gap: 3},
  amount:      {fontSize: 15, fontWeight: '800'},
});

// ─── Map API transaction to display shape ────────────────────────────────────
function mapTransaction(tx) {
  const isCredit    = tx.entryType === 'credit';
  const orderNum    = tx.order?.orderNumber ? `#${tx.order.orderNumber}` : '';
  const userFull    = tx.user
    ? `${tx.user.firstName ?? ''} ${tx.user.lastName ?? ''}`.trim()
    : '';
  // prefer server-side typeLabel if present
  const label = tx.typeLabel
    ?? tx.description
    ?? (orderNum ? `${tx.typeLabel ?? 'معاملة'} ${orderNum}` : null)
    ?? (isCredit ? 'إيداع' : 'خصم');

  return {
    id:            tx._id,
    date:          typeof tx.createdAt === 'number'
      ? new Date(tx.createdAt).toISOString().slice(0, 10)
      : (tx.createdAt ?? '').slice(0, 10),
    label:         orderNum ? `${label} ${orderNum}` : label,
    userFullName:  userFull,
    amount:        tx.amount ?? 0,
    entryType:     tx.entryType,   // 'credit' | 'debit'
    status:        tx.status ?? 1, // 0=pending 1=completed 2=failed 3=cancelled
    paymentMethod: tx.paymentMethod ?? tx.paymentGateway ?? null,
    reference:     tx.reference ?? null,
    type:          tx.type,        // 0-7 numeric
  };
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function PaymentsScreen({onBack}) {
  const {colors} = useTheme();
  const [payments,    setPayments]   = useState([]);
  const [balance,     setBalance]    = useState(null);
  const [isLocked,    setIsLocked]   = useState(false);
  const [loading,     setLoading]    = useState(true);
  const [dateFilter,  setDateFilter] = useState('month');
  const [showFilter,  setShowFilter] = useState(false);
  const [selectedTx,  setSelectedTx] = useState(null);

  useEffect(() => {
    Promise.all([
      getTransactions({limit: 200}),
      getTenantWallet(),
    ]).then(([txRes, walletRes]) => {
      const list = txRes.data?.data ?? txRes.data ?? [];
      setPayments(Array.isArray(list) ? list.map(mapTransaction) : []);
      const walletData = walletRes.data?.data ?? walletRes.data;
      if (walletData?.balance != null) setBalance(walletData.balance);
      if (walletData?.isLocked) setIsLocked(true);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => filterByDate(payments, dateFilter), [payments, dateFilter]);

  const groups = useMemo(() => groupByDate(filtered), [filtered]);

  const completed = useMemo(() => filtered.filter(p => p.status === 1), [filtered]);
  const totalIn   = useMemo(() => completed.filter(p => p.entryType === 'credit').reduce((s, p) => s + p.amount, 0), [completed]);
  const totalOut  = useMemo(() => completed.filter(p => p.entryType === 'debit').reduce((s, p) => s + p.amount, 0), [completed]);
  const net       = totalIn - totalOut;

  const activeFilters = dateFilter !== 'all' ? 1 : 0;

  const renderItem = useCallback(({item}) => {
    if (item.isHeader) {
      return <Text style={[s.dateHeader, {color: colors.textSecondary}]}>{item.label}</Text>;
    }
    return <PaymentCard item={item} colors={colors} onPress={() => setSelectedTx(item)} />;
  }, [colors]);

  const keyExtractor = useCallback(item => item.id ?? item.label, []);

  const listData = useMemo(() => {
    const rows = [];
    groups.forEach(g => {
      rows.push({id: `h_${g.date}`, isHeader: true, label: formatDate(g.date)});
      g.items.forEach(item => rows.push(item));
    });
    return rows;
  }, [groups]);

  return (
    <View style={[s.root, {backgroundColor: colors.bg}]}>
      {/* Header */}
      <View style={[s.header, {backgroundColor: colors.bg}]}>
        {onBack ? (
          <TouchableOpacity onPress={onBack} style={s.backBtn} activeOpacity={0.75}>
            <ArrowRight size={22} color={colors.textPrimary} />
          </TouchableOpacity>
        ) : (
          <View style={s.backBtn} />
        )}
        <View style={s.headerText}>
          <Text style={[s.headerTitle, {color: colors.textPrimary}]}>المحفظة</Text>
          <Text style={[s.headerSub, {color: colors.textSecondary}]}>
            {filtered.length} عملية
          </Text>
        </View>
        <TouchableOpacity
          style={[s.filterBtn, {backgroundColor: activeFilters > 0 ? colors.primary : colors.card}]}
          onPress={() => setShowFilter(true)}
          activeOpacity={0.8}>
          <CalendarDays size={18} color={activeFilters > 0 ? '#FFF' : colors.textSecondary} />
          {activeFilters > 0 && (
            <View style={[s.filterBadge, {backgroundColor: colors.card}]}>
              <Text style={[s.filterBadgeTxt, {color: colors.primary}]}>{activeFilters}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Balance card */}
      {balance != null && (
        <View style={[s.balanceCard, {
          backgroundColor: isLocked ? '#DC2626' : colors.primary,
          shadowColor: isLocked ? '#DC2626' : colors.primary,
        }]}>
          {/* decorative circles */}
          <View style={s.decorCircleLg} />
          <View style={s.decorCircleSm} />

          <View style={s.balanceTopRow}>
            <View style={s.balanceIconBox}>
              {isLocked
                ? <Lock size={20} color="#FFF" strokeWidth={2.2} />
                : <Wallet size={20} color="#FFF" strokeWidth={2.2} />
              }
            </View>
            <Text style={s.balanceLbl}>
              {isLocked ? 'محفظة مقفلة' : 'رصيد المحفظة'}
            </Text>
            {isLocked && (
              <View style={s.lockedBadge}>
                <Text style={s.lockedBadgeTxt}>مقفلة</Text>
              </View>
            )}
          </View>

          <View style={s.balanceAmountRow}>
            <Text style={s.balanceVal}>{Number(balance).toLocaleString()}</Text>
            <RiyalIcon size={36} color="rgba(255,255,255,0.9)" style={s.balanceCurrency} />
          </View>

          {isLocked && (
            <Text style={s.balanceHint}>تواصل مع الدعم لرفع القفل</Text>
          )}
        </View>
      )}

      {/* Summary cards */}
      <View style={s.summaryRow}>
        <View style={[s.summaryCard, {backgroundColor: colors.success + '12'}]}>
          <TrendingUp size={18} color={colors.success} />
          <View style={s.summaryText}>
            <View style={s.summaryValRow}>
              <Text style={[s.summaryVal, {color: colors.success}]}>{totalIn.toLocaleString()}</Text>
              <RiyalIcon size={13} color={colors.success} />
            </View>
            <Text style={[s.summaryLbl, {color: colors.textSecondary}]}>إجمالي الوارد</Text>
          </View>
        </View>

        <View style={[s.summaryCard, {backgroundColor: colors.danger + '12'}]}>
          <TrendingDown size={18} color={colors.danger} />
          <View style={s.summaryText}>
            <View style={s.summaryValRow}>
              <Text style={[s.summaryVal, {color: colors.danger}]}>{totalOut.toLocaleString()}</Text>
              <RiyalIcon size={13} color={colors.danger} />
            </View>
            <Text style={[s.summaryLbl, {color: colors.textSecondary}]}>إجمالي الصادر</Text>
          </View>
        </View>

        <View style={[s.summaryCard, {backgroundColor: colors.primary + '12'}]}>
          <Wallet size={18} color={colors.primary} />
          <View style={s.summaryText}>
            <View style={s.summaryValRow}>
              <Text style={[s.summaryVal, {color: colors.primary}]}>{net.toLocaleString()}</Text>
              <RiyalIcon size={13} color={colors.primary} />
            </View>
            <Text style={[s.summaryLbl, {color: colors.textSecondary}]}>الصافي</Text>
          </View>
        </View>
      </View>

      {/* List */}
      {loading ? <View style={s.center}><ActivityIndicator size="large" color={colors.primary} /></View> : null}
      <FlatList
        data={listData}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={s.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={[s.emptyTxt, {color: colors.textSecondary}]}>لا توجد مدفوعات في هذه الفترة</Text>
          </View>
        }
      />

      <FilterModal
        visible={showFilter}
        dateFilter={dateFilter}
        onDateChange={setDateFilter}
        onClose={() => setShowFilter(false)}
        colors={colors}
      />

      <TxDetailModal
        item={selectedTx}
        colors={colors}
        onClose={() => setSelectedTx(null)}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root:           {flex: 1},
  center:         {flex: 1, alignItems: 'center', justifyContent: 'center'},
  header:         {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 12},
  backBtn:        {width: 36, height: 36, alignItems: 'center', justifyContent: 'center'},
  headerText:     {flex: 1, gap: 2, paddingHorizontal: 8},
  headerTitle:    {fontSize: 26, fontWeight: '900'},
  headerSub:      {fontSize: 13},
  filterBtn:      {width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center'},
  filterBadge:    {position: 'absolute', top: 4, left: 4, width: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center'},
  filterBadgeTxt: {fontSize: 9, fontWeight: '900'},

  balanceCard:     {
    marginHorizontal: 16, marginBottom: 12, padding: 20, borderRadius: 24,
    overflow: 'hidden', position: 'relative',
    shadowOffset: {width: 0, height: 8}, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8,
  },
  decorCircleLg:   {position: 'absolute', top: -40, right: -30, width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(255,255,255,0.10)'},
  decorCircleSm:   {position: 'absolute', bottom: -30, right: 40, width: 90, height: 90, borderRadius: 45, backgroundColor: 'rgba(255,255,255,0.08)'},
  balanceTopRow:   {flexDirection: 'row', alignItems: 'center', gap: 10},
  balanceIconBox:  {width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.22)', alignItems: 'center', justifyContent: 'center'},
  balanceLbl:      {fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.9)'},
  balanceAmountRow:{flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginTop: 14},
  balanceVal:      {fontSize: 40, fontWeight: '900', color: '#FFF', lineHeight: 44},
  balanceCurrency: {fontSize: 20, fontWeight: '700', color: 'rgba(255,255,255,0.9)', marginBottom: 5},
  balanceHint:     {fontSize: 12, fontWeight: '500', color: 'rgba(255,255,255,0.85)', marginTop: 8},
  lockedBadge:     {backgroundColor: 'rgba(255,255,255,0.25)', paddingHorizontal: 9, paddingVertical: 3, borderRadius: 8},
  lockedBadgeTxt:  {fontSize: 11, fontWeight: '700', color: '#FFF'},

  summaryRow:  {flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 8},
  summaryCard: {flex: 1, borderRadius: 14, padding: 10, gap: 6},
  summaryText: {gap: 2},
  summaryValRow:{flexDirection: 'row', alignItems: 'center', gap: 3},
  summaryVal:  {fontSize: 13, fontWeight: '900'},
  summaryLbl:  {fontSize: 10},

  list:        {paddingHorizontal: 16, paddingBottom: 32, gap: 8},
  dateHeader:  {fontSize: 13, fontWeight: '700', marginTop: 8, marginBottom: 2},

  empty:       {alignItems: 'center', paddingTop: 60},
  emptyTxt:    {fontSize: 14},
});
