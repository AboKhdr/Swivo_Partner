import React from 'react';
import {Platform, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {ChevronLeft, MapPin} from 'lucide-react-native';
import {useTheme} from '../../../shared/context/ThemeContext';
import {useI18n} from '../../../shared/i18n/I18nContext';
import MapContainer from '../../../shared/components/MapContainer';

export default function OrderMapScreen({order, onBack}) {
  const {colors} = useTheme();
  const {t} = useI18n();

  const center =
    order?.location?.lat && order?.location?.lng
      ? {lat: order.location.lat, lng: order.location.lng}
      : {lat: 24.7136, lng: 46.6753};

  return (
    <View style={[s.root, {backgroundColor: colors.bg}]}>
      {/* Header */}
      <View style={[s.header, {backgroundColor: colors.card, borderBottomColor: colors.border}]}>
        <TouchableOpacity
          style={[s.backBtn, {backgroundColor: colors.bg}]}
          onPress={onBack}
          hitSlop={{top: 12, bottom: 12, left: 12, right: 12}}
          activeOpacity={0.7}>
          <ChevronLeft size={22} color={colors.textPrimary} strokeWidth={2.5} />
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={[s.headerTitle, {color: colors.textPrimary}]}>{t('orderMap.title')}</Text>
          <Text style={[s.headerSub, {color: colors.textSecondary}]} numberOfLines={1}>
            {order.address}
          </Text>
        </View>
        <View style={[s.headerIcon, {backgroundColor: colors.primary + '12'}]}>
          <MapPin size={18} color={colors.primary} strokeWidth={2} />
        </View>
      </View>

      {/* Info strip */}
      <View style={[s.strip, {backgroundColor: colors.card, borderBottomColor: colors.border}]}>
        <View style={s.stripItem}>
          <Text style={[s.stripLabel, {color: colors.textSecondary}]}>{t('orderMap.customer')}</Text>
          <Text style={[s.stripValue, {color: colors.textPrimary}]}>
            {order.client.firstName} {order.client.lastName}
          </Text>
        </View>
        <View style={[s.stripDivider, {backgroundColor: colors.border}]} />
        <View style={s.stripItem}>
          <Text style={[s.stripLabel, {color: colors.textSecondary}]}>{t('orderMap.service')}</Text>
          <Text style={[s.stripValue, {color: colors.textPrimary}]}>{order.service.name}</Text>
        </View>
        <View style={[s.stripDivider, {backgroundColor: colors.border}]} />
        <View style={s.stripItem}>
          <Text style={[s.stripLabel, {color: colors.textSecondary}]}>{t('orderMap.time')}</Text>
          <Text style={[s.stripValue, {color: colors.textPrimary}]}>{order.scheduledAt}</Text>
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
  root: {flex: 1},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 56 : 48,
    paddingBottom: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    gap: 10,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {flex: 1},
  headerTitle: {fontSize: 16, fontWeight: '700'},
  headerSub: {fontSize: 12, marginTop: 1},
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  strip: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  stripItem: {flex: 1, alignItems: 'center'},
  stripLabel: {fontSize: 10, marginBottom: 2},
  stripValue: {fontSize: 13, fontWeight: '700'},
  stripDivider: {width: 1, height: 32},
  mapWrap: {flex: 1, padding: 12},
});
