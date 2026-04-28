import React, {useState, useRef, useEffect, useCallback} from 'react';
import {
  Animated, FlatList, Modal, Platform, RefreshControl,
  ScrollView, StatusBar, StyleSheet, Text,
  TouchableOpacity, View,
} from 'react-native';
import {Colors} from '../../shared/constants/colors';
import {MOCK_USER, MOCK_ORDERS, MOCK_BRANCHES} from '../../shared/data/mockData';
import OrderCard from './components/OrderCard';
import StatCard from './components/StatCard';

export default function HomeScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState(MOCK_BRANCHES[2]);
  const [branchModal, setBranchModal] = useState(false);
  const [tempBranch, setTempBranch] = useState(MOCK_BRANCHES[2]);
  const notifCount = 3;

  const headerY = useRef(new Animated.Value(-80)).current;
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const walletScale = useRef(new Animated.Value(0.92)).current;
  const walletOpacity = useRef(new Animated.Value(0)).current;
  const balanceAnim = useRef(new Animated.Value(0)).current;
  const [displayBalance, setDisplayBalance] = useState(0);
  const notifPulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerOpacity, {toValue: 1, duration: 500, useNativeDriver: true}),
      Animated.spring(headerY, {toValue: 0, useNativeDriver: true, tension: 55, friction: 9}),
    ]).start();
    Animated.parallel([
      Animated.timing(walletOpacity, {toValue: 1, duration: 500, delay: 200, useNativeDriver: true}),
      Animated.spring(walletScale, {toValue: 1, delay: 200, useNativeDriver: true, tension: 55, friction: 8}),
    ]).start();
    Animated.timing(balanceAnim, {toValue: MOCK_USER.wallet.balance, duration: 1400, delay: 400, useNativeDriver: false}).start();
    balanceAnim.addListener(({value}) => setDisplayBalance(Math.floor(value)));
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(notifPulse, {toValue: 1.3, duration: 700, useNativeDriver: true}),
        Animated.timing(notifPulse, {toValue: 1, duration: 700, useNativeDriver: true}),
      ])
    );
    pulse.start();
    return () => { balanceAnim.removeAllListeners(); pulse.stop(); };
  }, [balanceAnim, headerOpacity, headerY, notifPulse, walletOpacity, walletScale]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1200);
  }, []);

  const renderOrderCard = useCallback(({item, index}) => (
    <OrderCard order={item} index={index} />
  ), []);

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />

      {/* Header */}
      <Animated.View style={{opacity: headerOpacity, transform: [{translateY: headerY}]}}>
        <View style={s.header}>
          <View style={s.headerDecor} />
          <View style={s.headerLeft}>
            <Text style={s.greeting}>صباح الخير،</Text>
            <Text style={s.name}>{MOCK_USER.firstName} {MOCK_USER.lastName} 👋</Text>
            <View style={s.branchRow}>
              <Text style={s.pinEmoji}>📍</Text>
              <Text style={s.branchLabel}>{selectedBranch.name}</Text>
            </View>
          </View>
          <TouchableOpacity style={s.notifBtn} activeOpacity={0.8}>
            <Text style={s.notifEmoji}>🔔</Text>
            {notifCount > 0 && (
              <Animated.View style={[s.notifBadge, {transform: [{scale: notifPulse}]}]}>
                <Text style={s.notifBadgeText}>{notifCount}</Text>
              </Animated.View>
            )}
          </TouchableOpacity>
        </View>
      </Animated.View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}>

        {/* Wallet Card */}
        <Animated.View style={{opacity: walletOpacity, transform: [{scale: walletScale}]}}>
          <View style={s.walletCard}>
            <View style={s.walletDecor1} />
            <View style={s.walletDecor2} />
            <View style={s.walletTop}>
              <View style={s.walletRow}>
                <View style={s.walletIconBox}>
                  <Text style={{fontSize: 16}}>💳</Text>
                </View>
                <Text style={s.walletBrand}>SWIVO WALLET</Text>
              </View>
              <View style={s.sarPill}>
                <Text style={s.sarText}>SAR</Text>
              </View>
            </View>
            <Text style={s.balanceLabel}>رصيدك الحالي</Text>
            <View style={s.balanceRow}>
              <Text style={s.balanceNum}>{displayBalance.toLocaleString()}</Text>
              <Text style={s.balanceDec}>.00</Text>
              <Text style={s.balanceCur}>﷼</Text>
            </View>
            <View style={s.walletDivider} />
            <View style={s.walletStats}>
              <View style={s.walletStat}>
                <Text style={s.walletStatLabel}>↑ هذا الشهر</Text>
                <Text style={s.walletStatVal}>﷼ {MOCK_USER.wallet.monthlyEarnings.toLocaleString()}</Text>
              </View>
              <View style={s.walletStatDivider} />
              <View style={s.walletStat}>
                <Text style={s.walletStatLabel}>↑ هذا الأسبوع</Text>
                <Text style={s.walletStatVal}>﷼ {MOCK_USER.wallet.weeklyEarnings.toLocaleString()}</Text>
              </View>
            </View>
            <TouchableOpacity style={s.walletBtn} activeOpacity={0.8}>
              <Text style={s.walletBtnText}>عرض المحفظة كاملاً</Text>
              <Text style={s.walletBtnArrow}>←</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Quick Stats */}
        <View style={s.statsRow}>
          <StatCard emoji="⭐" label="تقييمك" value={`${MOCK_USER.rating}/5`} color="#F59E0B" delay={300} />
          <StatCard emoji="📦" label="نشطة" value={`${MOCK_ORDERS.length}`} color={Colors.primary} delay={400} />
          <StatCard emoji="✅" label="مكتملة" value="28" color={Colors.success} delay={500} />
        </View>

        {/* Branch Selector */}
        <TouchableOpacity style={s.branchBtn} onPress={() => setBranchModal(true)} activeOpacity={0.8}>
          <View style={s.branchIconBox}>
            <Text style={{fontSize: 16}}>📍</Text>
          </View>
          <Text style={s.branchText}>{selectedBranch.name}</Text>
          <Text style={s.chevron}>⌄</Text>
        </TouchableOpacity>

        {/* Active Orders */}
        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>طلباتك النشطة</Text>
          <View style={s.countPill}>
            <Text style={s.countText}>{MOCK_ORDERS.length}</Text>
          </View>
          <View style={s.flex1} />
          <TouchableOpacity>
            <Text style={s.seeAll}>عرض الكل</Text>
          </TouchableOpacity>
        </View>

        {MOCK_ORDERS.length > 0 ? (
          <FlatList
            data={MOCK_ORDERS}
            keyExtractor={i => i._id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{paddingRight: 16, paddingBottom: 4}}
            renderItem={renderOrderCard}
          />
        ) : (
          <View style={s.empty}>
            <Text style={{fontSize: 48}}>📭</Text>
            <Text style={s.emptyText}>لا توجد طلبات نشطة الآن</Text>
          </View>
        )}

        {/* Quick Actions */}
        <Text style={s.actionsTitle}>الإجراءات السريعة</Text>
        <View style={s.actionsRow}>
          {[
            {emoji: '📋', label: 'طلباتي',    bg: '#EFF6FF', color: '#2563EB'},
            {emoji: '💰', label: 'المحفظة',   bg: '#ECFDF5', color: '#059669'},
            {emoji: '⭐', label: 'التقييمات', bg: '#FFFBEB', color: '#D97706'},
            {emoji: '📊', label: 'التقارير',  bg: '#F5F3FF', color: '#7C3AED'},
          ].map((item, i) => (
            <TouchableOpacity key={i} style={[s.actionBtn, {backgroundColor: item.bg}]} activeOpacity={0.75}>
              <Text style={s.actionEmoji}>{item.emoji}</Text>
              <Text style={[s.actionLabel, {color: item.color}]}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Branch Modal */}
      <Modal visible={branchModal} transparent animationType="slide" onRequestClose={() => setBranchModal(false)}>
        <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={() => setBranchModal(false)} />
        <View style={s.modalSheet}>
          <View style={s.modalHandle} />
          <Text style={s.modalTitle}>اختر المنطقة</Text>
          {MOCK_BRANCHES.map(b => (
            <TouchableOpacity key={b._id} style={s.branchOption} onPress={() => setTempBranch(b)}>
              <View style={[s.radio, tempBranch._id === b._id && s.radioSelected]}>
                {tempBranch._id === b._id && <View style={s.radioInner} />}
              </View>
              <Text style={[s.branchOptionText, tempBranch._id === b._id && {color: Colors.primary, fontWeight: '700'}]}>
                {b.name}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={s.modalConfirmBtn} onPress={() => { setSelectedBranch(tempBranch); setBranchModal(false); }}>
            <Text style={s.modalConfirmText}>تأكيد</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  root: {flex: 1, backgroundColor: '#F8FAFC'},
  header: {backgroundColor: Colors.primary, paddingTop: Platform.OS === 'ios' ? 56 : 48, paddingBottom: 24, paddingHorizontal: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', overflow: 'hidden'},
  headerDecor: {position: 'absolute', width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(255,255,255,0.08)', top: -60, right: -40},
  headerLeft: {flex: 1},
  greeting: {fontSize: 13, color: 'rgba(255,255,255,0.75)'},
  name: {fontSize: 20, fontWeight: '800', color: '#fff', marginTop: 2},
  branchRow: {flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6},
  pinEmoji: {fontSize: 11},
  branchLabel: {fontSize: 11, color: 'rgba(255,255,255,0.65)'},
  notifBtn: {width: 46, height: 46, borderRadius: 23, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center'},
  notifEmoji: {fontSize: 20},
  notifBadge: {position: 'absolute', top: 8, right: 8, width: 16, height: 16, borderRadius: 8, backgroundColor: Colors.danger, borderWidth: 1.5, borderColor: Colors.primary, alignItems: 'center', justifyContent: 'center'},
  notifBadgeText: {color: '#fff', fontSize: 8, fontWeight: '800'},
  scroll: {flex: 1},
  scrollContent: {paddingBottom: 32},
  walletCard: {margin: 16, borderRadius: 28, padding: 22, backgroundColor: Colors.primaryDark, overflow: 'hidden', shadowColor: Colors.primary, shadowOffset: {width: 0, height: 10}, shadowOpacity: 0.4, shadowRadius: 20, elevation: 12},
  walletDecor1: {position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.07)', top: -60, left: -60},
  walletDecor2: {position: 'absolute', width: 130, height: 130, borderRadius: 65, backgroundColor: 'rgba(255,255,255,0.04)', bottom: -30, right: 10},
  walletTop: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16},
  walletRow: {flexDirection: 'row', alignItems: 'center', gap: 10},
  walletIconBox: {width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center'},
  walletBrand: {fontSize: 11, fontWeight: '800', color: 'rgba(255,255,255,0.6)', letterSpacing: 1.5},
  sarPill: {backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20},
  sarText: {fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.55)'},
  balanceLabel: {fontSize: 13, color: 'rgba(255,255,255,0.65)', marginBottom: 4},
  balanceRow: {flexDirection: 'row', alignItems: 'flex-end', gap: 4, marginBottom: 20},
  balanceNum: {fontSize: 44, fontWeight: '900', color: '#fff', letterSpacing: -1},
  balanceDec: {fontSize: 18, color: 'rgba(255,255,255,0.5)', marginBottom: 6},
  balanceCur: {fontSize: 16, color: 'rgba(255,255,255,0.5)', marginBottom: 6, marginRight: 4},
  walletDivider: {height: 1, backgroundColor: 'rgba(255,255,255,0.12)', marginBottom: 16},
  walletStats: {flexDirection: 'row', marginBottom: 18},
  walletStat: {flex: 1},
  walletStatLabel: {fontSize: 11, color: 'rgba(255,255,255,0.55)', marginBottom: 4},
  walletStatVal: {fontSize: 15, fontWeight: '700', color: '#fff'},
  walletStatDivider: {width: 1, backgroundColor: 'rgba(255,255,255,0.12)', marginHorizontal: 16},
  walletBtn: {flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.14)', borderRadius: 14, paddingVertical: 13, alignItems: 'center', justifyContent: 'center', gap: 8},
  walletBtnText: {color: '#fff', fontSize: 14, fontWeight: '600'},
  walletBtnArrow: {color: '#fff', fontSize: 16},
  statsRow: {flexDirection: 'row', gap: 10, marginHorizontal: 16, marginTop: 4},
  branchBtn: {marginHorizontal: 16, marginTop: 12, backgroundColor: Colors.card, borderRadius: 18, borderWidth: 1, borderColor: '#EEF2F7', paddingHorizontal: 14, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', gap: 10, shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.04, elevation: 2},
  branchIconBox: {width: 36, height: 36, borderRadius: 10, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center'},
  branchText: {flex: 1, fontSize: 14, color: Colors.textPrimary, fontWeight: '600'},
  chevron: {fontSize: 18, color: '#94A3B8'},
  sectionHeader: {flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginTop: 20, marginBottom: 12, gap: 8},
  sectionTitle: {fontSize: 17, fontWeight: '700', color: '#1E293B'},
  countPill: {backgroundColor: '#DBEAFE', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 2},
  countText: {fontSize: 12, color: Colors.primary, fontWeight: '700'},
  flex1: {flex: 1},
  seeAll: {fontSize: 13, color: Colors.primary, fontWeight: '600'},
  empty: {alignItems: 'center', paddingVertical: 32, gap: 8},
  emptyText: {fontSize: 13, color: '#94A3B8'},
  actionsTitle: {fontSize: 17, fontWeight: '700', color: '#1E293B', marginHorizontal: 16, marginTop: 20, marginBottom: 12},
  actionsRow: {flexDirection: 'row', gap: 10, marginHorizontal: 16},
  actionBtn: {flex: 1, borderRadius: 18, paddingVertical: 16, alignItems: 'center', gap: 6},
  actionEmoji: {fontSize: 22},
  actionLabel: {fontSize: 11, fontWeight: '700'},
  modalOverlay: {flex: 1, backgroundColor: 'rgba(0,0,0,0.45)'},
  modalSheet: {backgroundColor: Colors.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40},
  modalHandle: {width: 40, height: 4, backgroundColor: '#E2E8F0', borderRadius: 2, alignSelf: 'center', marginBottom: 20},
  modalTitle: {fontSize: 17, fontWeight: '700', color: Colors.textPrimary, textAlign: 'center', marginBottom: 20},
  branchOption: {flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', gap: 12},
  radio: {width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center'},
  radioSelected: {borderColor: Colors.primary},
  radioInner: {width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.primary},
  branchOptionText: {fontSize: 15, color: Colors.textPrimary},
  modalConfirmBtn: {marginTop: 20, backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 16, alignItems: 'center'},
  modalConfirmText: {color: '#fff', fontSize: 16, fontWeight: '700'},
});
