import React, {useState, useRef} from 'react';
import {
  ActivityIndicator, Animated, Image, Modal, PanResponder,
  PermissionsAndroid, Platform, ScrollView, StatusBar, StyleSheet,
  Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import {launchCamera} from 'react-native-image-picker';
import {ChevronLeft, Camera, X} from 'lucide-react-native';
import {useTheme} from '../../../shared/context/ThemeContext';
import {useI18n} from '../../../shared/i18n/I18nContext';
import StatusTracker from '../../../shared/components/StatusTracker';
import {updateOrderStatus, uploadOrderPhoto, skipOrderPhoto, cancelOrder} from '../../../services/orders';

const SWIPE_WIDTH = 300;
const THUMB = 56;
const MAX_X = SWIPE_WIDTH - THUMB - 4;

function SwipeButton({label, color, onComplete, loading}) {
  const x    = useRef(new Animated.Value(0)).current;
  const [done, setDone] = useState(false);

  // RTL: thumb starts at MAX_X and slides left (dx is negative)
  // LTR: thumb starts at 0 and slides right (dx is positive)
  // We normalise to absolute displacement so the same threshold works both ways.
  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, g) => {
        // Support both RTL (negative dx) and LTR (positive dx)
        const raw = Math.abs(g.dx);
        const nx  = Math.min(raw, MAX_X);
        x.setValue(nx);
      },
      onPanResponderRelease: (_, g) => {
        if (Math.abs(g.dx) >= MAX_X * 0.85) {
          Animated.spring(x, {toValue: MAX_X, useNativeDriver: false}).start(() => {
            setDone(true);
            onComplete();
          });
        } else {
          Animated.spring(x, {toValue: 0, useNativeDriver: false}).start();
        }
      },
    }),
  ).current;

  const trackBg = x.interpolate({
    inputRange:  [0, MAX_X],
    outputRange: [color + '22', color + '44'],
    extrapolate: 'clamp',
  });

  return (
    <Animated.View style={[sw.track, {backgroundColor: trackBg, borderColor: color + '55'}]}>
      <Text style={[sw.label, {color}]}>{done ? '...' : label}</Text>
      <Animated.View
        style={[sw.thumb, {backgroundColor: color, transform: [{translateX: x}]}]}
        {...pan.panHandlers}>
        {loading
          ? <ActivityIndicator size="small" color="#fff" />
          : <ChevronLeft size={22} color="#fff" strokeWidth={2.5} />
        }
      </Animated.View>
    </Animated.View>
  );
}

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
  const [skipReason, setSkipReason] = useState('');

  const isOnshop = order.type === 'onshop';
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
    await updateOrderStatus(order.id, action.nextStatus);
    setCurrentStatus(action.nextStatus);
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
      await uploadOrderPhoto(order.id, uri, uploadPhase);
    }
    await updateOrderStatus(order.id, nextStatus);
    setCurrentStatus(nextStatus);
    setActionLoading(false);
  };

  const handleSkipConfirm = async () => {
    if (!skipReason.trim()) return;
    setShowSkipModal(false);
    setShowImageUpload(false);
    setSkipReason('');
    setActionLoading(true);
    const nextStatus = uploadPhase === 'before' ? 'STARTED' : 'COMPLETED';
    await skipOrderPhoto(order.id, uploadPhase, skipReason.trim());
    await updateOrderStatus(order.id, nextStatus);
    setCurrentStatus(nextStatus);
    setActionLoading(false);
  };

  const handleCancel = async () => {
    setShowCancelModal(false);
    setActionLoading(true);
    await cancelOrder(order.id, cancelReason.trim());
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
          <StatusTracker status={currentStatus} orderType={order.type} />
        </View>

        {STEP_IMGS[currentStatus] && ACTION_NEXT[currentStatus] !== undefined && (
          <View style={[s.guideCard, {backgroundColor: colors.card, borderColor: colors.border}]}>
            <Image source={STEP_IMGS[currentStatus]} style={s.guideImg} resizeMode="contain" />
            <Text style={[s.guideTitle, {color: colors.textPrimary}]}>{t(`orderDetails.steps.${currentStatus}.title`)}</Text>
            <Text style={[s.guideDesc, {color: colors.textSecondary}]}>{t(`orderDetails.steps.${currentStatus}.desc`)}</Text>
          </View>
        )}

        <View style={[s.detailCard, {backgroundColor: colors.card, borderColor: colors.border}]}>
          <Text style={[s.clientName, {color: colors.textPrimary}]}>
            {order.client.firstName} {order.client.lastName}
          </Text>

          <View style={s.infoGrid}>
            <View style={s.infoCell}>
              <Text style={[s.infoLabel, {color: colors.textSecondary}]}>{t('orders.fields.carType')}</Text>
              <Text style={[s.infoValue, {color: colors.textPrimary}]}>{order.car.brand} {order.car.model}</Text>
            </View>
            <View style={s.infoCell}>
              <Text style={[s.infoLabel, {color: colors.textSecondary}]}>{t('orders.fields.location')}</Text>
              <View style={s.locationRow}>
                <View style={[s.locationDot, {backgroundColor: colors.primary}]} />
                <Text style={[s.infoValue, {color: colors.textPrimary}]} numberOfLines={1}>{order.address}</Text>
              </View>
            </View>
            <View style={s.infoCell}>
              <Text style={[s.infoLabel, {color: colors.textSecondary}]}>{t('orders.fields.washType')}</Text>
              <Text style={[s.infoValue, {color: colors.textPrimary}]}>{order.service.name}</Text>
            </View>
            <View style={s.infoCell}>
              <Text style={[s.infoLabel, {color: colors.textSecondary}]}>{t('orders.fields.plate')}</Text>
              <Text style={[s.infoValue, {color: colors.textPrimary}]}>{order.car.plateNumber}</Text>
            </View>
          </View>

          <View style={[s.divider, {backgroundColor: colors.border}]} />

          {order.extras && order.extras.length > 0 && (
            <View>
              <Text style={[s.extrasTitle, {color: colors.textPrimary}]}>{t('orders.fields.extras')}</Text>
              <View style={s.extrasRow}>
                {order.extras.map((ex, i) => (
                  <View key={i} style={s.extraChip}>
                    <Text style={s.extraChipStar}>✦</Text>
                    <Text style={[s.extraChipText, {color: colors.textPrimary}]}>{ex}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

        {action && (
          <View style={s.swipeWrap}>
            <SwipeButton
              key={currentStatus}
              label={action.label}
              color={actionBgColor}
              loading={actionLoading}
              onComplete={handleAction}
            />
          </View>
        )}

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
              onPress={() => { setSkipReason(''); setShowSkipModal(true); }}
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
            <TextInput
              style={[ms.reasonInput, {borderColor: skipReason.trim() ? colors.primary : colors.border, color: colors.textPrimary}]}
              placeholder={t('orderDetails.camera.skipPlaceholder')}
              placeholderTextColor={colors.textSecondary}
              value={skipReason}
              onChangeText={setSkipReason}
              textAlign="right"
              multiline
              numberOfLines={3}
            />
            <View style={ms.btnRow}>
              <TouchableOpacity
                style={[ms.secondaryBtn, {backgroundColor: colors.bg, borderColor: colors.border}]}
                onPress={() => setShowSkipModal(false)}>
                <Text style={[ms.secondaryBtnText, {color: colors.textPrimary}]}>{t('orderDetails.cancel.back')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[ms.dangerBtn, !skipReason.trim() && {opacity: 0.4}]}
                onPress={handleSkipConfirm}
                disabled={!skipReason.trim()}>
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
  swipeWrap: {alignItems: 'center', marginBottom: 12},
  guideCard: {borderRadius: 20, padding: 20, alignItems: 'center', marginBottom: 14, borderWidth: 1, gap: 10},
  guideImg: {width: 180, height: 140},
  guideTitle: {fontSize: 17, fontWeight: '800', textAlign: 'center'},
  guideDesc: {fontSize: 13, textAlign: 'center', lineHeight: 20},
  backBtnWrap: {padding: 16, paddingBottom: Platform.OS === 'ios' ? 32 : 16, borderTopWidth: 1},
  backToListBtn: {paddingVertical: 16, borderRadius: 14, alignItems: 'center'},
  backToListText: {color: '#fff', fontSize: 16, fontWeight: '700'},
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

const sw = StyleSheet.create({
  track: {
    width: SWIPE_WIDTH,
    height: THUMB + 8,
    borderRadius: (THUMB + 8) / 2,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  thumb: {
    position: 'absolute',
    left: 4,
    width: THUMB,
    height: THUMB,
    borderRadius: THUMB / 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
});
