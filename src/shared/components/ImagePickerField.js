import React, {useState} from 'react';
import {
  Image,
  // PermissionsAndroid,
  // Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {Camera, ImagePlus, X} from 'lucide-react-native';
// import {launchCamera, launchImageLibrary} from 'react-native-image-picker';
import {useTheme} from '../context/ThemeContext';

export default function ImagePickerField({value, onChange, label = 'صورة الخدمة'}) {
  const {colors} = useTheme();
  const [showOptions, setShowOptions] = useState(false);

  const pickFromCamera = async () => {
    setShowOptions(false);
    // TODO: uncomment when react-native-image-picker is installed
    // const granted = Platform.OS === 'android'
    //   ? await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.CAMERA)
    //   : 'granted';
    // if (granted !== PermissionsAndroid.RESULTS.GRANTED && granted !== 'granted') return;
    // const result = await launchCamera({mediaType: 'photo', quality: 0.8});
    // if (!result.didCancel && result.assets?.[0]) onChange(result.assets[0].uri);
  };

  const pickFromGallery = async () => {
    setShowOptions(false);
    // TODO: uncomment when react-native-image-picker is installed
    // const result = await launchImageLibrary({mediaType: 'photo', quality: 0.8});
    // if (!result.didCancel && result.assets?.[0]) onChange(result.assets[0].uri);
  };

  return (
    <View style={s.root}>
      {label ? <Text style={[s.label, {color: colors.textPrimary}]}>{label}</Text> : null}

      {value ? (
        <View style={s.previewWrap}>
          <Image source={{uri: value}} style={s.preview} resizeMode="cover" />
          <TouchableOpacity
            style={[s.removeBtn, {backgroundColor: '#EF4444'}]}
            onPress={() => onChange(null)}
            activeOpacity={0.8}>
            <X size={14} color="#FFF" />
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          style={[s.placeholder, {backgroundColor: colors.card, borderColor: colors.border}]}
          onPress={() => setShowOptions(true)}
          activeOpacity={0.8}>
          <ImagePlus size={28} color={colors.primary} />
          <Text style={[s.placeholderTxt, {color: colors.textSecondary}]}>
            اضغط لإضافة صورة
          </Text>
        </TouchableOpacity>
      )}

      {showOptions && (
        <View style={[s.options, {backgroundColor: colors.card, borderColor: colors.border}]}>
          <TouchableOpacity style={s.optionRow} onPress={pickFromCamera} activeOpacity={0.75}>
            <Camera size={18} color={colors.primary} />
            <Text style={[s.optionTxt, {color: colors.textPrimary}]}>التقاط صورة</Text>
          </TouchableOpacity>
          <View style={[s.optSep, {backgroundColor: colors.border}]} />
          <TouchableOpacity style={s.optionRow} onPress={pickFromGallery} activeOpacity={0.75}>
            <ImagePlus size={18} color={colors.primary} />
            <Text style={[s.optionTxt, {color: colors.textPrimary}]}>اختيار من المعرض</Text>
          </TouchableOpacity>
          <View style={[s.optSep, {backgroundColor: colors.border}]} />
          <TouchableOpacity style={s.optionRow} onPress={() => setShowOptions(false)} activeOpacity={0.75}>
            <Text style={[s.cancelTxt, {color: colors.textSecondary}]}>إلغاء</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root:           {gap: 8},
  label:          {fontSize: 14, fontWeight: '700'},
  placeholder:    {height: 130, borderRadius: 16, borderWidth: 1.5, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 8},
  placeholderTxt: {fontSize: 13},
  previewWrap:    {position: 'relative'},
  preview:        {width: '100%', height: 160, borderRadius: 16},
  removeBtn:      {position: 'absolute', top: 8, left: 8, width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center'},
  options:        {borderRadius: 14, borderWidth: 1, overflow: 'hidden', marginTop: 4},
  optionRow:      {flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14},
  optionTxt:      {fontSize: 14, fontWeight: '600'},
  cancelTxt:      {fontSize: 14, fontWeight: '600'},
  optSep:         {height: 1},
});
