import React, {useState} from 'react';
import {
  KeyboardAvoidingView, Platform, ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import {ArrowRight, MessageCircle, Phone, Mail, Send} from 'lucide-react-native';
import {useTheme} from '../../../shared/context/ThemeContext';
import {useI18n} from '../../../shared/i18n/I18nContext';
import {sendSupportMessage} from '../../../services/partner';

const CONTACT_ITEMS = [
  {Icon: Phone, key: 'callUs',  value: '920001234',        color: '#22C55E'},
  {Icon: Mail,  key: 'email',   value: 'support@tamam.sa', color: '#1B7BF5'},
];

export default function SupportScreen({onBack}) {
  const {colors} = useTheme();
  const {t} = useI18n();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sent,    setSent]    = useState(false);

  const [sending, setSending] = useState(false);
  const canSend = subject.trim() && message.trim();

  const handleSend = async () => {
    if (!canSend || sending) return;
    setSending(true);
    await sendSupportMessage(subject.trim(), message.trim());
    setSending(false);
    setSent(true);
    setSubject('');
    setMessage('');
  };

  return (
    <KeyboardAvoidingView
      style={[s.root, {backgroundColor: colors.bg}]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

      <View style={[s.header, {backgroundColor: colors.card, borderBottomColor: colors.border}]}>
        <TouchableOpacity onPress={onBack} style={[s.backBtn, {backgroundColor: colors.bg}]}
          hitSlop={{top: 12, bottom: 12, left: 12, right: 12}}>
          <ArrowRight size={22} color={colors.textPrimary} strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, {color: colors.textPrimary}]}>{t('partner.support.title')}</Text>
        <View style={{width: 36}} />
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">

        <View style={s.contactRow}>
          {CONTACT_ITEMS.map(({Icon, key, value, color}) => (
            <View key={key} style={[s.contactCard, {backgroundColor: colors.card, borderColor: colors.border}]}>
              <View style={[s.contactIcon, {backgroundColor: color + '18'}]}>
                <Icon size={20} color={color} />
              </View>
              <Text style={[s.contactLabel, {color: colors.textSecondary}]}>{t(`partner.support.${key}`)}</Text>
              <Text style={[s.contactValue, {color: colors.textPrimary}]}>{value}</Text>
            </View>
          ))}
        </View>

        <View style={[s.formCard, {backgroundColor: colors.card, borderColor: colors.border}]}>
          <View style={s.formHeader}>
            <MessageCircle size={18} color={colors.primary} />
            <Text style={[s.formTitle, {color: colors.textPrimary}]}>{t('partner.support.sendMessage')}</Text>
          </View>
          <View style={[s.sep, {backgroundColor: colors.border}]} />
          <View style={s.formBody}>
            <Text style={[s.fieldLabel, {color: colors.textSecondary}]}>{t('partner.support.subject')}</Text>
            <View style={[s.inputBox, {backgroundColor: colors.bg, borderColor: colors.border}]}>
              <TextInput
                style={[s.input, {color: colors.textPrimary}]}
                placeholder={t('partner.support.subjectPlaceholder')}
                placeholderTextColor={colors.textSecondary}
                value={subject}
                onChangeText={setSubject}
                textAlign="right"
              />
            </View>
            <Text style={[s.fieldLabel, {color: colors.textSecondary}]}>{t('partner.support.message')}</Text>
            <View style={[s.inputBox, s.textAreaBox, {backgroundColor: colors.bg, borderColor: colors.border}]}>
              <TextInput
                style={[s.input, s.textArea, {color: colors.textPrimary}]}
                placeholder={t('partner.support.messagePlaceholder')}
                placeholderTextColor={colors.textSecondary}
                value={message}
                onChangeText={setMessage}
                multiline
                textAlignVertical="top"
                textAlign="right"
              />
            </View>
          </View>
        </View>

        {sent && (
          <View style={[s.successBox, {backgroundColor: '#22C55E18', borderColor: '#22C55E44'}]}>
            <Text style={[s.successText, {color: '#22C55E'}]}>{t('partner.support.successMsg')}</Text>
          </View>
        )}

        <TouchableOpacity
          style={[s.sendBtn, {backgroundColor: canSend ? colors.primary : colors.border}]}
          onPress={handleSend} disabled={!canSend} activeOpacity={0.85}>
          <Send size={18} color="#FFF" />
          <Text style={s.sendTxt}>{t('partner.support.send')}</Text>
        </TouchableOpacity>

        <View style={{height: 32}} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root:         {flex: 1},
  header:       {
    flexDirection: 'row', alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 56 : 48,
    paddingBottom: 16, paddingHorizontal: 16, borderBottomWidth: 1,
  },
  backBtn:      {width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center'},
  headerTitle:  {flex: 1, fontSize: 16, fontWeight: '700', textAlign: 'center'},

  content:      {padding: 16, gap: 14},

  contactRow:   {flexDirection: 'row', gap: 12},
  contactCard:  {
    flex: 1, alignItems: 'center', gap: 6,
    padding: 16, borderRadius: 16, borderWidth: 1,
  },
  contactIcon:  {width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center'},
  contactLabel: {fontSize: 11, fontWeight: '600'},
  contactValue: {fontSize: 13, fontWeight: '700'},

  formCard:     {borderRadius: 16, borderWidth: 1, overflow: 'hidden'},
  formHeader:   {flexDirection: 'row', alignItems: 'center', gap: 8, padding: 16},
  formTitle:    {fontSize: 15, fontWeight: '700'},
  sep:          {height: 1},
  formBody:     {padding: 16, gap: 8},

  fieldLabel:   {fontSize: 13, fontWeight: '600'},
  inputBox:     {borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12},
  textAreaBox:  {minHeight: 120},
  input:        {fontSize: 14, padding: 0},
  textArea:     {minHeight: 100},

  successBox:   {borderRadius: 12, borderWidth: 1, padding: 14},
  successText:  {fontSize: 13, fontWeight: '600', textAlign: 'center'},

  sendBtn:      {flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, borderRadius: 16},
  sendTxt:      {color: '#FFF', fontSize: 16, fontWeight: '700'},
});
