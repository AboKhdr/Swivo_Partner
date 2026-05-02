import React, {useCallback, useEffect, useRef, useState} from 'react';
import {Animated, StyleSheet, Text, TextInput, TouchableOpacity, View} from 'react-native';
import {Phone, MapPin, Car, X, Check} from 'lucide-react-native';
import {useTheme} from '../../../shared/context/ThemeContext';

const TIMEOUT_SECONDS = 60;

const REJECT_REASONS = [
  'مشغول حالياً',
  'خارج نطاق الخدمة',
  'لا يوجد بايكر متاح',
  'طلب مكرر',
  'أخرى',
];

export default function IncomingOrderScreen({order, onAccept, onReject}) {
  const {colors} = useTheme();
  const [secondsLeft, setSecondsLeft] = useState(TIMEOUT_SECONDS);
  const [showReject, setShowReject]   = useState(false);
  const [selectedReason, setSelectedReason] = useState('');
  const [otherNote, setOtherNote]     = useState('');
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {toValue: 1.08, duration: 600, useNativeDriver: true}),
        Animated.timing(pulseAnim, {toValue: 1,    duration: 600, useNativeDriver: true}),
      ])
    ).start();
  }, [pulseAnim]);

  useEffect(() => {
    if (secondsLeft <= 0) {
      onReject('AUTO_TIMEOUT');
      return;
    }
    const timer = setTimeout(() => setSecondsLeft(s => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft, onReject]);

  const handleAccept = useCallback(() => {
    onAccept(order);
  }, [order, onAccept]);

  const handleRejectConfirm = useCallback(() => {
    if (!selectedReason) return;
    const reason = selectedReason === 'أخرى' ? otherNote || 'أخرى' : selectedReason;
    onReject(reason);
  }, [selectedReason, otherNote, onReject]);

  const timerColor = secondsLeft <= 15 ? colors.danger : secondsLeft <= 30 ? colors.warning : colors.primary;
  const canConfirmReject = selectedReason && (selectedReason !== 'أخرى' || otherNote.trim().length > 0);

  if (showReject) {
    return (
      <View style={[s.root, {backgroundColor: colors.bg}]}>
        <View style={[s.rejectHeader, {borderBottomColor: colors.border, backgroundColor: colors.card}]}>
          <TouchableOpacity onPress={() => setShowReject(false)} style={s.backBtn}>
            <X size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[s.rejectTitle, {color: colors.textPrimary}]}>سبب الرفض</Text>
          <View style={{width: 36}} />
        </View>

        <View style={s.rejectBody}>
          {REJECT_REASONS.map(reason => (
            <TouchableOpacity
              key={reason}
              style={[s.reasonItem, {backgroundColor: colors.card, borderColor: selectedReason === reason ? colors.primary : colors.border}]}
              onPress={() => setSelectedReason(reason)}
              activeOpacity={0.75}>
              <View style={[s.radioOuter, {borderColor: selectedReason === reason ? colors.primary : colors.border}]}>
                {selectedReason === reason && <View style={[s.radioInner, {backgroundColor: colors.primary}]} />}
              </View>
              <Text style={[s.reasonText, {color: colors.textPrimary}]}>{reason}</Text>
            </TouchableOpacity>
          ))}

          {selectedReason === 'أخرى' && (
            <TextInput
              style={[s.noteInput, {backgroundColor: colors.card, borderColor: colors.border, color: colors.textPrimary}]}
              placeholder="اكتب السبب..."
              placeholderTextColor={colors.textSecondary}
              value={otherNote}
              onChangeText={setOtherNote}
              multiline
              textAlignVertical="top"
            />
          )}

          <TouchableOpacity
            style={[s.confirmRejectBtn, {backgroundColor: canConfirmReject ? colors.danger : colors.border}]}
            onPress={handleRejectConfirm}
            disabled={!canConfirmReject}
            activeOpacity={0.8}>
            <Text style={s.confirmRejectText}>تأكيد الرفض</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[s.root, {backgroundColor: '#0F172A'}]}>
      <View style={s.timerSection}>
        <Animated.View style={[s.timerRing, {borderColor: timerColor, transform: [{scale: pulseAnim}]}]}>
          <Text style={[s.timerNumber, {color: timerColor}]}>{secondsLeft}</Text>
          <Text style={[s.timerLabel, {color: timerColor}]}>ثانية</Text>
        </Animated.View>
        <Text style={s.incomingLabel}>طلب جديد وارد</Text>
      </View>

      <View style={[s.orderCard, {backgroundColor: colors.card}]}>
        <View style={s.orderRow}>
          <View style={[s.orderIconBox, {backgroundColor: colors.primary + '18'}]}>
            <Phone size={18} color={colors.primary} />
          </View>
          <View style={s.orderInfo}>
            <Text style={[s.orderLabel, {color: colors.textSecondary}]}>العميل</Text>
            <Text style={[s.orderValue, {color: colors.textPrimary}]}>{order?.customerName || 'عميل'}</Text>
          </View>
        </View>

        <View style={[s.divider, {backgroundColor: colors.border}]} />

        <View style={s.orderRow}>
          <View style={[s.orderIconBox, {backgroundColor: colors.purple + '18'}]}>
            <Car size={18} color={colors.purple} />
          </View>
          <View style={s.orderInfo}>
            <Text style={[s.orderLabel, {color: colors.textSecondary}]}>الخدمة</Text>
            <Text style={[s.orderValue, {color: colors.textPrimary}]}>{order?.service || 'غسيل'}</Text>
          </View>
        </View>

        <View style={[s.divider, {backgroundColor: colors.border}]} />

        <View style={s.orderRow}>
          <View style={[s.orderIconBox, {backgroundColor: colors.success + '18'}]}>
            <MapPin size={18} color={colors.success} />
          </View>
          <View style={s.orderInfo}>
            <Text style={[s.orderLabel, {color: colors.textSecondary}]}>الموقع</Text>
            <Text style={[s.orderValue, {color: colors.textPrimary}]}>{order?.location || 'الرياض، حي النخيل'}</Text>
          </View>
        </View>
      </View>

      <View style={s.actions}>
        <TouchableOpacity
          style={[s.rejectBtn, {backgroundColor: colors.danger + '22', borderColor: colors.danger}]}
          onPress={() => setShowReject(true)}
          activeOpacity={0.8}>
          <X size={24} color={colors.danger} />
          <Text style={[s.rejectBtnText, {color: colors.danger}]}>رفض</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[s.acceptBtn, {backgroundColor: colors.success}]}
          onPress={handleAccept}
          activeOpacity={0.8}>
          <Check size={24} color="#FFF" />
          <Text style={s.acceptBtnText}>قبول</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root:              {flex: 1},
  timerSection:      {alignItems: 'center', paddingTop: 64, paddingBottom: 32},
  timerRing:         {width: 130, height: 130, borderRadius: 65, borderWidth: 4, alignItems: 'center', justifyContent: 'center'},
  timerNumber:       {fontSize: 48, fontWeight: '900'},
  timerLabel:        {fontSize: 13, fontWeight: '600', marginTop: -4},
  incomingLabel:     {color: '#F1F5F9', fontSize: 18, fontWeight: '700', marginTop: 20},
  orderCard:         {marginHorizontal: 20, borderRadius: 20, padding: 20, gap: 4},
  orderRow:          {flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 14},
  orderIconBox:      {width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center'},
  orderInfo:         {flex: 1, gap: 2},
  orderLabel:        {fontSize: 11, fontWeight: '500'},
  orderValue:        {fontSize: 15, fontWeight: '700'},
  divider:           {height: 1, marginHorizontal: 4},
  actions:           {flexDirection: 'row', paddingHorizontal: 20, paddingTop: 32, gap: 16},
  rejectBtn:         {flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 18, borderRadius: 18, borderWidth: 1.5},
  rejectBtnText:     {fontSize: 16, fontWeight: '800'},
  acceptBtn:         {flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 18, borderRadius: 18},
  acceptBtnText:     {fontSize: 16, fontWeight: '800', color: '#FFF'},
  rejectHeader:      {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16, borderBottomWidth: 1},
  backBtn:           {width: 36, height: 36, alignItems: 'center', justifyContent: 'center'},
  rejectTitle:       {fontSize: 18, fontWeight: '800'},
  rejectBody:        {padding: 20, gap: 10},
  reasonItem:        {flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 14, borderWidth: 1.5},
  radioOuter:        {width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center'},
  radioInner:        {width: 10, height: 10, borderRadius: 5},
  reasonText:        {fontSize: 15, fontWeight: '600'},
  noteInput:         {borderWidth: 1, borderRadius: 14, padding: 14, fontSize: 14, minHeight: 90, marginTop: 4},
  confirmRejectBtn:  {paddingVertical: 18, borderRadius: 18, alignItems: 'center', marginTop: 8},
  confirmRejectText: {color: '#FFF', fontSize: 16, fontWeight: '800'},
});
