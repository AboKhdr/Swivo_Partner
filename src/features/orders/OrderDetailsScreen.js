import React, {useState} from 'react';
import {
  ActivityIndicator, Modal, Platform, ScrollView,
  StatusBar, StyleSheet, Text, TextInput,
  TouchableOpacity, View,
} from 'react-native';
import {Colors} from '../../shared/constants/colors';
import {STATUS_MAP, STATUS_STEPS} from '../../shared/constants/status';
import StatusTracker from '../../shared/components/StatusTracker';

const ACTION_MAP = {
  ASSIGNED:   {label: '🚗  في الطريق',           nextStatus: 'ON_THE_WAY'},
  ON_THE_WAY: {label: '📍  وصلت — ابدأ الخدمة', nextStatus: 'STARTED'},
  STARTED:    {label: '📸  انتهيت — رفع الصور',  nextStatus: 'COMPLETED'},
  COMPLETED:  null,
  CANCELLED:  null,
};

export default function OrderDetailsScreen({order, onBack}) {
  const [currentStatus, setCurrentStatus] = useState(order.status);
  const [actionLoading, setActionLoading] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [photosCount, setPhotosCount] = useState(0);
  const [cancelReason, setCancelReason] = useState('');

  const canCancel = currentStatus === 'ASSIGNED' || currentStatus === 'ON_THE_WAY';
  const action = ACTION_MAP[currentStatus];

  const actionBgColor =
    currentStatus === 'ASSIGNED'   ? Colors.primary :
    currentStatus === 'ON_THE_WAY' ? Colors.success  :
    currentStatus === 'STARTED'    ? Colors.purple   : Colors.border;

  const handleAction = () => {
    if (!action) return;
    if (currentStatus === 'STARTED') { setShowImageUpload(true); return; }
    setActionLoading(true);
    // TODO: PATCH /api/biker/order/:id/status
    setTimeout(() => { setCurrentStatus(action.nextStatus); setActionLoading(false); }, 900);
  };

  const handleCompleteWithPhotos = () => {
    if (photosCount === 0) return;
    setShowImageUpload(false);
    setActionLoading(true);
    setTimeout(() => { setCurrentStatus('COMPLETED'); setActionLoading(false); setShowCompletionModal(true); }, 1000);
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
          <Text style={s.sectionTitle}>مسار الطلب</Text>
          <StatusTracker status={currentStatus} />
          {STATUS_MAP[currentStatus] && (
            <View style={[s.statusBadge, {backgroundColor: STATUS_MAP[currentStatus].color + '18'}]}>
              <Text style={[s.statusBadgeText, {color: STATUS_MAP[currentStatus].color}]}>
                {STATUS_MAP[currentStatus].label}
              </Text>
            </View>
          )}
        </View>

        {/* Client */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>معلومات العميل</Text>
          <View style={s.card}>
            <View style={s.infoRow}><Text style={s.infoEmoji}>👤</Text><Text style={s.infoLabel}>{order.client.firstName} {order.client.lastName}</Text></View>
            <View style={s.infoRow}>
              <Text style={s.infoEmoji}>📞</Text>
              <Text style={s.infoValue}>{order.client.phoneNumber}</Text>
              <TouchableOpacity style={s.phoneBtn}><Text style={s.phoneBtnText}>اتصال</Text></TouchableOpacity>
              <TouchableOpacity style={[s.phoneBtn, s.waBtnStyle]}><Text style={s.waBtnText}>واتساب</Text></TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Car */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>معلومات السيارة</Text>
          <View style={s.card}>
            <View style={s.infoRow}><Text style={s.infoEmoji}>🚗</Text><Text style={s.infoLabel}>{order.car.brand} {order.car.model} — {order.car.color}</Text></View>
            <View style={s.infoRow}><Text style={s.infoEmoji}>🪪</Text><Text style={s.infoValue}>لوحة: {order.car.plateNumber}</Text></View>
          </View>
        </View>

        {/* Service */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>الخدمة والموقع</Text>
          <View style={s.card}>
            <View style={s.infoRow}><Text style={s.infoEmoji}>🧹</Text><Text style={s.infoLabel}>{order.service.name}</Text><Text style={s.priceTag}>﷼ {order.service.price}</Text></View>
            <View style={s.infoRow}><Text style={s.infoEmoji}>📍</Text><Text style={s.infoValue}>{order.address}</Text></View>
            <View style={s.infoRow}><Text style={s.infoEmoji}>🕐</Text><Text style={s.infoValue}>{order.scheduledAt} — {order.scheduledDate}</Text></View>
            <View style={[s.infoRow, s.earningHighlight]}>
              <Text style={s.infoEmoji}>💰</Text>
              <Text style={s.earningText}>أرباحك: ﷼ {order.bikerEarning.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        {action && (
          <TouchableOpacity
            style={[s.actionBtn, {backgroundColor: actionBgColor}, actionLoading && {opacity: 0.65}]}
            onPress={handleAction}
            disabled={actionLoading}
            activeOpacity={0.85}>
            {actionLoading ? <ActivityIndicator color="#fff" /> : <Text style={s.actionBtnText}>{action.label}</Text>}
          </TouchableOpacity>
        )}

        {canCancel && !actionLoading && (
          <TouchableOpacity style={s.cancelBtn} onPress={() => setShowCancelModal(true)}>
            <Text style={s.cancelBtnText}>إلغاء الطلب</Text>
          </TouchableOpacity>
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
            <Text style={ms.slideTitle}>رفع صور الإثبات</Text>
            <Text style={ms.slideSubtitle}>📸 صورة واحدة على الأقل مطلوبة</Text>
            <View style={ms.imgGrid}>
              {[0, 1, 2, 3].map(i => (
                <TouchableOpacity key={i} style={[ms.imgSlot, i < photosCount && ms.imgSlotFilled]} onPress={() => { if (i >= photosCount) setPhotosCount(photosCount + 1); }}>
                  <Text style={i < photosCount ? ms.checkIcon : ms.plusIcon}>{i < photosCount ? '✓' : '+'}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {photosCount > 0 && <Text style={ms.photoCount}>{photosCount} صورة مرفوعة</Text>}
            <TouchableOpacity style={[ms.confirmBtn, photosCount === 0 && {opacity: 0.4}]} onPress={handleCompleteWithPhotos} disabled={photosCount === 0}>
              <Text style={ms.confirmBtnText}>تأكيد الإتمام ✓</Text>
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
  sectionTitle: {fontSize: 13, fontWeight: '700', color: Colors.textSecondary, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5},
  card: {backgroundColor: Colors.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: Colors.border, gap: 12},
  infoRow: {flexDirection: 'row', alignItems: 'center', gap: 10},
  infoEmoji: {fontSize: 16},
  infoLabel: {flex: 1, fontSize: 15, fontWeight: '600', color: Colors.textPrimary},
  infoValue: {flex: 1, fontSize: 14, color: Colors.textSecondary},
  priceTag: {fontSize: 14, fontWeight: '700', color: Colors.primary},
  earningHighlight: {backgroundColor: Colors.success + '12', borderRadius: 10, padding: 10, marginTop: 4},
  earningText: {flex: 1, fontSize: 15, fontWeight: '800', color: Colors.success},
  statusBadge: {marginTop: 12, alignSelf: 'center', paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20},
  statusBadgeText: {fontSize: 13, fontWeight: '700'},
  phoneBtn: {backgroundColor: Colors.primary + '15', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8},
  phoneBtnText: {fontSize: 12, fontWeight: '700', color: Colors.primary},
  waBtnStyle: {backgroundColor: '#25D36618'},
  waBtnText: {fontSize: 12, fontWeight: '700', color: '#25D366'},
  actionBtn: {borderRadius: 16, paddingVertical: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 10, shadowColor: Colors.primary, shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.25, shadowRadius: 8, elevation: 5},
  actionBtnText: {color: '#fff', fontSize: 17, fontWeight: '800'},
  cancelBtn: {borderRadius: 14, paddingVertical: 14, alignItems: 'center', borderWidth: 1.5, borderColor: Colors.danger + '50', backgroundColor: '#FEF2F2'},
  cancelBtnText: {color: Colors.danger, fontSize: 14, fontWeight: '700'},
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
  reasonInput: {width: '100%', borderWidth: 1.5, borderColor: Colors.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: Colors.textPrimary, marginBottom: 16, textAlign: 'right'},
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
  imgSlot: {width: 100, height: 100, borderRadius: 14, borderWidth: 2, borderColor: Colors.border, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bg},
  imgSlotFilled: {borderColor: Colors.success, borderStyle: 'solid', backgroundColor: Colors.success + '15'},
  plusIcon: {fontSize: 32, color: Colors.textSecondary},
  checkIcon: {fontSize: 32, color: Colors.success},
  photoCount: {fontSize: 13, color: Colors.success, fontWeight: '700', textAlign: 'center', marginBottom: 8},
});
