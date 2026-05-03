import React from 'react';
import {
  Platform, ScrollView, StatusBar, StyleSheet,
  Text, TouchableOpacity, View,
} from 'react-native';
import {ChevronLeft, Wallet, Droplets, X, Building2} from 'lucide-react-native';
import {useTheme} from '../../../shared/context/ThemeContext';
import {useI18n} from '../../../shared/i18n/I18nContext';
import {MOCK_USER} from '../../../shared/data/mockData';

const TRANSACTIONS = [
  {
    dateKey: 'today',
    items: [
      {id: '1', label: 'تم الغاء غسله رقم 432312', time: '3:00 PM - 3:55 PM', amount: '+20.00', type: 'wash'},
      {id: '2', label: 'تم الغاء الطلب الجاري',   time: '3:00 PM - 3:55 PM', amount: '+10.00', type: 'cancel'},
      {id: '3', label: 'تم ارسال مبلغ الى حسابك البنك', time: '3:00 PM - 3:55 PM', amount: '-100.00', type: 'bank'},
    ],
  },
  {
    date: '20 - مايو - 2025',
    items: [
      {id: '4', label: 'تم الغاء الطلب الجاري',   time: '3:00 PM - 3:55 PM', amount: '+10.00', type: 'wash'},
      {id: '5', label: 'تم الغاء الطلب الجاري',   time: '3:00 PM - 3:55 PM', amount: '+10.00', type: 'cancel'},
      {id: '6', label: 'تم ارسال مبلغ الى حسابك البنك', time: '3:00 PM - 3:55 PM', amount: '-100.00', type: 'bank'},
    ],
  },
];

function TxIcon({type, colors}) {
  if (type === 'wash') {
    return (
      <View style={[si.wrap, {backgroundColor: '#E8F5E9'}]}>
        <Droplets size={20} color="#4CAF50" strokeWidth={2} />
      </View>
    );
  }
  if (type === 'cancel') {
    return (
      <View style={[si.wrap, {backgroundColor: '#FEECEC'}]}>
        <X size={20} color={colors.danger} strokeWidth={2.5} />
      </View>
    );
  }
  return (
    <View style={[si.wrap, {backgroundColor: colors.bg}]}>
      <Building2 size={20} color={colors.textSecondary} strokeWidth={2} />
    </View>
  );
}

const si = StyleSheet.create({
  wrap: {width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center'},
});

function TxRow({item, colors}) {
  const isPositive = item.amount.startsWith('+');
  return (
    <View style={s.txRow}>
      <Text style={[s.txAmount, {color: isPositive ? colors.success : colors.danger}]}>
        ﷼ {item.amount}
      </Text>
      <View style={s.txMiddle}>
        <Text style={[s.txLabel, {color: colors.textPrimary}]} numberOfLines={1}>{item.label}</Text>
        <Text style={[s.txTime, {color: colors.textSecondary}]}>{item.time}</Text>
      </View>
      <TxIcon type={item.type} colors={colors} />
    </View>
  );
}

export default function WalletScreen({onBack}) {
  const {colors, isDark} = useTheme();
  const {t} = useI18n();

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
        <Text style={[s.headerTitle, {color: colors.textPrimary}]}>{t('wallet.title')}</Text>
        <TouchableOpacity style={[s.headerIconBtn, {backgroundColor: colors.bg}]} activeOpacity={0.7}>
          <ChevronLeft size={20} color={colors.textPrimary} strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

        {/* Balance card */}
        <View style={[s.balanceCard, {backgroundColor: colors.primary, shadowColor: colors.primary}]}>
          <View style={s.balanceInner}>
            <View style={s.balanceTextCol}>
              <Text style={s.balanceLabel}>{t('wallet.balance')}</Text>
              <View style={s.balanceAmountRow}>
                <Text style={s.balanceAmount}>{MOCK_USER.wallet.balance.toFixed(2)}</Text>
                <Text style={s.balanceCurrency}>﷼</Text>
              </View>
            </View>
            <View style={s.walletIconWrap}>
              <Wallet size={26} color="#fff" strokeWidth={2} />
            </View>
          </View>
        </View>

        {/* Transactions grouped by date */}
        {TRANSACTIONS.map(group => (
          <View key={group.dateKey ?? group.date} style={s.group}>
            <Text style={[s.groupDate, {color: colors.textSecondary}]}>{group.dateKey === 'today' ? t('wallet.today') : group.dateKey}</Text>
            <View style={[s.groupCard, {backgroundColor: colors.card, borderColor: colors.border}]}>
              {group.items.map((item, i) => (
                <View key={item.id}>
                  <TxRow item={item} colors={colors} />
                  {i < group.items.length - 1 && (
                    <View key={`div-${item.id}`} style={[s.divider, {backgroundColor: colors.border}]} />
                  )}
                </View>
              ))}
            </View>
          </View>
        ))}

        <View style={{height: 24}} />
      </ScrollView>
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
    flex: 1, fontSize: 18, fontWeight: '800',
    textAlign: 'center',
  },
  headerIconBtn: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  scroll: {flex: 1},
  content: {padding: 16, gap: 16},

  /* Balance card */
  balanceCard: {
    borderRadius: 22,
    padding: 24,
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  balanceInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  balanceTextCol: {gap: 6},
  balanceLabel: {fontSize: 14, color: 'rgba(255,255,255,0.75)', textAlign: 'right'},
  balanceAmountRow: {flexDirection: 'row', alignItems: 'flex-end', gap: 6},
  balanceCurrency: {fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 4},
  balanceAmount: {fontSize: 38, fontWeight: '900', color: '#fff', lineHeight: 42},
  walletIconWrap: {
    width: 54, height: 54,
    borderRadius: 16,
    backgroundColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Groups */
  group: {gap: 8},
  groupDate: {
    fontSize: 13, fontWeight: '700',
    paddingHorizontal: 4,
  },
  groupCard: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
  },

  /* Transaction row — RTL: icon right, text middle, amount left */
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  txMiddle: {flex: 1, gap: 3, alignItems: 'flex-end'},
  txLabel: {fontSize: 13, fontWeight: '600', textAlign: 'right'},
  txTime: {fontSize: 11, textAlign: 'right'},
  txAmount: {fontSize: 14, fontWeight: '800', minWidth: 70, textAlign: 'left'},
  divider: {height: 1, marginHorizontal: 16},
});
