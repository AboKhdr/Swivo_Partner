import React, {useCallback, useState} from 'react';
import {
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
import AddBikerScreen from './AddBikerScreen';

const MOCK_BIKERS = [
  {id: 'b1', name: 'خالد العتيبي',     phone: '0501111111', trips: 25, rating: 4.8, isOnDuty: true},
  {id: 'b2', name: 'محمد الشمري',      phone: '0502222222', trips: 18, rating: 4.6, isOnDuty: true},
  {id: 'b3', name: 'عبدالرحمن السعدي', phone: '0503333333', trips: 40, rating: 4.9, isOnDuty: false},
  {id: 'b4', name: 'فيصل القحطاني',    phone: '0504444444', trips: 12, rating: 4.3, isOnDuty: false},
];

const STOP_OPTIONS = [
  {key: 'suspend',  label: 'إيقاف مؤقت',   sub: 'إيقاف البايكر مؤقتاً عن استقبال الطلبات', Icon: PauseCircle, color: '#F59E0B'},
  {key: 'deactive', label: 'تعطيل الحساب', sub: 'تعطيل الحساب ولن يتمكن من الدخول',         Icon: UserX,       color: '#EF4444'},
  {key: 'delete',   label: 'حذف البايكر',  sub: 'حذف نهائي ولا يمكن التراجع',               Icon: Trash2,      color: '#EF4444'},
];

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
              <Text style={[ss.bikerName, {color: colors.textPrimary}]}>{biker.name}</Text>
              <Text style={[ss.bikerSub,  {color: colors.textSecondary}]}>{biker.trips} رحلة</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={ss.closeBtn}>
              <X size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={[ss.divider, {backgroundColor: colors.border}]} />

          {STOP_OPTIONS.map((opt, i) => (
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
              {i < STOP_OPTIONS.length - 1 && (
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

function BikerCard({item, colors, onOptions}) {
  return (
    <TouchableOpacity
      style={[s.card, {backgroundColor: colors.card}]}
      onPress={() => onOptions(item)}
      activeOpacity={0.85}>
      <View style={[s.phoneBtn, {backgroundColor: colors.bg}]}>
        <Phone size={18} color={colors.textSecondary} />
      </View>
      <View style={s.info}>
        <Text style={[s.name, {color: colors.textPrimary}]}>{item.name}</Text>
        <View style={s.statsRow}>
          <Bike size={14} color="#F59E0B" />
          <Text style={[s.statTxt, {color: colors.textSecondary}]}>{item.trips} Trips</Text>
          <Star size={13} color="#F59E0B" fill="#F59E0B" />
          <Text style={[s.statTxt, {color: colors.textSecondary}]}>{item.rating}</Text>
        </View>
      </View>
      <AvatarPlaceholder size={56} colors={colors} />
    </TouchableOpacity>
  );
}

export default function BikersScreen({onBack}) {
  const {colors} = useTheme();
  const [bikers,      setBikers]      = useState(MOCK_BIKERS);
  const [sheetBiker,  setSheetBiker]  = useState(null);
  const [showAdd,     setShowAdd]     = useState(false);
  const [editingBiker,setEditingBiker]= useState(null);

  const handleOptions = useCallback(item => setSheetBiker(item), []);

  const handleAction = useCallback((action, biker) => {
    if (action === 'delete') {
      setBikers(prev => prev.filter(b => b.id !== biker.id));
    } else {
      setBikers(prev => prev.map(b =>
        b.id === biker.id ? {...b, isOnDuty: false} : b,
      ));
    }
  }, []);

  const renderItem = useCallback(({item}) => (
    <BikerCard item={item} colors={colors} onOptions={handleOptions} />
  ), [colors, handleOptions]);

  const keyExtractor = useCallback(item => item.id, []);

  const activeCount = bikers.filter(b => b.isOnDuty).length;
  const showList = !showAdd && !editingBiker;

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
                {activeCount} نشطين - {bikers.length} انواع
              </Text>
            </View>
            <TouchableOpacity
              style={[s.addBtn, {backgroundColor: colors.primary}]}
              onPress={() => setShowAdd(true)}
              activeOpacity={0.85}>
              <Plus size={20} color="#FFF" />
            </TouchableOpacity>
          </View>

          <FlatList
            data={bikers}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            contentContainerStyle={s.list}
            showsVerticalScrollIndicator={false}
          />

          <StopSheet
            visible={!!sheetBiker}
            biker={sheetBiker}
            onClose={() => setSheetBiker(null)}
            onAction={handleAction}
            colors={colors}
          />
        </View>
      </View>

      <View style={[s.flex, showAdd ? s.visible : s.hidden]}>
        <AddBikerScreen onBack={() => setShowAdd(false)} />
      </View>

      <View style={[s.flex, editingBiker ? s.visible : s.hidden]}>
        <AddBikerScreen initialData={editingBiker} onBack={() => setEditingBiker(null)} />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  flex:        {flex: 1},
  visible:     {},
  hidden:      {display: 'none'},
  root:        {flex: 1},
  header:      {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16},
  backBtn:     {width: 36, height: 36, alignItems: 'center', justifyContent: 'center'},
  addBtn:      {width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center'},
  headerText:  {flex: 1, gap: 2, paddingHorizontal: 8},
  headerTitle: {fontSize: 26, fontWeight: '900'},
  headerSub:   {fontSize: 13},

  list:        {paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32, gap: 12},

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
});
