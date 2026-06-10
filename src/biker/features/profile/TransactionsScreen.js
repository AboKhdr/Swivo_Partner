import React, {useEffect, useState} from 'react';
import {
  ActivityIndicator, Platform, ScrollView, StatusBar, StyleSheet,
  Text, TouchableOpacity, View,
} from 'react-native';
import {
  ChevronLeft, ArrowDownLeft, ArrowUpRight, Wallet, RefreshCcw, Gift,
} from 'lucide-react-native';
import {useTheme} from '../../../shared/context/ThemeContext';
import {useI18n} from '../../../shared/i18n/I18nContext';
import {getClientTransactions} from '../../../services/biker';

// Icon per transaction type
const TX_CONFIG = {
  payment:       {Icon: ArrowUpRight,  bg: '#FEF2F2', color: '#EF4444'},
  refund:        {Icon: ArrowDownLeft, bg: '#F0FDF4', color: '#22C55E'},
  wallet_topup:  {Icon: Wallet,        bg: '#EFF6FF', color: '#3B82F6'},
  wallet_credit: {Icon: Wallet,        bg: '#EFF6FF', color: '#3B82F6'},
  gift:          {Icon: Gift,          bg: '#FDF4FF', color: '#A855F7'},
  default:       {Icon: RefreshCcw,    bg: '#F8FAFC', color: '#64748B'},
};

function TxIcon({type}) {
  const cfg = TX_CONFIG[type] ?? TX_CONFIG.default;
  return (
    <View style={[si.wrap, {backgroundColor: cfg.bg}]}>
      <cfg.Icon size={18} color={cfg.color} strokeWidth={2} />
    </View>
  );
}
const si = StyleSheet.create({
  wrap: {width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center'},
});

function TxRow({item, colors, t, lang}) {
  const isCredit = item.entryType === 'credit';
  const amount   = typeof item.amount === 'object'
    ? Number(item.amount?.$numberDecimal ?? item.amount)
    : Number(item.amount ?? 0);

  // Prefer the backend description; otherwise fall back to a translated type label.
  const typeLabel = t(`transactions.types.${item.type}`);
  const fallback  = typeLabel === `transactions.types.${item.type}`
    ? t('transactions.types.default')
    : typeLabel;
  const label = item.description || fallback;
  const time  = item.createdAt
    ? new Date(item.createdAt).toLocaleTimeString(
        lang === 'ar' ? 'ar-SA' : lang === 'hi' ? 'hi-IN' : 'en-US',
        {hour: '2-digit', minute: '2-digit'},
      )
    : '';

  return (
    <View style={s.txRow}>
      <TxIcon type={item.type} />
      <View style={s.txMiddle}>
        <Text style={[s.txLabel, {color: colors.textPrimary}]} numberOfLines={1}>{label}</Text>
        {!!time && <Text style={[s.txTime, {color: colors.textSecondary}]}>{time}</Text>}
      </View>
      <Text style={[s.txAmount, {color: isCredit ? '#22C55E' : '#EF4444'}]}>
        {isCredit ? '+' : '-'}{amount.toFixed(2)} ﷼
      </Text>
    </View>
  );
}

function groupByDate(transactions) {
  const groups = {};
  for (const tx of transactions) {
    const key = tx.createdAt
      ? new Date(tx.createdAt).toISOString().split('T')[0]
      : 'unknown';
    if (!groups[key]) groups[key] = [];
    groups[key].push(tx);
  }
  return Object.entries(groups)
    .sort((a, b) => (b[0] > a[0] ? 1 : -1))
    .map(([date, items]) => ({date, items}));
}

function formatDate(dateStr, lang) {
  if (!dateStr || dateStr === 'unknown') return '—';
  try {
    return new Date(dateStr).toLocaleDateString(
      lang === 'ar' ? 'ar-SA' : 'en-US',
      {weekday: 'long', day: 'numeric', month: 'long'},
    );
  } catch {
    return dateStr;
  }
}

export default function TransactionsScreen({onBack}) {
  const {colors, isDark} = useTheme();
  const {t, lang}        = useI18n();

  const [loading,  setLoading]  = useState(true);
  const [balance,  setBalance]  = useState(0);
  const [groups,   setGroups]   = useState([]);
  const [error,    setError]    = useState(null);

  useEffect(() => {
    setLoading(true);
    getClientTransactions()
      .then(res => {
        if (res.success !== false) {
          const data = res.data ?? res;
          setBalance(Number(data.balance ?? 0));
          setGroups(groupByDate(data.transactions ?? []));
        } else {
          setError(t('transactions.error'));
        }
      })
      .catch(() => setError(t('transactions.error')))
      .finally(() => setLoading(false));
  }, [t]);

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
          hitSlop={{top: 12, bottom: 12, left: 12, right: 12}}>
          <ChevronLeft size={22} color={colors.textPrimary} strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, {color: colors.textPrimary}]}>
          {t('transactions.title')}
        </Text>
        <View style={{width: 36}} />
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : error ? (
        <View style={s.center}>
          <Text style={[s.errorText, {color: colors.danger ?? '#EF4444'}]}>{error}</Text>
        </View>
      ) : (
        <ScrollView
          style={s.scroll}
          contentContainerStyle={s.content}
          showsVerticalScrollIndicator={false}>

          {/* Balance summary card */}
          <View style={[s.balanceCard, {backgroundColor: colors.primary, shadowColor: colors.primary}]}>
            <View style={s.balanceRow}>
              <View style={s.balanceLeft}>
                <Text style={s.balanceLabel}>
                  {t('transactions.balance')}
                </Text>
                <View style={s.balanceAmountRow}>
                  <Text style={s.balanceAmount}>{balance.toFixed(2)}</Text>
                  <Text style={s.balanceCurrency}>﷼</Text>
                </View>
              </View>
              <View style={s.walletIconWrap}>
                <Wallet size={24} color="#fff" strokeWidth={2} />
              </View>
            </View>
          </View>

          {/* Transaction groups */}
          {groups.map(group => (
            <View key={group.date} style={s.group}>
              <Text style={[s.groupDate, {color: colors.textSecondary}]}>
                {formatDate(group.date, lang)}
              </Text>
              <View style={[s.groupCard, {backgroundColor: colors.card, borderColor: colors.border}]}>
                {group.items.map((item, i) => (
                  <View key={item._id ?? i}>
                    <TxRow item={item} colors={colors} t={t} lang={lang} />
                    {i < group.items.length - 1 && (
                      <View style={[s.divider, {backgroundColor: colors.border}]} />
                    )}
                  </View>
                ))}
              </View>
            </View>
          ))}

          {groups.length === 0 && (
            <Text style={[s.empty, {color: colors.textSecondary}]}>
              {t('transactions.noTransactions')}
            </Text>
          )}

          <View style={{height: 24}} />
        </ScrollView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root:   {flex: 1},
  center: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 56 : 48,
    paddingBottom: 16, paddingHorizontal: 16, borderBottomWidth: 1,
  },
  backBtn:      {width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center'},
  headerTitle:  {flex: 1, fontSize: 18, fontWeight: '800', textAlign: 'center'},
  scroll:       {flex: 1},
  content:      {padding: 16, gap: 16},

  balanceCard: {
    borderRadius: 22, padding: 22,
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.25, shadowRadius: 16, elevation: 8,
  },
  balanceRow:      {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  balanceLeft:     {gap: 6},
  balanceLabel:    {fontSize: 13, color: 'rgba(255,255,255,0.75)', fontWeight: '600'},
  balanceAmountRow:{flexDirection: 'row', alignItems: 'flex-end', gap: 6},
  balanceAmount:   {fontSize: 36, fontWeight: '900', color: '#fff', lineHeight: 40},
  balanceCurrency: {fontSize: 17, fontWeight: '700', color: '#fff', marginBottom: 3},
  walletIconWrap:  {
    width: 50, height: 50, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },

  group:     {gap: 8},
  groupDate: {fontSize: 12, fontWeight: '700', paddingHorizontal: 4},
  groupCard: {borderRadius: 18, borderWidth: 1, overflow: 'hidden'},

  txRow:    {flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 13, gap: 12},
  txMiddle: {flex: 1, gap: 2},
  txLabel:  {fontSize: 13, fontWeight: '600'},
  txTime:   {fontSize: 11},
  txAmount: {fontSize: 14, fontWeight: '800'},

  divider:   {height: 1, marginHorizontal: 16},
  empty:     {textAlign: 'center', marginTop: 48, fontSize: 14},
  errorText: {fontSize: 14, textAlign: 'center'},
});
