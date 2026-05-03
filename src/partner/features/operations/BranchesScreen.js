import React, {useCallback, useState} from 'react';
import {FlatList, Image, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {ArrowRight, Pencil, MapPin, Clock, Bike, ShoppingBag, Camera} from 'lucide-react-native';
import {useTheme} from '../../../shared/context/ThemeContext';
import {useI18n} from '../../../shared/i18n/I18nContext';
import EditBranchScreen from './EditBranchScreen';

const MOCK_BRANCHES = [
  {id: 'br1', nameAr: 'طريق الملك فهد', address: 'البرج 4 , شارع الياسمين',                    hours: '8:00 – 22:00', orders: 12, bikers: 120, isMain: true},
  {id: 'br2', nameAr: 'فرع العليا',      address: 'الرياض، حي العليا، طريق الملك فهد',          hours: '9:00 – 21:00', orders: 8,  bikers: 80,  isMain: false},
  {id: 'br3', nameAr: 'فرع النخيل',      address: 'الرياض، حي النخيل، شارع الأمير محمد',        hours: '8:00 – 22:00', orders: 5,  bikers: 40,  isMain: false},
];

function BannerArea({image, colors, onChangeImage, onEdit}) {
  return (
    <View style={s.bannerBox}>
      {image
        ? <Image source={{uri: image}} style={s.bannerImg} resizeMode="cover" />
        : (
          <View style={[s.bannerEmpty, {backgroundColor: colors.primary + '12'}]}>
            <View style={s.mapGrid}>
              {[0,1,2,3].map(i => (
                <View key={`h${i}`} style={[s.mapLineH, {top: `${20 + i * 20}%`, backgroundColor: colors.primary + '25'}]} />
              ))}
              {[0,1,2,3,4].map(i => (
                <View key={`v${i}`} style={[s.mapLineV, {left: `${10 + i * 20}%`, backgroundColor: colors.primary + '25'}]} />
              ))}
            </View>
            <View style={[s.mapPin, {backgroundColor: colors.primary}]}>
              <View style={s.mapPinInner} />
            </View>
          </View>
        )
      }
      {/* Camera button — change banner */}
      <TouchableOpacity
        style={[s.cameraBtn, {backgroundColor: colors.card}]}
        onPress={onChangeImage}
        activeOpacity={0.8}>
        <Camera size={14} color={colors.primary} />
      </TouchableOpacity>
      {/* Edit button — edit branch details */}
      <TouchableOpacity
        style={[s.editBtn, {backgroundColor: colors.card}]}
        onPress={onEdit}
        activeOpacity={0.8}>
        <Pencil size={14} color={colors.primary} />
      </TouchableOpacity>
    </View>
  );
}

function BranchCard({item, colors, ordersLabel, mainLabel, onEdit}) {
  const [banner, setBanner] = useState(item.banner ?? null);

  return (
    <View style={[s.card, {backgroundColor: colors.card}]}>
      <BannerArea
        image={banner}
        colors={colors}
        onChangeImage={() => setBanner(null)}
        onEdit={() => onEdit(item)}
      />

      <View style={s.cardBody}>
        <View style={s.addrRow}>
          <View style={[s.pinIcon, {backgroundColor: colors.primary + '15'}]}>
            <MapPin size={18} color={colors.primary} />
          </View>
          <View style={s.addrText}>
            <Text style={[s.addrName, {color: colors.textPrimary}]}>{item.nameAr}</Text>
            <Text style={[s.addrSub,  {color: colors.textSecondary}]}>{item.address}</Text>
          </View>
        </View>

        <View style={[s.divider, {backgroundColor: colors.border}]} />

        <View style={s.statsRow}>
          <View style={[s.statItem, {backgroundColor: colors.primary + '15'}]}>
            <Bike size={15} color={colors.primary} />
            <Text style={[s.statValue, {color: colors.textPrimary}]}>{item.bikers}</Text>
          </View>
          <View style={[s.statItem, {backgroundColor: colors.primary + '15'}]}>
            <ShoppingBag size={15} color={colors.primary} />
            <Text style={[s.statValue, {color: colors.textPrimary}]}>{item.orders} {ordersLabel}</Text>
          </View>
          <View style={[s.statItem, {backgroundColor: colors.primary + '15'}]}>
            <Clock size={15} color={colors.primary} />
            <Text style={[s.statValue, {color: colors.textPrimary}]}>{item.hours}</Text>
          </View>
        </View>
      </View>

      {item.isMain && (
        <View style={[s.mainBadge, {backgroundColor: colors.primary}]}>
          <Text style={s.mainBadgeText}>{mainLabel}</Text>
        </View>
      )}
    </View>
  );
}

export default function BranchesScreen({onBack}) {
  const {colors} = useTheme();
  const {t} = useI18n();
  const [editingBranch, setEditingBranch] = useState(null);

  const ordersLabel = t('partner.branches.orders');
  const mainLabel   = t('partner.branches.main');

  const handleEdit    = useCallback(item => setEditingBranch(item), []);
  const handleBack    = useCallback(() => setEditingBranch(null), []);
  const renderItem    = useCallback(({item}) => (
    <BranchCard item={item} colors={colors} ordersLabel={ordersLabel} mainLabel={mainLabel} onEdit={handleEdit} />
  ), [colors, ordersLabel, mainLabel, handleEdit]);
  const keyExtractor  = useCallback(item => item.id, []);

  const showList = !editingBranch;

  return (
    <View style={s.flex}>
      <View style={[s.flex, showList ? null : s.hidden]}>
        <View style={[s.root, {backgroundColor: colors.bg}]}>
          <View style={[s.header, {backgroundColor: colors.bg}]}>
            <TouchableOpacity onPress={onBack} style={s.backBtn} activeOpacity={0.75}>
              <ArrowRight size={22} color={colors.textPrimary} />
            </TouchableOpacity>
            <View style={s.headerText}>
              <Text style={[s.headerTitle, {color: colors.textPrimary}]}>{t('partner.branches.title')}</Text>
              <Text style={[s.headerSub,   {color: colors.textSecondary}]}>
                {MOCK_BRANCHES.length} {t('partner.branches.subtitle')}
              </Text>
            </View>
          </View>
          <FlatList
            data={MOCK_BRANCHES}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            contentContainerStyle={s.list}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </View>
      {editingBranch && (
        <View style={s.flex}>
          <EditBranchScreen branch={editingBranch} onBack={handleBack} />
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  flex:          {flex: 1},
  hidden:        {display: 'none'},
  root:          {flex: 1},
  header:        {flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16},
  headerText:    {flex: 1, gap: 4, paddingHorizontal: 8},
  headerTitle:   {fontSize: 26, fontWeight: '900'},
  headerSub:     {fontSize: 13},
  backBtn:       {width: 36, height: 36, alignItems: 'center', justifyContent: 'center'},

  list:          {paddingHorizontal: 16, paddingBottom: 32, gap: 16},

  card:          {borderRadius: 20, overflow: 'hidden', elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, shadowOffset: {width: 0, height: 2}},

  bannerBox:     {height: 160, position: 'relative'},
  bannerImg:     {width: '100%', height: '100%'},
  bannerEmpty:   {flex: 1, alignItems: 'center', justifyContent: 'center'},
  mapGrid:       {position: 'absolute', top: 0, left: 0, right: 0, bottom: 0},
  mapLineH:      {position: 'absolute', left: 0, right: 0, height: 1},
  mapLineV:      {position: 'absolute', top: 0, bottom: 0, width: 1},
  mapPin:        {width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center'},
  mapPinInner:   {width: 8, height: 8, borderRadius: 4, backgroundColor: '#FFF'},
  cameraBtn:     {position: 'absolute', bottom: 10, left: 10, width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center', elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, shadowOffset: {width: 0, height: 1}},
  editBtn:       {position: 'absolute', top: 10, left: 10, width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center', elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, shadowOffset: {width: 0, height: 1}},

  cardBody:      {padding: 14, gap: 10},
  addrRow:       {flexDirection: 'row', gap: 6},
  addrText:      {flex: 1, gap: 3},
  addrName:      {fontSize: 15, fontWeight: '800'},
  addrSub:       {fontSize: 12},
  pinIcon:       {width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center'},
  divider:       {height: 1},
  statsRow:      {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'},
  statItem:      {flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 50, alignItems: 'center', gap: 5},
  statValue:     {fontSize: 13, fontWeight: '600'},

  mainBadge:     {position: 'absolute', bottom: 82, left: 14, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20},
  mainBadgeText: {color: '#FFF', fontSize: 12, fontWeight: '700'},
});
