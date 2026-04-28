import React from 'react';
import {Platform, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {ChevronLeft, MapPin} from 'lucide-react-native';
import {Colors} from '../../../shared/constants/colors';
import MapContainer from '../../../shared/components/MapContainer';

export default function OrderMapScreen({order, onBack}) {
  const center =
    order?.location?.lat && order?.location?.lng
      ? {lat: order.location.lat, lng: order.location.lng}
      : {lat: 24.7136, lng: 46.6753};

  return (
    <View style={s.root}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity
          style={s.backBtn}
          onPress={onBack}
          hitSlop={{top: 12, bottom: 12, left: 12, right: 12}}
          activeOpacity={0.7}>
          <ChevronLeft size={22} color={Colors.textPrimary} strokeWidth={2.5} />
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={s.headerTitle}>موقع الطلب</Text>
          <Text style={s.headerSub} numberOfLines={1}>
            {order.address}
          </Text>
        </View>
        <View style={s.headerIcon}>
          <MapPin size={18} color={Colors.primary} strokeWidth={2} />
        </View>
      </View>

      {/* Info strip */}
      <View style={s.strip}>
        <View style={s.stripItem}>
          <Text style={s.stripLabel}>العميل</Text>
          <Text style={s.stripValue}>
            {order.client.firstName} {order.client.lastName}
          </Text>
        </View>
        <View style={s.stripDivider} />
        <View style={s.stripItem}>
          <Text style={s.stripLabel}>الخدمة</Text>
          <Text style={s.stripValue}>{order.service.name}</Text>
        </View>
        <View style={s.stripDivider} />
        <View style={s.stripItem}>
          <Text style={s.stripLabel}>الوقت</Text>
          <Text style={s.stripValue}>{order.scheduledAt}</Text>
        </View>
      </View>

      {/* Map */}
      <View style={s.mapWrap}>
        <MapContainer
          initialCenter={center}
          zoom={15}
          height={undefined}
        />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: {flex: 1, backgroundColor: '#F5F7FA'},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 56 : 48,
    paddingBottom: 14,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 10,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F5F7FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {flex: 1},
  headerTitle: {fontSize: 16, fontWeight: '700', color: Colors.textPrimary},
  headerSub: {fontSize: 12, color: Colors.textSecondary, marginTop: 1},
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.primary + '12',
    alignItems: 'center',
    justifyContent: 'center',
  },
  strip: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    alignItems: 'center',
  },
  stripItem: {flex: 1, alignItems: 'center'},
  stripLabel: {fontSize: 10, color: Colors.textSecondary, marginBottom: 2},
  stripValue: {fontSize: 13, fontWeight: '700', color: Colors.textPrimary},
  stripDivider: {width: 1, height: 32, backgroundColor: Colors.border},
  mapWrap: {flex: 1, padding: 12},
});
