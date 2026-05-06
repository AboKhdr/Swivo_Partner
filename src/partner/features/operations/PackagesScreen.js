import React, {useCallback, useEffect, useState} from 'react';
import {ActivityIndicator, FlatList, Image, StyleSheet, Switch, Text, TouchableOpacity, View} from 'react-native';
import {ArrowRight, Plus, Pencil, Camera} from 'lucide-react-native';
import {useTheme} from '../../../shared/context/ThemeContext';
import {useI18n} from '../../../shared/i18n/I18nContext';
import {getPackages, togglePackage} from '../../../services/partner';
import AddPackageScreen from './AddPackageScreen';

function PackageBanner({image, colors, hint, onChangeImage}) {
  return (
    <View style={s.bannerBox}>
      {image
        ? <Image source={{uri: image}} style={s.bannerImg} resizeMode="cover" />
        : (
          <View style={[s.bannerEmpty, {backgroundColor: colors.primary + '10'}]}>
            <View style={[s.bannerIcon, {backgroundColor: colors.primary + '20'}]}>
              <Camera size={22} color={colors.primary} />
            </View>
            <Text style={[s.bannerHint, {color: colors.textSecondary}]}>{hint}</Text>
          </View>
        )
      }
      <TouchableOpacity
        style={[s.cameraBtn, {backgroundColor: colors.card}]}
        onPress={onChangeImage}
        activeOpacity={0.8}>
        <Camera size={14} color={colors.primary} />
      </TouchableOpacity>
    </View>
  );
}

function PackageCard({item, colors, hint, onEdit, onToggle}) {
  const [banner, setBanner] = useState(item.banner ?? null);
  const nameAr   = item.name?.ar ?? item.name?.en ?? item.nameAr ?? '';
  const services = item.services?.map(sv => sv.name?.ar ?? sv.name?.en ?? sv) ?? [];

  return (
    <View style={[s.card, {backgroundColor: colors.card}]}>
      <PackageBanner image={banner} colors={colors} hint={hint} onChangeImage={() => setBanner(null)} />
      <View style={s.cardBody}>
        <View style={s.cardTop}>
          <Text style={[s.nameAr, {color: colors.textPrimary}]}>{nameAr}</Text>
          <Switch
            value={item.isActive ?? true}
            onValueChange={val => onToggle(item._id ?? item.id, val)}
            trackColor={{false: colors.border, true: colors.primary + 'AA'}}
            thumbColor={item.isActive ? colors.primary : '#ccc'}
          />
          <TouchableOpacity style={s.editBtn} onPress={() => onEdit(item)} activeOpacity={0.75}>
            <Pencil size={15} color={colors.primary} />
          </TouchableOpacity>
        </View>
        {services.length > 0 && (
          <Text style={[s.servicesTxt, {color: colors.primary}]}>
            {services.join(' , ')}
          </Text>
        )}
      </View>
    </View>
  );
}

export default function PackagesScreen({onBack}) {
  const {colors} = useTheme();
  const {t} = useI18n();
  const [packages,       setPackages]       = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [showAdd,        setShowAdd]        = useState(false);
  const [editingPackage, setEditingPackage] = useState(null);

  const fetchPackages = useCallback(async () => {
    setLoading(true);
    const res = await getPackages();
    if (res.success) {
      const list = res.data?.data ?? res.data ?? [];
      setPackages(Array.isArray(list) ? list : []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchPackages(); }, [fetchPackages]);

  const handleToggle = useCallback(async (id, val) => {
    setPackages(prev => prev.map(p => (p._id ?? p.id) === id ? {...p, isActive: val} : p));
    await togglePackage(id, val);
  }, []);

  const handleEdit   = useCallback(item => setEditingPackage(item), []);

  const onSaved = useCallback(() => {
    fetchPackages();
  }, [fetchPackages]);

  const renderItem   = useCallback(({item}) => (
    <PackageCard item={item} colors={colors} hint={t('partner.packages.addPhoto')} onEdit={handleEdit} onToggle={handleToggle} />
  ), [colors, t, handleEdit, handleToggle]);
  const keyExtractor = useCallback(item => item._id ?? item.id, []);

  const showList = !showAdd && !editingPackage;

  return (
    <View style={s.flex}>
      <View style={[s.flex, showList ? null : s.hidden]}>
        <View style={[s.root, {backgroundColor: colors.bg}]}>
          <View style={[s.header, {backgroundColor: colors.bg}]}>
            <TouchableOpacity onPress={onBack} style={s.backBtn} activeOpacity={0.75}>
              <ArrowRight size={22} color={colors.textPrimary} />
            </TouchableOpacity>
            <View style={s.headerText}>
              <Text style={[s.headerTitle, {color: colors.textPrimary}]}>{t('partner.packages.title')}</Text>
              <Text style={[s.headerSub, {color: colors.textSecondary}]}>
                {packages.length} {t('partner.packages.available')}
              </Text>
            </View>
            <TouchableOpacity
              style={[s.addBtn, {backgroundColor: colors.primary}]}
              onPress={() => setShowAdd(true)}
              activeOpacity={0.85}>
              <Plus size={20} color="#FFF" />
            </TouchableOpacity>
          </View>
          {loading
            ? <View style={s.center}><ActivityIndicator size="large" color={colors.primary} /></View>
            : (
          <FlatList
            data={packages}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            contentContainerStyle={s.list}
            showsVerticalScrollIndicator={false}
          />
            )
          }
        </View>
      </View>

      {showAdd && (
        <View style={s.flex}>
          <AddPackageScreen onBack={() => setShowAdd(false)} onSaved={onSaved} />
        </View>
      )}
      {editingPackage && (
        <View style={s.flex}>
          <AddPackageScreen initialData={editingPackage} onBack={() => setEditingPackage(null)} onSaved={onSaved} />
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  flex:        {flex: 1},
  hidden:      {display: 'none'},
  root:        {flex: 1},
  center:      {flex: 1, alignItems: 'center', justifyContent: 'center'},
  header:      {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16},
  backBtn:     {width: 36, height: 36, alignItems: 'center', justifyContent: 'center'},
  addBtn:      {width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center'},
  headerText:  {flex: 1, gap: 2, paddingHorizontal: 8},
  headerTitle: {fontSize: 26, fontWeight: '900'},
  headerSub:   {fontSize: 13},

  list:        {paddingHorizontal: 16, paddingBottom: 32, gap: 16},

  card:        {borderRadius: 20, overflow: 'hidden', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: {width: 0, height: 2}},

  bannerBox:   {height: 140, position: 'relative'},
  bannerImg:   {width: '100%', height: '100%'},
  bannerEmpty: {flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8},
  bannerIcon:  {width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center'},
  bannerHint:  {fontSize: 12, fontWeight: '500'},
  cameraBtn:   {position: 'absolute', top: 10, left: 10, width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center', elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, shadowOffset: {width: 0, height: 1}},

  cardBody:    {padding: 14, gap: 8},
  cardTop:     {flexDirection: 'row', alignItems: 'center'},
  nameAr:      {flex: 1, fontSize: 16, fontWeight: '800'},
  editBtn:     {width: 36, height: 36, alignItems: 'center', justifyContent: 'center'},
  servicesTxt: {fontSize: 13, fontWeight: '500'},
});
