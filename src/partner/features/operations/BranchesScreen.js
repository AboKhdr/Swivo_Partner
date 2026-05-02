import React, {useCallback, useState} from 'react';
import {FlatList, ScrollView, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {Plus, Pencil, MapPin, Clock} from 'lucide-react-native';
import {useTheme} from '../../../shared/context/ThemeContext';

const DAYS = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

const MOCK_BRANCHES = [
  {
    id: 'br1',
    nameAr: 'الفرع الرئيسي',
    nameEn: 'Main Branch',
    address: 'الرياض، حي النخيل، شارع الأمير محمد',
    slotDuration: 30,
    bufferTime: 10,
    workingHours: {
      0: {open: '08:00', close: '22:00', closed: false},
      1: {open: '08:00', close: '22:00', closed: false},
      2: {open: '08:00', close: '22:00', closed: false},
      3: {open: '08:00', close: '22:00', closed: false},
      4: {open: '08:00', close: '22:00', closed: false},
      5: {open: '10:00', close: '20:00', closed: false},
      6: {open: '08:00', close: '22:00', closed: false},
    },
  },
  {
    id: 'br2',
    nameAr: 'فرع العليا',
    nameEn: 'Olaya Branch',
    address: 'الرياض، حي العليا، طريق الملك فهد',
    slotDuration: 45,
    bufferTime: 15,
    workingHours: {
      0: {open: '09:00', close: '21:00', closed: false},
      1: {open: '09:00', close: '21:00', closed: false},
      2: {open: '09:00', close: '21:00', closed: false},
      3: {open: '09:00', close: '21:00', closed: false},
      4: {open: '09:00', close: '21:00', closed: false},
      5: {open: '00:00', close: '00:00', closed: true},
      6: {open: '09:00', close: '21:00', closed: false},
    },
  },
];

function BranchCard({item, colors, onEdit}) {
  const openDays = Object.values(item.workingHours).filter(d => !d.closed).length;
  return (
    <View style={[s.card, {backgroundColor: colors.card, borderColor: colors.border}]}>
      <View style={s.cardHeader}>
        <View style={[s.branchIcon, {backgroundColor: colors.primary + '18'}]}>
          <MapPin size={18} color={colors.primary} />
        </View>
        <View style={s.cardTitles}>
          <Text style={[s.nameAr, {color: colors.textPrimary}]}>{item.nameAr}</Text>
          <Text style={[s.nameEn, {color: colors.textSecondary}]}>{item.nameEn}</Text>
        </View>
        <TouchableOpacity onPress={() => onEdit(item)} style={s.editBtn}>
          <Pencil size={16} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <Text style={[s.address, {color: colors.textSecondary}]}>{item.address}</Text>

      <View style={[s.divider, {backgroundColor: colors.border}]} />

      <View style={s.metaRow}>
        <View style={s.metaItem}>
          <Clock size={14} color={colors.textSecondary} />
          <Text style={[s.metaText, {color: colors.textSecondary}]}>مدة الموعد: {item.slotDuration} دقيقة</Text>
        </View>
        <Text style={[s.metaText, {color: colors.textSecondary}]}>فاصل: {item.bufferTime} دقيقة</Text>
      </View>

      <View style={s.daysRow}>
        {DAYS.map((day, i) => {
          const wh = item.workingHours[i];
          return (
            <View
              key={day}
              style={[s.dayChip, {backgroundColor: wh.closed ? colors.bg : colors.primary + '18', borderColor: wh.closed ? colors.border : colors.primary + '40'}]}>
              <Text style={[s.dayText, {color: wh.closed ? colors.textSecondary : colors.primary}]}>
                {day.slice(0, 3)}
              </Text>
            </View>
          );
        })}
      </View>

      <Text style={[s.openDays, {color: colors.textSecondary}]}>{openDays} أيام عمل في الأسبوع</Text>
    </View>
  );
}

export default function BranchesScreen() {
  const {colors} = useTheme();
  const handleEdit = useCallback(() => {}, []);

  const renderItem = useCallback(({item}) => (
    <BranchCard item={item} colors={colors} onEdit={handleEdit} />
  ), [colors, handleEdit]);

  const keyExtractor = useCallback(item => item.id, []);

  return (
    <View style={[s.root, {backgroundColor: colors.bg}]}>
      <View style={[s.header, {backgroundColor: colors.card, borderBottomColor: colors.border}]}>
        <Text style={[s.headerTitle, {color: colors.textPrimary}]}>الفروع</Text>
        <TouchableOpacity style={[s.addBtn, {backgroundColor: colors.primary}]}>
          <Plus size={18} color="#FFF" />
          <Text style={s.addBtnText}>إضافة</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={MOCK_BRANCHES}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={s.list}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root:        {flex: 1},
  header:      {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16, borderBottomWidth: 1},
  headerTitle: {fontSize: 22, fontWeight: '800'},
  addBtn:      {flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12},
  addBtnText:  {color: '#FFF', fontSize: 13, fontWeight: '700'},
  list:        {padding: 16, gap: 12},
  card:        {borderRadius: 16, borderWidth: 1, padding: 16, gap: 10},
  cardHeader:  {flexDirection: 'row', alignItems: 'center', gap: 10},
  branchIcon:  {width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center'},
  cardTitles:  {flex: 1, gap: 2},
  nameAr:      {fontSize: 15, fontWeight: '700'},
  nameEn:      {fontSize: 12},
  editBtn:     {width: 36, height: 36, alignItems: 'center', justifyContent: 'center'},
  address:     {fontSize: 12, lineHeight: 18},
  divider:     {height: 1},
  metaRow:     {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'},
  metaItem:    {flexDirection: 'row', alignItems: 'center', gap: 4},
  metaText:    {fontSize: 12},
  daysRow:     {flexDirection: 'row', gap: 4, flexWrap: 'wrap'},
  dayChip:     {paddingHorizontal: 8, paddingVertical: 5, borderRadius: 8, borderWidth: 1},
  dayText:     {fontSize: 10, fontWeight: '600'},
  openDays:    {fontSize: 11},
});
