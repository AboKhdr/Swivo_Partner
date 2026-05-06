import React, {useEffect, useState} from 'react';
import {
  ActivityIndicator, Platform, ScrollView, StatusBar, StyleSheet,
  Text, TouchableOpacity, View,
} from 'react-native';
import {ChevronLeft, Wallet, Droplets, X, Building2} from 'lucide-react-native';
import {useTheme} from '../../../shared/context/ThemeContext';
import {useI18n} from '../../../shared/i18n/I18nContext';
import {getWallet} from '../../../services/biker';

const TX_TYPE_ICON = {
  order_earning: {bg: '#E8F5E9', Icon: Droplets, color: '#4CAF50'},
  payout:        {bg: null,     Icon: Building2, color: null},
  commission:    {bg: '#FEECEC', Icon: X,         color: '#EF4444'},
  refund:        {bg: '#E8F5E9', Icon: Droplets,  color: '#4CAF50'},
};

function TxIcon({type, colors}) {
  const cfg = TX_TYPE_ICON[type] ?? TX_TYPE_ICON.payout;
  const bg = cfg.bg ?? colors.bg;
  const color = cfg.color ?? colors.textSecondary;
  const IconComp = cfg.Icon;
  return (
    <View style={[si.wrap, {backgroundColor: bg}]}>
      <IconComp size={20} color={color} strokeWidth={2} />
    </View>
  );
}

const si = StyleSheet.create({
  wrap: {width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center'},
});

function TxRow({item, colors}) {
  const isCredit = item.entryType === 'credit';
  const amountStr = `${isCredit ? '+' : '-'}${item.amount?.toFixed(2) ?? '0.00'}`;
  return (
    <View style={s.txRow}>
      <Text style={[s.txAmount, {color: isCredit ? colors.success : colors.danger}]}>
        ﷼ {amountStr}
      </Text>
      <View style={s.txMiddle}>
        <Text style={[s.txLabel, {color: colors.textPrimary}]} numberOfLines={1}>{item.description ?? item.reference}</Text>
        <Text style={[s.txTime, {color: colors.textSecondary}]}>{item.createdAt ? new Date(item.createdAt).toLocaleTimeString('ar-SA', {hour: '2-digit', minute: '2-digit'}) : ''}</Text>
      </View>
      <TxIcon type={item.type} colors={colors} />
    </View>
  );
}

function groupByDate(transactions) {
  const groups = {};
  transactions.forEach(tx => {
    const date = tx.createdAt ? new Date(tx.createdAt).toISOString().split('T')[0] : 'unknown';
    if (!groups[date]) groups[date] = [];
    groups[date].push(tx);
  });
  return Object.entries(groups).map(([date, items]) => ({date, items}));
}

export default function WalletScreen({onBack}) {
  const {colors, isDark} = useTheme();
  const {t} = useI18n();
  const [loading, setLoading] = useState(true);
  const [wallet, setWallet] = useState(null);
  const [groups, setGroups] = useState([]);

  useEffect(() => {
    getWallet().then(res => {
      if (res.success && res.data) {
        const data = res.data;
        setWallet(data.wallet ?? data);
        const txList = data.transaction ?? data.transactions ?? [];
        setGroups(groupByDate(txList));
      }
      setLoading(false);
    });
  }, []);

  return (
    <View style={[s.root, {backgroundColor: colors.bg}]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.card} />

      <View style={[s.header, {backgroundColor: colors.card, borderBottomColor: colors.border}]}>
        <TouchableOpacity
          style={[s.backBtn, {backgroundColor: colors.bg}]}
          onPress={onBack}
          hitSlop={{top:12,bottom:12,left:12,right:12}}>
          <ChevronLeft size={22} color={colors.textPrimary} strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, {color: colors.textPrimary}]}>{t('wallet.title')}</Text>
        <View style={{width: 36}} />
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView style={s.scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

          <View style={[s.balanceCard, {backgroundColor: colors.primary, shadowColor: colors.primary}]}>
            <View style={s.balanceInner}>
              <View style={s.balanceTextCol}>
                <Text style={s.balanceLabel}>{t('wallet.balance')}</Text>
                <View style={s.balanceAmountRow}>
                  <Text style={s.balanceAmount}>{(wallet?.balance ?? 0).toFixed(2)}</Text>
                  <Text style={s.balanceCurrency}>﷼</Text>
                </View>
              </View>
              <View style={s.walletIconWrap}>
                <Wallet size={26} color="#fff" strokeWidth={2} />
              </View>
            </View>
          </View>

          {groups.map(group => (
            <View key={group.date} style={s.group}>
              <Text style={[s.groupDate, {color: colors.textSecondary}]}>{group.date}</Text>
              <View style={[s.groupCard, {backgroundColor: colors.card, borderColor: colors.border}]}>
                {group.items.map((item, i) => (
                  <View key={item._id ?? i}>
                    <TxRow item={item} colors={colors} />
                    {i < group.items.length - 1 && (
                      <View style={[s.divider, {backgroundColor: colors.border}]} />
                    )}
                  </View>
                ))}
              </View>
            </View>
          ))}

          {groups.length === 0 && (
            <Text style={[s.empty, {color: colors.textSecondary}]}>{t('wallet.noTransactions')}</Text>
          )}

          <View style={{height: 24}} />
        </ScrollView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: {flex: 1},
  center: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 56 : 48,
    paddingBottom: 16, paddingHorizontal: 16, borderBottomWidth: 1,
  },
  backBtn: {width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center'},
  headerTitle: {flex: 1, fontSize: 18, fontWeight: '800', textAlign: 'center'},
  scroll: {flex: 1},
  content: {padding: 16, gap: 16},
  balanceCard: {borderRadius: 22, padding: 24, shadowOffset: {width: 0, height: 8}, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8},
  balanceInner: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  balanceTextCol: {gap: 6},
  balanceLabel: {fontSize: 14, color: 'rgba(255,255,255,0.75)'},
  balanceAmountRow: {flexDirection: 'row', alignItems: 'flex-end', gap: 6},
  balanceCurrency: {fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 4},
  balanceAmount: {fontSize: 38, fontWeight: '900', color: '#fff', lineHeight: 42},
  walletIconWrap: {width: 54, height: 54, borderRadius: 16, backgroundColor: '#F59E0B', alignItems: 'center', justifyContent: 'center'},
  group: {gap: 8},
  groupDate: {fontSize: 13, fontWeight: '700', paddingHorizontal: 4},
  groupCard: {borderRadius: 18, borderWidth: 1, overflow: 'hidden'},
  txRow: {flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12},
  txMiddle: {flex: 1, gap: 3},
  txLabel: {fontSize: 13, fontWeight: '600'},
  txTime: {fontSize: 11},
  txAmount: {fontSize: 14, fontWeight: '800', minWidth: 70},
  divider: {height: 1, marginHorizontal: 16},
  empty: {textAlign: 'center', marginTop: 40, fontSize: 14},
});
