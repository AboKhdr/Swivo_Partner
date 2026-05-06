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
} from 'lucide-react-native';
import {useTheme} from '../../../shared/context/ThemeContext';
import {getBikerPayouts} from '../../../services/partner';


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

// ─── Payment Card ─────────────────────────────────────────────────────────────
function PaymentCard({item, colors}) {
  const isIn     = item.type === 'in';
  const isPending = item.status === 'pending';
  const iconColor = isIn ? colors.success : colors.danger;
  const amountColor = isIn ? colors.success : colors.danger;

  return (
    <View style={[pc.card, {backgroundColor: colors.card}]}>
      <View style={[pc.iconWrap, {backgroundColor: iconColor + '15'}]}>
        {isIn
          ? <ArrowDownLeft size={20} color={iconColor} />
          : <ArrowUpRight  size={20} color={iconColor} />
        }
      </View>

      <View style={pc.info}>
        <Text style={[pc.label, {color: colors.textPrimary}]}>{item.label}</Text>
        <View style={pc.meta}>
          <Text style={[pc.method, {color: colors.textSecondary}]}>{item.method}</Text>
          {isPending && (
            <View style={[pc.pendingBadge, {backgroundColor: colors.warning + '20'}]}>
              <Text style={[pc.pendingTxt, {color: colors.warning}]}>قيد التحويل</Text>
            </View>
          )}
        </View>
      </View>

      <Text style={[pc.amount, {color: amountColor}]}>
        {isIn ? '+' : '-'}{item.amount} ﷼
      </Text>
    </View>
  );
}

const pc = StyleSheet.create({
  card:         {flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 16, padding: 14, elevation: 1, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: {width: 0, height: 1}},
  iconWrap:     {width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center'},
  info:         {flex: 1, gap: 4},
  label:        {fontSize: 14, fontWeight: '700'},
  meta:         {flexDirection: 'row', alignItems: 'center', gap: 8},
  method:       {fontSize: 12},
  pendingBadge: {paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6},
  pendingTxt:   {fontSize: 11, fontWeight: '700'},
  amount:       {fontSize: 15, fontWeight: '800'},
});

// ─── Map API payout to display shape ─────────────────────────────────────────
function mapPayout(p) {
  return {
    id:     p._id ?? p.id,
    date:   p.createdAt ? p.createdAt.slice(0, 10) : (p.date ?? ''),
    label:  p.notes ?? p.label ?? `دفعة #${(p._id ?? '').slice(-6)}`,
    amount: p.amount ?? 0,
    type:   'out',
    method: p.paymentMethod ?? p.method ?? 'bank_transfer',
    status: p.status ?? 'completed',
  };
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function PaymentsScreen({onBack}) {
  const {colors} = useTheme();
  const [payments,    setPayments]   = useState([]);
  const [loading,     setLoading]    = useState(true);
  const [dateFilter,  setDateFilter] = useState('month');
  const [showFilter,  setShowFilter] = useState(false);

  useEffect(() => {
    getBikerPayouts({limit: 100}).then(res => {
      if (res.success) {
        const list = res.data?.data ?? res.data ?? [];
        setPayments((Array.isArray(list) ? list : []).map(mapPayout));
      }
      setLoading(false);
    });
  }, []);

  const filtered = useMemo(() => filterByDate(payments, dateFilter), [payments, dateFilter]);

  const groups = useMemo(() => groupByDate(filtered), [filtered]);

  const totalIn  = useMemo(() => filtered.filter(p => p.type === 'in').reduce((s, p) => s + p.amount, 0), [filtered]);
  const totalOut = useMemo(() => filtered.filter(p => p.type === 'out').reduce((s, p) => s + p.amount, 0), [filtered]);
  const net      = totalIn - totalOut;

  const activeFilters = dateFilter !== 'all' ? 1 : 0;

  const renderItem = useCallback(({item}) => {
    if (item.isHeader) {
      return <Text style={[s.dateHeader, {color: colors.textSecondary}]}>{item.label}</Text>;
    }
    return <PaymentCard item={item} colors={colors} />;
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
        <TouchableOpacity onPress={onBack} style={s.backBtn} activeOpacity={0.75}>
          <ArrowRight size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={s.headerText}>
          <Text style={[s.headerTitle, {color: colors.textPrimary}]}>سجل المدفوعات</Text>
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

      {/* Summary cards */}
      <View style={s.summaryRow}>
        <View style={[s.summaryCard, {backgroundColor: colors.success + '12'}]}>
          <TrendingUp size={18} color={colors.success} />
          <View style={s.summaryText}>
            <Text style={[s.summaryVal, {color: colors.success}]}>{totalIn.toLocaleString()} ﷼</Text>
            <Text style={[s.summaryLbl, {color: colors.textSecondary}]}>إجمالي الوارد</Text>
          </View>
        </View>

        <View style={[s.summaryCard, {backgroundColor: colors.danger + '12'}]}>
          <TrendingDown size={18} color={colors.danger} />
          <View style={s.summaryText}>
            <Text style={[s.summaryVal, {color: colors.danger}]}>{totalOut.toLocaleString()} ﷼</Text>
            <Text style={[s.summaryLbl, {color: colors.textSecondary}]}>إجمالي الصادر</Text>
          </View>
        </View>

        <View style={[s.summaryCard, {backgroundColor: colors.primary + '12'}]}>
          <Wallet size={18} color={colors.primary} />
          <View style={s.summaryText}>
            <Text style={[s.summaryVal, {color: colors.primary}]}>{net.toLocaleString()} ﷼</Text>
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

  summaryRow:  {flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 8},
  summaryCard: {flex: 1, borderRadius: 14, padding: 10, gap: 6},
  summaryText: {gap: 2},
  summaryVal:  {fontSize: 13, fontWeight: '900'},
  summaryLbl:  {fontSize: 10},

  list:        {paddingHorizontal: 16, paddingBottom: 32, gap: 8},
  dateHeader:  {fontSize: 13, fontWeight: '700', marginTop: 8, marginBottom: 2},

  empty:       {alignItems: 'center', paddingTop: 60},
  emptyTxt:    {fontSize: 14},
});
