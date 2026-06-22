import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  ActivityIndicator, Animated, Easing, Modal, Platform, RefreshControl,
  ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import {
  ChevronLeft, Wallet, ArrowDownLeft, ArrowUpRight, RefreshCcw, Gift, X, RotateCw,
} from 'lucide-react-native';
import {useTheme} from '../../../shared/context/ThemeContext';
import {useI18n} from '../../../shared/i18n/I18nContext';
import {getClientTransactions} from '../../../services/biker';
import {STATUS_COLORS} from '../../../shared/constants/status';
import RiyalIcon from '../../../shared/components/RiyalIcon';

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
    <View style={[s.txIconWrap, {backgroundColor: cfg.bg}]}>
      <cfg.Icon size={18} color={cfg.color} strokeWidth={2} />
    </View>
  );
}

function txAmount(item) {
  return typeof item.amount === 'object'
    ? Number(item.amount?.$numberDecimal ?? item.amount)
    : Number(item.amount ?? 0);
}

function txLabel(item, t) {
  const typeLabel = t(`transactions.types.${item.type}`);
  const fallback  = typeLabel === `transactions.types.${item.type}`
    ? t('transactions.types.default')
    : typeLabel;
  return item.description || fallback;
}

function TxRow({item, colors, t, lang, currencySymbol, showRiyalIcon, onPress}) {
  const isCredit = item.entryType === 'credit';
  const amount   = txAmount(item);
  const label    = txLabel(item, t);
  const time     = item.createdAt
    ? new Date(item.createdAt).toLocaleTimeString(
        lang === 'ar' ? 'ar-SA' : lang === 'hi' ? 'hi-IN' : 'en-US',
        {hour: '2-digit', minute: '2-digit'},
      )
    : '';

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

function TxDetailsModal({item, colors, t, lang, currencySymbol, showRiyalIcon, onClose}) {
  if (!item) return null;

  const isCredit = item.entryType === 'credit';
  const amount   = txAmount(item);
  const amountColor = isCredit ? '#22C55E' : '#EF4444';
  const cfg = TX_CONFIG[item.type] ?? TX_CONFIG.default;
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
  const orderTotal = order?.totalAmount != null ? Number(order.totalAmount).toFixed(2) : null;

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
              <View style={[s.modalIconWrap, {backgroundColor: cfg.bg}]}>
                <cfg.Icon size={24} color={cfg.color} strokeWidth={2} />
              </View>
              <View style={s.modalAmountRow}>
                <Text style={[s.modalAmount, {color: amountColor}]}>
                  {isCredit ? '+' : '-'}{amount.toFixed(2)}
                </Text>
                {showRiyalIcon ? (
                  <RiyalIcon size={30} color={amountColor} />
                ) : (
                  <Text style={[s.modalAmount, {color: amountColor}]}>{' '}{currencySymbol}</Text>
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
                valueColor={amountColor}
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
                  value={orderTotal != null ? `${orderTotal} ${currencySymbol}` : null}
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

// Animated refresh button — spins continuously while `spinning` is true.
function RefreshButton({spinning, onPress, colors}) {
  const spin    = useRef(new Animated.Value(0)).current;
  const loopRef = useRef(null);

  useEffect(() => {
    if (spinning) {
      spin.setValue(0);
      loopRef.current = Animated.loop(
        Animated.timing(spin, {
          toValue: 1,
          duration: 850,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      );
      loopRef.current.start();
    } else {
      loopRef.current?.stop();
      // Ease back to rest so it doesn't stop mid-spin abruptly.
      Animated.timing(spin, {
        toValue: 1,
        duration: 250,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start(() => spin.setValue(0));
    }
    return () => loopRef.current?.stop();
  }, [spinning, spin]);

  const rotate = spin.interpolate({inputRange: [0, 1], outputRange: ['0deg', '360deg']});

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={spinning}
      activeOpacity={0.7}
      hitSlop={{top: 12, bottom: 12, left: 12, right: 12}}
      style={[s.refreshBtn, {backgroundColor: colors.primary + '15', borderColor: colors.primary + '30'}]}>
      <Animated.View style={{transform: [{rotate}]}}>
        <RotateCw size={19} color={colors.primary} strokeWidth={2.5} />
      </Animated.View>
    </TouchableOpacity>
  );
}

export default function WalletScreen({onBack}) {
  const {colors, isDark} = useTheme();
  const {t, lang}        = useI18n();
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [balance,    setBalance]    = useState(0);
  const [currency,   setCurrency]   = useState('SAR');
  const [groups,     setGroups]     = useState([]);
  const [selected,   setSelected]   = useState(null);

  const load = useCallback(async () => {
    const res = await getClientTransactions();
    if (res.success !== false) {
      const data   = res.data ?? res;
      const wallet = data.wallet ?? data;
      const list   = data.data ?? data.transactions ?? [];
      setBalance(Number(wallet.balance ?? 0));
      setCurrency(wallet.currency ?? 'SAR');
      setGroups(groupByDate(Array.isArray(list) ? list : []));
    }
  }, []);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const isRiyal = currency === 'SAR';
  const currencySymbol = isRiyal ? '﷼' : currency;

  return (
    <View style={[s.root, {backgroundColor: colors.bg}]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.bg} />

      {/* Header */}
      <View style={[s.header, {backgroundColor: colors.bg}]}>
        {onBack ? (
          <TouchableOpacity
            style={[s.backBtn, {backgroundColor: colors.card}]}
            onPress={onBack}
            hitSlop={{top:12,bottom:12,left:12,right:12}}>
            <ChevronLeft size={22} color={colors.textPrimary} strokeWidth={2.5} />
          </TouchableOpacity>
        ) : (
          <View style={s.backBtn} />
        )}
        <Text style={[s.headerTitle, {color: colors.textPrimary}]}>{t('wallet.title')}</Text>
        <RefreshButton spinning={refreshing} onPress={onRefresh} colors={colors} />
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          style={s.scroll}
          contentContainerStyle={s.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} />
          }>

          {/* Balance hero card */}
          <View style={[s.heroCard, {backgroundColor: colors.primary, shadowColor: colors.primary}]}>
            <View style={[s.heroIconWrap, {backgroundColor: 'rgba(255,255,255,0.18)'}]}>
              <Wallet size={30} color="#fff" strokeWidth={2} />
            </View>
            <Text style={s.heroLabel}>{t('wallet.balance')}</Text>
            <View style={s.heroAmountRow}>
              <Text style={s.heroAmount}>{balance.toLocaleString('ar-SA', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</Text>
              {isRiyal ? (
                <RiyalIcon size={40} color="#fff" style={s.heroCurrencyIcon} />
              ) : (
                <Text style={s.heroCurrency}>{currencySymbol}</Text>
              )}
            </View>
          </View>

          {/* Transactions */}
          <Text style={[s.sectionTitle, {color: colors.textPrimary}]}>{t('transactions.title')}</Text>

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
        showRiyalIcon={isRiyal}
        onClose={() => setSelected(null)}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root:    {flex: 1},
  center:  {flex: 1, alignItems: 'center', justifyContent: 'center'},

  header:      {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: Platform.OS === 'ios' ? 56 : 48, paddingBottom: 12, paddingHorizontal: 16},
  backBtn:     {width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center'},
  refreshBtn:  {width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1},
  headerTitle: {flex: 1, fontSize: 18, fontWeight: '800', textAlign: 'center'},

  scroll:  {flex: 1},
  content: {padding: 16, gap: 16},

  heroCard:      {borderRadius: 24, padding: 28, alignItems: 'center', gap: 8, shadowOffset: {width: 0, height: 10}, shadowOpacity: 0.35, shadowRadius: 20, elevation: 10},
  heroIconWrap:  {width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 4},
  heroLabel:     {fontSize: 14, color: 'rgba(255,255,255,0.75)', fontWeight: '600'},
  heroAmountRow: {flexDirection: 'row', alignItems: 'flex-end', gap: 6},
  heroAmount:    {fontSize: 46, fontWeight: '900', color: '#fff', lineHeight: 50},
  heroCurrency:  {fontSize: 22, fontWeight: '700', color: 'rgba(255,255,255,0.9)', marginBottom: 6},
  heroCurrencyIcon: {marginBottom: 6},

  sectionTitle: {fontSize: 16, fontWeight: '800', marginBottom: -4},

  group:     {gap: 8},
  groupDate: {fontSize: 12, fontWeight: '700', paddingHorizontal: 4},
  groupCard: {borderRadius: 18, borderWidth: 1, overflow: 'hidden'},

  txIconWrap: {width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center'},
  txRow:      {flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 13, gap: 12},
  txMiddle:   {flex: 1, gap: 2},
  txLabel:    {fontSize: 13, fontWeight: '600'},
  txTime:     {fontSize: 11},
  txAmount:   {fontSize: 14, fontWeight: '800'},
  txAmountRow: {flexDirection: 'row', alignItems: 'center', gap: 3},

  divider: {height: 1, marginHorizontal: 16},
  empty:   {textAlign: 'center', marginTop: 32, fontSize: 14},

  // Details modal
  modalOverlay: {flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)'},
  modalCard:    {borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '85%', paddingBottom: Platform.OS === 'ios' ? 24 : 12},
  modalHeader:  {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16, borderBottomWidth: 1},
  modalTitle:   {fontSize: 17, fontWeight: '800'},
  modalClose:   {width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center'},
  modalContent: {padding: 20, gap: 16},

  modalAmountWrap: {alignItems: 'center', gap: 10, paddingVertical: 8},
  modalIconWrap:   {width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center'},
  modalAmountRow:  {flexDirection: 'row', alignItems: 'center', gap: 4},
  modalAmount:     {fontSize: 32, fontWeight: '900'},
  modalAmountSub:  {fontSize: 13, fontWeight: '600', textAlign: 'center'},

  detailCard: {borderRadius: 16, borderWidth: 1, overflow: 'hidden'},
  dRow:       {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1},
  dLabel:     {fontSize: 13, fontWeight: '500'},
  dValue:     {fontSize: 13, fontWeight: '700', flexShrink: 1},
});
