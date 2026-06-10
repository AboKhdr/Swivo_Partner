import React, {useRef, useEffect, useCallback} from 'react';
import {Animated, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {STATUS_MAP, STATUS_COLORS} from '../../../../shared/constants/status';
import {useTheme} from '../../../../shared/context/ThemeContext';

// Safe string — handles {ar, en} objects from backend
const sc2 = v => (!v ? '' : typeof v === 'string' ? v : v.ar ?? v.en ?? '');

export default function OrderCard({order, index}) {
  const {colors} = useTheme();
  const st = STATUS_MAP[order.status] ?? {label: order.status, color: colors.textSecondary};
  const sc = STATUS_COLORS[order.status] ?? {bg: colors.card, text: colors.textSecondary, dot: colors.textSecondary};

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
      <TouchableOpacity activeOpacity={1} onPressIn={onPressIn} onPressOut={onPressOut}
        style={[s.card, {backgroundColor: colors.card, shadowColor: colors.primary, borderColor: colors.border}]}>
        <View style={s.header}>
          <View style={s.headerLeft}>
            <View style={[s.dot, {backgroundColor: sc.dot}]} />
            <Text style={[s.orderNum, {color: colors.textSecondary}]}>{order.orderNumber}</Text>
          </View>
          <View style={[s.badge, {backgroundColor: sc.bg}]}>
            <View style={[s.dot, {backgroundColor: sc.dot}]} />
            <Text style={[s.badgeText, {color: sc.text}]}>{st.label}</Text>
          </View>
        </View>
        <Text style={[s.carName, {color: colors.textPrimary}]}>{sc2(order.car?.brand) || sc2(order.userCar?.brand?.name)} {sc2(order.car?.model) || sc2(order.userCar?.model?.name)}</Text>
        <Text style={[s.carSub, {color: colors.textSecondary}]}>{sc2(order.car?.color)}{(order.car?.color && order.car?.plateNumber) ? ' · ' : ''}{order.car?.plateNumber ?? order.userCar?.plateNumber ?? ''}</Text>
        <View style={[s.divider, {backgroundColor: colors.border}]} />
        <View style={s.infoRow}>
          <Text style={s.emoji}>📍</Text>
          <Text style={[s.infoText, {color: colors.textSecondary}]} numberOfLines={1}>{order.address}</Text>
        </View>
        <View style={s.infoRow}>
          <Text style={s.emoji}>🕐</Text>
          <Text style={[s.infoText, {color: colors.textSecondary}]}>{order.scheduledAt}</Text>
          <View style={[s.servicePill, {backgroundColor: colors.primary + '18'}]}>
            <Text style={[s.serviceText, {color: colors.primary}]}>{sc2(order.services?.[0]?.name) || sc2(order.service?.name)}</Text>
          </View>
        </View>
        <View style={[s.footer, {borderTopColor: colors.border}]}>
          <Text style={[s.client, {color: colors.textSecondary}]}>👤 {order.client?.name ?? order.client?.firstName ?? ''}</Text>
          <Text style={[s.earning, {color: colors.success}]}>﷼ {order.bikerEarning.toFixed(0)}</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  card: {
    width: 272, borderRadius: 20, padding: 16,
    borderWidth: 1,
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.10, shadowRadius: 16, elevation: 5,
  },
  header: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12},
  headerLeft: {flexDirection: 'row', alignItems: 'center', gap: 6},
  dot: {width: 6, height: 6, borderRadius: 3},
  orderNum: {fontSize: 11, fontWeight: '700', letterSpacing: 0.5},
  badge: {flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20},
  badgeText: {fontSize: 11, fontWeight: '700'},
  carName: {fontSize: 15, fontWeight: '800', marginBottom: 2},
  carSub: {fontSize: 12, marginBottom: 12},
  divider: {height: 1, marginBottom: 10},
  infoRow: {flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6},
  emoji: {fontSize: 12},
  infoText: {fontSize: 12, flex: 1},
  servicePill: {paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6},
  serviceText: {fontSize: 11, fontWeight: '600'},
  footer: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 10, borderTopWidth: 1},
  client: {fontSize: 11},
  earning: {fontSize: 14, fontWeight: '800'},
});
