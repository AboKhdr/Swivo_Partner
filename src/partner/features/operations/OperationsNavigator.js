import React, {useCallback, useEffect, useState} from 'react';
import {
  BackHandler,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  ArrowLeft,
  GitBranch,
  Car,
  Package,
  Bike,
  Users,
  Tag,
  Star,
  Camera,
  PlusSquare,
  BadgeCheck,
  Images,
  Wallet,
  Send,
} from 'lucide-react-native';
import {useTheme} from '../../../shared/context/ThemeContext';
import {useI18n} from '../../../shared/i18n/I18nContext';
import useAppStore from '../../../store/appStore';
import useAuthStore from '../../../store/authStore';
import {getSettings, updateSettings} from '../../../services/partner';

import ServicesScreen from './ServicesScreen';
import PackagesScreen from './PackagesScreen';
import StaffScreen from './StaffScreen';
import BikersScreen from './BikersScreen';
import BranchesScreen from './BranchesScreen';
import PaymentsScreen from './PaymentsScreen';
import PayoutsScreen from './PayoutsScreen';
import SkipReviewScreen from '../orders/SkipReviewScreen';
import ReviewsScreen from './ReviewsScreen';
import OffersScreen from './OffersScreen';
import AddonsScreen from './AddonsScreen';
import SubscriptionsScreen from './SubscriptionsScreen';
import GalleryScreen from './GalleryScreen';

function buildSections(t) {
  return [
    {
      title: t('partner.operations.sections.management'),
      items: [
        {key: 'branches',   label: t('partner.operations.menu.branches'),   sub: t('partner.operations.menu.branchesSub'),   Icon: GitBranch,  dot: false},
        {key: 'services',   label: t('partner.operations.menu.services'),   sub: t('partner.operations.menu.servicesSub'),   Icon: Car,        dot: false},
        {key: 'packages',   label: t('partner.operations.menu.packages'),   sub: t('partner.operations.menu.packagesSub'),   Icon: Package,    dot: false},
        {key: 'addons',     label: t('partner.operations.menu.addons'),     sub: t('partner.operations.menu.addonsSub'),     Icon: PlusSquare, dot: false},
        {key: 'gallery',    label: t('partner.operations.menu.gallery'),    sub: t('partner.operations.menu.gallerySub'),    Icon: Images,     dot: false},
        {key: 'offers',     label: t('partner.operations.menu.offers'),     sub: t('partner.operations.menu.offersSub'),     Icon: Tag,        dot: false},
      ],
    },
    {
      title: t('partner.operations.sections.staff'),
      items: [
        {key: 'bikers',     label: t('partner.operations.menu.bikers'),     sub: t('partner.operations.menu.bikersSub'),     Icon: Bike,       dot: false},
        {key: 'staff',      label: t('partner.operations.menu.staff'),      sub: t('partner.operations.menu.staffSub'),      Icon: Users,      dot: false},
        {key: 'skipReview', label: t('partner.operations.menu.skipReview'), sub: t('partner.operations.menu.skipReviewSub'), Icon: Camera,     dot: true},
      ],
    },
    {
      title: t('partner.operations.sections.financial'),
      items: [
        {key: 'wallet',         label: t('partner.operations.menu.wallet'),         sub: t('partner.operations.menu.walletSub'),         Icon: Wallet,      dot: false},
        {key: 'payouts',        label: t('partner.operations.menu.payouts'),        sub: t('partner.operations.menu.payoutsSub'),        Icon: Send,        dot: false},
        {key: 'subscriptions',  label: t('partner.operations.menu.subscriptions'),  sub: t('partner.operations.menu.subscriptionsSub'),  Icon: BadgeCheck,  dot: false},
        {key: 'reviews',        label: t('partner.operations.menu.reviews'),        sub: t('partner.operations.menu.reviewsSub'),        Icon: Star,        dot: false},
      ],
    },
  ];
}


function MenuRow({item, colors, onPress}) {
  const {Icon, label, dot} = item;
  return (
    <TouchableOpacity
      style={[s.row, {backgroundColor: colors.card}]}
      onPress={() => onPress(item.key)}
      activeOpacity={0.75}>
      {/* Right: dot + icon */}
      <View style={s.rowRight}>
        {dot && <View style={[s.dot, {backgroundColor: colors.primary}]} />}
        <View style={[s.iconCircle, {backgroundColor: colors.primary + '18'}]}>
          <Icon size={20} color={colors.primary} />
        </View>
      </View>

      {/* Text */}
      <View style={s.rowText}>
        <Text style={[s.rowLabel, {color: colors.textPrimary}]}>{label}</Text>
        {/* <Text style={[s.rowSub, {color: colors.textSecondary}]}>{sub}</Text> */}
      </View>

    {/* Left arrow */}
    <ArrowLeft size={16} color={colors.textSecondary} style={s.rowArrow} />
    </TouchableOpacity>
  );
}

function OperationsMenu({colors, onNavigate, isSupervisor}) {
  const {t} = useI18n();
  const autoAccept    = useAppStore(s => s.autoAccept);
  const setAutoAccept = useAppStore(s => s.setAutoAccept);
  const allSections   = buildSections(t);
  const sections      = isSupervisor
    ? allSections.filter(sec => sec.title !== t('partner.operations.sections.financial'))
    : allSections;
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    getSettings().then(res => {
      if (res.success) {
        const val = res.data?.data?.autoAcceptOrders ?? res.data?.autoAcceptOrders ?? false;
        setAutoAccept(val);
      }
    });
  }, [setAutoAccept]);

  const handleAutoAccept = useCallback(async val => {
    if (toggling) return;
    setAutoAccept(val);
    setToggling(true);
    const res = await updateSettings({autoAcceptOrders: val});
    if (!res.success) setAutoAccept(!val);
    setToggling(false);
  }, [toggling, setAutoAccept]);

  return (
    <View style={[s.root, {backgroundColor: colors.bg}]}>
      <View style={[s.header, {backgroundColor: colors.bg}]}>
        <Text style={[s.headerTitle, {color: colors.textPrimary}]}>{t('partner.operations.title')}</Text>
        <View style={s.headerArrow}>
          <ArrowLeft size={20} color={colors.textSecondary} />
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent}>

<View style={[s.toggleCard, {backgroundColor: colors.primary + '12', borderColor: colors.primary + '30'}]}>
          <Switch
            value={autoAccept}
            onValueChange={handleAutoAccept}
            disabled={toggling}
            trackColor={{false: colors.border, true: colors.primary}}
            thumbColor="#FFF"
          />
          <View style={s.toggleText}>
            <Text style={[s.toggleLabel, {color: colors.textPrimary}]}>{t('partner.operations.autoAccept')}</Text>
            <Text style={[s.toggleSub, {color: colors.textSecondary}]}>{t('partner.operations.autoAcceptSub')}</Text>
          </View>
        </View>

        {sections.map(section => (
          <View key={section.title} style={s.section}>
            <Text style={[s.sectionTitle, {color: colors.textPrimary}]}>{section.title}</Text>
            <View style={s.sectionRows}>
              {section.items.map(item => (
                <MenuRow key={item.key} item={item} colors={colors} onPress={onNavigate} />
              ))}
            </View>
          </View>
        ))}

      </ScrollView>
    </View>
  );
}

const FINANCIAL_SCREENS = new Set(['wallet', 'payouts', 'subscriptions']);

export default function OperationsNavigator() {
  const {colors} = useTheme();
  const user = useAuthStore(s => s.user);
  const isSupervisor = user?.originalRole === 'supervisor';

  const [screen, setScreen] = useState(null);
  const [focusOrderId, setFocusOrderId] = useState(null);
  const pendingNav = useAppStore(s => s.pendingNav);
  const clearNav   = useAppStore(s => s.clearNav);

  const goTo   = useCallback(key => {
    if (isSupervisor && FINANCIAL_SCREENS.has(key)) return;
    setScreen(key);
  }, [isSupervisor]);
  const goBack = useCallback(() => { setScreen(null); setFocusOrderId(null); }, []);

  // Consume a deep-link request (e.g. dashboard → services) on mount/update
  useEffect(() => {
    if (pendingNav?.tab === 'operations' && pendingNav?.screen) {
      if (isSupervisor && FINANCIAL_SCREENS.has(pendingNav.screen)) { clearNav(); return; }
      setScreen(pendingNav.screen);
      setFocusOrderId(pendingNav.orderId ?? null);
      clearNav();
    }
  }, [pendingNav, clearNav]);

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
      {!screen && <OperationsMenu colors={colors} onNavigate={goTo} isSupervisor={isSupervisor} />}
      {screen === 'services'   && <ServicesScreen   onBack={goBack} />}
      {screen === 'packages'   && <PackagesScreen   onBack={goBack} />}
      {screen === 'bikers'     && <BikersScreen     onBack={goBack} />}
      {screen === 'staff'      && <StaffScreen      onBack={goBack} />}
      {screen === 'branches'   && <BranchesScreen   onBack={goBack} />}
      {screen === 'wallet'     && <PaymentsScreen   onBack={goBack} />}
      {screen === 'payouts'    && <PayoutsScreen    onBack={goBack} />}
      {screen === 'skipReview' && <SkipReviewScreen onBack={goBack} />}
      {screen === 'reviews'    && <ReviewsScreen    onBack={goBack} />}
      {screen === 'offers'     && <OffersScreen     onBack={goBack} />}
      {screen === 'addons'         && <AddonsScreen         onBack={goBack} />}
      {screen === 'gallery'        && <GalleryScreen        onBack={goBack} />}
      {screen === 'subscriptions'  && <SubscriptionsScreen  onBack={goBack} />}
    </View>
  );
}

const s = StyleSheet.create({
  flex:          {flex: 1},
  root:          {flex: 1},

  // Header
  header:        {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 12},
  headerTitle:   {fontSize: 22, fontWeight: '800'},
  headerArrow:   {width: 36, height: 36, alignItems: 'center', justifyContent: 'center'},

  scrollContent: {paddingHorizontal: 16, paddingBottom: 32, gap: 8},

  // Toggle card
  toggleCard:    {flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 16, borderWidth: 1, marginBottom: 8},
  toggleText:    {flex: 1, gap: 3},
  toggleLabel:   {fontSize: 14, fontWeight: '700'},
  toggleSub:     {fontSize: 11, lineHeight: 16},

  // Section
  section:       {gap: 10},
  sectionTitle:  {fontSize: 14, fontWeight: '700', marginTop: 8},
  sectionRows:   {gap: 10},

  // Row
  row:           {
    flexDirection:  'row',
    alignItems:     'center',
    gap:            10,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius:   16,
    elevation:      1,
    shadowColor:    '#000',
    shadowOpacity:  0.04,
    shadowRadius:   6,
    shadowOffset:   {width: 0, height: 1},
  },
  rowArrow:      {},
  rowText:       {flex: 1, gap: 3},
  rowLabel:      {fontSize: 15, fontWeight: '700'},
  rowSub:        {fontSize: 12},
  rowRight:      {flexDirection: 'row', alignItems: 'center', gap: 8},
  dot:           {width: 8, height: 8, borderRadius: 4},
  iconCircle:    {width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center'},

});
