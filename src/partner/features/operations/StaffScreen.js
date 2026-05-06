import React, {useCallback, useEffect, useState} from 'react';
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
import {ArrowRight, Plus, Bike, Star, Phone, UserX, PauseCircle, Trash2, X} from 'lucide-react-native';
import {useTheme} from '../../../shared/context/ThemeContext';
import {useI18n} from '../../../shared/i18n/I18nContext';
import {getStaff, setStaffStatus, removeStaff} from '../../../services/partner';

function buildStopOptions(t) {
  return [
    {key: 'suspend',  label: t('partner.bikers.actions.suspend'),    sub: t('partner.bikers.actions.suspendSub'),    Icon: PauseCircle, color: '#F59E0B'},
    {key: 'deactive', label: t('partner.bikers.actions.deactivate'), sub: t('partner.bikers.actions.deactivateSub'), Icon: UserX,       color: '#EF4444'},
    {key: 'delete',   label: t('partner.bikers.actions.delete'),     sub: t('partner.bikers.actions.deleteSub'),     Icon: Trash2,      color: '#EF4444'},
  ];
}

function AvatarPlaceholder({size, colors}) {
  return (
    <View style={[ap.wrap, {width: size, height: size, borderRadius: size / 2, backgroundColor: colors.primary + '15'}]}>
      <View style={[ap.head, {backgroundColor: colors.primary + '40', width: size * 0.38, height: size * 0.38, borderRadius: size * 0.19}]} />
      <View style={[ap.body, {backgroundColor: colors.primary + '40', width: size * 0.58, height: size * 0.3, borderRadius: size * 0.08}]} />
    </View>
  );
}

const ap = StyleSheet.create({
  wrap: {alignItems: 'center', justifyContent: 'flex-end', overflow: 'hidden', paddingBottom: 0},
  head: {marginBottom: 2},
  body: {},
});

function StopSheet({visible, biker, onClose, onAction, colors, t}) {
  if (!biker) return null;
  const stopOptions = buildStopOptions(t);
  const memberName = biker.userId
    ? `${biker.userId.firstName ?? ''} ${biker.userId.lastName ?? ''}`.trim()
    : biker.name ?? '';
  const trips = biker.activeOrdersCount ?? biker.trips ?? 0;
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
              <Text style={[ss.bikerName, {color: colors.textPrimary}]}>{memberName}</Text>
              <Text style={[ss.bikerSub,  {color: colors.textSecondary}]}>{trips} {t('partner.bikers.trips')}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={ss.closeBtn}>
              <X size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={[ss.divider, {backgroundColor: colors.border}]} />

          {stopOptions.map((opt, i) => (
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
              {i < stopOptions.length - 1 && (
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

function BikerCard({item, colors, tripsLabel, onOptions}) {
  const name   = item.userId
    ? `${item.userId.firstName ?? ''} ${item.userId.lastName ?? ''}`.trim()
    : item.name ?? '';
  const phone  = item.userId?.phoneNumber ?? item.phone ?? '';
  const trips  = item.activeOrdersCount ?? item.trips ?? 0;
  const rating = item.rating ?? 0;

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
          <Text style={[s.statTxt, {color: colors.textSecondary}]}>{trips} {tripsLabel}</Text>
          {rating > 0 && (
            <>
              <Star size={13} color="#F59E0B" fill="#F59E0B" />
              <Text style={[s.statTxt, {color: colors.textSecondary}]}>{rating}</Text>
            </>
          )}
        </View>
      </View>

      <AvatarPlaceholder size={56} colors={colors} />
    </TouchableOpacity>
  );
}

export default function StaffScreen({onBack}) {
  const {colors} = useTheme();
  const {t} = useI18n();
  const [activeTab,  setActiveTab]  = useState('bikers');
  const [bikers,     setBikers]     = useState([]);
  const [managers,   setManagers]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [sheetBiker, setSheetBiker] = useState(null);

  const tabs = [
    {key: 'bikers',   label: t('partner.staff.bikers')},
    {key: 'managers', label: t('partner.staff.managers')},
  ];

  const fetchStaff = useCallback(async () => {
    setLoading(true);
    const [bikersRes, managersRes] = await Promise.all([
      getStaff({role: 'BIKER',    limit: 100}),
      getStaff({role: 'MANAGER',  limit: 100}),
    ]);
    if (bikersRes.success)   setBikers(bikersRes.data?.data     ?? bikersRes.data   ?? []);
    if (managersRes.success) setManagers(managersRes.data?.data ?? managersRes.data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchStaff(); }, [fetchStaff]);

  const currentList = activeTab === 'bikers' ? bikers : managers;
  const setCurrentList = activeTab === 'bikers' ? setBikers : setManagers;

  const handleOptions = useCallback(item => setSheetBiker(item), []);

  const handleAction = useCallback(async (action, member) => {
    const id = member._id ?? member.id;
    if (action === 'delete') {
      await removeStaff(id);
      setCurrentList(prev => prev.filter(b => (b._id ?? b.id) !== id));
    } else if (action === 'suspend') {
      await setStaffStatus(id, 'suspended');
      setCurrentList(prev => prev.map(b =>
        (b._id ?? b.id) === id ? {...b, isOnDuty: false, status: 'suspended'} : b,
      ));
    } else if (action === 'deactive') {
      await setStaffStatus(id, 'deactivated');
      setCurrentList(prev => prev.map(b =>
        (b._id ?? b.id) === id ? {...b, isOnDuty: false, status: 'deactivated'} : b,
      ));
    }
  }, [setCurrentList]);

  const tripsLabel = t('partner.bikers.trips');
  const renderItem = useCallback(({item}) => (
    <BikerCard item={item} colors={colors} tripsLabel={tripsLabel} onOptions={handleOptions} />
  ), [colors, tripsLabel, handleOptions]);

  const keyExtractor = useCallback(item => item._id ?? item.id, []);

  const totalActive = currentList.filter(st => st.isOnDuty).length;
  const tabLabel    = activeTab === 'bikers' ? t('partner.staff.bikers') : t('partner.staff.managers');

  return (
    <View style={[s.root, {backgroundColor: colors.bg}]}>
      <View style={[s.header, {backgroundColor: colors.bg}]}>
        <TouchableOpacity onPress={onBack} style={s.backBtn} activeOpacity={0.75}>
          <ArrowRight size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={s.headerText}>
          <Text style={[s.headerTitle, {color: colors.textPrimary}]}>{tabLabel}</Text>
          <Text style={[s.headerSub, {color: colors.textSecondary}]}>
            {totalActive} {t('partner.operations.menu.bikersSub').split(' - ')[0].replace(/\d+ /, '')} - {currentList.length}
          </Text>
        </View>
        <TouchableOpacity style={[s.addBtn, {backgroundColor: colors.primary}]} activeOpacity={0.85}>
          <Plus size={20} color="#FFF" />
        </TouchableOpacity>
      </View>

      <View style={[s.tabs, {borderBottomColor: colors.border}]}>
        {tabs.map(tab => {
          const count = tab.key === 'bikers' ? bikers.length : managers.length;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[s.tab, activeTab === tab.key && {borderBottomColor: colors.primary, borderBottomWidth: 2}]}
              onPress={() => setActiveTab(tab.key)}>
              <Text style={[s.tabTxt, {color: activeTab === tab.key ? colors.primary : colors.textSecondary}]}>
                {tab.label}
              </Text>
              <View style={[s.tabBadge, {backgroundColor: activeTab === tab.key ? colors.primary + '18' : colors.card}]}>
                <Text style={[s.tabBadgeTxt, {color: activeTab === tab.key ? colors.primary : colors.textSecondary}]}>
                  {count}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {loading
        ? <View style={s.center}><ActivityIndicator size="large" color={colors.primary} /></View>
        : (
      <FlatList
        data={currentList}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={s.list}
        showsVerticalScrollIndicator={false}
      />
        )
      }

      <StopSheet
        visible={!!sheetBiker}
        biker={sheetBiker}
        onClose={() => setSheetBiker(null)}
        onAction={handleAction}
        colors={colors}
        t={t}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root:        {flex: 1},
  center:      {flex: 1, alignItems: 'center', justifyContent: 'center'},
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

  list:        {paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32, gap: 12},

  card:        {
    flexDirection:  'row',
    alignItems:     'center',
    gap:            12,
    borderRadius:   20,
    paddingVertical:   14,
    paddingHorizontal: 16,
    elevation:      2,
    shadowColor:    '#000',
    shadowOpacity:  0.05,
    shadowRadius:   10,
    shadowOffset:   {width: 0, height: 2},
  },

  phoneBtn:    {width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center'},
  info:        {flex: 1, gap: 4, alignItems: 'center'},
  name:        {fontSize: 16, fontWeight: '800'},
  statsRow:    {flexDirection: 'row', alignItems: 'center', gap: 4},
  statTxt:     {fontSize: 12, fontWeight: '500'},
});
