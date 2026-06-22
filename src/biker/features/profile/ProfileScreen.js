import React, {useEffect, useState} from 'react';
import {
  ActivityIndicator, Platform, ScrollView, StatusBar, StyleSheet,
  Switch, Text, TouchableOpacity, View,
} from 'react-native';
import {
  ChevronLeft, Star, User, Wallet, ArrowLeftRight,
  Moon, Globe, Headphones, FileText, LogOut,
} from 'lucide-react-native';
import {useTheme} from '../../../shared/context/ThemeContext';
import {useI18n} from '../../../shared/i18n/I18nContext';
import useAuthStore from '../../../store/authStore';
import {logout} from '../../../services/auth';
import {getBikerProfile} from '../../../services/biker';
import RiyalIcon from '../../../shared/components/RiyalIcon';

function NavRow({Icon, iconColor, iconBg, label, sub, subIcon, subLoader, onPress, danger, right, loading, colors}) {
  return (
    <TouchableOpacity style={s.navRow} onPress={onPress} activeOpacity={0.7} disabled={loading}>
      <View style={[s.navIcon, {backgroundColor: iconBg}]}>
        <Icon size={18} color={iconColor} strokeWidth={2} />
      </View>
      <View style={s.navText}>
        <Text style={[s.navLabel, {color: danger ? '#EF4444' : colors.textPrimary}]}>{label}</Text>
        {subLoader
          ? <View style={[s.subSkeleton, {backgroundColor: colors.border}]} />
          : sub ? (
            subIcon ? (
              <View style={s.subRow}>
                <Text style={[s.navSub, {color: colors.textSecondary}]}>{sub}</Text>
                <RiyalIcon size={12} color={colors.textSecondary} />
              </View>
            ) : <Text style={[s.navSub, {color: colors.textSecondary}]}>{sub}</Text>
          ) : null
        }
      </View>
      {loading ? (
        <ActivityIndicator size="small" color={danger ? '#EF4444' : colors.primary} />
      ) : right !== undefined ? right : (
        <ChevronLeft size={18} color={danger ? '#EF4444' : colors.textSecondary} strokeWidth={2} />
      )}
    </TouchableOpacity>
  );
}

export default function ProfileScreen({onNavigate}) {
  const {colors, isDark, toggleTheme} = useTheme();
  const {t} = useI18n();
  const user = useAuthStore(s => s.user);
  const darkMode = isDark;
  const [rating,         setRating]         = useState(user?.rating ?? 0);
  const [balance,        setBalance]        = useState(null);
  const [balanceLoading, setBalanceLoading] = useState(true);
  const [loggingOut,     setLoggingOut]     = useState(false);

  useEffect(() => {
    getBikerProfile().then(res => {
      if (res.success && res.data) {
        const p = res.data.data ?? res.data;
        setRating(p.rating ?? 0);
        setBalance(p.wallet?.balance ?? 0);
      }
      setBalanceLoading(false);
    }).catch(() => setBalanceLoading(false));
  }, []);

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await logout();
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <View style={[s.root, {backgroundColor: colors.bg}]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.card} />
      <View style={[s.header, {backgroundColor: colors.card, borderBottomColor: colors.border}]}>
        <Text style={[s.headerTitle, {color: colors.textPrimary}]}>{t('profile.title')}</Text>
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

        <Text style={[s.sectionTitle, {color: colors.textSecondary}]}>{t('profile.personalSettings')}</Text>

        <View style={[s.card, {backgroundColor: colors.card, borderColor: colors.border}]}>
          <NavRow Icon={User} iconColor={colors.primary} iconBg={colors.primary + '18'} label={t('profile.personalInfo')} sub={t('profile.personalInfoSub')} onPress={() => onNavigate('info')} colors={colors} />
          <View style={[s.divider, {backgroundColor: colors.border}]} />
          <NavRow
            Icon={Wallet} iconColor="#10B981" iconBg="#10B98118"
            label={t('profile.wallet')}
            sub={balanceLoading ? null : `${t('wallet.balance')} ${(balance ?? 0).toFixed(0)}`}
            subIcon={!balanceLoading}
            subLoader={balanceLoading}
            onPress={() => onNavigate('wallet')}
            colors={colors}
          />
          <View style={[s.divider, {backgroundColor: colors.border}]} />
          <NavRow Icon={ArrowLeftRight} iconColor="#3B82F6" iconBg="#3B82F618" label={t('transactions.title')} sub={t('transactions.sub')} onPress={() => onNavigate('transactions')} colors={colors} />
        </View>

        <Text style={[s.sectionTitle, {color: colors.textSecondary}]}>{t('profile.options')}</Text>
        <View style={[s.card, {backgroundColor: colors.card, borderColor: colors.border}]}>
          <NavRow
            Icon={Moon} iconColor="#6366F1" iconBg="#6366F118"
            label={t('profile.appearance')} sub={darkMode ? t('profile.darkMode') : t('profile.lightMode')}
            onPress={toggleTheme} colors={colors}
            right={
              <Switch
                value={darkMode}
                onValueChange={toggleTheme}
                trackColor={{false: colors.border, true: colors.primary + '66'}}
                thumbColor={darkMode ? colors.primary : '#fff'}
              />
            }
          />
          <View style={[s.divider, {backgroundColor: colors.border}]} />
          <NavRow Icon={Globe} iconColor="#F59E0B" iconBg="#F59E0B18" label={t('profile.language')} sub={t('profile.languageSub')} onPress={() => onNavigate('language')} colors={colors} />
          <View style={[s.divider, {backgroundColor: colors.border}]} />
          <NavRow Icon={Headphones} iconColor="#8B5CF6" iconBg="#8B5CF618" label={t('profile.support')} sub={t('profile.supportSub')} onPress={() => onNavigate('support')} colors={colors} />
          <View style={[s.divider, {backgroundColor: colors.border}]} />
          <NavRow Icon={FileText} iconColor="#64748B" iconBg="#64748B18" label={t('profile.terms')} sub={t('profile.termsSub')} onPress={() => onNavigate('terms')} colors={colors} />
        </View>

        <View style={[s.card, {backgroundColor: colors.card, borderColor: colors.border}]}>
          <NavRow Icon={LogOut} iconColor="#EF4444" iconBg="#EF444418" label={t('profile.logout')} sub={t('profile.logoutSub')} onPress={handleLogout} danger loading={loggingOut} colors={colors} />
        </View>

        <View style={{height: 16}} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: {flex: 1},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 56 : 48,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  headerTitle: {fontSize: 20, fontWeight: '800'},
  scroll: {flex: 1},
  content: {padding: 16, gap: 12},
  sectionTitle: {fontSize: 13, fontWeight: '700', paddingHorizontal: 4, marginTop: 4},
  ratingCard: {
    borderRadius: 18, borderWidth: 1.5, paddingHorizontal: 20, paddingVertical: 18,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  ratingRight: {gap: 2},
  ratingLabel: {fontSize: 12},
  ratingValue: {fontSize: 22, fontWeight: '900'},
  card: {borderRadius: 18, borderWidth: 1, overflow: 'hidden'},
  divider: {height: 1, marginHorizontal: 16},
  navRow: {flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 14},
  navIcon: {width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center'},
  navText: {flex: 1, gap: 2},
  navLabel:    {fontSize: 14, fontWeight: '600'},
  navSub:      {fontSize: 12},
  subRow:      {flexDirection: 'row', alignItems: 'center', gap: 3},
  subSkeleton: {width: 80, height: 10, borderRadius: 5, marginTop: 3},
});
