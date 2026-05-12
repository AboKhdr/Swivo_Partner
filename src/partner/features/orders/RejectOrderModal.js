import React, {useCallback, useState} from 'react';
import {Modal, StyleSheet, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View} from 'react-native';
import {useTheme} from '../../../shared/context/ThemeContext';
import {useI18n} from '../../../shared/i18n/I18nContext';
import {REJECT_REASONS} from '../../../shared/constants/rejectReasons';

export default function RejectOrderModal({visible, onClose, onConfirm}) {
  const {colors} = useTheme();
  const {t} = useI18n();
  const [selectedCode, setSelectedCode] = useState(null);
  const [otherNote, setOtherNote]       = useState('');

  const reasons = REJECT_REASONS.map(r => ({
    code:  r.code,
    label: t(`partner.incoming.rejectReasons.${r.key}`),
  }));

  const handleClose = useCallback(() => {
    setSelectedCode(null);
    setOtherNote('');
    onClose?.();
  }, [onClose]);

  const handleConfirm = useCallback(() => {
    if (!selectedCode) return;
    if (selectedCode === 'OTHER' && !otherNote.trim()) return;
    onConfirm({reason: selectedCode, note: selectedCode === 'OTHER' ? otherNote.trim() : undefined});
    setSelectedCode(null);
    setOtherNote('');
  }, [selectedCode, otherNote, onConfirm]);

  const canConfirm = selectedCode && (selectedCode !== 'OTHER' || otherNote.trim().length > 0);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <TouchableWithoutFeedback onPress={handleClose}>
        <View style={s.overlay} />
      </TouchableWithoutFeedback>

      <View style={[s.sheet, {backgroundColor: colors.card}]}>
        <View style={[s.handle, {backgroundColor: colors.border}]} />

        <Text style={[s.title, {color: colors.textPrimary}]}>{t('partner.incoming.rejectTitle')}</Text>

        <View style={s.list}>
          {reasons.map(({code, label}) => {
            const isSelected = selectedCode === code;
            return (
              <TouchableOpacity
                key={code}
                style={[
                  s.row,
                  {
                    borderColor:     isSelected ? colors.primary : colors.border,
                    backgroundColor: isSelected ? colors.primary + '10' : colors.card,
                  },
                ]}
                onPress={() => setSelectedCode(code)}
                activeOpacity={0.75}>
                <View style={[s.radio, {borderColor: isSelected ? colors.primary : colors.border}]}>
                  {isSelected && <View style={[s.radioDot, {backgroundColor: colors.primary}]} />}
                </View>
                <Text style={[s.rowText, {color: isSelected ? colors.primary : colors.textPrimary}]}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}

          {selectedCode === 'OTHER' && (
            <TextInput
              style={[s.noteInput, {backgroundColor: colors.bg, borderColor: colors.border, color: colors.textPrimary}]}
              placeholder={t('partner.incoming.rejectNotePlaceholder')}
              placeholderTextColor={colors.textSecondary}
              value={otherNote}
              onChangeText={setOtherNote}
              multiline
              textAlignVertical="top"
            />
          )}
        </View>

        <TouchableOpacity
          style={[s.confirmBtn, {backgroundColor: canConfirm ? '#EF4444' : colors.border}]}
          onPress={handleConfirm}
          disabled={!canConfirm}
          activeOpacity={0.8}>
          <Text style={s.confirmText}>{t('partner.incoming.rejectConfirm')}</Text>
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
  list:        {gap: 8, marginTop: 4},
  row:         {flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 14, borderWidth: 1.5},
  radio:       {width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center'},
  radioDot:    {width: 10, height: 10, borderRadius: 5},
  rowText:     {fontSize: 14, fontWeight: '600'},
  noteInput:   {borderWidth: 1, borderRadius: 14, padding: 14, fontSize: 14, minHeight: 80, marginTop: 4},
  confirmBtn:  {paddingVertical: 16, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 4},
  confirmText: {color: '#FFF', fontSize: 16, fontWeight: '800'},
});
