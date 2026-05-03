import React, {useState, useCallback} from 'react';
import {FlatList, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {ArrowRight, Pencil, Car, Plus} from 'lucide-react-native';
import {useTheme} from '../../../shared/context/ThemeContext';
import {useI18n} from '../../../shared/i18n/I18nContext';
import AddServiceScreen from './AddServiceScreen';

const MOCK_SERVICES = [
  {id: 's1', nameAr: 'غسلة سريعة',  category: 'غسيل',  type: 'inWash', prices: {S: 120, M: 140, L: 220}},
  {id: 's2', nameAr: 'غسلة متقدمة', category: 'تلميع', type: 'both',   prices: {S: 150, M: 180, L: 300}},
  {id: 's3', nameAr: 'غسيل داخلي',  category: 'تعقيم', type: 'mobile', prices: {S: 100, M: 130, L: 200}},
];

function ServiceCard({item, colors, t, onEdit}) {
  return (
    <View style={[s.card, {backgroundColor: colors.card}]}>
      <View style={s.cardHeader}>
        <View style={[s.carIcon, {backgroundColor: colors.primary + '15'}]}>
          <Car size={20} color={colors.primary} />
        </View>
        <Text style={[s.cardName, {color: colors.textPrimary}]}>{item.nameAr}</Text>
        <TouchableOpacity style={s.editBtn} onPress={() => onEdit(item)} activeOpacity={0.75}>
          <Pencil size={15} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={s.pricesRow}>
        {['L', 'M', 'S'].map(size => (
          <View key={size} style={[s.priceBox, {backgroundColor: colors.bg}]}>
            <Text style={[s.priceVal, {color: colors.primary}]}>
              ﷼ {item.prices[size]}
            </Text>
            <Text style={[s.priceLbl, {color: colors.textSecondary}]}>
              {t(`partner.services.${size === 'S' ? 'small' : size === 'M' ? 'medium' : 'large'}`)}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export default function ServicesScreen({onBack}) {
  const {colors} = useTheme();
  const {t} = useI18n();
  const [editingService, setEditingService] = useState(null);
  const [showAdd, setShowAdd] = useState(false);

  const handleEdit = useCallback(item => setEditingService(item), []);

  const renderItem = useCallback(({item}) => (
    <ServiceCard item={item} colors={colors} t={t} onEdit={handleEdit} />
  ), [colors, t, handleEdit]);

  const keyExtractor = useCallback(item => item.id, []);

  const showList = !showAdd && !editingService;

  return (
    <View style={s.flex}>
      <View style={[s.flex, showList ? null : s.hidden]}>
        <View style={[s.root, {backgroundColor: colors.bg}]}>
          <View style={[s.header, {backgroundColor: colors.bg}]}>
            <TouchableOpacity onPress={onBack} style={s.backBtn} activeOpacity={0.75}>
              <ArrowRight size={22} color={colors.textPrimary} />
            </TouchableOpacity>
            <View style={s.headerText}>
              <Text style={[s.headerTitle, {color: colors.textPrimary}]}>{t('partner.services.title')}</Text>
              <Text style={[s.headerSub, {color: colors.textSecondary}]}>
                {MOCK_SERVICES.length} {t('partner.operations.menu.servicesSub')}
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
            data={MOCK_SERVICES}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            contentContainerStyle={s.list}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </View>

      {showAdd && (
        <View style={s.flex}>
          <AddServiceScreen onBack={() => setShowAdd(false)} />
        </View>
      )}
      {editingService && (
        <View style={s.flex}>
          <AddServiceScreen initialData={editingService} onBack={() => setEditingService(null)} />
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  flex:        {flex: 1},
  hidden:      {display: 'none'},
  root:        {flex: 1},
  header:      {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16},
  backBtn:     {width: 36, height: 36, alignItems: 'center', justifyContent: 'center'},
  addBtn:      {width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center'},
  headerText:  {flex: 1, gap: 2, paddingHorizontal: 8},
  headerTitle: {fontSize: 26, fontWeight: '900'},
  headerSub:   {fontSize: 13},

  list:        {paddingHorizontal: 16, paddingBottom: 32, gap: 14},

  card:        {
    borderRadius: 20,
    padding:      16,
    gap:          14,
    elevation:    2,
    shadowColor:  '#000',
    shadowOpacity: 0.05,
    shadowRadius:  10,
    shadowOffset:  {width: 0, height: 2},
  },

  cardHeader:  {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  carIcon:     {width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center'},
  cardName:    {flex: 1, fontSize: 17, fontWeight: '800'},
  editBtn:     {width: 36, height: 36, alignItems: 'center', justifyContent: 'center'},

  pricesRow:   {flexDirection: 'row', gap: 8},
  priceBox:    {flex: 1, borderRadius: 14, paddingVertical: 12, alignItems: 'center', gap: 4},
  priceVal:    {fontSize: 15, fontWeight: '800'},
  priceLbl:    {fontSize: 11},
});
