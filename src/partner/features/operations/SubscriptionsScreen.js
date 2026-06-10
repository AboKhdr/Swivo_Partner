import React, {useCallback, useEffect, useState} from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {ArrowRight, Package, Car, CalendarDays, CheckCircle, XCircle, Clock, Hash} from 'lucide-react-native';
import {useTheme} from '../../../shared/context/ThemeContext';
import {useI18n} from '../../../shared/i18n/I18nContext';
import {getPackageSubscriptions} from '../../../services/partner';

// status: 1=active, 2=expired, 0=cancelled  (adjust if backend uses other values)
const FILTER_TABS = ['all', '1', '2', '0'];

function statusMeta(status, colors) {
  switch (String(status)) {
    case '1':  return {labelKey: 'active',    bg: '#F0FDF4', text: '#166534', border: '#86EFAC', Icon: CheckCircle};
    case '2':  return {labelKey: 'expired',   bg: '#FFF7ED', text: '#9A3412', border: '#FDBA74', Icon: Clock};
    case '0':  return {labelKey: 'cancelled', bg: '#FEF2F2', text: '#991B1B', border: '#FCA5A5', Icon: XCircle};
    default:   return {labelKey: 'active',    bg: colors.primary + '12', text: colors.primary, border: colors.primary + '30', Icon: CheckCircle};
  }
}

function fmtDate(ts) {
  if (!ts) return '—';
  try {
    return new Date(ts).toLocaleDateString('ar-SA', {day: '2-digit', month: 'short', year: 'numeric'});
  } catch { return String(ts); }
}

function sizeLabel(size) {
  switch (String(size)) {
    case '1': return 'S';
    case '2': return 'M';
    case '3': return 'L';
    default:  return String(size ?? '—');
  }
}

function SubscriptionCard({item, colors, t}) {
  const pkgName   = item.package?.name?.ar ?? item.package?.name?.en ?? '—';
  const customer  = item.customer?.name ?? item.customer?.phoneNumber ?? '—';
  const phone     = item.customer?.phoneNumber ?? '';
  const plate     = item.car?.plateNumber ?? '';
  const brand     = item.car?.brand ?? '';
  const carSize   = sizeLabel(item.size);
  const price     = item.price ?? 0;
  const available = item.availableCount ?? 0;
  const total     = item.package?.numberOfUse ?? 0;
  const used      = total - available;
  const progress  = total > 0 ? Math.min(used / total, 1) : 0;
  const meta      = statusMeta(item.status, colors);
  const StatusIcon = meta.Icon;

  return (
    <View style={[s.card, {backgroundColor: colors.card}]}>
      {/* Top row: customer + badge */}
      <View style={s.cardTop}>
        <View style={[s.avatar, {backgroundColor: colors.primary + '18'}]}>
          <Text style={[s.avatarLetter, {color: colors.primary}]}>
            {(customer[0] ?? '?').toUpperCase()}
          </Text>
        </View>
        <View style={s.cardUser}>
          <Text style={[s.userName, {color: colors.textPrimary}]} numberOfLines={1}>{customer}</Text>
          {!!phone && <Text style={[s.phone, {color: colors.textSecondary}]}>{phone}</Text>}
        </View>
        <View style={[s.badge, {backgroundColor: meta.bg, borderColor: meta.border}]}>
          <StatusIcon size={11} color={meta.text} />
          <Text style={[s.badgeText, {color: meta.text}]}>{t(`partner.subscriptions.status.${meta.labelKey}`)}</Text>
        </View>
      </View>

      <View style={[s.divider, {backgroundColor: colors.border}]} />

      {/* Package name + size + price */}
      <View style={s.rowInfo}>
        <Package size={14} color={colors.primary} />
        <Text style={[s.pkgName, {color: colors.textPrimary}]} numberOfLines={1}>{pkgName}</Text>
        <View style={[s.sizeChip, {backgroundColor: colors.primary + '18'}]}>
          <Text style={[s.sizeText, {color: colors.primary}]}>{carSize}</Text>
        </View>
        <Text style={[s.price, {color: colors.textPrimary}]}>{price} {t('currency')}</Text>
      </View>

      {/* Car */}
      {(!!plate || !!brand) && (
        <View style={s.rowInfo}>
          <Car size={13} color={colors.textSecondary} />
          <Text style={[s.carText, {color: colors.textSecondary}]}>
            {[brand, plate].filter(Boolean).join(' — ')}
          </Text>
        </View>
      )}

      {/* Usage bar */}
      {total > 0 && (
        <>
          <View style={s.usageRow}>
            <Hash size={12} color={colors.textSecondary} />
            <Text style={[s.usageLabel, {color: colors.textSecondary}]}>{t('partner.subscriptions.usage')}</Text>
            <Text style={[s.usageCount, {color: colors.textPrimary}]}>{used}/{total}</Text>
            <Text style={[s.usageLeft, {color: colors.primary}]}>
              ({available} {t('partner.subscriptions.remaining')})
            </Text>
          </View>
          <View style={[s.progressTrack, {backgroundColor: colors.border}]}>
            <View style={[s.progressFill, {backgroundColor: colors.primary, width: `${Math.round(progress * 100)}%`}]} />
          </View>
        </>
      )}

      {/* Expiry */}
      <View style={s.rowInfo}>
        <CalendarDays size={13} color={colors.textSecondary} />
        <Text style={[s.dateText, {color: colors.textSecondary}]}>
          {t('partner.subscriptions.expiry')}: {fmtDate(item.expiryDate)}
        </Text>
        {item.expired && (
          <View style={[s.expiredPill, {backgroundColor: '#FEF2F2', borderColor: '#FCA5A5'}]}>
            <Text style={s.expiredText}>{t('partner.subscriptions.status.expired')}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

export default function SubscriptionsScreen({onBack}) {
  const {colors}                      = useTheme();
  const {t}                           = useI18n();
  const [items,       setItems]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [filter,      setFilter]      = useState('all');
  const [page,        setPage]        = useState(1);
  const [hasMore,     setHasMore]     = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [total,       setTotal]       = useState(0);

  const load = useCallback(async (p, status) => {
    if (p === 1) setLoading(true); else setLoadingMore(true);
    const params = {page: p, limit: 20};
    if (status !== 'all') params.status = status;
    const res = await getPackageSubscriptions(params);
    if (res.success) {
      const list = res.data?.data ?? [];
      const tot  = res.data?.pagination?.total ?? res.data?.total ?? list.length;
      if (p === 1) setItems(list); else setItems(prev => [...prev, ...list]);
      setTotal(tot);
      setPage(p);
      setHasMore(p * 20 < tot);
    }
    if (p === 1) setLoading(false); else setLoadingMore(false);
  }, []);

  useEffect(() => { load(1, filter); }, [filter, load]);

  const handleEndReached = useCallback(() => {
    if (hasMore && !loadingMore) load(page + 1, filter);
  }, [hasMore, loadingMore, load, page, filter]);

  const renderItem   = useCallback(({item}) => (
    <SubscriptionCard item={item} colors={colors} t={t} />
  ), [colors, t]);
  const keyExtractor = useCallback(item => item._id ?? String(item.createdAt), []);
  const renderFooter = useCallback(() =>
    loadingMore ? <ActivityIndicator color={colors.primary} style={s.footerSpinner} /> : null,
  [loadingMore, colors.primary]);

  const filterLabel = tab => {
    if (tab === 'all')  return t('partner.subscriptions.filter.all');
    if (tab === '1')    return t('partner.subscriptions.filter.active');
    if (tab === '2')    return t('partner.subscriptions.filter.expired');
    if (tab === '0')    return t('partner.subscriptions.filter.cancelled');
    return tab;
  };

  return (
    <View style={[s.root, {backgroundColor: colors.bg}]}>
      <View style={[s.header, {backgroundColor: colors.bg}]}>
        <TouchableOpacity onPress={onBack} style={s.backBtn} activeOpacity={0.75}>
          <ArrowRight size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={s.headerText}>
          <Text style={[s.headerTitle, {color: colors.textPrimary}]}>{t('partner.subscriptions.title')}</Text>
          <Text style={[s.headerSub, {color: colors.textSecondary}]}>
            {total} {t('partner.subscriptions.countSuffix')}
          </Text>
        </View>
      </View>

      <View style={s.filtersRow}>
        {FILTER_TABS.map(tab => {
          const active = filter === tab;
          return (
            <TouchableOpacity
              key={tab}
              onPress={() => setFilter(tab)}
              style={[s.chip, {borderColor: colors.border, backgroundColor: active ? colors.primary : colors.card}]}
              activeOpacity={0.75}>
              <Text style={[s.chipText, {color: active ? '#FFF' : colors.textSecondary}]}>
                {filterLabel(tab)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {loading
        ? <View style={s.center}><ActivityIndicator size="large" color={colors.primary} /></View>
        : items.length === 0
          ? (
            <View style={s.center}>
              <Package size={48} color={colors.textSecondary} />
              <Text style={[s.empty, {color: colors.textSecondary}]}>{t('partner.subscriptions.empty')}</Text>
            </View>
          )
          : (
            <FlatList
              data={items}
              renderItem={renderItem}
              keyExtractor={keyExtractor}
              contentContainerStyle={s.list}
              showsVerticalScrollIndicator={false}
              onEndReached={handleEndReached}
              onEndReachedThreshold={0.3}
              ListFooterComponent={renderFooter}
            />
          )
      }
    </View>
  );
}

const s = StyleSheet.create({
  root:          {flex: 1},
  center:        {flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12},
  empty:         {fontSize: 14, fontWeight: '500'},

  header:        {flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 12},
  backBtn:       {width: 36, height: 36, alignItems: 'center', justifyContent: 'center'},
  headerText:    {flex: 1, gap: 2, paddingHorizontal: 8},
  headerTitle:   {fontSize: 26, fontWeight: '900'},
  headerSub:     {fontSize: 13},

  filtersRow:    {flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingBottom: 10, flexWrap: 'wrap'},
  chip:          {paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1},
  chipText:      {fontSize: 13, fontWeight: '600'},

  list:          {paddingHorizontal: 16, paddingBottom: 32, gap: 12},
  footerSpinner: {paddingVertical: 16},

  card:          {borderRadius: 16, padding: 14, gap: 10, elevation: 1, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: {width: 0, height: 1}},

  cardTop:       {flexDirection: 'row', alignItems: 'center', gap: 10},
  avatar:        {width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center'},
  avatarLetter:  {fontSize: 17, fontWeight: '800'},
  cardUser:      {flex: 1, gap: 2},
  userName:      {fontSize: 14, fontWeight: '700'},
  phone:         {fontSize: 12},
  badge:         {flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20, borderWidth: 1},
  badgeText:     {fontSize: 11, fontWeight: '700'},

  divider:       {height: 1},

  rowInfo:       {flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap'},
  pkgName:       {flex: 1, fontSize: 13, fontWeight: '700'},
  sizeChip:      {paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8},
  sizeText:      {fontSize: 12, fontWeight: '800'},
  price:         {fontSize: 13, fontWeight: '700'},
  carText:       {fontSize: 12},

  usageRow:      {flexDirection: 'row', alignItems: 'center', gap: 6},
  usageLabel:    {fontSize: 12},
  usageCount:    {fontSize: 12, fontWeight: '700'},
  usageLeft:     {fontSize: 12, fontWeight: '600'},
  progressTrack: {height: 6, borderRadius: 3, overflow: 'hidden'},
  progressFill:  {height: 6, borderRadius: 3},

  dateText:      {fontSize: 12, flex: 1},
  expiredPill:   {paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, borderWidth: 1},
  expiredText:   {fontSize: 11, fontWeight: '700', color: '#991B1B'},
});
