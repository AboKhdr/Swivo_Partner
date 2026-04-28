import React, {useRef, useEffect, useCallback} from 'react';
import {Animated, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {Colors} from '../../../shared/constants/colors';
import {STATUS_MAP, STATUS_COLORS} from '../../../shared/constants/status';

export default function OrderCard({order, index}) {
  const st = STATUS_MAP[order.status] ?? {label: order.status, color: Colors.textSecondary};
  const sc = STATUS_COLORS[order.status] ?? {bg: '#F1F5F9', text: '#64748B', dot: '#94A3B8'};

  const scale = useRef(new Animated.Value(0.88)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const pressScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, {toValue: 1, delay: index * 100, useNativeDriver: true, tension: 60, friction: 8}),
      Animated.timing(opacity, {toValue: 1, delay: index * 100, duration: 300, useNativeDriver: true}),
    ]).start();
  }, [index, opacity, scale]);

  const onPressIn = useCallback(() => {
    Animated.spring(pressScale, {toValue: 0.96, useNativeDriver: true, tension: 100, friction: 10}).start();
  }, [pressScale]);

  const onPressOut = useCallback(() => {
    Animated.spring(pressScale, {toValue: 1, useNativeDriver: true, tension: 80, friction: 8}).start();
  }, [pressScale]);

  return (
    <Animated.View style={{transform: [{scale: Animated.multiply(scale, pressScale)}], opacity, marginLeft: 16}}>
      <TouchableOpacity activeOpacity={1} onPressIn={onPressIn} onPressOut={onPressOut} style={s.card}>
        <View style={s.header}>
          <View style={s.headerLeft}>
            <View style={[s.dot, {backgroundColor: sc.dot}]} />
            <Text style={s.orderNum}>{order.orderNumber}</Text>
          </View>
          <View style={[s.badge, {backgroundColor: sc.bg}]}>
            <View style={[s.dot, {backgroundColor: sc.dot}]} />
            <Text style={[s.badgeText, {color: sc.text}]}>{st.label}</Text>
          </View>
        </View>
        <Text style={s.carName}>{order.car.brand} {order.car.model}</Text>
        <Text style={s.carSub}>{order.car.color} · {order.car.plateNumber}</Text>
        <View style={s.divider} />
        <View style={s.infoRow}>
          <Text style={s.emoji}>📍</Text>
          <Text style={s.infoText} numberOfLines={1}>{order.address}</Text>
        </View>
        <View style={s.infoRow}>
          <Text style={s.emoji}>🕐</Text>
          <Text style={s.infoText}>{order.scheduledAt}</Text>
          <View style={s.servicePill}>
            <Text style={s.serviceText}>{order.service.name}</Text>
          </View>
        </View>
        <View style={s.footer}>
          <Text style={s.client}>👤 {order.client.firstName}</Text>
          <Text style={s.earning}>﷼ {order.bikerEarning.toFixed(0)}</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  card: {
    width: 272, backgroundColor: Colors.card, borderRadius: 20, padding: 16,
    borderWidth: 1, borderColor: '#F1F5F9',
    shadowColor: Colors.primary, shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.10, shadowRadius: 16, elevation: 5,
  },
  header: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12},
  headerLeft: {flexDirection: 'row', alignItems: 'center', gap: 6},
  dot: {width: 6, height: 6, borderRadius: 3},
  orderNum: {fontSize: 11, fontWeight: '700', color: '#94A3B8', letterSpacing: 0.5},
  badge: {flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20},
  badgeText: {fontSize: 11, fontWeight: '700'},
  carName: {fontSize: 15, fontWeight: '800', color: '#1E293B', marginBottom: 2},
  carSub: {fontSize: 12, color: '#94A3B8', marginBottom: 12},
  divider: {height: 1, backgroundColor: '#F1F5F9', marginBottom: 10},
  infoRow: {flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6},
  emoji: {fontSize: 12},
  infoText: {fontSize: 12, color: '#64748B', flex: 1},
  servicePill: {backgroundColor: '#EFF6FF', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6},
  serviceText: {fontSize: 11, fontWeight: '600', color: '#2563EB'},
  footer: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F1F5F9'},
  client: {fontSize: 11, color: '#94A3B8'},
  earning: {fontSize: 14, fontWeight: '800', color: '#059669'},
});
