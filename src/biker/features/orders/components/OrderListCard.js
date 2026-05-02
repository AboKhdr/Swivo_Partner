import React, {useState} from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {MapPin, Car, User, Droplets, ChevronUp, ChevronDown, Sparkles} from 'lucide-react-native';
import {useTheme} from '../../../../shared/context/ThemeContext';
import {useI18n} from '../../../../shared/i18n/I18nContext';

function GridItem({Icon, iconBg, iconColor, label, value, colors}) {
  return (
    <View style={g.item}>
      <View style={[g.icon, {backgroundColor: iconBg}]}>
        <Icon size={14} color={iconColor} strokeWidth={2} />
      </View>
      <View style={g.text}>
        <Text style={[g.label, {color: colors.textSecondary}]}>{label}</Text>
        <Text style={[g.value, {color: colors.textPrimary}]} numberOfLines={1}>{value}</Text>
      </View>
    </View>
  );
}

export default function OrderListCard({order, onPress}) {
  const {colors} = useTheme();
  const {t} = useI18n();
  const [expanded, setExpanded] = useState(false);
  const isNew = order.status === 'ASSIGNED';

  return (
    <View style={[s.card, {backgroundColor: colors.card, borderColor: colors.border}]}>
      <View style={s.top}>
        {isNew ? (
          <View style={s.newBadge}>
            <Sparkles size={11} color="#D97706" strokeWidth={2} />
            <Text style={s.newBadgeText}>{t('orders.card.incoming')}</Text>
          </View>
        ) : (
          <View style={[s.statusBadge, {backgroundColor: colors.primary + '15'}]}>
            <Text style={[s.statusBadgeText, {color: colors.primary}]}>{t(`orders.status.${order.status}`)}</Text>
          </View>
        )}
        <View style={s.topRight}>
          <Text style={[s.serviceName, {color: colors.textSecondary}]}>{order.service.name}</Text>
          <Text style={[s.time, {color: colors.textPrimary}]}>{order.scheduledAt}</Text>
        </View>
      </View>

      {expanded && (
        <>
          <View style={s.grid}>
            <GridItem Icon={User} iconBg="#EFF6FF" iconColor={colors.primary} label={t('orders.fields.owner')} value={`${order.client.firstName} ${order.client.lastName}`} colors={colors} />
            <GridItem Icon={Car} iconBg="#EEF2FF" iconColor="#6366F1" label={t('orders.fields.carType')} value={`${order.car.brand} ${order.car.model} | ${order.car.plateNumber}`} colors={colors} />
            <GridItem Icon={Droplets} iconBg="#E0F2FE" iconColor="#0EA5E9" label={t('orders.fields.washType')} value={order.service.name} colors={colors} />
            <GridItem Icon={MapPin} iconBg="#EFF6FF" iconColor={colors.primary} label={t('orders.fields.location')} value={order.address} colors={colors} />
          </View>

          <View style={s.actionRow}>
            <TouchableOpacity style={[s.locationBtn, {borderColor: colors.primary + '40', backgroundColor: colors.primary + '08'}]} activeOpacity={0.8}>
              <MapPin size={17} color={colors.primary} strokeWidth={2} />
            </TouchableOpacity>
            <TouchableOpacity style={[s.mainBtn, {backgroundColor: colors.primary, shadowColor: colors.primary}]} onPress={onPress} activeOpacity={0.88}>
              <Text style={s.mainBtnText}>{t('orders.card.startWash')}</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      <TouchableOpacity style={s.toggle} onPress={() => setExpanded(v => !v)} activeOpacity={0.7}>
        {expanded
          ? <ChevronUp size={14} color={colors.primary} strokeWidth={2.2} />
          : <ChevronDown size={14} color={colors.primary} strokeWidth={2.2} />
        }
        <Text style={[s.toggleText, {color: colors.primary}]}>{expanded ? t('orders.card.hideDetails') : t('orders.card.showDetails')}</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  card: {borderRadius: 20, padding: 16, borderWidth: 1, shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2, gap: 14},
  top: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  topRight: {alignItems: 'flex-end', gap: 2},
  serviceName: {fontSize: 12, fontWeight: '500'},
  newBadge: {flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#FEF3C7', paddingHorizontal: 11, paddingVertical: 5, borderRadius: 20},
  newBadgeText: {fontSize: 12, fontWeight: '700', color: '#D97706'},
  statusBadge: {paddingHorizontal: 11, paddingVertical: 5, borderRadius: 20},
  statusBadgeText: {fontSize: 12, fontWeight: '700'},
  time: {fontSize: 15, fontWeight: '700', letterSpacing: 0.3},
  grid: {flexDirection: 'row', flexWrap: 'wrap', gap: 12},
  actionRow: {flexDirection: 'row', gap: 10, alignItems: 'center'},
  locationBtn: {width: 48, height: 48, borderRadius: 14, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center'},
  mainBtn: {flex: 1, borderRadius: 14, paddingVertical: 14, alignItems: 'center', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.28, shadowRadius: 8, elevation: 4},
  mainBtnText: {color: '#fff', fontSize: 15, fontWeight: '700'},
  toggle: {flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5},
  toggleText: {fontSize: 13, fontWeight: '600'},
});

const g = StyleSheet.create({
  item: {flexDirection: 'row', alignItems: 'center', gap: 8, width: '47%'},
  icon: {width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center'},
  text: {flex: 1},
  label: {fontSize: 10, marginBottom: 1},
  value: {fontSize: 13, fontWeight: '700'},
});
