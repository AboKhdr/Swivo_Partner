import React, {useState, useCallback, useMemo} from 'react';
import {
  FlatList, Platform, RefreshControl, StatusBar,
  StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import {ChevronRight, MapPin, Car, User, Droplets, ChevronUp, ChevronDown, Sparkles} from 'lucide-react-native';
import {useTheme} from '../../../shared/context/ThemeContext';
import {useI18n} from '../../../shared/i18n/I18nContext';
import {MOCK_ORDERS, MOCK_PAST_ORDERS} from '../../../shared/data/mockData';

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

function OrderCard({order, onPress, onLocationPress, colors, t}) {
  const [expanded, setExpanded] = useState(false);
  const bs = BADGE_STYLE[order.status] ?? BADGE_STYLE.ON_THE_WAY;
  const isDone = order.status === 'COMPLETED' || order.status === 'CANCELLED';

  return (
    <View style={[c.card, {backgroundColor: colors.card, borderColor: colors.border}]}>
      <View style={c.cardTop}>
        <View>
          <Text style={[c.gridValue, {color: colors.textPrimary}]}>{order.service.name}</Text>
          <Text style={[c.timeText, {color: colors.textPrimary}]}>{order.scheduledAt}</Text>
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
                <Text style={[c.gridValue, {color: colors.textPrimary}]}>{order.client.firstName} {order.client.lastName}</Text>
              </View>
            </View>
            <View style={c.gridItem}>
              <View style={[c.gridIcon, {backgroundColor: '#EEF2FF'}]}>
                <Car size={14} color="#6366F1" strokeWidth={2} />
              </View>
              <View>
                <Text style={[c.gridLabel, {color: colors.textSecondary}]}>{t('orders.fields.carType')}</Text>
                <Text style={[c.gridValue, {color: colors.textPrimary}]}>{order.car.brand} {order.car.model} | {order.car.plateNumber}</Text>
              </View>
            </View>
            <View style={c.gridItem}>
              <View style={[c.gridIcon, {backgroundColor: '#E0F2FE'}]}>
                <Droplets size={14} color="#0EA5E9" strokeWidth={2} />
              </View>
              <View>
                <Text style={[c.gridLabel, {color: colors.textSecondary}]}>{t('orders.fields.washType')}</Text>
                <Text style={[c.gridValue, {color: colors.textPrimary}]}>{order.service.name}</Text>
              </View>
            </View>
            <View style={c.gridItem}>
              <View style={[c.gridIcon, {backgroundColor: colors.primary + '12'}]}>
                <MapPin size={14} color={colors.primary} strokeWidth={2} />
              </View>
              <View style={{flex: 1}}>
                <Text style={[c.gridLabel, {color: colors.textSecondary}]}>{t('orders.fields.location')}</Text>
                <Text style={[c.gridValue, {color: colors.textPrimary}]} numberOfLines={1}>{order.address}</Text>
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

export default function OrdersScreen({onOrderPress, onLocationPress}) {
  const {colors, isDark} = useTheme();
  const {t} = useI18n();
  const [filter, setFilter] = useState('today');
  const [refreshing, setRefreshing] = useState(false);

  const flatData = useMemo(() => {
    const source = filter === 'past' ? MOCK_PAST_ORDERS : MOCK_ORDERS;
    const rows = [];
    const seen = new Set();
    source.forEach(o => {
      if (!seen.has(o.scheduledDate)) {
        seen.add(o.scheduledDate);
        rows.push({type: 'header', id: `h-${o.scheduledDate}`, label: o.scheduledDate});
      }
      rows.push({type: 'order', id: o._id, order: o});
    });
    return rows;
  }, [filter]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

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
            style={[s.chip, {backgroundColor: filter === f.key ? colors.primary : colors.card, borderColor: filter === f.key ? colors.primary : colors.border}]}
            onPress={() => setFilter(f.key)}
            activeOpacity={0.8}>
            <Text style={[s.chipText, {color: filter === f.key ? '#fff' : colors.textSecondary}]}>{t(f.labelKey)}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={flatData}
        keyExtractor={item => item.id}
        renderItem={renderRow}
        style={s.scroll}
        contentContainerStyle={[s.scrollContent, flatData.length === 0 && s.emptyContainer]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
        ListEmptyComponent={
          <Text style={[s.emptyText, {color: colors.textSecondary}]}>{t('orders.noOrders')}</Text>
        }
        ListFooterComponent={<View style={{height: 24}} />}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: {flex: 1},
  header: {paddingTop: Platform.OS === 'ios' ? 56 : 48, paddingBottom: 14, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  headerTitle: {fontSize: 20, fontWeight: '800'},
  headerBtn: {width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1},
  filterRow: {flexDirection: 'row', gap: 8, paddingHorizontal: 20, paddingBottom: 14},
  chip: {paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1},
  chipText: {fontSize: 12, fontWeight: '600'},
  scroll: {flex: 1},
  scrollContent: {paddingHorizontal: 20, paddingTop: 4},
  dateLabel: {fontSize: 13, fontWeight: '700', marginBottom: 12},
  empty: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  emptyText: {fontSize: 15},
});

const c = StyleSheet.create({
  card: {borderRadius: 20, padding: 16, marginBottom: 14, borderWidth: 1, shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2, gap: 12},
  cardTop: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  badge: {flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20},
  badgeText: {fontSize: 12, fontWeight: '700'},
  timeText: {fontSize: 14, fontWeight: '700'},
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
