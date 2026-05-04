import React, {useState} from 'react';
import {
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
import {ArrowRight, MapPin, Navigation, Plus, Trash2, Clock, ChevronUp, ChevronDown} from 'lucide-react-native';
import {useTheme} from '../../../shared/context/ThemeContext';
import DeleteConfirmModal from '../../../shared/components/DeleteConfirmModal';

// ─── Time stepper (hour + minute with +/- buttons) ───────────────────────────
function TimeStepper({value, onChange, colors}) {
  // value: "HH:MM"
  const parts  = (value || '09:00').split(':');
  const hour   = parseInt(parts[0], 10) || 0;
  const minute = parseInt(parts[1], 10) || 0;

  const fmt = (h, m) => `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

  const changeHour = delta => {
    const next = (hour + delta + 24) % 24;
    onChange(fmt(next, minute));
  };
  const changeMinute = delta => {
    const next = (minute + delta + 60) % 60;
    onChange(fmt(hour, next));
  };

  return (
    <View style={[tp.wrap, {backgroundColor: colors.bg, borderColor: colors.border}]}>
      {/* Minutes */}
      <View style={tp.col}>
        <TouchableOpacity onPress={() => changeMinute(5)} hitSlop={8} activeOpacity={0.7}>
          <ChevronUp size={16} color={colors.primary} />
        </TouchableOpacity>
        <Text style={[tp.num, {color: colors.textPrimary}]}>{String(minute).padStart(2, '0')}</Text>
        <TouchableOpacity onPress={() => changeMinute(-5)} hitSlop={8} activeOpacity={0.7}>
          <ChevronDown size={16} color={colors.primary} />
        </TouchableOpacity>
      </View>
      <Text style={[tp.colon, {color: colors.textSecondary}]}>:</Text>
      {/* Hours */}
      <View style={tp.col}>
        <TouchableOpacity onPress={() => changeHour(1)} hitSlop={8} activeOpacity={0.7}>
          <ChevronUp size={16} color={colors.primary} />
        </TouchableOpacity>
        <Text style={[tp.num, {color: colors.textPrimary}]}>{String(hour).padStart(2, '0')}</Text>
        <TouchableOpacity onPress={() => changeHour(-1)} hitSlop={8} activeOpacity={0.7}>
          <ChevronDown size={16} color={colors.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const DAYS = [
  {key: 'sat', label: 'السبت'},
  {key: 'sun', label: 'الاحد'},
  {key: 'mon', label: 'الاثنين'},
  {key: 'tue', label: 'الثلاثاء'},
  {key: 'wed', label: 'الاربعاء'},
  {key: 'thu', label: 'الخميس'},
  {key: 'fri', label: 'الجمعة'},
];

// ─── Slot row (from → to steppers + delete) ──────────────────────────────────
function SlotRow({slot, onChangeFrom, onChangeTo, onDelete, colors}) {
  return (
    <View style={[m.slotRow, {backgroundColor: colors.bg, borderColor: colors.border}]}>
      <View style={m.slotBody}>
        <View style={m.slotTimes}>
          {/* "إلى" on the right side (RTL: displayed first) */}
          <View style={m.slotTimeCol}>
            <Text style={[m.slotLabel, {color: colors.textSecondary}]}>إلى</Text>
            <TimeStepper value={slot.to} onChange={onChangeTo} colors={colors} />
          </View>
          <Text style={[m.slotDash, {color: colors.textSecondary}]}>–</Text>
          {/* "من" */}
          <View style={m.slotTimeCol}>
            <Text style={[m.slotLabel, {color: colors.textSecondary}]}>من</Text>
            <TimeStepper value={slot.from} onChange={onChangeFrom} colors={colors} />
          </View>
        </View>
      </View>
      <TouchableOpacity onPress={onDelete} hitSlop={8} activeOpacity={0.7} style={m.slotDelete}>
        <Trash2 size={16} color={colors.danger} />
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
              style={[m.addSlotBtn, {backgroundColor: colors.primary}]}
              onPress={onAddSlot}
              activeOpacity={0.85}>
              <Plus size={16} color="#FFF" />
              <Text style={m.addSlotTxt}>إضافة فترة</Text>
            </TouchableOpacity>
          </View>

          {slots.length === 0 ? (
            <View style={m.emptyWrap}>
              <Clock size={28} color={colors.textSecondary} />
              <Text style={[m.emptyTxt, {color: colors.textSecondary}]}>
                لا توجد فترات عمل — اضغط إضافة فترة
              </Text>
            </View>
          ) : (
            <ScrollView
              showsVerticalScrollIndicator={false}
              style={m.slotsList}
              keyboardShouldPersistTaps="handled">
              {slots.map((slot, i) => (
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

          <TouchableOpacity
            style={[m.doneBtn, {backgroundColor: colors.primary}]}
            onPress={onClose}
            activeOpacity={0.85}>
            <Text style={m.doneTxt}>حفظ</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function EditBranchScreen({branch, onBack}) {
  const {colors} = useTheme();

  const [branchName, setBranchName] = useState(branch?.nameAr || 'مغسلة فينيسيوس - فرع شارع الياسمين');
  const [isMain,     setIsMain]     = useState(branch?.isMain ?? true);
  const [showDelete, setShowDelete] = useState(false);
  const [editingDay, setEditingDay] = useState(null);

  const [days, setDays] = useState(() =>
    DAYS.reduce((acc, d) => {
      acc[d.key] = {
        enabled: d.key !== 'fri',
        slots: d.key !== 'fri'
          ? [{id: '1', from: '09:00', to: '22:00'}]
          : [],
      };
      return acc;
    }, {}),
  );

  const toggleDay = key =>
    setDays(prev => ({...prev, [key]: {...prev[key], enabled: !prev[key].enabled}}));

  const addSlot = key => {
    const id = String(Date.now());
    setDays(prev => ({
      ...prev,
      [key]: {...prev[key], slots: [...prev[key].slots, {id, from: '', to: ''}]},
    }));
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

  const editingDayObj = editingDay ? DAYS.find(d => d.key === editingDay) : null;
  const editingSlots  = editingDay ? days[editingDay].slots : [];

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
            const slotsCount = d.slots.length;
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
                  <Text style={[s.dayLabel, {color: d.enabled ? colors.textPrimary : colors.textSecondary}]}>
                    {day.label}
                  </Text>
                  {d.enabled ? (
                    <View style={[s.slotsBadge, {backgroundColor: colors.primary + '12'}]}>
                      <Clock size={12} color={colors.primary} />
                      <Text style={[s.slotsBadgeTxt, {color: colors.primary}]}>
                        {slotsCount > 0 ? `${slotsCount} فترة` : 'لا فترات'}
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
          <TouchableOpacity style={[s.saveBtn, {backgroundColor: colors.primary}]} activeOpacity={0.85}>
            <Text style={s.saveTxt}>حفظ</Text>
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
        day={editingDayObj}
        slots={editingSlots}
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
  dayLabel:     {flex: 1, fontSize: 14, fontWeight: '600'},
  slotsBadge:   {flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20},
  slotsBadgeTxt:{fontSize: 12, fontWeight: '700'},
  sep:          {height: 1},

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

const m = StyleSheet.create({
  overlay:      {position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)'},
  sheet:        {flex: 1, justifyContent: 'flex-end', paddingHorizontal: 16, paddingBottom: 32},
  card:         {borderRadius: 24, padding: 20, gap: 16, maxHeight: '85%'},
  handle:       {width: 40, height: 4, borderRadius: 2, alignSelf: 'center'},

  modalHeader:  {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  title:        {fontSize: 18, fontWeight: '800'},
  addSlotBtn:   {flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20},
  addSlotTxt:   {color: '#FFF', fontSize: 13, fontWeight: '700'},

  slotsList:    {maxHeight: 360},
  slotRow:      {flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 16, borderWidth: 1, marginBottom: 10},
  slotBody:     {flex: 1},
  slotTimes:    {flexDirection: 'row', alignItems: 'center', gap: 8},
  slotTimeCol:  {flex: 1, alignItems: 'center', gap: 4},
  slotLabel:    {fontSize: 11, fontWeight: '600'},
  slotDash:     {fontSize: 18, fontWeight: '300', marginTop: 18},
  slotDelete:   {width: 32, height: 32, alignItems: 'center', justifyContent: 'center'},

  emptyWrap:    {alignItems: 'center', gap: 10, paddingVertical: 24},
  emptyTxt:     {fontSize: 13, textAlign: 'center'},

  doneBtn:      {paddingVertical: 16, borderRadius: 14, alignItems: 'center'},
  doneTxt:      {color: '#FFF', fontSize: 16, fontWeight: '800'},
});

const tp = StyleSheet.create({
  wrap:   {flexDirection: 'row', alignItems: 'center', gap: 2, borderRadius: 12, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 6},
  col:    {alignItems: 'center', gap: 2, minWidth: 32},
  num:    {fontSize: 18, fontWeight: '800', lineHeight: 22},
  colon:  {fontSize: 18, fontWeight: '300', marginBottom: 2},
});
