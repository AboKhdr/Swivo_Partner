import React, {useCallback, useEffect, useState} from 'react';
import {ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, TextInput, TouchableOpacity, View} from 'react-native';
import {Search} from 'lucide-react-native';
import {useTheme} from '../../../shared/context/ThemeContext';
import {useI18n} from '../../../shared/i18n/I18nContext';
import {getOrders} from '../../../services/partner';

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

function OrderCard({item, colors, t, onPress}) {
  const color        = STATUS_COLORS[item.status] ?? '#64748B';
  const statusLabel  = t(`partner.orders.status.${item.status}`);
  const orderNumber  = item.orderNumber ?? item._id ?? '';
  const isOnshop     = (item.orderType ?? item.type ?? '').toUpperCase() === 'IN_SHOP'
    || (item.orderType ?? item.type ?? '') === 'onshop';
  const serviceName  =
    item.itemsSnapshot?.[0]?.nameSnapshot?.ar
    ?? item.itemsSnapshot?.[0]?.nameSnapshot?.en
    ?? item.items?.[0]?.service?.name?.ar
    ?? item.items?.[0]?.service?.name?.en
    ?? item.items?.[0]?.name?.ar
    ?? item.items?.[0]?.name?.en
    ?? item.service?.name?.ar
    ?? item.service?.name?.en
    ?? (typeof item.service?.name === 'string' ? item.service.name : '')
    ?? '';
  const branchName   = item.branch?.name?.ar ?? item.branch?.name?.en ?? (typeof item.branch?.name === 'string' ? item.branch.name : '') ?? '';
  const location     = item.addressSnapshot?.addressText
    ?? item.addressSnapshot?.district
    ?? branchName;
  const price        = item.tenantNetSnapshot ?? item.totalAmount ?? '';
  const scheduledAt  = item.scheduledAt
    ? new Date(item.scheduledAt).toLocaleString('ar-SA', {
        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
      })
    : '';

  return (
    <View style={[s.card, {backgroundColor: colors.card, borderColor: colors.border}]}>
      <View style={s.cardTop}>
        <View style={s.cardIdRow}>
          <Text style={[s.cardId, {color: colors.primary}]}>#{orderNumber}</Text>
          {isOnshop && (
            <View style={[s.typePill, {backgroundColor: colors.primary + '18'}]}>
              <Text style={[s.typePillText, {color: colors.primary}]}>{t('partner.orders.onshop') || 'في الموقع'}</Text>
            </View>
          )}
        </View>
        <View style={[s.badge, {backgroundColor: color + '18'}]}>
          <Text style={[s.badgeText, {color: color}]}>• {statusLabel}</Text>
        </View>
      </View>

      <Text style={[s.serviceName, {color: colors.textPrimary}]}>{serviceName}</Text>

      <View style={s.cardMeta}>
        {!!location    && <Text style={[s.metaText, {color: colors.textSecondary}]}>📍 {location}</Text>}
        {!!scheduledAt && <Text style={[s.metaText, {color: colors.textSecondary}]}>📅 {scheduledAt}</Text>}
      </View>

      <View style={[s.cardDivider, {backgroundColor: colors.border}]} />

      <View style={s.cardBottom}>
        <View style={s.priceCol}>
          <Text style={[s.priceLabel, {color: colors.textSecondary}]}>{t('partner.orders.fullAmount')}</Text>
          <Text style={[s.priceValue, {color: colors.textPrimary}]}>{price} {price ? '﷼' : '—'}</Text>
        </View>
        <TouchableOpacity
          style={[s.detailsBtn, {backgroundColor: colors.primary + '12'}]}
          onPress={() => onPress(item)}
          activeOpacity={0.75}>
          <Text style={[s.detailsBtnText, {color: colors.primary}]}>{t('partner.orders.viewDetails')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function OrdersScreen({onSelectOrder}) {
  const {colors} = useTheme();
  const {t, isRTL} = useI18n();
  const [activeFilter, setActiveFilter] = useState('all');
  const [search, setSearch]             = useState('');
  const [orders, setOrders]             = useState([]);
  const [loading, setLoading]           = useState(true);
  const [refreshing, setRefreshing]     = useState(false);
  const [page, setPage]                 = useState(1);
  const [hasNext, setHasNext]           = useState(false);
  const [loadingMore, setLoadingMore]   = useState(false);

  const FILTERS = [
    {key: 'all',             label: t('partner.orders.all')},
    {key: 'PENDING_PARTNER', label: t('partner.orders.status.PENDING_PARTNER')},
    {key: 'ACCEPTED',        label: t('partner.orders.status.ACCEPTED')},
    {key: 'ASSIGNED',        label: t('partner.orders.status.ASSIGNED')},
    {key: 'ON_THE_WAY',      label: t('partner.orders.status.ON_THE_WAY')},
    {key: 'STARTED',         label: t('partner.orders.status.STARTED')},
    {key: 'COMPLETED',       label: t('partner.orders.status.COMPLETED')},
  ];

  const fetchOrders = useCallback(async (filter, pageNum, append = false) => {
    if (!append) setLoading(true);
    const params = {page: pageNum, limit: 20};
    if (filter !== 'all') params.status = filter;
    const res = await getOrders(params);
    if (res.success) {
      const list = res.data?.data ?? res.data ?? [];
      setOrders(prev => append ? [...prev, ...list] : list);
      setHasNext(res.data?.pagination?.hasNextPage ?? false);
      setPage(pageNum);
    }
    if (!append) setLoading(false);
  }, []);

  useEffect(() => {
    fetchOrders(activeFilter, 1);
  }, [activeFilter, fetchOrders]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchOrders(activeFilter, 1);
    setRefreshing(false);
  }, [activeFilter, fetchOrders]);

  const onEndReached = useCallback(() => {
    if (!hasNext || loadingMore) return;
    setLoadingMore(true);
    fetchOrders(activeFilter, page + 1, true).finally(() => setLoadingMore(false));
  }, [hasNext, loadingMore, activeFilter, page, fetchOrders]);

  const q = search.trim().toLowerCase();
  const filtered = q
    ? orders.filter(o => {
        const name = `${o.client?.firstName ?? ''} ${o.client?.lastName ?? ''}`.toLowerCase();
        const num  = (o.orderNumber ?? o._id ?? '').toLowerCase();
        return name.includes(q) || num.includes(q);
      })
    : orders;

  const renderItem = useCallback(({item}) => (
    <OrderCard item={item} colors={colors} t={t} onPress={onSelectOrder || (() => {})} />
  ), [colors, t, onSelectOrder]);

  const keyExtractor = useCallback(item => item._id ?? item.id, []);

  return (
    <View style={[s.root, {backgroundColor: colors.bg}]}>
      <View style={[s.header, {backgroundColor: colors.bg}]}>
        <Text style={[s.headerTitle, {color: colors.textPrimary}]}>{t('partner.orders.title')}</Text>

        <View style={[s.searchBox, {backgroundColor: colors.card, borderColor: colors.border}]}>
          <Search size={16} color={colors.textSecondary} />
          <TextInput
            style={[s.searchInput, {color: colors.textPrimary}]}
            placeholder={t('partner.orders.searchPlaceholder')}
            placeholderTextColor={colors.textSecondary}
            value={search}
            onChangeText={setSearch}
            textAlign={isRTL ? 'right' : 'left'}
          />
        </View>

        <FlatList
          data={FILTERS}
          horizontal
          inverted
          showsHorizontalScrollIndicator={false}
          keyExtractor={f => f.key}
          contentContainerStyle={s.filters}
          renderItem={({item: f}) => {
            const isActive = activeFilter === f.key;
            return (
              <TouchableOpacity
                style={[s.filterChip, {
                  backgroundColor: isActive ? colors.primary : colors.card,
                  borderColor:     isActive ? colors.primary : colors.border,
                }]}
                onPress={() => setActiveFilter(f.key)}
                activeOpacity={0.75}>
                <Text style={[s.filterText, {color: isActive ? '#fff' : colors.textSecondary}]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.3}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
          ListEmptyComponent={
            <View style={s.empty}>
              <Text style={[s.emptyText, {color: colors.textSecondary}]}>{t('partner.orders.noOrders')}</Text>
            </View>
          }
          ListFooterComponent={
            loadingMore
              ? <ActivityIndicator size="small" color={colors.primary} style={s.footer} />
              : null
          }
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root:         {flex: 1},
  center:       {flex: 1, alignItems: 'center', justifyContent: 'center'},
  header:       {paddingHorizontal: 16, paddingTop: 56, paddingBottom: 4},
  headerTitle:  {fontSize: 26, fontWeight: '800', marginBottom: 14},
  searchBox:    {flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 50, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 10, marginBottom: 12},
  searchInput:  {flex: 1, fontSize: 14, padding: 0},
  filters:      {gap: 8, paddingBottom: 10, flexDirection: 'row'},
  filterChip:   {paddingHorizontal: 18, paddingVertical: 9, borderRadius: 50, borderWidth: 1},
  filterText:   {fontSize: 13, fontWeight: '600'},
  list:         {paddingHorizontal: 16, paddingBottom: 24, paddingTop: 8},
  card:         {borderRadius: 16, borderWidth: 1, marginBottom: 12, padding: 16, gap: 10},
  cardTop:      {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'},
  cardIdRow:    {flexDirection: 'row', alignItems: 'center', gap: 6},
  cardId:       {fontSize: 13, fontWeight: '700'},
  typePill:     {paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20},
  typePillText: {fontSize: 10, fontWeight: '700'},
  badge:        {paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20},
  badgeText:    {fontSize: 11, fontWeight: '700'},
  serviceName:  {fontSize: 18, fontWeight: '800'},
  cardMeta:     {gap: 6},
  metaText:     {fontSize: 13},
  cardDivider:  {height: 1},
  cardBottom:   {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'},
  detailsBtn:   {paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20},
  footer:       {paddingVertical: 16},
  priceCol:     {gap: 2},
  priceLabel:   {fontSize: 11},
  priceValue:   {fontSize: 24, fontWeight: '800'},
  empty:        {alignItems: 'center', paddingTop: 60},
  emptyText:    {fontSize: 14},
});
