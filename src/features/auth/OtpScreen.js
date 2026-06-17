import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  ActivityIndicator,
  Animated,
  Image,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {useTheme} from '../../shared/context/ThemeContext';
import {useI18n} from '../../shared/i18n/I18nContext';
import {verifyOTP, resendOTP} from '../../services/auth';

const OTP_LENGTH = 6;
const RESEND_DELAY = 30;
const MAX_ATTEMPTS = 5;
const LOCKOUT_SECONDS = 60;

export default function OtpScreen({phone, prefix, onBack}) {
  const {colors, isDark} = useTheme();
  const {t, isRTL} = useI18n();

  const [digits, setDigits]       = useState(Array(OTP_LENGTH).fill(''));
  const [activeIdx, setActiveIdx] = useState(0);
  const [error, setError]         = useState(null);
  const [resendSec, setResendSec] = useState(RESEND_DELAY);
  const [isLoading, setIsLoading] = useState(false);
  const [attempts, setAttempts]   = useState(0);
  const [lockSec, setLockSec]     = useState(0);

  const inputRefs = useRef([]);
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  {toValue: 1, duration: 450, useNativeDriver: true}),
      Animated.spring(slideAnim, {toValue: 0, tension: 60, friction: 10, useNativeDriver: true}),
    ]).start();
    inputRefs.current[0]?.focus();
  }, [fadeAnim, slideAnim]);

  useEffect(() => {
    if (resendSec <= 0) return;
    const id = setTimeout(() => setResendSec(s => s - 1), 1000);
    return () => clearTimeout(id);
  }, [resendSec]);

  useEffect(() => {
    if (lockSec <= 0) return;
    const id = setTimeout(() => setLockSec(s => s - 1), 1000);
    return () => clearTimeout(id);
  }, [lockSec]);

  const shake = useCallback(() => {
    Animated.sequence([
      Animated.timing(shakeAnim, {toValue: 10,  duration: 60, useNativeDriver: true}),
      Animated.timing(shakeAnim, {toValue: -10, duration: 60, useNativeDriver: true}),
      Animated.timing(shakeAnim, {toValue: 6,   duration: 50, useNativeDriver: true}),
      Animated.timing(shakeAnim, {toValue: -6,  duration: 50, useNativeDriver: true}),
      Animated.timing(shakeAnim, {toValue: 0,   duration: 40, useNativeDriver: true}),
    ]).start();
  }, [shakeAnim]);

  const handleDigit = useCallback((text, idx) => {
    const val = text.replace(/[^0-9]/g, '').slice(-1);
    setError(null);
    const next = [...digits];
    next[idx] = val;
    setDigits(next);
    if (val && idx < OTP_LENGTH - 1) {
      inputRefs.current[idx + 1]?.focus();
      setActiveIdx(idx + 1);
    }
  }, [digits]);

  const handleKeyPress = useCallback(({nativeEvent}, idx) => {
    if (nativeEvent.key === 'Backspace' && !digits[idx] && idx > 0) {
      const next = [...digits];
      next[idx - 1] = '';
      setDigits(next);
      inputRefs.current[idx - 1]?.focus();
      setActiveIdx(idx - 1);
    }
  }, [digits]);

  const handleVerify = useCallback(async () => {
    if (lockSec > 0) {
      shake();
      setError(t('auth.otp.lockedOut', {seconds: lockSec}));
      return;
    }
    const code = digits.join('');
    if (code.length < OTP_LENGTH) {
      setError(t('auth.otp.invalidCode'));
      shake();
      return;
    }
    setIsLoading(true);
    setError(null);
    const res = await verifyOTP({phone, prefix : "966", code});
    setIsLoading(false);
    if (res.success) {
      setAttempts(0);
      // verifyOTP already called setSession → role updates → App re-renders automatically
    } else {
      shake();
      const nextAttempts = attempts + 1;
      setAttempts(nextAttempts);

      const networkErr = res.error === 'NETWORK_ERROR' || res.error === 'TIMEOUT';
      const baseMsg = networkErr
        ? t('auth.networkError')
        : (res.data?.message ?? t('auth.otp.invalidCode'));

      if (!networkErr && nextAttempts >= MAX_ATTEMPTS) {
        setLockSec(LOCKOUT_SECONDS);
        setError(t('auth.otp.tooManyAttempts'));
      } else if (!networkErr) {
        const remaining = MAX_ATTEMPTS - nextAttempts;
        setError(`${baseMsg} · ${t('auth.otp.attemptsRemaining', {count: remaining})}`);
      } else {
        setError(baseMsg);
      }

      setDigits(Array(OTP_LENGTH).fill(''));
      setActiveIdx(0);
      inputRefs.current[0]?.focus();
    }
  }, [digits, phone, t, shake, attempts, lockSec]);

  const handleResend = useCallback(async () => {
    if (resendSec > 0) return;
    setDigits(Array(OTP_LENGTH).fill(''));
    setError(null);
    setResendSec(RESEND_DELAY);
    inputRefs.current[0]?.focus();
    setActiveIdx(0);
    await resendOTP({phone, prefix});
  }, [resendSec, phone, prefix]);

  const filled = digits.filter(Boolean).length;

  return (
    <KeyboardAvoidingView
      style={[s.root, {backgroundColor: colors.bg}]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.bg}
      />

      <Animated.View style={[s.inner, {opacity: fadeAnim, transform: [{translateY: slideAnim}]}]}>

        {/* Logo */}
        <View style={s.logoWrap}>
          <Image
            source={require('../../../public/logo.png')}
            style={s.logo}
            resizeMode="contain"
          />
        </View>

        {/* Heading */}
        <Text style={[s.title, {color: colors.textPrimary}]}>{t('auth.otp.title')}</Text>
        <Text style={[s.subtitle, {color: colors.textSecondary}]}>{t('auth.otp.subtitle')}</Text>

        {phone ? (
          <View style={[s.phoneBadge, {backgroundColor: colors.primary + '15', borderColor: colors.primary + '30'}]}>
            <Text style={[s.phoneTxt, {color: colors.primary}]}>{phone}</Text>
          </View>
        ) : null}

        {/* OTP boxes */}
        <Animated.View style={[s.boxRow, {transform: [{translateX: shakeAnim}], direction :"ltr"}]}>
          {digits.map((d, idx) => (
            <TouchableOpacity
              key={idx}
              activeOpacity={0.9}
              onPress={() => { inputRefs.current[idx]?.focus(); setActiveIdx(idx); }}>
              <View style={[
                s.box,
                {
                  backgroundColor: colors.card,
                  borderColor: activeIdx === idx
                    ? colors.primary
                    : error
                      ? colors.danger
                      : d
                        ? colors.primary + '60'
                        : colors.border,
                  borderWidth: activeIdx === idx ? 2 : 1.5,
                },
              ]}>
                <TextInput
                  ref={r => { inputRefs.current[idx] = r; }}
                  style={[s.boxInput, {color: colors.textPrimary}]}
                  value={d}
                  onChangeText={text => handleDigit(text, idx)}
                  onKeyPress={e => handleKeyPress(e, idx)}
                  onFocus={() => setActiveIdx(idx)}
                  keyboardType="number-pad"
                  maxLength={1}
                  textAlign="center"
                  caretHidden
                />
              </View>
            </TouchableOpacity>
          ))}
        </Animated.View>

        {error ? (
          <Text style={[s.errorTxt, {color: colors.danger}]}>{error}</Text>
        ) : null}

        {/* Next button */}
        <TouchableOpacity
          style={[s.btn, {backgroundColor: filled === OTP_LENGTH && !isLoading && lockSec === 0 ? colors.primary : colors.border}]}
          onPress={handleVerify}
          disabled={filled < OTP_LENGTH || isLoading || lockSec > 0}
          activeOpacity={0.85}>
          {isLoading ? (
            <ActivityIndicator color="#FFF" />
          ) : lockSec > 0 ? (
            <Text style={[s.btnTxt, {color: colors.textSecondary}]}>
              {t('auth.otp.lockedOut', {seconds: lockSec})}
            </Text>
          ) : (
            <Text style={[s.btnTxt, {color: filled === OTP_LENGTH ? '#FFF' : colors.textSecondary}]}>
              {t('auth.otp.next')}
            </Text>
          )}
        </TouchableOpacity>

        {/* Resend */}
        <TouchableOpacity
          onPress={handleResend}
          disabled={resendSec > 0}
          activeOpacity={0.7}
          style={s.resendRow}>
          <Text style={[s.resendTxt, {color: resendSec > 0 ? colors.textSecondary : colors.primary}]}>
            {resendSec > 0
              ? `${t('auth.otp.resendIn')} 00:${String(resendSec).padStart(2, '0')}`
              : t('auth.otp.resend')}
          </Text>
        </TouchableOpacity>

      </Animated.View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root:       {flex: 1},
  inner:      {flex: 1, paddingHorizontal: 28, paddingTop: 60, paddingBottom: 40, alignItems: 'center'},

  logoWrap:   {marginBottom: 28},
  logo:       {width: 90, height: 90},

  title:      {fontSize: 22, fontWeight: '800', textAlign: 'center', marginBottom: 10},
  subtitle:   {fontSize: 13, lineHeight: 21, textAlign: 'center', marginBottom: 16, paddingHorizontal: 10},

  phoneBadge: {
    paddingHorizontal: 18, paddingVertical: 8,
    borderRadius: 50, borderWidth: 1, marginBottom: 32,
  },
  phoneTxt:   {fontSize: 15, fontWeight: '700'},

  boxRow:     {flexDirection: 'row', gap: 8, marginBottom: 16},
  box:        {
    width: 50, height: 55,
    borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  boxInput:   {
    width: 44, height: 44,
    fontSize: 28, fontWeight: '800',
    textAlign: 'center', padding: 0,
  },

  errorTxt:   {fontSize: 13, fontWeight: '600', marginBottom: 12},

  btn:        {
    width: '100%', height: 56,
    borderRadius: 16, alignItems: 'center', justifyContent: 'center',
    marginTop: 8, marginBottom: 20,
  },
  btnTxt:     {fontSize: 17, fontWeight: '700'},

  resendRow:  {alignItems: 'center'},
  resendTxt:  {fontSize: 13, fontWeight: '600'},
});
