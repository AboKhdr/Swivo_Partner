import React, {useCallback, useState} from 'react';
import {FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {useTheme} from '../../../shared/context/ThemeContext';

const FILTERS = [
  {key: 'all',             label: 'الكل'},
  {key: 'PENDING_PARTNER', label: 'معلق'},
  {key: 'ACCEPTED',        label: 'مقبول'},
  {key: 'ASSIGNED',        label: 'معيّن'},
  {key: 'ON_THE_WAY',      label: 'في الطريق'},
  {key: 'STARTED',         label: 'جاري'},
  {key: 'COMPLETED',       label: 'مكتمل'},
];

const STATUS_META = {
  PENDING_PARTNER: {label: 'بانتظار القبول', color: '#F59E0B'},
  ACCEPTED:        {label: 'مقبول',          color: '#3B9EFF'},
  ASSIGNED:        {label: 'تم التعيين',     color: '#8B5CF6'},
  ON_THE_WAY:      {label: 'في الطريق',      color: '#1B7BF5'},
  STARTED:         {label: 'جاري التنفيذ',   color: '#F59E0B'},
  COMPLETED:       {label: 'مكتمل',          color: '#22C55E'},
  REJECTED:        {label: 'مرفوض',          color: '#EF4444'},
  CANCELLED:       {label: 'ملغي',           color: '#EF4444'},
};

const MOCK_ORDERS = [
  {id: '1', customerName: 'أحمد محمد',    service: 'غسيل خارجي',  status: 'PENDING_PARTNER', time: '10:30', price: '80', biker: null},
  {id: '2', customerName: 'سارة العمري',  service: 'غسيل كامل',   status: 'ON_THE_WAY',      time: '10:15', price: '150', biker: 'محمد علي'},
  {id: '3', customerName: 'خالد الغامدي', service: 'تلميع',        status: 'COMPLETED',       time: '09:00', price: '200', biker: 'أنس كريم'},
  {id: '4', customerName: 'منى السعيد',   service: 'غسيل داخلي',  status: 'STARTED',         time: '10:00', price: '120', biker: 'محمد علي'},
  {id: '5', customerName: 'فيصل الحربي',  service: 'غسيل خارجي',  status: 'ASSIGNED',        time: '09:45', price: '80',  biker: 'أنس كريم'},
  {id: '6', customerName: 'ريم الدوسري',  service: 'غسيل كامل',   status: 'ACCEPTED',        time: '09:30', price: '150', biker: null},
];

function OrderCard({item, colors, onPress}) {
  const meta = STATUS_META[item.status] || {label: item.status, color: '#64748B'};
  return (
    <TouchableOpacity
      style={[s.card, {backgroundColor: colors.card, borderColor: colors.border}]}
      onPress={() => onPress(item)}
      activeOpacity={0.75}>
      <View style={s.cardHeader}>
        <Text style={[s.customerName, {color: colors.textPrimary}]}>{item.customerName}</Text>
        <View style={[s.badge, {backgroundColor: meta.color + '18'}]}>
          <Text style={[s.badgeText, {color: meta.color}]}>{meta.label}</Text>
        </View>
      </View>
      <View style={s.cardBody}>
        <Text style={[s.service, {color: colors.textSecondary}]}>{item.service}</Text>
        <Text style={[s.price, {color: colors.primary}]}>{item.price} ر.س</Text>
      </View>
      <View style={[s.cardFooter, {borderTopColor: colors.border}]}>
        <Text style={[s.footerText, {color: colors.textSecondary}]}>{item.time}</Text>
        {item.biker
          ? <Text style={[s.footerText, {color: colors.textSecondary}]}>البايكر: {item.biker}</Text>
          : <Text style={[s.footerText, {color: colors.warning}]}>بدون بايكر</Text>
        }
      </View>
    </TouchableOpacity>
  );
}

export default function OrdersScreen({onSelectOrder}) {
  const {colors} = useTheme();
  const [activeFilter, setActiveFilter] = useState('all');
  const [refreshing, setRefreshing]     = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const filtered = activeFilter === 'all'
    ? MOCK_ORDERS
    : MOCK_ORDERS.filter(o => o.status === activeFilter);

  const renderItem = useCallback(({item}) => (
    <OrderCard item={item} colors={colors} onPress={onSelectOrder || (() => {})} />
  ), [colors, onSelectOrder]);

  const keyExtractor = useCallback(item => item.id, []);

  return (
    <View style={[s.root, {backgroundColor: colors.bg}]}>
      <View style={[s.header, {backgroundColor: colors.card, borderBottomColor: colors.border}]}>
        <Text style={[s.headerTitle, {color: colors.textPrimary}]}>الطلبات</Text>
      </View>

      <FlatList
        data={filtered}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={s.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
        ListHeaderComponent={
          <FlatList
            data={FILTERS}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={f => f.key}
            contentContainerStyle={s.filters}
            renderItem={({item: f}) => (
              <TouchableOpacity
                style={[s.filterChip, {backgroundColor: activeFilter === f.key ? colors.primary : colors.card, borderColor: activeFilter === f.key ? colors.primary : colors.border}]}
                onPress={() => setActiveFilter(f.key)}
                activeOpacity={0.75}>
                <Text style={[s.filterText, {color: activeFilter === f.key ? '#FFF' : colors.textSecondary}]}>{f.label}</Text>
              </TouchableOpacity>
            )}
          />
        }
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={[s.emptyText, {color: colors.textSecondary}]}>لا توجد طلبات</Text>
          </View>
        }
      />
    </View>
  );
}

const s = StyleSheet.create({
  root:         {flex: 1},
  header:       {paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16, borderBottomWidth: 1},
  headerTitle:  {fontSize: 22, fontWeight: '800'},
  list:         {paddingHorizontal: 16, paddingBottom: 24},
  filters:      {paddingVertical: 14, gap: 8},
  filterChip:   {paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1},
  filterText:   {fontSize: 13, fontWeight: '600'},
  card:         {borderRadius: 16, borderWidth: 1, marginBottom: 12, overflow: 'hidden'},
  cardHeader:   {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, paddingBottom: 8},
  customerName: {fontSize: 15, fontWeight: '700'},
  badge:        {paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10},
  badgeText:    {fontSize: 11, fontWeight: '700'},
  cardBody:     {flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 14, paddingBottom: 10},
  service:      {fontSize: 13, fontWeight: '400'},
  price:        {fontSize: 14, fontWeight: '700'},
  cardFooter:   {flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 10, borderTopWidth: 1},
  footerText:   {fontSize: 12},
  empty:        {alignItems: 'center', paddingTop: 60},
  emptyText:    {fontSize: 14},
});
