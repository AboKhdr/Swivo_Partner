import React, {useCallback, useEffect, useState} from 'react';
import {ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {ArrowRight, Check, X, AlertCircle} from 'lucide-react-native';
import {useTheme} from '../../../shared/context/ThemeContext';
import {getSkipRequests, approveSkipRequest, rejectSkipRequest} from '../../../services/partner';

function SkipCard({item, colors, onApprove, onReject}) {
  const isPending  = item.status === 'PENDING';
  const bikerName  = item.requestedBy
    ? `${item.requestedBy.firstName ?? ''} ${item.requestedBy.lastName ?? ''}`.trim()
    : item.bikerName ?? '';
  const orderNum   = item.orderId?.orderNumber ?? item.orderId?._id ?? item.orderId ?? item.orderId ?? '';
  const timeStr    = item.requestedAt
    ? new Date(item.requestedAt).toLocaleTimeString('ar-SA', {hour: '2-digit', minute: '2-digit'})
    : item.time ?? '';

  return (
    <View style={[s.card, {backgroundColor: colors.card, borderColor: colors.border}]}>
      <View style={s.cardHeader}>
        <View>
          <Text style={[s.bikerName, {color: colors.textPrimary}]}>{bikerName}</Text>
          <Text style={[s.orderId, {color: colors.textSecondary}]}>طلب #{orderNum}</Text>
        </View>
        <View style={[s.badge, {backgroundColor: isPending ? colors.warning + '18' : colors.success + '18'}]}>
          <Text style={[s.badgeText, {color: isPending ? colors.warning : colors.success}]}>
            {isPending ? 'معلق' : 'موافق عليه'}
          </Text>
        </View>
      </View>

      <View style={[s.reasonBox, {backgroundColor: colors.bg, borderColor: colors.border}]}>
        <View style={s.reasonRow}>
          <AlertCircle size={14} color={colors.warning} />
          <Text style={[s.reasonLabel, {color: colors.textSecondary}]}>السبب:</Text>
          <Text style={[s.reasonValue, {color: colors.textPrimary}]}>{item.reason}</Text>
        </View>
        {item.note ? (
          <Text style={[s.noteText, {color: colors.textSecondary}]}>ملاحظة: {item.note}</Text>
        ) : null}
      </View>

      {!!timeStr && <Text style={[s.time, {color: colors.textSecondary}]}>{timeStr}</Text>}

      {isPending && (
        <View style={s.actions}>
          <TouchableOpacity
            style={[s.rejectBtn, {borderColor: colors.danger, backgroundColor: colors.danger + '12'}]}
            onPress={() => onReject(item)}
            activeOpacity={0.8}>
            <X size={16} color={colors.danger} />
            <Text style={[s.rejectText, {color: colors.danger}]}>رفض</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.approveBtn, {backgroundColor: colors.success}]}
            onPress={() => onApprove(item)}
            activeOpacity={0.8}>
            <Check size={16} color="#FFF" />
            <Text style={s.approveText}>موافقة</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

export default function SkipReviewScreen({onBack}) {
  const {colors} = useTheme();
  const [requests, setRequests] = useState([]);
  const [loading,  setLoading]  = useState(true);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    const res = await getSkipRequests({status: 'PENDING', limit: 50});
    if (res.success) {
      const list = res.data?.data ?? res.data ?? [];
      setRequests(Array.isArray(list) ? list : []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const handleApprove = useCallback(async (item) => {
    const orderId = item.orderId?._id ?? item.orderId;
    await approveSkipRequest(orderId);
    setRequests(prev => prev.filter(r => (r._id ?? r.id) !== (item._id ?? item.id)));
  }, []);

  const handleReject = useCallback(async (item) => {
    const orderId = item.orderId?._id ?? item.orderId;
    await rejectSkipRequest(orderId);
    setRequests(prev => prev.filter(r => (r._id ?? r.id) !== (item._id ?? item.id)));
  }, []);

  const pending = requests.filter(r => r.status === 'PENDING').length;

  const renderItem = useCallback(({item}) => (
    <SkipCard item={item} colors={colors} onApprove={handleApprove} onReject={handleReject} />
  ), [colors, handleApprove, handleReject]);

  const keyExtractor = useCallback(item => item._id ?? item.id, []);

  return (
    <View style={[s.root, {backgroundColor: colors.bg}]}>
      <View style={[s.header, {backgroundColor: colors.card, borderBottomColor: colors.border}]}>
        {onBack && (
          <TouchableOpacity onPress={onBack} style={s.backBtn}>
            <ArrowRight size={22} color={colors.textPrimary} />
          </TouchableOpacity>
        )}
        <View style={s.headerText}>
          <Text style={[s.headerTitle, {color: colors.textPrimary}]}>طلبات تخطي الصور</Text>
          {pending > 0 && (
            <View style={[s.pendingBadge, {backgroundColor: colors.warning}]}>
              <Text style={s.pendingBadgeText}>{pending}</Text>
            </View>
          )}
        </View>
        <View style={{width: 36}} />
      </View>

      {loading
        ? <View style={s.center}><ActivityIndicator size="large" color={colors.primary} /></View>
        : (
      <FlatList
        data={requests}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={s.list}
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={[s.emptyText, {color: colors.textSecondary}]}>لا توجد طلبات معلقة</Text>
          </View>
        }
      />
        )
      }
    </View>
  );
}

const s = StyleSheet.create({
  root:           {flex: 1},
  center:         {flex: 1, alignItems: 'center', justifyContent: 'center'},
  header:         {flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16, borderBottomWidth: 1, gap: 12},
  backBtn:        {width: 36, height: 36, alignItems: 'center', justifyContent: 'center'},
  headerText:     {flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8},
  headerTitle:    {fontSize: 18, fontWeight: '800'},
  pendingBadge:   {width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center'},
  pendingBadgeText: {color: '#FFF', fontSize: 11, fontWeight: '800'},
  list:           {padding: 16, gap: 12},
  card:           {borderRadius: 16, borderWidth: 1, padding: 16, gap: 10},
  cardHeader:     {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start'},
  bikerName:      {fontSize: 15, fontWeight: '700'},
  orderId:        {fontSize: 12, fontWeight: '400', marginTop: 2},
  badge:          {paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10},
  badgeText:      {fontSize: 11, fontWeight: '700'},
  reasonBox:      {borderRadius: 10, padding: 10, borderWidth: 1, gap: 4},
  reasonRow:      {flexDirection: 'row', alignItems: 'center', gap: 6},
  reasonLabel:    {fontSize: 12, fontWeight: '500'},
  reasonValue:    {fontSize: 13, fontWeight: '600', flex: 1},
  noteText:       {fontSize: 12, paddingRight: 20},
  time:           {fontSize: 11},
  actions:        {flexDirection: 'row', gap: 10, marginTop: 4},
  rejectBtn:      {flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 12, borderWidth: 1.5},
  rejectText:     {fontSize: 14, fontWeight: '700'},
  approveBtn:     {flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 12},
  approveText:    {color: '#FFF', fontSize: 14, fontWeight: '700'},
  empty:          {alignItems: 'center', paddingTop: 60},
  emptyText:      {fontSize: 14},
});
