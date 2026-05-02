import React, {useCallback, useState} from 'react';
import {FlatList, Modal, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View} from 'react-native';
import {Bike} from 'lucide-react-native';
import {useTheme} from '../../../shared/context/ThemeContext';

const MOCK_BIKERS = [
  {id: 'b1', name: 'خالد العتيبي', distance: '0.01 mm', rating: 4.8, isOnDuty: true},
  {id: 'b2', name: 'خالد العتيبي', distance: '0.01 mm', rating: 4.8, isOnDuty: true},
  {id: 'b3', name: 'خالد العتيبي', distance: '252 km',  rating: 4.8, isOnDuty: true},
];

const FILTERS = [
  {key: 'nearest', label: 'الأقرب مسافة'},
  {key: 'rated',   label: 'الأعلى تقييماً'},
];

function BikerRow({item, selected, onPress, colors}) {
  return (
    <TouchableOpacity
      style={[s.row, {borderColor: colors.border}]}
      onPress={() => onPress(item)}
      activeOpacity={0.75}>
      <View style={[s.radio, {borderColor: selected ? colors.primary : colors.border}]}>
        {selected && <View style={[s.radioDot, {backgroundColor: colors.primary}]} />}
      </View>
      <View style={s.rowInfo}>
        <Text style={[s.rowName, {color: colors.textPrimary}]}>{item.name}</Text>
        <View style={s.rowMeta}>
          <Text style={[s.rowMetaText, {color: colors.textSecondary}]}>📍 {item.distance}</Text>
          <Text style={[s.rowMetaText, {color: colors.textSecondary}]}>⭐ {item.rating}</Text>
        </View>
      </View>
      <View style={[s.avatar, {backgroundColor: colors.primary + '15'}]}>
        <Text style={[s.avatarText, {color: colors.primary}]}>{item.name.charAt(0)}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function AssignBikerScreen({visible, onClose, onAssigned}) {
  const {colors} = useTheme();
  const [selected, setSelected]     = useState(null);
  const [activeFilter, setFilter]   = useState('nearest');
  const [loading, setLoading]       = useState(false);

  const handleConfirm = useCallback(() => {
    if (!selected) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSelected(null);
      onAssigned(selected);
    }, 800);
  }, [selected, onAssigned]);

  const renderItem = useCallback(({item}) => (
    <BikerRow item={item} selected={selected?.id === item.id} onPress={setSelected} colors={colors} />
  ), [selected, colors]);

  const keyExtractor = useCallback(item => item.id, []);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={s.overlay} />
      </TouchableWithoutFeedback>

      <View style={[s.sheet, {backgroundColor: colors.card}]}>
        <View style={[s.handle, {backgroundColor: colors.border}]} />

        <View style={s.sheetHeader}>
          <View style={s.sheetTitleRow}>
            <View style={[s.availableBadge, {backgroundColor: '#22C55E18'}]}>
              <Text style={[s.availableText, {color: '#22C55E'}]}>• {MOCK_BIKERS.length} متاحين</Text>
            </View>
            <Text style={[s.sheetTitle, {color: colors.textPrimary}]}>توكيل بايكر</Text>
          </View>
          <Text style={[s.sheetSub, {color: colors.textSecondary}]}>
            سيظهر هنا قائمة بالبايكرز الموجودين بالخدمة حالياً فقط.
          </Text>
          <View style={s.filters}>
            {FILTERS.map(f => (
              <TouchableOpacity
                key={f.key}
                style={[s.filterChip, {
                  backgroundColor: activeFilter === f.key ? colors.primary : colors.bg,
                  borderColor:     activeFilter === f.key ? colors.primary : colors.border,
                }]}
                onPress={() => setFilter(f.key)}
                activeOpacity={0.75}>
                <Text style={[s.filterText, {color: activeFilter === f.key ? '#fff' : colors.textSecondary}]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <FlatList
          data={MOCK_BIKERS}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          style={s.list}
          contentContainerStyle={s.listContent}
          showsVerticalScrollIndicator={false}
        />

        <View style={s.footer}>
          <TouchableOpacity
            style={[s.confirmBtn, {backgroundColor: selected && !loading ? colors.primary : colors.border}]}
            onPress={handleConfirm}
            disabled={!selected || loading}
            activeOpacity={0.8}>
            <Bike size={20} color="#FFF" />
            <Text style={s.confirmText}>{loading ? 'جاري الإرسال...' : 'ارسال البايكر'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay:       {flex: 1, backgroundColor: 'rgba(0,0,0,0.4)'},
  sheet:         {borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 12, maxHeight: '80%'},
  handle:        {width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 16},
  sheetHeader:   {paddingHorizontal: 20, gap: 8, marginBottom: 4},
  sheetTitleRow: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'},
  sheetTitle:    {fontSize: 18, fontWeight: '800'},
  availableBadge:{paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20},
  availableText: {fontSize: 12, fontWeight: '700'},
  sheetSub:      {fontSize: 12},
  filters:       {flexDirection: 'row', gap: 8, marginTop: 4},
  filterChip:    {paddingHorizontal: 14, paddingVertical: 7, borderRadius: 50, borderWidth: 1},
  filterText:    {fontSize: 13, fontWeight: '600'},
  list:          {maxHeight: 300},
  listContent:   {paddingHorizontal: 16, paddingTop: 8, gap: 2},
  row:           {flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, borderBottomWidth: 1},
  radio:         {width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center'},
  radioDot:      {width: 10, height: 10, borderRadius: 5},
  rowInfo:       {flex: 1, gap: 4},
  rowName:       {fontSize: 15, fontWeight: '700'},
  rowMeta:       {flexDirection: 'row', gap: 12},
  rowMetaText:   {fontSize: 12},
  avatar:        {width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center'},
  avatarText:    {fontSize: 18, fontWeight: '800'},
  footer:        {padding: 16, paddingBottom: 32},
  confirmBtn:    {flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16, borderRadius: 16},
  confirmText:   {color: '#FFF', fontSize: 16, fontWeight: '800'},
});
