import React, {useCallback, useEffect, useState} from 'react';
import {
  ActivityIndicator, Platform, ScrollView, StyleSheet,
  Text, TouchableOpacity, View,
} from 'react-native';
import {ArrowRight, ChevronDown, ChevronUp, RefreshCw} from 'lucide-react-native';
import {useTheme} from '../../../shared/context/ThemeContext';
import {useI18n} from '../../../shared/i18n/I18nContext';
import {getTerms} from '../../../services/biker';

function TermSection({item, colors}) {
  const [open, setOpen] = useState(false);
  return (
    <View style={[s.section, {backgroundColor: colors.card, borderColor: colors.border}]}>
      <TouchableOpacity style={s.sectionHeader} onPress={() => setOpen(v => !v)} activeOpacity={0.75}>
        <Text style={[s.sectionTitle, {color: colors.textPrimary}]}>{item.title}</Text>
        {open
          ? <ChevronUp   size={18} color={colors.textSecondary} />
          : <ChevronDown size={18} color={colors.textSecondary} />}
      </TouchableOpacity>
      {open && (
        <>
          <View style={[s.sectionDivider, {backgroundColor: colors.border}]} />
          <Text style={[s.sectionBody, {color: colors.textSecondary}]}>{item.body}</Text>
        </>
      )}
    </View>
  );
}

export default function TermsScreen({onBack}) {
  const {colors} = useTheme();
  const {t} = useI18n();

  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(false);
  const [sections,    setSections]    = useState([]);
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
      const fallback = t('partner.terms.sections');
      setSections(Array.isArray(fallback) ? fallback : []);
      setLastUpdated(t('partner.terms.lastUpdated'));
      setError(true);
    }
    setLoading(false);
  }, [t]);

  useEffect(() => { fetchTerms(); }, [fetchTerms]);

  return (
    <View style={[s.root, {backgroundColor: colors.bg}]}>
      <View style={[s.header, {backgroundColor: colors.card, borderBottomColor: colors.border}]}>
        <TouchableOpacity
          onPress={onBack}
          style={[s.backBtn, {backgroundColor: colors.bg}]}
          hitSlop={{top: 12, bottom: 12, left: 12, right: 12}}>
          <ArrowRight size={22} color={colors.textPrimary} strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, {color: colors.textPrimary}]}>{t('partner.terms.title')}</Text>
        {error ? (
          <TouchableOpacity
            onPress={fetchTerms}
            style={[s.backBtn, {backgroundColor: colors.bg}]}
            hitSlop={{top: 12, bottom: 12, left: 12, right: 12}}>
            <RefreshCw size={18} color={colors.primary} />
          </TouchableOpacity>
        ) : (
          <View style={{width: 36}} />
        )}
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
          {lastUpdated.length > 0 && (
            <View style={[s.introCard, {backgroundColor: colors.primary + '10', borderColor: colors.primary + '30'}]}>
              <Text style={[s.introText, {color: colors.textSecondary}]}>{lastUpdated}</Text>
            </View>
          )}

          {sections.map((item, i) => (
            <TermSection key={i} item={item} colors={colors} />
          ))}

          <View style={{height: 32}} />
        </ScrollView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root:           {flex: 1},
  center:         {flex: 1, alignItems: 'center', justifyContent: 'center'},
  header:         {
    flexDirection: 'row', alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 56 : 48,
    paddingBottom: 16, paddingHorizontal: 16, borderBottomWidth: 1,
  },
  backBtn:        {width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center'},
  headerTitle:    {flex: 1, fontSize: 16, fontWeight: '700', textAlign: 'center'},
  content:        {padding: 16, gap: 10},
  introCard:      {borderRadius: 12, borderWidth: 1, padding: 14},
  introText:      {fontSize: 13, lineHeight: 20, textAlign: 'center'},
  section:        {borderRadius: 14, borderWidth: 1, overflow: 'hidden'},
  sectionHeader:  {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, gap: 12},
  sectionTitle:   {flex: 1, fontSize: 14, fontWeight: '700'},
  sectionDivider: {height: 1},
  sectionBody:    {fontSize: 13, lineHeight: 22, padding: 16, paddingTop: 12},
});
