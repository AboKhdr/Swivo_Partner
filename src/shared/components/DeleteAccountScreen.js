import React, {useState} from 'react';
import {
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView,
  StatusBar, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import {AlertTriangle, ChevronLeft, Trash2} from 'lucide-react-native';
import {useTheme} from '../context/ThemeContext';
import {useI18n} from '../i18n/I18nContext';
import {deleteAccount} from '../../services/auth';

export default function DeleteAccountScreen({onBack}) {
  const {colors, isDark} = useTheme();
  const {t} = useI18n();
  const [reason, setReason] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!confirmed || loading) return;
    Alert.alert(
      t('deleteAccount.confirmTitle'),
      t('deleteAccount.confirmMessage'),
      [
        {text: t('deleteAccount.cancel'), style: 'cancel'},
        {
          text: t('deleteAccount.confirmBtn'),
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            const res = await deleteAccount({reason: reason.trim() || undefined});
            setLoading(false);
            if (!res.success) {
              Alert.alert(t('deleteAccount.errorTitle'), res.error || t('deleteAccount.errorMessage'));
            }
          },
        },
      ],
    );
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
          hitSlop={{top: 12, bottom: 12, left: 12, right: 12}}>
          <ChevronLeft size={22} color={colors.textPrimary} strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, {color: colors.textPrimary}]}>{t('deleteAccount.title')}</Text>
        <View style={{width: 36}} />
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">

        <View style={[s.warnCard, {backgroundColor: '#FEF2F2', borderColor: '#FECACA'}]}>
          <View style={s.warnIcon}>
            <AlertTriangle size={28} color="#DC2626" />
          </View>
          <Text style={s.warnTitle}>{t('deleteAccount.warningTitle')}</Text>
          <Text style={s.warnBody}>{t('deleteAccount.warningBody')}</Text>
        </View>

        <Text style={[s.sectionTitle, {color: colors.textSecondary}]}>{t('deleteAccount.consequencesTitle')}</Text>
        <View style={[s.bulletCard, {backgroundColor: colors.card, borderColor: colors.border}]}>
          <Bullet text={t('deleteAccount.bullet1')} colors={colors} />
          <Bullet text={t('deleteAccount.bullet2')} colors={colors} />
          <Bullet text={t('deleteAccount.bullet3')} colors={colors} />
          <Bullet text={t('deleteAccount.bullet4')} colors={colors} />
        </View>

        <Text style={[s.sectionTitle, {color: colors.textSecondary}]}>{t('deleteAccount.reasonTitle')}</Text>
        <View style={[s.inputCard, {backgroundColor: colors.card, borderColor: colors.border}]}>
          <TextInput
            style={[s.input, {color: colors.textPrimary}]}
            placeholder={t('deleteAccount.reasonPlaceholder')}
            placeholderTextColor={colors.textSecondary}
            value={reason}
            onChangeText={setReason}
            multiline
            numberOfLines={4}
            maxLength={500}
            textAlignVertical="top"
          />
        </View>

        <View style={[s.confirmRow, {backgroundColor: colors.card, borderColor: colors.border}]}>
          <Switch
            value={confirmed}
            onValueChange={setConfirmed}
            trackColor={{false: colors.border, true: '#FCA5A5'}}
            thumbColor={confirmed ? '#DC2626' : '#fff'}
          />
          <Text style={[s.confirmText, {color: colors.textPrimary}]}>{t('deleteAccount.confirmCheckbox')}</Text>
        </View>

        <TouchableOpacity
          style={[s.deleteBtn, {backgroundColor: confirmed && !loading ? '#DC2626' : '#FCA5A5'}]}
          onPress={handleDelete}
          disabled={!confirmed || loading}
          activeOpacity={0.8}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Trash2 size={18} color="#fff" strokeWidth={2.5} />
              <Text style={s.deleteBtnText}>{t('deleteAccount.deleteBtn')}</Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={[s.footnote, {color: colors.textSecondary}]}>{t('deleteAccount.footnote')}</Text>

        <View style={{height: 24}} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Bullet({text, colors}) {
  return (
    <View style={s.bulletRow}>
      <View style={[s.bulletDot, {backgroundColor: '#DC2626'}]} />
      <Text style={[s.bulletText, {color: colors.textPrimary}]}>{text}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  root: {flex: 1},
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 56 : 48,
    paddingBottom: 16, paddingHorizontal: 16, borderBottomWidth: 1,
  },
  backBtn: {width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center'},
  headerTitle: {flex: 1, fontSize: 16, fontWeight: '700', textAlign: 'center'},
  scroll: {flex: 1},
  content: {padding: 16, gap: 12},

  warnCard: {borderRadius: 18, borderWidth: 1, padding: 18, alignItems: 'center', gap: 6},
  warnIcon: {width: 56, height: 56, borderRadius: 28, backgroundColor: '#FEE2E2', alignItems: 'center', justifyContent: 'center', marginBottom: 4},
  warnTitle: {fontSize: 17, fontWeight: '900', color: '#991B1B'},
  warnBody: {fontSize: 13, lineHeight: 20, color: '#991B1B', textAlign: 'center'},

  sectionTitle: {fontSize: 13, fontWeight: '700', paddingHorizontal: 4, marginTop: 8},
  bulletCard: {borderRadius: 18, borderWidth: 1, padding: 16, gap: 10},
  bulletRow: {flexDirection: 'row', alignItems: 'flex-start', gap: 10},
  bulletDot: {width: 6, height: 6, borderRadius: 3, marginTop: 7},
  bulletText: {flex: 1, fontSize: 13, lineHeight: 20},

  inputCard: {borderRadius: 18, borderWidth: 1, padding: 12},
  input: {fontSize: 14, minHeight: 90, padding: 4},

  confirmRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 16, borderRadius: 18, borderWidth: 1, marginTop: 4,
  },
  confirmText: {flex: 1, fontSize: 13, fontWeight: '600'},

  deleteBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 16, borderRadius: 14, marginTop: 8,
  },
  deleteBtnText: {color: '#fff', fontSize: 15, fontWeight: '800'},
  footnote: {fontSize: 11, textAlign: 'center', lineHeight: 18, paddingHorizontal: 16, marginTop: 8},
});
