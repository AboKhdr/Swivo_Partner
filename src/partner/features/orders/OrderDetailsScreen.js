import React, {useCallback, useState} from 'react';
import {ScrollView, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {ArrowLeft, ShoppingBag, Phone, MapPin, Car, CreditCard, Info, Bike, CarFront, Droplets, Sparkles} from 'lucide-react-native';
import {useTheme} from '../../../shared/context/ThemeContext';
import AssignBikerScreen from './AssignBikerScreen';


const TIMELINE_STEPS = [
  {key: 'received', label: 'وصول الطلب',   Icon: CarFront},
  {key: 'arrived',  label: 'وصول البايكر', Icon: MapPin},
  {key: 'started',  label: 'بدء الغسيل',   Icon: Droplets},
  {key: 'done',     label: 'انهاء الغسيل', Icon: Sparkles},
];

const STATUS_ACTIVE_STEPS = {
  PENDING_PARTNER: 0,
  ACCEPTED:        1,
  ASSIGNED:        1,
  ON_THE_WAY:      2,
  STARTED:         3,
  COMPLETED:       4,
};

export default function OrderDetailsScreen({order, onBack}) {
  const {colors} = useTheme();
  const [showAssign, setShowAssign] = useState(false);

  const activeStep = STATUS_ACTIVE_STEPS[order?.status] ?? 0;

  const handleAssigned = useCallback(() => setShowAssign(false), []);

  return (
    <View style={[s.root, {backgroundColor: colors.bg}]}>
      <View style={[s.header, {backgroundColor: colors.bg}]}>
        <TouchableOpacity onPress={onBack} style={s.backBtn} activeOpacity={0.75}>
          <ArrowLeft size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, {color: colors.textPrimary}]}>
          Order #{order?.id ? `SW-${order.id.padStart(4, '0')}` : 'SW-0001'}
        </Text>
      </View>

      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent}>

        {/* Service card */}
        <View style={[s.card, {backgroundColor: colors.card, borderColor: colors.border}]}>
          <View style={s.cardRow}>
            <View style={[s.iconBox, {backgroundColor: colors.primary + '15'}]}>
              <ShoppingBag size={20} color={colors.primary} />
            </View>
            <View style={s.cardInfo}>
              <Text style={[s.cardTime, {color: colors.textSecondary}]}>{order?.time || '10:42 AM'}</Text>
              <Text style={[s.cardTitle, {color: colors.textPrimary}]}>{order?.service || 'غسيل داخلي + خارجي'}</Text>
              <Text style={[s.cardSub, {color: colors.textSecondary}]}>فرع: الرياض</Text>
            </View>
          </View>
        </View>

        {/* Customer card */}
        <View style={[s.card, {backgroundColor: colors.card, borderColor: colors.border}]}>
          <View style={s.cardRow}>
            <View style={[s.avatar, {backgroundColor: colors.primary + '15'}]}>
              <Text style={[s.avatarText, {color: colors.primary}]}>
                {(order?.customerName || 'خالد العتيبي').charAt(0)}
              </Text>
            </View>
            <View style={s.cardInfo}>
              <Text style={[s.cardTitle, {color: colors.textPrimary}]}>{order?.customerName || 'خالد العتيبي'}</Text>
              <Text style={[s.cardSub, {color: colors.textSecondary}]}>+966 213 3212 213</Text>
            </View>
            <TouchableOpacity style={[s.phoneBtn, {backgroundColor: colors.bg, borderColor: colors.border}]} activeOpacity={0.75}>
              <Phone size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Car card */}
        <View style={[s.card, {backgroundColor: colors.card, borderColor: colors.border}]}>
          <View style={s.cardRow}>
            <View style={[s.iconBox, {backgroundColor: colors.primary + '15'}]}>
              <Car size={20} color={colors.primary} />
            </View>
            <View style={s.cardInfo}>
              <Text style={[s.cardTitle, {color: colors.textPrimary}]}>White Toyota Land Cruiser</Text>
              <View style={[s.plateBadge, {backgroundColor: colors.bg, borderColor: colors.border}]}>
                <Text style={[s.plateText, {color: colors.textPrimary}]}>{order?.plate || 'RKA 4821'}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Map card */}
        <View style={[s.card, {backgroundColor: colors.card, borderColor: colors.border}]}>
          <View style={[s.mapPlaceholder, {backgroundColor: colors.bg}]}>
            <View style={[s.mapDot, {backgroundColor: colors.primary}]} />
          </View>
          <View style={s.mapBottom}>
            <View style={s.mapDistCol}>
              <Text style={[s.mapDist, {color: colors.primary}]}>2.4 km</Text>
              <Text style={[s.mapTime, {color: colors.textSecondary}]}>12 min</Text>
            </View>
            <View style={s.mapAddrCol}>
              <View style={s.mapAddrRow}>
                <MapPin size={14} color={colors.primary} />
                <Text style={[s.mapAddrTitle, {color: colors.textPrimary}]}>طريق الملك فهد</Text>
              </View>
              <Text style={[s.mapAddrSub, {color: colors.textSecondary}]}>البرج 4، شارع الياسمين</Text>
            </View>
          </View>
        </View>

        {/* Payment card */}
        <Text style={[s.sectionLabel, {color: colors.textPrimary}]}>عملية الدفع</Text>
        <View style={[s.card, {backgroundColor: colors.card, borderColor: colors.border}]}>
          <View style={s.payRow}>
            <View style={s.payTextCol}>
              <Text style={[s.payAmount, {color: colors.textPrimary}]}> {order?.price || '120.90'}</Text>
              <Text style={[s.cardSub, {color: colors.textSecondary}]}>تمت عملية الدفع عن طريق: بطاقة الائتمان</Text>
            </View>
            <View style={[s.payIconBox, {backgroundColor: colors.primary + '15'}]}>
              <CreditCard size={22} color={colors.primary} />
            </View>
          </View>
        </View>

        {/* Customer notes */}
        <Text style={[s.sectionLabel, {color: colors.textPrimary}]}>ملاحظات الزبون</Text>
        <View style={[s.card, {backgroundColor: colors.card, borderColor: colors.border}]}>
          <View style={s.notesRow}>
            <View style={[s.notesIconBox, {backgroundColor: colors.bg, borderColor: colors.border}]}>
              <Info size={16} color={colors.primary} />
            </View>
            <Text style={[s.notesText, {color: colors.textPrimary}]}>
              {order?.notes || 'بدي انا شوو بدي،  انا غيرك ما بدي لعمري خلي وبدي اريدك تقفي حدي، يما يما يما يما يما يما يما'}
            </Text>
          </View>
        </View>

        {/* Timeline */}
        <Text style={[s.sectionLabel, {color: colors.textPrimary}]}>وقت العملية</Text>
        <View style={s.timeline}>
          {TIMELINE_STEPS.map((step, i) => {
            const {Icon} = step;
            const isActive    = i < activeStep;
            const isCurrent   = i === activeStep - 1;
            const highlighted = isActive || isCurrent;
            const isLast      = i === TIMELINE_STEPS.length - 1;
            return (
              <View key={step.key} style={s.timelineStep}>
                {!isLast && (
                  <View style={[s.timelineLine, {backgroundColor: isActive ? colors.primary : colors.border}]} />
                )}
                <View style={[
                  s.timelineIconBox,
                  highlighted
                    ? {backgroundColor: colors.primary + '18', borderColor: colors.primary, borderWidth: 1.5}
                    : {backgroundColor: '#FFFFFF',             borderWidth: 0,              elevation: 3, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: {width: 0, height: 2}},
                ]}>
                  <Icon size={22} color={highlighted ? colors.primary : colors.textSecondary} />
                </View>
                <Text style={[s.timelineLabel, {color: colors.textPrimary}]}>{step.label}</Text>
                <Text style={[s.timelineTime, {color: colors.textSecondary}]}>02:30 PM</Text>
              </View>
            );
          })}
        </View>

        <View style={s.bottomPad} />
      </ScrollView>

      <View style={[s.footer, {backgroundColor: colors.card, borderTopColor: colors.border}]}>
        <TouchableOpacity
          style={[s.rejectBtn, {backgroundColor: '#FEE2E2', borderColor: '#FCA5A5'}]}
          activeOpacity={0.75}>
          <Text style={[s.rejectText, {color: '#EF4444'}]}>رفض</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.assignBtn, {backgroundColor: colors.primary}]}
          onPress={() => setShowAssign(true)}
          activeOpacity={0.8}>
          <Bike size={20} color="#FFF" />
          <Text style={s.assignBtnText}>ارسال البايكر</Text>
        </TouchableOpacity>
      </View>

      <AssignBikerScreen
        visible={showAssign}
        onClose={() => setShowAssign(false)}
        onAssigned={handleAssigned}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root:            {flex: 1},
  header:          {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16},
  backBtn:         {width: 36, height: 36, alignItems: 'center', justifyContent: 'center'},
  headerTitle:     {flex: 1, fontSize: 17, fontWeight: '800', marginHorizontal: 8},
  headerArrow:     {width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1},
  scroll:          {flex: 1},
  scrollContent:   {paddingHorizontal: 16, paddingTop: 4},
  card:            {borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 12},
  cardRow:         {flexDirection: 'row', alignItems: 'center', gap: 14},
  iconBox:         {width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center'},
  cardInfo:        {flex: 1, gap: 4},
  cardTime:        {fontSize: 12},
  cardTitle:       {fontSize: 15, fontWeight: '700'},
  cardSub:         {fontSize: 12},
  avatar:          {width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center'},
  avatarText:      {fontSize: 20, fontWeight: '800'},
  phoneBtn:        {width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1},
  plateBadge:      {alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1, marginTop: 4},
  plateText:       {fontSize: 13, fontWeight: '700', letterSpacing: 1},
  mapPlaceholder:  {height: 130, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 14},
  mapDot:          {width: 14, height: 14, borderRadius: 7},
  mapBottom:       {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'},
  mapDistCol:      {gap: 2},
  mapDist:         {fontSize: 16, fontWeight: '800'},
  mapTime:         {fontSize: 12},
  mapAddrCol:      {gap: 4},
  mapAddrRow:      {flexDirection: 'row', alignItems: 'center', gap: 4},
  mapAddrTitle:    {fontSize: 15, fontWeight: '700'},
  mapAddrSub:      {fontSize: 12},
  sectionLabel:    {fontSize: 15, fontWeight: '700', marginBottom: 10, marginTop: 4},
  payRow:          {flexDirection: 'row', alignItems: 'center', gap: 14},
  payTextCol:      {flex: 1, gap: 4},
  payIconBox:      {width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center'},
  payAmount:       {fontSize: 20, fontWeight: '800'},
  notesRow:        {flexDirection: 'row', gap: 12},
  notesIconBox:    {width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1, marginTop: 2},
  notesText:       {flex: 1, fontSize: 13, lineHeight: 22},
  timeline:        {flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12, paddingVertical: 8},
  timelineStep:    {alignItems: 'center', flex: 1, gap: 8, position: 'relative'},
  timelineIconBox: {width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center'},
  timelineLine:    {position: 'absolute', top: 26, left: '50%', right: '-50%', height: 2},
  timelineLabel:   {fontSize: 11, fontWeight: '600'},
  timelineTime:    {fontSize: 10},
  footer:          {flexDirection: 'row', gap: 12, padding: 16, paddingBottom: 28, borderTopWidth: 1},
  rejectBtn:       {paddingHorizontal: 20, paddingVertical: 14, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center'},
  rejectText:      {fontSize: 15, fontWeight: '800'},
  assignBtn:       {flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 14, borderRadius: 14},
  assignBtnText:   {color: '#FFF', fontSize: 16, fontWeight: '800'},
  bottomPad:       {height: 8},
});
