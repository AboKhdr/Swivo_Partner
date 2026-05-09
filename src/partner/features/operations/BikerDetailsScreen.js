import React, {useCallback, useEffect, useState} from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {ArrowRight, Bike, Star, Phone, ShoppingBag, Clock, CheckCircle} from 'lucide-react-native';
import {useTheme} from '../../../shared/context/ThemeContext';
import {getStaffById, getOrders} from '../../../services/partner';

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

function OrderRow({item, colors}) {
  const color      = STATUS_COLORS[item.status] ?? '#64748B';
  const statusLabel = STATUS_LABELS[item.status] ?? item.status ?? '';
  const orderNum   = item.orderNumber ?? item._id ?? '';
  const serviceName =
    item.itemsSnapshot?.[0]?.nameSnapshot?.ar
    ?? item.items?.[0]?.service?.name?.ar
    ?? item.items?.[0]?.name?.ar
    ?? '';
  const price = item.tenantNetSnapshot ?? item.totalAmount ?? '';

  return (
    <View style={[d.orderRow, {backgroundColor: colors.card, borderColor: colors.border}]}>
      <View style={d.orderInfo}>
        <Text style={[d.orderNum, {color: colors.primary}]}>#{orderNum}</Text>
        {!!serviceName && <Text style={[d.orderService, {color: colors.textPrimary}]}>{serviceName}</Text>}
      </View>
      <View style={d.orderRight}>
        {!!price && <Text style={[d.orderPrice, {color: colors.textPrimary}]}>{price} ﷼</Text>}
        <View style={[d.statusBadge, {backgroundColor: color + '18'}]}>
          <Text style={[d.statusTxt, {color}]}>• {statusLabel}</Text>
        </View>
      </View>
    </View>
  );
}

export default function BikerDetailsScreen({biker, onBack, onOpenActions}) {
  const {colors} = useTheme();
  const staffId = biker._id ?? biker.id;

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
      getOrders({bikerId: staffId, limit: 20, page: 1}),
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
  }, [staffId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAll(true);
    setRefreshing(false);
  }, [fetchAll]);

  const onEndReached = useCallback(() => {
    if (!hasNext || loadingMore) return;
    setLoadingMore(true);
    getOrders({bikerId: staffId, limit: 20, page: page + 1}).then(res => {
      if (res.success) {
        const list = res.data?.data ?? res.data ?? [];
        setOrders(prev => [...prev, ...list]);
        setHasNext(res.data?.pagination?.hasNextPage ?? false);
        setPage(p => p + 1);
      }
      setLoadingMore(false);
    });
  }, [hasNext, loadingMore, staffId, page]);

  const data      = details ?? biker;
  const name      = data.userId
    ? `${data.userId.firstName ?? ''} ${data.userId.lastName ?? ''}`.trim()
    : (data.name ?? '');
  const phone     = data.userId?.phoneNumber ?? data.phone ?? '';
  const rating    = data.rating ?? 0;
  const ratingCnt = data.ratingCount ?? 0;
  const active    = data.activeOrdersCount ?? 0;
  const completed = data.completedOrdersCount ?? 0;

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
  orderPrice:   {fontSize: 15, fontWeight: '800'},
  statusBadge:  {paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20},
  statusTxt:    {fontSize: 11, fontWeight: '700'},

  empty:        {alignItems: 'center', gap: 10, paddingTop: 32},
  emptyTxt:     {fontSize: 14},
});
