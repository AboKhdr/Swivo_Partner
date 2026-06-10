import React, {useEffect, useState} from 'react';
import {
  ActivityIndicator, Platform, ScrollView,
  StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import {ChevronLeft, CreditCard, Calendar, CheckCircle, XCircle, Clock, Check, Infinity as InfinityIcon, Sparkles} from 'lucide-react-native';
import {useTheme} from '../../../shared/context/ThemeContext';
import {useI18n} from '../../../shared/i18n/I18nContext';
import {getTenantSubscription} from '../../../services/partner';

function sv(val, lang) {
  if (!val) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'object') return (lang && val[lang]) ?? val.ar ?? val.en ?? '';
  return String(val);
}

function InfoRow({label, value, colors, valueColor}) {
  return (
    <View style={s.infoRow}>
      <Text style={[s.infoLabel, {color: colors.textSecondary}]}>{label}</Text>
      <Text style={[s.infoValue, {color: valueColor ?? colors.textPrimary}]}>{value}</Text>
    </View>
  );
}

function FeatureRow({feature, colors, lang}) {
  const name = (lang === 'ar' ? feature.nameAr : feature.nameEn)
    || feature.nameAr || feature.nameEn || feature.key || '';
  const isUnlimited = feature.limitType === 'unlimited';
  const hasLimit = feature.limit != null && !isUnlimited;

  return (
    <View style={s.featRow}>
      <View style={[s.featCheck, {backgroundColor: '#22C55E18'}]}>
        <Check size={13} color="#22C55E" strokeWidth={3} />
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

const STATUS_MAP = {
  active:    {label: 'نشط',    color: '#22C55E', Icon: CheckCircle},
  inactive:  {label: 'غير نشط', color: '#94A3B8', Icon: XCircle},
  expired:   {label: 'منتهي',   color: '#EF4444', Icon: XCircle},
  cancelled: {label: 'ملغي',    color: '#EF4444', Icon: XCircle},
  trialing:  {label: 'تجريبي',  color: '#F59E0B', Icon: Clock},
};

const CYCLE_LABEL = {monthly: 'شهري', yearly: 'سنوي'};

export default function SubscriptionScreen({onBack}) {
  const {colors} = useTheme();
  const {lang} = useI18n();

  const [loading, setLoading] = useState(true);
  const [sub, setSub]         = useState(null);
  const [error, setError]     = useState(false);

  useEffect(() => {
    getTenantSubscription().then(res => {
      if (res.success) {
        setSub(res.data?.data ?? res.data ?? null);
      } else {
        setError(true);
      }
      setLoading(false);
    });
  }, []);

  const statusInfo = STATUS_MAP[sub?.status] ?? STATUS_MAP.inactive;
  const StatusIcon = statusInfo.Icon;

  const planName     = sv(sub?.plan?.name ?? sub?.planId?.name, lang) || '—';
  const cycle        = CYCLE_LABEL[sub?.billingCycle] ?? sub?.billingCycle ?? '—';
  const amount       = sub?.amount != null ? `${sub.amount} ${sub.currency ?? ''}`.trim() : '—';
  const daysLeft     = sub?.daysRemaining != null ? `${sub.daysRemaining} يوم` : '—';
  const isExpired    = sub?.isExpired ?? false;

  const fmtDate = ts => {
    if (!ts) return '—';
    const d = new Date(typeof ts === 'number' ? ts : ts);
    return d.toLocaleDateString('ar-SA', {year: 'numeric', month: 'long', day: 'numeric'});
  };

  const periodStart = fmtDate(sub?.currentPeriodStart);
  const periodEnd   = fmtDate(sub?.currentPeriodEnd ?? sub?.endsAt);

  const features = (sub?.features ?? [])
    .filter(f => f.isActive !== false)
    .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));

  return (
    <View style={[s.root, {backgroundColor: colors.bg}]}>
      {/* Header */}
      <View style={[s.header, {backgroundColor: colors.card, borderBottomColor: colors.border}]}>
        <TouchableOpacity style={[s.backBtn, {backgroundColor: colors.bg}]} onPress={onBack} activeOpacity={0.7}>
          <ChevronLeft size={22} color={colors.textPrimary} strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, {color: colors.textPrimary}]}>الاشتراك</Text>
        <View style={s.backBtn} />
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : error || !sub ? (
        <View style={s.center}>
          <Text style={[s.errorText, {color: colors.textSecondary}]}>تعذّر تحميل بيانات الاشتراك</Text>
        </View>
      ) : (
        <ScrollView style={s.scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

          {/* Status hero card */}
          <View style={[s.heroCard, {backgroundColor: statusInfo.color + '12', borderColor: statusInfo.color + '30'}]}>
            <View style={[s.heroIconBox, {backgroundColor: statusInfo.color + '20'}]}>
              <StatusIcon size={32} color={statusInfo.color} strokeWidth={2} />
            </View>
            <View style={s.heroText}>
              <Text style={[s.heroStatus, {color: statusInfo.color}]}>{statusInfo.label}</Text>
              <Text style={[s.heroPlan, {color: colors.textPrimary}]}>{planName}</Text>
              <Text style={[s.heroCycle, {color: colors.textSecondary}]}>{cycle} • {amount}</Text>
            </View>
          </View>

          {/* Days remaining */}
          {!isExpired && sub.daysRemaining != null && (
            <View style={[s.daysCard, {backgroundColor: colors.primary + '10', borderColor: colors.primary + '25'}]}>
              <Calendar size={20} color={colors.primary} strokeWidth={2} />
              <Text style={[s.daysText, {color: colors.primary}]}>
                متبقي <Text style={s.daysBold}>{sub.daysRemaining}</Text> يوم
              </Text>
            </View>
          )}

          {isExpired && (
            <View style={[s.daysCard, {backgroundColor: '#EF444410', borderColor: '#EF444430'}]}>
              <XCircle size={20} color="#EF4444" strokeWidth={2} />
              <Text style={[s.daysText, {color: '#EF4444'}]}>انتهى الاشتراك</Text>
            </View>
          )}

          {/* Details */}
          <View style={[s.card, {backgroundColor: colors.card, borderColor: colors.border}]}>
            <View style={s.cardHeader}>
              <CreditCard size={18} color={colors.primary} strokeWidth={2} />
              <Text style={[s.cardTitle, {color: colors.textPrimary}]}>تفاصيل الاشتراك</Text>
            </View>
            <View style={[s.divider, {backgroundColor: colors.border}]} />
            <InfoRow label="الخطة"         value={planName}     colors={colors} />
            <View style={[s.divider, {backgroundColor: colors.border}]} />
            <InfoRow label="دورة الفوترة"  value={cycle}        colors={colors} />
            <View style={[s.divider, {backgroundColor: colors.border}]} />
            <InfoRow label="المبلغ"         value={amount}       colors={colors} />
            <View style={[s.divider, {backgroundColor: colors.border}]} />
            <InfoRow label="الحالة"         value={statusInfo.label} colors={colors} valueColor={statusInfo.color} />
          </View>

          {/* Plan features */}
          {features.length > 0 && (
            <View style={[s.card, {backgroundColor: colors.card, borderColor: colors.border}]}>
              <View style={s.cardHeader}>
                <Sparkles size={18} color={colors.primary} strokeWidth={2} />
                <Text style={[s.cardTitle, {color: colors.textPrimary}]}>مزايا الخطة</Text>
              </View>
              <View style={[s.divider, {backgroundColor: colors.border}]} />
              <View style={s.featList}>
                {features.map((f, i) => (
                  <FeatureRow key={f.featureId ?? f.key ?? i} feature={f} colors={colors} lang={lang} />
                ))}
              </View>
            </View>
          )}

          {/* Period */}
          <View style={[s.card, {backgroundColor: colors.card, borderColor: colors.border}]}>
            <View style={s.cardHeader}>
              <Calendar size={18} color={colors.primary} strokeWidth={2} />
              <Text style={[s.cardTitle, {color: colors.textPrimary}]}>فترة الاشتراك</Text>
            </View>
            <View style={[s.divider, {backgroundColor: colors.border}]} />
            <InfoRow label="بداية الفترة"  value={periodStart}  colors={colors} />
            <View style={[s.divider, {backgroundColor: colors.border}]} />
            <InfoRow label="نهاية الفترة"  value={periodEnd}    colors={colors} />
            <View style={[s.divider, {backgroundColor: colors.border}]} />
            <InfoRow label="الأيام المتبقية" value={daysLeft}   colors={colors} valueColor={isExpired ? '#EF4444' : colors.textPrimary} />
          </View>

          <View style={{height: 32}} />
        </ScrollView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root:        {flex: 1},
  center:      {flex: 1, alignItems: 'center', justifyContent: 'center'},
  errorText:   {fontSize: 14, fontWeight: '600'},

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 56 : 48,
    paddingBottom: 16, paddingHorizontal: 16, borderBottomWidth: 1,
  },
  headerTitle: {fontSize: 18, fontWeight: '800'},
  backBtn:     {width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center'},

  scroll:      {flex: 1},
  content:     {padding: 16, gap: 14},

  heroCard:    {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    borderRadius: 18, borderWidth: 1, padding: 20,
  },
  heroIconBox: {width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center'},
  heroText:    {flex: 1, gap: 4},
  heroStatus:  {fontSize: 13, fontWeight: '700'},
  heroPlan:    {fontSize: 20, fontWeight: '900'},
  heroCycle:   {fontSize: 13},

  daysCard:    {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 14, borderWidth: 1, padding: 16,
  },
  daysText:    {fontSize: 14, fontWeight: '600'},
  daysBold:    {fontSize: 22, fontWeight: '900'},

  card:        {borderRadius: 18, borderWidth: 1, overflow: 'hidden'},
  cardHeader:  {flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16},
  cardTitle:   {fontSize: 15, fontWeight: '700'},
  divider:     {height: 1},

  infoRow:     {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14},
  infoLabel:   {fontSize: 13},
  infoValue:   {fontSize: 14, fontWeight: '700'},

  featList:    {padding: 16, paddingTop: 12, gap: 12},
  featRow:     {flexDirection: 'row', alignItems: 'center', gap: 10},
  featCheck:   {width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center'},
  featName:    {flex: 1, fontSize: 13, fontWeight: '600'},
  featLimit:   {borderRadius: 8, paddingHorizontal: 9, paddingVertical: 3, minWidth: 32, alignItems: 'center', justifyContent: 'center'},
  featLimitTxt:{fontSize: 12, fontWeight: '800'},
});
