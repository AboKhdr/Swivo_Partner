import React, {useCallback, useState} from 'react';
import {FlatList, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {Plus, Pencil, ToggleLeft, ToggleRight} from 'lucide-react-native';
import {useTheme} from '../../../shared/context/ThemeContext';

const MOCK_SERVICES = [
  {id: 's1', nameAr: 'غسيل خارجي',    nameEn: 'Exterior Wash',  category: 'غسيل',   prices: {S: 60,  M: 80,  L: 100}, active: true},
  {id: 's2', nameAr: 'غسيل كامل',     nameEn: 'Full Wash',      category: 'غسيل',   prices: {S: 120, M: 150, L: 180}, active: true},
  {id: 's3', nameAr: 'غسيل داخلي',    nameEn: 'Interior Wash',  category: 'غسيل',   prices: {S: 100, M: 120, L: 140}, active: true},
  {id: 's4', nameAr: 'تلميع',          nameEn: 'Polishing',      category: 'تلميع',  prices: {S: 180, M: 220, L: 260}, active: false},
  {id: 's5', nameAr: 'تعقيم',          nameEn: 'Sanitizing',     category: 'إضافية', prices: {S: 50,  M: 60,  L: 70},  active: true},
];

function ServiceCard({item, colors, onToggle, onEdit}) {
  return (
    <View style={[s.card, {backgroundColor: colors.card, borderColor: colors.border}]}>
      <View style={s.cardHeader}>
        <View style={s.cardTitles}>
          <Text style={[s.nameAr, {color: colors.textPrimary}]}>{item.nameAr}</Text>
          <Text style={[s.nameEn, {color: colors.textSecondary}]}>{item.nameEn}</Text>
        </View>
        <View style={s.cardActions}>
          <TouchableOpacity onPress={() => onEdit(item)} style={s.iconBtn}>
            <Pencil size={16} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onToggle(item)} style={s.iconBtn}>
            {item.active
              ? <ToggleRight size={24} color={colors.success} />
              : <ToggleLeft  size={24} color={colors.textSecondary} />
            }
          </TouchableOpacity>
        </View>
      </View>

      <View style={[s.divider, {backgroundColor: colors.border}]} />

      <View style={s.prices}>
        {['S', 'M', 'L'].map(size => (
          <View key={size} style={[s.priceChip, {backgroundColor: colors.bg, borderColor: colors.border}]}>
            <Text style={[s.priceSize, {color: colors.textSecondary}]}>{size}</Text>
            <Text style={[s.priceVal, {color: colors.primary}]}>{item.prices[size]}</Text>
          </View>
        ))}
        <View style={[s.categoryChip, {backgroundColor: colors.purple + '18'}]}>
          <Text style={[s.categoryText, {color: colors.purple}]}>{item.category}</Text>
        </View>
      </View>
    </View>
  );
}

export default function ServicesScreen() {
  const {colors} = useTheme();
  const [services, setServices] = useState(MOCK_SERVICES);

  const handleToggle = useCallback((item) => {
    setServices(prev => prev.map(s => s.id === item.id ? {...s, active: !s.active} : s));
  }, []);

  const handleEdit = useCallback(() => {}, []);

  const renderItem = useCallback(({item}) => (
    <ServiceCard item={item} colors={colors} onToggle={handleToggle} onEdit={handleEdit} />
  ), [colors, handleToggle, handleEdit]);

  const keyExtractor = useCallback(item => item.id, []);

  return (
    <View style={[s.root, {backgroundColor: colors.bg}]}>
      <View style={[s.header, {backgroundColor: colors.card, borderBottomColor: colors.border}]}>
        <Text style={[s.headerTitle, {color: colors.textPrimary}]}>الخدمات</Text>
        <TouchableOpacity style={[s.addBtn, {backgroundColor: colors.primary}]}>
          <Plus size={18} color="#FFF" />
          <Text style={s.addBtnText}>إضافة</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={services}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={s.list}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root:         {flex: 1},
  header:       {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16, borderBottomWidth: 1},
  headerTitle:  {fontSize: 22, fontWeight: '800'},
  addBtn:       {flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12},
  addBtnText:   {color: '#FFF', fontSize: 13, fontWeight: '700'},
  list:         {padding: 16, gap: 12},
  card:         {borderRadius: 16, borderWidth: 1, padding: 16, gap: 10},
  cardHeader:   {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start'},
  cardTitles:   {gap: 2, flex: 1},
  nameAr:       {fontSize: 15, fontWeight: '700'},
  nameEn:       {fontSize: 12},
  cardActions:  {flexDirection: 'row', gap: 4},
  iconBtn:      {width: 36, height: 36, alignItems: 'center', justifyContent: 'center'},
  divider:      {height: 1},
  prices:       {flexDirection: 'row', gap: 8, flexWrap: 'wrap'},
  priceChip:    {flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderWidth: 1},
  priceSize:    {fontSize: 11, fontWeight: '600'},
  priceVal:     {fontSize: 13, fontWeight: '700'},
  categoryChip: {paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10},
  categoryText: {fontSize: 11, fontWeight: '600'},
});
