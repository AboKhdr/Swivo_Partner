import React, {useState} from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import {ChevronDown, Check} from 'lucide-react-native';
import {useTheme} from '../context/ThemeContext';

export default function SelectField({
  label,
  placeholder = 'اختر...',
  options = [],
  value,
  onChange,
}) {
  const {colors} = useTheme();
  const [open, setOpen] = useState(false);

  const selected = options.find(o => o.value === value);

  return (
    <View style={s.root}>
      {label ? <Text style={[s.label, {color: colors.textPrimary}]}>{label}</Text> : null}

      <TouchableOpacity
        style={[s.trigger, {backgroundColor: colors.card, borderColor: open ? colors.primary : colors.border}]}
        onPress={() => setOpen(true)}
        activeOpacity={0.8}>
        <Text style={[s.triggerTxt, {color: selected ? colors.textPrimary : colors.textSecondary}]}>
          {selected ? selected.label : placeholder}
        </Text>
        <ChevronDown size={18} color={colors.textSecondary} />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <TouchableWithoutFeedback onPress={() => setOpen(false)}>
          <View style={s.overlay} />
        </TouchableWithoutFeedback>

        <View style={s.sheet}>
          <View style={[s.sheetCard, {backgroundColor: colors.card}]}>
            {label ? (
              <Text style={[s.sheetTitle, {color: colors.textPrimary}]}>{label}</Text>
            ) : null}
            <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
              {options.map((opt, i) => {
                const active = opt.value === value;
                return (
                  <View key={opt.value}>
                    <TouchableOpacity
                      style={s.optionRow}
                      onPress={() => { onChange(opt.value); setOpen(false); }}
                      activeOpacity={0.75}>
                      <Text style={[s.optionTxt, {color: active ? colors.primary : colors.textPrimary, fontWeight: active ? '700' : '500'}]}>
                        {opt.label}
                      </Text>
                      {active && <Check size={16} color={colors.primary} />}
                    </TouchableOpacity>
                    {i < options.length - 1 && (
                      <View style={[s.sep, {backgroundColor: colors.border}]} />
                    )}
                  </View>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  root:       {gap: 8},
  label:      {fontSize: 14, fontWeight: '700'},
  trigger:    {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 14, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 14},
  triggerTxt: {fontSize: 14},
  overlay:    {position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.35)'},
  sheet:      {flex: 1, justifyContent: 'flex-end', paddingHorizontal: 16, paddingBottom: 32},
  sheetCard:  {borderRadius: 20, paddingVertical: 8, maxHeight: 360},
  sheetTitle: {fontSize: 16, fontWeight: '800', paddingHorizontal: 16, paddingVertical: 12},
  optionRow:  {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14},
  optionTxt:  {fontSize: 15},
  sep:        {height: 1, marginHorizontal: 16},
});
