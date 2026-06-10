import React, {useState, useEffect, useRef} from 'react';
import {
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StatusBar,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {ChevronLeft, CheckCircle} from 'lucide-react-native';
import {useTheme} from '../../../shared/context/ThemeContext';
import {useI18n} from '../../../shared/i18n/I18nContext';
import {sendSupportMessage} from '../../../services/shared';

const DAILY_LIMIT  = 3;
const STORAGE_KEY  = 'biker_support_daily';
const SUCCESS_TTL  = 3000;

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
  const {colors, isDark} = useTheme();
  const {t} = useI18n();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);
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
    if (!canSend || loading) return;
    setError(null);
    setLoading(true);
    const res = await sendSupportMessage(subject.trim(), msgTrimmed);
    setLoading(false);
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
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.card} />
      <View style={[s.header, {backgroundColor: colors.card, borderBottomColor: colors.border}]}>
        <TouchableOpacity
          style={[s.backBtn, {backgroundColor: colors.bg}]}
          onPress={onBack}
          hitSlop={{top:12,bottom:12,left:12,right:12}}>
          <ChevronLeft size={22} color={colors.textPrimary} strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, {color: colors.textPrimary}]}>{t('support.title')}</Text>
        <Text style={[s.counterBadge, {color: colors.textSecondary}]}>{dailyCount}/{DAILY_LIMIT}</Text>
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">

        {limitHit && (
          <View style={[s.limitBox, {backgroundColor: '#F59E0B18', borderColor: '#F59E0B44'}]}>
            <Text style={[s.limitText, {color: '#F59E0B'}]}>{t('support.limitReached')}</Text>
          </View>
        )}

        {sent && (
          <View style={[s.successBanner, {backgroundColor: '#22C55E18', borderColor: '#22C55E44'}]}>
            <CheckCircle size={18} color="#22C55E" strokeWidth={2} />
            <Text style={[s.successBannerText, {color: '#22C55E'}]}>{t('support.sentTitle')}</Text>
          </View>
        )}

        <View style={[s.msgCard, {backgroundColor: colors.card, borderColor: colors.border}]}>
          <TextInput
            style={[s.subjectInput, {borderColor: colors.border, color: colors.textPrimary}]}
            placeholder={t('support.subjectPlaceholder')}
            placeholderTextColor={colors.textSecondary}
            value={subject}
            onChangeText={v => { setSubject(v); setError(null); }}
            textAlign="right"
            editable={!loading && !limitHit}
          />
          <View>
            <TextInput
              style={[s.msgInput, {borderColor: colors.border, color: colors.textPrimary}]}
              placeholder={t('support.placeholder')}
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={4}
              value={message}
              onChangeText={v => { setMessage(v); setError(null); }}
              textAlign="right"
              textAlignVertical="top"
              editable={!loading && !limitHit}
            />
            <Text style={[s.charHint, {color: msgValid ? '#22C55E' : colors.textSecondary}]}>
              {msgTrimmed.length}/10
            </Text>
          </View>
          {!!error && <Text style={[s.error, {color: '#EF4444'}]}>{error}</Text>}
          <TouchableOpacity
            style={[s.sendBtn, {backgroundColor: colors.primary}, (!canSend || loading) && {opacity: 0.4}]}
            onPress={handleSend}
            disabled={!canSend || loading}
            activeOpacity={0.8}>
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={s.sendBtnText}>{t('support.send')}</Text>
            }
          </TouchableOpacity>
        </View>

        <View style={{height: 24}} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root:            {flex: 1},
  header:          {flexDirection: 'row', alignItems: 'center', paddingTop: Platform.OS === 'ios' ? 56 : 48, paddingBottom: 16, paddingHorizontal: 16, borderBottomWidth: 1},
  backBtn:         {width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center'},
  headerTitle:     {flex: 1, fontSize: 16, fontWeight: '700', textAlign: 'center'},
  counterBadge:    {fontSize: 12, fontWeight: '600', minWidth: 36, textAlign: 'right'},
  scroll:          {flex: 1},
  content:         {padding: 16, gap: 12},
  limitBox:        {borderRadius: 12, borderWidth: 1, padding: 14},
  limitText:       {fontSize: 13, fontWeight: '600', textAlign: 'center'},
  successBanner:   {flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 12, borderWidth: 1, padding: 14},
  successBannerText:{fontSize: 13, fontWeight: '700'},
  msgCard:         {borderRadius: 18, borderWidth: 1, padding: 16, gap: 12},
  subjectInput:    {borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 14},
  msgInput:        {borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 14, minHeight: 140},
  charHint:        {fontSize: 11, fontWeight: '600', textAlign: 'right', marginTop: 4},
  error:           {fontSize: 12, textAlign: 'center'},
  sendBtn:         {borderRadius: 12, paddingVertical: 14, alignItems: 'center', minHeight: 50, justifyContent: 'center'},
  sendBtnText:     {color: '#fff', fontSize: 15, fontWeight: '700'},
});
