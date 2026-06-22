import React, {useCallback, useEffect, useState} from 'react';
import {
  ActivityIndicator, Image, Platform, ScrollView, StatusBar,
  StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import {
  ChevronLeft, Crown, Check, Sparkles, Infinity as InfinityIcon,
} from 'lucide-react-native';
import {useTheme} from '../../../shared/context/ThemeContext';
import {useI18n} from '../../../shared/i18n/I18nContext';
import {getPlans} from '../../../services/partner';
import RiyalIcon from '../../../shared/components/RiyalIcon';

const BILLING = [
  {key: 'monthly',   labelKey: 'partner.plans.monthly'},
  {key: 'yearly',    labelKey: 'partner.plans.yearly'},
  // {key: 'unlimited', labelKey: 'partner.plans.unlimited'},  // مدى الحياة — معلّق مؤقتاً
];

// Safely resolve a localized value that may be a plain string or an {ar, en} object.
function pickText(value, isRTL) {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object') {
    return (isRTL ? value.ar : value.en) || value.ar || value.en || '';
  }
  return String(value);
}

// Resolve a feature's display name; falls back to "feature N" when the API
// returns only an id (no localized name).
function featureName(feature, index, isRTL, t) {
  const fd = feature.featureDetails ?? {};
  const name = pickText(isRTL ? fd.nameAr : fd.nameEn, isRTL)
    || pickText(fd.nameAr, isRTL) || pickText(fd.nameEn, isRTL) || pickText(fd.name, isRTL);
  return name || `${t('partner.plans.feature')} ${index + 1}`;
}

// ─── Feature row ────────────────────────────────────────────────────────────────
function FeatureRow({feature, index, colors, isRTL, t}) {
  const name = featureName(feature, index, isRTL, t);
  const isUnlimited = feature.limitType === 'unlimited';
  const hasLimit = feature.limit != null && !isUnlimited;

  return (
    <View style={s.featRow}>
      <View style={[s.featCheck, {backgroundColor: colors.success + '18'}]}>
        <Check size={13} color={colors.success} strokeWidth={3} />
      </View>
      <Text style={[s.featName, {color: colors.textPrimary}]} numberOfLines={2}>{name}</Text>
      {isUnlimited ? (
        <View style={[s.featLimit, {backgroundColor: colors.primary + '14'}]}>
          <InfinityIcon size={13} color={colors.primary} strokeWidth={2.5} />
        </View>
      ) : hasLimit ? (
        <View style={[s.featLimit, {backgroundColor: colors.primary + '14'}]}>
          <Text style={[s.featLimitTxt, {color: colors.primary}]}>{feature.limit}</Text>
        </View>
      ) : null}
    </View>
  );
}

// ─── Plan card ──────────────────────────────────────────────────────────────────
function PlanCard({item, billing, colors, isRTL, t}) {
  const plan = item.plan ?? {};
  const name = (isRTL ? pickText(plan.nameAr, isRTL) : pickText(plan.name, isRTL))
    || pickText(plan.nameAr, isRTL) || pickText(plan.name, isRTL) || '';
  const desc = (isRTL ? pickText(plan.descriptionAr, isRTL) : pickText(plan.description, isRTL))
    || pickText(plan.descriptionAr, isRTL) || pickText(plan.description, isRTL) || '';
  const features = (item.features ?? []).filter(f => f.isActive !== false);

  const rawPrice = plan.price?.[billing];
  const priceVal = typeof rawPrice === 'object' && rawPrice !== null
    ? Number(rawPrice.$numberDecimal ?? 0)
    : Number(rawPrice ?? 0);
  const isFree = priceVal === 0;
  const popular = !!plan.isPopular;

  return (
    <View style={[
      s.card,
      {backgroundColor: colors.card, borderColor: popular ? colors.primary : colors.border},
      popular && {borderWidth: 2, shadowColor: colors.primary, shadowOpacity: 0.25},
    ]}>
      {/* Header band */}
      <View style={[s.cardHead, {backgroundColor: colors.primary}]}>
        <View style={s.cardHeadRow}>
          <View style={s.cardHeadText}>
            <View style={s.nameRow}>
              <Crown size={18} color="#FFF" strokeWidth={2.4} />
              <Text style={s.planName} numberOfLines={1}>{name}</Text>
            </View>
            {!!desc && <Text style={s.planDesc} numberOfLines={2}>{desc}</Text>}
          </View>
          {plan.image ? (
            <Image source={{uri: plan.image}} style={s.planImg} resizeMode="cover" />
          ) : (
            <View style={s.planImgPlaceholder}>
              <Sparkles size={22} color="#FFF" />
            </View>
          )}
        </View>

        {popular && (
          <View style={s.popularBadge}>
            <Sparkles size={11} color={colors.primary} strokeWidth={2.5} />
            <Text style={[s.popularTxt, {color: colors.primary}]}>{t('partner.plans.popular')}</Text>
          </View>
        )}
      </View>

      {/* Price */}
      <View style={s.priceWrap}>
        {isFree ? (
          <View style={s.unlimitedRow}>
            <Sparkles size={24} color={colors.success} strokeWidth={2.5} />
            <Text style={[s.unlimitedTxt, {color: colors.success}]}>{t('partner.plans.free')}</Text>
          </View>
        ) : (
          <View style={s.priceRow}>
            <Text style={[s.priceVal, {color: colors.textPrimary}]}>{priceVal.toLocaleString()}</Text>
            <View style={s.priceMeta}>
              <RiyalIcon size={15} color={colors.textPrimary} style={s.priceCurrencyIcon} />
              <Text style={[s.pricePer, {color: colors.textSecondary}]}>
                {billing === 'yearly' ? t('partner.plans.perYear') : t('partner.plans.perMonth')}
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Features */}
      {features.length > 0 && (
        <>
          <View style={[s.featDivider, {backgroundColor: colors.border}]} />
          <View style={s.featList}>
            <Text style={[s.featHead, {color: colors.textSecondary}]}>
              {t('partner.plans.featuresCount').replace('{count}', features.length)}
            </Text>
            {features.map((f, i) => (
              <FeatureRow key={f.id ?? i} feature={f} index={i} colors={colors} isRTL={isRTL} t={t} />
            ))}
          </View>
        </>
      )}
    </View>
  );
}

// ─── Screen ─────────────────────────────────────────────────────────────────────
export default function PlansScreen({onBack}) {
  const {colors, isDark} = useTheme();
  const {t, isRTL} = useI18n();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [billing, setBilling] = useState('monthly');

  const load = useCallback(async () => {
    setError(false);
    const res = await getPlans({limit: 50});
    if (res.success) {
      const list = res.data?.data ?? res.data ?? [];
      setPlans(Array.isArray(list) ? list : []);
    } else {
      setError(true);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <View style={[s.root, {backgroundColor: colors.bg}]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.card} />

      {/* Header */}
      <View style={[s.header, {backgroundColor: colors.card, borderBottomColor: colors.border}]}>
        <TouchableOpacity
          style={[s.backBtn, {backgroundColor: colors.bg}]}
          onPress={onBack}
          hitSlop={{top: 12, bottom: 12, left: 12, right: 12}}>
          <ChevronLeft size={22} color={colors.textPrimary} strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, {color: colors.textPrimary}]}>{t('partner.plans.title')}</Text>
        <View style={s.backBtn} />
      </View>

      {loading ? (
        <View style={s.center}><ActivityIndicator size="large" color={colors.primary} /></View>
      ) : error ? (
        <View style={s.center}>
          <Text style={[s.msg, {color: colors.textSecondary}]}>{t('partner.plans.error')}</Text>
          <TouchableOpacity
            style={[s.retryBtn, {backgroundColor: colors.primary}]}
            onPress={() => { setLoading(true); load(); }}
            activeOpacity={0.85}>
            <Text style={s.retryTxt}>{t('partner.plans.retry')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView style={s.scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
          {/* Intro */}
          <Text style={[s.intro, {color: colors.textSecondary}]}>{t('partner.plans.intro')}</Text>

          {/* Billing toggle */}
          <View style={[s.toggle, {backgroundColor: colors.card, borderColor: colors.border}]}>
            {BILLING.map(b => {
              const active = billing === b.key;
              return (
                <TouchableOpacity
                  key={b.key}
                  style={[s.toggleItem, active && {backgroundColor: colors.primary}]}
                  onPress={() => setBilling(b.key)}
                  activeOpacity={0.8}>
                  <Text style={[s.toggleTxt, {color: active ? '#FFF' : colors.textSecondary}]}>
                    {t(b.labelKey)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {plans.length === 0 ? (
            <Text style={[s.msg, {color: colors.textSecondary, marginTop: 40}]}>{t('partner.plans.empty')}</Text>
          ) : (
            plans.map((item, i) => (
              <PlanCard key={item._id ?? item.plan?.id ?? i} item={item} billing={billing} colors={colors} isRTL={isRTL} t={t} />
            ))
          )}

          <View style={s.spacer} />
        </ScrollView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: {flex: 1},
  center: {flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, paddingHorizontal: 32},

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 56 : 48,
    paddingBottom: 16, paddingHorizontal: 16, borderBottomWidth: 1,
  },
  backBtn: {width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center'},
  headerTitle: {flex: 1, fontSize: 18, fontWeight: '800', textAlign: 'center'},

  scroll: {flex: 1},
  content: {padding: 16, gap: 16},
  intro: {fontSize: 13, lineHeight: 20, paddingHorizontal: 4},

  // Billing toggle
  toggle: {flexDirection: 'row', borderRadius: 14, borderWidth: 1, padding: 4, gap: 4},
  toggleItem: {flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center'},
  toggleTxt: {fontSize: 13, fontWeight: '700'},

  // Card
  card: {
    borderRadius: 22, borderWidth: 1, overflow: 'hidden',
    shadowOffset: {width: 0, height: 8}, shadowRadius: 16, shadowOpacity: 0.06, elevation: 4,
  },
  cardHead: {padding: 18, paddingBottom: 16},
  cardHeadRow: {flexDirection: 'row', alignItems: 'center', gap: 12},
  cardHeadText: {flex: 1, gap: 6},
  nameRow: {flexDirection: 'row', alignItems: 'center', gap: 8},
  planName: {flex: 1, fontSize: 19, fontWeight: '900', color: '#FFF'},
  planDesc: {fontSize: 12, lineHeight: 17, color: 'rgba(255,255,255,0.85)'},
  planImg: {width: 52, height: 52, borderRadius: 14},
  planImgPlaceholder: {
    width: 52, height: 52, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  popularBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start',
    backgroundColor: '#FFF', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, marginTop: 12,
  },
  popularTxt: {fontSize: 11, fontWeight: '800'},

  // Price
  priceWrap: {paddingHorizontal: 18, paddingTop: 16, paddingBottom: 4},
  priceRow: {flexDirection: 'row', alignItems: 'flex-end', gap: 8},
  priceVal: {fontSize: 38, fontWeight: '900', lineHeight: 42},
  priceMeta: {gap: 2, marginBottom: 5},
  priceCurrencyIcon: {marginBottom: 1},
  pricePer: {fontSize: 12, fontWeight: '500'},
  unlimitedRow: {flexDirection: 'row', alignItems: 'center', gap: 10},
  unlimitedTxt: {fontSize: 22, fontWeight: '900'},

  // Features
  featDivider: {height: 1, marginHorizontal: 18, marginTop: 14},
  featList: {padding: 18, paddingTop: 14, gap: 12},
  featHead: {fontSize: 12, fontWeight: '700', marginBottom: 2},
  featRow: {flexDirection: 'row', alignItems: 'center', gap: 10},
  featCheck: {width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center'},
  featName: {flex: 1, fontSize: 13, fontWeight: '600'},
  featLimit: {borderRadius: 8, paddingHorizontal: 9, paddingVertical: 3, minWidth: 32, alignItems: 'center'},
  featLimitTxt: {fontSize: 12, fontWeight: '800'},

  spacer: {height: 24},

  msg: {fontSize: 14, textAlign: 'center'},
  retryBtn: {paddingHorizontal: 24, paddingVertical: 12, borderRadius: 14},
  retryTxt: {color: '#FFF', fontSize: 15, fontWeight: '700'},
});
