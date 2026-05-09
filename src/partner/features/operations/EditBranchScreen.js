import React, {useCallback, useEffect, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import {ArrowRight, MapPin, Navigation, Plus, Trash2, Clock, ChevronUp, ChevronDown, Wrench} from 'lucide-react-native';
import {useTheme} from '../../../shared/context/ThemeContext';
import DeleteConfirmModal from '../../../shared/components/DeleteConfirmModal';
import {updateBranch, getBranchServices} from '../../../services/partner';

// ─── Time stepper (hour + minute with +/- buttons) ───────────────────────────
function TimeStepper({value, onChange, colors}) {
  const parts  = (value || '09:00').split(':');
  const hour   = parseInt(parts[0], 10) || 0;
  const minute = parseInt(parts[1], 10) || 0;
  const fmt    = (h, m) => `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

  return (
    <View style={[tp.wrap, {backgroundColor: colors.bg, borderColor: colors.border}]}>
      {/* Minutes */}
      <View style={tp.col}>
        <TouchableOpacity onPress={() => onChange(fmt(hour, (minute + 5) % 60))} hitSlop={8} activeOpacity={0.7}>
          <ChevronUp size={16} color={colors.primary} />
        </TouchableOpacity>
        <Text style={[tp.num, {color: colors.textPrimary}]}>{String(minute).padStart(2, '0')}</Text>
        <TouchableOpacity onPress={() => onChange(fmt(hour, (minute - 5 + 60) % 60))} hitSlop={8} activeOpacity={0.7}>
          <ChevronDown size={16} color={colors.primary} />
        </TouchableOpacity>
      </View>
      <Text style={[tp.colon, {color: colors.textSecondary}]}>:</Text>
      {/* Hours */}
      <View style={tp.col}>
        <TouchableOpacity onPress={() => onChange(fmt((hour + 1) % 24, minute))} hitSlop={8} activeOpacity={0.7}>
          <ChevronUp size={16} color={colors.primary} />
        </TouchableOpacity>
        <Text style={[tp.num, {color: colors.textPrimary}]}>{String(hour).padStart(2, '0')}</Text>
        <TouchableOpacity onPress={() => onChange(fmt((hour - 1 + 24) % 24, minute))} hitSlop={8} activeOpacity={0.7}>
          <ChevronDown size={16} color={colors.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const DAYS = [
  {key: 'saturday',  label: 'السبت'},
  {key: 'sunday',    label: 'الاحد'},
  {key: 'monday',    label: 'الاثنين'},
  {key: 'tuesday',   label: 'الثلاثاء'},
  {key: 'wednesday', label: 'الاربعاء'},
  {key: 'thursday',  label: 'الخميس'},
  {key: 'friday',    label: 'الجمعة'},
];

function fromWorkHours(workHours) {
  return DAYS.reduce((acc, d) => {
    const intervals = workHours?.[d.key];
    const isOpen = Array.isArray(intervals) && intervals.length > 0;
    acc[d.key] = {
      enabled: isOpen,
      slots: isOpen
        ? intervals.map((iv, i) => ({id: String(i), from: iv.start ?? '09:00', to: iv.end ?? '22:00'}))
        : [],
    };
    return acc;
  }, {});
}

function toWorkHours(days) {
  return Object.fromEntries(
    DAYS.map(d => [
      d.key,
      days[d.key].enabled
        ? days[d.key].slots.map(s => ({start: s.from, end: s.to}))
        : [],
    ]),
  );
}

// ─── Slot row ─────────────────────────────────────────────────────────────────
function SlotRow({slot, onChangeFrom, onChangeTo, onDelete, colors}) {
  return (
    <View style={[r.row, {backgroundColor: colors.bg, borderColor: colors.border}]}>
      <View style={r.times}>
        <View style={r.timeCol}>
          <Text style={[r.lbl, {color: colors.textSecondary}]}>إلى</Text>
          <TimeStepper value={slot.to}   onChange={onChangeTo}   colors={colors} />
        </View>
        <Text style={[r.dash, {color: colors.textSecondary}]}>—</Text>
        <View style={r.timeCol}>
          <Text style={[r.lbl, {color: colors.textSecondary}]}>من</Text>
          <TimeStepper value={slot.from} onChange={onChangeFrom} colors={colors} />
        </View>
      </View>
      <TouchableOpacity onPress={onDelete} hitSlop={10} activeOpacity={0.7} style={r.del}>
        <Trash2 size={15} color={colors.danger} />
      </TouchableOpacity>
    </View>
  );
}

// ─── Day slots modal ──────────────────────────────────────────────────────────
function DaySlotsModal({visible, day, slots, onAddSlot, onUpdateSlot, onDeleteSlot, onClose, colors}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={m.overlay} />
      </TouchableWithoutFeedback>
      <View style={m.sheet}>
        <View style={[m.card, {backgroundColor: colors.card}]}>
          <View style={[m.handle, {backgroundColor: colors.border}]} />
          <View style={m.modalHeader}>
            <Text style={[m.title, {color: colors.textPrimary}]}>{day?.label}</Text>
            <TouchableOpacity
              style={[m.addBtn, {backgroundColor: colors.primary}]}
              onPress={onAddSlot}
              activeOpacity={0.85}>
              <Plus size={15} color="#FFF" />
              <Text style={m.addTxt}>إضافة فترة</Text>
            </TouchableOpacity>
          </View>

          {slots.length === 0 ? (
            <View style={m.empty}>
              <Clock size={26} color={colors.textSecondary} />
              <Text style={[m.emptyTxt, {color: colors.textSecondary}]}>لا توجد فترات — اضغط إضافة فترة</Text>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} style={m.list} keyboardShouldPersistTaps="handled">
              {slots.map(slot => (
                <SlotRow
                  key={slot.id}
                  slot={slot}
                  onChangeFrom={v => onUpdateSlot(slot.id, 'from', v)}
                  onChangeTo={v => onUpdateSlot(slot.id, 'to', v)}
                  onDelete={() => onDeleteSlot(slot.id)}
                  colors={colors}
                />
              ))}
            </ScrollView>
          )}

          <TouchableOpacity style={[m.doneBtn, {backgroundColor: colors.primary}]} onPress={onClose} activeOpacity={0.85}>
            <Text style={m.doneTxt}>تم</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function EditBranchScreen({branch, onBack, onSaved}) {
  const {colors} = useTheme();

  const branchId  = branch?._id ?? branch?.id;
  const [branchName, setBranchName] = useState(branch?.name?.ar ?? branch?.nameAr ?? '');
  const [isMain,     setIsMain]     = useState(branch?.isMain ?? false);
  const [showDelete, setShowDelete] = useState(false);
  const [editingDay, setEditingDay] = useState(null);
  const [saving,     setSaving]     = useState(false);

  const [days,      setDays]      = useState(() => fromWorkHours(branch?.workHours));
  const [services,  setServices]  = useState([]);
  const [svcsLoading, setSvcsLoading] = useState(true);


  useEffect(() => {
    getBranchServices(branchId).then(res => {
      if (res.success) {
        const list = res.data?.data ?? res.data ?? [];
        const arr  = Array.isArray(list) ? list : [];
        setServices(arr);
      }
      setSvcsLoading(false);
    });
  }, [branchId]);

  const handleToggleSvc = useCallback((serviceId, val) => {
    setServices(prev => prev.map(sv => sv.serviceId === serviceId ? {...sv, isEnabled: val} : sv));
  }, []);

  const toggleDay = key =>
    setDays(prev => ({...prev, [key]: {...prev[key], enabled: !prev[key].enabled}}));

  const addSlot = key => {
    const id = String(Date.now());
    setDays(prev => {
      const existing = prev[key].slots;
      const lastTo   = existing.length > 0 ? existing[existing.length - 1].to : '09:00';
      return {
        ...prev,
        [key]: {...prev[key], slots: [...existing, {id, from: lastTo, to: lastTo}]},
      };
    });
  };

  const updateSlot = (key, slotId, field, val) => {
    setDays(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        slots: prev[key].slots.map(s => s.id === slotId ? {...s, [field]: val} : s),
      },
    }));
  };

  const deleteSlot = (key, slotId) => {
    setDays(prev => ({
      ...prev,
      [key]: {...prev[key], slots: prev[key].slots.filter(s => s.id !== slotId)},
    }));
  };

  return (
    <View style={[s.root, {backgroundColor: colors.bg}]}>
      <View style={[s.header, {backgroundColor: colors.bg}]}>
        <TouchableOpacity onPress={onBack} style={s.backBtn} activeOpacity={0.75}>
          <ArrowRight size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, {color: colors.textPrimary}]}>تعديل فرع</Text>
        <View style={s.backBtn} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

        {/* Branch name */}
        <Text style={[s.label, {color: colors.textPrimary}]}>اسم الفرع</Text>
        <View style={[s.inputBox, {backgroundColor: colors.card, borderColor: colors.border}]}>
          <TextInput
            style={[s.input, {color: colors.textPrimary}]}
            value={branchName}
            onChangeText={setBranchName}
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        {/* Location */}
        <Text style={[s.label, {color: colors.textPrimary}]}>حدد الموقع</Text>
        <View style={[s.locationCard, {backgroundColor: colors.card}]}>
          <View style={[s.iconBox, {backgroundColor: colors.primary + '15'}]}>
            <Navigation size={18} color={colors.primary} />
          </View>
          <View style={s.locationText}>
            <Text style={[s.locationName, {color: colors.textPrimary}]}>
              {branch?.nameAr || 'طريق الملك فهد'}
            </Text>
            <Text style={[s.locationSub, {color: colors.textSecondary}]}>
              {branch?.address || 'البرج 4 , شارع الياسمين'}
            </Text>
          </View>
          <View style={[s.iconBox, {backgroundColor: colors.primary + '15'}]}>
            <MapPin size={18} color={colors.primary} />
          </View>
        </View>

        {/* Working days */}
        <Text style={[s.label, {color: colors.textPrimary}]}>أيام العمل</Text>
        <View style={[s.daysCard, {backgroundColor: colors.card}]}>
          {DAYS.map((day, i) => {
            const d = days[day.key];
            const firstSlot = d.slots[0];
            const summary = firstSlot ? `${firstSlot.from} – ${firstSlot.to}` : null;
            return (
              <View key={day.key}>
                <TouchableOpacity
                  style={s.dayRow}
                  onPress={() => d.enabled && setEditingDay(day.key)}
                  activeOpacity={d.enabled ? 0.7 : 1}>
                  <Switch
                    value={d.enabled}
                    onValueChange={() => toggleDay(day.key)}
                    trackColor={{false: colors.border, true: colors.primary}}
                    thumbColor="#FFF"
                  />
                  <View style={s.dayInfo}>
                    <Text style={[s.dayLabel, {color: d.enabled ? colors.textPrimary : colors.textSecondary}]}>
                      {day.label}
                    </Text>
                    {d.enabled && summary && (
                      <Text style={[s.daySummary, {color: colors.textSecondary}]}>{summary}</Text>
                    )}
                  </View>
                  {d.enabled ? (
                    <View style={[s.slotsBadge, {backgroundColor: colors.primary + '12'}]}>
                      <Clock size={11} color={colors.primary} />
                      <Text style={[s.slotsBadgeTxt, {color: colors.primary}]}>
                        {d.slots.length > 0 ? `${d.slots.length} فترة` : 'لا فترات'}
                      </Text>
                    </View>
                  ) : (
                    <View style={[s.slotsBadge, {backgroundColor: colors.border}]}>
                      <Text style={[s.slotsBadgeTxt, {color: colors.textSecondary}]}>مغلق</Text>
                    </View>
                  )}
                </TouchableOpacity>
                {i < DAYS.length - 1 && <View style={[s.sep, {backgroundColor: colors.border}]} />}
              </View>
            );
          })}
        </View>

        {/* Services */}
        <Text style={[s.label, {color: colors.textPrimary}]}>الخدمات</Text>
        <View style={[s.daysCard, {backgroundColor: colors.card}]}>
          {svcsLoading ? (
            <ActivityIndicator size="small" color={colors.primary} style={{margin: 16}} />
          ) : services.length === 0 ? (
            <View style={s.svcsEmpty}>
              <Wrench size={20} color={colors.textSecondary} />
              <Text style={[s.svcsEmptyTxt, {color: colors.textSecondary}]}>لا توجد خدمات</Text>
            </View>
          ) : (
            services.map((sv, i) => {
              const name     = sv.service?.name?.ar ?? sv.service?.name?.en ?? sv.serviceId ?? '';
              const duration = sv?.service?.estimationTime ?? sv.estimationTime ;
              return (
                <View key={sv.serviceId}>
                  <View style={s.svcRow}>
                    <Switch
                      value={sv.isEnabled ?? false}
                      onValueChange={v => handleToggleSvc(sv.serviceId, v)}
                      trackColor={{false: colors.border, true: colors.primary}}
                      thumbColor="#FFF"
                    />
                    <Text style={[s.svcName, {color: sv.isEnabled ? colors.textPrimary : colors.textSecondary}]}>
                      {name}
                    </Text>
                    {duration != null && (
                      <View style={[s.slotsBadge, {backgroundColor: colors.primary + '12'}]}>
                        <Clock size={11} color={colors.primary} />
                        <Text style={[s.slotsBadgeTxt, {color: colors.primary}]}>{duration} د</Text>
                      </View>
                    )}
                  </View>
                  {i < services.length - 1 && <View style={[s.sep, {backgroundColor: colors.border}]} />}
                </View>
              );
            })
          )}
        </View>

        {/* Main branch toggle */}
        <Text style={[s.label, {color: colors.textPrimary}]}>الفرع الاساسي</Text>
        <View style={[s.mainCard, {backgroundColor: colors.card}]}>
          <Switch
            value={isMain}
            onValueChange={setIsMain}
            trackColor={{false: colors.border, true: colors.primary}}
            thumbColor="#FFF"
          />
          <View style={s.mainText}>
            <Text style={[s.mainLabel, {color: colors.textPrimary}]}>اجعل هذا الفرع الاساسي</Text>
            <Text style={[s.mainSub, {color: colors.textSecondary}]}>
              سيتم اغلاق الخدمة 10 دقائق قبل وبعد الصلاة
            </Text>
          </View>
        </View>

        <View style={s.footer}>
          <TouchableOpacity
            style={[s.saveBtn, {backgroundColor: colors.primary}]}
            activeOpacity={0.85}
            disabled={saving}
            onPress={async () => {
              if (saving || !branchId) return;
              setSaving(true);
              const res = await updateBranch(branchId, {
                name: {ar: branchName.trim(), en: branchName.trim()},
                workHours: toWorkHours(days),
                services: services.map(sv => ({serviceId: sv.serviceId, isEnabled: sv.isEnabled ?? false})),
              });
              setSaving(false);
              if (!res.success) {
                Alert.alert('خطأ', 'تعذّر حفظ التعديلات، يرجى المحاولة مجدداً');
                return;
              }
              onSaved?.();
              onBack();
            }}>
            {saving
              ? <ActivityIndicator color="#FFF" />
              : <Text style={s.saveTxt}>حفظ</Text>
            }
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.deleteBtn, {backgroundColor: '#FEE2E2', borderColor: '#FCA5A5'}]}
            onPress={() => setShowDelete(true)}
            activeOpacity={0.85}>
            <Text style={[s.deleteTxt, {color: '#EF4444'}]}>حذف الفرع</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>

      <DaySlotsModal
        visible={!!editingDay}
        day={editingDay ? DAYS.find(d => d.key === editingDay) : null}
        slots={editingDay ? days[editingDay].slots : []}
        onAddSlot={() => addSlot(editingDay)}
        onUpdateSlot={(slotId, field, val) => updateSlot(editingDay, slotId, field, val)}
        onDeleteSlot={slotId => deleteSlot(editingDay, slotId)}
        onClose={() => setEditingDay(null)}
        colors={colors}
      />

      <DeleteConfirmModal
        visible={showDelete}
        title="حذف نهائياً"
        message="سيتم حذف الفرع بشكل نهائي , ولا يمكنك التراجع."
        confirmLabel="حذف الفرع"
        onConfirm={() => { setShowDelete(false); onBack(); }}
        onClose={() => setShowDelete(false)}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root:         {flex: 1},
  header:       {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 12},
  headerTitle:  {fontSize: 20, fontWeight: '800'},
  backBtn:      {width: 36, height: 36, alignItems: 'center', justifyContent: 'center'},
  scroll:       {paddingHorizontal: 16, paddingBottom: 40, gap: 8},
  label:        {fontSize: 14, fontWeight: '700', marginTop: 8, marginBottom: 4},

  inputBox:     {borderRadius: 14, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 14},
  input:        {fontSize: 14, padding: 0},

  locationCard: {flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 16, elevation: 1, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: {width: 0, height: 1}},
  iconBox:      {width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center'},
  locationText: {flex: 1, gap: 3},
  locationName: {fontSize: 15, fontWeight: '800'},
  locationSub:  {fontSize: 12},

  daysCard:     {borderRadius: 16, overflow: 'hidden', elevation: 1, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: {width: 0, height: 1}},
  dayRow:       {flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 14},
  dayInfo:      {flex: 1, gap: 2},
  dayLabel:     {fontSize: 14, fontWeight: '600'},
  daySummary:   {fontSize: 11},
  slotsBadge:   {flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20},
  slotsBadgeTxt:{fontSize: 11, fontWeight: '700'},
  sep:          {height: 1},

  svcRow:       {flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 14},
  svcName:      {flex: 1, fontSize: 14, fontWeight: '600'},
  svcsEmpty:    {flexDirection: 'row', alignItems: 'center', gap: 8, padding: 16},
  svcsEmptyTxt: {fontSize: 13},

  mainCard:     {flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 16, borderRadius: 16, elevation: 1, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: {width: 0, height: 1}},
  mainText:     {flex: 1, gap: 4},
  mainLabel:    {fontSize: 14, fontWeight: '700'},
  mainSub:      {fontSize: 12, lineHeight: 18},

  footer:       {flexDirection: 'row', gap: 12, marginTop: 16},
  saveBtn:      {flex: 1, paddingVertical: 16, borderRadius: 16, alignItems: 'center'},
  saveTxt:      {color: '#FFF', fontSize: 16, fontWeight: '800'},
  deleteBtn:    {flex: 1, paddingVertical: 16, borderRadius: 16, alignItems: 'center', borderWidth: 1},
  deleteTxt:    {fontSize: 16, fontWeight: '800'},
});

// ─── Modal styles ─────────────────────────────────────────────────────────────
const m = StyleSheet.create({
  overlay:     {position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)'},
  sheet:       {flex: 1, justifyContent: 'flex-end', paddingHorizontal: 16, paddingBottom: 32},
  card:        {borderRadius: 24, padding: 20, gap: 16, maxHeight: '80%'},
  handle:      {width: 40, height: 4, borderRadius: 2, alignSelf: 'center'},
  modalHeader: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  title:       {fontSize: 18, fontWeight: '800'},
  addBtn:      {flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20},
  addTxt:      {color: '#FFF', fontSize: 13, fontWeight: '700'},
  list:        {maxHeight: 340},
  empty:       {alignItems: 'center', gap: 10, paddingVertical: 28},
  emptyTxt:    {fontSize: 13},
  doneBtn:     {paddingVertical: 15, borderRadius: 14, alignItems: 'center'},
  doneTxt:     {color: '#FFF', fontSize: 16, fontWeight: '800'},
});

// ─── Slot row styles ──────────────────────────────────────────────────────────
const r = StyleSheet.create({
  row:     {flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 14, borderWidth: 1, marginBottom: 10},
  times:   {flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8},
  timeCol: {flex: 1, alignItems: 'center', gap: 4},
  lbl:     {fontSize: 11, fontWeight: '600'},
  dash:    {fontSize: 16, fontWeight: '300'},
  del:     {width: 32, height: 32, alignItems: 'center', justifyContent: 'center'},
});

// ─── Time stepper styles ──────────────────────────────────────────────────────
const tp = StyleSheet.create({
  wrap:  {flexDirection: 'row', alignItems: 'center', gap: 2, borderRadius: 12, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 6},
  col:   {alignItems: 'center', gap: 2, minWidth: 32},
  num:   {fontSize: 18, fontWeight: '800', lineHeight: 22},
  colon: {fontSize: 18, fontWeight: '300', marginBottom: 2},
});
