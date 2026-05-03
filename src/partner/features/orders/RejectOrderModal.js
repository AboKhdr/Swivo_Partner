import React, {useState, useCallback} from 'react';
import {Modal, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View} from 'react-native';
import {useTheme} from '../../../shared/context/ThemeContext';

const REJECT_REASONS = [
  'الطلب خارج نطاق الخدمة',
  'لا يوجد بايكر متاح',
  'العميل غير متجاوب',
  'طلب مكرر',
  'سبب آخر',
];

export default function RejectOrderModal({visible, onClose, onConfirm}) {
  const {colors} = useTheme();
  const [selected, setSelected] = useState(null);

  const handleClose = useCallback(() => {
    setSelected(null);
    onClose();
  }, [onClose]);

  const handleConfirm = useCallback(() => {
    if (!selected) return;
    onConfirm(selected);
    setSelected(null);
  }, [selected, onConfirm]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <TouchableWithoutFeedback onPress={handleClose}>
        <View style={s.overlay} />
      </TouchableWithoutFeedback>

      <View style={[s.sheet, {backgroundColor: colors.card}]}>
        <View style={[s.handle, {backgroundColor: colors.border}]} />

        <Text style={[s.title, {color: colors.textPrimary}]}>سبب الرفض</Text>
        <Text style={[s.sub, {color: colors.textSecondary}]}>اختر سبب رفض الطلب</Text>

        <View style={s.list}>
          {REJECT_REASONS.map(reason => {
            const isSelected = selected === reason;
            return (
              <TouchableOpacity
                key={reason}
                style={[
                  s.row,
                  {
                    borderColor:     isSelected ? colors.primary : colors.border,
                    backgroundColor: isSelected ? colors.primary + '10' : colors.card,
                  },
                ]}
                onPress={() => setSelected(reason)}
                activeOpacity={0.75}>
                <View style={[s.radio, {borderColor: isSelected ? colors.primary : colors.border}]}>
                  {isSelected && <View style={[s.radioDot, {backgroundColor: colors.primary}]} />}
                </View>
                <Text style={[s.rowText, {color: isSelected ? colors.primary : colors.textPrimary}]}>
                  {reason}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          style={[s.confirmBtn, {backgroundColor: selected ? '#EF4444' : colors.border}]}
          onPress={handleConfirm}
          disabled={!selected}
          activeOpacity={0.8}>
          <Text style={s.confirmText}>تأكيد الرفض</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay:     {flex: 1, backgroundColor: 'rgba(0,0,0,0.4)'},
  sheet:       {borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 36, gap: 12},
  handle:      {width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 8},
  title:       {fontSize: 18, fontWeight: '800'},
  sub:         {fontSize: 13, marginTop: -4},
  list:        {gap: 8, marginTop: 4},
  row:         {flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 14, borderWidth: 1.5},
  radio:       {width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center'},
  radioDot:    {width: 10, height: 10, borderRadius: 5},
  rowText:     {fontSize: 14, fontWeight: '600'},
  confirmBtn:  {paddingVertical: 16, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 4},
  confirmText: {color: '#FFF', fontSize: 16, fontWeight: '800'},
});
