import React, {useState} from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {ArrowRight} from 'lucide-react-native';
import {useTheme} from '../../../shared/context/ThemeContext';
import ImagePickerField from '../../../shared/components/ImagePickerField';
import SelectField from '../../../shared/components/SelectField';

const CATEGORY_OPTIONS = [
  {value: 'غسيل',   label: 'غسيل'},
  {value: 'تلميع',  label: 'تلميع'},
  {value: 'تعقيم',  label: 'تعقيم'},
  {value: 'إضافية', label: 'إضافية'},
];

const SERVICE_TYPES = [
  {key: 'inWash', label: 'في المغسل'},
  {key: 'mobile', label: 'في الجوال'},
  {key: 'both',   label: 'الاثنين معا'},
];

const SIZE_CONFIG = [
  {key: 'S', label: 'صغيرة'},
  {key: 'M', label: 'متوسطة'},
  {key: 'L', label: 'كبيرة'},
];

export default function AddServiceScreen({onBack, onSave, initialData}) {
  const {colors} = useTheme();
  const isEdit = !!initialData;

  const [name,     setName]     = useState(initialData?.nameAr   ?? '');
  const [category, setCategory] = useState(initialData?.category ?? '');
  const [type,     setType]     = useState(initialData?.type     ?? '');
  const [image,    setImage]    = useState(initialData?.image    ?? null);
  const [prices,   setPrices]   = useState(
    initialData?.prices ?? {S: '', M: '', L: ''},
  );

  const setPrice = (key, val) =>
    setPrices(prev => ({...prev, [key]: val.replace(/[^0-9]/g, '')}));

  const canSave = name.trim() && category && type && prices.S && prices.M && prices.L;

  const handleSave = () => {
    if (!canSave) return;
    onSave?.({name, category, type, image, prices});
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
          {isEdit ? 'تعديل خدمة' : 'إضافة خدمة'}
        </Text>
        <View style={s.backBtn} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

        <ImagePickerField value={image} onChange={setImage} label="صورة الخدمة" />

        <Text style={[s.label, {color: colors.textPrimary}]}>اسم الخدمة</Text>
        <View style={[s.inputBox, {backgroundColor: colors.card, borderColor: colors.border}]}>
          <TextInput
            style={[s.input, {color: colors.textPrimary}]}
            placeholder="مثال: غسلة سريعة"
            placeholderTextColor={colors.textSecondary}
            value={name}
            onChangeText={setName}
          />
        </View>

        <SelectField
          label="فئة الخدمة"
          placeholder="اختر فئة الخدمة"
          options={CATEGORY_OPTIONS}
          value={category}
          onChange={setCategory}
        />

        <Text style={[s.label, {color: colors.textPrimary}]}>أنواع الخدمة</Text>
        <View style={[s.typeRow, {backgroundColor: colors.card, borderColor: colors.border}]}>
          {SERVICE_TYPES.map((t, i) => {
            const active = type === t.key;
            return (
              <React.Fragment key={t.key}>
                <TouchableOpacity
                  style={[s.typeBtn, active && {backgroundColor: colors.primary}]}
                  onPress={() => setType(t.key)}
                  activeOpacity={0.75}>
                  <Text style={[s.typeTxt, {color: active ? '#FFF' : colors.textSecondary}]}>
                    {t.label}
                  </Text>
                </TouchableOpacity>
                {i < SERVICE_TYPES.length - 1 && (
                  <View style={[s.typeSep, {backgroundColor: colors.border}]} />
                )}
              </React.Fragment>
            );
          })}
        </View>

        <Text style={[s.label, {color: colors.textPrimary}]}>سعر الخدمة</Text>
        <View style={[s.pricesCard, {backgroundColor: colors.card}]}>
          {SIZE_CONFIG.map((sz, i) => (
            <View key={sz.key}>
              <View style={s.priceRow}>
                <View style={[s.sizeBadge, {backgroundColor: colors.primary + '15'}]}>
                  <Text style={[s.sizeLabel, {color: colors.primary}]}>{sz.label}</Text>
                </View>
                <View style={[s.priceInput, {backgroundColor: colors.bg, borderColor: colors.border}]}>
                  <Text style={[s.currency, {color: colors.textSecondary}]}>﷼</Text>
                  <TextInput
                    style={[s.priceInputTxt, {color: colors.textPrimary}]}
                    placeholder="0"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="numeric"
                    value={String(prices[sz.key])}
                    onChangeText={val => setPrice(sz.key, val)}
                  />
                </View>
              </View>
              {i < SIZE_CONFIG.length - 1 && (
                <View style={[s.priceSep, {backgroundColor: colors.border}]} />
              )}
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={[s.saveBtn, {backgroundColor: canSave ? colors.primary : colors.border}]}
          onPress={handleSave}
          disabled={!canSave}
          activeOpacity={0.85}>
          <Text style={s.saveTxt}>{isEdit ? 'حفظ التعديلات' : 'حفظ الخدمة'}</Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root:         {flex: 1},
  header:       {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 12},
  headerTitle:  {fontSize: 20, fontWeight: '800'},
  backBtn:      {width: 36, height: 36, alignItems: 'center', justifyContent: 'center'},
  scroll:       {paddingHorizontal: 16, paddingBottom: 40, gap: 10},

  label:        {fontSize: 14, fontWeight: '700', marginTop: 4},

  inputBox:     {borderRadius: 14, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 14},
  input:        {fontSize: 14, padding: 0},

  typeRow:      {flexDirection: 'row', borderRadius: 14, borderWidth: 1, overflow: 'hidden', padding: 4, gap: 2},
  typeBtn:      {flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center'},
  typeTxt:      {fontSize: 13, fontWeight: '600'},
  typeSep:      {width: 1, marginVertical: 4},

  pricesCard:   {borderRadius: 16, overflow: 'hidden', elevation: 1, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: {width: 0, height: 1}},
  priceRow:     {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, gap: 12},
  sizeBadge:    {paddingHorizontal: 14, paddingVertical: 6, borderRadius: 50},
  sizeLabel:    {fontSize: 13, fontWeight: '700'},
  priceInput:   {flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10},
  currency:     {fontSize: 14},
  priceInputTxt:{flex: 1, fontSize: 15, fontWeight: '700', padding: 0},
  priceSep:     {height: 1, marginHorizontal: 14},

  saveBtn:      {paddingVertical: 16, borderRadius: 16, alignItems: 'center', marginTop: 8},
  saveTxt:      {color: '#FFF', fontSize: 16, fontWeight: '800'},
});
