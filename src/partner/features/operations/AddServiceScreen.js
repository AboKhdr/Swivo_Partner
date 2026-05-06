import React, {useEffect, useState} from 'react';
import {
  ActivityIndicator,
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
import {getCategories, createService, updateService} from '../../../services/partner';

const SERVICE_TYPES = [
  {key: 'IN_SHOP', label: 'في المغسل'},
  {key: 'MOBILE',  label: 'في الجوال'},
  {key: 'BOTH',    label: 'الاثنين معا'},
];

const SIZE_CONFIG = [
  {key: 'small',  label: 'صغيرة'},
  {key: 'medium', label: 'متوسطة'},
  {key: 'large',  label: 'كبيرة'},
];

export default function AddServiceScreen({onBack, onSaved, initialData}) {
  const {colors} = useTheme();
  const isEdit = !!initialData?._id;

  const [nameAr,         setNameAr]         = useState(initialData?.name?.ar   ?? '');
  const [nameEn,         setNameEn]         = useState(initialData?.name?.en   ?? '');
  const [categoryId,     setCategoryId]     = useState(initialData?.category?._id ?? initialData?.categoryId ?? '');
  const [type,           setType]           = useState(initialData?.availableFor ?? '');
  const [image,          setImage]          = useState(initialData?.image ?? null);
  const [prices,         setPrices]         = useState(
    initialData?.price ?? {small: '', medium: '', large: ''},
  );
  const [estimationTime, setEstimationTime] = useState(
    initialData?.estimationTime ? String(initialData.estimationTime) : '',
  );
  const [categories,     setCategories]     = useState([]);
  const [saving,         setSaving]         = useState(false);

  useEffect(() => {
    getCategories().then(res => {
      if (res.success) {
        const list = res.data?.data ?? res.data ?? [];
        setCategories(
          (Array.isArray(list) ? list : []).map(c => ({
            value: c._id,
            label: c.name?.ar ?? c.name?.en ?? c._id,
          })),
        );
      }
    });
  }, []);

  const setPrice = (key, val) =>
    setPrices(prev => ({...prev, [key]: val.replace(/[^0-9]/g, '')}));

  const canSave = nameAr.trim() && type && prices.small && prices.medium && prices.large && estimationTime.trim();

  const handleSave = async () => {
    if (!canSave || saving) return;
    setSaving(true);
    const payload = {
      name:           {ar: nameAr.trim(), en: nameEn.trim() || nameAr.trim()},
      price:          {small: Number(prices.small), medium: Number(prices.medium), large: Number(prices.large)},
      availableFor:   type,
      estimationTime: Number(estimationTime),
      ...(categoryId ? {categoryId} : {}),
      ...(image && !image.startsWith('http') ? {imageUri: image} : image ? {image} : {}),
    };
    if (isEdit) {
      await updateService(initialData._id, payload);
    } else {
      await createService(payload);
    }
    setSaving(false);
    onSaved?.();
    onBack();
  };

  return (
    <View style={[s.root, {backgroundColor: colors.bg}]}>
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

        <Text style={[s.label, {color: colors.textPrimary}]}>اسم الخدمة (عربي)</Text>
        <View style={[s.inputBox, {backgroundColor: colors.card, borderColor: colors.border}]}>
          <TextInput
            style={[s.input, {color: colors.textPrimary}]}
            placeholder="مثال: غسلة سريعة"
            placeholderTextColor={colors.textSecondary}
            value={nameAr}
            onChangeText={setNameAr}
          />
        </View>

        <Text style={[s.label, {color: colors.textPrimary}]}>اسم الخدمة (إنجليزي)</Text>
        <View style={[s.inputBox, {backgroundColor: colors.card, borderColor: colors.border}]}>
          <TextInput
            style={[s.input, {color: colors.textPrimary}]}
            placeholder="Example: Quick Wash"
            placeholderTextColor={colors.textSecondary}
            value={nameEn}
            onChangeText={setNameEn}
          />
        </View>

        <Text style={[s.label, {color: colors.textPrimary}]}>مدة الخدمة (بالدقائق)</Text>
        <View style={[s.inputBox, {backgroundColor: colors.card, borderColor: colors.border}]}>
          <TextInput
            style={[s.input, {color: colors.textPrimary}]}
            placeholder="مثال: 30"
            placeholderTextColor={colors.textSecondary}
            keyboardType="numeric"
            value={estimationTime}
            onChangeText={v => setEstimationTime(v.replace(/[^0-9]/g, ''))}
          />
        </View>

        <SelectField
          label="فئة الخدمة"
          placeholder="اختر فئة الخدمة"
          options={categories}
          value={categoryId}
          onChange={setCategoryId}
        />

        <Text style={[s.label, {color: colors.textPrimary}]}>أنواع الخدمة</Text>
        <View style={[s.typeRow, {backgroundColor: colors.card, borderColor: colors.border}]}>
          {SERVICE_TYPES.map((tp, i) => {
            const active = type === tp.key;
            return (
              <React.Fragment key={tp.key}>
                <TouchableOpacity
                  style={[s.typeBtn, active && {backgroundColor: colors.primary}]}
                  onPress={() => setType(tp.key)}
                  activeOpacity={0.75}>
                  <Text style={[s.typeTxt, {color: active ? '#FFF' : colors.textSecondary}]}>
                    {tp.label}
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
                    value={String(prices[sz.key] ?? '')}
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
          style={[s.saveBtn, {backgroundColor: canSave && !saving ? colors.primary : colors.border}]}
          onPress={handleSave}
          disabled={!canSave || saving}
          activeOpacity={0.85}>
          {saving
            ? <ActivityIndicator color="#FFF" />
            : <Text style={s.saveTxt}>{isEdit ? 'حفظ التعديلات' : 'حفظ الخدمة'}</Text>
          }
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
