import React, {useRef, useEffect} from 'react';
import {Animated, StyleSheet, Text, View} from 'react-native';

export default function StatCard({emoji, label, value, color, delay}) {
  const translateY = useRef(new Animated.Value(24)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {toValue: 1, duration: 400, delay, useNativeDriver: true}),
      Animated.spring(translateY, {toValue: 0, delay, useNativeDriver: true, tension: 60, friction: 9}),
    ]).start();
  }, [delay, opacity, translateY]);

  return (
    <Animated.View style={{opacity, transform: [{translateY}], flex: 1}}>
      <View style={[s.card, {shadowColor: color}]}>
        <View style={[s.iconBox, {backgroundColor: color + '20'}]}>
          <Text style={s.emoji}>{emoji}</Text>
        </View>
        <Text style={s.label}>{label}</Text>
        <Text style={s.value}>{value}</Text>
      </View>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: '#fff', borderRadius: 20, padding: 14,
    borderWidth: 1, borderColor: '#F1F5F9',
    shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.12, shadowRadius: 10, elevation: 3,
  },
  iconBox: {width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 8},
  emoji: {fontSize: 18},
  label: {fontSize: 11, color: '#94A3B8', marginBottom: 2},
  value: {fontSize: 15, fontWeight: '800', color: '#1E293B'},
});
