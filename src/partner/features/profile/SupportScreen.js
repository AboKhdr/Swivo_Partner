import React, {useState, useEffect, useRef} from 'react';
import {
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {ArrowRight, MessageCircle, Phone, Mail, Send} from 'lucide-react-native';
import {useTheme} from '../../../shared/context/ThemeContext';
import {useI18n} from '../../../shared/i18n/I18nContext';
import {sendSupportMessage} from '../../../services/partner';

const CONTACT_ITEMS = [
  {Icon: Phone, key: 'callUs',  value: '920001234',        color: '#22C55E'},
  {Icon: Mail,  key: 'email',   value: 'support@tamam.sa', color: '#1B7BF5'},
];

const DAILY_LIMIT   = 3;
const STORAGE_KEY   = 'partner_support_daily';
const SUCCESS_TTL   = 3000;

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

async function loadCount() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return 0;
    const {date, count} = JSON.parse(raw);
    return date === todayStr() ? count : 0;
  } catch {
    return 0;
  }
}

async function incrementCount() {
  try {
    const count = await loadCount();
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({date: todayStr(), count: count + 1}));
    return count + 1;
  } catch {
    return 1;
  }
}

export default function SupportScreen({onBack}) {
  const {colors} = useTheme();
  const {t} = useI18n();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent,    setSent]    = useState(false);
  const [error,   setError]   = useState(null);
  const [dailyCount, setDailyCount] = useState(0);
  const hideTimer = useRef(null);

  useEffect(() => {
    loadCount().then(setDailyCount);
    return () => { if (hideTimer.current) clearTimeout(hideTimer.current); };
  }, []);

  const msgTrimmed = message.trim();
  const msgValid   = msgTrimmed.length >= 10;
  const limitHit   = dailyCount >= DAILY_LIMIT;
  const canSend    = subject.trim().length > 0 && msgValid && !limitHit;

  const handleSend = async () => {
    if (!canSend || sending) return;
    if (!msgValid) { setError(t('partner.support.msgMinLength')); return; }
    setError(null);
    setSending(true);
    const res = await sendSupportMessage(subject.trim(), msgTrimmed);
    setSending(false);
    if (res.success) {
      const next = await incrementCount();
      setDailyCount(next);
      setSent(true);
      setSubject('');
      setMessage('');
      hideTimer.current = setTimeout(() => setSent(false), SUCCESS_TTL);
    } else {
      setError(res.error ?? t('common.error'));
    }
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

        {limitHit && (
          <View style={[s.limitBox, {backgroundColor: '#F59E0B18', borderColor: '#F59E0B44'}]}>
            <Text style={[s.limitText, {color: '#F59E0B'}]}>{t('partner.support.limitReached')}</Text>
          </View>
        )}

        <View style={[s.formCard, {backgroundColor: colors.card, borderColor: colors.border}]}>
          <View style={s.formHeader}>
            <MessageCircle size={18} color={colors.primary} />
            <Text style={[s.formTitle, {color: colors.textPrimary}]}>{t('partner.support.sendMessage')}</Text>
            <Text style={[s.counter, {color: colors.textSecondary}]}>{dailyCount}/{DAILY_LIMIT}</Text>
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
                onChangeText={v => { setSubject(v); setError(null); }}
                textAlign="right"
                editable={!sending && !limitHit}
              />
            </View>
            <View style={s.msgLabelRow}>
              <Text style={[s.fieldLabel, {color: colors.textSecondary}]}>{t('partner.support.message')}</Text>
              <Text style={[s.charHint, {color: msgValid ? '#22C55E' : colors.textSecondary}]}>
                {msgTrimmed.length}/10
              </Text>
            </View>
            <View style={[s.inputBox, s.textAreaBox, {backgroundColor: colors.bg, borderColor: colors.border}]}>
              <TextInput
                style={[s.input, s.textArea, {color: colors.textPrimary}]}
                placeholder={t('partner.support.messagePlaceholder')}
                placeholderTextColor={colors.textSecondary}
                value={message}
                onChangeText={v => { setMessage(v); setError(null); }}
                multiline
                textAlignVertical="top"
                textAlign="right"
                editable={!sending && !limitHit}
              />
            </View>
          </View>
        </View>

        {sent && (
          <View style={[s.successBox, {backgroundColor: '#22C55E18', borderColor: '#22C55E44'}]}>
            <Text style={[s.successText, {color: '#22C55E'}]}>{t('partner.support.successMsg')}</Text>
          </View>
        )}

        {!!error && (
          <View style={[s.errorBox, {backgroundColor: '#EF444418', borderColor: '#EF444444'}]}>
            <Text style={[s.errorText, {color: '#EF4444'}]}>{error}</Text>
          </View>
        )}

        <TouchableOpacity
          style={[s.sendBtn, {backgroundColor: canSend && !sending ? colors.primary : colors.border}]}
          onPress={handleSend}
          disabled={!canSend || sending}
          activeOpacity={0.85}>
          {sending
            ? <ActivityIndicator color="#FFF" size="small" />
            : <><Send size={18} color="#FFF" /><Text style={s.sendTxt}>{t('partner.support.send')}</Text></>
          }
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
  contactCard:  {flex: 1, alignItems: 'center', gap: 6, padding: 16, borderRadius: 16, borderWidth: 1},
  contactIcon:  {width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center'},
  contactLabel: {fontSize: 11, fontWeight: '600'},
  contactValue: {fontSize: 13, fontWeight: '700'},

  limitBox:     {borderRadius: 12, borderWidth: 1, padding: 14},
  limitText:    {fontSize: 13, fontWeight: '600', textAlign: 'center'},

  formCard:     {borderRadius: 16, borderWidth: 1, overflow: 'hidden'},
  formHeader:   {flexDirection: 'row', alignItems: 'center', gap: 8, padding: 16},
  formTitle:    {flex: 1, fontSize: 15, fontWeight: '700'},
  counter:      {fontSize: 12, fontWeight: '600'},
  sep:          {height: 1},
  formBody:     {padding: 16, gap: 8},

  fieldLabel:   {fontSize: 13, fontWeight: '600'},
  msgLabelRow:  {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  charHint:     {fontSize: 11, fontWeight: '600'},
  inputBox:     {borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12},
  textAreaBox:  {minHeight: 120},
  input:        {fontSize: 14, padding: 0},
  textArea:     {minHeight: 100},

  successBox:   {borderRadius: 12, borderWidth: 1, padding: 14},
  successText:  {fontSize: 13, fontWeight: '600', textAlign: 'center'},
  errorBox:     {borderRadius: 12, borderWidth: 1, padding: 14},
  errorText:    {fontSize: 13, fontWeight: '600', textAlign: 'center'},

  sendBtn:      {flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, borderRadius: 16, minHeight: 54},
  sendTxt:      {color: '#FFF', fontSize: 16, fontWeight: '700'},
});
