import React, {useCallback, useState} from 'react';
import {FlatList, Image, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {ArrowRight, Plus, Pencil, Camera} from 'lucide-react-native';
import {useTheme} from '../../../shared/context/ThemeContext';
import {useI18n} from '../../../shared/i18n/I18nContext';
import AddPackageScreen from './AddPackageScreen';

const MOCK_PACKAGES = [
  {id: 'p1', nameAr: 'باقة ابو بلس خي ولعند المفتي', serviceIds: ['s1', 's6', 's7'], services: ['3 غسلات داخلية', 'بوليش', 'غيار زيت'], uses: 4,  validityDays: 30},
  {id: 'p2', nameAr: 'باقة بريميوم',                  serviceIds: ['s2', 's4', 's5'], services: ['غسيل كامل', 'تلميع', 'تعقيم'],         uses: 4,  validityDays: 30},
  {id: 'p3', nameAr: 'باقة ربعية',                    serviceIds: ['s1', 's4'],       services: ['غسيل خارجي', 'تلميع خارجي'],           uses: 12, validityDays: 90},
];

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

function PackageCard({item, colors, hint, onEdit}) {
  const [banner, setBanner] = useState(item.banner ?? null);

  return (
    <View style={[s.card, {backgroundColor: colors.card}]}>
      <PackageBanner image={banner} colors={colors} hint={hint} onChangeImage={() => setBanner(null)} />
      <View style={s.cardBody}>
        <View style={s.cardTop}>
          <Text style={[s.nameAr, {color: colors.textPrimary}]}>{item.nameAr}</Text>
          <TouchableOpacity style={s.editBtn} onPress={() => onEdit(item)} activeOpacity={0.75}>
            <Pencil size={15} color={colors.primary} />
          </TouchableOpacity>
        </View>
        <Text style={[s.servicesTxt, {color: colors.primary}]}>
          {item.services.join(' , ')}
        </Text>
      </View>
    </View>
  );
}

export default function PackagesScreen({onBack}) {
  const {colors} = useTheme();
  const {t} = useI18n();
  const [packages]       = useState(MOCK_PACKAGES);
  const [showAdd,        setShowAdd]        = useState(false);
  const [editingPackage, setEditingPackage] = useState(null);

  const handleEdit   = useCallback(item => setEditingPackage(item), []);
  const renderItem   = useCallback(({item}) => (
    <PackageCard item={item} colors={colors} hint={t('partner.packages.addPhoto')} onEdit={handleEdit} />
  ), [colors, t, handleEdit]);
  const keyExtractor = useCallback(item => item.id, []);

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
          <FlatList
            data={packages}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            contentContainerStyle={s.list}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </View>

      {showAdd && (
        <View style={s.flex}>
          <AddPackageScreen onBack={() => setShowAdd(false)} />
        </View>
      )}
      {editingPackage && (
        <View style={s.flex}>
          <AddPackageScreen initialData={editingPackage} onBack={() => setEditingPackage(null)} />
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
