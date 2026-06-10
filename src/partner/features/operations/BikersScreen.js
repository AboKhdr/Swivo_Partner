import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import {ArrowRight, Plus, Bike, Star, Phone, UserX, PauseCircle, Trash2, X, RefreshCw} from 'lucide-react-native';
import {useTheme} from '../../../shared/context/ThemeContext';
import SelectField from '../../../shared/components/SelectField';
import AddBikerScreen from './AddBikerScreen';
import BikerDetailsScreen from './BikerDetailsScreen';
import {getStaff, setStaffStatus, removeStaff, setDutyStatus, getBranches} from '../../../services/partner';

function buildOptions(biker) {
  const isDeactivated = biker.status === 'deactivated';
  const isOnDuty      = biker.isOnDuty ?? false;
  return [
    ...(isDeactivated
      ? [{key: 'reactivate', label: 'تفعيل الحساب',    sub: 'إعادة تفعيل البايكر وتمكينه من الدخول',      Icon: RefreshCw,   color: '#22C55E'}]
      : [
          isOnDuty
            ? {key: 'suspend',  label: 'إيقاف مؤقت',    sub: 'إخراج البايكر من الخدمة مؤقتاً',              Icon: PauseCircle, color: '#F59E0B'}
            : {key: 'resume',   label: 'إعادة للخدمة',   sub: 'إعادة البايكر لاستقبال الطلبات',              Icon: RefreshCw,   color: '#22C55E'},
          {key: 'deactive',   label: 'تعطيل الحساب',  sub: 'تعطيل الحساب ولن يتمكن من الدخول',            Icon: UserX,       color: '#EF4444'},
        ]
    ),
    {key: 'delete', label: 'حذف البايكر', sub: 'حذف نهائي ولا يمكن التراجع', Icon: Trash2, color: '#EF4444'},
  ];
}

function AvatarPlaceholder({size, colors}) {
  return (
    <View style={[ap.wrap, {width: size, height: size, borderRadius: size / 2, backgroundColor: colors.primary + '15'}]}>
      <View style={[ap.head, {backgroundColor: colors.primary + '50', width: size * 0.38, height: size * 0.38, borderRadius: size * 0.19}]} />
      <View style={[ap.body, {backgroundColor: colors.primary + '50', width: size * 0.58, height: size * 0.28, borderRadius: size * 0.08}]} />
    </View>
  );
}

const ap = StyleSheet.create({
  wrap: {alignItems: 'center', justifyContent: 'flex-end', overflow: 'hidden'},
  head: {marginBottom: 2},
  body: {},
});

function StopSheet({visible, biker, onClose, onAction, colors}) {
  if (!biker) return null;
  const name  = biker.userId
    ? `${biker.userId.firstName ?? ''} ${biker.userId.lastName ?? ''}`.trim()
    : biker.name ?? '';
  const trips   = biker.activeOrdersCount ?? biker.trips ?? 0;
  const options = buildOptions(biker);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={ss.overlay} />
      </TouchableWithoutFeedback>
      <View style={ss.sheet}>
        <View style={[ss.card, {backgroundColor: colors.card}]}>
          <View style={[ss.handle, {backgroundColor: colors.border}]} />

          <View style={ss.bikerRow}>
            <AvatarPlaceholder size={40} colors={colors} />
            <View style={ss.bikerInfo}>
              <Text style={[ss.bikerName, {color: colors.textPrimary}]}>{name}</Text>
              <Text style={[ss.bikerSub,  {color: colors.textSecondary}]}>{trips} رحلة</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={ss.closeBtn}>
              <X size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={[ss.divider, {backgroundColor: colors.border}]} />

          {options.map((opt, i) => (
            <View key={opt.key}>
              <TouchableOpacity
                style={ss.optRow}
                onPress={() => { onAction(opt.key, biker); onClose(); }}
                activeOpacity={0.75}>
                <View style={[ss.optIcon, {backgroundColor: opt.color + '15'}]}>
                  <opt.Icon size={18} color={opt.color} />
                </View>
                <View style={ss.optText}>
                  <Text style={[ss.optLabel, {color: opt.color}]}>{opt.label}</Text>
                  <Text style={[ss.optSub,   {color: colors.textSecondary}]}>{opt.sub}</Text>
                </View>
              </TouchableOpacity>
              {i < options.length - 1 && (
                <View style={[ss.divider, {backgroundColor: colors.border}]} />
              )}
            </View>
          ))}
        </View>
      </View>
    </Modal>
  );
}

const ss = StyleSheet.create({
  overlay:   {position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)'},
  sheet:     {flex: 1, justifyContent: 'flex-end'},
  card:      {borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 32},
  handle:    {width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 8},
  bikerRow:  {flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 14},
  bikerInfo: {flex: 1},
  bikerName: {fontSize: 16, fontWeight: '800'},
  bikerSub:  {fontSize: 12, marginTop: 2},
  closeBtn:  {width: 32, height: 32, alignItems: 'center', justifyContent: 'center'},
  divider:   {height: 1},
  optRow:    {flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingVertical: 16},
  optIcon:   {width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center'},
  optText:   {flex: 1, gap: 2},
  optLabel:  {fontSize: 15, fontWeight: '700'},
  optSub:    {fontSize: 12},
});

function statusBadge(item) {
  if (item.status === 'deactivated') return {label: 'معطّل الحساب',  color: '#EF4444'};
  if (item.status === 'suspended')   return {label: 'موقوف مؤقتاً', color: '#F59E0B'};
  if (item.isOnDuty)                 return {label: 'فعّال',         color: '#22C55E'};
  return                                    {label: 'غير فعّال',     color: '#94A3B8'};
}

function BikerCard({item, colors, onOptions}) {
  const name   = item.userId
    ? `${item.userId.firstName ?? ''} ${item.userId.lastName ?? ''}`.trim()
    : item.name ?? '';
  const phone  = item.userId?.phoneNumber ?? item.phone ?? '';
  const trips  = item.activeOrdersCount ?? item.trips ?? 0;
  const rating = item.rating ?? 0;
  const badge  = statusBadge(item);

  return (
    <TouchableOpacity
      style={[s.card, {backgroundColor: colors.card}]}
      onPress={() => onOptions(item)}
      activeOpacity={0.85}>
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
        <Text style={[s.name, {color: colors.textPrimary}]}>{name}</Text>
        <View style={s.statsRow}>
          <Bike size={14} color="#F59E0B" />
          <Text style={[s.statTxt, {color: colors.textSecondary}]}>{trips} رحلة</Text>
          {rating > 0 && (
            <>
              <Star size={13} color="#F59E0B" fill="#F59E0B" />
              <Text style={[s.statTxt, {color: colors.textSecondary}]}>{rating}</Text>
            </>
          )}
        </View>
        <View style={[s.badge, {backgroundColor: badge.color + '18'}]}>
          <View style={[s.badgeDot, {backgroundColor: badge.color}]} />
          <Text style={[s.badgeTxt, {color: badge.color}]}>{badge.label}</Text>
        </View>
      </View>
      <AvatarPlaceholder size={56} colors={colors} />
    </TouchableOpacity>
  );
}

export default function BikersScreen({onBack}) {
  const {colors} = useTheme();
  const [bikers,       setBikers]       = useState([]);
  const [branches,     setBranches]     = useState([{_id: 'all', name: {ar: 'كل الفروع'}}]);
  const [activeBranch, setActiveBranch] = useState('all');
  const [loading,      setLoading]      = useState(true);
  const [sheetBiker,   setSheetBiker]   = useState(null);
  const [showAdd,      setShowAdd]      = useState(false);
  const [editingBiker, setEditingBiker] = useState(null);
  const [detailBiker,  setDetailBiker]  = useState(null);

  // Fetch bikers from /tenant/staff, optionally scoped to a branch
  const fetchBikers = useCallback(async (branchId = activeBranch) => {
    setLoading(true);
    const filters = {role: 'BIKER', limit: 100};
    if (branchId && branchId !== 'all') filters.branch = branchId;
    const res = await getStaff(filters);
    if (res.success) {
      const list = res.data?.data ?? res.data ?? [];
      setBikers(Array.isArray(list) ? list : []);
    }
    setLoading(false);
  }, [activeBranch]);

  // Initial load: branches + all bikers
  useEffect(() => {
    getBranches().then(res => {
      if (res.success) {
        const list = res.data?.data ?? res.data ?? [];
        setBranches([{_id: 'all', name: {ar: 'كل الفروع'}}, ...(Array.isArray(list) ? list : [])]);
      }
    });
    fetchBikers('all');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelectBranch = useCallback(id => {
    if (id === activeBranch) return;
    setActiveBranch(id);
    fetchBikers(id);
  }, [activeBranch, fetchBikers]);

  const branchOptions = useMemo(() => branches.map(b => ({
    value: b._id ?? b.id,
    label: b.name?.ar ?? b.nameAr ?? b.name?.en ?? '',
  })), [branches]);

  const handleOptions = useCallback(item => setDetailBiker(item), []);

  const handleAction = useCallback(async (action, biker) => {
    const id = biker._id ?? biker.id;
    if (action === 'delete') {
      const res = await removeStaff(id);
      if (res.success) setBikers(prev => prev.filter(b => (b._id ?? b.id) !== id));
    } else if (action === 'suspend') {
      const res = await setDutyStatus(id, false);
      if (res.success) setBikers(prev => prev.map(b => (b._id ?? b.id) === id ? {...b, isOnDuty: false} : b));
    } else if (action === 'resume') {
      const res = await setDutyStatus(id, true);
      if (res.success) setBikers(prev => prev.map(b => (b._id ?? b.id) === id ? {...b, isOnDuty: true} : b));
    } else if (action === 'deactive') {
      const res = await setStaffStatus(id, 'deactivated');
      if (res.success) setBikers(prev => prev.map(b => (b._id ?? b.id) === id ? {...b, isOnDuty: false, status: 'deactivated'} : b));
    } else if (action === 'reactivate') {
      const res = await setStaffStatus(id, 'active');
      if (res.success) setBikers(prev => prev.map(b => (b._id ?? b.id) === id ? {...b, status: 'active'} : b));
    }
  }, []);

  const renderItem = useCallback(({item}) => (
    <BikerCard item={item} colors={colors} onOptions={handleOptions} />
  ), [colors, handleOptions]);

  const keyExtractor = useCallback(item => item._id ?? item.id, []);

  const activeCount = bikers.filter(b => b.isOnDuty).length;
  const showList    = !showAdd && !editingBiker && !detailBiker;

  return (
    <View style={s.flex}>
      <View style={[s.flex, showList ? s.visible : s.hidden]}>
        <View style={[s.root, {backgroundColor: colors.bg}]}>
          <View style={[s.header, {backgroundColor: colors.bg}]}>
            <TouchableOpacity onPress={onBack} style={s.backBtn} activeOpacity={0.75}>
              <ArrowRight size={22} color={colors.textPrimary} />
            </TouchableOpacity>
            <View style={s.headerText}>
              <Text style={[s.headerTitle, {color: colors.textPrimary}]}>البايكرز</Text>
              <Text style={[s.headerSub, {color: colors.textSecondary}]}>
                {activeCount} نشطين - {bikers.length}
              </Text>
            </View>
            <TouchableOpacity
              style={[s.addBtn, {backgroundColor: colors.primary}]}
              onPress={() => setShowAdd(true)}
              activeOpacity={0.85}>
              <Plus size={20} color="#FFF" />
            </TouchableOpacity>
          </View>

          {branches.length > 1 && (
            <View style={s.filterRow}>
              <SelectField
                options={branchOptions}
                value={activeBranch}
                onChange={handleSelectBranch}
              />
            </View>
          )}

          {loading
            ? <View style={s.center}><ActivityIndicator size="large" color={colors.primary} /></View>
            : (
          <FlatList
            data={bikers}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            contentContainerStyle={s.list}
            showsVerticalScrollIndicator={false}
          />
            )
          }

        </View>
      </View>

      {detailBiker && (
        <View style={s.flex}>
          <BikerDetailsScreen
            biker={detailBiker}
            onBack={() => setDetailBiker(null)}
            onOpenActions={() => setSheetBiker(detailBiker)}
          />
          <StopSheet
            visible={!!sheetBiker}
            biker={sheetBiker}
            onClose={() => setSheetBiker(null)}
            onAction={(action, b) => { handleAction(action, b); setDetailBiker(null); }}
            colors={colors}
          />
        </View>
      )}
      {showAdd && (
        <View style={s.flex}>
          <AddBikerScreen onBack={() => setShowAdd(false)} onSaved={fetchBikers} />
        </View>
      )}
      {editingBiker && (
        <View style={s.flex}>
          <AddBikerScreen initialData={editingBiker} onBack={() => setEditingBiker(null)} onSaved={fetchBikers} />
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
  center:      {flex: 1, alignItems: 'center', justifyContent: 'center'},
  header:      {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16},
  backBtn:     {width: 36, height: 36, alignItems: 'center', justifyContent: 'center'},
  addBtn:      {width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center'},
  headerText:  {flex: 1, gap: 2, paddingHorizontal: 8},
  headerTitle: {fontSize: 26, fontWeight: '900'},
  headerSub:   {fontSize: 13},

  filterRow:   {paddingHorizontal: 16, paddingTop: 4, paddingBottom: 8},

  list:        {paddingHorizontal: 16, paddingTop: 12, paddingBottom: 32, gap: 12},

  card:        {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               12,
    borderRadius:      20,
    paddingVertical:   14,
    paddingHorizontal: 16,
    elevation:         2,
    shadowColor:       '#000',
    shadowOpacity:     0.05,
    shadowRadius:      10,
    shadowOffset:      {width: 0, height: 2},
  },

  phoneBtn:    {width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center'},
  info:        {flex: 1, alignItems: 'center', gap: 4},
  name:        {fontSize: 16, fontWeight: '800'},
  statsRow:    {flexDirection: 'row', alignItems: 'center', gap: 4},
  statTxt:     {fontSize: 12, fontWeight: '500'},
  badge:       {flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10},
  badgeDot:    {width: 6, height: 6, borderRadius: 3},
  badgeTxt:    {fontSize: 11, fontWeight: '700'},
});
