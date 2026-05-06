import React, {useState} from 'react';
import {
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StatusBar,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import {ChevronLeft, CheckCircle} from 'lucide-react-native';
import {useTheme} from '../../../shared/context/ThemeContext';
import {useI18n} from '../../../shared/i18n/I18nContext';
import {sendSupportMessage} from '../../../services/biker';

export default function SupportScreen({onBack}) {
  const {colors, isDark} = useTheme();
  const {t} = useI18n();
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);

  const handleSend = async () => {
    if (!message.trim()) return;
    setError(null);
    setLoading(true);
    const res = await sendSupportMessage(message.trim());
    setLoading(false);
    if (res.success) {
      setSent(true);
      setMessage('');
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
        <View style={{width: 36}} />
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">

        {sent ? (
          <View style={s.successBox}>
            <CheckCircle size={52} color={colors.success} strokeWidth={1.5} />
            <Text style={[s.successTitle, {color: colors.textPrimary}]}>{t('support.sentTitle')}</Text>
            <Text style={[s.successSub, {color: colors.textSecondary}]}>{t('support.sentSub')}</Text>
            <TouchableOpacity style={[s.sendBtn, {backgroundColor: colors.primary, marginTop: 16}]} onPress={() => setSent(false)} activeOpacity={0.8}>
              <Text style={s.sendBtnText}>{t('support.sendAnother')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[s.msgCard, {backgroundColor: colors.card, borderColor: colors.border}]}>
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
              editable={!loading}
            />
            {error ? <Text style={[s.error, {color: colors.danger}]}>{error}</Text> : null}
            <TouchableOpacity
              style={[s.sendBtn, {backgroundColor: colors.primary}, (!message.trim() || loading) && {opacity: 0.4}]}
              onPress={handleSend}
              disabled={!message.trim() || loading}
              activeOpacity={0.8}>
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={s.sendBtnText}>{t('support.send')}</Text>
              }
            </TouchableOpacity>
          </View>
        )}

        <View style={{height: 24}} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root: {flex: 1},
  header: {flexDirection: 'row', alignItems: 'center', paddingTop: Platform.OS === 'ios' ? 56 : 48, paddingBottom: 16, paddingHorizontal: 16, borderBottomWidth: 1},
  backBtn: {width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center'},
  headerTitle: {flex: 1, fontSize: 16, fontWeight: '700', textAlign: 'center'},
  scroll: {flex: 1},
  content: {padding: 16},
  msgCard: {borderRadius: 18, borderWidth: 1, padding: 16, gap: 12},
  msgInput: {borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 14, minHeight: 140},
  error: {fontSize: 12, textAlign: 'center'},
  sendBtn: {borderRadius: 12, paddingVertical: 14, alignItems: 'center'},
  sendBtnText: {color: '#fff', fontSize: 15, fontWeight: '700'},
  successBox: {alignItems: 'center', paddingTop: 60, gap: 12},
  successTitle: {fontSize: 18, fontWeight: '800'},
  successSub: {fontSize: 14, textAlign: 'center'},
});
