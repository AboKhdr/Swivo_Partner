import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  ActivityIndicator,
  Animated,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {Zap, X, User, MapPin, DollarSign, Droplets, Car, Hash, Phone} from 'lucide-react-native';
import {useTheme} from '../../../shared/context/ThemeContext';
import {useI18n} from '../../../shared/i18n/I18nContext';
import {cancelIncomingOrderNotification, RING_MAX_MS} from '../../../services/notificationChannel';

const TIMEOUT_SECONDS = Math.floor(RING_MAX_MS / 1000);

// ── Safe string: handles {ar, en} objects ──────────────────────────────────────
function sv(val, lang) {
  if (!val) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'object') return (lang && val[lang]) ?? val.ar ?? val.en ?? '';
  return String(val);
}

// ── Resolve all display fields from the new API shape ─────────────────────────
function resolveFields(order, lang) {
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
  const serviceName = sv(firstSvc?.name, lang)
    || sv(order.itemsSnapshot?.[0]?.nameSnapshot, lang)
    || sv(order.service?.name, lang)
    || (typeof order.service === 'string' ? order.service : '');

  const carBrand = sv(order.car?.brand, lang) || sv(order.userCar?.brand?.name, lang);
  const carModel = sv(order.car?.model, lang) || sv(order.userCar?.model?.name, lang);
  const carColor = sv(order.car?.color, lang) || '';
  const carDisplay = [carBrand, carModel].filter(Boolean).join(' ') || order.carModel || '';

  const plate = order.car?.plateNumber
    ?? order.userCar?.plateNumber
    ?? order.plate
    ?? '';

  // البايكر يرى أرباحه (bikerEarning) وليس السعر الكلي
  const earning = order.bikerEarning ?? order.totalAmount ?? order.price ?? null;

  return {clientName, clientPhone, location, serviceName, carDisplay, carColor, plate, earning};
}

// ── Info Row ──────────────────────────────────────────────────────────────────
function InfoCard({IconComp, iconColor, label, value, colors}) {
  return (
    <View style={[c.card, {backgroundColor: colors.card, borderColor: colors.border}]}>
      <View style={[c.iconCircle, {backgroundColor: iconColor + '18'}]}>
        <IconComp size={20} color={iconColor} strokeWidth={2} />
      </View>
      <View style={c.cardInfo}>
        <Text style={[c.cardLabel, {color: colors.textSecondary}]}>{label}</Text>
        <Text style={[c.cardValue, {color: colors.textPrimary}]} numberOfLines={2}>{value || '—'}</Text>
      </View>
    </View>
  );
}

export default function BikerIncomingOrderScreen({visible, order, onAccept, onReject}) {
  const {colors} = useTheme();
  const {t, lang} = useI18n();

  const [secondsLeft, setSecondsLeft] = useState(TIMEOUT_SECONDS);
  const [busy, setBusy]               = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const ringAnim  = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      setSecondsLeft(TIMEOUT_SECONDS);
      setBusy(false);
    }
  }, [visible]);

  // Pulse on title
  useEffect(() => {
    if (!visible) return;
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {toValue: 1.06, duration: 700, useNativeDriver: true}),
        Animated.timing(pulseAnim, {toValue: 1,    duration: 700, useNativeDriver: true}),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [visible, pulseAnim]);

  // Ring glow pulse on accept button
  useEffect(() => {
    if (!visible) return;
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(ringAnim, {toValue: 1.08, duration: 900, useNativeDriver: true}),
        Animated.timing(ringAnim, {toValue: 1,    duration: 900, useNativeDriver: true}),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [visible, ringAnim]);

  // Countdown → auto-reject on timeout
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

  const handleSkip = useCallback(() => {
    if (busy) return;
    cancelIncomingOrderNotification().catch(() => {});
    onReject({reason: 'SKIP'});
  }, [onReject, busy]);

  const minutes   = Math.floor(secondsLeft / 60);
  const secs      = secondsLeft % 60;
  const timeStr   = `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  // Progress 1 → 0 as time runs out
  const progress  = secondsLeft / TIMEOUT_SECONDS;
  const timerColor = progress > 0.4 ? colors.primary : progress > 0.2 ? '#F59E0B' : '#EF4444';

  const {clientName, clientPhone, location, serviceName, carDisplay, carColor, plate, earning} =
    resolveFields(order, lang);

  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent>
      <View style={c.overlay}>
        <View style={[c.sheet, {backgroundColor: colors.bg}]}>

          {/* ── Header ── */}
          <View style={[c.header, {backgroundColor: colors.primary}]}>
            {/* Close / skip */}
            <TouchableOpacity style={c.closeBtn} onPress={handleSkip} hitSlop={{top:10,bottom:10,left:10,right:10}}>
              <X size={20} color="rgba(255,255,255,0.8)" strokeWidth={2.5} />
            </TouchableOpacity>

            {/* Live badge */}
            <View style={c.liveBadge}>
              <View style={c.liveDot} />
              <Text style={c.liveTxt}>LIVE</Text>
            </View>

            <Animated.Text style={[c.mainTitle, {transform: [{scale: pulseAnim}]}]}>
              🚗 طلب جديد!
            </Animated.Text>

            {/* Countdown ring */}
            <View style={[c.timerBox, {borderColor: timerColor + '60'}]}>
              <Text style={[c.timerNum, {color: '#fff'}]}>{timeStr}</Text>
              <Text style={[c.timerLabel, {color: 'rgba(255,255,255,0.75)'}]}>ثانية متبقية</Text>
            </View>
          </View>

          {/* ── Body ── */}
          <ScrollView
            contentContainerStyle={c.body}
            showsVerticalScrollIndicator={false}>

            {/* Client */}
            <View style={[c.card, {backgroundColor: colors.card, borderColor: colors.border}]}>
              <View style={[c.iconCircle, {backgroundColor: colors.primary + '18'}]}>
                <User size={20} color={colors.primary} strokeWidth={2} />
              </View>
              <View style={c.cardInfo}>
                <Text style={[c.cardLabel, {color: colors.textSecondary}]}>العميل</Text>
                <Text style={[c.cardValue, {color: colors.textPrimary}]}>{clientName || '—'}</Text>
                {!!clientPhone && (
                  <View style={c.phoneRow}>
                    <Phone size={11} color={colors.textSecondary} strokeWidth={2} />
                    <Text style={[c.cardSub, {color: colors.textSecondary}]}>{clientPhone}</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Location */}
            {!!location && (
              <View style={[c.card, {backgroundColor: colors.card, borderColor: colors.border}]}>
                <View style={[c.iconCircle, {backgroundColor: '#3B82F618'}]}>
                  <MapPin size={20} color="#3B82F6" strokeWidth={2} />
                </View>
                <View style={c.cardInfo}>
                  <Text style={[c.cardLabel, {color: colors.textSecondary}]}>الموقع</Text>
                  <Text style={[c.cardValue, {color: colors.textPrimary}]} numberOfLines={3}>{location}</Text>
                </View>
              </View>
            )}

            {/* Service */}
            {!!serviceName && (
              <InfoCard
                IconComp={Droplets}
                iconColor="#06B6D4"
                label={t('orders.fields.washType')}
                value={serviceName}
                colors={colors}
              />
            )}

            {/* Car + Plate */}
            {(!!carDisplay || !!plate) && (
              <View style={c.twoCol}>
                {!!carDisplay && (
                  <View style={[c.halfCard, {backgroundColor: colors.card, borderColor: colors.border}]}>
                    <View style={[c.iconCircle, {backgroundColor: '#8B5CF618'}]}>
                      <Car size={18} color="#8B5CF6" strokeWidth={2} />
                    </View>
                    <Text style={[c.cardLabel, {color: colors.textSecondary}]}>{t('orders.fields.carType')}</Text>
                    <Text style={[c.halfValue, {color: colors.textPrimary}]}>
                      {carDisplay}{carColor ? `\n${carColor}` : ''}
                    </Text>
                  </View>
                )}
                {!!plate && (
                  <View style={[c.halfCard, {backgroundColor: colors.card, borderColor: colors.border}]}>
                    <View style={[c.iconCircle, {backgroundColor: '#F59E0B18'}]}>
                      <Hash size={18} color="#F59E0B" strokeWidth={2} />
                    </View>
                    <Text style={[c.cardLabel, {color: colors.textSecondary}]}>{t('orders.fields.plate')}</Text>
                    <Text style={[c.halfValue, {color: colors.textPrimary}]}>{plate}</Text>
                  </View>
                )}
              </View>
            )}

            {/* Earning */}
            {earning !== null && earning !== undefined && (
              <View style={[c.earningCard, {backgroundColor: colors.primary + '12', borderColor: colors.primary + '30'}]}>
                <DollarSign size={22} color={colors.primary} strokeWidth={2} />
                <Text style={[c.earningLabel, {color: colors.textSecondary}]}>أرباحك من هذا الطلب</Text>
                <Text style={[c.earningValue, {color: colors.primary}]}>﷼ {earning}</Text>
              </View>
            )}

          </ScrollView>

          {/* ── Accept button ── */}
          <View style={[c.footer, {backgroundColor: colors.bg, borderTopColor: colors.border}]}>
            <Animated.View style={[c.acceptWrap, {transform: [{scale: ringAnim}]}]}>
              <TouchableOpacity
                style={[c.acceptBtn, {backgroundColor: colors.primary, opacity: busy ? 0.75 : 1}]}
                onPress={handleAccept}
                disabled={busy}
                activeOpacity={0.85}>
                {busy ? (
                  <ActivityIndicator color="#FFF" size="large" />
                ) : (
                  <>
                    <Zap size={24} color="#FFF" fill="#FFF" strokeWidth={2} />
                    <Text style={c.acceptTxt}>قبول الطلب</Text>
                  </>
                )}
              </TouchableOpacity>
            </Animated.View>
            <TouchableOpacity
              style={c.skipBtn}
              onPress={handleSkip}
              disabled={busy}
              activeOpacity={0.7}>
              <Text style={[c.skipTxt, {color: colors.textSecondary}]}>تخطي</Text>
            </TouchableOpacity>
          </View>

        </View>
      </View>
    </Modal>
  );
}

const c = StyleSheet.create({
  overlay:      {flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.55)'},
  sheet:        {borderTopLeftRadius: 32, borderTopRightRadius: 32, overflow: 'hidden', maxHeight: '90%'},

  // Header
  header:       {paddingTop: 20, paddingBottom: 24, paddingHorizontal: 20, alignItems: 'center', gap: 10},
  closeBtn:     {position: 'absolute', top: 18, right: 18, width: 34, height: 34, alignItems: 'center', justifyContent: 'center'},
  liveBadge:    {flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 14, paddingVertical: 5, borderRadius: 50},
  liveDot:      {width: 7, height: 7, borderRadius: 4, backgroundColor: '#FFF'},
  liveTxt:      {color: '#FFF', fontSize: 11, fontWeight: '800', letterSpacing: 1},
  mainTitle:    {color: '#FFF', fontSize: 26, fontWeight: '900'},
  timerBox:     {borderWidth: 1.5, borderRadius: 14, paddingHorizontal: 20, paddingVertical: 8, alignItems: 'center'},
  timerNum:     {fontSize: 28, fontWeight: '900', fontVariant: ['tabular-nums']},
  timerLabel:   {fontSize: 11, marginTop: -2},

  // Body
  body:         {padding: 14, gap: 10, paddingBottom: 6},

  // Cards
  card:         {flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 14, borderRadius: 16, borderWidth: 1},
  iconCircle:   {width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center'},
  cardInfo:     {flex: 1, gap: 2},
  cardLabel:    {fontSize: 11},
  cardValue:    {fontSize: 14, fontWeight: '700'},
  cardSub:      {fontSize: 12},
  phoneRow:     {flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2},

  // Two-column
  twoCol:       {flexDirection: 'row', gap: 10},
  halfCard:     {flex: 1, padding: 14, borderRadius: 16, borderWidth: 1, alignItems: 'center', gap: 6},
  halfValue:    {fontSize: 13, fontWeight: '700', textAlign: 'center'},

  // Earning highlight
  earningCard:  {flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16, borderRadius: 16, borderWidth: 1},
  earningLabel: {flex: 1, fontSize: 13},
  earningValue: {fontSize: 22, fontWeight: '900'},

  // Footer
  footer:       {padding: 16, paddingBottom: 28, borderTopWidth: 1, gap: 10},
  acceptWrap:   {},
  acceptBtn:    {flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 18, borderRadius: 18},
  acceptTxt:    {color: '#FFF', fontSize: 18, fontWeight: '900'},
  skipBtn:      {alignItems: 'center', paddingVertical: 8},
  skipTxt:      {fontSize: 14, fontWeight: '600'},
});
