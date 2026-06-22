import React, {useEffect, useState} from 'react';
import {
  ActivityIndicator, Modal, Platform, ScrollView, StatusBar, StyleSheet,
  Text, TouchableOpacity, View,
} from 'react-native';
import {
  ChevronLeft, ArrowDownLeft, ArrowUpRight, Wallet, RefreshCcw, Gift, X,
} from 'lucide-react-native';
import {useTheme} from '../../../shared/context/ThemeContext';
import {useI18n} from '../../../shared/i18n/I18nContext';
import {getClientTransactions} from '../../../services/biker';
import {STATUS_COLORS} from '../../../shared/constants/status';
import RiyalIcon from '../../../shared/components/RiyalIcon';

// Normalise the transaction amount (handles Decimal128 `{$numberDecimal}` shape).
function txAmount(item) {
  return typeof item.amount === 'object'
    ? Number(item.amount?.$numberDecimal ?? item.amount)
    : Number(item.amount ?? 0);
}

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

// Resolve a translated label for a transaction, preferring the backend description.
function txLabel(item, t) {
  const typeLabel = t(`transactions.types.${item.type}`);
  const fallback  = typeLabel === `transactions.types.${item.type}`
    ? t('transactions.types.default')
    : typeLabel;
  return item.description || fallback;
}

function txTime(item, lang) {
  return item.createdAt
    ? new Date(item.createdAt).toLocaleTimeString(
        lang === 'ar' ? 'ar-SA' : lang === 'hi' ? 'hi-IN' : 'en-US',
        {hour: '2-digit', minute: '2-digit'},
      )
    : '';
}

function TxRow({item, colors, t, lang, currencySymbol = '﷼', showRiyalIcon = true, onPress}) {
  const isCredit = item.entryType === 'credit';
  const amount   = txAmount(item);
  const label    = txLabel(item, t);
  const time     = txTime(item, lang);

  return (
    <TouchableOpacity style={s.txRow} onPress={() => onPress?.(item)} activeOpacity={0.6}>
      <TxIcon type={item.type} />
      <View style={s.txMiddle}>
        <Text style={[s.txLabel, {color: colors.textPrimary}]} numberOfLines={1}>{label}</Text>
        {!!time && <Text style={[s.txTime, {color: colors.textSecondary}]}>{time}</Text>}
      </View>
      <View style={s.txAmountRow}>
        <Text style={[s.txAmount, {color: isCredit ? '#22C55E' : '#EF4444'}]}>
          {isCredit ? '+' : '-'}{amount.toFixed(2)}
        </Text>
        {showRiyalIcon ? (
          <RiyalIcon size={14} color={isCredit ? '#22C55E' : '#EF4444'} />
        ) : (
          <Text style={[s.txAmount, {color: isCredit ? '#22C55E' : '#EF4444'}]}>{' '}{currencySymbol}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

function DetailRow({label, value, colors, valueColor}) {
  if (value === null || value === undefined || value === '') return null;
  return (
    <View style={[s.dRow, {borderBottomColor: colors.border}]}>
      <Text style={[s.dLabel, {color: colors.textSecondary}]}>{label}</Text>
      <Text style={[s.dValue, {color: valueColor ?? colors.textPrimary}]} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

function TxDetailsModal({item, colors, t, lang, currencySymbol, isRiyal, onClose}) {
  if (!item) return null;

  const isCredit = item.entryType === 'credit';
  const amount   = txAmount(item);
  const fullDate = item.createdAt
    ? new Date(item.createdAt).toLocaleString(
        lang === 'ar' ? 'ar-SA' : lang === 'hi' ? 'hi-IN' : 'en-US',
        {weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'},
      )
    : '';

  const statusLabel = t(`transactions.status.${item.status}`) === `transactions.status.${item.status}`
    ? t('transactions.status.default')
    : t(`transactions.status.${item.status}`);

  const order      = item.order;
  const orderColor = order?.status ? STATUS_COLORS[order.status]?.text : undefined;

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <View style={s.modalOverlay}>
        <View style={[s.modalCard, {backgroundColor: colors.bg}]}>
          {/* Modal header */}
          <View style={[s.modalHeader, {borderBottomColor: colors.border}]}>
            <Text style={[s.modalTitle, {color: colors.textPrimary}]}>
              {t('transactions.details.title')}
            </Text>
            <TouchableOpacity
              style={[s.modalClose, {backgroundColor: colors.card}]}
              onPress={onClose}
              hitSlop={{top: 12, bottom: 12, left: 12, right: 12}}>
              <X size={20} color={colors.textPrimary} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={s.modalContent} showsVerticalScrollIndicator={false}>
            {/* Amount hero */}
            <View style={s.modalAmountWrap}>
              <View style={[si.wrap, {backgroundColor: (TX_CONFIG[item.type] ?? TX_CONFIG.default).bg, width: 56, height: 56, borderRadius: 28}]}>
                {React.createElement((TX_CONFIG[item.type] ?? TX_CONFIG.default).Icon, {
                  size: 24, color: (TX_CONFIG[item.type] ?? TX_CONFIG.default).color, strokeWidth: 2,
                })}
              </View>
              <View style={s.modalAmountRow}>
                <Text style={[s.modalAmount, {color: isCredit ? '#22C55E' : '#EF4444'}]}>
                  {isCredit ? '+' : '-'}{amount.toFixed(2)}
                </Text>
                {isRiyal ? (
                  <RiyalIcon size={30} color={isCredit ? '#22C55E' : '#EF4444'} />
                ) : (
                  <Text style={[s.modalAmount, {color: isCredit ? '#22C55E' : '#EF4444'}]}>{' '}{currencySymbol}</Text>
                )}
              </View>
              <Text style={[s.modalAmountSub, {color: colors.textSecondary}]}>
                {txLabel(item, t)}
              </Text>
            </View>

            {/* Detail rows */}
            <View style={[s.detailCard, {backgroundColor: colors.card, borderColor: colors.border}]}>
              <DetailRow
                label={t('transactions.details.type')}
                value={isCredit ? t('transactions.details.credit') : t('transactions.details.debit')}
                colors={colors}
                valueColor={isCredit ? '#22C55E' : '#EF4444'}
              />
              <DetailRow label={t('transactions.details.status')} value={statusLabel} colors={colors} />
              <DetailRow label={t('transactions.details.reference')} value={item.reference} colors={colors} />
              <DetailRow label={t('transactions.details.date')} value={fullDate} colors={colors} />
              {!!item.paymentMethod && (
                <DetailRow label={t('transactions.details.paymentMethod')} value={item.paymentMethod} colors={colors} />
              )}
              {!!item.description && (
                <DetailRow label={t('transactions.details.description')} value={item.description} colors={colors} />
              )}
            </View>

            {/* Linked order */}
            {order && (
              <View style={[s.detailCard, {backgroundColor: colors.card, borderColor: colors.border}]}>
                <DetailRow
                  label={t('transactions.details.orderNumber')}
                  value={order.orderNumber ? `#${order.orderNumber}` : null}
                  colors={colors}
                />
                <DetailRow
                  label={t('transactions.details.orderTotal')}
                  value={order.totalAmount != null ? `${Number(order.totalAmount).toFixed(2)} ${currencySymbol}` : null}
                  colors={colors}
                />
                <DetailRow
                  label={t('transactions.details.orderStatus')}
                  value={order.status}
                  colors={colors}
                  valueColor={orderColor}
                />
              </View>
            )}

            <View style={{height: 12}} />
          </ScrollView>
        </View>
      </View>
    </Modal>
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
  const [currency, setCurrency] = useState('SAR');
  const [groups,   setGroups]   = useState([]);
  const [error,    setError]    = useState(null);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    setLoading(true);
    getClientTransactions()
      .then(res => {
        if (res.success !== false) {
          const data = res.data ?? res;
          // Spec shape: { wallet: { balance, currency }, data: [...] }
          // Legacy fallback: { balance, transactions: [...] }
          const wallet = data.wallet ?? data;
          const list   = data.data ?? data.transactions ?? [];
          setBalance(Number(wallet.balance ?? 0));
          setCurrency(wallet.currency ?? 'SAR');
          setGroups(groupByDate(Array.isArray(list) ? list : []));
        } else {
          setError(t('transactions.error'));
        }
      })
      .catch(() => setError(t('transactions.error')))
      .finally(() => setLoading(false));
  }, [t]);

  const isRiyal = currency === 'SAR';
  const currencySymbol = isRiyal ? '﷼' : currency;

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
                  {isRiyal ? (
                    <RiyalIcon size={32} color="#fff" style={s.balanceCurrencyIcon} />
                  ) : (
                    <Text style={s.balanceCurrency}>{currencySymbol}</Text>
                  )}
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
                    <TxRow item={item} colors={colors} t={t} lang={lang} currencySymbol={currencySymbol} showRiyalIcon={isRiyal} onPress={setSelected} />
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

      <TxDetailsModal
        item={selected}
        colors={colors}
        t={t}
        lang={lang}
        currencySymbol={currencySymbol}
        isRiyal={isRiyal}
        onClose={() => setSelected(null)}
      />
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
  balanceCurrencyIcon: {marginBottom: 3},
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
  txAmountRow: {flexDirection: 'row', alignItems: 'center', gap: 3},

  divider:   {height: 1, marginHorizontal: 16},
  empty:     {textAlign: 'center', marginTop: 48, fontSize: 14},
  errorText: {fontSize: 14, textAlign: 'center'},

  // Details modal
  modalOverlay: {flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)'},
  modalCard:    {borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '85%', paddingBottom: Platform.OS === 'ios' ? 24 : 12},
  modalHeader:  {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16, borderBottomWidth: 1},
  modalTitle:   {fontSize: 17, fontWeight: '800'},
  modalClose:   {width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center'},
  modalContent: {padding: 20, gap: 16},

  modalAmountWrap: {alignItems: 'center', gap: 10, paddingVertical: 8},
  modalAmount:     {fontSize: 32, fontWeight: '900'},
  modalAmountRow:  {flexDirection: 'row', alignItems: 'center', gap: 4},
  modalAmountSub:  {fontSize: 13, fontWeight: '600', textAlign: 'center'},

  detailCard: {borderRadius: 16, borderWidth: 1, overflow: 'hidden'},
  dRow:       {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1},
  dLabel:     {fontSize: 13, fontWeight: '500'},
  dValue:     {fontSize: 13, fontWeight: '700', flexShrink: 1},
});
