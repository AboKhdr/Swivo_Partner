import React, {useState} from 'react';
import {
  KeyboardAvoidingView, Platform, ScrollView, StatusBar,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import {ArrowRight, Calendar} from 'lucide-react-native';
import {useTheme} from '../../../shared/context/ThemeContext';
import {useI18n} from '../../../shared/i18n/I18nContext';

const MOCK_MANAGER = {
  name:  'سالم العتيبي',
  phone: '+966 501 234 567',
  email: 'salem@tamam.sa',
  dob:   '15 , يناير , 1990',
};

function Field({label, value, onChangeText, placeholder, keyboardType, editable = true, Icon, colors}) {
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
        {Icon && (
          <View style={[s.inputIcon, {backgroundColor: colors.primary + '12'}]}>
            <Icon size={18} color={colors.primary} strokeWidth={2} />
          </View>
        )}
      </View>
    </View>
  );
}

export default function PartnerPersonalInfoScreen({onBack}) {
  const {colors, isDark} = useTheme();
  const {t} = useI18n();
  const [name,  setName]  = useState(MOCK_MANAGER.name);
  const [phone, setPhone] = useState(MOCK_MANAGER.phone);
  const [email, setEmail] = useState(MOCK_MANAGER.email);
  const [dob,   setDob]   = useState(MOCK_MANAGER.dob);

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

      <ScrollView style={s.scroll} contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={s.section}>
          <Text style={[s.sectionTitle, {color: colors.textSecondary}]}>{t('partner.personalInfo.myInfo')}</Text>
          <Field label={t('partner.personalInfo.fullName')} value={name}  onChangeText={setName}  placeholder={t('partner.personalInfo.fullName')} colors={colors} />
          <Field label={t('partner.personalInfo.phone')}    value={phone} onChangeText={setPhone} placeholder={t('partner.personalInfo.phone')} keyboardType="phone-pad" colors={colors} />
          <Field label={t('partner.personalInfo.email')}    value={email} onChangeText={setEmail} placeholder={t('partner.personalInfo.email')} keyboardType="email-address" colors={colors} />
          <Field label={t('partner.personalInfo.dob')}      value={dob}   onChangeText={setDob}   placeholder={t('partner.personalInfo.dob')} Icon={Calendar} colors={colors} />
        </View>
        <View style={{height: 100}} />
      </ScrollView>

      <View style={[s.footer, {backgroundColor: colors.card, borderTopColor: colors.border}]}>
        <TouchableOpacity style={[s.saveBtn, {backgroundColor: colors.primary}]} onPress={onBack} activeOpacity={0.85}>
          <Text style={s.saveBtnText}>{t('partner.personalInfo.save')}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root:        {flex: 1},
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
  inputIcon:   {marginLeft: 8, width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center'},

  footer:      {padding: 16, paddingBottom: Platform.OS === 'ios' ? 32 : 16, borderTopWidth: 1},
  saveBtn:     {borderRadius: 14, paddingVertical: 16, alignItems: 'center'},
  saveBtnText: {color: '#fff', fontSize: 16, fontWeight: '700'},
});
