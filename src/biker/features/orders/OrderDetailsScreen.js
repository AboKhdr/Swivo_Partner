import React, {useState, useEffect, useCallback} from 'react';
import {
  ActivityIndicator, FlatList, Image, Modal,
  PermissionsAndroid, Platform, ScrollView, StatusBar, StyleSheet,
  Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import {launchCamera} from 'react-native-image-picker';
import {Camera, X} from 'lucide-react-native';
import {useTheme} from '../../../shared/context/ThemeContext';
import {useI18n} from '../../../shared/i18n/I18nContext';
import StatusTracker from '../../../shared/components/StatusTracker';
import {updateOrderStatus, uploadOrderPhoto, skipOrderPhoto, cancelOrder, getOrderById} from '../../../services/orders';
import {SKIP_REASONS} from '../../../shared/constants/skipReasons';


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

export default function OrderDetailsScreen({order, onBack}) {
  const {colors, isDark} = useTheme();
  const {t} = useI18n();
  const [currentStatus, setCurrentStatus] = useState(order.status);
  const [actionLoading, setActionLoading] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [uploadPhase, setUploadPhase] = useState('before'); // 'before' | 'after'
  const [photos, setPhotos] = useState([]);
  const [cancelReason, setCancelReason] = useState('');
  const [showSkipModal, setShowSkipModal] = useState(false);
  const [skipCode, setSkipCode]     = useState('');
  const [skipNote, setSkipNote]     = useState('');
  const [completedOrder, setCompletedOrder] = useState(
    currentStatus === 'COMPLETED' ? order : null,
  );

  const orderId  = order._id ?? order.id;

  const fetchCompleted = useCallback(async () => {
    const res = await getOrderById(orderId);
    if (res.success && res.data?.data) setCompletedOrder(res.data.data);
    else if (res.success && res.data)  setCompletedOrder(res.data);
  }, [orderId]);

  useEffect(() => {
    if (currentStatus === 'COMPLETED') fetchCompleted();
  }, [currentStatus, fetchCompleted]);

  // orderType: 'MOBILE' | 'IN_SHOP' (backend) أو 'mobile'|'onshop' (legacy)
  const isOnshop = (order.orderType ?? order.type ?? '').toUpperCase() === 'IN_SHOP'
    || (order.orderType ?? order.type ?? '') === 'onshop';

  // ── derived display values from real data shape ────────────────────────
  const clientName = order.client
    ? `${order.client.firstName ?? ''} ${order.client.lastName ?? ''}`.trim()
    : '';
  const carBrand    = order.userCar?.brand?.name ?? '';
  const carModel    = order.userCar?.model?.name ?? '';
  const carPlate    = order.userCar?.plateNumber ?? '';
  const carDisplay  = [carBrand, carModel].filter(Boolean).join(' ');
  const address     = order.addressSnapshot?.addressText
    ?? order.addressSnapshot?.district
    ?? order.branch?.address
    ?? '';
  const firstItem   = order.itemsSnapshot?.[0];
  const serviceName = firstItem?.nameSnapshot?.ar
    ?? firstItem?.nameSnapshot?.en
    ?? order.service?.name
    ?? '';
  const scheduledAt = order.scheduledAt
    ? new Date(order.scheduledAt).toLocaleString('ar-SA', {
        weekday: 'long', day: '2-digit', month: 'long',
        hour: '2-digit', minute: '2-digit',
      })
    : '';
  const ACTION_NEXT = isOnshop ? ACTION_NEXT_ONSHOP : ACTION_NEXT_MOBILE;

  const canCancel = isOnshop
    ? currentStatus === 'ASSIGNED'
    : currentStatus === 'ASSIGNED' || currentStatus === 'ON_THE_WAY' || currentStatus === 'ARRIVED';
  const actionNextStatus = ACTION_NEXT[currentStatus] ?? null;
  const action = actionNextStatus ? {label: t(`orderDetails.actions.${currentStatus}`), nextStatus: actionNextStatus} : null;

  const actionBgColor =
    currentStatus === 'ASSIGNED'   ? colors.primary  :
    currentStatus === 'ON_THE_WAY' ? colors.success  :
    currentStatus === 'ARRIVED'    ? colors.primary  :
    currentStatus === 'STARTED'    ? colors.purple   : colors.border;

  // The step that triggers the before-photo modal
  const photoTriggerStep = isOnshop ? 'ASSIGNED' : 'ARRIVED';

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
    if (res.success) setCurrentStatus(action.nextStatus);
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
    // Skip request is PENDING manager review — do NOT auto-advance status here.
    // The biker can transition to COMPLETED only after approval (or by uploading photos).
    setSkipCode('');
    setSkipNote('');
    setActionLoading(false);
    // Refresh order to reflect proof.afterSkipRequest.status === 'PENDING'
    if (res?.success) {
      const r = await getOrderById(orderId);
      if (r?.success) setCurrentStatus(r.data?.data?.status || currentStatus);
    }
  };

  const handleCancel = async () => {
    setShowCancelModal(false);
    setActionLoading(true);
    await cancelOrder(orderId, cancelReason.trim());
    setCurrentStatus('CANCELLED');
    setActionLoading(false);
  };

  return (
    <View style={[s.root, {backgroundColor: colors.bg}]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.card} />
      <View style={[s.header, {backgroundColor: colors.card, borderBottomColor: colors.border}]}>
        <TouchableOpacity style={[s.backBtn, {backgroundColor: colors.bg}]} onPress={onBack} hitSlop={{top:12,bottom:12,left:12,right:12}}>
          <Text style={[s.backArrow, {color: colors.textPrimary}]}>‹</Text>
        </TouchableOpacity>
        <Text style={[s.headerTitle, {color: colors.textPrimary}]}>{t('orderDetails.title')}</Text>
        <View style={[s.headerNum, {backgroundColor: colors.primary + '15'}]}>
          <Text style={[s.headerNumText, {color: colors.primary}]}>#{order.orderNumber}</Text>
        </View>
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={s.section}>
          <StatusTracker status={currentStatus} orderType={isOnshop ? 'onshop' : 'mobile'} />
        </View>

        {STEP_IMGS[currentStatus] && ACTION_NEXT[currentStatus] !== undefined && (
          <View style={[s.guideCard, {backgroundColor: colors.card, borderColor: colors.border}]}>
            <Image source={STEP_IMGS[currentStatus]} style={s.guideImg} resizeMode="contain" />
            <Text style={[s.guideTitle, {color: colors.textPrimary}]}>{t(`orderDetails.steps.${currentStatus}.title`)}</Text>
            <Text style={[s.guideDesc, {color: colors.textSecondary}]}>{t(`orderDetails.steps.${currentStatus}.desc`)}</Text>
          </View>
        )}

        <View style={[s.detailCard, {backgroundColor: colors.card, borderColor: colors.border}]}>
          <Text style={[s.clientName, {color: colors.textPrimary}]}>{clientName}</Text>
          {!!scheduledAt && (
            <Text style={[s.infoLabel, {color: colors.textSecondary, marginTop: -8}]}>{scheduledAt}</Text>
          )}

          <View style={s.infoGrid}>
            <View style={s.infoCell}>
              <Text style={[s.infoLabel, {color: colors.textSecondary}]}>{t('orders.fields.carType')}</Text>
              <Text style={[s.infoValue, {color: colors.textPrimary}]}>{carDisplay}</Text>
            </View>
            <View style={s.infoCell}>
              <Text style={[s.infoLabel, {color: colors.textSecondary}]}>{t('orders.fields.location')}</Text>
              <View style={s.locationRow}>
                <View style={[s.locationDot, {backgroundColor: colors.primary}]} />
                <Text style={[s.infoValue, {color: colors.textPrimary}]} numberOfLines={1}>{address}</Text>
              </View>
            </View>
            <View style={s.infoCell}>
              <Text style={[s.infoLabel, {color: colors.textSecondary}]}>{t('orders.fields.washType')}</Text>
              <Text style={[s.infoValue, {color: colors.textPrimary}]}>{serviceName}</Text>
            </View>
            <View style={s.infoCell}>
              <Text style={[s.infoLabel, {color: colors.textSecondary}]}>{t('orders.fields.plate')}</Text>
              <Text style={[s.infoValue, {color: colors.textPrimary}]}>{carPlate}</Text>
            </View>
          </View>

          <View style={[s.divider, {backgroundColor: colors.border}]} />

          {/* itemsSnapshot — عناصر الخدمة كـ chips */}
          {order.itemsSnapshot && order.itemsSnapshot.length > 1 && (
            <View>
              <Text style={[s.extrasTitle, {color: colors.textPrimary}]}>{t('orders.fields.extras')}</Text>
              <View style={s.extrasRow}>
                {order.itemsSnapshot.slice(1).map((item, i) => (
                  <View key={i} style={s.extraChip}>
                    <Text style={s.extraChipStar}>✦</Text>
                    <Text style={[s.extraChipText, {color: colors.textPrimary}]}>
                      {item.nameSnapshot?.ar ?? item.nameSnapshot?.en ?? ''}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

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

        {currentStatus === 'COMPLETED' && completedOrder && (() => {
          const co = completedOrder;
          // support both new shape (car/client/services/location) and old shape
          const cName  = co.client?.name
            ?? (co.client ? `${co.client.firstName ?? ''} ${co.client.lastName ?? ''}`.trim() : '');
          const cPhone = co.client?.phoneNumber ?? '';
          const cPlate = co.car?.plateNumber ?? co.userCar?.plateNumber ?? '';
          const cBrand = co.car?.brand ?? co.userCar?.brand?.name ?? '';
          const cModel = co.car?.model ?? co.userCar?.model?.name ?? '';
          const cColor = co.car?.color?.ar ?? co.car?.color?.en ?? '';
          const cAddr  = co.location?.addressText ?? co.location?.district
            ?? co.addressSnapshot?.addressText ?? co.addressSnapshot?.district ?? '';
          const services = co.services ?? [];
          const beforePhotos = co.proof?.beforePhotos ?? [];
          const afterPhotos  = co.proof?.afterPhotos  ?? [];

          const firstSvcName = services[0]?.name?.ar ?? services[0]?.name?.en ?? serviceName;

          return (
            <View style={[s.summaryCard, {backgroundColor: colors.card, borderColor: colors.border}]}>

              {/* Header — client + service type */}
              <View style={s.summaryHeader}>
                <View style={{flex: 1, gap: 4}}>
                  {!!cName && (
                    <Text style={[s.summaryClientName, {color: colors.textPrimary}]}>{cName}</Text>
                  )}
                  {!!firstSvcName && (
                    <View style={[s.svcBadge, {backgroundColor: colors.primary + '15'}]}>
                      <Text style={[s.svcBadgeText, {color: colors.primary}]}>{firstSvcName}</Text>
                    </View>
                  )}
                </View>
                <View style={[s.completedBadge, {backgroundColor: '#22C55E15'}]}>
                  <Text style={[s.completedBadgeText, {color: '#22C55E'}]}>{t('orders.status.COMPLETED')}</Text>
                </View>
              </View>

              <View style={[s.divider, {backgroundColor: colors.border}]} />

              {/* Car */}
              {(!!cBrand || !!cModel || !!cPlate) && (
                <View style={s.summaryRow}>
                  <Text style={[s.summaryRowLabel, {color: colors.textSecondary}]}>{t('orders.fields.carType')}</Text>
                  <Text style={[s.summaryRowValue, {color: colors.textPrimary}]}>
                    {[cBrand, cModel, cColor].filter(Boolean).join(' ')}{cPlate ? ` · ${cPlate}` : ''}
                  </Text>
                </View>
              )}

              {/* Location */}
              {!!cAddr && (
                <View style={s.summaryRow}>
                  <Text style={[s.summaryRowLabel, {color: colors.textSecondary}]}>{t('orders.fields.location')}</Text>
                  <Text style={[s.summaryRowValue, {color: colors.textPrimary}]}>{cAddr}</Text>
                </View>
              )}

              {/* Extra services */}
              {services.length > 1 && (
                <View style={s.summaryRow}>
                  <Text style={[s.summaryRowLabel, {color: colors.textSecondary}]}>{t('orders.fields.extras')}</Text>
                  <View style={s.servicesWrap}>
                    {services.slice(1).map((svc, i) => (
                      <View key={i} style={[s.svcChip, {borderColor: colors.border, backgroundColor: colors.bg}]}>
                        <Text style={[s.svcChipText, {color: colors.textPrimary}]}>
                          {svc.name?.ar ?? svc.name?.en ?? ''}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Before / After photos side by side */}
              {(beforePhotos.length > 0 || afterPhotos.length > 0) && (
                <View style={s.photosGrid}>
                  {beforePhotos.length > 0 && (
                    <View style={s.photoCol}>
                      <Text style={[s.photoColLabel, {color: colors.textSecondary}]}>{t('orderDetails.summary.beforePhotos')}</Text>
                      <View style={s.photoThumbRow}>
                        {beforePhotos.slice(0, 4).map((item, i) => (
                          <Image
                            key={`b${i}`}
                            source={{uri: typeof item === 'string' ? item : item.url ?? item.uri}}
                            style={[s.photoThumb, beforePhotos.length === 1 && s.photoThumbFull]}
                            resizeMode="cover"
                          />
                        ))}
                      </View>
                    </View>
                  )}
                  {afterPhotos.length > 0 && (
                    <View style={s.photoCol}>
                      <Text style={[s.photoColLabel, {color: colors.textSecondary}]}>{t('orderDetails.summary.afterPhotos')}</Text>
                      <View style={s.photoThumbRow}>
                        {afterPhotos.slice(0, 4).map((item, i) => (
                          <Image
                            key={`a${i}`}
                            source={{uri: typeof item === 'string' ? item : item.url ?? item.uri}}
                            style={[s.photoThumb, afterPhotos.length === 1 && s.photoThumbFull]}
                            resizeMode="cover"
                          />
                        ))}
                      </View>
                    </View>
                  )}
                </View>
              )}
            </View>
          );
        })()}

        <View style={{height: 24}} />
      </ScrollView>

      <Modal visible={showCancelModal} transparent animationType="fade" onRequestClose={() => setShowCancelModal(false)}>
        <View style={ms.overlay}>
          <View style={[ms.box, {backgroundColor: colors.card}]}>
            <Text style={ms.warningIcon}>⚠️</Text>
            <Text style={[ms.boxTitle, {color: colors.textPrimary}]}>{t('orderDetails.cancel.button')}</Text>
            <Text style={[ms.boxBody, {color: colors.textSecondary}]}>{t('orderDetails.cancel.confirm')}</Text>
            <TextInput style={[ms.reasonInput, {borderColor: colors.border, color: colors.textPrimary}]} placeholder={t('orderDetails.cancel.reason')} placeholderTextColor={colors.textSecondary} value={cancelReason} onChangeText={setCancelReason} textAlign="right" />
            <View style={ms.btnRow}>
              <TouchableOpacity style={[ms.secondaryBtn, {backgroundColor: colors.bg, borderColor: colors.border}]} onPress={() => setShowCancelModal(false)}><Text style={[ms.secondaryBtnText, {color: colors.textPrimary}]}>{t('orderDetails.cancel.back')}</Text></TouchableOpacity>
              <TouchableOpacity style={ms.dangerBtn} onPress={handleCancel}><Text style={ms.dangerBtnText}>{t('orderDetails.cancel.yes')}</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
                      flexDirection:    'row',
                      alignItems:       'center',
                      gap:              10,
                      padding:          12,
                      borderRadius:     10,
                      borderWidth:      1.5,
                      borderColor:      isSel ? colors.primary : colors.border,
                      backgroundColor:  isSel ? colors.primary + '15' : colors.bg,
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

      {currentStatus === 'COMPLETED' && (
        <View style={[s.backBtnWrap, {backgroundColor: colors.card, borderTopColor: colors.border}]}>
          <TouchableOpacity style={[s.backToListBtn, {backgroundColor: colors.primary}]} onPress={onBack}>
            <Text style={s.backToListText}>{t('orderDetails.backToOrders')}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: {flex: 1},
  header: {flexDirection: 'row', alignItems: 'center', paddingTop: Platform.OS === 'ios' ? 56 : 48, paddingBottom: 16, paddingHorizontal: 16, borderBottomWidth: 1, gap: 10},
  backBtn: {width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center'},
  backArrow: {fontSize: 26, lineHeight: 30},
  headerTitle: {flex: 1, fontSize: 16, fontWeight: '700', textAlign: 'center'},
  headerNum: {paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8},
  headerNumText: {fontSize: 12, fontWeight: '700'},
  scroll: {flex: 1},
  scrollContent: {padding: 16, gap: 4},
  section: {marginBottom: 14},
  detailCard: {borderRadius: 20, padding: 16, marginBottom: 14, borderWidth: 1, gap: 14},
  clientName: {fontSize: 18, fontWeight: '800'},
  infoGrid: {flexDirection: 'row', flexWrap: 'wrap', gap: 12},
  infoCell: {width: '47%', gap: 4},
  infoLabel: {fontSize: 11},
  infoValue: {fontSize: 13, fontWeight: '700'},
  locationRow: {flexDirection: 'row', alignItems: 'center', gap: 5},
  locationDot: {width: 8, height: 8, borderRadius: 4},
  divider: {height: 1},
  extrasTitle: {fontSize: 13, fontWeight: '700', marginBottom: 8},
  extrasRow: {flexDirection: 'row', flexWrap: 'wrap', gap: 8},
  extraChip: {flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1.5, borderColor: '#F59E0B', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7},
  extraChipStar: {fontSize: 10, color: '#F59E0B'},
  extraChipText: {fontSize: 12, fontWeight: '600'},
  actionBtn: {marginHorizontal: 16, marginBottom: 12, paddingVertical: 18, borderRadius: 16, alignItems: 'center', justifyContent: 'center'},
  actionBtnText: {color: '#fff', fontSize: 16, fontWeight: '800'},
  guideCard: {borderRadius: 20, padding: 20, alignItems: 'center', marginBottom: 14, borderWidth: 1, gap: 10},
  guideImg: {width: 180, height: 140},
  guideTitle: {fontSize: 17, fontWeight: '800', textAlign: 'center'},
  guideDesc: {fontSize: 13, textAlign: 'center', lineHeight: 20},
  backBtnWrap: {padding: 16, paddingBottom: Platform.OS === 'ios' ? 32 : 16, borderTopWidth: 1},
  backToListBtn: {paddingVertical: 16, borderRadius: 14, alignItems: 'center'},
  backToListText: {color: '#fff', fontSize: 16, fontWeight: '700'},
  summaryCard:       {borderRadius: 20, padding: 16, marginBottom: 14, borderWidth: 1, gap: 14},
  summaryTitle:      {fontSize: 16, fontWeight: '800'},
  summaryRow:        {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8},
  summaryRowLabel:   {fontSize: 12, flex: 1},
  summaryRowValue:   {fontSize: 13, fontWeight: '700', flex: 2},
  photoSection:      {gap: 8},
  photoSectionLabel: {fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5},
  photoRow:          {gap: 10, paddingVertical: 4},
  summaryPhoto:      {width: 110, height: 110, borderRadius: 14},
  servicesWrap:      {flexDirection: 'row', flexWrap: 'wrap', gap: 8},
  svcChip:           {borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8, gap: 2},
  svcChipText:       {fontSize: 13, fontWeight: '700'},
  svcCategory:       {fontSize: 11},
});

const ms = StyleSheet.create({
  overlay: {flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center', padding: 24},
  box: {borderRadius: 24, padding: 28, width: '100%', alignItems: 'center'},
  warningIcon: {fontSize: 44, marginBottom: 10},
  boxTitle: {fontSize: 20, fontWeight: '800', textAlign: 'center', marginBottom: 10},
  boxBody: {fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 16},
  reasonInput: {width: '100%', borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, marginBottom: 16},
  btnRow: {flexDirection: 'row', gap: 10, width: '100%'},
  secondaryBtn: {flex: 1, paddingVertical: 14, borderRadius: 12, borderWidth: 1, alignItems: 'center'},
  secondaryBtnText: {fontSize: 14, fontWeight: '700'},
  dangerBtn: {flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: '#EF4444', alignItems: 'center'},
  dangerBtnText: {fontSize: 14, fontWeight: '700', color: '#fff'},
  confirmBtn: {width: '100%', paddingVertical: 16, borderRadius: 14, alignItems: 'center', marginTop: 8},
  confirmBtnText: {color: '#fff', fontSize: 16, fontWeight: '700'},
  slideOverlay: {flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)'},
  slideSheet: {borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40},
  slideHandle: {width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 20},
  slideTitle: {fontSize: 18, fontWeight: '800', textAlign: 'center', marginBottom: 8},
  slideSubtitle: {fontSize: 13, textAlign: 'center', marginBottom: 20},
  imgGrid: {flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center', marginBottom: 12},
  imgSlot: {width: 120, height: 120, borderRadius: 16, borderWidth: 2, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center'},
  imgSlotFilled: {width: 120, height: 120, borderRadius: 16, overflow: 'hidden', position: 'relative'},
  imgPreview: {width: '100%', height: '100%'},
  removeBtn: {position: 'absolute', top: 6, right: 6, width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center'},
  photoCount: {fontSize: 13, textAlign: 'center', marginBottom: 8},
  skipBtn: {alignSelf: 'center', marginTop: 12, paddingVertical: 8, paddingHorizontal: 20},
  skipBtnText: {fontSize: 13, fontWeight: '600', textDecorationLine: 'underline'},
});

