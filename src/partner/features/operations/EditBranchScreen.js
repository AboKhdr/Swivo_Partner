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
import {ArrowRight, MapPin, Navigation} from 'lucide-react-native';
import {useTheme} from '../../../shared/context/ThemeContext';
import DeleteConfirmModal from '../../../shared/components/DeleteConfirmModal';

const DAYS = [
  {key: 'sat', label: 'السبت'},
  {key: 'sun', label: 'الاحد'},
  {key: 'mon', label: 'الاثنين'},
  {key: 'tue', label: 'الثلاثاء'},
  {key: 'wed', label: 'الاربعاء'},
  {key: 'thu', label: 'الخميس'},
  {key: 'fri', label: 'الجمعة'},
];

export default function EditBranchScreen({branch, onBack}) {
  const {colors} = useTheme();

  const [branchName, setBranchName] = useState(
    branch?.nameAr || 'مغسلة فينيسيوس - فرع شارع الياسمين',
  );
  const [isMain, setIsMain]       = useState(branch?.isMain ?? true);
  const [showDelete, setShowDelete] = useState(false);
  const [days, setDays] = useState(
    DAYS.reduce((acc, d) => {
      acc[d.key] = {
        enabled: d.key !== 'fri',
        open:    '07:00',
        close:   '23:00',
      };
      return acc;
    }, {}),
  );

  const toggleDay = key =>
    setDays(prev => ({...prev, [key]: {...prev[key], enabled: !prev[key].enabled}}));

  return (
    <View style={[s.root, {backgroundColor: colors.bg}]}>
      {/* Header */}
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
          <View style={[s.navIcon, {backgroundColor: colors.primary + '15'}]}>
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
          <View style={[s.pinIcon, {backgroundColor: colors.primary + '15'}]}>
            <MapPin size={18} color={colors.primary} />
          </View>
        </View>

        {/* Working days */}
        <Text style={[s.label, {color: colors.textPrimary}]}>ايام العمل</Text>
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
                  <View style={s.dayTimes}>
                    <View style={[s.timeBox, {backgroundColor: colors.bg}]}>
                      <Text style={[s.timeText, {color: colors.textPrimary}]}>{d.close}</Text>
                    </View>
                    <Text style={[s.timeSep, {color: colors.textSecondary}]}>-</Text>
                    <View style={[s.timeBox, {backgroundColor: colors.bg}]}>
                      <Text style={[s.timeText, {color: colors.textPrimary}]}>{d.open}</Text>
                    </View>
                  </View>
                  <Text style={[s.dayLabel, {color: d.enabled ? colors.textPrimary : colors.textSecondary}]}>
                    {day.label}
                  </Text>
                </View>
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

        {/* Footer buttons */}
        <View style={s.footer}>
          <TouchableOpacity
            style={[s.saveBtn, {backgroundColor: colors.primary}]}
            activeOpacity={0.85}>
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

  // Name input
  inputBox:     {borderRadius: 14, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 14},
  input:        {fontSize: 14, padding: 0},

  // Location
  locationCard: {flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 16, elevation: 1, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: {width: 0, height: 1}},
  navIcon:      {width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center'},
  locationText: {flex: 1, gap: 3},
  locationName: {fontSize: 15, fontWeight: '800'},
  locationSub:  {fontSize: 12},
  pinIcon:      {width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center'},

  // Days
  daysCard:     {borderRadius: 16, padding: 4, elevation: 1, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: {width: 0, height: 1}},
  dayRow:       {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 14},
  dayLabel:     {fontSize: 14, fontWeight: '600', width: 64},
  dayTimes:     {flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, justifyContent: 'center'},
  timeBox:      {paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8},
  timeText:     {fontSize: 13, fontWeight: '600'},
  timeSep:      {fontSize: 14},
  sep:          {height: 1, marginHorizontal: 12},

  // Main branch
  mainCard:     {flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 16, borderRadius: 16, elevation: 1, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: {width: 0, height: 1}},
  mainText:     {flex: 1, gap: 4},
  mainLabel:    {fontSize: 14, fontWeight: '700'},
  mainSub:      {fontSize: 12, lineHeight: 18},

  // Footer
  footer:       {flexDirection: 'row', gap: 12, marginTop: 16},
  saveBtn:      {flex: 1, paddingVertical: 16, borderRadius: 16, alignItems: 'center'},
  saveTxt:      {color: '#FFF', fontSize: 16, fontWeight: '800'},
  deleteBtn:    {flex: 1, paddingVertical: 16, borderRadius: 16, alignItems: 'center', borderWidth: 1},
  deleteTxt:    {fontSize: 16, fontWeight: '800'},
});
