import React, {useCallback, useEffect, useState} from 'react';
import {ActivityIndicator, Platform, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {ChevronLeft, RefreshCw} from 'lucide-react-native';
import {useTheme} from '../../../shared/context/ThemeContext';
import {useI18n} from '../../../shared/i18n/I18nContext';
import {getTerms} from '../../../services/shared';

export default function TermsScreen({onBack}) {
  const {colors, isDark} = useTheme();
  const {t} = useI18n();

  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(false);
  const [sections, setSections] = useState([]);
  const [lastUpdated, setLastUpdated] = useState('');

  const fetchTerms = useCallback(async () => {
    setLoading(true);
    setError(false);
    const res = await getTerms();
    if (res.success && res.data?.data?.sections) {
      const d = res.data.data;
      setSections(d.sections ?? []);
      setLastUpdated(d.lastUpdated ?? '');
    } else {
      const fallback = t('terms.sections');
      setSections(Array.isArray(fallback) ? fallback : []);
      setLastUpdated(t('terms.lastUpdated'));
      if (!res.success) setError(true);
    }
    setLoading(false);
  }, [t]);

  useEffect(() => {
    fetchTerms();
  }, [fetchTerms]);

  return (
    <View style={[s.root, {backgroundColor: colors.bg}]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.card}
      />
      <View style={[s.header, {backgroundColor: colors.card, borderBottomColor: colors.border}]}>
        <TouchableOpacity
          style={[s.backBtn, {backgroundColor: colors.bg}]}
          onPress={onBack}
          hitSlop={{top: 12, bottom: 12, left: 12, right: 12}}>
          <ChevronLeft size={22} color={colors.textPrimary} strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, {color: colors.textPrimary}]}>{t('terms.title')}</Text>
        <View style={{width: 36}} />
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView style={s.scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
          <View style={[s.banner, {backgroundColor: colors.primary + '12', borderColor: colors.primary + '30'}]}>
            <Text style={[s.bannerTitle, {color: colors.primary}]}>{t('terms.bannerTitle')}</Text>
            {!!lastUpdated && (
              <Text style={[s.bannerDate, {color: colors.textSecondary}]}>{lastUpdated}</Text>
            )}
          </View>

          {error && (
            <View style={[s.errorBanner, {backgroundColor: colors.card, borderColor: colors.border}]}>
              <Text style={[s.errorText, {color: colors.textSecondary}]}>{t('common.offlineContent')}</Text>
              <TouchableOpacity style={[s.retryBtn, {borderColor: colors.primary}]} onPress={fetchTerms} activeOpacity={0.7}>
                <RefreshCw size={14} color={colors.primary} strokeWidth={2} />
                <Text style={[s.retryText, {color: colors.primary}]}>{t('common.retry')}</Text>
              </TouchableOpacity>
            </View>
          )}

          {sections.map((sec, i) => (
            <View key={i} style={[s.section, {backgroundColor: colors.card, borderColor: colors.border}]}>
              <Text style={[s.secTitle, {color: colors.textPrimary}]}>{sec.title}</Text>
              <Text style={[s.secBody, {color: colors.textSecondary}]}>{sec.body}</Text>
            </View>
          ))}

          <View style={[s.footer, {backgroundColor: colors.bg, borderColor: colors.border}]}>
            <Text style={[s.footerText, {color: colors.textSecondary}]}>{t('terms.footer')}</Text>
          </View>

          <View style={{height: 24}} />
        </ScrollView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root:        {flex: 1},
  header:      {
    flexDirection: 'row', alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 56 : 48,
    paddingBottom: 16, paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  backBtn:     {width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center'},
  headerTitle: {flex: 1, fontSize: 16, fontWeight: '700', textAlign: 'center'},
  center:      {flex: 1, alignItems: 'center', justifyContent: 'center'},
  scroll:      {flex: 1},
  content:     {padding: 16, gap: 12},
  banner:      {borderRadius: 18, padding: 20, borderWidth: 1, gap: 6},
  bannerTitle: {fontSize: 16, fontWeight: '800', textAlign: 'center'},
  bannerDate:  {fontSize: 12, textAlign: 'center'},
  errorBanner: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 12, padding: 12, borderWidth: 1},
  errorText:   {fontSize: 12, flex: 1},
  retryBtn:    {flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6},
  retryText:   {fontSize: 12, fontWeight: '600'},
  section:     {borderRadius: 18, borderWidth: 1, padding: 16, gap: 8},
  secTitle:    {fontSize: 15, fontWeight: '800'},
  secBody:     {fontSize: 13, lineHeight: 22},
  footer:      {borderRadius: 12, padding: 16, borderWidth: 1},
  footerText:  {fontSize: 13, textAlign: 'center', lineHeight: 20},
});
