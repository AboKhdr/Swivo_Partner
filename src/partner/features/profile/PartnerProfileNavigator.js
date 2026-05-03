import React, {useCallback, useEffect, useState} from 'react';
import {
  BackHandler, Platform, ScrollView, StatusBar,
  StyleSheet, Switch, Text, TouchableOpacity, View,
} from 'react-native';
import {
  User, Bell, Moon, Globe, HelpCircle, FileText, LogOut, ChevronLeft,
} from 'lucide-react-native';
import {useTheme} from '../../../shared/context/ThemeContext';
import {useI18n} from '../../../shared/i18n/I18nContext';
import PartnerPersonalInfoScreen from './PartnerPersonalInfoScreen';
import NotificationsScreen from '../dashboard/NotificationsScreen';
import SupportScreen from './SupportScreen';
import TermsScreen from './TermsScreen';
import LanguageScreen from '../../../shared/components/LanguageScreen';

function NavRow({Icon, iconColor, iconBg, label, sub, onPress, danger, right, colors}) {
  return (
    <TouchableOpacity style={s.navRow} onPress={onPress} activeOpacity={0.7}>
      <View style={[s.navIcon, {backgroundColor: iconBg}]}>
        <Icon size={18} color={iconColor} strokeWidth={2} />
      </View>
      <View style={s.navText}>
        <Text style={[s.navLabel, {color: danger ? '#EF4444' : colors.textPrimary}]}>{label}</Text>
        {sub ? <Text style={[s.navSub, {color: colors.textSecondary}]}>{sub}</Text> : null}
      </View>
      {right !== undefined ? right : (
        <ChevronLeft size={18} color={danger ? '#EF4444' : colors.textSecondary} strokeWidth={2} />
      )}
    </TouchableOpacity>
  );
}

function ProfileMenu({colors, isDark, toggleTheme, onNavigate, t}) {
  return (
    <View style={[s.root, {backgroundColor: colors.bg}]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.card} />

      <View style={[s.header, {backgroundColor: colors.card, borderBottomColor: colors.border}]}>
        <Text style={[s.headerTitle, {color: colors.textPrimary}]}>{t('partner.profile.title')}</Text>
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

        <TouchableOpacity
          style={[s.avatarCard, {backgroundColor: colors.card, borderColor: colors.border}]}
          onPress={() => onNavigate('info')}
          activeOpacity={0.85}>
          <View style={[s.avatar, {backgroundColor: colors.primary + '18'}]}>
            <Text style={[s.avatarText, {color: colors.primary}]}>م</Text>
          </View>
          <View style={s.avatarInfo}>
            <Text style={[s.managerName, {color: colors.textPrimary}]}>سالم العتيبي</Text>
            <Text style={[s.managerSub, {color: colors.textSecondary}]}>{t('partner.profile.managerRole')}</Text>
          </View>
          <ChevronLeft size={18} color={colors.textSecondary} strokeWidth={2} />
        </TouchableOpacity>

        <Text style={[s.sectionTitle, {color: colors.textSecondary}]}>{t('partner.profile.accountSettings')}</Text>
        <View style={[s.card, {backgroundColor: colors.card, borderColor: colors.border}]}>
          <NavRow
            Icon={User} iconColor={colors.primary} iconBg={colors.primary + '18'}
            label={t('partner.profile.accountInfo')} sub={t('partner.profile.accountInfoSub')}
            onPress={() => onNavigate('info')} colors={colors} />
          <View style={[s.divider, {backgroundColor: colors.border}]} />
          <NavRow
            Icon={Bell} iconColor="#F59E0B" iconBg="#F59E0B18"
            label={t('partner.profile.notifications')} sub={t('partner.profile.notificationsSub')}
            onPress={() => onNavigate('notif')} colors={colors} />
        </View>

        <Text style={[s.sectionTitle, {color: colors.textSecondary}]}>{t('partner.profile.preferences')}</Text>
        <View style={[s.card, {backgroundColor: colors.card, borderColor: colors.border}]}>
          <NavRow
            Icon={Moon} iconColor="#6366F1" iconBg="#6366F118"
            label={t('partner.profile.appearance')}
            sub={isDark ? t('partner.profile.darkMode') : t('partner.profile.lightMode')}
            onPress={toggleTheme} colors={colors}
            right={
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{false: colors.border, true: colors.primary + '66'}}
                thumbColor={isDark ? colors.primary : '#fff'}
              />
            }
          />
          <View style={[s.divider, {backgroundColor: colors.border}]} />
          <NavRow
            Icon={Globe} iconColor="#22C55E" iconBg="#22C55E18"
            label={t('partner.profile.language')} sub={t('partner.profile.languageSub')}
            onPress={() => onNavigate('language')} colors={colors} />
        </View>

        <Text style={[s.sectionTitle, {color: colors.textSecondary}]}>{t('partner.profile.help')}</Text>
        <View style={[s.card, {backgroundColor: colors.card, borderColor: colors.border}]}>
          <NavRow
            Icon={HelpCircle} iconColor="#3B9EFF" iconBg="#3B9EFF18"
            label={t('partner.profile.support')} sub={t('partner.profile.supportSub')}
            onPress={() => onNavigate('support')} colors={colors} />
          <View style={[s.divider, {backgroundColor: colors.border}]} />
          <NavRow
            Icon={FileText} iconColor="#64748B" iconBg="#64748B18"
            label={t('partner.profile.terms')}
            onPress={() => onNavigate('terms')} colors={colors} />
        </View>

        <View style={[s.card, {backgroundColor: colors.card, borderColor: colors.border}]}>
          <NavRow
            Icon={LogOut} iconColor="#EF4444" iconBg="#EF444418"
            label={t('partner.profile.logout')} sub={t('partner.profile.logoutSub')}
            onPress={() => {}} danger colors={colors} />
        </View>

        <View style={{height: 16}} />
      </ScrollView>
    </View>
  );
}

function PlaceholderScreen({title, colors, onBack}) {
  return (
    <View style={[s.phRoot, {backgroundColor: colors.bg}]}>
      <View style={[s.phHeader, {backgroundColor: colors.card, borderBottomColor: colors.border}]}>
        <TouchableOpacity onPress={onBack} style={[s.backBtn, {backgroundColor: colors.bg}]}>
          <ChevronLeft size={22} color={colors.textPrimary} strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={[s.phTitle, {color: colors.textPrimary}]}>{title}</Text>
        <View style={{width: 36}} />
      </View>
      <View style={s.phBody}>
        <Text style={[s.phNote, {color: colors.textSecondary}]}>...</Text>
      </View>
    </View>
  );
}

export default function PartnerProfileNavigator() {
  const {colors, isDark, toggleTheme} = useTheme();
  const {t} = useI18n();
  const [screen, setScreen] = useState(null);

  const goTo   = useCallback(key => setScreen(key), []);
  const goBack = useCallback(() => setScreen(null), []);

  useEffect(() => {
    if (!screen) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      goBack();
      return true;
    });
    return () => sub.remove();
  }, [screen, goBack]);

  return (
    <View style={s.flex}>
      <View style={[s.flex, screen ? s.hidden : null]}>
        <ProfileMenu colors={colors} isDark={isDark} toggleTheme={toggleTheme} onNavigate={goTo} t={t} />
      </View>
      {screen === 'info' && (
        <View style={s.flex}>
          <PartnerPersonalInfoScreen onBack={goBack} />
        </View>
      )}
      {screen === 'notif' && (
        <View style={s.flex}>
          <NotificationsScreen onBack={goBack} />
        </View>
      )}
      {screen === 'support' && (
        <View style={s.flex}>
          <SupportScreen onBack={goBack} />
        </View>
      )}
      {screen === 'terms' && (
        <View style={s.flex}>
          <TermsScreen onBack={goBack} />
        </View>
      )}
      {screen === 'language' && (
        <View style={s.flex}>
          <LanguageScreen onBack={goBack} />
        </View>
      )}
      {screen && screen !== 'info' && screen !== 'notif' && screen !== 'support' && screen !== 'terms' && screen !== 'language' && (
        <View style={s.flex}>
          <PlaceholderScreen title={SCREEN_TITLES[screen] || screen} colors={colors} onBack={goBack} />
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  flex:        {flex: 1},
  hidden:      {display: 'none'},

  // Menu
  root:        {flex: 1},
  header:      {
    paddingTop: Platform.OS === 'ios' ? 56 : 48,
    paddingBottom: 16, paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  headerTitle: {fontSize: 20, fontWeight: '800'},
  scroll:      {flex: 1},
  content:     {padding: 16, gap: 12},

  sectionTitle:{fontSize: 13, fontWeight: '700', paddingHorizontal: 4, marginTop: 4},

  avatarCard:  {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    padding: 16, borderRadius: 18, borderWidth: 1,
  },
  avatar:      {width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center'},
  avatarText:  {fontSize: 22, fontWeight: '900'},
  avatarInfo:  {flex: 1, gap: 3},
  managerName: {fontSize: 16, fontWeight: '800'},
  managerSub:  {fontSize: 12},

  card:        {borderRadius: 18, borderWidth: 1, overflow: 'hidden'},
  divider:     {height: 1, marginHorizontal: 16},
  navRow:      {flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 14},
  navIcon:     {width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center'},
  navText:     {flex: 1, gap: 2},
  navLabel:    {fontSize: 14, fontWeight: '600'},
  navSub:      {fontSize: 12},

  // Placeholder
  phRoot:      {flex: 1},
  phHeader:    {
    flexDirection: 'row', alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 56 : 48,
    paddingBottom: 16, paddingHorizontal: 16, borderBottomWidth: 1,
  },
  backBtn:     {width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center'},
  phTitle:     {flex: 1, fontSize: 16, fontWeight: '700', textAlign: 'center'},
  phBody:      {flex: 1, alignItems: 'center', justifyContent: 'center'},
  phNote:      {fontSize: 14},
});
