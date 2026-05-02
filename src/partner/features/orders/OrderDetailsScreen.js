import React, {useCallback, useState} from 'react';
import {ScrollView, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {ArrowRight, Phone, MapPin, Car, User, Clock, Image, UserCheck} from 'lucide-react-native';
import {useTheme} from '../../../shared/context/ThemeContext';
import AssignBikerScreen from './AssignBikerScreen';

const STATUS_META = {
  PENDING_PARTNER: {label: 'بانتظار القبول', color: '#F59E0B'},
  ACCEPTED:        {label: 'مقبول',          color: '#3B9EFF'},
  ASSIGNED:        {label: 'تم التعيين',     color: '#8B5CF6'},
  ON_THE_WAY:      {label: 'في الطريق',      color: '#1B7BF5'},
  STARTED:         {label: 'جاري التنفيذ',   color: '#F59E0B'},
  COMPLETED:       {label: 'مكتمل',          color: '#22C55E'},
};

const MOCK_TIMELINE = [
  {status: 'ACCEPTED',   label: 'تم قبول الطلب',         time: '10:05'},
  {status: 'ASSIGNED',   label: 'تم تعيين البايكر',       time: '10:10'},
  {status: 'ON_THE_WAY', label: 'البايكر في الطريق',      time: '10:15'},
];

function InfoRow({icon: Icon, label, value, color, colors}) {
  return (
    <View style={s.infoRow}>
      <View style={[s.infoIcon, {backgroundColor: (color || colors.primary) + '18'}]}>
        <Icon size={16} color={color || colors.primary} />
      </View>
      <View style={s.infoText}>
        <Text style={[s.infoLabel, {color: colors.textSecondary}]}>{label}</Text>
        <Text style={[s.infoValue, {color: colors.textPrimary}]}>{value}</Text>
      </View>
    </View>
  );
}

export default function OrderDetailsScreen({order, onBack}) {
  const {colors} = useTheme();
  const [showAssign, setShowAssign] = useState(false);

  const meta = STATUS_META[order?.status] || {label: order?.status, color: '#64748B'};
  const canAssign = order?.status === 'ACCEPTED' && !order?.biker;

  const handleAssigned = useCallback(() => {
    setShowAssign(false);
  }, []);

  if (showAssign) {
    return (
      <AssignBikerScreen
        order={order}
        onBack={() => setShowAssign(false)}
        onAssigned={handleAssigned}
      />
    );
  }

  return (
    <View style={[s.root, {backgroundColor: colors.bg}]}>
      <View style={[s.header, {backgroundColor: colors.card, borderBottomColor: colors.border}]}>
        <TouchableOpacity onPress={onBack} style={s.backBtn}>
          <ArrowRight size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, {color: colors.textPrimary}]}>تفاصيل الطلب</Text>
        <View style={[s.statusBadge, {backgroundColor: meta.color + '18'}]}>
          <Text style={[s.statusText, {color: meta.color}]}>{meta.label}</Text>
        </View>
      </View>

      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>

        <View style={[s.section, {backgroundColor: colors.card, borderColor: colors.border}]}>
          <Text style={[s.sectionTitle, {color: colors.textPrimary}]}>معلومات العميل</Text>
          <InfoRow icon={User}   label="الاسم"   value={order?.customerName || 'عميل'} colors={colors} />
          <InfoRow icon={Phone}  label="الهاتف"  value="••• ••• 0555"                  colors={colors} color={colors.success} />
          <InfoRow icon={MapPin} label="الموقع"  value={order?.location || 'الرياض، حي النخيل'} colors={colors} color={colors.danger} />
        </View>

        <View style={[s.section, {backgroundColor: colors.card, borderColor: colors.border}]}>
          <Text style={[s.sectionTitle, {color: colors.textPrimary}]}>تفاصيل الطلب</Text>
          <InfoRow icon={Car}   label="الخدمة"   value={order?.service || 'غسيل خارجي'} colors={colors} color={colors.purple} />
          <InfoRow icon={Clock} label="الوقت"    value={order?.time || '10:30'}           colors={colors} color={colors.warning} />
          <View style={s.priceRow}>
            <Text style={[s.priceLabel, {color: colors.textSecondary}]}>الإجمالي</Text>
            <Text style={[s.priceValue, {color: colors.primary}]}>{order?.price || '80'} ر.س</Text>
          </View>
        </View>

        {order?.biker && (
          <View style={[s.section, {backgroundColor: colors.card, borderColor: colors.border}]}>
            <Text style={[s.sectionTitle, {color: colors.textPrimary}]}>البايكر المعيّن</Text>
            <InfoRow icon={UserCheck} label="الاسم" value={order.biker} colors={colors} color={colors.success} />
          </View>
        )}

        <View style={[s.section, {backgroundColor: colors.card, borderColor: colors.border}]}>
          <Text style={[s.sectionTitle, {color: colors.textPrimary}]}>سجل الحالات</Text>
          {MOCK_TIMELINE.map((t, i) => {
            const tm = STATUS_META[t.status];
            return (
              <View key={i} style={s.timelineRow}>
                <View style={[s.timelineDot, {backgroundColor: tm?.color || colors.primary}]} />
                {i < MOCK_TIMELINE.length - 1 && <View style={[s.timelineLine, {backgroundColor: colors.border}]} />}
                <View style={s.timelineInfo}>
                  <Text style={[s.timelineLabel, {color: colors.textPrimary}]}>{t.label}</Text>
                  <Text style={[s.timelineTime, {color: colors.textSecondary}]}>{t.time}</Text>
                </View>
              </View>
            );
          })}
        </View>

        {order?.status === 'COMPLETED' && (
          <View style={[s.section, {backgroundColor: colors.card, borderColor: colors.border}]}>
            <View style={s.proofHeader}>
              <Image size={18} color={colors.textPrimary} />
              <Text style={[s.sectionTitle, {color: colors.textPrimary, marginBottom: 0}]}>صور العمل</Text>
            </View>
            <Text style={[s.proofNote, {color: colors.textSecondary}]}>تم رفع 3 صور بعد الغسيل</Text>
          </View>
        )}

        <View style={s.bottomPad} />
      </ScrollView>

      {canAssign && (
        <View style={[s.footer, {backgroundColor: colors.card, borderTopColor: colors.border}]}>
          <TouchableOpacity
            style={[s.assignBtn, {backgroundColor: colors.primary}]}
            onPress={() => setShowAssign(true)}
            activeOpacity={0.8}>
            <UserCheck size={20} color="#FFF" />
            <Text style={s.assignBtnText}>تعيين بايكر</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root:          {flex: 1},
  header:        {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16, borderBottomWidth: 1},
  backBtn:       {width: 36, height: 36, alignItems: 'center', justifyContent: 'center'},
  headerTitle:   {fontSize: 18, fontWeight: '800', flex: 1, marginHorizontal: 8},
  statusBadge:   {paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10},
  statusText:    {fontSize: 11, fontWeight: '700'},
  scroll:        {flex: 1},
  section:       {marginHorizontal: 16, marginTop: 14, borderRadius: 16, padding: 16, borderWidth: 1, gap: 10},
  sectionTitle:  {fontSize: 14, fontWeight: '700', marginBottom: 4},
  infoRow:       {flexDirection: 'row', alignItems: 'center', gap: 12},
  infoIcon:      {width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center'},
  infoText:      {flex: 1, gap: 2},
  infoLabel:     {fontSize: 11, fontWeight: '500'},
  infoValue:     {fontSize: 14, fontWeight: '600'},
  priceRow:      {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 4},
  priceLabel:    {fontSize: 14, fontWeight: '500'},
  priceValue:    {fontSize: 20, fontWeight: '800'},
  proofHeader:   {flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8},
  proofNote:     {fontSize: 13},
  timelineRow:   {flexDirection: 'row', alignItems: 'flex-start', gap: 12, position: 'relative'},
  timelineDot:   {width: 12, height: 12, borderRadius: 6, marginTop: 4},
  timelineLine:  {position: 'absolute', left: 5, top: 16, width: 2, height: 24},
  timelineInfo:  {flex: 1, paddingBottom: 16, gap: 2},
  timelineLabel: {fontSize: 13, fontWeight: '600'},
  timelineTime:  {fontSize: 11},
  footer:        {padding: 20, borderTopWidth: 1},
  assignBtn:     {flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16, borderRadius: 16},
  assignBtnText: {color: '#FFF', fontSize: 16, fontWeight: '800'},
  bottomPad:     {height: 24},
});
