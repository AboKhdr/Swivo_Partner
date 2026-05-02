import React from 'react';
import {StyleSheet, View, Text} from 'react-native';
import {useTheme} from '../context/ThemeContext';

export default function MapContainer({height = 300}) {
  const {colors} = useTheme();

  const wrapStyle =
    height == null ? [s.wrap, s.wrapFlex] : [s.wrap, {height}];

  return (
    <View
      style={[
        wrapStyle,
        {
          backgroundColor: colors.card,
          borderRadius: 16,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: colors.border,
          alignItems: 'center',
          justifyContent: 'center',
        },
      ]}>
      <Text style={[s.placeholder, {color: colors.textSecondary}]}>
        الخريطة غير متاحة
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {width: '100%'},
  wrapFlex: {flex: 1},
  placeholder: {fontSize: 14},
});
