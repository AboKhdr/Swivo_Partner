import React, {useCallback, useEffect, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {ArrowRight, Bike, Star, Phone, ShoppingBag, CheckCircle, Percent, DollarSign, ChevronDown} from 'lucide-react-native';
import {useTheme} from '../../../shared/context/ThemeContext';
import {getStaffById, getOrders, updateStaff} from '../../../services/partner';
import RiyalIcon from '../../../shared/components/RiyalIcon';

const STATUS_COLORS = {
  PENDING_PARTNER: '#F59E0B',
  ACCEPTED:        '#3B9EFF',
  ASSIGNED:        '#8B5CF6',
  ON_THE_WAY:      '#1B7BF5',
  STARTED:         '#F59E0B',
  COMPLETED:       '#22C55E',
  REJECTED:        '#EF4444',
  CANCELLED:       '#EF4444',
};

const STATUS_LABELS = {
  PENDING_PARTNER: 'قيد الانتظار',
  ACCEPTED:        'مقبول',
  ASSIGNED:        'تم التعيين',
  ON_THE_WAY:      'في الطريق',
  STARTED:         'جارٍ',
  COMPLETED:       'مكتمل',
  REJECTED:        'مرفوض',
  CANCELLED:       'ملغى',
};

function StatBox({icon: Icon, value, label, color, colors}) {
  return (
    <View style={[d.statBox, {backgroundColor: colors.card}]}>
      <View style={[d.statIcon, {backgroundColor: (color ?? colors.primary) + '15'}]}>
        <Icon size={18} color={color ?? colors.primary} />
      </View>
      <Text style={[d.statValue, {color: colors.textPrimary}]}>{value}</Text>
      <Text style={[d.statLabel, {color: colors.textSecondary}]}>{label}</Text>
    </View>
  );
}

function safeStr(v) {
  if (v == null) return '';
  if (typeof v === 'object') return v.ar ?? v.en ?? '';
  return String(v);
}

function OrderRow({item, colors}) {
  const color       = STATUS_COLORS[item.status] ?? '#64748B';
  const statusLabel = STATUS_LABELS[item.status] ?? safeStr(item.status);
  const orderNum    = safeStr(item.orderNumber ?? item._id);
  const serviceName = safeStr(
    item.itemsSnapshot?.[0]?.nameSnapshot
    ?? item.items?.[0]?.service?.name
    ?? item.items?.[0]?.name,
  );
  const price = safeStr(item.tenantNetSnapshot ?? item.totalAmount);

  return (
    <View style={[d.orderRow, {backgroundColor: colors.card, borderColor: colors.border}]}>
      <View style={d.orderInfo}>
        <Text style={[d.orderNum, {color: colors.primary}]}>#{orderNum}</Text>
        {!!serviceName && <Text style={[d.orderService, {color: colors.textPrimary}]}>{serviceName}</Text>}
      </View>
      <View style={d.orderRight}>
        {!!price && (
          <View style={d.priceRow}>
            <Text style={[d.orderPrice, {color: colors.textPrimary}]}>{price}</Text>
            <RiyalIcon size={15} color={colors.textPrimary} />
          </View>
        )}
        <View style={[d.statusBadge, {backgroundColor: color + '18'}]}>
          <Text style={[d.statusTxt, {color}]}>• {statusLabel}</Text>
        </View>
      </View>
    </View>
  );
}

// ─── Commission Section ───────────────────────────────────────────────────────
function CommissionSection({staffId, initialType, initialPercent, initialFixed, colors}) {
  const [type,    setType]    = useState(initialType ?? 'percentage');
  const [percent, setPercent] = useState(initialPercent != null ? String(initialPercent) : '');
  const [fixed,   setFixed]   = useState(initialFixed   != null ? String(initialFixed)   : '');

  useEffect(() => {
    if (initialType)    setType(initialType);
    if (initialPercent != null) setPercent(String(initialPercent));
    if (initialFixed   != null) setFixed(String(initialFixed));
  }, [initialType, initialPercent, initialFixed]);
  const [saving,  setSaving]  = useState(false);
  const [open,    setOpen]    = useState(true);

  const handleSave = useCallback(async () => {
    const val = type === 'percentage' ? parseFloat(percent) : parseFloat(fixed);
    if (isNaN(val) || val < 0) {
      Alert.alert('خطأ', 'أدخل قيمة صحيحة');
      return;
    }
    setSaving(true);
    const body = type === 'percentage'
      ? {commissionType: 'percentage', commissionPercent: val}
      : {commissionType: 'fixed',      commissionFixed:   val};
    const res = await updateStaff(staffId, body);
    setSaving(false);
    if (!res.success) {
      Alert.alert('خطأ', 'تعذّر حفظ العمولة، يرجى المحاولة مجدداً');
    }
  }, [staffId, type, percent, fixed]);

  const showFixedRiyal = type !== 'percentage' && !!fixed;
  const displayVal = type === 'percentage'
    ? (percent ? `${percent}%` : '—')
    : (fixed   ? String(fixed) : '—');

  return (
    <View style={[cm.card, {backgroundColor: colors.card}]}>
      {/* Header row — tap to expand */}
      <TouchableOpacity style={cm.header} onPress={() => setOpen(v => !v)} activeOpacity={0.75}>
        <View style={[cm.iconBox, {backgroundColor: colors.primary + '15'}]}>
          {type === 'percentage'
            ? <Percent size={18} color={colors.primary} />
            : <DollarSign size={18} color={colors.primary} />
          }
        </View>
        <View style={cm.headerText}>
          <Text style={[cm.headerLabel, {color: colors.textPrimary}]}>العمولة</Text>
          <View style={cm.headerValRow}>
            <Text style={[cm.headerVal, {color: colors.textSecondary}]}>{displayVal}</Text>
            {showFixedRiyal && <RiyalIcon size={12} color={colors.textSecondary} />}
          </View>
        </View>
        <ChevronDown
          size={18}
          color={colors.textSecondary}
          style={{transform: [{rotate: open ? '180deg' : '0deg'}]}}
        />
      </TouchableOpacity>

      {open && (
        <View style={[cm.body, {borderTopColor: colors.border}]}>
          {/* Type toggle */}
          <View style={[cm.toggle, {backgroundColor: colors.bg}]}>
            <TouchableOpacity
              style={[cm.toggleBtn, type === 'percentage' && {backgroundColor: colors.primary}]}
              onPress={() => setType('percentage')}
              activeOpacity={0.8}>
              <Percent size={14} color={type === 'percentage' ? '#FFF' : colors.textSecondary} />
              <Text style={[cm.toggleTxt, {color: type === 'percentage' ? '#FFF' : colors.textSecondary}]}>
                نسبة مئوية
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[cm.toggleBtn, type === 'fixed' && {backgroundColor: colors.primary}]}
              onPress={() => setType('fixed')}
              activeOpacity={0.8}>
              <DollarSign size={14} color={type === 'fixed' ? '#FFF' : colors.textSecondary} />
              <Text style={[cm.toggleTxt, {color: type === 'fixed' ? '#FFF' : colors.textSecondary}]}>
                قيمة ثابتة
              </Text>
            </TouchableOpacity>
          </View>

          {/* Input */}
          <View style={[cm.inputRow, {backgroundColor: colors.bg, borderColor: colors.border}]}>
            <TextInput
              style={[cm.input, {color: colors.textPrimary}]}
              keyboardType="decimal-pad"
              value={type === 'percentage' ? percent : fixed}
              onChangeText={type === 'percentage' ? setPercent : setFixed}
              placeholder={type === 'percentage' ? 'مثال: 15' : 'مثال: 20'}
              placeholderTextColor={colors.textSecondary}
            />
            {type === 'percentage' ? (
              <Text style={[cm.inputSuffix, {color: colors.textSecondary}]}>%</Text>
            ) : (
              <RiyalIcon size={18} color={colors.textSecondary} style={cm.inputSuffixIcon} />
            )}
          </View>

          <TouchableOpacity
            style={[cm.saveBtn, {backgroundColor: colors.primary, opacity: saving ? 0.7 : 1}]}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.85}>
            {saving
              ? <ActivityIndicator size="small" color="#FFF" />
              : <Text style={cm.saveTxt}>حفظ العمولة</Text>
            }
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const cm = StyleSheet.create({
  card:        {borderRadius: 18, overflow: 'hidden', marginBottom: 12, elevation: 1, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: {width: 0, height: 1}},
  header:      {flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16},
  iconBox:     {width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center'},
  headerText:  {flex: 1, gap: 2},
  headerLabel: {fontSize: 14, fontWeight: '700'},
  headerValRow:{flexDirection: 'row', alignItems: 'center', gap: 3},
  headerVal:   {fontSize: 12},
  body:        {borderTopWidth: 1, padding: 16, gap: 12},
  toggle:      {flexDirection: 'row', borderRadius: 12, padding: 4, gap: 4},
  toggleBtn:   {flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 9, borderRadius: 10},
  toggleTxt:   {fontSize: 13, fontWeight: '700'},
  inputRow:    {flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 4},
  input:       {flex: 1, fontSize: 20, fontWeight: '800', paddingVertical: 10},
  inputSuffix: {fontSize: 18, fontWeight: '600', paddingHorizontal: 4},
  inputSuffixIcon: {marginHorizontal: 4},
  saveBtn:     {paddingVertical: 14, borderRadius: 14, alignItems: 'center'},
  saveTxt:     {color: '#FFF', fontSize: 15, fontWeight: '700'},
});

export default function BikerDetailsScreen({biker, onBack, onOpenActions}) {
  const {colors} = useTheme();
  const staffId = biker._id ?? biker.id;
  // الطلبات مربوطة بمعرّف المستخدم/البايكر (userId._id) وليس بمعرّف سجل الـ staff
  const bikerUserId = biker.userId?._id ?? biker.userId ?? biker.bikerId ?? staffId;

  const [details,    setDetails]    = useState(null);
  const [orders,     setOrders]     = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page,       setPage]       = useState(1);
  const [hasNext,    setHasNext]    = useState(false);
  const [loadingMore,setLoadingMore]= useState(false);

  const fetchAll = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    const [detRes, ordRes] = await Promise.all([
      getStaffById(staffId),
      getOrders({bikerId: bikerUserId, limit: 20, page: 1}),
    ]);
    if (detRes.success) {
      const d = detRes.data?.data ?? detRes.data ?? {};
      setDetails(d);
    }
    if (ordRes.success) {
      const list = ordRes.data?.data ?? ordRes.data ?? [];
      setOrders(Array.isArray(list) ? list : []);
      setHasNext(ordRes.data?.pagination?.hasNextPage ?? false);
      setPage(1);
    }
    if (!silent) setLoading(false);
  }, [staffId, bikerUserId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAll(true);
    setRefreshing(false);
  }, [fetchAll]);

  const onEndReached = useCallback(() => {
    if (!hasNext || loadingMore) return;
    setLoadingMore(true);
    getOrders({bikerId: bikerUserId, limit: 20, page: page + 1}).then(res => {
      if (res.success) {
        const list = res.data?.data ?? res.data ?? [];
        setOrders(prev => [...prev, ...list]);
        setHasNext(res.data?.pagination?.hasNextPage ?? false);
        setPage(p => p + 1);
      }
      setLoadingMore(false);
    });
  }, [hasNext, loadingMore, bikerUserId, page]);

  const data      = details ?? biker;
  const name      = data.userId
    ? `${data.userId.firstName ?? ''} ${data.userId.lastName ?? ''}`.trim()
    : (data.name ?? '');
  const phone     = data.userId?.phoneNumber ?? data.phone ?? '';
  const rating    = data.rating ?? 0;
  const ratingCnt = data.ratingCount ?? 0;
  const active    = data.activeOrdersCount ?? 0;
  const completed = data.completedOrdersCount ?? 0;
  const branch = typeof data.branchId === 'object' ? safeStr(data.branchId?.name) : '';

  const renderItem    = useCallback(({item}) => <OrderRow item={item} colors={colors} />, [colors]);
  const keyExtractor  = useCallback(item => item._id ?? item.id, []);

  const ListHeader = (
    <View>
      {/* Profile */}
      <View style={[d.profileCard, {backgroundColor: colors.card}]}>
        <View style={[d.avatar, {backgroundColor: colors.primary + '20'}]}>
          <Text style={[d.avatarLetter, {color: colors.primary}]}>
            {(name.charAt(0) || '؟').toUpperCase()}
          </Text>
        </View>
        <Text style={[d.nameText, {color: colors.textPrimary}]}>{name}</Text>
        {!!branch && (
          <Text style={[d.branchText, {color: colors.textSecondary}]}>{branch}</Text>
        )}
        {!!phone && (
          <TouchableOpacity
            style={[d.phoneRow, {backgroundColor: colors.primary + '12'}]}
            activeOpacity={0.75}
            onPress={() => { const {Linking} = require('react-native'); Linking.openURL(`tel:${phone}`); }}>
            <Phone size={14} color={colors.primary} />
            <Text style={[d.phoneText, {color: colors.primary}]}>{phone}</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[d.actionsBtn, {borderColor: colors.border}]}
          onPress={onOpenActions}
          activeOpacity={0.75}>
          <Text style={[d.actionsBtnTxt, {color: colors.textSecondary}]}>إدارة البايكر</Text>
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={d.statsRow}>
        <StatBox icon={ShoppingBag} value={active}    label="نشطة"    colors={colors} />
        <StatBox icon={CheckCircle} value={completed} label="مكتملة"  color="#22C55E" colors={colors} />
        <StatBox icon={Star}        value={rating > 0 ? rating.toFixed(1) : '—'} label={`${ratingCnt} تقييم`} color="#F59E0B" colors={colors} />
      </View>

      {/* Commission — render only after details loaded so initial values are correct */}
      {details && (
        <CommissionSection
          key={staffId}
          staffId={staffId}
          initialType={details.commissionType ?? 'percentage'}
          initialPercent={details.commissionPercent ?? null}
          initialFixed={details.commissionFixed ?? null}
          colors={colors}
        />
      )}

      <Text style={[d.sectionTitle, {color: colors.textPrimary}]}>الطلبات</Text>
    </View>
  );

  return (
    <View style={[d.root, {backgroundColor: colors.bg}]}>
      <View style={[d.header, {backgroundColor: colors.bg}]}>
        <TouchableOpacity onPress={onBack} style={d.backBtn} activeOpacity={0.75}>
          <ArrowRight size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[d.headerTitle, {color: colors.textPrimary}]}>تفاصيل البايكر</Text>
        <View style={d.backBtn} />
      </View>

      {loading ? (
        <View style={d.center}><ActivityIndicator size="large" color={colors.primary} /></View>
      ) : (
        <FlatList
          data={orders}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          ListHeaderComponent={ListHeader}
          contentContainerStyle={d.list}
          showsVerticalScrollIndicator={false}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.3}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
          ListEmptyComponent={
            <View style={d.empty}>
              <Bike size={32} color={colors.border} />
              <Text style={[d.emptyTxt, {color: colors.textSecondary}]}>لا توجد طلبات</Text>
            </View>
          }
          ListFooterComponent={
            loadingMore ? <ActivityIndicator size="small" color={colors.primary} style={{paddingVertical: 16}} /> : null
          }
        />
      )}
    </View>
  );
}

const d = StyleSheet.create({
  root:         {flex: 1},
  center:       {flex: 1, alignItems: 'center', justifyContent: 'center'},
  header:       {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 12},
  headerTitle:  {fontSize: 20, fontWeight: '800'},
  backBtn:      {width: 36, height: 36, alignItems: 'center', justifyContent: 'center'},
  list:         {paddingHorizontal: 16, paddingBottom: 32, gap: 10},

  profileCard:  {borderRadius: 20, padding: 20, alignItems: 'center', gap: 10, marginBottom: 12},
  avatar:       {width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center'},
  avatarLetter: {fontSize: 28, fontWeight: '900'},
  nameText:     {fontSize: 20, fontWeight: '800'},
  branchText:   {fontSize: 13, fontWeight: '500'},
  phoneRow:     {flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20},
  phoneText:    {fontSize: 14, fontWeight: '600'},
  actionsBtn:   {marginTop: 4, paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, borderWidth: 1},
  actionsBtnTxt:{fontSize: 13, fontWeight: '600'},

  statsRow:     {flexDirection: 'row', gap: 10, marginBottom: 16},
  statBox:      {flex: 1, borderRadius: 16, padding: 14, alignItems: 'center', gap: 6},
  statIcon:     {width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center'},
  statValue:    {fontSize: 20, fontWeight: '900'},
  statLabel:    {fontSize: 11, fontWeight: '500'},

  sectionTitle: {fontSize: 16, fontWeight: '800', marginBottom: 4},

  orderRow:     {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 14, borderWidth: 1, padding: 14, gap: 10},
  orderInfo:    {flex: 1, gap: 4},
  orderNum:     {fontSize: 12, fontWeight: '700'},
  orderService: {fontSize: 14, fontWeight: '700'},
  orderRight:   {alignItems: 'flex-end', gap: 6},
  priceRow:     {flexDirection: 'row', alignItems: 'center', gap: 3},
  orderPrice:   {fontSize: 15, fontWeight: '800'},
  statusBadge:  {paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20},
  statusTxt:    {fontSize: 11, fontWeight: '700'},

  empty:        {alignItems: 'center', gap: 10, paddingTop: 32},
  emptyTxt:     {fontSize: 14},
});
