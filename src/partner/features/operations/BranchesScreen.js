import React, {useCallback, useEffect, useState} from 'react';
import {ActivityIndicator, Alert, FlatList, Image, Modal, PermissionsAndroid, Platform, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View} from 'react-native';
import {ArrowRight, Pencil, MapPin, Clock, Bike, ShoppingBag, Camera, ImagePlus, X, Wrench} from 'lucide-react-native';
import {launchCamera, launchImageLibrary} from 'react-native-image-picker';
import {useTheme} from '../../../shared/context/ThemeContext';
import {useI18n} from '../../../shared/i18n/I18nContext';
import {getBranches, getBranchServices, updateBranchBanner} from '../../../services/partner';
import EditBranchScreen from './EditBranchScreen';

async function requestCamera() {
  if (Platform.OS !== 'android') return true;
  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.CAMERA,
      {title: 'إذن الكاميرا', message: 'يحتاج التطبيق إلى الكاميرا لالتقاط صورة الفرع'},
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  } catch {
    return false;
  }
}

function ImagePickerModal({visible, onCamera, onGallery, onRemove, hasImage, onClose, colors}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={ip.overlay} />
      </TouchableWithoutFeedback>
      <View style={ip.sheet}>
        <View style={[ip.card, {backgroundColor: colors.card}]}>
          <View style={[ip.handle, {backgroundColor: colors.border}]} />
          <Text style={[ip.title, {color: colors.textPrimary}]}>صورة الفرع</Text>

          <TouchableOpacity style={[ip.row, {borderColor: colors.border}]} onPress={onCamera} activeOpacity={0.75}>
            <View style={[ip.iconBox, {backgroundColor: colors.primary + '15'}]}>
              <Camera size={20} color={colors.primary} />
            </View>
            <Text style={[ip.rowTxt, {color: colors.textPrimary}]}>التقاط صورة</Text>
          </TouchableOpacity>

          <View style={[ip.sep, {backgroundColor: colors.border}]} />

          <TouchableOpacity style={[ip.row, {borderColor: colors.border}]} onPress={onGallery} activeOpacity={0.75}>
            <View style={[ip.iconBox, {backgroundColor: colors.primary + '15'}]}>
              <ImagePlus size={20} color={colors.primary} />
            </View>
            <Text style={[ip.rowTxt, {color: colors.textPrimary}]}>اختيار من المعرض</Text>
          </TouchableOpacity>

          {hasImage && (
            <>
              <View style={[ip.sep, {backgroundColor: colors.border}]} />
              <TouchableOpacity style={[ip.row, {borderColor: colors.border}]} onPress={onRemove} activeOpacity={0.75}>
                <View style={[ip.iconBox, {backgroundColor: colors.danger + '15'}]}>
                  <X size={20} color={colors.danger} />
                </View>
                <Text style={[ip.rowTxt, {color: colors.danger}]}>حذف الصورة</Text>
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity style={[ip.cancelBtn, {backgroundColor: colors.bg}]} onPress={onClose} activeOpacity={0.75}>
            <Text style={[ip.cancelTxt, {color: colors.textSecondary}]}>إلغاء</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}


function BannerArea({image, colors, onChangeImage, onEdit, uploading}) {
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
      {uploading && (
        <View style={s.bannerOverlay}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      )}
      {/* Camera button — change banner */}
      <TouchableOpacity
        style={[s.cameraBtn, {backgroundColor: colors.card, opacity: uploading ? 0.4 : 1}]}
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
  const [banner,        setBanner]        = useState(
    item.banner ?? item.image ?? item.photo ?? item.coverImage ?? item.coverPhoto ?? null,
  );
  const [showImgPick,   setShowImgPick]   = useState(false);
  const [uploading,     setUploading]     = useState(false);
  const [branchSvcs,    setBranchSvcs]    = useState([]);
  const [svcsLoading,   setSvcsLoading]   = useState(true);
  const branchId = item._id ?? item.id;

  useEffect(() => {
    getBranchServices(branchId).then(res => {
      if (res.success) {
        const list = res.data?.data ?? res.data ?? [];
        setBranchSvcs(Array.isArray(list) ? list : []);
      }
      setSvcsLoading(false);
    });
  }, [branchId]);

  const nameAr  = item.name?.ar ?? item.name?.en ?? item.nameAr ?? '';
  const address = item.address ?? '';
  const orders  = item.activeOrdersCount  ?? item.orders  ?? 0;
  const bikers  = item.activeBikersCount  ?? item.bikers  ?? 0;

  const openHour  = item.workingHours?.find(h => !h.isClosed);
  const hoursStr  = openHour ? `${openHour.open} – ${openHour.close}` : (item.hours ?? '');

  const uploadBanner = async uri => {
    setBanner(uri);
    setUploading(true);
    const res = await updateBranchBanner(branchId, uri);
    setUploading(false);
    if (!res.success) {
      Alert.alert('خطأ', `تعذّر رفع الصورة\n${res.error ?? ''}`);
      setBanner(item.banner ?? item.image ?? item.photo ?? item.coverImage ?? item.coverPhoto ?? null);
    }
  };

  const handleCamera = async () => {
    setShowImgPick(false);
    const allowed = await requestCamera();
    if (!allowed) { Alert.alert('تنبيه', 'يرجى منح إذن الكاميرا من الإعدادات'); return; }
    launchCamera({mediaType: 'photo', quality: 0.8, saveToPhotos: false}, res => {
      const uri = res.assets?.[0]?.uri;
      if (uri) uploadBanner(uri);
    });
  };

  const handleGallery = () => {
    setShowImgPick(false);
    launchImageLibrary({mediaType: 'photo', quality: 0.8, selectionLimit: 1}, res => {
      const uri = res.assets?.[0]?.uri;
      if (uri) uploadBanner(uri);
    });
  };

  const handleRemove = async () => {
    setShowImgPick(false);
    setBanner(null);
    setUploading(true);
    const res = await updateBranchBanner(branchId, null);
    setUploading(false);
    if (!res.success) {
      Alert.alert('خطأ', 'تعذّر حذف الصورة، يرجى المحاولة مجدداً');
      setBanner(item.banner ?? item.image ?? item.photo ?? item.coverImage ?? item.coverPhoto ?? null);
    }
  };

  return (
    <View style={[s.card, {backgroundColor: colors.card}]}>
      <BannerArea
        image={banner}
        colors={colors}
        onChangeImage={() => !uploading && setShowImgPick(true)}
        onEdit={() => onEdit(item)}
        uploading={uploading}
      />
      <ImagePickerModal
        visible={showImgPick}
        hasImage={!!banner}
        onCamera={handleCamera}
        onGallery={handleGallery}
        onRemove={handleRemove}
        onClose={() => setShowImgPick(false)}
        colors={colors}
      />

      <View style={s.cardBody}>
        <View style={s.addrRow}>
          <View style={[s.pinIcon, {backgroundColor: colors.primary + '15'}]}>
            <MapPin size={18} color={colors.primary} />
          </View>
          <View style={s.addrText}>
            <Text style={[s.addrName, {color: colors.textPrimary}]}>{nameAr}</Text>
            {!!address && <Text style={[s.addrSub, {color: colors.textSecondary}]}>{address}</Text>}
          </View>
          {item.isMain && (
            <View style={[s.mainBadge, {backgroundColor: colors.primary}]}>
              <Text style={s.mainBadgeText}>{mainLabel}</Text>
            </View>
          )}
        </View>

        <View style={[s.divider, {backgroundColor: colors.border}]} />

        <View style={s.statsRow}>
          <View style={[s.statItem, {backgroundColor: colors.primary + '15'}]}>
            <Bike size={15} color={colors.primary} />
            <Text style={[s.statValue, {color: colors.textPrimary}]}>{bikers}</Text>
          </View>
          <View style={[s.statItem, {backgroundColor: colors.primary + '15'}]}>
            <ShoppingBag size={15} color={colors.primary} />
            <Text style={[s.statValue, {color: colors.textPrimary}]}>{orders} {ordersLabel}</Text>
          </View>
          {!!hoursStr && (
            <View style={[s.statItem, {backgroundColor: colors.primary + '15'}]}>
              <Clock size={15} color={colors.primary} />
              <Text style={[s.statValue, {color: colors.textPrimary}]}>{hoursStr}</Text>
            </View>
          )}
        </View>

        <View style={[s.divider, {backgroundColor: colors.border}]} />

        {/* Services section */}
        <View style={s.servicesSection}>
          <View style={s.servicesSectionHeader}>
            <View style={[s.svcIconBox, {backgroundColor: colors.primary + '15'}]}>
              <Wrench size={14} color={colors.primary} />
            </View>
            <Text style={[s.servicesSectionTitle, {color: colors.textPrimary}]}>الخدمات المتاحة</Text>
          </View>
          {svcsLoading
            ? <ActivityIndicator size="small" color={colors.primary} style={{marginVertical: 8}} />
            : branchSvcs.map(sv => {
              const svcId   = sv.serviceId ?? sv._id ?? sv.service?._id ?? '';
              const svcName = sv.service?.name?.ar ?? sv.service?.name?.en ?? svcId ?? '';
              const cat     = sv.service?.category?.name?.ar ?? '';
              const isOn    = sv.isEnabled ?? false;
              return (
                <View key={svcId} style={[s.serviceRow, {borderBottomColor: colors.border}]}>
                  <Text style={[s.serviceName, {color: colors.textPrimary, flex: 1}]}>{svcName}</Text>
                  {!!cat && (
                    <View style={[s.categoryChip, {backgroundColor: colors.primary + '12'}]}>
                      <Text style={[s.categoryText, {color: colors.primary}]}>{cat}</Text>
                    </View>
                  )}
                  <View style={[s.statusDot, {backgroundColor: isOn ? '#22C55E' : colors.border}]} />
                </View>
              );
            })
          }
        </View>
      </View>
    </View>
  );
}

export default function BranchesScreen({onBack}) {
  const {colors} = useTheme();
  const {t} = useI18n();
  const [branches,      setBranches]      = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [editingBranch, setEditingBranch] = useState(null);

  const fetchBranches = useCallback(async () => {
    setLoading(true);
    const res = await getBranches();
    if (res.success) {
      const list = res.data?.data ?? res.data ?? [];
      setBranches(Array.isArray(list) ? list : []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchBranches(); }, [fetchBranches]);

  const ordersLabel = t('partner.branches.orders');
  const mainLabel   = t('partner.branches.main');

  const handleEdit    = useCallback(item => setEditingBranch(item), []);
  const handleBack    = useCallback(() => { setEditingBranch(null); fetchBranches(); }, [fetchBranches]);
  const renderItem    = useCallback(({item}) => (
    <BranchCard item={item} colors={colors} ordersLabel={ordersLabel} mainLabel={mainLabel} onEdit={handleEdit} />
  ), [colors, ordersLabel, mainLabel, handleEdit]);
  const keyExtractor  = useCallback(item => item._id ?? item.id, []);

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
                {branches.length} {t('partner.branches.subtitle')}
              </Text>
            </View>
          </View>
          {loading
            ? <View style={s.center}><ActivityIndicator size="large" color={colors.primary} /></View>
            : (
          <FlatList
            data={branches}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            contentContainerStyle={s.list}
            showsVerticalScrollIndicator={false}
          />
            )
          }
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
  center:        {flex: 1, alignItems: 'center', justifyContent: 'center'},
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
  bannerOverlay: {position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center'},
  cameraBtn:     {position: 'absolute', bottom: 10, left: 10, width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center', elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, shadowOffset: {width: 0, height: 1}},
  editBtn:       {position: 'absolute', top: 10, left: 10, width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center', elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, shadowOffset: {width: 0, height: 1}},

  cardBody:      {padding: 14, gap: 10},
  addrRow:       {flexDirection: 'row', alignItems : "center", gap: 6},
  addrText:      {flex: 1, gap: 3},
  addrName:      {fontSize: 15, fontWeight: '800'},
  addrSub:       {fontSize: 12},
  pinIcon:       {width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center'},
  divider:       {height: 1},
  statsRow:      {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'},
  statItem:      {flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 50, alignItems: 'center', gap: 5},
  statValue:     {fontSize: 13, fontWeight: '600'},

  mainBadge:     {paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20},
  mainBadgeText: {color: '#FFF', fontSize: 12, fontWeight: '700'},

  servicesSection:       {gap: 0},
  servicesSectionHeader: {flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10},
  svcIconBox:            {width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center'},
  servicesSectionTitle:  {fontSize: 13, fontWeight: '800'},
  serviceRow:            {flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, borderBottomWidth: 1},
  serviceName:           {fontSize: 13, fontWeight: '600'},
  categoryChip:          {paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20},
  categoryText:          {fontSize: 10, fontWeight: '700'},
  statusDot:             {width: 8, height: 8, borderRadius: 4},
});

const ip = StyleSheet.create({
  overlay:   {position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.45)'},
  sheet:     {flex: 1, justifyContent: 'flex-end', paddingHorizontal: 16, paddingBottom: 32},
  card:      {borderRadius: 24, padding: 20, gap: 4},
  handle:    {width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 12},
  title:     {fontSize: 17, fontWeight: '800', marginBottom: 8},
  row:       {flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14},
  iconBox:   {width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center'},
  rowTxt:    {fontSize: 15, fontWeight: '600'},
  sep:       {height: 1},
  cancelBtn: {marginTop: 8, paddingVertical: 14, borderRadius: 14, alignItems: 'center'},
  cancelTxt: {fontSize: 15, fontWeight: '600'},
});
