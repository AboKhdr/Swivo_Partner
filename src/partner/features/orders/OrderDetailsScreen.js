import React, {useCallback, useEffect, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  PermissionsAndroid,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  ArrowLeft,
  ShoppingBag,
  Phone,
  MapPin,
  Car,
  CreditCard,
  Info,
  Bike,
  CarFront,
  Droplets,
  Sparkles,
  Camera,
  CheckCircle,
  X,
} from 'lucide-react-native';
import {launchCamera} from 'react-native-image-picker';
import {useTheme} from '../../../shared/context/ThemeContext';
import {getOrderById, acceptOrder, rejectOrder, assignBiker, startOnshopOrder, completeOnshopOrder} from '../../../services/partner';
import {uploadToCloudinary} from '../../../services/cloudinary';
import AssignBikerScreen from './AssignBikerScreen';
import RejectOrderModal from './RejectOrderModal';

const TIMELINE_STEPS_MOBILE = [
  {key: 'received', label: 'وصول الطلب',   Icon: CarFront},
  {key: 'arrived',  label: 'وصول البايكر', Icon: MapPin},
  {key: 'started',  label: 'بدء الغسيل',   Icon: Droplets},
  {key: 'done',     label: 'انهاء الغسيل', Icon: Sparkles},
];

const TIMELINE_STEPS_ONSHOP = [
  {key: 'received', label: 'وصول الطلب',   Icon: CarFront},
  {key: 'started',  label: 'بدء الغسيل',   Icon: Droplets},
  {key: 'done',     label: 'انهاء الغسيل', Icon: Sparkles},
];

const STATUS_ACTIVE_STEPS_MOBILE = {
  PENDING_PARTNER: 0,
  ACCEPTED:        1,
  ASSIGNED:        1,
  ON_THE_WAY:      2,
  STARTED:         3,
  COMPLETED:       4,
};

const STATUS_ACTIVE_STEPS_ONSHOP = {
  PENDING_PARTNER: 0,
  ACCEPTED:        1,
  STARTED:         2,
  COMPLETED:       3,
};

async function requestCameraPermission() {
  if (Platform.OS !== 'android') return true;
  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.CAMERA,
      {title: 'إذن الكاميرا', message: 'يحتاج التطبيق إلى الكاميرا لالتقاط الصور'},
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  } catch {
    return false;
  }
}

function PhotoConfirmModal({visible, photo, onConfirm, onRetake, onClose, colors, title}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={pm.overlay}>
        <View style={[pm.card, {backgroundColor: colors.card}]}>
          <TouchableOpacity style={pm.closeBtn} onPress={onClose} activeOpacity={0.75}>
            <X size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          <Text style={[pm.title, {color: colors.textPrimary}]}>{title}</Text>
          {photo ? (
            <Image source={{uri: photo}} style={pm.preview} resizeMode="cover" />
          ) : (
            <View style={[pm.previewEmpty, {backgroundColor: colors.bg}]}>
              <Camera size={40} color={colors.textSecondary} />
            </View>
          )}
          <View style={pm.actions}>
            <TouchableOpacity
              style={[pm.retakeBtn, {borderColor: colors.border}]}
              onPress={onRetake}
              activeOpacity={0.75}>
              <Camera size={16} color={colors.textPrimary} />
              <Text style={[pm.retakeTxt, {color: colors.textPrimary}]}>إعادة</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[pm.confirmBtn, {backgroundColor: colors.primary}]}
              onPress={onConfirm}
              activeOpacity={0.8}>
              <CheckCircle size={16} color="#FFF" />
              <Text style={pm.confirmTxt}>تأكيد</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function OrderDetailsScreen({order, onBack}) {
  const {colors} = useTheme();

  const orderId   = order?._id ?? order?.id;
  const orderType = order?.orderType ?? order?.type ?? 'mobile';

  const [orderData,    setOrderData]    = useState(order ?? null);
  const [loading,      setLoading]      = useState(!order);
  const [status,       setStatus]       = useState(order?.status ?? 'PENDING_PARTNER');
  const [showAssign,   setShowAssign]   = useState(false);
  const [showReject,   setShowReject]   = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Photo states for onshop flow
  const [startPhoto,   setStartPhoto]   = useState(null);
  const [finishPhotos, setFinishPhotos] = useState([]);
  const [pendingPhoto, setPendingPhoto] = useState(null);
  const [photoStage,   setPhotoStage]   = useState(null);

  const isPending   = status === 'PENDING_PARTNER';
  const isAccepted  = status === 'ACCEPTED';
  const isStarted   = status === 'STARTED';
  const isCompleted = status === 'COMPLETED';
  const isOnshop    = orderType === 'onshop' || orderType === 'IN_SHOP';
  const timelineSteps  = isOnshop ? TIMELINE_STEPS_ONSHOP  : TIMELINE_STEPS_MOBILE;
  const activeStepMap  = isOnshop ? STATUS_ACTIVE_STEPS_ONSHOP : STATUS_ACTIVE_STEPS_MOBILE;
  const activeStep     = activeStepMap[status] ?? 0;

  // Load full order details from API if only a summary was passed
  useEffect(() => {
    if (!orderId || orderData?._id) return;
    setLoading(true);
    getOrderById(orderId).then(res => {
      if (res.success) {
        const d = res.data?.data ?? res.data;
        setOrderData(d);
        setStatus(d?.status ?? status);
      }
      setLoading(false);
    });
  }, [orderId]);

  const d = orderData ?? order ?? {};

  // ── Accept ──────────────────────────────────────────────────────────────
  const handleAccept = useCallback(async () => {
    if (orderType === 'mobile') {
      setShowAssign(true);
    } else {
      setActionLoading(true);
      const res = await acceptOrder(orderId);
      if (res.success) setStatus('ACCEPTED');
      setActionLoading(false);
    }
  }, [orderType, orderId]);

  const handleAssigned = useCallback((bikerId) => {
    setShowAssign(false);
    setStatus('ASSIGNED');
  }, []);

  const handleRejectConfirm = useCallback(async (reason) => {
    setShowReject(false);
    setActionLoading(true);
    await rejectOrder(orderId, reason);
    setActionLoading(false);
    onBack();
  }, [orderId, onBack]);

  // ── Camera ───────────────────────────────────────────────────────────────
  const openCamera = useCallback(async (stage) => {
    const allowed = await requestCameraPermission();
    if (!allowed) {
      Alert.alert('تنبيه', 'يرجى منح إذن الكاميرا من الإعدادات');
      return;
    }
    launchCamera({mediaType: 'photo', quality: 0.8, saveToPhotos: false}, res => {
      if (res.didCancel || res.errorCode) return;
      const uri = res.assets?.[0]?.uri;
      if (uri) {
        setPendingPhoto(uri);
        setPhotoStage(stage);
      }
    });
  }, []);

  const handlePhotoConfirm = useCallback(async () => {
    const uri = pendingPhoto;
    const stage = photoStage;
    setPendingPhoto(null);
    setPhotoStage(null);
    if (stage === 'start') {
      setStartPhoto(uri);
      setActionLoading(true);
      const res = await startOnshopOrder(orderId, uri);
      if (res.success) setStatus('STARTED');
      setActionLoading(false);
    } else if (stage === 'finish') {
      setFinishPhotos(prev => [...prev, uri]);
    }
  }, [photoStage, pendingPhoto, orderId]);

  const handlePhotoRetake = useCallback(() => {
    setPendingPhoto(null);
    setPhotoStage(null);
    openCamera(photoStage);
  }, [openCamera, photoStage]);

  const handlePhotoClose = useCallback(() => {
    setPendingPhoto(null);
    setPhotoStage(null);
  }, []);

  const handleFinishOrder = useCallback(async () => {
    if (finishPhotos.length === 0) {
      Alert.alert('تنبيه', 'يرجى التقاط صورة لإنهاء الطلب');
      return;
    }
    setActionLoading(true);
    const res = await completeOnshopOrder(orderId, finishPhotos);
    if (res.success) setStatus('COMPLETED');
    setActionLoading(false);
  }, [finishPhotos, orderId]);

  // ── Photo modal title ────────────────────────────────────────────────────
  const photoModalTitle = photoStage === 'start' ? 'صورة بدء الغسيل' : 'صورة إنهاء الطلب';

  // ── Footer content ────────────────────────────────────────────────────────
  let footerContent = null;

  if (isPending) {
    footerContent = (
      <View style={[s.footer, {backgroundColor: colors.card, borderTopColor: colors.border}]}>
        <View style={s.footerRow}>
          <TouchableOpacity
            style={[s.rejectBtn, {backgroundColor: '#FEE2E2', borderColor: '#FCA5A5'}]}
            onPress={() => setShowReject(true)}
            activeOpacity={0.75}>
            <Text style={[s.rejectText, {color: '#EF4444'}]}>رفض</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.acceptBtn, {backgroundColor: actionLoading ? colors.border : colors.primary}]}
            onPress={handleAccept}
            disabled={actionLoading}
            activeOpacity={0.8}>
            {actionLoading
              ? <ActivityIndicator color="#FFF" />
              : <>
                  {orderType === 'mobile'
                    ? <Bike size={20} color="#FFF" />
                    : <CheckCircle size={20} color="#FFF" />}
                  <Text style={s.acceptBtnText}>
                    {orderType === 'mobile' ? 'قبول وتعيين بايكر' : 'قبول الطلب'}
                  </Text>
                </>
            }
          </TouchableOpacity>
        </View>
      </View>
    );
  } else if (isOnshop && isAccepted) {
    footerContent = (
      <View style={[s.footer, {backgroundColor: colors.card, borderTopColor: colors.border}]}>
        <TouchableOpacity
          style={[s.fullBtn, {backgroundColor: actionLoading ? colors.border : colors.primary}]}
          onPress={() => openCamera('start')}
          disabled={actionLoading}
          activeOpacity={0.8}>
          {actionLoading
            ? <ActivityIndicator color="#FFF" />
            : <><Camera size={20} color="#FFF" /><Text style={s.fullBtnText}>بدء الغسيل والتقاط صورة</Text></>
          }
        </TouchableOpacity>
      </View>
    );
  } else if (isOnshop && isStarted) {
    footerContent = (
      <View style={[s.footer, {backgroundColor: colors.card, borderTopColor: colors.border}]}>
        <View style={s.footerCol}>
          <View style={s.finishPhotosRow}>
            {finishPhotos.map((uri, i) => (
              <Image key={i} source={{uri}} style={s.thumbImg} />
            ))}
            {finishPhotos.length < 3 && (
              <TouchableOpacity
                style={[s.thumbAdd, {backgroundColor: colors.primary + '15', borderColor: colors.primary}]}
                onPress={() => openCamera('finish')}
                activeOpacity={0.75}>
                <Camera size={18} color={colors.primary} />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity
            style={[s.fullBtn, {
              backgroundColor: finishPhotos.length > 0 && !actionLoading ? colors.primary : colors.border,
            }]}
            onPress={handleFinishOrder}
            disabled={finishPhotos.length === 0 || actionLoading}
            activeOpacity={0.8}>
            {actionLoading
              ? <ActivityIndicator color="#FFF" />
              : <><Sparkles size={20} color="#FFF" /><Text style={s.fullBtnText}>إنهاء الطلب</Text></>
            }
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Derived display values from API response
  const orderNumber  = d.orderNumber ?? d._id ?? '';
  const serviceName  =
    d.itemsSnapshot?.[0]?.nameSnapshot?.ar
    ?? d.itemsSnapshot?.[0]?.nameSnapshot?.en
    ?? d.items?.[0]?.service?.name?.ar
    ?? d.items?.[0]?.service?.name?.en
    ?? d.items?.[0]?.name?.ar
    ?? d.items?.[0]?.name?.en
    ?? d.service?.name?.ar
    ?? d.service?.name?.en
    ?? (typeof d.service?.name === 'string' ? d.service.name : '')
    ?? '';
  const branchName   = d.branch?.name?.ar ?? d.branch?.name?.en ?? (typeof d.branch?.name === 'string' ? d.branch.name : '') ?? '';
  const clientName   = d.client
    ? `${d.client.firstName ?? ''} ${d.client.lastName ?? ''}`.trim()
    : '';
  const clientPhone  = d.client?.phoneNumber ?? '';
  const carDesc      = [
    d.userCar?.brand?.name?.ar ?? d.userCar?.brand?.name?.en ?? (typeof d.userCar?.brand?.name === 'string' ? d.userCar.brand.name : ''),
    d.userCar?.model?.name?.ar ?? d.userCar?.model?.name?.en ?? (typeof d.userCar?.model?.name === 'string' ? d.userCar.model.name : ''),
  ].filter(Boolean).join(' ');
  const plate        = d.userCar?.plate ?? d.plate ?? '';
  const price        = d.tenantNetSnapshot ?? d.totalAmount ?? '';
  const notes        = d.notes ?? '';
  const scheduledAt  = d.scheduledAt
    ? new Date(d.scheduledAt).toLocaleTimeString('ar-SA', {hour: '2-digit', minute: '2-digit'})
    : '';

  const fmt = ts => ts ? new Date(ts).toLocaleTimeString('ar-SA', {hour: '2-digit', minute: '2-digit'}) : '';
  const timelineTimestamps = isOnshop
    ? [
        fmt(d.createdAt),
        fmt(d.startedAt),
        fmt(d.completedAt ?? d.finishedAt),
      ]
    : [
        fmt(d.createdAt),
        fmt(d.arrivedAt ?? d.bikerArrivedAt),
        fmt(d.startedAt),
        fmt(d.completedAt ?? d.finishedAt),
      ];

  return (
    <View style={[s.root, {backgroundColor: colors.bg}]}>
      <View style={[s.header, {backgroundColor: colors.bg}]}>
        <TouchableOpacity onPress={onBack} style={s.backBtn} activeOpacity={0.75}>
          <ArrowLeft size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, {color: colors.textPrimary}]}>
          {orderNumber ? `#${orderNumber}` : 'تفاصيل الطلب'}
        </Text>
        {isOnshop && (
          <View style={[s.typeBadge, {backgroundColor: colors.primary + '18'}]}>
            <Text style={[s.typeBadgeText, {color: colors.primary}]}>في الموقع</Text>
          </View>
        )}
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent}>

        {/* Service card */}
        <View style={[s.card, {backgroundColor: colors.card, borderColor: colors.border}]}>
          <View style={s.cardRow}>
            <View style={[s.iconBox, {backgroundColor: colors.primary + '15'}]}>
              <ShoppingBag size={20} color={colors.primary} />
            </View>
            <View style={s.cardInfo}>
              {!!scheduledAt && <Text style={[s.cardTime, {color: colors.textSecondary}]}>{scheduledAt}</Text>}
              <Text style={[s.cardTitle, {color: colors.textPrimary}]}>{serviceName || 'خدمة'}</Text>
              {!!branchName && <Text style={[s.cardSub, {color: colors.textSecondary}]}>فرع: {branchName}</Text>}
            </View>
          </View>
        </View>

        {/* Customer card */}
        <View style={[s.card, {backgroundColor: colors.card, borderColor: colors.border}]}>
          <View style={s.cardRow}>
            <View style={[s.avatar, {backgroundColor: colors.primary + '15'}]}>
              <Text style={[s.avatarText, {color: colors.primary}]}>
                {(clientName || 'ع').charAt(0)}
              </Text>
            </View>
            <View style={s.cardInfo}>
              <Text style={[s.cardTitle, {color: colors.textPrimary}]}>{clientName || '—'}</Text>
              {!!clientPhone && <Text style={[s.cardSub, {color: colors.textSecondary}]}>{clientPhone}</Text>}
            </View>
            {!!clientPhone && (
              <TouchableOpacity
                style={[s.phoneBtn, {backgroundColor: colors.bg, borderColor: colors.border}]}
                activeOpacity={0.75}
                onPress={() => {
                  const {Linking} = require('react-native');
                  Linking.openURL(`tel:${clientPhone}`);
                }}>
                <Phone size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Car card */}
        <View style={[s.card, {backgroundColor: colors.card, borderColor: colors.border}]}>
          <View style={s.cardRow}>
            <View style={[s.iconBox, {backgroundColor: colors.primary + '15'}]}>
              <Car size={20} color={colors.primary} />
            </View>
            <View style={s.cardInfo}>
              {!!carDesc && <Text style={[s.cardTitle, {color: colors.textPrimary}]}>{carDesc}</Text>}
              {!!plate && (
                <View style={[s.plateBadge, {backgroundColor: colors.bg, borderColor: colors.border}]}>
                  <Text style={[s.plateText, {color: colors.textPrimary}]}>{plate}</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Map card — only for mobile orders */}
        {orderType === 'mobile' && (
          <View style={[s.card, {backgroundColor: colors.card, borderColor: colors.border}]}>
            <View style={[s.mapPlaceholder, {backgroundColor: colors.bg}]}>
              <View style={[s.mapDot, {backgroundColor: colors.primary}]} />
            </View>
            <View style={s.mapBottom}>
              <View style={s.mapDistCol}>
                <Text style={[s.mapDist, {color: colors.primary}]}>{d.distanceKm ? `${d.distanceKm} km` : '—'}</Text>
                <Text style={[s.mapTime, {color: colors.textSecondary}]}>{d.estimatedMinutes ? `${d.estimatedMinutes} min` : ''}</Text>
              </View>
              <View style={s.mapAddrCol}>
                <View style={s.mapAddrRow}>
                  <MapPin size={14} color={colors.primary} />
                  <Text style={[s.mapAddrTitle, {color: colors.textPrimary}]}>
                    {d.addressSnapshot?.district ?? d.addressSnapshot?.addressText ?? '—'}
                  </Text>
                </View>
                <Text style={[s.mapAddrSub, {color: colors.textSecondary}]}>
                  {d.addressSnapshot?.addressText ?? ''}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Start photo preview — onshop started */}
        {isOnshop && startPhoto && (
          <>
            <Text style={[s.sectionLabel, {color: colors.textPrimary}]}>صورة قبل الغسيل</Text>
            <View style={[s.card, {backgroundColor: colors.card, borderColor: colors.border, padding: 8}]}>
              <Image source={{uri: startPhoto}} style={s.photoPreview} resizeMode="cover" />
            </View>
          </>
        )}

        {/* Finish photos preview — onshop completed */}
        {isOnshop && finishPhotos.length > 0 && (
          <>
            <Text style={[s.sectionLabel, {color: colors.textPrimary}]}>صور بعد الغسيل</Text>
            <View style={[s.card, {backgroundColor: colors.card, borderColor: colors.border}]}>
              <View style={s.finishPhotosPreviewRow}>
                {finishPhotos.map((uri, i) => (
                  <Image key={i} source={{uri}} style={s.photoThumb} resizeMode="cover" />
                ))}
              </View>
            </View>
          </>
        )}

        {/* Payment card */}
        <Text style={[s.sectionLabel, {color: colors.textPrimary}]}>عملية الدفع</Text>
        <View style={[s.card, {backgroundColor: colors.card, borderColor: colors.border}]}>
          <View style={s.payRow}>
            <View style={s.payTextCol}>
              <Text style={[s.payAmount, {color: colors.textPrimary}]}>{price ? `${price} ر.س` : '—'}</Text>
              <Text style={[s.cardSub, {color: colors.textSecondary}]}>تمت عملية الدفع عن طريق: بطاقة الائتمان</Text>
            </View>
            <View style={[s.payIconBox, {backgroundColor: colors.primary + '15'}]}>
              <CreditCard size={22} color={colors.primary} />
            </View>
          </View>
        </View>

        {/* Customer notes */}
        <Text style={[s.sectionLabel, {color: colors.textPrimary}]}>ملاحظات الزبون</Text>
        <View style={[s.card, {backgroundColor: colors.card, borderColor: colors.border}]}>
          <View style={s.notesRow}>
            <View style={[s.notesIconBox, {backgroundColor: colors.bg, borderColor: colors.border}]}>
              <Info size={16} color={colors.primary} />
            </View>
            <Text style={[s.notesText, {color: colors.textPrimary}]}>
              {notes || '—'}
            </Text>
          </View>
        </View>

        {/* Timeline */}
        <Text style={[s.sectionLabel, {color: colors.textPrimary}]}>وقت العملية</Text>
        <View style={s.timelineRow}>
          {timelineSteps.map((step, i) => {
            const {Icon} = step;
            const isActive    = i < activeStep;
            const isCurrent   = i === activeStep - 1;
            const highlighted = isActive || isCurrent;
            const lineActive  = i < activeStep - 1;
            return (
              <React.Fragment key={step.key}>
                <View style={s.timelineStep}>
                  <View style={[
                    s.timelineIconBox,
                    highlighted
                      ? {backgroundColor: colors.primary + '18', borderColor: colors.primary, borderWidth: 1.5}
                      : {backgroundColor: colors.card, elevation: 3, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: {width: 0, height: 2}},
                  ]}>
                    <Icon size={22} color={highlighted ? colors.primary : colors.textSecondary} />
                  </View>
                  <Text style={[s.timelineLabel, {color: colors.textPrimary}]}>{step.label}</Text>
                  <Text style={[s.timelineTime, {color: colors.textSecondary}]}>{timelineTimestamps[i] || ''}</Text>
                </View>
                {i < timelineSteps.length - 1 && (
                  <View style={[s.timelineConnector, {backgroundColor: lineActive ? colors.primary : colors.border}]} />
                )}
              </React.Fragment>
            );
          })}
        </View>

        {/* Completed banner */}
        {isCompleted && (
          <View style={[s.completedBanner, {backgroundColor: '#22C55E18', borderColor: '#22C55E40'}]}>
            <CheckCircle size={20} color="#22C55E" />
            <Text style={[s.completedText, {color: '#22C55E'}]}>تم إنهاء الطلب بنجاح</Text>
          </View>
        )}

        <View style={s.bottomPad} />
      </ScrollView>
      )}

      {footerContent}

      <AssignBikerScreen
        visible={showAssign}
        orderId={orderId}
        onClose={() => setShowAssign(false)}
        onAssigned={handleAssigned}
      />

      <RejectOrderModal
        visible={showReject}
        onClose={() => setShowReject(false)}
        onConfirm={handleRejectConfirm}
      />

      <PhotoConfirmModal
        visible={!!pendingPhoto}
        photo={pendingPhoto}
        onConfirm={handlePhotoConfirm}
        onRetake={handlePhotoRetake}
        onClose={handlePhotoClose}
        colors={colors}
        title={photoModalTitle}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root:            {flex: 1},
  center:          {flex: 1, alignItems: 'center', justifyContent: 'center'},
  header:          {flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16, gap: 8},
  backBtn:         {width: 36, height: 36, alignItems: 'center', justifyContent: 'center'},
  headerTitle:     {flex: 1, fontSize: 17, fontWeight: '800'},
  typeBadge:       {paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20},
  typeBadgeText:   {fontSize: 11, fontWeight: '700'},
  scroll:          {flex: 1},
  scrollContent:   {paddingHorizontal: 16, paddingTop: 4},
  card:            {borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 12},
  cardRow:         {flexDirection: 'row', alignItems: 'center', gap: 14},
  iconBox:         {width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center'},
  cardInfo:        {flex: 1, gap: 4},
  cardTime:        {fontSize: 12},
  cardTitle:       {fontSize: 15, fontWeight: '700'},
  cardSub:         {fontSize: 12},
  avatar:          {width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center'},
  avatarText:      {fontSize: 20, fontWeight: '800'},
  phoneBtn:        {width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1},
  plateBadge:      {alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1, marginTop: 4},
  plateText:       {fontSize: 13, fontWeight: '700', letterSpacing: 1},
  mapPlaceholder:  {height: 130, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 14},
  mapDot:          {width: 14, height: 14, borderRadius: 7},
  mapBottom:       {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'},
  mapDistCol:      {gap: 2},
  mapDist:         {fontSize: 16, fontWeight: '800'},
  mapTime:         {fontSize: 12},
  mapAddrCol:      {gap: 4},
  mapAddrRow:      {flexDirection: 'row', alignItems: 'center', gap: 4},
  mapAddrTitle:    {fontSize: 15, fontWeight: '700'},
  mapAddrSub:      {fontSize: 12},
  photoPreview:    {width: '100%', height: 180, borderRadius: 10},
  photoThumb:      {width: 90, height: 90, borderRadius: 10},
  finishPhotosPreviewRow: {flexDirection: 'row', gap: 8, flexWrap: 'wrap'},
  sectionLabel:    {fontSize: 15, fontWeight: '700', marginBottom: 10, marginTop: 4},
  payRow:          {flexDirection: 'row', alignItems: 'center', gap: 14},
  payTextCol:      {flex: 1, gap: 4},
  payIconBox:      {width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center'},
  payAmount:       {fontSize: 20, fontWeight: '800'},
  notesRow:        {flexDirection: 'row', gap: 12},
  notesIconBox:    {width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1, marginTop: 2},
  notesText:       {flex: 1, fontSize: 13, lineHeight: 22},
  timelineRow:     {flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12, paddingVertical: 8},
  timelineStep:    {alignItems: 'center', flex: 1, gap: 8},
  timelineIconBox: {width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center'},
  timelineConnector: {flex: 0.4, height: 2, alignSelf: 'center', marginBottom: 44},
  timelineLabel:   {fontSize: 9, fontWeight: '600'},
  timelineTime:    {fontSize: 10},
  completedBanner: {flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 8},
  completedText:   {fontSize: 14, fontWeight: '700'},
  footer:          {padding: 16, paddingBottom: 28, borderTopWidth: 1},
  footerCol:       {gap: 10},
  rejectBtn:       {paddingHorizontal: 20, paddingVertical: 14, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center'},
  rejectText:      {fontSize: 15, fontWeight: '800'},
  acceptBtn:       {flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 14, borderRadius: 14},
  acceptBtnText:   {color: '#FFF', fontSize: 16, fontWeight: '800'},
  fullBtn:         {flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16, borderRadius: 16},
  fullBtnText:     {color: '#FFF', fontSize: 16, fontWeight: '800'},
  finishPhotosRow: {flexDirection: 'row', gap: 8},
  thumbImg:        {width: 64, height: 64, borderRadius: 10},
  thumbAdd:        {width: 64, height: 64, borderRadius: 10, borderWidth: 1.5, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center'},
  bottomPad:       {height: 8},
  footerRow:       {flexDirection: 'row', gap: 12},
});

const pm = StyleSheet.create({
  overlay:    {flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', padding: 24},
  card:       {width: '100%', borderRadius: 20, padding: 20, gap: 16},
  closeBtn:   {alignSelf: 'flex-end', padding: 4},
  title:      {fontSize: 17, fontWeight: '800'},
  preview:    {width: '100%', height: 220, borderRadius: 14},
  previewEmpty:{width: '100%', height: 220, borderRadius: 14, alignItems: 'center', justifyContent: 'center'},
  actions:    {flexDirection: 'row', gap: 10},
  retakeBtn:  {flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 14, borderWidth: 1},
  retakeTxt:  {fontSize: 15, fontWeight: '700'},
  confirmBtn: {flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 14},
  confirmTxt: {color: '#FFF', fontSize: 15, fontWeight: '700'},
});
