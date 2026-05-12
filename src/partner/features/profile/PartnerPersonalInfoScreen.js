import React, {useEffect, useState} from 'react';
import {
  ActivityIndicator, Clipboard,
  KeyboardAvoidingView, Platform, ScrollView, StatusBar,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import {ArrowRight, Copy, Check} from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {getMessaging, getToken} from '@react-native-firebase/messaging';
import {useTheme} from '../../../shared/context/ThemeContext';
import {useI18n} from '../../../shared/i18n/I18nContext';
import {getPartnerProfile, updatePartnerProfile} from '../../../services/partner';

function Field({label, value, onChangeText, placeholder, keyboardType, editable = true, colors}) {
  return (
    <View style={s.fieldWrap}>
      <Text style={[s.fieldLabel, {color: colors.textPrimary}]}>{label}</Text>
      <View style={[
        s.inputRow,
        {backgroundColor: colors.card, borderColor: colors.border},
        !editable && {backgroundColor: colors.bg},
      ]}>
        <TextInput
          style={[s.input, {color: colors.textPrimary}]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textSecondary}
          keyboardType={keyboardType || 'default'}
          editable={editable}
          textAlign="right"
        />
      </View>
    </View>
  );
}

export default function PartnerPersonalInfoScreen({onBack}) {
  const {colors, isDark} = useTheme();
  const {t} = useI18n();
  const [firstName, setFirstName] = useState('');
  const [lastName,  setLastName]  = useState('');
  const [phone,     setPhone]     = useState('');
  const [email,     setEmail]     = useState('');
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [fcmToken,  setFcmToken]  = useState('');
  const [copied,    setCopied]    = useState(false);

  useEffect(() => {
    async function load() {
      const [res] = await Promise.all([getPartnerProfile()]);
      if (res.success) {
        const d = res.data?.data ?? res.data ?? {};
        setFirstName(d.firstName ?? '');
        setLastName(d.lastName ?? '');
        setPhone(d.phoneNumber ?? '');
        setEmail(d.email ?? '');
      }

      // Try cached token first, then fetch live from Firebase
      let fcm = await AsyncStorage.getItem('fcm_token').catch(() => null);
      if (!fcm) {
        try {
          fcm = await getToken(getMessaging());
          if (fcm) await AsyncStorage.setItem('fcm_token', fcm).catch(() => {});
        } catch {}
      }
      setFcmToken(fcm ?? '');
      setLoading(false);
    }
    load();
  }, []);

  const handleCopyFcm = () => {
    if (!fcmToken) return;
    Clipboard.setString(fcmToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    await updatePartnerProfile({firstName: firstName.trim(), lastName: lastName.trim()});
    setSaving(false);
    onBack();
  };

  return (
    <KeyboardAvoidingView
      style={[s.root, {backgroundColor: colors.bg}]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.card} />

      <View style={[s.header, {backgroundColor: colors.card, borderBottomColor: colors.border}]}>
        <TouchableOpacity style={[s.backBtn, {backgroundColor: colors.bg}]} onPress={onBack}
          hitSlop={{top: 12, bottom: 12, left: 12, right: 12}}>
          <ArrowRight size={22} color={colors.textPrimary} strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, {color: colors.textPrimary}]}>{t('partner.personalInfo.title')}</Text>
        <View style={{width: 36}} />
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView style={s.scroll} contentContainerStyle={s.content}
          showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={s.section}>
            <Text style={[s.sectionTitle, {color: colors.textSecondary}]}>{t('partner.personalInfo.myInfo')}</Text>
            <Field label={t('partner.personalInfo.fullName')} value={firstName} onChangeText={setFirstName} placeholder={t('partner.personalInfo.fullName')} colors={colors} />
            <Field label={t('partner.personalInfo.fullName') + ' (2)'} value={lastName} onChangeText={setLastName} placeholder="" colors={colors} />
            <Field label={t('partner.personalInfo.phone')} value={phone} onChangeText={setPhone} placeholder={t('partner.personalInfo.phone')} keyboardType="phone-pad" editable={false} colors={colors} />
            <Field label={t('partner.personalInfo.email')} value={email} onChangeText={setEmail} placeholder={t('partner.personalInfo.email')} keyboardType="email-address" editable={false} colors={colors} />

            <View style={s.fieldWrap}>
              <Text style={[s.fieldLabel, {color: colors.textPrimary}]}>FCM Token</Text>
              <View style={[s.inputRow, {backgroundColor: colors.bg, borderColor: colors.border}]}>
                <TextInput
                  style={[s.input, s.fcmInput, {color: colors.textSecondary}]}
                  value={fcmToken || '—'}
                  editable={false}
                  multiline={false}
                  numberOfLines={1}
                  textAlign="left"
                />
                <TouchableOpacity onPress={handleCopyFcm} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
                  {copied
                    ? <Check size={18} color={colors.primary} strokeWidth={2.5} />
                    : <Copy size={18} color={colors.textSecondary} strokeWidth={2} />
                  }
                </TouchableOpacity>
              </View>
            </View>
          </View>
          <View style={{height: 100}} />
        </ScrollView>
      )}

      <View style={[s.footer, {backgroundColor: colors.card, borderTopColor: colors.border}]}>
        <TouchableOpacity style={[s.saveBtn, {backgroundColor: colors.primary}]} onPress={handleSave} activeOpacity={0.85} disabled={saving}>
          <Text style={s.saveBtnText}>{saving ? '...' : t('partner.personalInfo.save')}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root:        {flex: 1},
  center:      {flex: 1, alignItems: 'center', justifyContent: 'center'},
  header:      {
    flexDirection: 'row', alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 56 : 48,
    paddingBottom: 16, paddingHorizontal: 16, borderBottomWidth: 1,
  },
  backBtn:     {width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center'},
  headerTitle: {flex: 1, fontSize: 16, fontWeight: '700', textAlign: 'center'},

  scroll:      {flex: 1},
  content:     {paddingHorizontal: 16, paddingTop: 20, gap: 8},

  section:     {gap: 0, marginBottom: 20},
  sectionTitle:{fontSize: 13, fontWeight: '700', marginBottom: 10, paddingHorizontal: 2},

  fieldWrap:   {gap: 6, marginBottom: 14},
  fieldLabel:  {fontSize: 13, fontWeight: '600', paddingHorizontal: 2},
  inputRow:    {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 14, borderWidth: 1,
    paddingHorizontal: 14, minHeight: 50,
  },
  input:       {flex: 1, fontSize: 14, paddingVertical: 12, textAlign: 'right'},
  fcmInput:    {fontSize: 11, textAlign: 'left'},

  footer:      {padding: 16, paddingBottom: Platform.OS === 'ios' ? 32 : 16, borderTopWidth: 1},
  saveBtn:     {borderRadius: 14, paddingVertical: 16, alignItems: 'center'},
  saveBtnText: {color: '#fff', fontSize: 16, fontWeight: '700'},
});
