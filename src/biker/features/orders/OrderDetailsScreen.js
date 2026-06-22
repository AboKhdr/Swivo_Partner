import React, {useState, useEffect, useCallback, useRef} from 'react';
import {
  ActivityIndicator, Animated, Image, Modal,
  PermissionsAndroid, Platform, ScrollView, StatusBar, StyleSheet,
  Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import {launchCamera} from 'react-native-image-picker';
import {Camera, X, Phone} from 'lucide-react-native';
import {useTheme} from '../../../shared/context/ThemeContext';
import {useI18n} from '../../../shared/i18n/I18nContext';
import StatusTracker from '../../../shared/components/StatusTracker';
import GalleryStrip from '../../../shared/components/GalleryStrip';
import {updateOrderStatus, uploadOrderPhoto, skipOrderPhoto, getOrderById} from '../../../services/orders';
import {SKIP_REASONS} from '../../../shared/constants/skipReasons';
import {carColorHex} from '../../../shared/constants/carColor';
import RiyalIcon from '../../../shared/components/RiyalIcon';
import useAppStore from '../../../store/appStore';


const STEP_IMGS = {
  ASSIGNED:   require('../../../assets/steps/1.png'),
  ON_THE_WAY: require('../../../assets/steps/2.png'),
  ARRIVED:    require('../../../assets/steps/3.png'),
  STARTED:    require('../../../assets/steps/4.png'),
  COMPLETED:  require('../../../assets/steps/5.png'),
};

// onshop orders skip ON_THE_WAY and ARRIVED — biker is already at the location
const ACTION_NEXT_MOBILE = {
  ASSIGNED:   'ON_THE_WAY',
  ON_THE_WAY: 'ARRIVED',
  ARRIVED:    'STARTED',
  STARTED:    'COMPLETED',
};

const ACTION_NEXT_ONSHOP = {
  ASSIGNED: 'STARTED',
  STARTED:  'COMPLETED',
};

// Safe string — if value is {ar, en} object pick lang then ar then en, else return as-is
function str(val, lang) {
  if (!val) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'object') return val[lang] ?? val.ar ?? val.en ?? '';
  return String(val);
}

// ── Resolve fields from either new API shape or legacy shape ─────────────────
// New: client.name, car.brand/model/plateNumber/color, services[], location.addressText
// Legacy: client.firstName+lastName, userCar.brand.name, addressSnapshot, itemsSnapshot
function resolveFields(d, lang) {
  // Client
  const clientName = d.client?.name
    ?? (d.client ? `${d.client.firstName ?? ''} ${d.client.lastName ?? ''}`.trim() : '');
  const clientPhone = d.client?.phoneNumber ?? d.client?.phone ?? '';

  // Car — new shape: strings; legacy: nested objects
  const carBrand = str(d.car?.brand, lang) || str(d.userCar?.brand?.name, lang);
  const carModel = str(d.car?.model, lang) || str(d.userCar?.model?.name, lang);
  const carPlate = d.car?.plateNumber ?? d.userCar?.plateNumber ?? '';
  const carColor = str(d.car?.color, lang) || str(d.userCar?.color, lang);
  const carDisplay = [carBrand, carModel].filter(Boolean).join(' ');

  // Services — new shape: services[]; legacy: itemsSnapshot[]
  const services = d.services ?? [];
  const firstItem = d.itemsSnapshot?.[0];
  const rawSvcName = d.service?.name;
  const serviceName = str(services[0]?.name, lang)
    || str(firstItem?.nameSnapshot, lang)
    || str(rawSvcName, lang);

  // Location
  const address = d.location?.addressText
    ?? d.addressSnapshot?.addressText
    ?? d.addressSnapshot?.district
    ?? d.branch?.address
    ?? '';

  // Price
  const totalAmount = d.totalAmount ?? null;

  // Photos
  const beforePhotos = d.proof?.beforePhotos ?? [];
  const afterPhotos  = d.proof?.afterPhotos  ?? [];

  // Additional services (add-ons) — new shape: additionalServices[] ({serviceId, name{ar,en}, price});
  // legacy: additionalService[] / additionalServicesSnapshot[]
  const additionalServices = (() => {
    if (d.additionalServices?.length) {
      return d.additionalServices.map(a => ({
        id:    a.serviceId ?? a._id,
        name:  str(a.name, lang),
        price: a.price ?? null,
        image: a.image ?? null,
      }));
    }
    if (d.additionalService?.length) {
      return d.additionalService.map(a => ({
        id:    a._id,
        name:  str(a.name, lang),
        price: a.price ?? null,
        image: a.image ?? null,
      }));
    }
    if (d.additionalServicesSnapshot?.length) {
      return d.additionalServicesSnapshot.map(a => ({
        id:    a.serviceId,
        name:  lang === 'en' ? (a.nameEn || a.nameAr || '') : (a.nameAr || a.nameEn || ''),
        price: a.unitPrice ?? null,
        image: null,
      }));
    }
    return [];
  })();

  // orderType
  const isOnshop = (d.orderType ?? d.type ?? '').toUpperCase() === 'IN_SHOP'
    || (d.orderType ?? d.type ?? '') === 'onshop';

  return {
    clientName, clientPhone,
    carBrand, carModel, carPlate, carColor, carDisplay,
    services, serviceName,
    address, totalAmount,
    beforePhotos, afterPhotos,
    isOnshop, additionalServices,
  };
}

export default function OrderDetailsScreen({order, onBack}) {
  const {colors, isDark} = useTheme();
  const {t, lang}        = useI18n();

  // Full order data — start with prop, then overwrite with fetched data
  const [orderData, setOrderData]   = useState(order);
  const [dataLoading, setDataLoading] = useState(true);
  const [currentStatus, setCurrentStatus] = useState(order.status);
  const [actionLoading, setActionLoading] = useState(false);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [uploadPhase, setUploadPhase] = useState('before'); // 'before' | 'after'
  const [photos, setPhotos]           = useState([]);
  const [showSkipModal, setShowSkipModal] = useState(false);
  const [skipCode, setSkipCode]   = useState('');
  const [skipNote, setSkipNote]   = useState('');
  const [showDoneOverlay, setShowDoneOverlay] = useState(false);

  const orderId = order._id ?? order.id;

  // ── Fetch full order on mount ───────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    setDataLoading(true);
    getOrderById(orderId).then(res => {
      if (cancelled) return;
      if (res.success) {
        const fresh = res.data?.data ?? res.data;
        if (fresh) {
          setOrderData(fresh);
          setCurrentStatus(fresh.status ?? order.status);
        }
      }
      setDataLoading(false);
    });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  // ── Re-fetch when foreground notification signals refresh ────────────────
  const orderRefreshSignal = useAppStore(s => s.orderRefreshSignal);
  useEffect(() => {
    if (orderRefreshSignal === 0) return;
    getOrderById(orderId).then(res => {
      if (!res.success) return;
      const fresh = res.data?.data ?? res.data;
      if (!fresh) return;
      setOrderData(fresh);
      if (fresh.status) setCurrentStatus(fresh.status);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderRefreshSignal]);

  // ── Derived display values ───────────────────────────────────────────────
  const d = orderData ?? order;
  const {
    clientName, clientPhone,
    carBrand, carModel, carPlate, carColor, carDisplay,
    services, serviceName,
    address, totalAmount,
    beforePhotos, afterPhotos,
    isOnshop, additionalServices,
  } = resolveFields(d, lang);

  const scheduledAt = d.scheduledAt
    ? new Date(d.scheduledAt).toLocaleString('ar-SA', {
        weekday: 'long', day: '2-digit', month: 'long',
        hour: '2-digit', minute: '2-digit',
      })
    : '';

  const ACTION_NEXT       = isOnshop ? ACTION_NEXT_ONSHOP : ACTION_NEXT_MOBILE;
  const actionNextStatus  = ACTION_NEXT[currentStatus] ?? null;
  const action            = actionNextStatus
    ? {label: t(`orderDetails.actions.${currentStatus}`), nextStatus: actionNextStatus}
    : null;
  const photoTriggerStep  = isOnshop ? 'ASSIGNED' : 'ARRIVED';

  const actionBgColor =
    currentStatus === 'ASSIGNED'   ? colors.primary  :
    currentStatus === 'ON_THE_WAY' ? colors.success  :
    currentStatus === 'ARRIVED'    ? colors.primary  :
    currentStatus === 'STARTED'    ? colors.purple   : colors.border;

  // ── Handlers ────────────────────────────────────────────────────────────
  const handleAction = async () => {
    if (!action) return;
    if (currentStatus === photoTriggerStep) {
      setUploadPhase('before');
      setPhotos([]);
      setShowImageUpload(true);
      return;
    }
    if (currentStatus === 'STARTED') {
      setUploadPhase('after');
      setPhotos([]);
      setShowImageUpload(true);
      return;
    }
    setActionLoading(true);
    const res = await updateOrderStatus(orderId, action.nextStatus);
    if (res.success) {
      setCurrentStatus(action.nextStatus);
      if (action.nextStatus === 'COMPLETED') setShowDoneOverlay(true);
    }
    setActionLoading(false);
  };

  const handleTakePhoto = async () => {
    if (photos.length >= 4) return;
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: t('orderDetails.camera.permissionTitle'),
            message: t('orderDetails.camera.permissionMsg'),
            buttonPositive: t('orderDetails.camera.allow'),
            buttonNegative: t('orderDetails.camera.deny'),
          },
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) return;
      }
      const result = await launchCamera({
        mediaType: 'photo',
        quality: 0.8,
        saveToPhotos: false,
        cameraType: 'back',
      });
      if (result.assets?.[0]?.uri) {
        setPhotos(prev => [...prev, result.assets[0].uri]);
      }
    } catch (_) {}
  };

  const handleRemovePhoto = idx => {
    setPhotos(prev => prev.filter((_, i) => i !== idx));
  };

  const handleCompleteWithPhotos = async () => {
    if (photos.length === 0) return;
    setShowImageUpload(false);
    setActionLoading(true);
    const nextStatus = uploadPhase === 'before' ? 'STARTED' : 'COMPLETED';
    for (const uri of photos) {
      await uploadOrderPhoto(orderId, uri, uploadPhase);
    }
    await updateOrderStatus(orderId, nextStatus);
    setCurrentStatus(nextStatus);
    if (nextStatus === 'COMPLETED') setShowDoneOverlay(true);
    // Refresh data after status change
    getOrderById(orderId).then(res => {
      if (res.success) {
        const fresh = res.data?.data ?? res.data;
        if (fresh) setOrderData(fresh);
      }
    });
    setActionLoading(false);
  };

  const handleSkipConfirm = async () => {
    if (!skipCode) return;
    if (skipCode === 'OTHER' && !skipNote.trim()) return;
    setShowSkipModal(false);
    setShowImageUpload(false);
    setActionLoading(true);
    const note = skipCode === 'OTHER' ? skipNote.trim() : undefined;
    const res = await skipOrderPhoto(orderId, uploadPhase, skipCode, note);
    setSkipCode('');
    setSkipNote('');
    setActionLoading(false);
    if (res?.success) {
      const r = await getOrderById(orderId);
      if (r?.success) {
        const fresh = r.data?.data ?? r.data;
        if (fresh) {
          setOrderData(fresh);
          setCurrentStatus(fresh.status ?? currentStatus);
        }
      }
    }
  };

  // ── Extra services (beyond first) ────────────────────────────────────────
  const extraServices = services.length > 1
    ? services.slice(1)
    : (d.itemsSnapshot?.length > 1 ? d.itemsSnapshot.slice(1) : []);

  return (
    <View style={[s.root, {backgroundColor: colors.bg}]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.card} />

      {/* Header */}
      <View style={[s.header, {backgroundColor: colors.card, borderBottomColor: colors.border}]}>
        <TouchableOpacity style={[s.backBtn, {backgroundColor: colors.bg}]} onPress={onBack} hitSlop={{top:12,bottom:12,left:12,right:12}}>
          <Text style={[s.backArrow, {color: colors.textPrimary}]}>‹</Text>
        </TouchableOpacity>
        <Text style={[s.headerTitle, {color: colors.textPrimary}]}>{t('orderDetails.title')}</Text>
        <View style={[s.headerNum, {backgroundColor: colors.primary + '15'}]}>
          <Text style={[s.headerNumText, {color: colors.primary}]}>#{d.orderNumber}</Text>
        </View>
      </View>

      {dataLoading ? (
        <View style={s.loadingWrap}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>

          {/* Status tracker */}
          <View style={s.section}>
            <StatusTracker status={currentStatus} orderType={isOnshop ? 'onshop' : 'mobile'} />
          </View>

          {/* Step guide image */}
          {STEP_IMGS[currentStatus] && ACTION_NEXT[currentStatus] !== undefined && (
            <View style={[s.guideCard, {backgroundColor: colors.card, borderColor: colors.border}]}>
              <Image source={STEP_IMGS[currentStatus]} style={s.guideImg} resizeMode="contain" />
              <Text style={[s.guideTitle, {color: colors.textPrimary}]}>{t(`orderDetails.steps.${currentStatus}.title`)}</Text>
              <Text style={[s.guideDesc, {color: colors.textSecondary}]}>{t(`orderDetails.steps.${currentStatus}.desc`)}</Text>
            </View>
          )}

          {/* Main info card */}
          <View style={[s.detailCard, {backgroundColor: colors.card, borderColor: colors.border}]}>

            {/* Client */}
            <View style={s.clientRow}>
              <View style={{flex: 1, gap: 2}}>
                <Text style={[s.clientName, {color: colors.textPrimary}]}>{clientName}</Text>
                {!!scheduledAt && (
                  <Text style={[s.scheduledText, {color: colors.textSecondary}]}>{scheduledAt}</Text>
                )}
              </View>
              {!!clientPhone && (
                <View style={[s.phoneBadge, {backgroundColor: colors.primary + '15'}]}>
                  <Phone size={13} color={colors.primary} strokeWidth={2} />
                  <Text style={[s.phoneText, {color: colors.primary}]}>{clientPhone}</Text>
                </View>
              )}
            </View>

            <View style={[s.divider, {backgroundColor: colors.border}]} />

            {/* Info grid */}
            <View style={s.infoGrid}>
              <View style={s.infoCell}>
                <Text style={[s.infoLabel, {color: colors.textSecondary}]}>{t('orders.fields.washType')}</Text>
                <Text style={[s.infoValue, {color: colors.textPrimary}]}>{serviceName}</Text>
              </View>
              <View style={s.infoCell}>
                <Text style={[s.infoLabel, {color: colors.textSecondary}]}>{t('orders.fields.carType')}</Text>
                <Text style={[s.infoValue, {color: colors.textPrimary}]}>{carDisplay || '—'}</Text>
              </View>
              <View style={s.infoCell}>
                <Text style={[s.infoLabel, {color: colors.textSecondary}]}>{t('orders.fields.plate')}</Text>
                <Text style={[s.infoValue, {color: colors.textPrimary}]}>{carPlate || '—'}</Text>
              </View>
              {!!carColor && (
                <View style={s.infoCell}>
                  <Text style={[s.infoLabel, {color: colors.textSecondary}]}>{t('orders.fields.carColor')}</Text>
                  {carColorHex(carColor) ? (
                    <View
                      style={[s.colorSwatch, {backgroundColor: carColorHex(carColor), borderColor: colors.border}]}
                    />
                  ) : (
                    <Text style={[s.infoValue, {color: colors.textPrimary}]}>{carColor}</Text>
                  )}
                </View>
              )}
              {!!address && (
                <View style={[s.infoCell, {width: '100%'}]}>
                  <Text style={[s.infoLabel, {color: colors.textSecondary}]}>{t('orders.fields.location')}</Text>
                  <View style={s.locationRow}>
                    <View style={[s.locationDot, {backgroundColor: colors.primary}]} />
                    <Text style={[s.infoValue, {color: colors.textPrimary}]}>{address}</Text>
                  </View>
                </View>
              )}
            </View>

            {/* Tenant gallery — shown when tenantId is available */}
            {!!d.tenantId && (
              <>
                <View style={[s.divider, {backgroundColor: colors.border}]} />
                <GalleryStrip tenantId={d.tenantId?._id ?? d.tenantId} />
              </>
            )}

            {/* Extra services — legacy fallback only (new orders use additionalServices below) */}
            {additionalServices.length === 0 && extraServices.length > 0 && (
              <>
                <View style={[s.divider, {backgroundColor: colors.border}]} />
                <Text style={[s.extrasTitle, {color: colors.textPrimary}]}>{t('orders.fields.extras')}</Text>
                <View style={s.extrasRow}>
                  {extraServices.map((item, i) => {
                    const name = item.name?.ar ?? item.name?.en
                      ?? item.nameSnapshot?.ar ?? item.nameSnapshot?.en ?? '';
                    return (
                      <View key={i} style={s.extraChip}>
                        <Text style={s.extraChipStar}>✦</Text>
                        <Text style={[s.extraChipText, {color: colors.textPrimary}]}>{name}</Text>
                      </View>
                    );
                  })}
                </View>
              </>
            )}

            {/* Additional services (add-ons) */}
            {additionalServices.length > 0 && (
              <>
                <View style={[s.divider, {backgroundColor: colors.border}]} />
                <Text style={[s.extrasTitle, {color: colors.textPrimary}]}>{t('orderDetails.addons') || 'الخدمات الإضافية'}</Text>
                <View style={s.addonsGrid}>
                  {additionalServices.map((item, i) => (
                    <View key={item.id ?? i} style={[s.addonCard, {backgroundColor: colors.bg, borderColor: colors.border}]}>
                      {!!item.image && (
                        <Image source={{uri: item.image}} style={s.addonImg} resizeMode="cover" />
                      )}
                      <View style={s.addonInfo}>
                        <Text style={[s.addonName, {color: colors.textPrimary}]} numberOfLines={2}>{item.name}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </>
            )}

            {/* Proof photos (before/after if already uploaded) */}
            {(beforePhotos.length > 0 || afterPhotos.length > 0) && (
              <>
                <View style={[s.divider, {backgroundColor: colors.border}]} />
                <PhotosRow label={t('orderDetails.summary.beforePhotos')} photos={beforePhotos} colors={colors} />
                {afterPhotos.length > 0 && (
                  <PhotosRow label={t('orderDetails.summary.afterPhotos')} photos={afterPhotos} colors={colors} />
                )}
              </>
            )}
          </View>

          {/* Action button */}
          {action && (
            <TouchableOpacity
              style={[s.actionBtn, {backgroundColor: actionBgColor}, actionLoading && {opacity: 0.6}]}
              onPress={handleAction}
              disabled={actionLoading}
              activeOpacity={0.85}>
              {actionLoading
                ? <ActivityIndicator size="small" color="#fff" />
                : <Text style={s.actionBtnText}>{action.label}</Text>
              }
            </TouchableOpacity>
          )}

          <View style={{height: currentStatus === 'COMPLETED' ? 88 : 24}} />
        </ScrollView>
      )}

      {/* Photo upload sheet */}
      <Modal visible={showImageUpload} transparent animationType="slide" onRequestClose={() => setShowImageUpload(false)}>
        <View style={ms.slideOverlay}>
          <View style={[ms.slideSheet, {backgroundColor: colors.card}]}>
            <View style={[ms.slideHandle, {backgroundColor: colors.border}]} />
            <Text style={[ms.slideTitle, {color: colors.textPrimary}]}>
              {uploadPhase === 'before' ? t('orderDetails.camera.beforeTitle') : t('orderDetails.camera.afterTitle')}
            </Text>
            <Text style={[ms.slideSubtitle, {color: colors.textSecondary}]}>
              {uploadPhase === 'before' ? t('orderDetails.camera.beforeHint') : t('orderDetails.camera.afterHint')}
            </Text>

            <View style={ms.imgGrid}>
              {[0, 1, 2, 3].map(i => {
                const uri = photos[i];
                return uri ? (
                  <View key={i} style={ms.imgSlotFilled}>
                    <Image source={{uri}} style={ms.imgPreview} resizeMode="cover" />
                    <TouchableOpacity style={ms.removeBtn} onPress={() => handleRemovePhoto(i)}>
                      <X size={12} color="#fff" strokeWidth={3} />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    key={i}
                    style={[ms.imgSlot, {borderColor: colors.border, backgroundColor: colors.bg}]}
                    onPress={handleTakePhoto}
                    disabled={photos.length >= 4}
                    activeOpacity={0.7}>
                    <Camera size={26} color={colors.textSecondary} strokeWidth={1.5} />
                  </TouchableOpacity>
                );
              })}
            </View>

            {photos.length > 0 && (
              <Text style={[ms.photoCount, {color: colors.textSecondary}]}>{photos.length} / 4 {t('orderDetails.camera.photos')}</Text>
            )}

            <TouchableOpacity
              style={[ms.confirmBtn, {backgroundColor: colors.primary}, photos.length === 0 && {opacity: 0.4}]}
              onPress={handleCompleteWithPhotos}
              disabled={photos.length === 0}>
              <Text style={ms.confirmBtnText}>{t('orderDetails.camera.confirmDone')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={ms.skipBtn}
              onPress={() => { setSkipCode(''); setSkipNote(''); setShowSkipModal(true); }}
              activeOpacity={0.7}>
              <Text style={[ms.skipBtnText, {color: colors.textSecondary}]}>{t('orderDetails.camera.skip')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Skip reason modal */}
      <Modal visible={showSkipModal} transparent animationType="fade" onRequestClose={() => setShowSkipModal(false)}>
        <View style={ms.overlay}>
          <View style={[ms.box, {backgroundColor: colors.card}]}>
            <Text style={ms.warningIcon}>📝</Text>
            <Text style={[ms.boxTitle, {color: colors.textPrimary}]}>{t('orderDetails.camera.skipTitle')}</Text>
            <Text style={[ms.boxBody, {color: colors.textSecondary}]}>{t('orderDetails.camera.skipBody')}</Text>

            <View style={{gap: 6, marginTop: 8}}>
              {SKIP_REASONS.map(({key, code}) => {
                const isSel = skipCode === code;
                return (
                  <TouchableOpacity
                    key={code}
                    onPress={() => setSkipCode(code)}
                    activeOpacity={0.75}
                    style={{
                      flexDirection:   'row',
                      alignItems:      'center',
                      gap:             10,
                      padding:         12,
                      borderRadius:    10,
                      borderWidth:     1.5,
                      borderColor:     isSel ? colors.primary : colors.border,
                      backgroundColor: isSel ? colors.primary + '15' : colors.bg,
                    }}>
                    <View style={{
                      width: 18, height: 18, borderRadius: 9, borderWidth: 2,
                      borderColor: isSel ? colors.primary : colors.border,
                      alignItems: 'center', justifyContent: 'center',
                    }}>
                      {isSel && <View style={{width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary}} />}
                    </View>
                    <Text style={{color: isSel ? colors.primary : colors.textPrimary, fontWeight: '600'}}>
                      {t(`orderDetails.camera.skipReasons.${key}`)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {skipCode === 'OTHER' && (
              <TextInput
                style={[ms.reasonInput, {borderColor: skipNote.trim() ? colors.primary : colors.border, color: colors.textPrimary, marginTop: 10}]}
                placeholder={t('orderDetails.camera.skipPlaceholder')}
                placeholderTextColor={colors.textSecondary}
                value={skipNote}
                onChangeText={setSkipNote}
                multiline
                numberOfLines={3}
              />
            )}

            <View style={ms.btnRow}>
              <TouchableOpacity
                style={[ms.secondaryBtn, {backgroundColor: colors.bg, borderColor: colors.border}]}
                onPress={() => setShowSkipModal(false)}>
                <Text style={[ms.secondaryBtnText, {color: colors.textPrimary}]}>{t('orderDetails.cancel.back')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[ms.dangerBtn, (!skipCode || (skipCode === 'OTHER' && !skipNote.trim())) && {opacity: 0.4}]}
                onPress={handleSkipConfirm}
                disabled={!skipCode || (skipCode === 'OTHER' && !skipNote.trim())}>
                <Text style={ms.dangerBtnText}>{t('orderDetails.camera.skipConfirm')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Completed overlay */}
      <CompletedOverlay
        visible={showDoneOverlay}
        earning={d.bikerEarning ?? null}
        onDismiss={() => { setShowDoneOverlay(false); onBack(); }}
        colors={colors}
        t={t}
      />

      {/* Fixed bottom bar — back-to-list (only after completion) */}
      {!dataLoading && currentStatus === 'COMPLETED' && (
        <View style={[s.bottomBar, {backgroundColor: colors.card, borderTopColor: colors.border}]}>
          <TouchableOpacity
            style={[s.bottomPrimaryBtn, {backgroundColor: colors.primary}]}
            onPress={onBack}
            activeOpacity={0.85}>
            <Text style={s.bottomPrimaryText}>{t('orderDetails.backToOrders')}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// ── Completed overlay ─────────────────────────────────────────────────────────
function CompletedOverlay({visible, earning, onDismiss, colors, t}) {
  const scale   = useRef(new Animated.Value(0.7)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;
    Animated.parallel([
      Animated.spring(scale,   {toValue: 1, useNativeDriver: true, tension: 60, friction: 8}),
      Animated.timing(opacity, {toValue: 1, duration: 250, useNativeDriver: true}),
    ]).start();
  }, [visible, scale, opacity]);

  if (!visible) return null;

  return (
    <Modal visible transparent animationType="none" onRequestClose={onDismiss}>
      <Animated.View style={[done.overlay, {opacity}]}>
        <Animated.View style={[done.card, {backgroundColor: colors.card, transform: [{scale}]}]}>
          <Text style={done.emoji}>🎉</Text>
          <Text style={[done.title, {color: colors.textPrimary}]}>{t('orderDetails.completed.title') || 'انتهى الطلب بنجاح!'}</Text>
          <Text style={[done.sub, {color: colors.textSecondary}]}>{t('orderDetails.completed.subtitle') || 'أحسنت! تم إنهاء الطلب وتسجيله.'}</Text>

          {earning != null && (
            <View style={[done.earningBox, {backgroundColor: colors.primary + '15', borderColor: colors.primary + '30'}]}>
              <Text style={[done.earningLabel, {color: colors.textSecondary}]}>{t('orderDetails.completed.earned') || 'أرباحك من هذا الطلب'}</Text>
              <View style={done.earningRow}>
                <RiyalIcon size={24} color={colors.primary} />
                <Text style={[done.earningValue, {color: colors.primary}]}>{earning}</Text>
              </View>
            </View>
          )}

          <TouchableOpacity
            style={[done.btn, {backgroundColor: colors.primary}]}
            onPress={onDismiss}
            activeOpacity={0.85}>
            <Text style={done.btnText}>{t('orderDetails.completed.cta') || 'رائع، العودة للطلبات'}</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

// ── Helper: small photos row ──────────────────────────────────────────────────
function PhotosRow({label, photos, colors}) {
  return (
    <View style={{gap: 6}}>
      <Text style={[s.photoColLabel, {color: colors.textSecondary}]}>{label}</Text>
      <View style={s.photoThumbRow}>
        {photos.slice(0, 4).map((item, i) => (
          <Image
            key={i}
            source={{uri: typeof item === 'string' ? item : item.url ?? item.uri}}
            style={[s.photoThumb, photos.length === 1 && s.photoThumbFull]}
            resizeMode="cover"
          />
        ))}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root:             {flex: 1},
  loadingWrap:      {flex: 1, alignItems: 'center', justifyContent: 'center'},
  header:           {flexDirection: 'row', alignItems: 'center', paddingTop: Platform.OS === 'ios' ? 56 : 48, paddingBottom: 16, paddingHorizontal: 16, borderBottomWidth: 1, gap: 10},
  backBtn:          {width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center'},
  backArrow:        {fontSize: 26, lineHeight: 30},
  headerTitle:      {flex: 1, fontSize: 16, fontWeight: '700', textAlign: 'center'},
  headerNum:        {paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8},
  headerNumText:    {fontSize: 12, fontWeight: '700'},
  scroll:           {flex: 1},
  scrollContent:    {padding: 16, gap: 4},
  section:          {marginBottom: 14},
  detailCard:       {borderRadius: 20, padding: 16, marginBottom: 14, borderWidth: 1, gap: 14},
  clientRow:        {flexDirection: 'row', alignItems: 'flex-start', gap: 10},
  clientName:       {fontSize: 18, fontWeight: '800'},
  scheduledText:    {fontSize: 12},
  phoneBadge:       {flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10},
  phoneText:        {fontSize: 13, fontWeight: '700'},
  infoGrid:         {flexDirection: 'row', flexWrap: 'wrap', gap: 12},
  infoCell:         {width: '47%', gap: 4},
  infoLabel:        {fontSize: 11},
  infoValue:        {fontSize: 13, fontWeight: '700'},
  colorSwatch:      {width: 24, height: 24, borderRadius: 12, borderWidth: 1, marginTop: 2},
  locationRow:      {flexDirection: 'row', alignItems: 'flex-start', gap: 5},
  locationDot:      {width: 8, height: 8, borderRadius: 4, marginTop: 4},
  divider:          {height: 1},
  extrasTitle:      {fontSize: 13, fontWeight: '700', marginBottom: 2},
  extrasRow:        {flexDirection: 'row', flexWrap: 'wrap', gap: 8},
  extraChip:        {flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1.5, borderColor: '#F59E0B', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7},
  extraChipStar:    {fontSize: 10, color: '#F59E0B'},
  extraChipText:    {fontSize: 12, fontWeight: '600'},
  addonsGrid:       {flexDirection: 'row', flexWrap: 'wrap', gap: 10},
  addonCard:        {flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 14, borderWidth: 1, padding: 10, minWidth: '45%', flex: 1},
  addonImg:         {width: 44, height: 44, borderRadius: 10},
  addonInfo:        {flex: 1, gap: 3},
  addonName:        {fontSize: 13, fontWeight: '700'},
  actionBtn:        {marginHorizontal: 16, marginBottom: 12, paddingVertical: 18, borderRadius: 16, alignItems: 'center', justifyContent: 'center'},
  actionBtnText:    {color: '#fff', fontSize: 16, fontWeight: '800'},
  guideCard:        {borderRadius: 20, padding: 20, alignItems: 'center', marginBottom: 14, borderWidth: 1, gap: 10},
  guideImg:         {width: 180, height: 140},
  guideTitle:       {fontSize: 17, fontWeight: '800', textAlign: 'center'},
  guideDesc:        {fontSize: 13, textAlign: 'center', lineHeight: 20},
  // Fixed bottom bar
  bottomBar:        {padding: 16, paddingBottom: Platform.OS === 'ios' ? 32 : 16, borderTopWidth: 1},
  bottomPrimaryBtn: {paddingVertical: 16, borderRadius: 14, alignItems: 'center'},
  bottomPrimaryText:{color: '#fff', fontSize: 16, fontWeight: '700'},
  bottomCancelBtn:  {paddingVertical: 14, borderRadius: 14, alignItems: 'center', borderWidth: 1.5},
  bottomCancelText: {fontSize: 15, fontWeight: '700'},
  photoColLabel:    {fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5},
  photoThumbRow:    {flexDirection: 'row', flexWrap: 'wrap', gap: 6},
  photoThumb:       {width: 70, height: 70, borderRadius: 10},
  photoThumbFull:   {width: '100%', height: 140},
});

const ms = StyleSheet.create({
  overlay:      {flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center', padding: 24},
  box:          {borderRadius: 24, padding: 28, width: '100%', alignItems: 'center'},
  warningIcon:  {fontSize: 44, marginBottom: 10},
  boxTitle:     {fontSize: 20, fontWeight: '800', textAlign: 'center', marginBottom: 10},
  boxBody:      {fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 16},
  reasonInput:  {width: '100%', borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, marginBottom: 16},
  btnRow:       {flexDirection: 'row', gap: 10, width: '100%'},
  secondaryBtn: {flex: 1, paddingVertical: 14, borderRadius: 12, borderWidth: 1, alignItems: 'center'},
  secondaryBtnText:{fontSize: 14, fontWeight: '700'},
  dangerBtn:    {flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: '#EF4444', alignItems: 'center'},
  dangerBtnText:{fontSize: 14, fontWeight: '700', color: '#fff'},
  confirmBtn:   {width: '100%', paddingVertical: 16, borderRadius: 14, alignItems: 'center', marginTop: 8},
  confirmBtnText:{color: '#fff', fontSize: 16, fontWeight: '700'},
  slideOverlay: {flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)'},
  slideSheet:   {borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40},
  slideHandle:  {width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 20},
  slideTitle:   {fontSize: 18, fontWeight: '800', textAlign: 'center', marginBottom: 8},
  slideSubtitle:{fontSize: 13, textAlign: 'center', marginBottom: 20},
  imgGrid:      {flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center', marginBottom: 12},
  imgSlot:      {width: 120, height: 120, borderRadius: 16, borderWidth: 2, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center'},
  imgSlotFilled:{width: 120, height: 120, borderRadius: 16, overflow: 'hidden', position: 'relative'},
  imgPreview:   {width: '100%', height: '100%'},
  removeBtn:    {position: 'absolute', top: 6, right: 6, width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center'},
  photoCount:   {fontSize: 13, textAlign: 'center', marginBottom: 8},
  skipBtn:      {alignSelf: 'center', marginTop: 12, paddingVertical: 8, paddingHorizontal: 20},
  skipBtnText:  {fontSize: 13, fontWeight: '600', textDecorationLine: 'underline'},
});

const done = StyleSheet.create({
  overlay:      {flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', alignItems: 'center', justifyContent: 'center', padding: 28},
  card:         {borderRadius: 28, padding: 32, width: '100%', alignItems: 'center', gap: 12,
                 shadowColor: '#000', shadowOffset: {width: 0, height: 8}, shadowOpacity: 0.15, shadowRadius: 20, elevation: 12},
  emoji:        {fontSize: 64, marginBottom: 4},
  title:        {fontSize: 24, fontWeight: '900', textAlign: 'center'},
  sub:          {fontSize: 14, textAlign: 'center', lineHeight: 22},
  earningBox:   {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                 width: '100%', borderRadius: 16, borderWidth: 1, paddingHorizontal: 20, paddingVertical: 14, marginTop: 4},
  earningLabel: {fontSize: 13, fontWeight: '600'},
  earningRow: {flexDirection: 'row', alignItems: 'center', gap: 4},
  earningValue: {fontSize: 26, fontWeight: '900'},
  btn:          {width: '100%', paddingVertical: 18, borderRadius: 16, alignItems: 'center', marginTop: 8},
  btnText:      {color: '#fff', fontSize: 17, fontWeight: '800'},
});
