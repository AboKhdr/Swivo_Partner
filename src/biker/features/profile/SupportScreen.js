import React, {useState} from 'react';
import {
  KeyboardAvoidingView, Platform, ScrollView, StatusBar,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import {ChevronLeft} from 'lucide-react-native';
import {useTheme} from '../../../shared/context/ThemeContext';
import {useI18n} from '../../../shared/i18n/I18nContext';

export default function SupportScreen({onBack}) {
  const {colors, isDark} = useTheme();
  const {t} = useI18n();
  const [message, setMessage] = useState('');

  return (
    <KeyboardAvoidingView
      style={[s.root, {backgroundColor: colors.bg}]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.card}
      />
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
        <View style={[s.msgCard, {backgroundColor: colors.card, borderColor: colors.border}]}>
          <TextInput
            style={[s.msgInput, {borderColor: colors.border, color: colors.textPrimary}]}
            placeholder={t('support.placeholder')}
            placeholderTextColor={colors.textSecondary}
            multiline
            numberOfLines={4}
            value={message}
            onChangeText={setMessage}
            textAlign="right"
            textAlignVertical="top"
          />
          <TouchableOpacity
            style={[s.sendBtn, {backgroundColor: colors.primary}, !message.trim() && {opacity: 0.4}]}
            disabled={!message.trim()}
            activeOpacity={0.8}>
            <Text style={s.sendBtnText}>{t('support.send')}</Text>
          </TouchableOpacity>
        </View>
        <View style={{height: 24}} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root: {flex: 1},
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 56 : 48,
    paddingBottom: 16, paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  backBtn: {width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center'},
  headerTitle: {flex: 1, fontSize: 16, fontWeight: '700', textAlign: 'center'},
  scroll: {flex: 1},
  content: {padding: 16},
  msgCard: {borderRadius: 18, borderWidth: 1, padding: 16, gap: 12},
  msgInput: {borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 14, minHeight: 140},
  sendBtn: {borderRadius: 12, paddingVertical: 14, alignItems: 'center'},
  sendBtnText: {color: '#fff', fontSize: 15, fontWeight: '700'},
});
