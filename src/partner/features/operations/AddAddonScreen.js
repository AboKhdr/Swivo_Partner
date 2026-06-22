import React, {useEffect, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {ArrowRight} from 'lucide-react-native';
import {useTheme} from '../../../shared/context/ThemeContext';
import {useI18n} from '../../../shared/i18n/I18nContext';
import SelectField from '../../../shared/components/SelectField';
import RiyalIcon from '../../../shared/components/RiyalIcon';
// import ImagePickerField from '../../../shared/components/ImagePickerField'; // TODO: re-enable when image is supported
import {
  getCategoryServices,
  createAdditionalService,
  updateAdditionalService,
} from '../../../services/partner';

export default function AddAddonScreen({onBack, onSaved, initialData}) {
  const {colors} = useTheme();
  const {t}      = useI18n();
  const isEdit   = !!(initialData?._id ?? initialData?.id);

  const initialServiceId =
    initialData?.serviceId
    ?? initialData?.service?._id
    ?? initialData?.service
    ?? '';

  const [serviceId,     setServiceId]     = useState(initialServiceId);
  const [nameAr,        setNameAr]        = useState(initialData?.nameAr ?? initialData?.name?.ar ?? '');
  const [nameEn,        setNameEn]        = useState(initialData?.nameEn ?? initialData?.name?.en ?? '');
  const [descriptionAr, setDescriptionAr] = useState(initialData?.descriptionAr ?? initialData?.description?.ar ?? '');
  const [descriptionEn, setDescriptionEn] = useState(initialData?.descriptionEn ?? initialData?.description?.en ?? '');
  const [price,         setPrice]         = useState(initialData?.price != null ? String(initialData.price) : '');
  // const [image,      setImage]         = useState(initialData?.image ?? null); // TODO: re-enable when image is supported
  const [isActive,      setIsActive]      = useState(initialData?.isActive ?? true);

  const [serviceOpts, setServiceOpts] = useState([]);
  const [loadingOpts, setLoadingOpts] = useState(true);
  const [saving,      setSaving]      = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await getCategoryServices();
      if (cancelled) return;
      const cats = res.success ? (res.data?.data ?? res.data ?? []) : [];
      const opts = [];
      (Array.isArray(cats) ? cats : []).forEach(cat => {
        (cat.services ?? []).forEach(sv => {
          opts.push({
            value: sv._id ?? sv.id,
            label: sv.name?.ar ?? sv.name?.en ?? '',
          });
        });
      });
      setServiceOpts(opts);
      setLoadingOpts(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const canSave =
    serviceId
    && nameAr.trim()
    && nameEn.trim()
    && price.trim()
    && Number(price) > 0;

  const handleSave = async () => {
    if (!canSave || saving) return;
    setSaving(true);
    const payload = {
      nameAr: nameAr.trim(),
      nameEn: nameEn.trim(),
      price:  Number(price),
      serviceId,
      isActive,
      ...(descriptionAr.trim() ? {descriptionAr: descriptionAr.trim()} : {}),
      ...(descriptionEn.trim() ? {descriptionEn: descriptionEn.trim()} : {}),
      // TODO: re-enable image upload when supported
      // ...(image && !image.startsWith('http') ? {imageUri: image} : image ? {image} : {}),
    };
    const id  = initialData?._id ?? initialData?.id;
    const res = isEdit
      ? await updateAdditionalService(id, payload)
      : await createAdditionalService(payload);
    setSaving(false);
    if (res.success) {
      onSaved?.();
      onBack();
    } else {
      Alert.alert(
        isEdit ? t('partner.addons.edit') : t('partner.addons.add'),
        res.error || '',
      );
    }
  };

  return (
    <View style={[s.root, {backgroundColor: colors.bg}]}>
      <View style={[s.header, {backgroundColor: colors.bg}]}>
        <TouchableOpacity onPress={onBack} style={s.backBtn} activeOpacity={0.75}>
          <ArrowRight size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, {color: colors.textPrimary}]}>
          {isEdit ? t('partner.addons.edit') : t('partner.addons.add')}
        </Text>
        <View style={s.backBtn} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        {/* TODO: re-enable image picker when image upload is supported
        <ImagePickerField value={image} onChange={setImage} label={t('partner.addons.image')} />
        */}

        {loadingOpts ? (
          <View style={s.center}><ActivityIndicator color={colors.primary} /></View>
        ) : (
          <SelectField
            label={t('partner.addons.service')}
            placeholder={t('partner.addons.servicePlaceholder')}
            options={serviceOpts}
            value={serviceId}
            onChange={setServiceId}
          />
        )}

        <Text style={[s.label, {color: colors.textPrimary}]}>{t('partner.addons.nameAr')}</Text>
        <View style={[s.inputBox, {backgroundColor: colors.card, borderColor: colors.border}]}>
          <TextInput
            style={[s.input, {color: colors.textPrimary}]}
            placeholder={t('partner.addons.nameArPlaceholder')}
            placeholderTextColor={colors.textSecondary}
            value={nameAr}
            onChangeText={setNameAr}
          />
        </View>

        <Text style={[s.label, {color: colors.textPrimary}]}>{t('partner.addons.nameEn')}</Text>
        <View style={[s.inputBox, {backgroundColor: colors.card, borderColor: colors.border}]}>
          <TextInput
            style={[s.input, {color: colors.textPrimary}]}
            placeholder={t('partner.addons.nameEnPlaceholder')}
            placeholderTextColor={colors.textSecondary}
            value={nameEn}
            onChangeText={setNameEn}
            textAlign="left"
          />
        </View>

        <Text style={[s.label, {color: colors.textPrimary}]}>{t('partner.addons.descAr')}</Text>
        <View style={[s.inputBox, {backgroundColor: colors.card, borderColor: colors.border}]}>
          <TextInput
            style={[s.input, s.multiline, {color: colors.textPrimary}]}
            placeholder={t('partner.addons.descArPlaceholder')}
            placeholderTextColor={colors.textSecondary}
            value={descriptionAr}
            onChangeText={setDescriptionAr}
            multiline
          />
        </View>

        <Text style={[s.label, {color: colors.textPrimary}]}>{t('partner.addons.descEn')}</Text>
        <View style={[s.inputBox, {backgroundColor: colors.card, borderColor: colors.border}]}>
          <TextInput
            style={[s.input, s.multiline, {color: colors.textPrimary}]}
            placeholder={t('partner.addons.descEnPlaceholder')}
            placeholderTextColor={colors.textSecondary}
            value={descriptionEn}
            onChangeText={setDescriptionEn}
            multiline
            textAlign="left"
          />
        </View>

        <Text style={[s.label, {color: colors.textPrimary}]}>{t('partner.addons.price')}</Text>
        <View style={[s.priceBox, {backgroundColor: colors.card, borderColor: colors.border}]}>
          <RiyalIcon size={15} color={colors.textSecondary} />
          <TextInput
            style={[s.priceInput, {color: colors.textPrimary}]}
            placeholder="0"
            placeholderTextColor={colors.textSecondary}
            keyboardType="numeric"
            value={price}
            onChangeText={v => setPrice(v.replace(/[^0-9]/g, ''))}
          />
        </View>

        <View style={[s.activeRow, {backgroundColor: colors.card}]}>
          <Text style={[s.activeLabel, {color: colors.textPrimary}]}>{t('partner.addons.status')}</Text>
          <View style={s.activeRight}>
            <Text style={[s.activeStatus, {color: isActive ? '#22C55E' : colors.textSecondary}]}>
              {isActive ? t('partner.addons.active') : t('partner.addons.inactive')}
            </Text>
            <Switch
              value={isActive}
              onValueChange={setIsActive}
              trackColor={{false: colors.border, true: colors.primary + 'AA'}}
              thumbColor={isActive ? colors.primary : '#ccc'}
            />
          </View>
        </View>

        <TouchableOpacity
          style={[s.saveBtn, {backgroundColor: canSave && !saving ? colors.primary : colors.border}]}
          onPress={handleSave}
          disabled={!canSave || saving}
          activeOpacity={0.85}>
          {saving
            ? <ActivityIndicator color="#FFF" />
            : <Text style={s.saveTxt}>{isEdit ? t('partner.addons.saveEdit') : t('partner.addons.save')}</Text>
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
  center:       {paddingVertical: 24, alignItems: 'center'},
  label:        {fontSize: 14, fontWeight: '700', marginTop: 4},
  inputBox:     {borderRadius: 14, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 14},
  input:        {fontSize: 14, padding: 0},
  multiline:    {minHeight: 60, textAlignVertical: 'top'},
  priceBox:     {flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 14, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 14},
  currency:     {fontSize: 15},
  priceInput:   {flex: 1, fontSize: 15, fontWeight: '700', padding: 0},
  activeRow:    {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12, marginTop: 4},
  activeLabel:  {fontSize: 14, fontWeight: '700'},
  activeRight:  {flexDirection: 'row', alignItems: 'center', gap: 10},
  activeStatus: {fontSize: 13, fontWeight: '600'},
  saveBtn:      {paddingVertical: 16, borderRadius: 16, alignItems: 'center', marginTop: 12},
  saveTxt:      {color: '#FFF', fontSize: 16, fontWeight: '800'},
});
