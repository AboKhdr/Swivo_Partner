import React from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {Colors} from '../../../shared/constants/colors';
import {STATUS_MAP} from '../../../shared/constants/status';

export default function OrderListCard({order, onPress}) {
  const st = STATUS_MAP[order.status] ?? {label: order.status, color: Colors.textSecondary};
  return (
    <TouchableOpacity style={s.card} onPress={onPress} activeOpacity={0.85}>
      <View style={s.cardHeader}>
        <Text style={s.orderNum}>#{order.orderNumber}</Text>
        <View style={[s.badge, {backgroundColor: st.color + '22'}]}>
          <Text style={[s.badgeText, {color: st.color}]}>{st.label}</Text>
        </View>
      </View>
      <View style={s.divider} />
      <View style={s.row}><Text style={s.emoji}>🚗</Text><Text style={s.carText}>{order.car.brand} {order.car.model} — {order.car.color}</Text></View>
      <View style={s.row}><Text style={s.emoji}>👤</Text><Text style={s.metaText}>العميل: {order.client.firstName} {order.client.lastName}</Text></View>
      <View style={s.row}><Text style={s.emoji}>📍</Text><Text style={s.metaText}>{order.address}</Text></View>
      <View style={s.row}><Text style={s.emoji}>🕐</Text><Text style={s.metaText}>{order.scheduledDate}، {order.scheduledAt}</Text></View>
      <View style={s.row}><Text style={s.emoji}>💰</Text><Text style={s.earningText}>أرباحك: ﷼ {order.bikerEarning.toFixed(2)}</Text></View>
      <View style={s.divider} />
      <TouchableOpacity style={s.detailsBtn} onPress={onPress}>
        <Text style={s.detailsBtnText}>عرض التفاصيل</Text>
        <Text style={s.detailsArrow}>→</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  card: {backgroundColor: Colors.card, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: Colors.border, shadowColor: '#000', shadowOffset: {width: 0, height: 3}, shadowOpacity: 0.07, shadowRadius: 10, elevation: 3},
  cardHeader: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10},
  orderNum: {fontSize: 14, fontWeight: '800', color: Colors.textPrimary},
  badge: {paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20},
  badgeText: {fontSize: 11, fontWeight: '700'},
  divider: {height: 1, backgroundColor: Colors.border, marginVertical: 10},
  row: {flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6},
  emoji: {fontSize: 14},
  carText: {fontSize: 14, fontWeight: '600', color: Colors.textPrimary, flex: 1},
  metaText: {fontSize: 13, color: Colors.textSecondary, flex: 1},
  earningText: {fontSize: 13, fontWeight: '700', color: Colors.success, flex: 1},
  detailsBtn: {flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingTop: 2},
  detailsBtnText: {fontSize: 14, fontWeight: '700', color: Colors.primary},
  detailsArrow: {fontSize: 14, color: Colors.primary},
});
