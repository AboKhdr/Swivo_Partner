import React, {useEffect, useState} from 'react';
import {
  ActivityIndicator, Platform, ScrollView, StatusBar, StyleSheet,
  Text, TouchableOpacity, View,
} from 'react-native';
import {ChevronLeft, Wallet, TrendingUp} from 'lucide-react-native';
import {useTheme} from '../../../shared/context/ThemeContext';
import {useI18n} from '../../../shared/i18n/I18nContext';
import {getWallet} from '../../../services/biker';


export default function WalletScreen({onBack}) {
  const {colors, isDark} = useTheme();
  const {t} = useI18n();
  const [loading, setLoading] = useState(true);
  const [wallet,  setWallet]  = useState(null);

  useEffect(() => {
    getWallet().then(res => {
      if (res.success && res.data) {
        setWallet(res.data.wallet ?? res.data);
      }
      setLoading(false);
    });
  }, []);

  const balance  = wallet?.balance ?? 0;
  const currency = wallet?.currency ?? 'SAR';

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
        <View style={{width: 36}} />
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          style={s.scroll}
          contentContainerStyle={s.content}
          showsVerticalScrollIndicator={false}>

          {/* Balance hero card */}
          <View style={[s.heroCard, {backgroundColor: colors.primary, shadowColor: colors.primary}]}>
            <View style={[s.heroIconWrap, {backgroundColor: 'rgba(255,255,255,0.18)'}]}>
              <Wallet size={30} color="#fff" strokeWidth={2} />
            </View>
            <Text style={s.heroLabel}>{t('wallet.balance')}</Text>
            <View style={s.heroAmountRow}>
              <Text style={s.heroAmount}>{balance.toLocaleString('ar-SA', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</Text>
              <Text style={s.heroCurrency}>{currency === 'SAR' ? '﷼' : currency}</Text>
            </View>
          </View>

          {/* Info card */}
          <View style={[s.infoCard, {backgroundColor: colors.card}]}>
            <View style={[s.infoRow, {borderBottomColor: colors.border}]}>
              <View style={[s.infoIconBox, {backgroundColor: colors.primary + '15'}]}>
                <TrendingUp size={18} color={colors.primary} />
              </View>
              <View style={s.infoText}>
                <Text style={[s.infoLabel, {color: colors.textSecondary}]}>{t('wallet.balance')}</Text>
                <Text style={[s.infoValue, {color: colors.textPrimary}]}>
                  {balance.toLocaleString('ar-SA', {minimumFractionDigits: 2, maximumFractionDigits: 2})} {currency === 'SAR' ? '﷼' : currency}
                </Text>
              </View>
            </View>

          </View>

          <View style={{height: 24}} />
        </ScrollView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root:    {flex: 1},
  center:  {flex: 1, alignItems: 'center', justifyContent: 'center'},

  header:      {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: Platform.OS === 'ios' ? 56 : 48, paddingBottom: 12, paddingHorizontal: 16},
  backBtn:     {width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center'},
  headerTitle: {flex: 1, fontSize: 18, fontWeight: '800', textAlign: 'center'},

  scroll:  {flex: 1},
  content: {padding: 16, gap: 16},

  heroCard:      {borderRadius: 24, padding: 28, alignItems: 'center', gap: 8, shadowOffset: {width: 0, height: 10}, shadowOpacity: 0.35, shadowRadius: 20, elevation: 10},
  heroIconWrap:  {width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 4},
  heroLabel:     {fontSize: 14, color: 'rgba(255,255,255,0.75)', fontWeight: '600'},
  heroAmountRow: {flexDirection: 'row', alignItems: 'flex-end', gap: 6},
  heroAmount:    {fontSize: 46, fontWeight: '900', color: '#fff', lineHeight: 50},
  heroCurrency:  {fontSize: 22, fontWeight: '700', color: 'rgba(255,255,255,0.9)', marginBottom: 6},
  infoCard:    {borderRadius: 18, overflow: 'hidden', elevation: 1, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: {width: 0, height: 1}},
  infoRow:     {flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16},
  infoIconBox: {width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center'},
  infoText:    {flex: 1, gap: 3},
  infoLabel:   {fontSize: 12, fontWeight: '500'},
  infoValue:   {fontSize: 15, fontWeight: '800'},
});
