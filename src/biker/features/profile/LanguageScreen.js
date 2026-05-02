import React, {useState} from 'react';
import {
  Platform, StatusBar, StyleSheet,
  Text, TouchableOpacity, View,
} from 'react-native';
import {ChevronLeft} from 'lucide-react-native';
import {useTheme} from '../../../shared/context/ThemeContext';
import {useI18n} from '../../../shared/i18n/I18nContext';

const LANGUAGES = [
  {code: 'ar', flag: '🇸🇦'},
  {code: 'en', flag: '🇺🇸'},
  {code: 'hi', flag: '🇮🇳'},
];

export default function LanguageScreen({onBack}) {
  const {colors, isDark} = useTheme();
  const {t, lang, setLang} = useI18n();
  const [selected, setSelected] = useState(lang);

  return (
    <View style={[s.root, {backgroundColor: colors.bg}]}>
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
        <Text style={[s.headerTitle, {color: colors.textPrimary}]}>{t('language.title')}</Text>
        <View style={{width: 36}} />
      </View>

      {/* Body */}
      <View style={s.body}>
        <Text style={[s.subtitle, {color: colors.textSecondary}]}>{t('language.subtitle')}</Text>

        <View style={s.pillRow}>
          {LANGUAGES.map(({code, flag}) => {
            const active = selected === code;
            return (
              <TouchableOpacity
                key={code}
                style={[
                  s.pill,
                  {borderColor: colors.border, backgroundColor: colors.card},
                  active && {borderColor: colors.primary, backgroundColor: colors.primary + '0D'},
                ]}
                onPress={() => { setSelected(code); setLang(code); }}
                activeOpacity={0.75}>
                <Text style={s.pillFlag}>{flag}</Text>
                <Text style={[s.pillCode, {color: colors.textSecondary}, active && {color: colors.primary}]}>
                  {code.toUpperCase()}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {(() => {
          const cur = LANGUAGES.find(l => l.code === selected);
          return (
            <View style={[s.detailCard, {backgroundColor: colors.card, borderColor: colors.border}]}>
              <Text style={s.detailFlag}>{cur.flag}</Text>
              <View style={s.detailText}>
                <Text style={[s.detailLabel, {color: colors.textPrimary}]}>{t(`language.${selected === 'ar' ? 'arabic' : selected === 'en' ? 'english' : 'hindi'}`)}</Text>
                <Text style={[s.detailNative, {color: colors.textSecondary}]}>{t(`language.${selected === 'ar' ? 'arabicNative' : selected === 'en' ? 'englishNative' : 'hindiNative'}`)}</Text>
              </View>
              <View style={[s.detailBadge, {backgroundColor: colors.primary + '15'}]}>
                <Text style={[s.detailBadgeText, {color: colors.primary}]}>{t('language.active')}</Text>
              </View>
            </View>
          );
        })()}
      </View>
    </View>
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
  body: {
    flex: 1, padding: 24, gap: 24,
  },
  subtitle: {
    fontSize: 13,
    textAlign: 'center',
  },

  /* Pills */
  pillRow: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
  },
  pill: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 20,
    borderRadius: 20,
    borderWidth: 1.5,
    gap: 8,
  },
  pillFlag: {fontSize: 28},
  pillCode: {
    fontSize: 13, fontWeight: '700',
  },

  /* Detail card */
  detailCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    gap: 14,
  },
  detailFlag: {fontSize: 36},
  detailText: {flex: 1, gap: 3},
  detailLabel: {fontSize: 16, fontWeight: '800'},
  detailNative: {fontSize: 12},
  detailBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  detailBadgeText: {fontSize: 12, fontWeight: '700'},
});
