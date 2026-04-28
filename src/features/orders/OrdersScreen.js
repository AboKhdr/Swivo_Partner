import React, {useState} from 'react';
import {Platform, RefreshControl, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {Colors} from '../../shared/constants/colors';
import {MOCK_ORDERS, MOCK_PAST_ORDERS} from '../../shared/data/mockData';
import OrderListCard from './components/OrderListCard';
import OrderDetailsScreen from './OrderDetailsScreen';

export default function OrdersScreen() {
  const [subScreen, setSubScreen] = useState('list');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [filter, setFilter] = useState('active');
  const [refreshing, setRefreshing] = useState(false);

  const displayList = filter === 'active' ? MOCK_ORDERS : MOCK_PAST_ORDERS;

  const grouped = [];
  const seenDates = new Set();
  displayList.forEach(o => {
    if (!seenDates.has(o.scheduledDate)) {
      seenDates.add(o.scheduledDate);
      grouped.push({label: o.scheduledDate, data: []});
    }
    grouped[grouped.length - 1].data.push(o);
  });

  const onRefresh = () => {
    setRefreshing(true);
    // TODO: GET /api/biker/order?status=active&page=1&limit=20
    setTimeout(() => setRefreshing(false), 1000);
  };

  if (subScreen === 'details' && selectedOrder) {
    return <OrderDetailsScreen order={selectedOrder} onBack={() => { setSubScreen('list'); setSelectedOrder(null); }} />;
  }

  return (
    <View style={s.root}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.card} />
      <View style={s.header}>
        <Text style={s.headerTitle}>طلباتي</Text>
        <View style={[s.headerBadge, {backgroundColor: filter === 'active' ? Colors.primary : Colors.success}]}>
          <Text style={s.headerBadgeText}>{filter === 'active' ? MOCK_ORDERS.length : MOCK_PAST_ORDERS.length}</Text>
        </View>
      </View>

      <View style={s.segWrap}>
        <TouchableOpacity style={[s.seg, filter === 'active' && s.segActive]} onPress={() => setFilter('active')}>
          <Text style={[s.segText, filter === 'active' && s.segTextActive]}>نشطة ✓</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.seg, filter === 'past' && s.segActive]} onPress={() => setFilter('past')}>
          <Text style={[s.segText, filter === 'past' && s.segTextActive]}>السابقة</Text>
        </TouchableOpacity>
      </View>

      {displayList.length === 0 ? (
        <View style={s.empty}>
          <Text style={s.emptyIcon}>📭</Text>
          <Text style={s.emptyText}>لا توجد طلبات هنا</Text>
        </View>
      ) : (
        <ScrollView
          style={s.scroll}
          contentContainerStyle={s.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}>
          {grouped.map(group => (
            <View key={group.label}>
              <View style={s.sectionHeader}>
                <View style={s.sectionLine} />
                <Text style={s.sectionLabel}>{group.label}</Text>
                <View style={s.sectionLine} />
              </View>
              {group.data.map(order => (
                <OrderListCard key={order._id} order={order} onPress={() => { setSelectedOrder(order); setSubScreen('details'); }} />
              ))}
            </View>
          ))}
          <View style={{height: 16}} />
        </ScrollView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: {flex: 1, backgroundColor: Colors.bg},
  header: {paddingTop: Platform.OS === 'ios' ? 56 : 48, paddingBottom: 16, paddingHorizontal: 24, backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10},
  headerTitle: {fontSize: 20, fontWeight: '800', color: Colors.textPrimary},
  headerBadge: {paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12},
  headerBadgeText: {color: '#fff', fontSize: 13, fontWeight: '700'},
  segWrap: {flexDirection: 'row', margin: 16, backgroundColor: Colors.border, borderRadius: 14, padding: 4},
  seg: {flex: 1, paddingVertical: 11, borderRadius: 11, alignItems: 'center'},
  segActive: {backgroundColor: Colors.card, shadowColor: '#000', shadowOffset: {width: 0, height: 1}, shadowOpacity: 0.08, elevation: 2},
  segText: {fontSize: 14, fontWeight: '600', color: Colors.textSecondary},
  segTextActive: {color: Colors.primary, fontWeight: '800'},
  scroll: {flex: 1},
  scrollContent: {paddingHorizontal: 16, paddingTop: 12, gap: 16},
  sectionHeader: {flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 12},
  sectionLine: {flex: 1, height: 1, backgroundColor: Colors.border},
  sectionLabel: {fontSize: 12, fontWeight: '700', color: Colors.textSecondary},
  empty: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  emptyIcon: {fontSize: 56, marginBottom: 12},
  emptyText: {fontSize: 15, color: Colors.textSecondary},
});
