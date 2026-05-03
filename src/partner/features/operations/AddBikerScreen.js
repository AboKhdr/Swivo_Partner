import React, {useState} from 'react';
import {
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {ArrowRight, User, Phone, Clock} from 'lucide-react-native';
import {useTheme} from '../../../shared/context/ThemeContext';
import SelectField from '../../../shared/components/SelectField';
import ImagePickerField from '../../../shared/components/ImagePickerField';

const MOCK_BRANCHES = [
  {value: 'b1', label: 'الفرع الرئيسي - شارع الياسمين'},
  {value: 'b2', label: 'فرع العليا'},
  {value: 'b3', label: 'فرع النرجس'},
];

const DAYS = [
  {key: 'sat', label: 'السبت'},
  {key: 'sun', label: 'الأحد'},
  {key: 'mon', label: 'الاثنين'},
  {key: 'tue', label: 'الثلاثاء'},
  {key: 'wed', label: 'الأربعاء'},
  {key: 'thu', label: 'الخميس'},
  {key: 'fri', label: 'الجمعة'},
];

const DEFAULT_DAYS = DAYS.reduce((acc, d) => {
  acc[d.key] = {enabled: d.key !== 'fri', open: '07:00', close: '23:00'};
  return acc;
}, {});

function InputRow({icon: Icon, placeholder, value, onChangeText, keyboardType, colors}) {
  return (
    <View style={[s.inputBox, {backgroundColor: colors.card, borderColor: colors.border}]}>
      <Icon size={18} color={colors.textSecondary} />
      <TextInput
        style={[s.input, {color: colors.textPrimary}]}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType ?? 'default'}
      />
    </View>
  );
}

export default function AddBikerScreen({onBack, onSave, initialData}) {
  const {colors} = useTheme();
  const isEdit = !!initialData;

  const [photo,  setPhoto]  = useState(initialData?.photo    ?? null);
  const [name,   setName]   = useState(initialData?.name     ?? '');
  const [phone,  setPhone]  = useState(initialData?.phone    ?? '');
  const [branch, setBranch] = useState(initialData?.branchId ?? '');
  const [days,   setDays]   = useState(initialData?.days     ?? DEFAULT_DAYS);

  const toggleDay = key =>
    setDays(prev => ({...prev, [key]: {...prev[key], enabled: !prev[key].enabled}}));

  const canSave = name.trim() && phone.trim() && branch;

  const handleSave = () => {
    if (!canSave) return;
    onSave?.({photo, name, phone, branchId: branch, days});
    onBack();
  };

  return (
    <View style={[s.root, {backgroundColor: colors.bg}]}>
      {/* Header */}
      <View style={[s.header, {backgroundColor: colors.bg}]}>
        <TouchableOpacity onPress={onBack} style={s.backBtn} activeOpacity={0.75}>
          <ArrowRight size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, {color: colors.textPrimary}]}>
          {isEdit ? 'تعديل بايكر' : 'إضافة بايكر'}
        </Text>
        <View style={s.backBtn} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

        {/* Photo */}
        <ImagePickerField value={photo} onChange={setPhoto} label="صورة البايكر" />

        {/* Personal info */}
        <View style={s.sectionHeader}>
          <View style={[s.sectionIcon, {backgroundColor: colors.primary + '15'}]}>
            <User size={16} color={colors.primary} />
          </View>
          <Text style={[s.sectionTitle, {color: colors.textPrimary}]}>المعلومات الشخصية</Text>
        </View>

        <View style={[s.card, {backgroundColor: colors.card}]}>
          <InputRow
            icon={User}
            placeholder="الاسم الكامل"
            value={name}
            onChangeText={setName}
            colors={colors}
          />
          <View style={[s.cardSep, {backgroundColor: colors.border}]} />
          <InputRow
            icon={Phone}
            placeholder="رقم الجوال"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            colors={colors}
          />
        </View>

        {/* Branch */}
        <SelectField
          label="الفرع التابع له"
          placeholder="اختر الفرع"
          options={MOCK_BRANCHES}
          value={branch}
          onChange={setBranch}
        />

        {/* Working hours */}
        <View style={s.sectionHeader}>
          <View style={[s.sectionIcon, {backgroundColor: colors.primary + '15'}]}>
            <Clock size={16} color={colors.primary} />
          </View>
          <Text style={[s.sectionTitle, {color: colors.textPrimary}]}>ساعات العمل</Text>
        </View>

        <View style={[s.daysCard, {backgroundColor: colors.card}]}>
          {DAYS.map((day, i) => {
            const d = days[day.key];
            return (
              <View key={day.key}>
                <View style={s.dayRow}>
                  <Switch
                    value={d.enabled}
                    onValueChange={() => toggleDay(day.key)}
                    trackColor={{false: colors.border, true: colors.primary}}
                    thumbColor="#FFF"
                  />
                  <View style={[s.dayTimes, !d.enabled && s.dimmed]}>
                    <View style={[s.timeBox, {backgroundColor: colors.bg}]}>
                      <Text style={[s.timeText, {color: d.enabled ? colors.textPrimary : colors.textSecondary}]}>
                        {d.close}
                      </Text>
                    </View>
                    <Text style={[s.timeSep, {color: colors.textSecondary}]}>—</Text>
                    <View style={[s.timeBox, {backgroundColor: colors.bg}]}>
                      <Text style={[s.timeText, {color: d.enabled ? colors.textPrimary : colors.textSecondary}]}>
                        {d.open}
                      </Text>
                    </View>
                  </View>
                  <Text style={[s.dayLabel, {color: d.enabled ? colors.textPrimary : colors.textSecondary}]}>
                    {day.label}
                  </Text>
                </View>
                {i < DAYS.length - 1 && (
                  <View style={[s.sep, {backgroundColor: colors.border}]} />
                )}
              </View>
            );
          })}
        </View>

        {/* Save */}
        <TouchableOpacity
          style={[s.saveBtn, {backgroundColor: canSave ? colors.primary : colors.border}]}
          onPress={handleSave}
          disabled={!canSave}
          activeOpacity={0.85}>
          <Text style={s.saveTxt}>{isEdit ? 'حفظ التعديلات' : 'إضافة البايكر'}</Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root:          {flex: 1},
  header:        {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 12},
  headerTitle:   {fontSize: 20, fontWeight: '800'},
  backBtn:       {width: 36, height: 36, alignItems: 'center', justifyContent: 'center'},
  scroll:        {paddingHorizontal: 16, paddingBottom: 40, gap: 10},

  sectionHeader: {flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8},
  sectionIcon:   {width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center'},
  sectionTitle:  {fontSize: 15, fontWeight: '800'},

  card:          {borderRadius: 16, overflow: 'hidden', elevation: 1, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: {width: 0, height: 1}},
  cardSep:       {height: 1},

  inputBox:      {flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14},
  input:         {flex: 1, fontSize: 14, padding: 0},

  daysCard:      {borderRadius: 16, padding: 4, elevation: 1, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: {width: 0, height: 1}},
  dayRow:        {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 14},
  dayLabel:      {fontSize: 14, fontWeight: '600', width: 68},
  dayTimes:      {flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, justifyContent: 'center'},
  dimmed:        {opacity: 0.35},
  timeBox:       {paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8},
  timeText:      {fontSize: 13, fontWeight: '600'},
  timeSep:       {fontSize: 13},
  sep:           {height: 1, marginHorizontal: 12},

  saveBtn:       {paddingVertical: 16, borderRadius: 16, alignItems: 'center', marginTop: 8},
  saveTxt:       {color: '#FFF', fontSize: 16, fontWeight: '800'},
});
