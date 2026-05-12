import React, {useState, useRef, useEffect} from 'react';
import {
  ActivityIndicator,
  Animated,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {useTheme} from '../../shared/context/ThemeContext';
import {useI18n} from '../../shared/i18n/I18nContext';
import OtpScreen from './OtpScreen';
import {login} from '../../services/auth';

const MAX_PHONE_LEN = 10;

export default function LoginScreen() {
  const {colors, isDark} = useTheme();
  const {t} = useI18n();

  const [phone, setPhone]         = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]         = useState(null);
  const [showOtp, setShowOtp]     = useState(false);

  const logoY       = useRef(new Animated.Value(-40)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const formY       = useRef(new Animated.Value(40)).current;
  const formOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(logoY, {toValue: 0, useNativeDriver: true, tension: 50, friction: 9}),
      Animated.timing(logoOpacity, {toValue: 1, duration: 500, useNativeDriver: true}),
    ]).start();
    Animated.parallel([
      Animated.spring(formY, {toValue: 0, delay: 200, useNativeDriver: true, tension: 50, friction: 9}),
      Animated.timing(formOpacity, {toValue: 1, duration: 500, delay: 200, useNativeDriver: true}),
    ]).start();
  }, [formOpacity, formY, logoOpacity, logoY]);

  const handleLogin = async () => {
    if (phone.trim().length < 9) {
      setError(t('auth.invalidPhone'));
      return;
    }
    setError(null);
    setIsLoading(true);
    const res = await login({phone: `${phone.trim()}`, prefix : '966'});
    setIsLoading(false);
    if (res.success) {
      setShowOtp(true);
    } else {
      setError(
        res.error === 'NETWORK_ERROR' ? t('auth.networkError') :
        res.error === 'TIMEOUT'       ? t('auth.networkError') :
        res.data?.message             ?? t('auth.invalidPhone'),
      );
    }
  };

  if (showOtp) {
    return (
      <OtpScreen
        phone={`${phone}`}
        prefix="966"
        onBack={() => setShowOtp(false)}
      />
    );
  }

  return (
    <KeyboardAvoidingView
      style={[s.root, {backgroundColor: colors.bg}]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.bg}
      />
      <ScrollView
        contentContainerStyle={s.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>

        <Animated.View style={[s.logoSection, {opacity: logoOpacity, transform: [{translateY: logoY}]}]}>
          <Image
            source={require('../../../public/logo.png')}
            style={s.logoImg}
            resizeMode="contain"
          />
        </Animated.View>

        <Animated.View style={[s.formWrap, {opacity: formOpacity, transform: [{translateY: formY}]}]}>
          <Text style={[s.title, {color: colors.textPrimary}]}>{t('auth.welcome')}</Text>
          <Text style={[s.subtitle, {color: colors.textSecondary}]}>{t('auth.tagline')}</Text>

          <View style={[
            s.phoneRow,
            {backgroundColor: colors.card, borderColor: error ? colors.danger : colors.border},
          ]}>
            <View style={s.countryCode}>
              <Text style={s.flag}>🇸🇦</Text>
              <Text style={[s.codeText, {color: colors.textPrimary}]}>+966</Text>
            </View>
            <View style={[s.phoneDivider, {backgroundColor: colors.border}]} />
            <TextInput
              style={[s.phoneInput, {color: colors.textPrimary}]}
              placeholderTextColor={colors.textSecondary}
              value={phone}
              onChangeText={v => {
                if (v.length <= MAX_PHONE_LEN) { setPhone(v); setError(null); }
              }}
              keyboardType="phone-pad"
              maxLength={MAX_PHONE_LEN}
              editable={!isLoading}
            />
            <Text style={[s.phoneCounter, {color: colors.textSecondary}]}>{phone.length}/{MAX_PHONE_LEN}</Text>
          </View>

          {error ? <Text style={[s.errorText, {color: colors.danger}]}>{error}</Text> : null}

          <TouchableOpacity
            style={[s.btn, {backgroundColor: colors.primary, opacity: isLoading ? 0.7 : 1}]}
            onPress={handleLogin}
            disabled={isLoading}
            activeOpacity={0.88}>
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <View style={s.btnInner}>
                <Text style={s.btnChevron}>›</Text>
                <Text style={s.btnText}>{t('auth.login')}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={s.guestBtn} activeOpacity={0.7}>
            <Text style={[s.guestText, {color: colors.textSecondary}]}>{t('auth.browseGuest')}</Text>
          </TouchableOpacity>
        </Animated.View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root:        {flex: 1},
  scroll:      {flexGrow: 1, paddingHorizontal: 28, paddingTop: 72, paddingBottom: 40},
  logoSection: {alignItems: 'center', marginBottom: 40},
  logoImg:     {width: 120, height: 120, marginBottom: 10},
  formWrap:    {width: '100%'},
  title:       {fontSize: 26, fontWeight: '800', textAlign: 'center', marginBottom: 10},
  subtitle:    {fontSize: 11, lineHeight: 21, textAlign: 'center', marginBottom: 28},
  phoneRow:    {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderRadius: 14, height: 56, paddingHorizontal: 12,
    marginBottom: 16,
  },
  countryCode: {flexDirection: 'row', alignItems: 'center', gap: 5},
  flag:        {fontSize: 20},
  codeText:    {fontSize: 14, fontWeight: '600'},
  phoneDivider:{width: 1, height: 24, marginHorizontal: 10},
  phoneInput:  {flex: 1, fontSize: 15, height: '100%'},
  phoneCounter:{fontSize: 12},
  errorText:   {fontSize: 12, textAlign: 'center', marginBottom: 12, marginTop: -8},
  btn:         {
    height: 56, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#1B7BF5', shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.35, shadowRadius: 12, elevation: 6,
  },
  btnInner:    {flexDirection: 'row', alignItems: 'center', gap: 8},
  btnChevron:  {color: '#fff', fontSize: 22, lineHeight: 26, fontWeight: '300'},
  btnText:     {color: '#fff', fontSize: 17, fontWeight: '700'},
  guestBtn:    {marginTop: 14, alignItems: 'center', paddingVertical: 10},
  guestText:   {fontSize: 14, fontWeight: '600'},
});
