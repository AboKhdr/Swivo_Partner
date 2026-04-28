import React, {useState, useCallback} from 'react';
import {
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  ChevronRight,
  MapPin,
  Car,
  User,
  Droplets,
  ChevronUp,
  ChevronDown,
  Sparkles,
} from 'lucide-react-native';
import {Colors} from '../../../shared/constants/colors';
import {MOCK_ORDERS, MOCK_PAST_ORDERS} from '../../../shared/data/mockData';

// ─── Filter tabs config ───────────────────────────────────────────────────────
const FILTERS = [
  {key: 'today', label: 'اليوم'},
  {key: 'upcoming', label: 'الطلبات المجدولة'},
  {key: 'past', label: 'طلبات سابقة'},
];

// ─── Single Order Card ────────────────────────────────────────────────────────
const BADGE_STYLE = {
  ASSIGNED:   {bg: '#FEF3C7',   font: '#D97706',  icon: '#F59E0B'},
  ON_THE_WAY: {bg: Colors.primary + '15', font: Colors.primary, icon: Colors.primary},
  STARTED:    {bg: Colors.primary + '15', font: Colors.primary, icon: Colors.primary},
  COMPLETED:  {bg: '#1CE3801A', font: '#1CE380',   icon: '#1CE380'},
  CANCELLED:  {bg: '#FF3B3B1A', font: '#FF3B3B',   icon: '#FF3B3B'},
};

function OrderCard({order, onPress, onLocationPress}) {
  const [expanded, setExpanded] = useState(false);
  const bs = BADGE_STYLE[order.status] ?? BADGE_STYLE.ON_THE_WAY;
  const isDone = order.status === 'COMPLETED' || order.status === 'CANCELLED';
  const btnLabel = isDone ? 'ملخص الغسيل' : 'بدء الغسيل';

  return (
    <View style={c.card}>
      {/* Badge + time */}
      <View style={c.cardTop}>
        <View>
          <Text style={c.gridValue}>{order.service.name}</Text>
          <Text style={c.timeText}>{order.scheduledAt}</Text>
        </View>
        <View style={[c.badge, {backgroundColor: bs.bg}]}>
          <Sparkles size={11} color={bs.icon} strokeWidth={2} />
          <Text style={[c.badgeText, {color: bs.font}]}>{statusLabel(order.status)}</Text>
        </View>
      </View>

      {expanded && (
        <>
          {/* Main info grid */}
          <View style={c.grid}>
            {/* Client */}
            <View style={c.gridItem}>
              <View style={c.gridIcon}>
                <User size={14} color={Colors.primary} strokeWidth={2} />
              </View>
              <View>
                <Text style={c.gridLabel}>صاحب الطلب</Text>
                <Text style={c.gridValue}>
                  {order.client.firstName} {order.client.lastName}
                </Text>
              </View>
            </View>

            {/* Car */}
            <View style={c.gridItem}>
              <View style={[c.gridIcon, c.gridIconAlt]}>
                <Car size={14} color="#6366F1" strokeWidth={2} />
              </View>
              <View>
                <Text style={c.gridLabel}>نوع السيارة</Text>
                <Text style={c.gridValue}>
                  {order.car.brand} {order.car.model} | {order.car.plateNumber}
                </Text>
              </View>
            </View>

            {/* Service */}
            <View style={c.gridItem}>
              <View style={[c.gridIcon, c.gridIconService]}>
                <Droplets size={14} color="#0EA5E9" strokeWidth={2} />
              </View>
              <View>
                <Text style={c.gridLabel}>نوع الغسيل</Text>
                <Text style={c.gridValue}>{order.service.name}</Text>
              </View>
            </View>

            {/* Location */}
            <View style={c.gridItem}>
              <View style={[c.gridIcon, c.gridIconLocation]}>
                <MapPin size={14} color={Colors.primary} strokeWidth={2} />
              </View>
              <View style={{flex: 1}}>
                <Text style={c.gridLabel}>الموقع</Text>
                <Text style={c.gridValue} numberOfLines={1}>
                  {order.address}
                </Text>
              </View>
            </View>
          </View>

          {/* Action row */}
          <View style={c.actionRow}>
            <TouchableOpacity
              style={c.actionBtn}
              onPress={onPress}
              activeOpacity={0.88}>
              <Text style={c.actionBtnText}>{btnLabel}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={c.locationBtn} onPress={onLocationPress} activeOpacity={0.8}>
              <MapPin size={17} color={Colors.primary} strokeWidth={2} />
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* Toggle details */}
      <TouchableOpacity
        style={c.toggleRow}
        onPress={() => setExpanded(v => !v)}
        activeOpacity={0.7}>
        {expanded ? (
          <ChevronUp size={15} color={Colors.primary} strokeWidth={2} />
        ) : (
          <ChevronDown size={15} color={Colors.primary} strokeWidth={2} />
        )}
        <Text style={c.toggleText}>
          {expanded ? 'اخفاء التفاصيل' : 'عرض التفاصيل'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

function statusLabel(status) {
  const map = {
    ASSIGNED: 'مُعيَّن',
    ON_THE_WAY: 'في الطريق',
    STARTED: 'بدأ',
    COMPLETED: 'مكتمل',
    CANCELLED: 'ملغي',
  };
  return map[status] ?? status;
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function OrdersScreen({onOrderPress, onLocationPress}) {
  const [filter, setFilter] = useState('today');
  const [refreshing, setRefreshing] = useState(false);

  const displayList = filter === 'past' ? MOCK_PAST_ORDERS : MOCK_ORDERS;

  // group by date
  const grouped = [];
  const seen = new Set();
  displayList.forEach(o => {
    if (!seen.has(o.scheduledDate)) {
      seen.add(o.scheduledDate);
      grouped.push({label: o.scheduledDate, data: []});
    }
    grouped[grouped.length - 1].data.push(o);
  });

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  return (
    <View style={s.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F7FA" />

      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerTitle}>كل الطلبات</Text>
        <TouchableOpacity style={s.headerBtn} activeOpacity={0.7}>
          <ChevronRight
            size={20}
            color={Colors.textSecondary}
            strokeWidth={2}
          />
        </TouchableOpacity>
      </View>

      {/* Filter chips */}
      <View style={s.filterRow}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f.key}
            style={[s.chip, filter === f.key && s.chipActive]}
            onPress={() => setFilter(f.key)}
            activeOpacity={0.8}>
            <Text style={[s.chipText, filter === f.key && s.chipTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {displayList.length === 0 ? (
        <View style={s.empty}>
          <Text style={s.emptyText}>لا توجد طلبات</Text>
        </View>
      ) : (
        <ScrollView
          style={s.scroll}
          contentContainerStyle={s.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[Colors.primary]}
            />
          }>
          {grouped.map(group => (
            <View key={group.label}>
              {/* Date separator */}
              <Text style={s.dateLabel}>
                {group.label === 'اليوم'
                  ? `الأحد , 15 أبريل , 2025`
                  : group.label}
              </Text>
              {group.data.map(order => (
                <OrderCard
                  key={order._id}
                  order={order}
                  onPress={() => onOrderPress(order)}
                  onLocationPress={() => onLocationPress(order)}
                />
              ))}
            </View>
          ))}
          <View style={{height: 24}} />
        </ScrollView>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: {flex: 1, backgroundColor: '#F5F7FA'},
  header: {
    paddingTop: Platform.OS === 'ios' ? 56 : 48,
    paddingBottom: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F5F7FA',
  },
  headerTitle: {fontSize: 20, fontWeight: '800', color: Colors.textPrimary},
  headerBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {fontSize: 12, fontWeight: '600', color: Colors.textSecondary},
  chipTextActive: {color: '#fff'},
  scroll: {flex: 1},
  scrollContent: {paddingHorizontal: 20, paddingTop: 4},
  dateLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  empty: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  emptyText: {fontSize: 15, color: Colors.textSecondary},
});

const c = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    gap: 12,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  badgeText: {fontSize: 12, fontWeight: '700'},
  timeText: {fontSize: 14, fontWeight: '700', color: Colors.textPrimary},
  grid: {gap: 10},
  gridItem: {flexDirection: 'row', alignItems: 'center', gap: 10},
  gridIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: Colors.primary + '12',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridIconAlt: {backgroundColor: '#EEF2FF'},
  gridIconService: {backgroundColor: '#E0F2FE'},
  gridIconLocation: {backgroundColor: Colors.primary + '12'},
  gridLabel: {fontSize: 10, color: Colors.textSecondary, marginBottom: 1},
  gridValue: {fontSize: 13, fontWeight: '700', color: Colors.textPrimary},
  actionBtn: {
    flex: 1,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 11,
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  actionBtnText: {color: '#fff', fontSize: 15, fontWeight: '700'},
  actionRow: {flexDirection: 'row', gap: 10, alignItems: 'center'},
  locationBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.primary + '40',
    backgroundColor: Colors.primary + '08',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingTop: 2,
  },
  toggleText: {fontSize: 13, fontWeight: '600', color: Colors.primary},
  extraInfo: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  extraRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  extraLabel: {fontSize: 12, color: Colors.textSecondary},
  extraValue: {fontSize: 13, fontWeight: '600', color: Colors.textPrimary},
});
