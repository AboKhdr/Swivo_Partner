import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import {
  ArrowRight, Plus, Bike, Star, Phone,
  UserX, PauseCircle, Trash2, X,
  ShieldCheck, Search, RefreshCw,
} from 'lucide-react-native';
import {useTheme} from '../../../shared/context/ThemeContext';
import {useI18n} from '../../../shared/i18n/I18nContext';
import useAppStore from '../../../store/appStore';
import {getStaff, setStaffStatus, removeStaff, setDutyStatus} from '../../../services/partner';
import AddBikerScreen from './AddBikerScreen';

// ── helpers ──────────────────────────────────────────────────────────────────

function memberName(m) {
  if (m.userId) return `${m.userId.firstName ?? ''} ${m.userId.lastName ?? ''}`.trim();
  return m.name ?? '';
}

function statusBadge(m) {
  if (m.status === 'suspended')   return {label: 'موقوف',       color: '#F59E0B'};
  if (m.status === 'deactivated') return {label: 'معطّل',       color: '#EF4444'};
  if (m.isOnDuty)                 return {label: 'نشط',         color: '#22C55E'};
  return                                 {label: 'خارج الخدمة', color: '#94A3B8'};
}

// ── AvatarPlaceholder ─────────────────────────────────────────────────────────

function AvatarPlaceholder({size, colors}) {
  return (
    <View style={[av.wrap, {width: size, height: size, borderRadius: size / 2, backgroundColor: colors.primary + '15'}]}>
      <View style={[av.head, {backgroundColor: colors.primary + '40', width: size * 0.38, height: size * 0.38, borderRadius: size * 0.19}]} />
      <View style={[av.body, {backgroundColor: colors.primary + '40', width: size * 0.58, height: size * 0.3,  borderRadius: size * 0.08}]} />
    </View>
  );
}
const av = StyleSheet.create({
  wrap: {alignItems: 'center', justifyContent: 'flex-end', overflow: 'hidden'},
  head: {marginBottom: 2},
  body: {},
});

// ── ActionSheet ───────────────────────────────────────────────────────────────

function ActionSheet({visible, member, onClose, onAction, colors, t}) {
  if (!member) return null;
  const isLocked = member.status === 'suspended' || member.status === 'deactivated';
  const name = memberName(member);
  const trips = member.activeOrdersCount ?? 0;

  const options = [
    ...(isLocked ? [
      {key: 'reactivate', label: 'استعادة الحساب', sub: 'إعادة تفعيل العضو وتمكينه من الدخول', Icon: RefreshCw, color: '#22C55E'},
    ] : [
      {key: 'suspend',  label: t('partner.bikers.actions.suspend'),    sub: t('partner.bikers.actions.suspendSub'),    Icon: PauseCircle, color: '#F59E0B'},
      {key: 'deactive', label: t('partner.bikers.actions.deactivate'), sub: t('partner.bikers.actions.deactivateSub'), Icon: UserX,       color: '#EF4444'},
    ]),
    {key: 'delete', label: t('partner.bikers.actions.delete'), sub: t('partner.bikers.actions.deleteSub'), Icon: Trash2, color: '#EF4444'},
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={sh.overlay} />
      </TouchableWithoutFeedback>
      <View style={sh.sheet}>
        <View style={[sh.card, {backgroundColor: colors.card}]}>
          <View style={[sh.handle, {backgroundColor: colors.border}]} />

          <View style={sh.memberRow}>
            <AvatarPlaceholder size={40} colors={colors} />
            <View style={sh.memberInfo}>
              <Text style={[sh.memberName, {color: colors.textPrimary}]}>{name}</Text>
              <Text style={[sh.memberSub,  {color: colors.textSecondary}]}>{trips} {t('partner.bikers.trips')}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={sh.closeBtn}>
              <X size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={[sh.divider, {backgroundColor: colors.border}]} />

          {options.map((opt, i) => (
            <View key={opt.key}>
              <TouchableOpacity
                style={sh.optRow}
                onPress={() => { onAction(opt.key, member); onClose(); }}
                activeOpacity={0.75}>
                <View style={[sh.optIcon, {backgroundColor: opt.color + '15'}]}>
                  <opt.Icon size={18} color={opt.color} />
                </View>
                <View style={sh.optText}>
                  <Text style={[sh.optLabel, {color: opt.color}]}>{opt.label}</Text>
                  <Text style={[sh.optSub,   {color: colors.textSecondary}]}>{opt.sub}</Text>
                </View>
              </TouchableOpacity>
              {i < options.length - 1 && <View style={[sh.divider, {backgroundColor: colors.border}]} />}
            </View>
          ))}
        </View>
      </View>
    </Modal>
  );
}

const sh = StyleSheet.create({
  overlay:    {position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)'},
  sheet:      {flex: 1, justifyContent: 'flex-end'},
  card:       {borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 36},
  handle:     {width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 8},
  memberRow:  {flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 14},
  memberInfo: {flex: 1},
  memberName: {fontSize: 16, fontWeight: '800'},
  memberSub:  {fontSize: 12, marginTop: 2},
  closeBtn:   {width: 32, height: 32, alignItems: 'center', justifyContent: 'center'},
  divider:    {height: 1},
  optRow:     {flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingVertical: 16},
  optIcon:    {width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center'},
  optText:    {flex: 1, gap: 2},
  optLabel:   {fontSize: 15, fontWeight: '700'},
  optSub:     {fontSize: 12},
});

// ── MemberCard ────────────────────────────────────────────────────────────────

function MemberCard({item, colors, tripsLabel, isBiker, onOptions, onDutyToggle}) {
  const name   = memberName(item);
  const phone  = item.userId?.phoneNumber ?? item.phone ?? '';
  const trips  = item.activeOrdersCount ?? 0;
  const rating = item.rating ?? 0;
  const badge  = statusBadge(item);
  const locked = item.status === 'suspended' || item.status === 'deactivated';

  return (
    <TouchableOpacity
      style={[s.card, {backgroundColor: colors.card}]}
      onPress={() => isBiker ? onOptions(item) : null}
      activeOpacity={isBiker ? 0.85 : 1}>

      <TouchableOpacity
        style={[s.phoneBtn, {backgroundColor: colors.bg}]}
        activeOpacity={0.8}
        onPress={() => {
          if (phone) {
            const {Linking} = require('react-native');
            Linking.openURL(`tel:${phone}`);
          }
        }}>
        <Phone size={18} color={colors.textSecondary} />
      </TouchableOpacity>

      <View style={s.info}>
        <Text style={[s.name, {color: colors.textPrimary}]} numberOfLines={1}>{name}</Text>
        <View style={s.statsRow}>
          {isBiker
            ? <Bike size={13} color="#F59E0B" />
            : <ShieldCheck size={13} color={colors.primary} />}
          {isBiker && (
            <Text style={[s.statTxt, {color: colors.textSecondary}]}>{trips} {tripsLabel}</Text>
          )}
          {rating > 0 && (
            <>
              <Star size={12} color="#F59E0B" fill="#F59E0B" />
              <Text style={[s.statTxt, {color: colors.textSecondary}]}>{rating.toFixed(1)}</Text>
            </>
          )}
        </View>
        <View style={[s.badge, {backgroundColor: badge.color + '18'}]}>
          <Text style={[s.badgeTxt, {color: badge.color}]}>{badge.label}</Text>
        </View>
      </View>

      <AvatarPlaceholder size={52} colors={colors} />

      {isBiker && !locked && (
        <Switch
          value={item.isOnDuty ?? false}
          onValueChange={val => onDutyToggle(item._id ?? item.id, val)}
          trackColor={{false: colors.border, true: colors.primary + 'AA'}}
          thumbColor={item.isOnDuty ? colors.primary : '#ccc'}
        />
      )}
    </TouchableOpacity>
  );
}

// ── StaffScreen ───────────────────────────────────────────────────────────────

export default function StaffScreen({onBack}) {
  const {colors} = useTheme();
  const {t} = useI18n();
  const showToast = useAppStore(s => s.showToast);

  const [activeTab,    setActiveTab]    = useState('bikers');
  const [bikers,       setBikers]       = useState([]);
  const [managers,     setManagers]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState('');
  const [sheetMember,  setSheetMember]  = useState(null);
  const [addTarget,    setAddTarget]    = useState(null);  // null | { role, initialData? }

  const searchRef = useRef(null);

  // ── fetch ───────────────────────────────────────────────────────────────────

  const fetchStaff = useCallback(async () => {
    setLoading(true);
    const results = await Promise.allSettled([
      getStaff({role: 'BIKER',   limit: 100}),
      getStaff({role: 'MANAGER', limit: 100}),
    ]);
    const [bRes, mRes] = results.map(r =>
      r.status === 'fulfilled' ? r.value : {success: false},
    );
    if (bRes.success) setBikers(bRes.data?.data   ?? bRes.data ?? []);
    if (mRes.success) setManagers(mRes.data?.data ?? mRes.data ?? []);
    if (!bRes.success && !mRes.success) showToast('تعذّر تحميل بيانات الفريق', 'error');
    setLoading(false);
  }, [showToast]);

  useEffect(() => { fetchStaff(); }, [fetchStaff]);

  // ── derived ─────────────────────────────────────────────────────────────────

  const isBiker        = activeTab === 'bikers';
  const currentList    = isBiker ? bikers : managers;
  const setCurrentList = isBiker ? setBikers : setManagers;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return currentList;
    return currentList.filter(m => {
      const n = memberName(m).toLowerCase();
      const p = (m.userId?.phoneNumber ?? m.phone ?? '').toLowerCase();
      return n.includes(q) || p.includes(q);
    });
  }, [currentList, search]);

  const totalActive = currentList.filter(
    m => m.isOnDuty && m.status !== 'suspended' && m.status !== 'deactivated',
  ).length;

  // ── actions ──────────────────────────────────────────────────────────────────

  const handleDutyToggle = useCallback(async (id, val) => {
    setCurrentList(prev => prev.map(m => (m._id ?? m.id) === id ? {...m, isOnDuty: val} : m));
    const res = await setDutyStatus(id, val);
    if (!res.success) {
      setCurrentList(prev => prev.map(m => (m._id ?? m.id) === id ? {...m, isOnDuty: !val} : m));
      showToast('فشل تغيير حالة الخدمة', 'error');
    }
  }, [setCurrentList, showToast]);

  const handleAction = useCallback(async (action, member) => {
    const id = member._id ?? member.id;
    let res;

    if (action === 'delete') {
      res = await removeStaff(id);
      if (res.success) setCurrentList(prev => prev.filter(m => (m._id ?? m.id) !== id));
      else showToast('فشل حذف العضو', 'error');

    } else if (action === 'suspend') {
      res = await setStaffStatus(id, 'suspended');
      if (res.success) setCurrentList(prev => prev.map(m =>
        (m._id ?? m.id) === id ? {...m, isOnDuty: false, status: 'suspended'} : m,
      ));
      else showToast('فشل تعليق العضو', 'error');

    } else if (action === 'deactive') {
      res = await setStaffStatus(id, 'deactivated');
      if (res.success) setCurrentList(prev => prev.map(m =>
        (m._id ?? m.id) === id ? {...m, isOnDuty: false, status: 'deactivated'} : m,
      ));
      else showToast('فشل تعطيل العضو', 'error');

    } else if (action === 'reactivate') {
      res = await setStaffStatus(id, 'active');
      if (res.success) setCurrentList(prev => prev.map(m =>
        (m._id ?? m.id) === id ? {...m, status: 'active'} : m,
      ));
      else showToast('فشل استعادة الحساب', 'error');
    }
  }, [setCurrentList, showToast]);

  const handleSaved = useCallback(() => {
    setAddTarget(null);
    fetchStaff();
  }, [fetchStaff]);

  // ── render ───────────────────────────────────────────────────────────────────

  const tripsLabel = t('partner.bikers.trips');
  const renderItem = useCallback(({item}) => (
    <MemberCard
      item={item}
      colors={colors}
      tripsLabel={tripsLabel}
      isBiker={isBiker}
      onOptions={isBiker ? setSheetMember : () => null}
      onDutyToggle={handleDutyToggle}
    />
  ), [colors, tripsLabel, isBiker, handleDutyToggle]);

  const keyExtractor = useCallback(item => item._id ?? item.id, []);

  // ── inline add/edit screen ───────────────────────────────────────────────────

  if (addTarget) {
    return (
      <AddBikerScreen
        role={addTarget.role}
        initialData={addTarget.initialData ?? null}
        onBack={() => setAddTarget(null)}
        onSaved={handleSaved}
      />
    );
  }

  // ── main list ────────────────────────────────────────────────────────────────

  const tabLabel = isBiker ? t('partner.staff.bikers') : t('partner.staff.managers');

  return (
    <View style={[s.root, {backgroundColor: colors.bg}]}>

      {/* Header */}
      <View style={[s.header, {backgroundColor: colors.bg}]}>
        <TouchableOpacity onPress={onBack} style={s.backBtn} activeOpacity={0.75}>
          <ArrowRight size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={s.headerText}>
          <Text style={[s.headerTitle, {color: colors.textPrimary}]}>{tabLabel}</Text>
          <Text style={[s.headerSub, {color: colors.textSecondary}]}>
            {totalActive} نشط — {currentList.length} إجمالي
          </Text>
        </View>
        <TouchableOpacity
          style={[s.addBtn, {backgroundColor: colors.primary}]}
          activeOpacity={0.85}
          onPress={() => setAddTarget({role: isBiker ? 'BIKER' : 'MANAGER'})}>
          <Plus size={20} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={[s.tabs, {borderBottomColor: colors.border}]}>
        {[
          {key: 'bikers',   label: t('partner.staff.bikers'),   count: bikers.length},
          {key: 'managers', label: t('partner.staff.managers'), count: managers.length},
        ].map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[s.tab, activeTab === tab.key && {borderBottomColor: colors.primary, borderBottomWidth: 2}]}
            onPress={() => { setActiveTab(tab.key); setSearch(''); }}>
            <Text style={[s.tabTxt, {color: activeTab === tab.key ? colors.primary : colors.textSecondary}]}>
              {tab.label}
            </Text>
            <View style={[s.tabBadge, {backgroundColor: activeTab === tab.key ? colors.primary + '18' : colors.card}]}>
              <Text style={[s.tabBadgeTxt, {color: activeTab === tab.key ? colors.primary : colors.textSecondary}]}>
                {tab.count}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Search */}
      <View style={[s.searchRow, {backgroundColor: colors.card, borderColor: colors.border}]}>
        <Search size={16} color={colors.textSecondary} />
        <TextInput
          ref={searchRef}
          style={[s.searchInput, {color: colors.textPrimary}]}
          placeholder={isBiker ? 'ابحث عن بايكر...' : 'ابحث عن مدير...'}
          placeholderTextColor={colors.textSecondary}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')} hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
            <X size={15} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* List */}
      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <View style={s.center}>
              <Text style={{color: colors.textSecondary, fontSize: 14}}>
                {search ? 'لا توجد نتائج' : isBiker ? 'لا يوجد بايكرز' : 'لا يوجد مديرون'}
              </Text>
            </View>
          }
        />
      )}

      {/* Action Sheet */}
      <ActionSheet
        visible={!!sheetMember}
        member={sheetMember}
        onClose={() => setSheetMember(null)}
        onAction={handleAction}
        colors={colors}
        t={t}
      />
    </View>
  );
}

// ── styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root:        {flex: 1},
  center:      {flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 48},
  header:      {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16},
  backBtn:     {width: 36, height: 36, alignItems: 'center', justifyContent: 'center'},
  addBtn:      {width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center'},
  headerText:  {flex: 1, gap: 2, paddingHorizontal: 8},
  headerTitle: {fontSize: 26, fontWeight: '900'},
  headerSub:   {fontSize: 13},

  tabs:        {flexDirection: 'row', borderBottomWidth: 1},
  tab:         {flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 14},
  tabTxt:      {fontSize: 14, fontWeight: '700'},
  tabBadge:    {paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10},
  tabBadgeTxt: {fontSize: 12, fontWeight: '700'},

  searchRow:   {flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 16, marginTop: 12, marginBottom: 4, borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10},
  searchInput: {flex: 1, fontSize: 14, padding: 0},

  list:        {paddingHorizontal: 16, paddingTop: 12, paddingBottom: 32, gap: 10},

  card:        {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               10,
    borderRadius:      20,
    paddingVertical:   14,
    paddingHorizontal: 16,
    elevation:         2,
    shadowColor:       '#000',
    shadowOpacity:     0.05,
    shadowRadius:      10,
    shadowOffset:      {width: 0, height: 2},
  },
  phoneBtn:  {width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center'},
  info:      {flex: 1, gap: 4, alignItems: 'center'},
  name:      {fontSize: 15, fontWeight: '800'},
  statsRow:  {flexDirection: 'row', alignItems: 'center', gap: 4},
  statTxt:   {fontSize: 12, fontWeight: '500'},
  badge:     {paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10},
  badgeTxt:  {fontSize: 11, fontWeight: '700'},
});
