import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  ActivityIndicator,
  Animated,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {Zap, X, User, MapPin, DollarSign, Droplets, Car, Hash} from 'lucide-react-native';
import {useTheme} from '../../../shared/context/ThemeContext';
import {useI18n} from '../../../shared/i18n/I18nContext';
import {cancelIncomingOrderNotification, RING_MAX_MS} from '../../../services/notificationChannel';
import {REJECT_REASONS} from '../../../shared/constants/rejectReasons';
import RiyalIcon from '../../../shared/components/RiyalIcon';

const TIMEOUT_SECONDS = Math.floor(RING_MAX_MS / 1000);

// ── Safe string: handles {ar, en} objects ──────────────────────────────────────
function s2(val, lang) {
  if (!val) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'object') return (lang && val[lang]) ?? val.ar ?? val.en ?? '';
  return String(val);
}

// ── Resolve display fields from new or legacy shape ───────────────────────────
// New API: client.name, client.phoneNumber, car.brand/model/plateNumber/color,
//          services[].name, location.addressText, totalAmount
// Legacy:  customerName, location (string), price, service, carModel, plate
function resolveOrderFields(order, lang) {
  if (!order) return {};

  const clientName = order.client?.name
    ?? (order.client
      ? `${order.client.firstName ?? ''} ${order.client.lastName ?? ''}`.trim()
      : order.customerName ?? '');

  const clientPhone = order.client?.phoneNumber ?? order.client?.phone ?? '';

  const location = order.location?.addressText
    ?? order.addressSnapshot?.addressText
    ?? order.addressSnapshot?.district
    ?? (typeof order.location === 'string' ? order.location : '')
    ?? '';

  const firstSvc = order.services?.[0];
  const serviceName = s2(firstSvc?.name, lang)
    || s2(order.itemsSnapshot?.[0]?.nameSnapshot, lang)
    || s2(order.service?.name, lang)
    || (typeof order.service === 'string' ? order.service : '');

  const carBrand = s2(order.car?.brand, lang) || s2(order.userCar?.brand?.name, lang);
  const carModel = s2(order.car?.model, lang) || s2(order.userCar?.model?.name, lang);
  const carDisplay = [carBrand, carModel].filter(Boolean).join(' ') || order.carModel || '';

  const carColor = s2(order.car?.color, lang) || '';

  const plate = order.car?.plateNumber
    ?? order.userCar?.plateNumber
    ?? order.plate
    ?? '';

  const price = order.totalAmount ?? order.price ?? order.bikerEarning ?? null;

  const orderNumber = order.orderNumber
    ?? order.number
    ?? order.orderNo
    ?? (order._id ? String(order._id).slice(-6).toUpperCase() : '')
    ?? (order.id ? String(order.id).slice(-6).toUpperCase() : '');

  return {clientName, clientPhone, location, serviceName, carDisplay, carColor, plate, price, orderNumber};
}

export default function IncomingOrderScreen({visible, order, onAccept, onReject}) {
  const {colors} = useTheme();
  const {t, lang} = useI18n();

  const rejectReasons = REJECT_REASONS.map(r => ({
    key:   r.key,
    code:  r.code,
    label: t(`partner.incoming.rejectReasons.${r.key}`),
  }));

  const [secondsLeft, setSecondsLeft] = useState(TIMEOUT_SECONDS);
  const [showReject, setShowReject]   = useState(false);
  const [selectedCode, setSelectedCode] = useState('');
  const [otherNote, setOtherNote]     = useState('');
  const [busy, setBusy]               = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      setSecondsLeft(TIMEOUT_SECONDS);
      setShowReject(false);
      setSelectedCode('');
      setOtherNote('');
      setBusy(false);
    }
  }, [visible]);

  // Pulse animation
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

  // Countdown
  useEffect(() => {
    if (!visible) return;
    if (secondsLeft <= 0) {
      cancelIncomingOrderNotification().catch(() => {});
      onReject({reason: 'AUTO_TIMEOUT'});
      return;
    }
    const timer = setTimeout(() => setSecondsLeft(s => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [visible, secondsLeft, onReject]);

  const handleAccept = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    cancelIncomingOrderNotification().catch(() => {});
    try {
      await onAccept(order);
    } finally {
      setBusy(false);
    }
  }, [order, onAccept, busy]);

  const handleRejectConfirm = useCallback(async () => {
    if (busy || !selectedCode) return;
    const note = selectedCode === 'OTHER' ? otherNote.trim() : '';
    setBusy(true);
    cancelIncomingOrderNotification().catch(() => {});
    try {
      await onReject({reason: selectedCode, note: note || undefined});
    } finally {
      setBusy(false);
    }
  }, [selectedCode, otherNote, onReject, busy]);

  const minutes   = Math.floor(secondsLeft / 60);
  const secs      = secondsLeft % 60;
  const timeLabel = `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')} ${t('partner.incoming.timer')}`;
  const canConfirm = selectedCode && (selectedCode !== 'OTHER' || otherNote.trim().length > 0);

  const {clientName, clientPhone, location, serviceName, carDisplay, carColor, plate, price, orderNumber} =
    resolveOrderFields(order, lang);

  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent>
      <View style={s.overlay}>
        <View style={s.sheet}>

          {/* Blue header */}
          <View style={[s.blueHeader, {backgroundColor: colors.primary}]}>
            <View style={s.liveBadge}>
              <View style={s.liveDot} />
              <Text style={s.liveTxt}>{t('partner.incoming.live')}</Text>
            </View>
            <Animated.Text style={[s.mainTitle, {transform: [{scale: pulseAnim}]}]}>
              {t('partner.incoming.title')}
            </Animated.Text>
            {!!orderNumber && (
              <View style={s.orderNoBadge}>
                <Hash size={13} color="#FFF" strokeWidth={2.5} />
                <Text style={s.orderNoTxt}>{orderNumber}</Text>
              </View>
            )}
            <Text style={s.timerSub}>{timeLabel}</Text>
          </View>

          {/* Body */}
          <ScrollView
            style={[s.body, {backgroundColor: colors.bg}]}
            contentContainerStyle={s.bodyContent}
            showsVerticalScrollIndicator={false}>

            {/* Customer + location */}
            <View style={[s.card, {backgroundColor: colors.card, borderColor: colors.border}]}>
              <View style={[s.iconCircle, {backgroundColor: colors.primary + '15'}]}>
                <User size={20} color={colors.primary} />
              </View>
              <View style={s.cardInfo}>
                <Text style={[s.cardValue, {color: colors.textPrimary}]}>
                  {clientName || '—'}
                </Text>
                {!!clientPhone && (
                  <Text style={[s.cardSub, {color: colors.textSecondary}]}>{clientPhone}</Text>
                )}
                {!!location && (
                  <View style={s.locationRow}>
                    <MapPin size={12} color={colors.textSecondary} />
                    <Text style={[s.cardSub, {color: colors.textSecondary}]} numberOfLines={2}>
                      {location}
                    </Text>
                  </View>
                )}
              </View>
              <View style={[s.avatar, {backgroundColor: colors.primary + '20'}]}>
                <User size={22} color={colors.primary} />
              </View>
            </View>

            {/* Service */}
            {!!serviceName && (
              <View style={[s.card, {backgroundColor: colors.card, borderColor: colors.border}]}>
                <View style={[s.iconCircle, {backgroundColor: colors.primary + '15'}]}>
                  <Droplets size={20} color={colors.primary} />
                </View>
                <View style={s.cardInfo}>
                  <Text style={[s.cardLabel, {color: colors.textSecondary}]}>{t('partner.incoming.serviceType')}</Text>
                  <Text style={[s.cardValue, {color: colors.textPrimary}]}>{serviceName}</Text>
                </View>
              </View>
            )}

            {/* Car + Plate */}
            <View style={s.twoCol}>
              {!!carDisplay && (
                <View style={[s.halfCard, {backgroundColor: colors.card, borderColor: colors.border}]}>
                  <View style={[s.iconCircle, {backgroundColor: colors.primary + '15'}]}>
                    <Car size={20} color={colors.primary} />
                  </View>
                  <Text style={[s.cardLabel, {color: colors.textSecondary}]}>{t('partner.incoming.carType')}</Text>
                  <Text style={[s.cardValue, {color: colors.textPrimary}]}>
                    {carDisplay}{carColor ? `\n${carColor}` : ''}
                  </Text>
                </View>
              )}
              {!!plate && (
                <View style={[s.halfCard, {backgroundColor: colors.card, borderColor: colors.border}]}>
                  <View style={[s.iconCircle, {backgroundColor: colors.primary + '15'}]}>
                    <Hash size={20} color={colors.primary} />
                  </View>
                  <Text style={[s.cardLabel, {color: colors.textSecondary}]}>{t('partner.incoming.plate')}</Text>
                  <Text style={[s.cardValue, {color: colors.textPrimary}]}>{plate}</Text>
                </View>
              )}
            </View>

            {/* Price — only show for biker (bikerEarning) or if totalAmount present */}
            {price !== null && price !== undefined && (
              <View style={[s.card, {backgroundColor: colors.card, borderColor: colors.border}]}>
                <View style={[s.iconCircle, {backgroundColor: colors.primary + '15'}]}>
                  <DollarSign size={20} color={colors.primary} />
                </View>
                <View style={s.cardInfo}>
                  <Text style={[s.cardLabel, {color: colors.textSecondary}]}>{t('partner.incoming.cost')}</Text>
                  <View style={s.priceRow}>
                    <RiyalIcon size={21} color={colors.textPrimary} />
                    <Text style={[s.priceValue, {color: colors.textPrimary}]}>{price}</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Accept */}
            <TouchableOpacity
              style={[s.acceptBtn, {backgroundColor: colors.primary, opacity: busy ? 0.7 : 1}]}
              onPress={handleAccept}
              disabled={busy}
              activeOpacity={0.85}>
              {busy ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <Zap size={20} color="#FFF" fill="#FFF" />
                  <Text style={s.acceptTxt}>{t('partner.incoming.accept')}</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={s.rejectLink}
              onPress={() => !busy && setShowReject(true)}
              disabled={busy}
              activeOpacity={0.75}>
              <Text style={[s.rejectLinkTxt, {color: '#EF4444'}]}>{t('partner.incoming.reject')}</Text>
            </TouchableOpacity>

          </ScrollView>
        </View>

        {/* Reject bottom sheet */}
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
              {rejectReasons.map(({key, code, label}) => {
                const isSel = selectedCode === code;
                return (
                  <TouchableOpacity
                    key={key}
                    style={[s.reasonRow, {
                      borderColor:     isSel ? colors.primary : colors.border,
                      backgroundColor: isSel ? colors.primary + '10' : colors.bg,
                    }]}
                    onPress={() => setSelectedCode(code)}
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

              {selectedCode === 'OTHER' && (
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
              style={[s.confirmBtn, {backgroundColor: canConfirm && !busy ? colors.danger ?? '#EF4444' : colors.border}]}
              onPress={handleRejectConfirm}
              disabled={!canConfirm || busy}
              activeOpacity={0.8}>
              {busy ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={s.confirmTxt}>{t('partner.incoming.rejectConfirm')}</Text>
              )}
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

  blueHeader:   {paddingTop: 24, paddingBottom: 28, paddingHorizontal: 20, alignItems: 'center', gap: 8},
  liveBadge:    {flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 50},
  liveDot:      {width: 7, height: 7, borderRadius: 4, backgroundColor: '#FFF'},
  liveTxt:      {color: '#FFF', fontSize: 12, fontWeight: '700'},
  mainTitle:    {color: '#FFF', fontSize: 28, fontWeight: '900'},
  orderNoBadge: {flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: 'rgba(255,255,255,0.18)', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 50, marginTop: 2},
  orderNoTxt:   {color: '#FFF', fontSize: 14, fontWeight: '800', letterSpacing: 0.5},
  timerSub:     {color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '500'},

  body:         {},
  bodyContent:  {padding: 16, gap: 10, paddingBottom: 8},

  card:         {flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 16, borderWidth: 1},
  iconCircle:   {width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center'},
  cardInfo:     {flex: 1, gap: 3},
  cardLabel:    {fontSize: 11},
  cardValue:    {fontSize: 15, fontWeight: '700'},
  cardSub:      {fontSize: 12},
  locationRow:  {flexDirection: 'row', alignItems: 'flex-start', gap: 4, marginTop: 2},
  avatar:       {width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center'},
  priceValue:   {fontSize: 22, fontWeight: '900'},
  priceRow:     {flexDirection: 'row', alignItems: 'center', gap: 3},

  twoCol:       {flexDirection: 'row', gap: 10},
  halfCard:     {flex: 1, padding: 14, borderRadius: 16, borderWidth: 1, gap: 6, alignItems: 'center'},

  acceptBtn:    {flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16, borderRadius: 16, marginTop: 6},
  acceptTxt:    {color: '#FFF', fontSize: 16, fontWeight: '800'},
  rejectLink:   {alignItems: 'center', paddingVertical: 12},
  rejectLinkTxt:{fontSize: 14, fontWeight: '700'},

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
