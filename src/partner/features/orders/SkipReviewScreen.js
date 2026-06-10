import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Modal,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  AlertCircle,
  ArrowRight,
  Bike,
  Camera,
  Car,
  Check,
  CheckCircle,
  Clock,
  FileText,
  MapPin,
  Phone,
  ShoppingBag,
  User,
  X,
  XCircle,
} from 'lucide-react-native';
import {useTheme} from '../../../shared/context/ThemeContext';
import {approveSkipRequest, getSkipRequests, rejectSkipRequest} from '../../../services/partner';
import useAppStore from '../../../store/appStore';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const REASON_LABELS = {
  FORGOT_CAMERA:    'نسي الكاميرا',
  CAMERA_BROKEN:    'الكاميرا معطلة',
  CUSTOMER_REFUSED: 'العميل رفض التصوير',
  DARK_ENVIRONMENT: 'الإضاءة سيئة',
  TECHNICAL_ISSUE:  'مشكلة تقنية',
  OTHER:            'أخرى',
};

const STATUS_CFG = {
  PENDING:  {label: 'معلق',       colorKey: 'warning', Icon: Clock},
  APPROVED: {label: 'موافق عليه', colorKey: 'success', Icon: CheckCircle},
  REJECTED: {label: 'مرفوض',      colorKey: 'danger',  Icon: XCircle},
};

const FILTERS = [
  {key: 'ALL',      label: 'الكل'},
  {key: 'PENDING',  label: 'معلق'},
  {key: 'APPROVED', label: 'موافق'},
  {key: 'REJECTED', label: 'مرفوض'},
];

// ─────────────────────────────────────────────────────────────────────────────
// StatsBar — counts per status
// ─────────────────────────────────────────────────────────────────────────────

function StatsBar({requests, colors}) {
  const pending  = requests.filter(r => r.status === 'PENDING').length;
  const approved = requests.filter(r => r.status === 'APPROVED').length;
  const rejected = requests.filter(r => r.status === 'REJECTED').length;

  const items = [
    {label: 'معلق',       count: pending,  colorKey: 'warning'},
    {label: 'موافق عليه', count: approved, colorKey: 'success'},
    {label: 'مرفوض',      count: rejected, colorKey: 'danger'},
  ];

  return (
    <View style={st.statsRow}>
      {items.map(item => (
        <View
          key={item.label}
          style={[st.statCard, {backgroundColor: colors[item.colorKey] + '12', borderColor: colors[item.colorKey] + '30'}]}>
          <Text style={[st.statCount, {color: colors[item.colorKey]}]}>{item.count}</Text>
          <Text style={[st.statLabel, {color: colors[item.colorKey]}]}>{item.label}</Text>
        </View>
      ))}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FilterTabs
// ─────────────────────────────────────────────────────────────────────────────

function FilterTabs({filter, onChange, counts, colors}) {
  return (
    <View style={[st.tabsRow, {borderBottomColor: colors.border}]}>
      {FILTERS.map(f => {
        const active = filter === f.key;
        const count  = counts[f.key] ?? 0;
        return (
          <TouchableOpacity
            key={f.key}
            onPress={() => onChange(f.key)}
            activeOpacity={0.75}
            style={[
              st.tab,
              active
                ? {backgroundColor: colors.card, borderBottomColor: colors.primary}
                : {backgroundColor: 'transparent', borderBottomColor: 'transparent'},
            ]}>
            <Text style={[st.tabLabel, {color: active ? colors.primary : colors.textSecondary}]}>
              {f.label}
            </Text>
            {count > 0 && (
              <View style={[
                st.tabBadge,
                {backgroundColor: active ? colors.primary : colors.border},
              ]}>
                <Text style={[st.tabBadgeText, {color: active ? '#FFF' : colors.textSecondary}]}>
                  {count}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SkipCard
// ─────────────────────────────────────────────────────────────────────────────

function InfoRow({Icon, label, value, colors}) {
  if (!value) return null;
  return (
    <View style={st.infoRow}>
      <Icon size={14} color={colors.textSecondary} />
      <Text style={[st.infoLabel, {color: colors.textSecondary}]}>{label}</Text>
      <Text style={[st.infoValue, {color: colors.textPrimary}]} numberOfLines={1}>{value}</Text>
    </View>
  );
}

function SkipCard({item, colors, onApprove, onReject, loadingId}) {
  const scaleAnim  = useRef(new Animated.Value(1)).current;
  const cfg        = STATUS_CFG[item.status] ?? STATUS_CFG.PENDING;
  const badgeColor = colors[cfg.colorKey];
  const isPending  = item.status === 'PENDING';
  const itemId     = item._id ?? item.id;
  const isLoading  = loadingId === itemId;

  // ── Biker ──────────────────────────────────────────────────────────────────
  const biker     = item.requestedBy ?? {};
  const bikerName = [biker.firstName, biker.lastName].filter(Boolean).join(' ') || item.bikerName || '—';
  const bikerPhone = biker.phoneNumber ?? biker.phone ?? '';

  // ── Order ──────────────────────────────────────────────────────────────────
  const order      = (typeof item.orderId === 'object' && item.orderId !== null) ? item.orderId : {};
  const orderNum   = order.orderNumber ?? item.orderNumber ?? order._id ?? '';

  const serviceName =
    order.itemsSnapshot?.[0]?.nameSnapshot?.ar
    ?? order.itemsSnapshot?.[0]?.nameSnapshot?.en
    ?? order.items?.[0]?.service?.name?.ar
    ?? order.items?.[0]?.service?.name?.en
    ?? order.service?.name?.ar
    ?? order.service?.name?.en
    ?? '';

  const clientName  = order.client
    ? [order.client.firstName, order.client.lastName].filter(Boolean).join(' ')
    : '';

  const carDesc = [
    order.userCar?.brand?.name?.ar ?? order.userCar?.brand?.name?.en ?? '',
    order.userCar?.model?.name?.ar ?? order.userCar?.model?.name?.en ?? '',
  ].filter(Boolean).join(' ');
  const plate    = order.userCar?.plate ?? order.plate ?? '';
  const carLabel = [carDesc, plate].filter(Boolean).join(' · ');

  const location = order.addressSnapshot?.addressText
    ?? order.addressSnapshot?.district
    ?? order.branch?.name?.ar
    ?? order.branch?.name?.en
    ?? '';

  const price    = order.tenantNetSnapshot ?? order.totalAmount ?? '';
  const priceStr = price ? `${price} ﷼` : '';

  const scheduledAt = order.scheduledAt
    ? new Date(order.scheduledAt).toLocaleString('ar-SA', {
        day: '2-digit', month: '2-digit',
        hour: '2-digit', minute: '2-digit',
      })
    : '';

  // ── Request meta ───────────────────────────────────────────────────────────
  const reasonText = REASON_LABELS[item.reason] ?? item.reason ?? '—';
  const dateStr    = item.requestedAt
    ? new Date(item.requestedAt).toLocaleString('ar-SA', {
        day: '2-digit', month: '2-digit', year: '2-digit',
        hour: '2-digit', minute: '2-digit',
      })
    : '';

  const onPressIn  = () => Animated.spring(scaleAnim, {toValue: 0.98, useNativeDriver: true, speed: 50}).start();
  const onPressOut = () => Animated.spring(scaleAnim, {toValue: 1,    useNativeDriver: true, speed: 50}).start();

  return (
    <Animated.View style={{transform: [{scale: scaleAnim}]}}>
      <View style={[st.card, {backgroundColor: colors.card, borderColor: colors.border}]}>

        {/* ── Colour strip ── */}
        <View style={[st.cardStrip, {backgroundColor: badgeColor}]} />

        <View style={st.cardInner}>

          {/* ── Status badge ── */}
          <View style={st.badgeRow}>
            <View style={[st.badge, {backgroundColor: badgeColor + '15', borderColor: badgeColor + '30'}]}>
              <cfg.Icon size={11} color={badgeColor} />
              <Text style={[st.badgeText, {color: badgeColor}]}>{cfg.label}</Text>
            </View>
            {!!dateStr && (
              <View style={st.dateRow}>
                <Clock size={11} color={colors.textSecondary} />
                <Text style={[st.dateText, {color: colors.textSecondary}]}>{dateStr}</Text>
              </View>
            )}
          </View>

          {/* ── Section: البايكر ── */}
          <View style={[st.section, {backgroundColor: colors.bg, borderColor: colors.border}]}>
            <View style={st.sectionHeader}>
              <View style={[st.sectionIconWrap, {backgroundColor: colors.primary + '15'}]}>
                <Bike size={14} color={colors.primary} />
              </View>
              <Text style={[st.sectionTitle, {color: colors.textPrimary}]}>البايكر</Text>
            </View>
            <View style={st.sectionBody}>
              <InfoRow Icon={User}  label="الاسم"  value={bikerName}  colors={colors} />
              <InfoRow Icon={Phone} label="الهاتف" value={bikerPhone} colors={colors} />
            </View>
          </View>

          {/* ── Section: الطلب ── */}
          <View style={[st.section, {backgroundColor: colors.bg, borderColor: colors.border}]}>
            <View style={st.sectionHeader}>
              <View style={[st.sectionIconWrap, {backgroundColor: colors.purple + '15'}]}>
                <ShoppingBag size={14} color={colors.purple} />
              </View>
              <Text style={[st.sectionTitle, {color: colors.textPrimary}]}>
                الطلب {orderNum ? `#${orderNum}` : ''}
              </Text>
            </View>
            <View style={st.sectionBody}>
              <InfoRow Icon={ShoppingBag} label="الخدمة"   value={serviceName} colors={colors} />
              <InfoRow Icon={User}        label="العميل"   value={clientName}  colors={colors} />
              <InfoRow Icon={Car}         label="السيارة"  value={carLabel}    colors={colors} />
              <InfoRow Icon={MapPin}      label="الموقع"   value={location}    colors={colors} />
              <InfoRow Icon={Clock}       label="الموعد"   value={scheduledAt} colors={colors} />
              {!!priceStr && (
                <View style={st.infoRow}>
                  <Text style={[st.infoLabel, {color: colors.textSecondary, marginRight: 18}]}>المبلغ</Text>
                  <Text style={[st.priceVal, {color: colors.primary}]}>{priceStr}</Text>
                </View>
              )}
            </View>
          </View>

          {/* ── Section: سبب التخطي ── */}
          <View style={[st.section, {backgroundColor: colors.warning + '08', borderColor: colors.warning + '25'}]}>
            <View style={st.sectionHeader}>
              <View style={[st.sectionIconWrap, {backgroundColor: colors.warning + '20'}]}>
                <AlertCircle size={14} color={colors.warning} />
              </View>
              <Text style={[st.sectionTitle, {color: colors.textPrimary}]}>سبب التخطي</Text>
            </View>
            <View style={st.sectionBody}>
              <Text style={[st.reasonVal, {color: colors.textPrimary}]}>{reasonText}</Text>
              {!!item.note && (
                <View style={[st.noteWrap, {backgroundColor: colors.card, borderColor: colors.border}]}>
                  <FileText size={13} color={colors.textSecondary} />
                  <Text style={[st.noteText, {color: colors.textSecondary}]} numberOfLines={4}>
                    {item.note}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* ── Actions — PENDING only ── */}
          {isPending && (
            <View style={st.actions}>
              <TouchableOpacity
                style={[st.rejectBtn, {borderColor: colors.danger, backgroundColor: colors.danger + '10'}]}
                onPress={() => onReject(item)}
                onPressIn={onPressIn}
                onPressOut={onPressOut}
                disabled={isLoading}
                activeOpacity={0.8}>
                {isLoading
                  ? <ActivityIndicator size="small" color={colors.danger} />
                  : <X size={15} color={colors.danger} />}
                <Text style={[st.rejectText, {color: colors.danger}]}>رفض</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[st.approveBtn, {backgroundColor: colors.success}]}
                onPress={() => onApprove(item)}
                onPressIn={onPressIn}
                onPressOut={onPressOut}
                disabled={isLoading}
                activeOpacity={0.8}>
                {isLoading
                  ? <ActivityIndicator size="small" color="#FFF" />
                  : <Check size={15} color="#FFF" />}
                <Text style={st.approveText}>موافقة</Text>
              </TouchableOpacity>
            </View>
          )}

        </View>
      </View>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// RejectModal
// ─────────────────────────────────────────────────────────────────────────────

function RejectModal({visible, item, onConfirm, onCancel, colors}) {
  const [note, setNote] = useState('');

  // reset note each time modal opens
  useEffect(() => { if (visible) setNote(''); }, [visible]);

  const bikerName = item?.requestedBy
    ? `${item.requestedBy.firstName ?? ''} ${item.requestedBy.lastName ?? ''}`.trim()
    : item?.bikerName ?? '';

  const phase = item?.phase ?? '';
  const phaseLabel = phase === 'before' ? 'قبل الغسيل' : phase === 'after' ? 'بعد الغسيل' : '';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={st.overlay}>
        <View style={[st.modalBox, {backgroundColor: colors.card}]}>

          {/* Icon */}
          <View style={[st.modalIconWrap, {backgroundColor: colors.danger + '12'}]}>
            <X size={30} color={colors.danger} />
          </View>

          <Text style={[st.modalTitle, {color: colors.textPrimary}]}>تأكيد الرفض</Text>

          {/* Phase + biker info */}
          <View style={[st.modalInfo, {backgroundColor: colors.bg, borderColor: colors.border}]}>
            <User size={14} color={colors.textSecondary} />
            <View style={{flex: 1, gap: 2}}>
              {!!bikerName && (
                <Text style={[st.modalInfoText, {color: colors.textSecondary}]}>
                  البايكر: <Text style={{color: colors.textPrimary, fontWeight: '700'}}>{bikerName}</Text>
                </Text>
              )}
              {!!phaseLabel && (
                <Text style={[st.modalInfoText, {color: colors.textSecondary}]}>
                  المرحلة: <Text style={{color: colors.warning, fontWeight: '700'}}>{phaseLabel}</Text>
                </Text>
              )}
            </View>
          </View>

          {/* Optional review note */}
          <View style={[st.noteInputWrap, {borderColor: colors.border, backgroundColor: colors.bg}]}>
            <TextInput
              style={[st.noteInput, {color: colors.textPrimary}]}
              placeholder="سبب الرفض (اختياري)"
              placeholderTextColor={colors.textSecondary}
              value={note}
              onChangeText={setNote}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              textAlign="right"
            />
          </View>

          <View style={st.modalBtns}>
            <TouchableOpacity
              style={[st.modalCancelBtn, {borderColor: colors.border}]}
              onPress={onCancel}
              activeOpacity={0.8}>
              <Text style={[st.modalCancelText, {color: colors.textPrimary}]}>إلغاء</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[st.modalConfirmBtn, {backgroundColor: colors.danger}]}
              onPress={() => onConfirm(note.trim())}
              activeOpacity={0.8}>
              <X size={15} color="#FFF" />
              <Text style={st.modalConfirmText}>رفض</Text>
            </TouchableOpacity>
          </View>

        </View>
      </View>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EmptyState
// ─────────────────────────────────────────────────────────────────────────────

function EmptyState({filter, colors}) {
  const msgs = {
    ALL:      {title: 'لا توجد طلبات',        sub: 'لم يُرسل أي بايكر طلب تخطي للصورة بعد'},
    PENDING:  {title: 'لا توجد طلبات معلقة',  sub: 'جميع الطلبات تمت معالجتها'},
    APPROVED: {title: 'لا توجد موافقات',       sub: 'لم تتم الموافقة على أي طلب حتى الآن'},
    REJECTED: {title: 'لا توجد مرفوضات',       sub: 'لم يُرفض أي طلب حتى الآن'},
  };
  const {title, sub} = msgs[filter] ?? msgs.ALL;

  return (
    <View style={st.emptyWrap}>
      <View style={[st.emptyIcon, {backgroundColor: colors.primary + '10'}]}>
        <Camera size={36} color={colors.primary} />
      </View>
      <Text style={[st.emptyTitle, {color: colors.textPrimary}]}>{title}</Text>
      <Text style={[st.emptySub,   {color: colors.textSecondary}]}>{sub}</Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────────────────────────────────────

export default function SkipReviewScreen({onBack}) {
  const {colors} = useTheme();

  const [requests,   setRequests]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingId,  setLoadingId]  = useState(null);
  const [filter,     setFilter]     = useState('ALL');
  const [rejectItem, setRejectItem] = useState(null);

  const requestNav = useAppStore(s => s.requestNav);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // ── Fetch all phases at once ────────────────────────────────────────────────
  const fetchRequests = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    const res = await getSkipRequests({phase: 'all', limit: 200});
    if (!mountedRef.current) return;
    if (res.success) {
      const list = res.data?.data ?? res.data ?? [];
      setRequests(Array.isArray(list) ? list : []);
    }
    if (!silent) setLoading(false);
  }, []);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchRequests(true);
    setRefreshing(false);
  }, [fetchRequests]);

  // ── Approve ─────────────────────────────────────────────────────────────────
  const handleApprove = useCallback(async (item) => {
    const itemId  = item._id ?? item.id;
    const orderId = item.orderId?._id ?? item.orderId;
    const phase   = item.phase ?? 'before';
    setLoadingId(itemId);
    const res = await approveSkipRequest(orderId, phase);
    if (!mountedRef.current) return;
    setLoadingId(null);
    if (res.success !== false) {
      setRequests(prev =>
        prev.map(r => (r._id ?? r.id) === itemId ? {...r, status: 'APPROVED'} : r),
      );
      requestNav('orders', orderId, 'detail');
    }
  }, [requestNav]);

  // ── Reject ──────────────────────────────────────────────────────────────────
  const handleRejectPress   = useCallback(item => setRejectItem(item), []);
  const handleRejectCancel  = useCallback(() => setRejectItem(null), []);

  const handleRejectConfirm = useCallback(async (reviewNote) => {
    if (!rejectItem) return;
    const item    = rejectItem;
    const itemId  = item._id ?? item.id;
    const orderId = item.orderId?._id ?? item.orderId;
    const phase   = item.phase ?? 'before';
    setRejectItem(null);
    setLoadingId(itemId);
    const res = await rejectSkipRequest(orderId, phase, reviewNote || undefined);
    if (!mountedRef.current) return;
    setLoadingId(null);
    if (res.success !== false) {
      setRequests(prev =>
        prev.map(r => (r._id ?? r.id) === itemId ? {...r, status: 'REJECTED'} : r),
      );
      requestNav('orders', orderId, 'detail');
    }
  }, [rejectItem, requestNav]);

  // ── Derived ─────────────────────────────────────────────────────────────────
  const pendingCount = requests.filter(r => r.status === 'PENDING').length;

  const counts = {
    ALL:      requests.length,
    PENDING:  requests.filter(r => r.status === 'PENDING').length,
    APPROVED: requests.filter(r => r.status === 'APPROVED').length,
    REJECTED: requests.filter(r => r.status === 'REJECTED').length,
  };

  const visible = filter === 'ALL'
    ? requests
    : requests.filter(r => r.status === filter);

  // ── Render item ─────────────────────────────────────────────────────────────
  const renderItem = useCallback(({item}) => (
    <SkipCard
      item={item}
      colors={colors}
      onApprove={handleApprove}
      onReject={handleRejectPress}
      loadingId={loadingId}
    />
  ), [colors, handleApprove, handleRejectPress, loadingId]);

  const keyExtractor = useCallback(
    item => item._id ?? item.id ?? String(Math.random()),
    [],
  );

  // ── UI ──────────────────────────────────────────────────────────────────────
  return (
    <View style={[st.root, {backgroundColor: colors.bg}]}>

      {/* ── Header ── */}
      <View style={[st.header, {backgroundColor: colors.card, borderBottomColor: colors.border}]}>
        {onBack && (
          <TouchableOpacity onPress={onBack} style={st.backBtn} activeOpacity={0.7}>
            <ArrowRight size={22} color={colors.textPrimary} />
          </TouchableOpacity>
        )}
        <View style={st.headerCenter}>
          <Text style={[st.headerTitle, {color: colors.textPrimary}]}>
            طلبات تخطي الصور
          </Text>
          {pendingCount > 0 && (
            <View style={[st.headerBadge, {backgroundColor: colors.warning}]}>
              <Text style={st.headerBadgeText}>{pendingCount}</Text>
            </View>
          )}
        </View>
        {/* spacer to center title */}
        <View style={{width: 36}} />
      </View>

      {/* ── Stats bar ── */}
      {!loading && requests.length > 0 && (
        <StatsBar requests={requests} colors={colors} />
      )}

      {/* ── Filter tabs ── */}
      <FilterTabs
        filter={filter}
        onChange={setFilter}
        counts={counts}
        colors={colors}
      />

      {/* ── List ── */}
      {loading ? (
        <View style={st.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[st.loadingText, {color: colors.textSecondary}]}>جاري التحميل...</Text>
        </View>
      ) : (
        <FlatList
          data={visible}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={[
            st.list,
            visible.length === 0 && st.listEmpty,
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={<EmptyState filter={filter} colors={colors} />}
        />
      )}

      {/* ── Reject confirmation modal ── */}
      <RejectModal
        visible={!!rejectItem}
        item={rejectItem}
        onConfirm={handleRejectConfirm}
        onCancel={handleRejectCancel}
        colors={colors}
      />

    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const st = StyleSheet.create({
  root:   {flex: 1},
  center: {flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10},

  // Header
  header:          {flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20,
                    paddingTop: 56, paddingBottom: 16, borderBottomWidth: 1, gap: 12},
  backBtn:         {width: 36, height: 36, alignItems: 'center', justifyContent: 'center'},
  headerCenter:    {flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8},
  headerTitle:     {fontSize: 18, fontWeight: '800'},
  headerBadge:     {minWidth: 22, height: 22, borderRadius: 11, paddingHorizontal: 6,
                    alignItems: 'center', justifyContent: 'center'},
  headerBadgeText: {color: '#FFF', fontSize: 11, fontWeight: '800'},

  // Stats bar
  statsRow:   {flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingVertical: 12},
  statCard:   {flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 14, borderWidth: 1, gap: 2},
  statCount:  {fontSize: 22, fontWeight: '900'},
  statLabel:  {fontSize: 11, fontWeight: '600'},

  // Filter tabs
  tabsRow:      {flexDirection: 'row', borderBottomWidth: 1},
  tab:          {flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                 gap: 5, paddingVertical: 12, borderBottomWidth: 2},
  tabLabel:     {fontSize: 13, fontWeight: '700'},
  tabBadge:     {minWidth: 18, height: 18, borderRadius: 9, paddingHorizontal: 4,
                 alignItems: 'center', justifyContent: 'center'},
  tabBadgeText: {fontSize: 10, fontWeight: '800'},

  // List
  list:      {padding: 16, gap: 12, paddingBottom: 40},
  listEmpty: {flexGrow: 1},
  loadingText: {fontSize: 13},

  // Card
  card:      {borderRadius: 18, borderWidth: 1, overflow: 'hidden',
              shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8,
              shadowOffset: {width: 0, height: 2}, elevation: 2},
  cardStrip: {height: 4, width: '100%'},
  cardInner: {padding: 14, gap: 10},

  // Badge + date row at top
  badgeRow:  {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  badge:     {flexDirection: 'row', alignItems: 'center', gap: 4,
              paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1},
  badgeText: {fontSize: 11, fontWeight: '700'},
  dateRow:   {flexDirection: 'row', alignItems: 'center', gap: 4},
  dateText:  {fontSize: 11},

  // Sections
  section:        {borderRadius: 12, borderWidth: 1, overflow: 'hidden'},
  sectionHeader:  {flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, paddingBottom: 8},
  sectionIconWrap:{width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center'},
  sectionTitle:   {fontSize: 13, fontWeight: '800'},
  sectionBody:    {gap: 6, paddingHorizontal: 10, paddingBottom: 10},

  // Info rows inside sections
  infoRow:   {flexDirection: 'row', alignItems: 'center', gap: 6},
  infoLabel: {fontSize: 12, fontWeight: '500', width: 52},
  infoValue: {flex: 1, fontSize: 13, fontWeight: '600'},
  priceVal:  {fontSize: 15, fontWeight: '800'},

  // Reason section
  reasonVal: {fontSize: 14, fontWeight: '700', paddingHorizontal: 2},
  noteWrap:  {flexDirection: 'row', alignItems: 'flex-start', gap: 8,
              borderRadius: 8, borderWidth: 1, padding: 8, marginTop: 4},
  noteText:  {flex: 1, fontSize: 12, lineHeight: 18},

  // Action buttons
  actions:     {flexDirection: 'row', gap: 10},
  rejectBtn:   {flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
               gap: 7, paddingVertical: 13, borderRadius: 14, borderWidth: 1.5},
  rejectText:  {fontSize: 14, fontWeight: '700'},
  approveBtn:  {flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
               gap: 7, paddingVertical: 13, borderRadius: 14},
  approveText: {color: '#FFF', fontSize: 14, fontWeight: '700'},

  // Empty state
  emptyWrap:  {flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingTop: 60},
  emptyIcon:  {width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center'},
  emptyTitle: {fontSize: 16, fontWeight: '700'},
  emptySub:   {fontSize: 13, textAlign: 'center', paddingHorizontal: 40},

  // Reject modal
  overlay:           {flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
                      alignItems: 'center', justifyContent: 'center', padding: 24},
  modalBox:          {width: '100%', borderRadius: 24, padding: 24, gap: 14, alignItems: 'center'},
  modalIconWrap:     {width: 64, height: 64, borderRadius: 32,
                      alignItems: 'center', justifyContent: 'center'},
  modalTitle:        {fontSize: 18, fontWeight: '800'},
  modalInfo:         {flexDirection: 'row', alignItems: 'flex-start', gap: 8,
                      borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10, width: '100%'},
  modalInfoText:     {fontSize: 13, lineHeight: 20},
  noteInputWrap:     {width: '100%', borderWidth: 1, borderRadius: 12, padding: 12},
  noteInput:         {fontSize: 14, lineHeight: 22, minHeight: 72},
  modalBtns:         {flexDirection: 'row', gap: 10, width: '100%', marginTop: 4},
  modalCancelBtn:    {flex: 1, paddingVertical: 14, borderRadius: 14,
                      borderWidth: 1.5, alignItems: 'center'},
  modalCancelText:   {fontSize: 14, fontWeight: '700'},
  modalConfirmBtn:   {flex: 1, flexDirection: 'row', gap: 6, paddingVertical: 14,
                      borderRadius: 14, alignItems: 'center', justifyContent: 'center'},
  modalConfirmText:  {color: '#FFF', fontSize: 14, fontWeight: '700'},
});
