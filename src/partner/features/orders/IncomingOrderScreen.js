import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  Animated,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  Vibration,
  View,
} from 'react-native';
import {Zap, X, User, MapPin, DollarSign, Droplets, Car, Hash} from 'lucide-react-native';
import {useTheme} from '../../../shared/context/ThemeContext';
import {useI18n} from '../../../shared/i18n/I18nContext';

const TIMEOUT_SECONDS = 15 * 60;

const REJECT_REASON_KEYS = ['busy', 'outOfRange', 'noBiker', 'duplicate', 'other'];

export default function IncomingOrderScreen({visible, order, onAccept, onReject}) {
  const {colors} = useTheme();
  const {t} = useI18n();
  const rejectReasons = REJECT_REASON_KEYS.map(k => ({key: k, label: t(`partner.incoming.rejectReasons.${k}`)}));
  const [secondsLeft, setSecondsLeft]       = useState(TIMEOUT_SECONDS);
  const [showReject, setShowReject]         = useState(false);
  const [selectedReason, setSelectedReason] = useState('');
  const [otherNote, setOtherNote]           = useState('');
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      setSecondsLeft(TIMEOUT_SECONDS);
      setShowReject(false);
      setSelectedReason('');
      setOtherNote('');
    }
  }, [visible]);

  // Pulse animation on title
  useEffect(() => {
    if (!visible) return;
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {toValue: 1.04, duration: 800, useNativeDriver: true}),
        Animated.timing(pulseAnim, {toValue: 1,    duration: 800, useNativeDriver: true}),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [visible, pulseAnim]);

  // Vibration — repeat:true keeps ringing until cancelled
  useEffect(() => {
    if (!visible) {
      Vibration.cancel();
      return;
    }
    // Long repeating pattern: ring 1s, pause 0.5s, ring 1s, pause 0.5s ...
    Vibration.vibrate([0, 1000, 500, 1000, 500, 1000, 500], true);
    return () => Vibration.cancel();
  }, [visible]);

  // Countdown
  useEffect(() => {
    if (!visible) return;
    if (secondsLeft <= 0) {
      Vibration.cancel();
      onReject('AUTO_TIMEOUT');
      return;
    }
    const t = setTimeout(() => setSecondsLeft(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [visible, secondsLeft, onReject]);

  const handleAccept = useCallback(() => {
    Vibration.cancel();
    onAccept(order);
  }, [order, onAccept]);

  const handleRejectConfirm = useCallback(() => {
    if (!selectedReason) return;
    const otherLabel = t('partner.incoming.rejectReasons.other');
    const reason = selectedReason === otherLabel ? (otherNote.trim() || otherLabel) : selectedReason;
    Vibration.cancel();
    onReject(reason);
  }, [selectedReason, otherNote, onReject, t]);

  const minutes   = Math.floor(secondsLeft / 60);
  const secs      = secondsLeft % 60;
  const timeLabel = `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')} ${t('partner.incoming.timer')}`;

  const otherLabel = t('partner.incoming.rejectReasons.other');
  const canConfirm = selectedReason && (selectedReason !== otherLabel || otherNote.trim().length > 0);

  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent>
      <View style={s.overlay}>
        <View style={s.sheet}>

          {/* ── Blue header ── */}
          <View style={[s.blueHeader, {backgroundColor: colors.primary}]}>
            {/* Live badge */}
            <View style={s.liveBadge}>
              <View style={s.liveDot} />
              <Text style={s.liveTxt}>{t('partner.incoming.live')}</Text>
            </View>

            <Animated.Text style={[s.mainTitle, {transform: [{scale: pulseAnim}]}]}>
              {t('partner.incoming.title')}
            </Animated.Text>
            <Text style={s.timerSub}>{timeLabel}</Text>
          </View>

          {/* ── White body ── */}
          <ScrollView
            style={[s.body, {backgroundColor: colors.bg}]}
            contentContainerStyle={s.bodyContent}
            showsVerticalScrollIndicator={false}>

            {/* Customer */}
            <View style={[s.card, {backgroundColor: colors.card, borderColor: colors.border}]}>
              <View style={[s.iconCircle, {backgroundColor: colors.primary + '15'}]}>
                <User size={20} color={colors.primary} />
              </View>
              <View style={s.cardInfo}>
                <Text style={[s.cardValue, {color: colors.textPrimary}]}>
                  {order?.customerName || 'خالد العتيبي'}
                </Text>
                <View style={s.locationRow}>
                  <MapPin size={12} color={colors.textSecondary} />
                  <Text style={[s.cardSub, {color: colors.textSecondary}]}>
                    {order?.location || 'حي الملقا، الرياض'}
                  </Text>
                </View>
              </View>
              {/* Avatar placeholder */}
              <View style={[s.avatar, {backgroundColor: colors.primary + '20'}]}>
                <User size={22} color={colors.primary} />
              </View>
            </View>

            {/* Price */}
            <View style={[s.card, {backgroundColor: colors.card, borderColor: colors.border}]}>
              <View style={[s.iconCircle, {backgroundColor: colors.primary + '15'}]}>
                <DollarSign size={20} color={colors.primary} />
              </View>
              <View style={s.cardInfo}>
                <Text style={[s.cardLabel, {color: colors.textSecondary}]}>{t('partner.incoming.cost')}</Text>
                <Text style={[s.priceValue, {color: colors.textPrimary}]}>
                  ﷼ {order?.price || '180'}
                </Text>
              </View>
            </View>

            {/* Service */}
            <View style={[s.card, {backgroundColor: colors.card, borderColor: colors.border}]}>
              <View style={[s.iconCircle, {backgroundColor: colors.primary + '15'}]}>
                <Droplets size={20} color={colors.primary} />
              </View>
              <View style={s.cardInfo}>
                <Text style={[s.cardLabel, {color: colors.textSecondary}]}>{t('partner.incoming.serviceType')}</Text>
                <Text style={[s.cardValue, {color: colors.textPrimary}]}>
                  {order?.service || 'غسيل خارجي + داخلي'}
                </Text>
              </View>
            </View>

            {/* Car + Plate side by side */}
            <View style={s.twoCol}>
              <View style={[s.halfCard, {backgroundColor: colors.card, borderColor: colors.border}]}>
                <View style={[s.iconCircle, {backgroundColor: colors.primary + '15'}]}>
                  <Car size={20} color={colors.primary} />
                </View>
                <Text style={[s.cardLabel, {color: colors.textSecondary}]}>{t('partner.incoming.carType')}</Text>
                <Text style={[s.cardValue, {color: colors.textPrimary}]}>
                  {order?.carModel || 'BMW M4'}
                </Text>
              </View>

              <View style={[s.halfCard, {backgroundColor: colors.card, borderColor: colors.border}]}>
                <View style={[s.iconCircle, {backgroundColor: colors.primary + '15'}]}>
                  <Hash size={20} color={colors.primary} />
                </View>
                <Text style={[s.cardLabel, {color: colors.textSecondary}]}>{t('partner.incoming.plate')}</Text>
                <Text style={[s.cardValue, {color: colors.textPrimary}]}>
                  {order?.plate || 'R T L 8756'}
                </Text>
              </View>
            </View>

            {/* Accept button */}
            <TouchableOpacity
              style={[s.acceptBtn, {backgroundColor: colors.primary}]}
              onPress={handleAccept}
              activeOpacity={0.85}>
              <Zap size={20} color="#FFF" fill="#FFF" />
              <Text style={s.acceptTxt}>{t('partner.incoming.accept')}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={s.rejectLink} onPress={() => setShowReject(true)} activeOpacity={0.75}>
              <Text style={[s.rejectLinkTxt, {color: colors.textSecondary}]}>{t('partner.incoming.reject')}</Text>
            </TouchableOpacity>

          </ScrollView>
        </View>

        {/* ── Reject bottom sheet ── */}
        {showReject && (
          <View style={[s.rejectSheet, {backgroundColor: colors.card}]}>
            <View style={[s.handle, {backgroundColor: colors.border}]} />
            <View style={s.rejectHeader}>
              <Text style={[s.rejectTitle, {color: colors.textPrimary}]}>{t('partner.incoming.rejectTitle')}</Text>
              <TouchableOpacity onPress={() => setShowReject(false)} style={s.closeBtn}>
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={s.reasonsList}>
              {rejectReasons.map(({key, label}) => {
                const isSel = selectedReason === label;
                return (
                  <TouchableOpacity
                    key={key}
                    style={[s.reasonRow, {
                      borderColor:     isSel ? colors.primary : colors.border,
                      backgroundColor: isSel ? colors.primary + '10' : colors.bg,
                    }]}
                    onPress={() => setSelectedReason(label)}
                    activeOpacity={0.75}>
                    <View style={[s.radio, {borderColor: isSel ? colors.primary : colors.border}]}>
                      {isSel && <View style={[s.radioDot, {backgroundColor: colors.primary}]} />}
                    </View>
                    <Text style={[s.reasonTxt, {color: isSel ? colors.primary : colors.textPrimary}]}>
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}

              {selectedReason === otherLabel && (
                <TextInput
                  style={[s.noteInput, {backgroundColor: colors.bg, borderColor: colors.border, color: colors.textPrimary}]}
                  placeholder={t('partner.incoming.rejectNotePlaceholder')}
                  placeholderTextColor={colors.textSecondary}
                  value={otherNote}
                  onChangeText={setOtherNote}
                  multiline
                  textAlignVertical="top"
                />
              )}
            </View>

            <TouchableOpacity
              style={[s.confirmBtn, {backgroundColor: canConfirm ? colors.danger : colors.border}]}
              onPress={handleRejectConfirm}
              disabled={!canConfirm}
              activeOpacity={0.8}>
              <Text style={s.confirmTxt}>{t('partner.incoming.rejectConfirm')}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay:      {flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)'},
  sheet:        {borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: 'hidden', maxHeight: '92%'},

  // Blue header
  blueHeader:   {paddingTop: 24, paddingBottom: 28, paddingHorizontal: 20, alignItems: 'center', gap: 8},
  liveBadge:    {flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 50},
  liveDot:      {width: 7, height: 7, borderRadius: 4, backgroundColor: '#FFF'},
  liveTxt:      {color: '#FFF', fontSize: 12, fontWeight: '700'},
  mainTitle:    {color: '#FFF', fontSize: 28, fontWeight: '900'},
  timerSub:     {color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '500'},

  // Body
  body:         {},
  bodyContent:  {padding: 16, gap: 10, paddingBottom: 8},

  // Cards
  card:         {flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 16, borderWidth: 1},
  iconCircle:   {width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center'},
  cardInfo:     {flex: 1, gap: 2},
  cardLabel:    {fontSize: 11},
  cardValue:    {fontSize: 15, fontWeight: '700'},
  cardSub:      {fontSize: 12},
  locationRow:  {flexDirection: 'row', alignItems: 'center', gap: 4},
  avatar:       {width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center'},
  priceValue:   {fontSize: 22, fontWeight: '900'},

  // Two-column row
  twoCol:       {flexDirection: 'row', gap: 10},
  halfCard:     {flex: 1, padding: 14, borderRadius: 16, borderWidth: 1, gap: 6, alignItems: 'center'},

  // Buttons
  acceptBtn:    {flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16, borderRadius: 16, marginTop: 6},
  acceptTxt:    {color: '#FFF', fontSize: 16, fontWeight: '800'},
  rejectLink:   {alignItems: 'center', paddingVertical: 12},
  rejectLinkTxt:{fontSize: 14, fontWeight: '700', color: '#EF4444'},

  // Reject sheet
  rejectSheet:  {position: 'absolute', bottom: 0, left: 0, right: 0, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 36},
  handle:       {width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 16},
  rejectHeader: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16},
  rejectTitle:  {fontSize: 16, fontWeight: '800'},
  closeBtn:     {width: 34, height: 34, alignItems: 'center', justifyContent: 'center'},
  reasonsList:  {gap: 8, marginBottom: 16},
  reasonRow:    {flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 14, borderWidth: 1.5},
  radio:        {width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center'},
  radioDot:     {width: 10, height: 10, borderRadius: 5},
  reasonTxt:    {fontSize: 14, fontWeight: '600'},
  noteInput:    {borderWidth: 1, borderRadius: 14, padding: 14, fontSize: 14, minHeight: 80, marginTop: 4},
  confirmBtn:   {paddingVertical: 16, borderRadius: 14, alignItems: 'center'},
  confirmTxt:   {color: '#FFF', fontSize: 15, fontWeight: '800'},
});
