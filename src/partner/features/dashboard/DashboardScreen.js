import React, {useState, useCallback} from 'react';
import {FlatList, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {ClipboardList, Clock, CheckCircle, Users, ChevronLeft} from 'lucide-react-native';
import {useTheme} from '../../../shared/context/ThemeContext';
import {useI18n} from '../../../shared/i18n/I18nContext';
import IncomingOrderScreen from '../orders/IncomingOrderScreen';

const MOCK_STATS = {
  todayOrders:    12,
  pendingOrders:   3,
  completedToday:  8,
  bikersOnDuty:    4,
};

const MOCK_RECENT = [
  {id: '1', customerName: 'أحمد محمد',    service: 'غسيل خارجي',   status: 'PENDING_PARTNER', time: 'منذ دقيقتين'},
  {id: '2', customerName: 'سارة العمري',  service: 'غسيل كامل',    status: 'ON_THE_WAY',      time: 'منذ 15 دقيقة'},
  {id: '3', customerName: 'خالد الغامدي', service: 'تلميع',         status: 'COMPLETED',       time: 'منذ ساعة'},
  {id: '4', customerName: 'منى السعيد',   service: 'غسيل داخلي',   status: 'STARTED',         time: 'منذ 30 دقيقة'},
  {id: '5', customerName: 'فيصل الحربي',  service: 'غسيل خارجي',   status: 'ASSIGNED',        time: 'منذ 45 دقيقة'},
];

const STATUS_LABELS = {
  PENDING_PARTNER: {label: 'بانتظار القبول', color: '#F59E0B'},
  ACCEPTED:        {label: 'مقبول',          color: '#3B9EFF'},
  ASSIGNED:        {label: 'تم التعيين',     color: '#8B5CF6'},
  ON_THE_WAY:      {label: 'في الطريق',      color: '#1B7BF5'},
  STARTED:         {label: 'جاري التنفيذ',   color: '#F59E0B'},
  COMPLETED:       {label: 'مكتمل',          color: '#22C55E'},
  REJECTED:        {label: 'مرفوض',          color: '#EF4444'},
  CANCELLED:       {label: 'ملغي',           color: '#EF4444'},
};

function StatCard({icon: Icon, label, value, color, colors}) {
  return (
    <View style={[s.statCard, {backgroundColor: colors.card, borderColor: colors.border}]}>
      <View style={[s.statIcon, {backgroundColor: color + '18'}]}>
        <Icon size={20} color={color} />
      </View>
      <Text style={[s.statValue, {color: colors.textPrimary}]}>{value}</Text>
      <Text style={[s.statLabel, {color: colors.textSecondary}]}>{label}</Text>
    </View>
  );
}

function RecentOrderCard({item, colors, onPress}) {
  const st = STATUS_LABELS[item.status] || {label: item.status, color: '#64748B'};
  return (
    <TouchableOpacity
      style={[s.orderCard, {backgroundColor: colors.card, borderColor: colors.border}]}
      onPress={() => onPress(item)}
      activeOpacity={0.75}>
      <View style={s.orderCardRow}>
        <View style={s.orderCardInfo}>
          <Text style={[s.orderCustomer, {color: colors.textPrimary}]}>{item.customerName}</Text>
          <Text style={[s.orderService, {color: colors.textSecondary}]}>{item.service}</Text>
        </View>
        <View style={s.orderCardRight}>
          <View style={[s.statusBadge, {backgroundColor: st.color + '18'}]}>
            <Text style={[s.statusText, {color: st.color}]}>{st.label}</Text>
          </View>
          <Text style={[s.orderTime, {color: colors.textSecondary}]}>{item.time}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function DashboardScreen() {
  const {colors} = useTheme();
  const {t} = useI18n();
  const [refreshing, setRefreshing] = useState(false);
  const [incomingOrder, setIncomingOrder] = useState(null);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1200);
  }, []);

  const handleOrderPress = useCallback((order) => {
    if (order.status === 'PENDING_PARTNER') {
      setIncomingOrder(order);
    }
  }, []);

  const handleAccept = useCallback(() => {
    setIncomingOrder(null);
  }, []);

  const handleReject = useCallback(() => {
    setIncomingOrder(null);
  }, []);

  if (incomingOrder) {
    return (
      <IncomingOrderScreen
        order={incomingOrder}
        onAccept={handleAccept}
        onReject={handleReject}
      />
    );
  }

  return (
    <View style={[s.root, {backgroundColor: colors.bg}]}>
      <View style={[s.header, {backgroundColor: colors.card, borderBottomColor: colors.border}]}>
        <Text style={[s.headerTitle, {color: colors.textPrimary}]}>لوحة التحكم</Text>
        <View style={[s.pendingBadge, {backgroundColor: colors.danger + '18'}]}>
          <Text style={[s.pendingBadgeText, {color: colors.danger}]}>
            {MOCK_STATS.pendingOrders} معلق
          </Text>
        </View>
      </View>

      <ScrollView
        style={s.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}>

        <View style={s.statsGrid}>
          <StatCard icon={ClipboardList} label="طلبات اليوم"    value={MOCK_STATS.todayOrders}    color={colors.primary}  colors={colors} />
          <StatCard icon={Clock}         label="بانتظار القرار" value={MOCK_STATS.pendingOrders}  color={colors.warning}  colors={colors} />
          <StatCard icon={CheckCircle}   label="مكتملة اليوم"  value={MOCK_STATS.completedToday} color={colors.success}  colors={colors} />
          <StatCard icon={Users}         label="بايكر نشط"      value={MOCK_STATS.bikersOnDuty}   color={colors.purple}   colors={colors} />
        </View>

        <View style={s.section}>
          <Text style={[s.sectionTitle, {color: colors.textPrimary}]}>آخر الطلبات</Text>
          {MOCK_RECENT.map(item => (
            <RecentOrderCard
              key={item.id}
              item={item}
              colors={colors}
              onPress={handleOrderPress}
            />
          ))}
        </View>

        <View style={s.bottomPad} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root:             {flex: 1},
  header:           {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16, borderBottomWidth: 1},
  headerTitle:      {fontSize: 22, fontWeight: '800'},
  pendingBadge:     {paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12},
  pendingBadgeText: {fontSize: 12, fontWeight: '700'},
  scroll:           {flex: 1},
  statsGrid:        {flexDirection: 'row', flexWrap: 'wrap', padding: 16, gap: 12},
  statCard:         {width: '47%', borderRadius: 16, padding: 16, borderWidth: 1, gap: 8},
  statIcon:         {width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center'},
  statValue:        {fontSize: 28, fontWeight: '800'},
  statLabel:        {fontSize: 12, fontWeight: '500'},
  section:          {paddingHorizontal: 16, paddingTop: 8},
  sectionTitle:     {fontSize: 16, fontWeight: '700', marginBottom: 12},
  orderCard:        {borderRadius: 14, padding: 14, borderWidth: 1, marginBottom: 10},
  orderCardRow:     {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'},
  orderCardInfo:    {gap: 4, flex: 1},
  orderCustomer:    {fontSize: 14, fontWeight: '700'},
  orderService:     {fontSize: 12, fontWeight: '400'},
  orderCardRight:   {alignItems: 'flex-end', gap: 4},
  statusBadge:      {paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8},
  statusText:       {fontSize: 11, fontWeight: '700'},
  orderTime:        {fontSize: 11},
  bottomPad:        {height: 24},
});
