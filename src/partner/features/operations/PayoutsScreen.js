import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator, Alert, FlatList, Modal, StyleSheet, Text,
  TextInput, TouchableOpacity, TouchableWithoutFeedback, View,
} from 'react-native';
import {ArrowRight, Wallet, TrendingUp, Send, X} from 'lucide-react-native';
import {useTheme} from '../../../shared/context/ThemeContext';
import {getBikerPayouts, createPayout} from '../../../services/partner';
import RiyalIcon from '../../../shared/components/RiyalIcon';

function money(n) {
  return Number(n ?? 0).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
}

function bikerName(b) {
  const name = b.name
    ?? `${b.firstName ?? b.userId?.firstName ?? ''} ${b.lastName ?? b.userId?.lastName ?? ''}`.trim();
  // Fall back to the phone number when the API returns no name.
  return name || b.phoneNumber || b.userId?.phoneNumber || '—';
}

// Initial for the avatar — first letter of the name, or last digit of the phone.
function bikerInitial(b) {
  const name = b.name ?? `${b.firstName ?? ''}`.trim();
  if (name) return name.charAt(0);
  const phone = b.phoneNumber ?? b.userId?.phoneNumber ?? '';
  return phone ? phone.slice(-1) : '؟';
}

// Available balance — supports nested { balance: { available } } and flat shapes
function availableOf(b) {
  return b.balance?.available ?? b.available ?? (typeof b.balance === 'number' ? b.balance : 0) ?? 0;
}

// ─── Payout modal ───────────────────────────────────────────────────────────────
function PayoutModal({biker, colors, onClose, onConfirm, submitting}) {
  const available = availableOf(biker);
  const [amount, setAmount] = useState(String(available || ''));
  const [notes,  setNotes]  = useState('');

  const num = parseFloat(amount);
  const valid = num > 0 && num <= available;

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={m.overlay} />
      </TouchableWithoutFeedback>
      <View style={m.sheet}>
        <View style={[m.card, {backgroundColor: colors.card}]}>
          <View style={m.head}>
            <Text style={[m.title, {color: colors.textPrimary}]}>صرف دفعة — {bikerName(biker)}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
              <X size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={m.availableRow}>
            <Text style={[m.available, {color: colors.textSecondary}]}>الرصيد المتاح:</Text>
            <Text style={[m.available, {color: colors.success, fontWeight: '800'}]}>{money(available)}</Text>
            <RiyalIcon size={13} color={colors.success} />
          </View>

          <Text style={[m.label, {color: colors.textSecondary}]}>المبلغ</Text>
          <TextInput
            style={[m.input, {backgroundColor: colors.bg, borderColor: colors.border, color: colors.textPrimary}]}
            value={amount}
            onChangeText={t => setAmount(t.replace(/[^0-9.]/g, ''))}
            keyboardType="decimal-pad"
            placeholder="0.00"
            placeholderTextColor={colors.textSecondary}
          />

          <Text style={[m.label, {color: colors.textSecondary}]}>ملاحظات (اختياري)</Text>
          <TextInput
            style={[m.input, m.notes, {backgroundColor: colors.bg, borderColor: colors.border, color: colors.textPrimary}]}
            value={notes}
            onChangeText={setNotes}
            placeholder="سبب الصرف..."
            placeholderTextColor={colors.textSecondary}
            multiline
          />

          <TouchableOpacity
            style={[m.confirmBtn, {backgroundColor: valid && !submitting ? colors.primary : colors.border}]}
            onPress={() => onConfirm(num, notes.trim())}
            disabled={!valid || submitting}
            activeOpacity={0.85}>
            {submitting
              ? <ActivityIndicator color="#FFF" />
              : <Text style={m.confirmTxt}>تأكيد الصرف</Text>
            }
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const m = StyleSheet.create({
  overlay:    {position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.45)'},
  sheet:      {flex: 1, justifyContent: 'flex-end'},
  card:       {borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 32, gap: 8},
  head:       {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4},
  title:      {fontSize: 17, fontWeight: '800', flex: 1},
  available:  {fontSize: 13},
  availableRow: {flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8},
  label:      {fontSize: 12, fontWeight: '600', marginTop: 6},
  input:      {borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15},
  notes:      {minHeight: 70, textAlignVertical: 'top'},
  confirmBtn: {marginTop: 14, paddingVertical: 15, borderRadius: 14, alignItems: 'center'},
  confirmTxt: {color: '#FFF', fontSize: 16, fontWeight: '800'},
});

// ─── Biker payout card ──────────────────────────────────────────────────────────
function PayoutCard({item, colors, onPay}) {
  const available = availableOf(item);
  const earned    = item.balance?.totalEarnings ?? item.totalEarnings ?? item.totalEarned ?? 0;
  const paid      = item.balance?.totalPayouts ?? item.totalPayouts ?? 0;

  return (
    <View style={[s.card, {backgroundColor: colors.card, borderColor: colors.border}]}>
      <View style={s.cardTop}>
        <View style={[s.avatar, {backgroundColor: colors.primary + '18'}]}>
          <Text style={[s.avatarTxt, {color: colors.primary}]}>{bikerInitial(item)}</Text>
        </View>
        <View style={s.cardInfo}>
          <Text style={[s.name, {color: colors.textPrimary}]}>{bikerName(item)}</Text>
          <Text style={[s.availLabel, {color: colors.textSecondary}]}>الرصيد المتاح</Text>
          <View style={s.valueRow}>
            <Text style={[s.availVal, {color: colors.success}]}>{money(available)}</Text>
            <RiyalIcon size={16} color={colors.success} />
          </View>
        </View>
        <TouchableOpacity
          style={[s.payBtn, {backgroundColor: available > 0 ? colors.primary : colors.border}]}
          onPress={() => onPay(item)}
          disabled={available <= 0}
          activeOpacity={0.85}>
          <Send size={15} color="#FFF" />
          <Text style={s.payTxt}>صرف</Text>
        </TouchableOpacity>
      </View>

      <View style={[s.metaRow, {borderTopColor: colors.border}]}>
        <View style={s.metaCell}>
          <TrendingUp size={13} color={colors.textSecondary} />
          <Text style={[s.metaTxt, {color: colors.textSecondary}]}>كسب {money(earned)}</Text>
          <RiyalIcon size={12} color={colors.textSecondary} />
        </View>
        <View style={s.metaCell}>
          <Wallet size={13} color={colors.textSecondary} />
          <Text style={[s.metaTxt, {color: colors.textSecondary}]}>صُرف {money(paid)}</Text>
          <RiyalIcon size={12} color={colors.textSecondary} />
        </View>
      </View>
    </View>
  );
}

// ─── Screen ─────────────────────────────────────────────────────────────────────
export default function PayoutsScreen({onBack}) {
  const {colors} = useTheme();
  const [bikers,  setBikers]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(false);
  const [payTo,   setPayTo]   = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setError(false);
    const res = await getBikerPayouts();
    if (res.success) {
      const list = res.data?.data ?? res.data ?? [];
      setBikers(Array.isArray(list) ? list : []);
    } else {
      setError(true);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleConfirm = useCallback(async (amount, notes) => {
    if (!payTo) return;
    const id = payTo._id ?? payTo.id ?? payTo.bikerId ?? payTo.userId?._id;
    setSubmitting(true);
    const res = await createPayout(id, amount, 'bank_transfer', notes || undefined);
    setSubmitting(false);
    if (res.success) {
      setPayTo(null);
      Alert.alert('تم', 'تم صرف الدفعة بنجاح');
      load();
    } else if (res.code !== 'INSUFFICIENT_FUNDS' && res.code !== 'ADMIN_ONLY') {
      // scoped/financial errors are surfaced globally; show others here
      Alert.alert('خطأ', res.error ?? 'تعذّر صرف الدفعة');
    }
  }, [payTo, load]);

  const totalAvailable = useMemo(
    () => bikers.reduce((sum, b) => sum + availableOf(b), 0),
    [bikers],
  );

  const renderItem = useCallback(({item}) => (
    <PayoutCard item={item} colors={colors} onPay={setPayTo} />
  ), [colors]);

  const keyExtractor = useCallback((item, i) => item._id ?? item.id ?? String(i), []);

  return (
    <View style={[s.root, {backgroundColor: colors.bg}]}>
      {/* Header */}
      <View style={[s.header, {backgroundColor: colors.bg}]}>
        {onBack ? (
          <TouchableOpacity onPress={onBack} style={s.backBtn} activeOpacity={0.75}>
            <ArrowRight size={22} color={colors.textPrimary} />
          </TouchableOpacity>
        ) : <View style={s.backBtn} />}
        <View style={s.headerText}>
          <Text style={[s.headerTitle, {color: colors.textPrimary}]}>دفعات البايكرز</Text>
          <View style={s.headerSubRow}>
            <Text style={[s.headerSub, {color: colors.textSecondary}]}>
              إجمالي متاح للصرف: {money(totalAvailable)}
            </Text>
            <RiyalIcon size={12} color={colors.textSecondary} />
          </View>
        </View>
        <View style={s.backBtn} />
      </View>

      {loading ? (
        <View style={s.center}><ActivityIndicator size="large" color={colors.primary} /></View>
      ) : error ? (
        <View style={s.center}>
          <Text style={[s.msg, {color: colors.textSecondary}]}>تعذّر تحميل الأرصدة</Text>
          <TouchableOpacity
            style={[s.retryBtn, {backgroundColor: colors.primary}]}
            onPress={() => { setLoading(true); load(); }}
            activeOpacity={0.85}>
            <Text style={s.retryTxt}>إعادة المحاولة</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={bikers}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={s.center}>
              <Wallet size={48} color={colors.border} />
              <Text style={[s.msg, {color: colors.textSecondary}]}>لا توجد أرصدة بايكرز</Text>
            </View>
          }
        />
      )}

      {payTo && (
        <PayoutModal
          biker={payTo}
          colors={colors}
          submitting={submitting}
          onClose={() => setPayTo(null)}
          onConfirm={handleConfirm}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root:       {flex: 1},
  center:     {flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, paddingHorizontal: 32, paddingTop: 60},

  header:     {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 12},
  backBtn:    {width: 36, height: 36, alignItems: 'center', justifyContent: 'center'},
  headerText: {flex: 1, gap: 2, paddingHorizontal: 8, alignItems: 'center'},
  headerTitle:{fontSize: 22, fontWeight: '900'},
  headerSub:  {fontSize: 12},
  headerSubRow:{flexDirection: 'row', alignItems: 'center', gap: 3},

  list:       {paddingHorizontal: 16, paddingTop: 8, paddingBottom: 32, gap: 12},

  card:       {borderRadius: 18, borderWidth: 1, padding: 14, gap: 12},
  cardTop:    {flexDirection: 'row', alignItems: 'center', gap: 12},
  avatar:     {width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center'},
  avatarTxt:  {fontSize: 18, fontWeight: '800'},
  cardInfo:   {flex: 1, gap: 2},
  name:       {fontSize: 15, fontWeight: '800'},
  availLabel: {fontSize: 11},
  valueRow:   {flexDirection: 'row', alignItems: 'center', gap: 3},
  availVal:   {fontSize: 16, fontWeight: '900'},
  payBtn:     {flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12},
  payTxt:     {color: '#FFF', fontSize: 13, fontWeight: '800'},

  metaRow:    {flexDirection: 'row', justifyContent: 'space-around', borderTopWidth: 1, paddingTop: 10},
  metaCell:   {flexDirection: 'row', alignItems: 'center', gap: 5},
  metaTxt:    {fontSize: 12, fontWeight: '500'},

  msg:        {fontSize: 14, textAlign: 'center'},
  retryBtn:   {paddingHorizontal: 24, paddingVertical: 12, borderRadius: 14},
  retryTxt:   {color: '#FFF', fontSize: 15, fontWeight: '700'},
});
