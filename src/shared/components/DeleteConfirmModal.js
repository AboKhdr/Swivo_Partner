import React from 'react';
import {Modal, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View} from 'react-native';
import {AlertTriangle} from 'lucide-react-native';
import {useTheme} from '../context/ThemeContext';

export default function DeleteConfirmModal({
  visible,
  title    = 'حذف نهائياً',
  message  = 'سيتم حذف العنصر بشكل نهائي , ولا يمكنك التراجع.',
  confirmLabel = 'حذف',
  cancelLabel  = 'تراجع',
  onConfirm,
  onClose,
}) {
  const {colors} = useTheme();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={s.overlay} />
      </TouchableWithoutFeedback>

      <View style={s.center}>
        <View style={[s.card, {backgroundColor: colors.card}]}>
          {/* Warning icon */}
          <View style={s.iconWrap}>
            <AlertTriangle size={32} color="#EF4444" />
          </View>

          <Text style={[s.title, {color: colors.textPrimary}]}>{title}</Text>
          <Text style={[s.message, {color: colors.textSecondary}]}>{message}</Text>

          <View style={s.buttons}>
            <TouchableOpacity
              style={[s.confirmBtn, {backgroundColor: '#FEE2E2'}]}
              onPress={onConfirm}
              activeOpacity={0.8}>
              <Text style={s.confirmTxt}>{confirmLabel}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[s.cancelBtn, {backgroundColor: colors.bg}]}
              onPress={onClose}
              activeOpacity={0.8}>
              <Text style={[s.cancelTxt, {color: colors.textSecondary}]}>{cancelLabel}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay:    {position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.35)'},
  center:     {flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32},
  card:       {width: '100%', borderRadius: 24, padding: 24, alignItems: 'center', gap: 10},
  iconWrap:   {width: 56, height: 56, borderRadius: 28, backgroundColor: '#FEE2E2', alignItems: 'center', justifyContent: 'center', marginBottom: 4},
  title:      {fontSize: 20, fontWeight: '900'},
  message:    {fontSize: 13, lineHeight: 20, textAlign: 'center'},
  buttons:    {flexDirection: 'row', gap: 10, marginTop: 8, width: '100%'},
  confirmBtn: {flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: 'center'},
  confirmTxt: {fontSize: 15, fontWeight: '800', color: '#EF4444'},
  cancelBtn:  {paddingHorizontal: 24, paddingVertical: 14, borderRadius: 14, alignItems: 'center'},
  cancelTxt:  {fontSize: 15, fontWeight: '600'},
});
