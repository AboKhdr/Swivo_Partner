import React, {useCallback, useEffect, useState} from 'react';
import {ActivityIndicator, Alert, Clipboard, FlatList, Platform, RefreshControl, StyleSheet, Text, TextInput, ToastAndroid, TouchableOpacity, View} from 'react-native';
import {Search} from 'lucide-react-native';
import {useTheme} from '../../../shared/context/ThemeContext';
import {useI18n} from '../../../shared/i18n/I18nContext';
import SelectField from '../../../shared/components/SelectField';
import RiyalIcon from '../../../shared/components/RiyalIcon';
import {getOrders, getPartnerProfile} from '../../../services/partner';

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

function copyOrderNumber(value, t) {
  if (!value) return;
  Clipboard.setString(String(value));
  if (Platform.OS === 'android') {
    ToastAndroid.show(t('common.copiedOrderNumber'), ToastAndroid.SHORT);
  } else {
    Alert.alert(t('common.copied'), t('common.copiedOrderNumber'));
  }
}

function OrderCard({item, colors, t, onPress}) {
  const color        = STATUS_COLORS[item.status] ?? '#64748B';
  const statusLabel  = t(`partner.orders.status.${item.status}`);
  const orderNumber  = item.orderNumber ?? item._id ?? '';
  const rawType      = (item.orderType ?? item.type ?? '').toUpperCase();
  const isOnshop     = rawType === 'IN_SHOP' || rawType === 'ONSHOP';
  const isPackageOrder = !!item.isPackageOrder
    || !!(item.packageSnapshot ?? item.package ?? item.packageId);
  const packageName  = item.packageSnapshot?.name?.ar
    ?? item.packageSnapshot?.name?.en
    ?? item.package?.name?.ar
    ?? item.package?.name?.en
    ?? (typeof item.package?.name === 'string' ? item.package.name : '')
    ?? '';
  const serviceName  = isPackageOrder
    ? (packageName || 'باقة')
    : (item.itemsSnapshot?.[0]?.nameSnapshot?.ar
      ?? item.itemsSnapshot?.[0]?.nameSnapshot?.en
      ?? item.items?.[0]?.service?.name?.ar
      ?? item.items?.[0]?.service?.name?.en
      ?? item.items?.[0]?.name?.ar
      ?? item.items?.[0]?.name?.en
      ?? item.service?.name?.ar
      ?? item.service?.name?.en
      ?? (typeof item.service?.name === 'string' ? item.service.name : '')
      ?? '');
  const branchName   = item.branch?.name?.ar ?? item.branch?.name?.en ?? (typeof item.branch?.name === 'string' ? item.branch.name : '') ?? '';
  const location     = item.addressSnapshot?.addressText ?? item.addressSnapshot?.district ?? branchName;
  const price        = isPackageOrder ? '' : (item.tenantNetSnapshot ?? item.totalAmount ?? '');
  const scheduledAt  = item.scheduledAt
    ? new Date(item.scheduledAt).toLocaleString('ar-SA', {day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'})
    : '';

  return (
    <View style={[s.card, {backgroundColor: colors.card, borderColor: colors.border}]}>
      <View style={s.cardTop}>
        <View style={s.cardIdRow}>
          <TouchableOpacity onPress={() => copyOrderNumber(orderNumber, t)} activeOpacity={0.6}>
            <Text style={[s.cardId, {color: colors.primary}]}>#{orderNumber}</Text>
          </TouchableOpacity>
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
          {isPackageOrder ? (
            <View style={[s.pkgPill, {backgroundColor: colors.primary + '15'}]}>
              <Text style={[s.pkgPillTxt, {color: colors.primary}]}>عن طريق الباقة</Text>
            </View>
          ) : (
            <>
              <Text style={[s.priceLabel, {color: colors.textSecondary}]}>{t('partner.orders.fullAmount')}</Text>
              {price ? (
                <View style={s.priceRow}>
                  <Text style={[s.priceValue, {color: colors.textPrimary}]}>{price}</Text>
                  <RiyalIcon size={22} color={colors.textPrimary} />
                </View>
              ) : (
                <Text style={[s.priceValue, {color: colors.textPrimary}]}>—</Text>
              )}
            </>
          )}
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

export default function OrdersScreen({onSelectOrder, refreshKey}) {
  const {colors} = useTheme();
  const {t, isRTL} = useI18n();

  const [activeStatusFilter, setActiveStatusFilter] = useState('all');
  const [activeTypeFilter,   setActiveTypeFilter]   = useState('all');
  const [search,             setSearch]             = useState('');
  const [orders,             setOrders]             = useState([]);
  const [loading,            setLoading]            = useState(true);
  const [refreshing,         setRefreshing]         = useState(false);
  const [page,               setPage]               = useState(1);
  const [hasNext,            setHasNext]            = useState(false);
  const [loadingMore,        setLoadingMore]        = useState(false);
  const [tenantType,         setTenantType]         = useState(null); // null = loading, 'MOBILE'|'IN_SHOP'|'BOTH'

  // Load tenant type once
  useEffect(() => {
    getPartnerProfile().then(res => {
      if (res.success) {
        const d = res.data?.data ?? res.data ?? {};
        const type = d.availableFor ?? d.serviceType ?? d.orderType ?? null;
        setTenantType(type ? type.toUpperCase() : 'BOTH');
      } else {
        setTenantType('BOTH');
      }
    });
  }, []);

  const STATUS_FILTERS = [
    {key: 'all',             label: t('partner.orders.all')},
    {key: 'PENDING_PAYMENT', label: t('partner.orders.status.PENDING_PAYMENT')},
    {key: 'AUTHORIZING',     label: t('partner.orders.status.AUTHORIZING')},
    {key: 'AUTHORIZED',      label: t('partner.orders.status.AUTHORIZED')},
    {key: 'PENDING_PARTNER', label: t('partner.orders.status.PENDING_PARTNER')},
    {key: 'ACCEPTED',        label: t('partner.orders.status.ACCEPTED')},
    {key: 'ASSIGNED',        label: t('partner.orders.status.ASSIGNED')},
    {key: 'ON_THE_WAY',      label: t('partner.orders.status.ON_THE_WAY')},
    {key: 'ARRIVED',         label: t('partner.orders.status.ARRIVED')},
    {key: 'STARTED',         label: t('partner.orders.status.STARTED')},
    {key: 'COMPLETED',       label: t('partner.orders.status.COMPLETED')},
    {key: 'CANCELLED',       label: t('partner.orders.status.CANCELLED')},
    {key: 'REJECTED',        label: t('partner.orders.status.REJECTED')},
  ];

  const TYPE_FILTERS = [
    {key: 'all',     label: 'الكل'},
    {key: 'MOBILE',  label: 'موبايل'},
    {key: 'IN_SHOP', label: 'في الموقع'},
  ];

  const showTypeFilter = tenantType === 'BOTH';
  const filtersDisabled = loading || tenantType === null;

  const fetchOrders = useCallback(async (statusFilter, typeFilter, pageNum, append = false) => {
    if (!append) setLoading(true);
    const params = {page: pageNum, limit: 20};
    if (statusFilter !== 'all') params.status = statusFilter;
    if (typeFilter   !== 'all') params.orderType = typeFilter;
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
    if (tenantType === null) return;
    fetchOrders(activeStatusFilter, activeTypeFilter, 1);
  }, [activeStatusFilter, activeTypeFilter, tenantType, fetchOrders, refreshKey]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchOrders(activeStatusFilter, activeTypeFilter, 1);
    setRefreshing(false);
  }, [activeStatusFilter, activeTypeFilter, fetchOrders]);

  const onEndReached = useCallback(() => {
    if (!hasNext || loadingMore) return;
    setLoadingMore(true);
    fetchOrders(activeStatusFilter, activeTypeFilter, page + 1, true).finally(() => setLoadingMore(false));
  }, [hasNext, loadingMore, activeStatusFilter, activeTypeFilter, page, fetchOrders]);

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

        {/* Search */}
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

        {/* Type filter — only when tenant is BOTH */}
        {showTypeFilter && (
          <View style={s.typeFilterRow}>
            {TYPE_FILTERS.map(f => {
              const isActive = activeTypeFilter === f.key;
              return (
                <TouchableOpacity
                  key={f.key}
                  style={[
                    s.typeChip,
                    {
                      backgroundColor: isActive ? colors.primary : colors.card,
                      borderColor:     isActive ? colors.primary : colors.border,
                      opacity: filtersDisabled ? 0.4 : 1,
                    },
                  ]}
                  onPress={() => !filtersDisabled && setActiveTypeFilter(f.key)}
                  activeOpacity={0.75}
                  disabled={filtersDisabled}>
                  <Text style={[s.typeChipText, {color: isActive ? '#fff' : colors.textSecondary}]}>
                    {f.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Status filter — select dropdown */}
        <View style={[s.statusSelectWrap, filtersDisabled && s.statusSelectDisabled]} pointerEvents={filtersDisabled ? 'none' : 'auto'}>
          <SelectField
            label={t('partner.orders.statusFilter')}
            placeholder={t('partner.orders.all')}
            options={STATUS_FILTERS.map(f => ({value: f.key, label: f.label}))}
            value={activeStatusFilter}
            onChange={setActiveStatusFilter}
          />
        </View>
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

  // Type filter (mobile / onshop)
  typeFilterRow:{flexDirection: 'row', gap: 8, marginBottom: 10},
  typeChip:     {flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 12, borderWidth: 1},
  typeChipText: {fontSize: 12, fontWeight: '700'},

  // Status filter (select)
  statusSelectWrap:    {marginBottom: 10},
  statusSelectDisabled:{opacity: 0.4},

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
  detailsBtnText:{fontSize: 13, fontWeight: '700'},
  footer:       {paddingVertical: 16},
  priceCol:     {gap: 2},
  priceRow:     {flexDirection: 'row', alignItems: 'center', gap: 3},
  priceLabel:   {fontSize: 11},
  priceValue:   {fontSize: 24, fontWeight: '800'},
  pkgPill:      {paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, alignSelf: 'flex-start'},
  pkgPillTxt:   {fontSize: 13, fontWeight: '700'},
  empty:        {alignItems: 'center', paddingTop: 60},
  emptyText:    {fontSize: 14},
});
