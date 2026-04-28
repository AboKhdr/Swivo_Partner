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
import {Colors} from '../../shared/constants/colors';

const MAX_PHONE_LEN = 10;

export default function LoginScreen({onLogin, onGuest}) {
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const logoY = useRef(new Animated.Value(-40)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const formY = useRef(new Animated.Value(40)).current;
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

  const handleLogin = () => {
    if (phone.trim().length < 9) {
      setError('الرجاء إدخال رقم هاتف صحيح');
      return;
    }
    setError(null);
    setIsLoading(true);
    // TODO: POST /api/auth/signin/credentials
    setTimeout(() => { setIsLoading(false); onLogin(); }, 800);
  };

  return (
    <KeyboardAvoidingView style={s.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <ScrollView
        contentContainerStyle={s.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>

        {/* Logo */}
        <Animated.View style={[s.logoSection, {opacity: logoOpacity, transform: [{translateY: logoY}]}]}>
          <Image
            source={require('../../../public/logo.png')}
            style={s.logoImg}
            resizeMode="contain"
          />
        </Animated.View>

        {/* Form */}
        <Animated.View style={[s.formWrap, {opacity: formOpacity, transform: [{translateY: formY}]}]}>
          <Text style={s.title}>حيّاك الله!</Text>
          <Text style={s.subtitle}>
            سجّل دخولك وتابع خدمات عملاءك في Swivo. خبيركم{'\n'}الشخص للوصل لغسيل السيارات لين يوصل عند بابك!
          </Text>

          {/* Phone input */}
          <View style={[s.phoneRow, error ? s.phoneRowError : null]}>
            <View style={s.countryCode}>
              <Text style={s.flag}>🇸🇦</Text>
              <Text style={s.codeText}>+966</Text>
            </View>
            <View style={s.phoneDivider} />
            <TextInput
              style={s.phoneInput}
              placeholderTextColor="#B0BEC5"
              value={phone}
              onChangeText={v => {
                if (v.length <= MAX_PHONE_LEN) { setPhone(v); setError(null); }
              }}
              keyboardType="phone-pad"
              maxLength={MAX_PHONE_LEN}
              editable={!isLoading}
            />
            <Text style={s.phoneCounter}>{phone.length}/{MAX_PHONE_LEN}</Text>
          </View>

          {error ? <Text style={s.errorText}>{error}</Text> : null}

          {/* Login button */}
          <TouchableOpacity
            style={[s.btn, isLoading && {opacity: 0.7}]}
            onPress={handleLogin}
            disabled={isLoading}
            activeOpacity={0.88}>
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <View style={s.btnInner}>
                <Text style={s.btnChevron}>›</Text>
                <Text style={s.btnText}>تسجيل الدخول</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Guest button */}
          <TouchableOpacity style={s.guestBtn} onPress={onGuest} activeOpacity={0.7}>
            <Text style={s.guestText}>تصفح كزائر</Text>
          </TouchableOpacity>
        </Animated.View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root: {flex: 1, backgroundColor: '#fff'},
  scroll: {flexGrow: 1, paddingHorizontal: 28, paddingTop: 72, paddingBottom: 40},
  logoSection: {alignItems: 'center', marginBottom: 40},
  logoImg: {width: 120, height: 120, marginBottom: 10},
  appName: {fontSize: 26, fontWeight: '800', color: Colors.textPrimary, letterSpacing: -0.5},
  appTagline: {fontSize: 13, color: Colors.textSecondary, marginTop: 2},
  formWrap: {width: '100%'},
  title: {fontSize: 26, fontWeight: '800', color: Colors.textPrimary, textAlign: 'right', marginBottom: 10},
  subtitle: {fontSize: 11, color: Colors.textSecondary, textAlign: 'right', lineHeight: 21, marginBottom: 28},
  phoneRow: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: 14, height: 56, paddingHorizontal: 12,
    backgroundColor: '#FAFBFC', marginBottom: 16,
  },
  phoneRowError: {borderColor: Colors.danger},
  countryCode: {flexDirection: 'row', alignItems: 'center', gap: 5},
  flag: {fontSize: 20},
  codeText: {fontSize: 14, fontWeight: '600', color: Colors.textPrimary},
  chevronDown: {fontSize: 14, color: Colors.textSecondary},
  phoneDivider: {width: 1, height: 24, backgroundColor: Colors.border, marginHorizontal: 10},
  phoneInput: {flex: 1, fontSize: 15, color: Colors.textPrimary, height: '100%'},
  phoneCounter: {fontSize: 12, color: Colors.textSecondary},
  errorText: {color: Colors.danger, fontSize: 12, textAlign: 'right', marginBottom: 12, marginTop: -8},
  btn: {
    height: 56, borderRadius: 14, backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.primary, shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.35, shadowRadius: 12, elevation: 6,
  },
  btnInner: {flexDirection: 'row', alignItems: 'center', gap: 8},
  btnChevron: {color: '#fff', fontSize: 22, lineHeight: 26, fontWeight: '300'},
  btnText: {color: '#fff', fontSize: 17, fontWeight: '700'},
  guestBtn: {marginTop: 14, alignItems: 'center', paddingVertical: 10},
  guestText: {fontSize: 14, color: Colors.textSecondary, fontWeight: '600'},
});
