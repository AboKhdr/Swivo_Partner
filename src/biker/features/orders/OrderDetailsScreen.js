import React, {useState, useRef} from 'react';
import {
  ActivityIndicator, Animated, Image, Modal, PanResponder,
  PermissionsAndroid, Platform, ScrollView, StatusBar, StyleSheet,
  Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import {launchCamera} from 'react-native-image-picker';
import {ChevronLeft, Camera, X} from 'lucide-react-native';
import {Colors} from '../../../shared/constants/colors';
import StatusTracker from '../../../shared/components/StatusTracker';

const SWIPE_WIDTH = 300;
const THUMB = 56;
const MAX_X = SWIPE_WIDTH - THUMB - 4;

function SwipeButton({label, color, onComplete, loading}) {
  const x = useRef(new Animated.Value(0)).current;
  const [done, setDone] = useState(false);

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, g) => {
        const nx = Math.max(0, Math.min(g.dx, MAX_X));
        x.setValue(nx);
      },
      onPanResponderRelease: (_, g) => {
        if (g.dx >= MAX_X * 0.85) {
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
    inputRange: [0, MAX_X],
    outputRange: [color + '22', color + '44'],
    extrapolate: 'clamp',
  });

  return (
    <Animated.View style={[sw.track, {backgroundColor: trackBg, borderColor: color + '55'}]}>
      {/* label centered */}
      <Text style={[sw.label, {color}]}>{done ? '...' : label}</Text>

      {/* thumb */}
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

const STEP_GUIDES = {
  ASSIGNED: {
    img: require('../../../assets/steps/1.png'),
    title: 'بدء العملية ؟',
    desc: 'عند استعدادك، اضغط "أنا في الطريق" لإبلاغ العميل ببدء الخدمة والتوجه للموقع.',
  },
  ON_THE_WAY: {
    img: require('../../../assets/steps/2.png'),
    title: 'وصلت إلى موقع العميل ؟',
    desc: 'تحقّق من السيارة وتأكد من مطابقتها واضغط "بدء الغسيل" عند الاستعداد.',
  },
  ARRIVED: {
    img: require('../../../assets/steps/3.png'),
    title: 'لنبدأ الغسيل الان',
    desc: 'تحقق من كل الأدوات الخاصة للغسيل أنها جاهزة، وابدأ الغسيل فوراً.',
  },
  STARTED: {
    img: require('../../../assets/steps/4.png'),
    title: 'إننا نغسل السيارة ✨',
    desc: 'تأكّد من جودة الخدمة ونظافة السيارة. ثم اضغط "انهاء الغسيل".',
  },
  COMPLETED: {
    img: require('../../../assets/steps/5.png'),
    title: 'انتهاء الطلب ✨',
    desc: 'تم إنهاء الخدمة بنجاح. الرجاء إرسال نتائج الغسيل إلى الزبون.',
  },
};

const ACTION_MAP = {
  ASSIGNED:   {label: 'أنا في الطريق',     nextStatus: 'ON_THE_WAY'},
  ON_THE_WAY: {label: 'وصلت — ابدأ الخدمة', nextStatus: 'ARRIVED'},
  ARRIVED:    {label: 'ابدأ الغسيل',        nextStatus: 'STARTED'},
  STARTED:    {label: 'انتهيت — رفع الصور', nextStatus: 'COMPLETED'},
  COMPLETED:  null,
  CANCELLED:  null,
};

export default function OrderDetailsScreen({order, onBack}) {
  const [currentStatus, setCurrentStatus] = useState(order.status);
  const [actionLoading, setActionLoading] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [photos, setPhotos] = useState([]);
  const [cancelReason, setCancelReason] = useState('');

  const canCancel = currentStatus === 'ASSIGNED' || currentStatus === 'ON_THE_WAY' || currentStatus === 'ARRIVED';
  const action = ACTION_MAP[currentStatus];

  const actionBgColor =
    currentStatus === 'ASSIGNED'   ? Colors.primary  :
    currentStatus === 'ON_THE_WAY' ? Colors.success  :
    currentStatus === 'ARRIVED'    ? Colors.primary  :
    currentStatus === 'STARTED'    ? Colors.purple   : Colors.border;

  const handleAction = () => {
    if (!action) return;
    if (currentStatus === 'STARTED') { setShowImageUpload(true); return; }
    setActionLoading(true);
    // TODO: PATCH /api/biker/order/:id/status
    setTimeout(() => { setCurrentStatus(action.nextStatus); setActionLoading(false); }, 900);
  };

  const handleTakePhoto = async () => {
    if (photos.length >= 4) return;
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'صلاحية الكاميرا',
            message: 'التطبيق يحتاج صلاحية الكاميرا لالتقاط صور الإثبات',
            buttonPositive: 'سماح',
            buttonNegative: 'رفض',
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

  const handleCompleteWithPhotos = () => {
    if (photos.length === 0) return;
    setShowImageUpload(false);
    setActionLoading(true);
    setTimeout(() => {
      setCurrentStatus('COMPLETED');
      setActionLoading(false);
      setShowCompletionModal(true);
    }, 1000);
  };

  const handleCancel = () => {
    setShowCancelModal(false);
    setActionLoading(true);
    // TODO: PUT /api/biker/order/:id {action:'cancel', reason}
    setTimeout(() => { setCurrentStatus('CANCELLED'); setActionLoading(false); }, 800);
  };

  return (
    <View style={s.root}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.card} />
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={onBack} hitSlop={{top:12,bottom:12,left:12,right:12}}>
          <Text style={s.backArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>تفاصيل الطلب</Text>
        <View style={s.headerNum}>
          <Text style={s.headerNumText}>#{order.orderNumber}</Text>
        </View>
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Status */}
        <View style={s.section}>
          <StatusTracker status={currentStatus} />
        </View>

        {/* Step Guide */}
        {STEP_GUIDES[currentStatus] && (() => {
          const g = STEP_GUIDES[currentStatus];
          return (
            <View style={s.guideCard}>
              <Image source={g.img} style={s.guideImg} resizeMode="contain" />
              <Text style={s.guideTitle}>{g.title}</Text>
              <Text style={s.guideDesc}>{g.desc}</Text>
            </View>
          );
        })()}

        {/* Order card */}
        <View style={s.detailCard}>
          {/* Client name */}
          <Text style={s.clientName}>
            {order.client.firstName} {order.client.lastName}
          </Text>

          {/* 2×2 info grid */}
          <View style={s.infoGrid}>
            <View style={s.infoCell}>
              <Text style={s.infoLabel}>نوع السيارة</Text>
              <Text style={s.infoValue}>{order.car.brand} {order.car.model}</Text>
            </View>
            <View style={s.infoCell}>
              <Text style={s.infoLabel}>الموقع</Text>
              <View style={s.locationRow}>
                <View style={s.locationDot} />
                <Text style={s.infoValue} numberOfLines={1}>{order.address}</Text>
              </View>
            </View>
            <View style={s.infoCell}>
              <Text style={s.infoLabel}>نوع الغسيل</Text>
              <Text style={s.infoValue}>{order.service.name}</Text>
            </View>
            <View style={s.infoCell}>
              <Text style={s.infoLabel}>اللوحة</Text>
              <Text style={s.infoValue}>{order.car.plateNumber}</Text>
            </View>
          </View>

          {/* Divider */}
          <View style={s.divider} />

          {/* Extras */}
          {order.extras && order.extras.length > 0 && (
            <View>
              <Text style={s.extrasTitle}>الاضافات</Text>
              <View style={s.extrasRow}>
                {order.extras.map((ex, i) => (
                  <View key={i} style={s.extraChip}>
                    <Text style={s.extraChipStar}>✦</Text>
                    <Text style={s.extraChipText}>{ex}</Text>
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

      {/* Cancel Modal */}
      <Modal visible={showCancelModal} transparent animationType="fade" onRequestClose={() => setShowCancelModal(false)}>
        <View style={ms.overlay}>
          <View style={ms.box}>
            <Text style={ms.warningIcon}>⚠️</Text>
            <Text style={ms.boxTitle}>إلغاء الطلب</Text>
            <Text style={ms.boxBody}>هل أنت متأكد من إلغاء الطلب؟{'\n'}هذا الإجراء لا يمكن التراجع عنه</Text>
            <TextInput style={ms.reasonInput} placeholder="سبب الإلغاء (اختياري)" placeholderTextColor={Colors.textSecondary} value={cancelReason} onChangeText={setCancelReason} textAlign="right" />
            <View style={ms.btnRow}>
              <TouchableOpacity style={ms.secondaryBtn} onPress={() => setShowCancelModal(false)}><Text style={ms.secondaryBtnText}>تراجع</Text></TouchableOpacity>
              <TouchableOpacity style={ms.dangerBtn} onPress={handleCancel}><Text style={ms.dangerBtnText}>نعم، إلغاء</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Image Upload Modal */}
      <Modal visible={showImageUpload} transparent animationType="slide" onRequestClose={() => setShowImageUpload(false)}>
        <View style={ms.slideOverlay}>
          <View style={ms.slideSheet}>
            <View style={ms.slideHandle} />
            <Text style={ms.slideTitle}>صور الإثبات</Text>
            <Text style={ms.slideSubtitle}>التقط حتى 4 صور — صورة واحدة على الأقل مطلوبة</Text>

            {/* 2×2 photo grid */}
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
                    style={ms.imgSlot}
                    onPress={handleTakePhoto}
                    disabled={photos.length >= 4}
                    activeOpacity={0.7}>
                    <Camera size={26} color={Colors.textSecondary} strokeWidth={1.5} />
                  </TouchableOpacity>
                );
              })}
            </View>

            {photos.length > 0 && (
              <Text style={ms.photoCount}>{photos.length} / 4 صور</Text>
            )}

            <TouchableOpacity
              style={[ms.confirmBtn, photos.length === 0 && {opacity: 0.4}]}
              onPress={handleCompleteWithPhotos}
              disabled={photos.length === 0}>
              <Text style={ms.confirmBtnText}>تأكيد الإتمام</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Completion Modal */}
      <Modal visible={showCompletionModal} transparent animationType="fade" onRequestClose={() => { setShowCompletionModal(false); onBack(); }}>
        <View style={ms.overlay}>
          <View style={ms.box}>
            <Text style={ms.successIcon}>✅</Text>
            <Text style={ms.boxTitle}>أحسنت! الطلب مكتمل</Text>
            <Text style={ms.earningLine}>أرباحك من هذا الطلب</Text>
            <Text style={ms.earningAmount}>﷼ {order.bikerEarning.toFixed(2)}</Text>
            <TouchableOpacity style={ms.confirmBtn} onPress={() => { setShowCompletionModal(false); onBack(); }}>
              <Text style={ms.confirmBtnText}>العودة للطلبات</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  root: {flex: 1, backgroundColor: Colors.bg},
  header: {flexDirection: 'row', alignItems: 'center', paddingTop: Platform.OS === 'ios' ? 56 : 48, paddingBottom: 16, paddingHorizontal: 16, backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.border, gap: 10},
  backBtn: {width: 36, height: 36, borderRadius: 10, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center'},
  backArrow: {fontSize: 26, color: Colors.textPrimary, lineHeight: 30},
  headerTitle: {flex: 1, fontSize: 16, fontWeight: '700', color: Colors.textPrimary, textAlign: 'center'},
  headerNum: {backgroundColor: Colors.primary + '15', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8},
  headerNumText: {fontSize: 12, fontWeight: '700', color: Colors.primary},
  scroll: {flex: 1},
  scrollContent: {padding: 16, gap: 4},
  section: {marginBottom: 14},
  detailCard: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 14,
  },
  clientName: {fontSize: 18, fontWeight: '800', color: Colors.textPrimary},
  infoGrid: {flexDirection: 'row', flexWrap: 'wrap', gap: 12},
  infoCell: {width: '47%', gap: 4},
  infoLabel: {fontSize: 11, color: Colors.textSecondary},
  infoValue: {fontSize: 13, fontWeight: '700', color: Colors.textPrimary},
  locationRow: {flexDirection: 'row', alignItems: 'center', gap: 5},
  locationDot: {width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary},
  divider: {height: 1, backgroundColor: Colors.border},
  extrasTitle: {fontSize: 13, fontWeight: '700', color: Colors.textPrimary, marginBottom: 8, },
  extrasRow: {flexDirection: 'row', flexWrap: 'wrap', gap: 8},
  extraChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderWidth: 1.5, borderColor: '#F59E0B',
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7,
  },
  extraChipStar: {fontSize: 10, color: '#F59E0B'},
  extraChipText: {fontSize: 12, fontWeight: '600', color: Colors.textPrimary},
  swipeWrap: {alignItems: 'center', marginBottom: 12},
  cancelBtn: {borderRadius: 14, paddingVertical: 14, alignItems: 'center', borderWidth: 1.5, borderColor: Colors.danger + '50', backgroundColor: '#FEF2F2'},
  cancelBtnText: {color: Colors.danger, fontSize: 14, fontWeight: '700'},
  guideCard: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 10,
  },
  guideImg: {width: 180, height: 140},
  guideTitle: {fontSize: 17, fontWeight: '800', color: Colors.textPrimary, textAlign: 'center'},
  guideDesc: {fontSize: 13, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20},
});

const ms = StyleSheet.create({
  overlay: {flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center', padding: 24},
  box: {backgroundColor: Colors.card, borderRadius: 24, padding: 28, width: '100%', alignItems: 'center'},
  warningIcon: {fontSize: 44, marginBottom: 10},
  successIcon: {fontSize: 56, marginBottom: 10},
  boxTitle: {fontSize: 20, fontWeight: '800', color: Colors.textPrimary, textAlign: 'center', marginBottom: 10},
  boxBody: {fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: 16},
  earningLine: {fontSize: 14, color: Colors.textSecondary, marginBottom: 4},
  earningAmount: {fontSize: 38, fontWeight: '800', color: Colors.success, marginBottom: 20},
  reasonInput: {width: '100%', borderWidth: 1.5, borderColor: Colors.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: Colors.textPrimary, marginBottom: 16, },
  btnRow: {flexDirection: 'row', gap: 10, width: '100%'},
  secondaryBtn: {flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: Colors.bg, borderWidth: 1, borderColor: Colors.border, alignItems: 'center'},
  secondaryBtnText: {fontSize: 14, fontWeight: '700', color: Colors.textPrimary},
  dangerBtn: {flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: Colors.danger, alignItems: 'center'},
  dangerBtnText: {fontSize: 14, fontWeight: '700', color: '#fff'},
  confirmBtn: {width: '100%', paddingVertical: 16, borderRadius: 14, backgroundColor: Colors.primary, alignItems: 'center', marginTop: 8},
  confirmBtnText: {color: '#fff', fontSize: 16, fontWeight: '700'},
  slideOverlay: {flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)'},
  slideSheet: {backgroundColor: Colors.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40},
  slideHandle: {width: 40, height: 4, backgroundColor: Colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: 20},
  slideTitle: {fontSize: 18, fontWeight: '800', color: Colors.textPrimary, textAlign: 'center', marginBottom: 8},
  slideSubtitle: {fontSize: 13, color: Colors.textSecondary, textAlign: 'center', marginBottom: 20},
  imgGrid: {flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center', marginBottom: 12},
  imgSlot: {
    width: 120, height: 120, borderRadius: 16,
    borderWidth: 2, borderColor: Colors.border, borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bg,
  },
  imgSlotFilled: {
    width: 120, height: 120, borderRadius: 16,
    overflow: 'hidden', position: 'relative',
  },
  imgPreview: {width: '100%', height: '100%'},
  removeBtn: {
    position: 'absolute', top: 6, right: 6,
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center', justifyContent: 'center',
  },
  photoCount: {fontSize: 13, color: Colors.textSecondary, textAlign: 'center', marginBottom: 8},
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
