import React, {useState} from 'react';
import {
  KeyboardAvoidingView, Platform, ScrollView, StatusBar,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import {ChevronLeft, Calendar, MapPin} from 'lucide-react-native';
import {useTheme} from '../../../shared/context/ThemeContext';
import {useI18n} from '../../../shared/i18n/I18nContext';
import {MOCK_USER} from '../../../shared/data/mockData';

function Field({label, value, onChangeText, placeholder, keyboardType, editable = true, Icon, colors}) {
  return (
    <View style={s.fieldWrap}>
      <Text style={[s.fieldLabel, {color: colors.textPrimary}]}>{label}</Text>
      <View style={[
        s.inputRow,
        {backgroundColor: colors.card, borderColor: colors.border},
        !editable && s.inputRowDisabled,
      ]}>
        <TextInput
          style={[s.input, {color: colors.textPrimary}]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#C0C0C0"
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

export default function PersonalInfoScreen({onBack}) {
  const {colors, isDark} = useTheme();
  const {t} = useI18n();
  const [name, setName] = useState(`${MOCK_USER.firstName} ${MOCK_USER.lastName}`);
  const [phone, setPhone] = useState('+965 988 965 27');
  const [email, setEmail] = useState('User@Gmaill.Com');
  const [birthDate, setBirthDate] = useState('25 , ابريل , 2004');
  const [branchName] = useState('3071, an nafel, Riyadh');

  const handleSave = () => {
    onBack();
  };

  return (
    <KeyboardAvoidingView
      style={[s.root, {backgroundColor: colors.bg}]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.card}
      />

      {/* Header */}
      <View style={[s.header, {backgroundColor: colors.card, borderBottomColor: colors.border}]}>
        <TouchableOpacity
          style={[s.backBtn, {backgroundColor: colors.bg}]}
          onPress={onBack}
          hitSlop={{top:12,bottom:12,left:12,right:12}}>
          <ChevronLeft size={22} color={colors.textPrimary} strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, {color: colors.textPrimary}]}>{t('personalInfo.title')}</Text>
        <View style={{width: 36}} />
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">

        {/* معلوماتي */}
        <View style={s.section}>
          <Text style={[s.sectionTitle, {color: colors.textSecondary}]}>{t('personalInfo.myInfo')}</Text>

          <Field label={t('personalInfo.name')} value={name} onChangeText={setName} placeholder={t('personalInfo.name')} colors={colors} />
          <Field label={t('personalInfo.phone')} value={phone} onChangeText={setPhone} placeholder={t('personalInfo.phone')} keyboardType="phone-pad" colors={colors} />
          <Field label={t('personalInfo.email')} value={email} onChangeText={setEmail} placeholder={t('personalInfo.email')} keyboardType="email-address" colors={colors} />
          <Field label={t('personalInfo.dob')} value={birthDate} onChangeText={setBirthDate} placeholder={t('personalInfo.dob')} Icon={Calendar} colors={colors} />
        </View>

        <View style={s.section}>
          <Text style={[s.sectionTitle, {color: colors.textSecondary}]}>{t('personalInfo.workArea')}</Text>
          <Field label={t('personalInfo.workArea')} value={branchName} editable={false} Icon={MapPin} colors={colors} />
        </View>

        <View style={{height: 100}} />
      </ScrollView>

      {/* Save button pinned at bottom */}
      <View style={[s.footer, {backgroundColor: colors.card, borderTopColor: colors.border}]}>
        <TouchableOpacity
          style={[s.saveBtn, {backgroundColor: colors.primary}]}
          onPress={handleSave}
          activeOpacity={0.85}>
          <Text style={s.saveBtnText}>{t('personalInfo.edit')}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root: {flex: 1},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 56 : 48,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: {
    flex: 1, fontSize: 16, fontWeight: '700',
    textAlign: 'center',
  },
  scroll: {flex: 1},
  content: {paddingHorizontal: 16, paddingTop: 20, gap: 8},
  section: {gap: 0, marginBottom: 20},
  sectionTitle: {
    fontSize: 13, fontWeight: '700',
    marginBottom: 10, paddingHorizontal: 2,
  },
  fieldWrap: {gap: 6, marginBottom: 14},
  fieldLabel: {
    fontSize: 13, fontWeight: '600',
    paddingHorizontal: 2,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    minHeight: 50,
  },
  inputRowDisabled: {
    backgroundColor: '#F8FAFC',
  },
  input: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 12,
    textAlign: 'right',
  },
  inputIcon: {
    marginLeft: 8,
    width: 32, height: 32,
    borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  footer: {
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
    borderTopWidth: 1,
  },
  saveBtn: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#fff', fontSize: 16, fontWeight: '700',
  },
});
