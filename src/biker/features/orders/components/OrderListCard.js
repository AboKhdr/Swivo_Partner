import React, {useState} from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {MapPin, Car, User, Droplets, ChevronUp, ChevronDown, Sparkles} from 'lucide-react-native';
import {Colors} from '../../../../shared/constants/colors';

function GridItem({Icon, iconBg, iconColor, label, value}) {
  return (
    <View style={g.item}>
      <View style={[g.icon, {backgroundColor: iconBg}]}>
        <Icon size={14} color={iconColor} strokeWidth={2} />
      </View>
      <View style={g.text}>
        <Text style={g.label}>{label}</Text>
        <Text style={g.value} numberOfLines={1}>{value}</Text>
      </View>
    </View>
  );
}


function statusLabel(status) {
  const map = {ASSIGNED: 'مُعيَّن', ON_THE_WAY: 'في الطريق', STARTED: 'بدأ', COMPLETED: 'مكتمل', CANCELLED: 'ملغي'};
  return map[status] ?? status;
}

export default function OrderListCard({order, onPress}) {
  const [expanded, setExpanded] = useState(false);
  const isNew = order.status === 'ASSIGNED';

  return (
    <View style={s.card}>
      {/* Top: badge (left) + service name & time (right) */}
      <View style={s.top}>
        {isNew ? (
          <View style={s.newBadge}>
            <Sparkles size={11} color="#D97706" strokeWidth={2} />
            <Text style={s.newBadgeText}>طلب قادم</Text>
          </View>
        ) : (
          <View style={s.statusBadge}>
            <Text style={s.statusBadgeText}>{statusLabel(order.status)}</Text>
          </View>
        )}
        <View style={s.topRight}>
          <Text style={s.serviceName}>{order.service.name}</Text>
          <Text style={s.time}>{order.scheduledAt}</Text>
        </View>
      </View>

      {expanded && (
        <>
          {/* 2×2 grid */}
          <View style={s.grid}>
            <GridItem
              Icon={User} iconBg="#EFF6FF" iconColor={Colors.primary}
              label="صاحب الطلب"
              value={`${order.client.firstName} ${order.client.lastName}`}
            />
            <GridItem
              Icon={Car} iconBg="#EEF2FF" iconColor="#6366F1"
              label="نوع السيارة"
              value={`${order.car.brand} ${order.car.model} | ${order.car.plateNumber}`}
            />
            <GridItem
              Icon={Droplets} iconBg="#E0F2FE" iconColor="#0EA5E9"
              label="نوع الغسيل"
              value={order.service.name}
            />
            <GridItem
              Icon={MapPin} iconBg="#EFF6FF" iconColor={Colors.primary}
              label="الموقع"
              value={order.address}
            />
          </View>

          {/* Action row */}
          <View style={s.actionRow}>
            <TouchableOpacity style={s.locationBtn} activeOpacity={0.8}>
              <MapPin size={17} color={Colors.primary} strokeWidth={2} />
            </TouchableOpacity>
            <TouchableOpacity style={s.mainBtn} onPress={onPress} activeOpacity={0.88}>
              <Text style={s.mainBtnText}>بدء الغسيل</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* Toggle */}
      <TouchableOpacity style={s.toggle} onPress={() => setExpanded(v => !v)} activeOpacity={0.7}>
        {expanded
          ? <ChevronUp size={14} color={Colors.primary} strokeWidth={2.2} />
          : <ChevronDown size={14} color={Colors.primary} strokeWidth={2.2} />
        }
        <Text style={s.toggleText}>{expanded ? 'اخفاء التفاصيل' : 'عرض التفاصيل'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: '#fff', borderRadius: 20, padding: 16,
    borderWidth: 1, borderColor: Colors.border,
    shadowColor: '#000', shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2, gap: 14,
  },
  top: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  topRight: {alignItems: 'flex-end', gap: 2},
  serviceName: {fontSize: 12, color: Colors.textSecondary, fontWeight: '500'},
  newBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#FEF3C7', paddingHorizontal: 11, paddingVertical: 5, borderRadius: 20,
  },
  newBadgeText: {fontSize: 12, fontWeight: '700', color: '#D97706'},
  statusBadge: {
    backgroundColor: Colors.primary + '15',
    paddingHorizontal: 11, paddingVertical: 5, borderRadius: 20,
  },
  statusBadgeText: {fontSize: 12, fontWeight: '700', color: Colors.primary},
  time: {fontSize: 15, fontWeight: '700', color: Colors.textPrimary, letterSpacing: 0.3},
  grid: {flexDirection: 'row', flexWrap: 'wrap', gap: 12},
  actionRow: {flexDirection: 'row', gap: 10, alignItems: 'center'},
  locationBtn: {
    width: 48, height: 48, borderRadius: 14,
    borderWidth: 1.5, borderColor: Colors.primary + '40',
    backgroundColor: Colors.primary + '08',
    alignItems: 'center', justifyContent: 'center',
  },
  mainBtn: {
    flex: 1, backgroundColor: Colors.primary, borderRadius: 14,
    paddingVertical: 14, alignItems: 'center',
    shadowColor: Colors.primary, shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.28, shadowRadius: 8, elevation: 4,
  },
  mainBtnText: {color: '#fff', fontSize: 15, fontWeight: '700'},
  toggle: {flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5},
  toggleText: {fontSize: 13, fontWeight: '600', color: Colors.primary},
  extra: {
    backgroundColor: '#F8FAFC', borderRadius: 12, padding: 12,
    gap: 8, borderWidth: 1, borderColor: Colors.border,
  },
});

const g = StyleSheet.create({
  item: {flexDirection: 'row', alignItems: 'center', gap: 8, width: '47%'},
  icon: {width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center'},
  text: {flex: 1},
  label: {fontSize: 10, color: Colors.textSecondary, marginBottom: 1},
  value: {fontSize: 13, fontWeight: '700', color: Colors.textPrimary},
});
