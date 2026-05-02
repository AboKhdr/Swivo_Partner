import React, {useCallback, useEffect, useState} from 'react';
import {BackHandler, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {User, Bell, Moon, Globe, HelpCircle, FileText, LogOut} from 'lucide-react-native';
import {useTheme} from '../../../shared/context/ThemeContext';
import {useI18n} from '../../../shared/i18n/I18nContext';

const MENU_ITEMS = [
  {key: 'info',     label: 'معلومات الحساب',   icon: User,       color: '#1B7BF5'},
  {key: 'notif',    label: 'الإشعارات',         icon: Bell,       color: '#F59E0B'},
  {key: 'theme',    label: 'المظهر',             icon: Moon,       color: '#8B5CF6'},
  {key: 'language', label: 'اللغة',              icon: Globe,      color: '#22C55E'},
  {key: 'support',  label: 'الدعم الفني',        icon: HelpCircle, color: '#3B9EFF'},
  {key: 'terms',    label: 'الشروط والأحكام',   icon: FileText,   color: '#64748B'},
];

function ProfileMenu({colors, toggleTheme, onNavigate, onLogout}) {
  return (
    <View style={[s.root, {backgroundColor: colors.bg}]}>
      <View style={[s.header, {backgroundColor: colors.card, borderBottomColor: colors.border}]}>
        <View style={[s.avatar, {backgroundColor: colors.primary + '18'}]}>
          <Text style={[s.avatarText, {color: colors.primary}]}>م</Text>
        </View>
        <View style={s.headerInfo}>
          <Text style={[s.managerName, {color: colors.textPrimary}]}>سالم العتيبي</Text>
          <View style={[s.roleBadge, {backgroundColor: colors.primary + '18'}]}>
            <Text style={[s.roleText, {color: colors.primary}]}>مدير</Text>
          </View>
        </View>
      </View>

      <View style={s.menu}>
        {MENU_ITEMS.map(({key, label, icon: Icon, color}) => (
          <TouchableOpacity
            key={key}
            style={[s.menuItem, {backgroundColor: colors.card, borderColor: colors.border}]}
            onPress={() => key === 'theme' ? toggleTheme() : onNavigate(key)}
            activeOpacity={0.75}>
            <View style={[s.menuIcon, {backgroundColor: color + '18'}]}>
              <Icon size={18} color={color} />
            </View>
            <Text style={[s.menuLabel, {color: colors.textPrimary}]}>{label}</Text>
            <Text style={[s.chevron, {color: colors.textSecondary}]}>›</Text>
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          style={[s.menuItem, {backgroundColor: colors.card, borderColor: colors.border}]}
          onPress={onLogout}
          activeOpacity={0.75}>
          <View style={[s.menuIcon, {backgroundColor: '#EF4444' + '18'}]}>
            <LogOut size={18} color="#EF4444" />
          </View>
          <Text style={[s.menuLabel, {color: '#EF4444'}]}>تسجيل الخروج</Text>
          <Text style={[s.chevron, {color: '#EF4444'}]}>›</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function PlaceholderScreen({title, colors, onBack}) {
  return (
    <View style={[s.placeholder, {backgroundColor: colors.bg}]}>
      <View style={[s.placeholderHeader, {backgroundColor: colors.card, borderBottomColor: colors.border}]}>
        <TouchableOpacity onPress={onBack} style={s.backBtn}>
          <Text style={[s.backArrow, {color: colors.textPrimary}]}>‹</Text>
        </TouchableOpacity>
        <Text style={[s.placeholderTitle, {color: colors.textPrimary}]}>{title}</Text>
        <View style={{width: 36}} />
      </View>
      <View style={s.placeholderBody}>
        <Text style={[s.placeholderNote, {color: colors.textSecondary}]}>قيد التطوير</Text>
      </View>
    </View>
  );
}

export default function PartnerProfileNavigator() {
  const {colors, toggleTheme} = useTheme();
  const {t} = useI18n();
  const [screen, setScreen] = useState(null);

  const goTo = useCallback(key => setScreen(key), []);
  const goBack = useCallback(() => setScreen(null), []);
  const handleLogout = useCallback(() => {}, []);

  useEffect(() => {
    if (!screen) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      goBack();
      return true;
    });
    return () => sub.remove();
  }, [screen, goBack]);

  const SCREEN_TITLES = {
    info:     'معلومات الحساب',
    notif:    'الإشعارات',
    language: 'اللغة',
    support:  'الدعم الفني',
    terms:    'الشروط والأحكام',
  };

  return (
    <View style={s.flex}>
      <View style={[s.flex, screen && s.hidden]}>
        <ProfileMenu colors={colors} toggleTheme={toggleTheme} onNavigate={goTo} onLogout={handleLogout} />
      </View>
      {screen && (
        <View style={s.flex}>
          <PlaceholderScreen title={SCREEN_TITLES[screen] || screen} colors={colors} onBack={goBack} />
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  flex:             {flex: 1},
  hidden:           {display: 'none'},
  root:             {flex: 1},
  header:           {flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 20, paddingTop: 56, paddingBottom: 20, borderBottomWidth: 1},
  avatar:           {width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center'},
  avatarText:       {fontSize: 22, fontWeight: '900'},
  headerInfo:       {gap: 6},
  managerName:      {fontSize: 18, fontWeight: '800'},
  roleBadge:        {alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8},
  roleText:         {fontSize: 12, fontWeight: '700'},
  menu:             {padding: 16, gap: 8},
  menuItem:         {flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderRadius: 14, borderWidth: 1},
  menuIcon:         {width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center'},
  menuLabel:        {flex: 1, fontSize: 15, fontWeight: '600'},
  chevron:          {fontSize: 20, fontWeight: '300'},
  placeholder:      {flex: 1},
  placeholderHeader:{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16, borderBottomWidth: 1},
  backBtn:          {width: 36, height: 36, alignItems: 'center', justifyContent: 'center'},
  backArrow:        {fontSize: 28, fontWeight: '300'},
  placeholderTitle: {fontSize: 18, fontWeight: '800'},
  placeholderBody:  {flex: 1, alignItems: 'center', justifyContent: 'center'},
  placeholderNote:  {fontSize: 14},
});
