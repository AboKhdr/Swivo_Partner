import React, {useCallback, useEffect, useState} from 'react';
import {BackHandler, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {Wrench, Package, Users, Building2, Image} from 'lucide-react-native';
import {useTheme} from '../../../shared/context/ThemeContext';
import ServicesScreen from './ServicesScreen';
import PackagesScreen from './PackagesScreen';
import StaffScreen from './StaffScreen';
import BranchesScreen from './BranchesScreen';
import SkipReviewScreen from '../orders/SkipReviewScreen';

const SECTIONS = [
  {key: 'services',  label: 'الخدمات',     icon: Wrench,    desc: 'إدارة الخدمات والأسعار'},
  {key: 'packages',  label: 'الباقات',     icon: Package,   desc: 'الباقات الشهرية والموسمية'},
  {key: 'staff',     label: 'الموظفون',    icon: Users,     desc: 'البايكرز والمديرون'},
  {key: 'branches',  label: 'الفروع',      icon: Building2, desc: 'إدارة الفروع وأوقات العمل'},
  {key: 'skipReview', label: 'تخطي الصور', icon: Image,     desc: 'مراجعة طلبات تخطي صور البعد'},
];

const SCREENS = {
  services:   ServicesScreen,
  packages:   PackagesScreen,
  staff:      StaffScreen,
  branches:   BranchesScreen,
  skipReview: SkipReviewScreen,
};

function OperationsMenu({colors, onNavigate}) {
  return (
    <View style={[s.root, {backgroundColor: colors.bg}]}>
      <View style={[s.header, {backgroundColor: colors.card, borderBottomColor: colors.border}]}>
        <Text style={[s.headerTitle, {color: colors.textPrimary}]}>العمليات</Text>
      </View>
      <View style={s.list}>
        {SECTIONS.map(({key, label, icon: Icon, desc}) => (
          <TouchableOpacity
            key={key}
            style={[s.item, {backgroundColor: colors.card, borderColor: colors.border}]}
            onPress={() => onNavigate(key)}
            activeOpacity={0.75}>
            <View style={[s.itemIcon, {backgroundColor: colors.primary + '18'}]}>
              <Icon size={20} color={colors.primary} />
            </View>
            <View style={s.itemText}>
              <Text style={[s.itemLabel, {color: colors.textPrimary}]}>{label}</Text>
              <Text style={[s.itemDesc, {color: colors.textSecondary}]}>{desc}</Text>
            </View>
            <Text style={[s.chevron, {color: colors.textSecondary}]}>›</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

export default function OperationsNavigator() {
  const {colors} = useTheme();
  const [screen, setScreen] = useState(null);

  const goTo = useCallback(key => setScreen(key), []);
  const goBack = useCallback(() => setScreen(null), []);

  useEffect(() => {
    if (!screen) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      goBack();
      return true;
    });
    return () => sub.remove();
  }, [screen, goBack]);

  const ActiveScreen = screen ? SCREENS[screen] : null;

  return (
    <View style={s.flex}>
      <View style={[s.flex, !screen && s.visible, screen && s.hidden]}>
        <OperationsMenu colors={colors} onNavigate={goTo} />
      </View>
      {ActiveScreen && (
        <View style={s.flex}>
          <ActiveScreen onBack={goBack} />
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  flex:        {flex: 1},
  visible:     {},
  hidden:      {display: 'none'},
  root:        {flex: 1},
  header:      {paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16, borderBottomWidth: 1},
  headerTitle: {fontSize: 22, fontWeight: '800'},
  list:        {padding: 16, gap: 10},
  item:        {flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 16, borderWidth: 1},
  itemIcon:    {width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center'},
  itemText:    {flex: 1, gap: 3},
  itemLabel:   {fontSize: 15, fontWeight: '700'},
  itemDesc:    {fontSize: 12},
  chevron:     {fontSize: 22, fontWeight: '300'},
});
