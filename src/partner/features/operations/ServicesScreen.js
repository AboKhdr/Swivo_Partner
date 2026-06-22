import React, {useState, useCallback, useEffect} from 'react';
import {ActivityIndicator, FlatList, Image, StyleSheet, Switch, Text, TouchableOpacity, View} from 'react-native';
import {ArrowRight, Pencil, Plus, ChevronDown, ChevronUp} from 'lucide-react-native';
import {useTheme} from '../../../shared/context/ThemeContext';
import {useI18n} from '../../../shared/i18n/I18nContext';
import {getCategoryServices, toggleService} from '../../../services/partner';
import RiyalIcon from '../../../shared/components/RiyalIcon';
import AddServiceScreen from './AddServiceScreen';

function ServiceCard({item, colors, t, onEdit, onToggle}) {
  const nameAr = item.name?.ar ?? item.name?.en ?? '';
  const prices  = item.price ?? {};

  return (
    <View style={[s.card, {backgroundColor: colors.bg, borderColor: colors.border}]}>
      <View style={s.cardHeader}>
        {item.image
          ? <Image source={{uri: item.image}} style={s.svcImg} resizeMode="cover" />
          : <View style={[s.svcImgPlaceholder, {backgroundColor: colors.primary + '15'}]} />
        }
        <Text style={[s.cardName, {color: colors.textPrimary}]}>{nameAr}</Text>
        <Switch
          value={item.isActive ?? true}
          onValueChange={val => onToggle(item._id, val)}
          trackColor={{false: colors.border, true: colors.primary + 'AA'}}
          thumbColor={item.isActive ? colors.primary : '#ccc'}
        />
        <TouchableOpacity style={s.editBtn} onPress={() => onEdit(item)} activeOpacity={0.75}>
          <Pencil size={15} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={s.pricesRow}>
        {['large', 'medium', 'small'].map(size => (
          <View key={size} style={[s.priceBox, {backgroundColor: colors.card}]}>
            {prices[size] != null ? (
              <View style={s.priceRow}>
                <RiyalIcon size={14} color={colors.primary} />
                <Text style={[s.priceVal, {color: colors.primary}]}>{prices[size]}</Text>
              </View>
            ) : (
              <Text style={[s.priceVal, {color: colors.primary}]}>—</Text>
            )}
            <Text style={[s.priceLbl, {color: colors.textSecondary}]}>
              {t(`partner.services.${size}`)}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function CategoryAccordion({category, colors, t, onEdit, onToggle}) {
  const [open, setOpen]   = useState(true);
  const name              = category.name?.ar ?? category.name?.en ?? '';
  const services          = category.services ?? [];
  const categoryId        = category._id ?? category.id;

  return (
    <View style={[s.accordion, {backgroundColor: colors.card, borderColor: colors.border}]}>
      <TouchableOpacity
        style={s.accordionHeader}
        onPress={() => setOpen(v => !v)}
        activeOpacity={0.75}>
        {category.icon
          ? <Image source={{uri: category.icon}} style={s.catIcon} resizeMode="cover" />
          : <View style={[s.catDot, {backgroundColor: colors.primary}]} />
        }
        <Text style={[s.catName, {color: colors.textPrimary}]}>{name}</Text>
        <Text style={[s.catCount, {color: colors.textSecondary}]}>{services.length}</Text>
        {open
          ? <ChevronUp size={18} color={colors.textSecondary} />
          : <ChevronDown size={18} color={colors.textSecondary} />
        }
      </TouchableOpacity>

      {open && (
        <View style={s.accordionBody}>
          {services.length === 0 ? (
            <Text style={[s.emptyTxt, {color: colors.textSecondary}]}>لا توجد خدمات</Text>
          ) : (
            services.map(item => (
              <ServiceCard
                key={item._id}
                item={item}
                colors={colors}
                t={t}
                onEdit={item => onEdit(item, categoryId)}
                onToggle={onToggle}
              />
            ))
          )}
        </View>
      )}
    </View>
  );
}

export default function ServicesScreen({onBack}) {
  const {colors} = useTheme();
  const {t} = useI18n();
  const [grouped,        setGrouped]        = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [editingService, setEditingService] = useState(null);
  const [showAdd,        setShowAdd]        = useState(false);

  const totalServices = grouped.reduce((acc, cat) => acc + (cat.services?.length ?? 0), 0);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const res = await getCategoryServices();
    if (res.success) {
      const list = res.data?.data ?? res.data ?? [];
      setGrouped(Array.isArray(list) ? list : []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleToggle = useCallback(async (id, val) => {
    setGrouped(prev => prev.map(cat => ({
      ...cat,
      services: (cat.services ?? []).map(sv => sv._id === id ? {...sv, isActive: val} : sv),
    })));
    await toggleService(id, val);
  }, []);

  const handleEdit = useCallback((item, categoryId) => setEditingService({...item, categoryId}), []);
  const onSaved    = useCallback(() => { fetchData(); }, [fetchData]);

  const renderCategory = useCallback(({item}) => (
    <CategoryAccordion
      category={item}
      colors={colors}
      t={t}
      onEdit={handleEdit}
      onToggle={handleToggle}
    />
  ), [colors, t, handleEdit, handleToggle]);

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
                {totalServices} {t('partner.operations.menu.servicesSub')}
              </Text>
            </View>
            <TouchableOpacity
              style={[s.addBtn, {backgroundColor: colors.primary}]}
              onPress={() => setShowAdd(true)}
              activeOpacity={0.85}>
              <Plus size={20} color="#FFF" />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={s.center}><ActivityIndicator size="large" color={colors.primary} /></View>
          ) : (
            <FlatList
              data={grouped}
              renderItem={renderCategory}
              keyExtractor={item => item._id ?? item.id}
              contentContainerStyle={s.list}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={s.center}>
                  <Text style={{color: colors.textSecondary, fontSize: 14}}>لا توجد خدمات</Text>
                </View>
              }
            />
          )}
        </View>
      </View>

      {showAdd && (
        <View style={s.flex}>
          <AddServiceScreen categories={grouped} onBack={() => setShowAdd(false)} onSaved={onSaved} />
        </View>
      )}
      {editingService && (
        <View style={s.flex}>
          <AddServiceScreen categories={grouped} initialData={editingService} onBack={() => setEditingService(null)} onSaved={onSaved} />
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  flex:            {flex: 1},
  hidden:          {display: 'none'},
  root:            {flex: 1},
  center:          {flex: 1, alignItems: 'center', justifyContent: 'center'},
  header:          {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16},
  backBtn:         {width: 36, height: 36, alignItems: 'center', justifyContent: 'center'},
  addBtn:          {width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center'},
  headerText:      {flex: 1, gap: 2, paddingHorizontal: 8},
  headerTitle:     {fontSize: 26, fontWeight: '900'},
  headerSub:       {fontSize: 13},
  list:            {paddingHorizontal: 16, paddingBottom: 32, gap: 12},

  accordion:       {borderRadius: 18, borderWidth: 1, overflow: 'hidden'},
  accordionHeader: {flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 14},
  catIcon:         {width: 24, height: 24, borderRadius: 6},
  catDot:          {width: 8, height: 8, borderRadius: 4},
  catName:         {flex: 1, fontSize: 15, fontWeight: '800'},
  catCount:        {fontSize: 13, fontWeight: '600'},
  accordionBody:   {paddingHorizontal: 12, paddingBottom: 12, gap: 10},
  emptyTxt:        {fontSize: 13, paddingVertical: 8, paddingHorizontal: 4},

  card:            {borderRadius: 14, borderWidth: 1, padding: 14, gap: 12},
  cardHeader:      {flexDirection: 'row', alignItems: 'center', gap: 10},
  svcImg:          {width: 38, height: 38, borderRadius: 10},
  svcImgPlaceholder:{width: 38, height: 38, borderRadius: 10},
  cardName:        {flex: 1, fontSize: 14, fontWeight: '700'},
  editBtn:         {width: 32, height: 32, alignItems: 'center', justifyContent: 'center'},

  pricesRow:       {flexDirection: 'row', gap: 8},
  priceBox:        {flex: 1, borderRadius: 12, paddingVertical: 10, alignItems: 'center', gap: 4},
  priceRow:        {flexDirection: 'row', alignItems: 'center', gap: 3},
  priceVal:        {fontSize: 14, fontWeight: '800'},
  priceLbl:        {fontSize: 10},
});
