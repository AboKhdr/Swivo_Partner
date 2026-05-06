import React, {useState, useEffect, useCallback} from 'react';
import {
  ActivityIndicator, Alert, Image, KeyboardAvoidingView,
  Modal, Platform, ScrollView, StatusBar, StyleSheet,
  Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import {launchCamera, launchImageLibrary} from 'react-native-image-picker';
import {ChevronLeft, MapPin, Camera, User} from 'lucide-react-native';
import {useTheme} from '../../../shared/context/ThemeContext';
import {useI18n} from '../../../shared/i18n/I18nContext';
import useAuthStore from '../../../store/authStore';
import {getBikerProfile, updateBikerProfile} from '../../../services/biker';
import {uploadToCloudinary} from '../../../services/cloudinary';

function Field({label, value, onChangeText, placeholder, keyboardType, editable = true, Icon, colors, isRTL}) {
  return (
    <View style={s.fieldWrap}>
      <Text style={[s.fieldLabel, {color: colors.textSecondary}]}>{label}</Text>
      <View style={[
        s.inputRow,
        {backgroundColor: colors.card, borderColor: colors.border},
        !editable && {opacity: 0.6},
      ]}>
        {Icon && (
          <View style={[s.inputIcon, {backgroundColor: colors.primary + '12'}]}>
            <Icon size={16} color={colors.primary} strokeWidth={2} />
          </View>
        )}
        <TextInput
          style={[s.input, {color: editable ? colors.textPrimary : colors.textSecondary}]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textSecondary + '80'}
          keyboardType={keyboardType || 'default'}
          editable={editable}
          textAlign={isRTL ? 'right' : 'left'}
        />
      </View>
    </View>
  );
}

export default function PersonalInfoScreen({onBack}) {
  const {colors, isDark} = useTheme();
  const {t, isRTL} = useI18n();
  const updateUser = useAuthStore(s => s.updateUser);

  const [firstName,   setFirstName]   = useState('');
  const [lastName,    setLastName]    = useState('');
  const [email,       setEmail]       = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [branchName,  setBranchName]  = useState('');
  const [imageUrl,    setImageUrl]    = useState(null);

  const [loading,       setLoading]       = useState(true);
  const [saving,        setSaving]        = useState(false);
  const [uploadingImg,  setUploadingImg]  = useState(false);
  const [showImgPicker, setShowImgPicker] = useState(false);
  const [error,         setError]         = useState(null);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    const res = await getBikerProfile();
    if (res.success) {
      const p = res.data?.data ?? res.data ?? {};
      setFirstName(p.firstName ?? '');
      setLastName(p.lastName ?? '');
      setEmail(p.email ?? '');
      setPhoneNumber(p.phoneNumber ?? p.phone ?? '');
      setBranchName(p.branchName ?? p.branch?.name ?? '');
      setImageUrl(p.image ?? p.imageUrl ?? null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const pickImage = useCallback(async (fromCamera) => {
    setShowImgPicker(false);
    const opts = {mediaType: 'photo', quality: 0.8, includeBase64: false};
    const result = fromCamera
      ? await launchCamera(opts)
      : await launchImageLibrary(opts);

    const uri = result.assets?.[0]?.uri;
    if (!uri) return;

    setUploadingImg(true);
    const upRes = await uploadToCloudinary(uri);
    setUploadingImg(false);

    if (upRes.success && upRes.url) {
      setImageUrl(upRes.url);
    } else {
      Alert.alert(t('common.error'), t('personalInfo.uploadFailed'));
    }
  }, [t]);

  const handleSave = async () => {
    setError(null);
    setSaving(true);
    const payload = {firstName, lastName, email};
    if (phoneNumber) payload.phoneNumber = phoneNumber;
    if (imageUrl)    payload.image       = imageUrl;

    const res = await updateBikerProfile(payload);
    setSaving(false);
    if (res.success) {
      updateUser({firstName, lastName, email, image: imageUrl});
      onBack();
    } else {
      setError(res.error ?? t('common.error'));
    }
  };

  const avatarLetter = (firstName || ' ').charAt(0).toUpperCase();

  if (loading) {
    return (
      <View style={[s.root, s.center, {backgroundColor: colors.bg}]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[s.root, {backgroundColor: colors.bg}]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.card} />

      <View style={[s.header, {backgroundColor: colors.card, borderBottomColor: colors.border}]}>
        <TouchableOpacity
          style={[s.backBtn, {backgroundColor: colors.bg}]}
          onPress={onBack}
          hitSlop={{top: 12, bottom: 12, left: 12, right: 12}}>
          <ChevronLeft size={22} color={colors.textPrimary} strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, {color: colors.textPrimary}]}>{t('personalInfo.title')}</Text>
        <View style={{width: 36}} />
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">

        {/* Avatar */}
        <View style={s.avatarSection}>
          <TouchableOpacity
            style={[s.avatarWrap, {borderColor: colors.primary + '40'}]}
            onPress={() => setShowImgPicker(true)}
            activeOpacity={0.8}
            disabled={uploadingImg}>
            {uploadingImg ? (
              <View style={[s.avatarPlaceholder, {backgroundColor: colors.card}]}>
                <ActivityIndicator color={colors.primary} />
              </View>
            ) : imageUrl ? (
              <Image source={{uri: imageUrl}} style={s.avatarImg} />
            ) : (
              <View style={[s.avatarPlaceholder, {backgroundColor: colors.primary + '20'}]}>
                <Text style={[s.avatarLetter, {color: colors.primary}]}>{avatarLetter}</Text>
              </View>
            )}
            <View style={[s.cameraOverlay, {backgroundColor: colors.primary}]}>
              <Camera size={14} color="#fff" strokeWidth={2} />
            </View>
          </TouchableOpacity>
          <Text style={[s.avatarHint, {color: colors.textSecondary}]}>{t('personalInfo.tapToChange')}</Text>
        </View>

        {/* Personal info */}
        <View style={s.section}>
          <Text style={[s.sectionTitle, {color: colors.textSecondary}]}>{t('personalInfo.myInfo')}</Text>
          <Field
            label={t('personalInfo.firstName')}
            value={firstName}
            onChangeText={setFirstName}
            placeholder={t('personalInfo.firstName')}
            colors={colors} isRTL={isRTL}
          />
          <Field
            label={t('personalInfo.lastName')}
            value={lastName}
            onChangeText={setLastName}
            placeholder={t('personalInfo.lastName')}
            colors={colors} isRTL={isRTL}
          />
          <Field
            label={t('personalInfo.phone')}
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            placeholder={t('personalInfo.phone')}
            keyboardType="phone-pad"
            Icon={User}
            colors={colors} isRTL={isRTL}
          />
          <Field
            label={t('personalInfo.email')}
            value={email}
            onChangeText={setEmail}
            placeholder={t('personalInfo.email')}
            keyboardType="email-address"
            colors={colors} isRTL={isRTL}
          />
        </View>

        {/* Work area — read only */}
        {!!branchName && (
          <View style={s.section}>
            <Text style={[s.sectionTitle, {color: colors.textSecondary}]}>{t('personalInfo.workArea')}</Text>
            <Field
              label={t('personalInfo.workArea')}
              value={branchName}
              editable={false}
              Icon={MapPin}
              colors={colors} isRTL={isRTL}
            />
          </View>
        )}

        {!!error && <Text style={[s.error, {color: '#EF4444'}]}>{error}</Text>}

        <View style={{height: 100}} />
      </ScrollView>

      <View style={[s.footer, {backgroundColor: colors.card, borderTopColor: colors.border}]}>
        <TouchableOpacity
          style={[s.saveBtn, {backgroundColor: colors.primary, opacity: saving || uploadingImg ? 0.6 : 1}]}
          onPress={handleSave}
          disabled={saving || uploadingImg}
          activeOpacity={0.85}>
          {saving
            ? <ActivityIndicator color="#fff" />
            : <Text style={s.saveBtnText}>{t('personalInfo.save')}</Text>
          }
        </TouchableOpacity>
      </View>

      {/* Image picker modal */}
      <Modal visible={showImgPicker} transparent animationType="slide" onRequestClose={() => setShowImgPicker(false)}>
        <TouchableOpacity style={ip.overlay} activeOpacity={1} onPress={() => setShowImgPicker(false)} />
        <View style={[ip.sheet, {backgroundColor: colors.card}]}>
          <View style={[ip.handle, {backgroundColor: colors.border}]} />
          <Text style={[ip.title, {color: colors.textPrimary}]}>{t('personalInfo.changePhoto')}</Text>
          <TouchableOpacity style={[ip.row, {borderBottomColor: colors.border}]} onPress={() => pickImage(true)} activeOpacity={0.7}>
            <Camera size={20} color={colors.primary} strokeWidth={2} />
            <Text style={[ip.rowText, {color: colors.textPrimary}]}>{t('personalInfo.takePhoto')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={ip.row} onPress={() => pickImage(false)} activeOpacity={0.7}>
            <User size={20} color={colors.primary} strokeWidth={2} />
            <Text style={[ip.rowText, {color: colors.textPrimary}]}>{t('personalInfo.chooseGallery')}</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root:          {flex: 1},
  center:        {alignItems: 'center', justifyContent: 'center'},
  header:        {flexDirection: 'row', alignItems: 'center', paddingTop: Platform.OS === 'ios' ? 56 : 48, paddingBottom: 16, paddingHorizontal: 16, borderBottomWidth: 1},
  backBtn:       {width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center'},
  headerTitle:   {flex: 1, fontSize: 16, fontWeight: '700', textAlign: 'center'},
  scroll:        {flex: 1},
  content:       {paddingHorizontal: 16, paddingTop: 24, gap: 8},
  avatarSection: {alignItems: 'center', marginBottom: 28},
  avatarWrap:    {width: 96, height: 96, borderRadius: 48, borderWidth: 2, marginBottom: 10},
  avatarImg:     {width: '100%', height: '100%', borderRadius: 48},
  avatarPlaceholder: {width: '100%', height: '100%', borderRadius: 48, alignItems: 'center', justifyContent: 'center'},
  avatarLetter:  {fontSize: 36, fontWeight: '800'},
  cameraOverlay: {position: 'absolute', bottom: 2, right: 2, width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center'},
  avatarHint:    {fontSize: 12},
  section:       {marginBottom: 20},
  sectionTitle:  {fontSize: 12, fontWeight: '700', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5},
  fieldWrap:     {marginBottom: 14},
  fieldLabel:    {fontSize: 12, fontWeight: '600', marginBottom: 6, paddingHorizontal: 2},
  inputRow:      {flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, minHeight: 52, gap: 10},
  inputIcon:     {width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center'},
  input:         {flex: 1, fontSize: 14, paddingVertical: 12},
  error:         {fontSize: 13, textAlign: 'center', marginTop: 4},
  footer:        {padding: 16, paddingBottom: Platform.OS === 'ios' ? 32 : 16, borderTopWidth: 1},
  saveBtn:       {borderRadius: 14, paddingVertical: 16, alignItems: 'center'},
  saveBtnText:   {color: '#fff', fontSize: 16, fontWeight: '700'},
});


const ip = StyleSheet.create({
  overlay: {flex: 1, backgroundColor: 'rgba(0,0,0,0.4)'},
  sheet:   {borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 36},
  handle:  {width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 16},
  title:   {fontSize: 16, fontWeight: '700', marginBottom: 16},
  row:     {flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 16, borderBottomWidth: 1},
  rowText: {fontSize: 15},
});
