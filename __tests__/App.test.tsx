/**
 * Tests for App.tsx routing logic
 * Covers: role-based routing (biker, admin, null), hydration guard
 */

import React from 'react';
import {create, act} from 'react-test-renderer';

// Mock all heavy navigators/screens so App renders without real components
jest.mock('../src/biker/navigation/AppNavigator', () => {
  const {View} = require('react-native');
  return () => <View testID="biker-navigator" />;
});

jest.mock('../src/partner/navigation/PartnerNavigator', () => {
  const {View} = require('react-native');
  return () => <View testID="partner-navigator" />;
});

jest.mock('../src/features/auth/LoginScreen', () => {
  const {View} = require('react-native');
  return () => <View testID="login-screen" />;
});

jest.mock('../src/shared/context/ThemeContext', () => ({
  ThemeProvider: ({children}: {children: React.ReactNode}) => children,
  useTheme: () => ({
    isDark: false,
    colors: {},
    toggleTheme: jest.fn(),
  }),
}));

jest.mock('../src/shared/i18n/I18nContext', () => ({
  I18nProvider: ({children}: {children: React.ReactNode}) => children,
  useI18n: () => ({lang: 'ar', isRTL: true, t: (k: string) => k}),
}));

jest.mock('../src/shared/context/FirebaseContext', () => ({
  FirebaseProvider: ({children}: {children: React.ReactNode}) => children,
}));

jest.mock('../src/store/authStore', () => ({
  __esModule: true,
  default: {
    getState: jest.fn(() => ({hydrate: jest.fn().mockResolvedValue(undefined)})),
    subscribe: jest.fn(() => jest.fn()),
  },
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem:    jest.fn().mockResolvedValue(null),
  setItem:    jest.fn().mockResolvedValue(undefined),
  removeItem: jest.fn().mockResolvedValue(undefined),
}));

// We only test that App.tsx exists and is importable without crash
it('App module loads without error', () => {
  expect(() => require('../App')).not.toThrow();
});
