import React, {useState, useCallback, useMemo, useEffect, useRef} from 'react';
import {
  ActivityIndicator, FlatList, Platform, RefreshControl, StatusBar,
  StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import {ChevronRight, MapPin, Car, User, Droplets, ChevronUp, ChevronDown, Sparkles, Bike, Store} from 'lucide-react-native';
import {useTheme} from '../../../shared/context/ThemeContext';
import {useI18n} from '../../../shared/i18n/I18nContext';
import {getOrders} from '../../../services/orders';
import useAppStore from '../../../store/appStore';

const FILTER_KEYS = [
  {key: 'today',    labelKey: 'orders.today'},
  {key: 'upcoming', labelKey: 'orders.scheduled'},
  {key: 'past',     labelKey: 'orders.past'},
];

const BADGE_STYLE = {
  ASSIGNED:   {bg: '#FEF3C7',   font: '#D97706',  icon: '#F59E0B'},
  ON_THE_WAY: {bg: '#DBEAFE',   font: '#1D4ED8',  icon: '#3B82F6'},
  STARTED:    {bg: '#EDE9FE',   font: '#6D28D9',  icon: '#8B5CF6'},
  COMPLETED:  {bg: '#1CE3801A', font: '#1CE380',  icon: '#1CE380'},
  CANCELLED:  {bg: '#FF3B3B1A', font: '#FF3B3B',  icon: '#FF3B3B'},
};

// Safe string — if value is {ar, en} object, pick ar then en, else return as-is
function str(val) {
  if (!val) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'object') return val.ar ?? val.en ?? '';
  return String(val);
}

// helpers — تحويل الـ data الحقيقية لقيم جاهزة للعرض
function resolveOrderFields(order) {
  // client — new: client.name  |  legacy: client.firstName + lastName
  const clientName = order.client?.name
    ?? (order.client ? `${order.client.firstName ?? ''} ${order.client.lastName ?? ''}`.trim() : '');

  // car — new: car.brand/model/plateNumber (strings)  |  legacy: userCar.brand.name (nested)
  const brand = str(order.car?.brand) || str(order.userCar?.brand?.name);
  const model = str(order.car?.model) || str(order.userCar?.model?.name);
  const plate = order.car?.plateNumber ?? order.userCar?.plateNumber ?? '';

  // address — new: location.addressText  |  legacy: addressSnapshot
  const address = order.location?.addressText
    ?? order.addressSnapshot?.addressText
    ?? order.addressSnapshot?.district
    ?? order.branch?.address
    ?? '';

  // service name — new: services[0].name  |  legacy: itemsSnapshot[0].nameSnapshot
  const firstSvc  = order.services?.[0];
  const firstItem = order.itemsSnapshot?.[0];
  const serviceName = str(firstSvc?.name)
    || str(firstItem?.nameSnapshot)
    || str(order.service?.name);

  const isOnshop = (order.orderType ?? order.type ?? '').toUpperCase() === 'IN_SHOP'
    || (order.orderType ?? order.type ?? '') === 'onshop';

  const scheduledAt = order.scheduledAt
    ? new Date(order.scheduledAt).toLocaleString('ar-SA', {
        hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit',
      })
    : '';
  return {clientName, brand, model, plate, address, serviceName, isOnshop, scheduledAt};
}

function OrderCard({order, onPress, onLocationPress, colors, t}) {
  const [expanded, setExpanded] = useState(false);
  const bs = BADGE_STYLE[order.status] ?? BADGE_STYLE.ON_THE_WAY;
  const isDone = order.status === 'COMPLETED' || order.status === 'CANCELLED';
  const {clientName, brand, model, plate, address, serviceName, isOnshop, scheduledAt} =
    resolveOrderFields(order);

  return (
    <View style={[c.card, {backgroundColor: colors.card, borderColor: colors.border}]}>
      <View style={c.cardTop}>
        <View style={c.cardTopLeft}>
          <View style={c.titleRow}>
            <Text style={[c.gridValue, {color: colors.textPrimary}]}>{serviceName}</Text>
            {isOnshop
              ? (
                <View style={[c.typePill, {backgroundColor: '#8B5CF615'}]}>
                  <Store size={11} color="#8B5CF6" />
                  <Text style={[c.typeTxt, {color: '#8B5CF6'}]}>في الموقع</Text>
                </View>
              ) : (
                <View style={[c.typePill, {backgroundColor: colors.primary + '15'}]}>
                  <Bike size={11} color={colors.primary} />
                  <Text style={[c.typeTxt, {color: colors.primary}]}>متنقل</Text>
                </View>
              )
            }
          </View>
          <Text style={[c.timeText, {color: colors.textSecondary}]}>{scheduledAt}</Text>
        </View>
        <View style={[c.badge, {backgroundColor: bs.bg}]}>
          <Sparkles size={11} color={bs.icon} strokeWidth={2} />
          <Text style={[c.badgeText, {color: bs.font}]}>{t(`orders.status.${order.status}`)}</Text>
        </View>
      </View>

      {expanded && (
        <>
          <View style={c.grid}>
            <View style={c.gridItem}>
              <View style={[c.gridIcon, {backgroundColor: colors.primary + '12'}]}>
                <User size={14} color={colors.primary} strokeWidth={2} />
              </View>
              <View>
                <Text style={[c.gridLabel, {color: colors.textSecondary}]}>{t('orders.fields.owner')}</Text>
                <Text style={[c.gridValue, {color: colors.textPrimary}]}>{clientName}</Text>
              </View>
            </View>
            <View style={c.gridItem}>
              <View style={[c.gridIcon, {backgroundColor: '#EEF2FF'}]}>
                <Car size={14} color="#6366F1" strokeWidth={2} />
              </View>
              <View>
                <Text style={[c.gridLabel, {color: colors.textSecondary}]}>{t('orders.fields.carType')}</Text>
                <Text style={[c.gridValue, {color: colors.textPrimary}]}>{brand} {model}{plate ? ` | ${plate}` : ''}</Text>
              </View>
            </View>
            <View style={c.gridItem}>
              <View style={[c.gridIcon, {backgroundColor: '#E0F2FE'}]}>
                <Droplets size={14} color="#0EA5E9" strokeWidth={2} />
              </View>
              <View>
                <Text style={[c.gridLabel, {color: colors.textSecondary}]}>{t('orders.fields.washType')}</Text>
                <Text style={[c.gridValue, {color: colors.textPrimary}]}>{serviceName}</Text>
              </View>
            </View>
            <View style={c.gridItem}>
              <View style={[c.gridIcon, {backgroundColor: colors.primary + '12'}]}>
                <MapPin size={14} color={colors.primary} strokeWidth={2} />
              </View>
              <View style={{flex: 1}}>
                <Text style={[c.gridLabel, {color: colors.textSecondary}]}>{t('orders.fields.location')}</Text>
                <Text style={[c.gridValue, {color: colors.textPrimary}]} numberOfLines={1}>{address}</Text>
              </View>
            </View>
          </View>

          <View style={c.actionRow}>
            <TouchableOpacity style={[c.actionBtn, {backgroundColor: colors.primary, shadowColor: colors.primary}]} onPress={onPress} activeOpacity={0.88}>
              <Text style={c.actionBtnText}>{isDone ? t('orders.fields.summary') : t('orders.card.startWash')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[c.locationBtn, {borderColor: colors.primary + '40', backgroundColor: colors.primary + '08'}]} onPress={onLocationPress} activeOpacity={0.8}>
              <MapPin size={17} color={colors.primary} strokeWidth={2} />
            </TouchableOpacity>
          </View>
        </>
      )}

      <TouchableOpacity style={c.toggleRow} onPress={() => setExpanded(v => !v)} activeOpacity={0.7}>
        {expanded
          ? <ChevronUp size={15} color={colors.primary} strokeWidth={2} />
          : <ChevronDown size={15} color={colors.primary} strokeWidth={2} />
        }
        <Text style={[c.toggleText, {color: colors.primary}]}>{expanded ? t('orders.card.hideDetails') : t('orders.card.showDetails')}</Text>
      </TouchableOpacity>
    </View>
  );
}

function todayISO() {
  return new Date().toISOString().split('T')[0];
}

function buildParams(activeFilter) {
  switch (activeFilter) {
    case 'today':
      // طلبات اليوم النشطة فقط
      return {filter: 'active', schedule: todayISO()};
    case 'upcoming':
      // كل الطلبات النشطة (ASSIGNED, ON_THE_WAY, STARTED)
      return {filter: 'active'};
    case 'past':
      // الطلبات المنتهية
      return {filter: 'past'};
    default:
      return {filter: 'active'};
  }
}

function SkeletonCard({colors}) {
  return (
    <View style={[c.card, {backgroundColor: colors.card, borderColor: colors.border}]}>
      <View style={c.cardTop}>
        <View style={{flex: 1, gap: 8}}>
          <View style={[sk.line, {width: '55%', backgroundColor: colors.border}]} />
          <View style={[sk.line, {width: '35%', backgroundColor: colors.border}]} />
        </View>
        <View style={[sk.badge, {backgroundColor: colors.border}]} />
      </View>
    </View>
  );
}

export default function OrdersScreen({onOrderPress, onLocationPress}) {
  const {colors, isDark} = useTheme();
  const {t} = useI18n();
  const [filter, setFilter]         = useState('today');
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMoreUI, setLoadingMoreUI] = useState(false);
  const [orders, setOrders]         = useState([]);
  const [error, setError]           = useState(null);
  const [page, setPage]             = useState(1);
  const [hasMore, setHasMore]       = useState(true);
  const loadingMoreRef              = useRef(false);

  const fetchOrders = useCallback(async (activeFilter, pageNum, replace) => {
    if (replace) {
      setLoading(true);
    }
    setError(null);
    const res = await getOrders({...buildParams(activeFilter), page: pageNum, limit: 20});
    if (res.success) {
      const list = res.data?.data ?? res.data ?? [];
      if (replace) {
        setOrders(list);
      } else {
        setOrders(prev => [...prev, ...list]);
      }
      setHasMore(res.data?.pagination?.hasNextPage ?? false);
      setPage(pageNum);
    } else {
      setError(res.error ?? 'ERROR');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchOrders(filter, 1, true);
  }, [filter, fetchOrders]);

  // Re-fetch when the navigator signals a refresh (e.g. returning from order details).
  const orderRefreshSignal = useAppStore(s => s.orderRefreshSignal);
  useEffect(() => {
    if (orderRefreshSignal === 0) return;
    fetchOrders(filter, 1, true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderRefreshSignal]);

  const flatData = useMemo(() => {
    const rows = [];
    const seen = new Set();
    orders.forEach(o => {
      // scheduledAt قد يكون timestamp رقمي أو ISO string
      const raw = o.scheduledAt ? new Date(o.scheduledAt) : null;
      const dateLabel = raw
        ? raw.toLocaleDateString('ar-SA', {weekday: 'long', day: '2-digit', month: 'long'})
        : '';
      if (!seen.has(dateLabel)) {
        seen.add(dateLabel);
        rows.push({type: 'header', id: `h-${dateLabel}`, label: dateLabel});
      }
      rows.push({type: 'order', id: o._id, order: o});
    });
    return rows;
  }, [orders]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchOrders(filter, 1, true);
    setRefreshing(false);
  }, [filter, fetchOrders]);

  const onLoadMore = useCallback(async () => {
    if (loadingMoreRef.current || !hasMore) return;
    loadingMoreRef.current = true;
    setLoadingMoreUI(true);
    await fetchOrders(filter, page + 1, false);
    loadingMoreRef.current = false;
    setLoadingMoreUI(false);
  }, [hasMore, filter, page, fetchOrders]);

  const renderRow = useCallback(({item}) => {
    if (item.type === 'header') {
      return <Text style={[s.dateLabel, {color: colors.textPrimary}]}>{item.label}</Text>;
    }
    return (
      <OrderCard
        order={item.order}
        colors={colors}
        onPress={() => onOrderPress(item.order)}
        onLocationPress={() => onLocationPress(item.order)}
        t={t}
      />
    );
  }, [colors, t, onOrderPress, onLocationPress]);

  return (
    <View style={[s.root, {backgroundColor: colors.bg}]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.bg} />

      <View style={[s.header, {backgroundColor: colors.bg}]}>
        <Text style={[s.headerTitle, {color: colors.textPrimary}]}>{t('orders.all')}</Text>
        <TouchableOpacity style={[s.headerBtn, {backgroundColor: colors.card, borderColor: colors.border}]} activeOpacity={0.7}>
          <ChevronRight size={20} color={colors.textSecondary} strokeWidth={2} />
        </TouchableOpacity>
      </View>

      <View style={s.filterRow}>
        {FILTER_KEYS.map(f => (
          <TouchableOpacity
            key={f.key}
            style={[s.chip, {backgroundColor: filter === f.key ? colors.primary : colors.card, borderColor: filter === f.key ? colors.primary : colors.border, opacity: loading ? 0.5 : 1}]}
            onPress={() => setFilter(f.key)}
            disabled={loading}
            activeOpacity={0.8}>
            <Text style={[s.chipText, {color: filter === f.key ? '#fff' : colors.textSecondary}]}>{t(f.labelKey)}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={s.skeletonList}>
          {[1, 2, 3].map(i => <SkeletonCard key={i} colors={colors} />)}
        </View>
      ) : error ? (
        <View style={s.centerBox}>
          <Text style={[s.errorIcon]}>⚠️</Text>
          <Text style={[s.errorText, {color: colors.textSecondary}]}>{t('common.loadError')}</Text>
          <TouchableOpacity
            style={[s.retryBtn, {backgroundColor: colors.primary}]}
            onPress={() => fetchOrders(filter, 1, true)}
            activeOpacity={0.85}>
            <Text style={s.retryTxt}>{t('common.retry')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={flatData}
          keyExtractor={item => item.id}
          renderItem={renderRow}
          style={s.scroll}
          contentContainerStyle={[s.scrollContent, flatData.length === 0 && s.emptyContainer]}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
          onEndReached={onLoadMore}
          onEndReachedThreshold={0.3}
          ListEmptyComponent={
            <Text style={[s.emptyText, {color: colors.textSecondary}]}>{t('orders.noOrders')}</Text>
          }
          ListFooterComponent={
            loadingMoreUI
              ? <ActivityIndicator size="small" color={colors.primary} style={s.footerLoader} />
              : <View style={{height: 24}} />
          }
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root:         {flex: 1},
  header:       {paddingTop: Platform.OS === 'ios' ? 56 : 48, paddingBottom: 14, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  headerTitle:  {fontSize: 20, fontWeight: '800'},
  headerBtn:    {width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1},
  filterRow:    {flexDirection: 'row', gap: 8, paddingHorizontal: 20, paddingBottom: 14},
  chip:         {paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1},
  chipText:     {fontSize: 12, fontWeight: '600'},
  scroll:       {flex: 1},
  scrollContent:{paddingHorizontal: 20, paddingTop: 4},
  dateLabel:    {fontSize: 13, fontWeight: '700', marginBottom: 12},
  emptyContainer:{flex: 1, alignItems: 'center', justifyContent: 'center'},
  emptyText:    {fontSize: 15},
  skeletonList: {flex: 1, paddingHorizontal: 20, paddingTop: 4, gap: 14},
  centerBox:    {flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 32},
  errorIcon:    {fontSize: 40},
  errorText:    {fontSize: 14, textAlign: 'center', lineHeight: 22},
  retryBtn:     {paddingHorizontal: 28, paddingVertical: 12, borderRadius: 14},
  retryTxt:     {color: '#fff', fontSize: 14, fontWeight: '700'},
  footerLoader: {paddingVertical: 16},
});

const sk = StyleSheet.create({
  line:  {height: 14, borderRadius: 7},
  badge: {width: 64, height: 28, borderRadius: 14},
});

const c = StyleSheet.create({
  card:        {borderRadius: 20, padding: 16, marginBottom: 14, borderWidth: 1, shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2, gap: 12},
  cardTop:     {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8},
  cardTopLeft: {flex: 1, gap: 3},
  titleRow:    {flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap'},
  typePill:    {flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 20},
  typeTxt:     {fontSize: 10, fontWeight: '700'},
  badge:       {flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20},
  badgeText:   {fontSize: 12, fontWeight: '700'},
  timeText:    {fontSize: 12},
  grid: {gap: 10},
  gridItem: {flexDirection: 'row', alignItems: 'center', gap: 10},
  gridIcon: {width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center'},
  gridLabel: {fontSize: 10, marginBottom: 1},
  gridValue: {fontSize: 13, fontWeight: '700'},
  actionBtn: {flex: 1, borderRadius: 14, paddingVertical: 11, alignItems: 'center', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.25, shadowRadius: 8, elevation: 4},
  actionBtnText: {color: '#fff', fontSize: 15, fontWeight: '700'},
  actionRow: {flexDirection: 'row', gap: 10, alignItems: 'center'},
  locationBtn: {width: 48, height: 48, borderRadius: 14, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center'},
  toggleRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingTop: 2},
  toggleText: {fontSize: 13, fontWeight: '600'},
});
