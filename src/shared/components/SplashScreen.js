import React, {useEffect, useRef} from 'react';
import {ActivityIndicator, Animated, Image, StyleSheet, View} from 'react-native';

export default function SplashScreen() {
  const fade = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade,  {toValue: 1, duration: 400, useNativeDriver: true}),
      Animated.spring(scale, {toValue: 1, friction: 6,   useNativeDriver: true}),
    ]).start();
  }, [fade, scale]);

  return (
    <View style={s.root}>
      <Animated.View style={[s.logoWrap, {opacity: fade, transform: [{scale}]}]}>
        <View style={s.logoCircle}>
          {/* <View style={s.logoInner} /> */}
          <Image source={require('../../../public/logo.png')} style={s.preview} resizeMode="cover" />
        </View>
      </Animated.View>
      <ActivityIndicator size="large" color="#1B7BF5" style={s.spinner} />
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 48,
  },
  logoWrap: {
    alignItems: 'center',
    gap: 20,
  },
  logoCircle: {
    width: 96,
    height: 96,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 12,
  },
  logoInner: {
    width: 48,
    height: 48,
    borderRadius: 14,
    borderWidth: 4,
    borderColor: '#fff',
    opacity: 0.9,
  },
  wordmark: {
    fontSize: 36,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  spinner: {
    position: 'absolute',
    bottom: 80,
  },
});
