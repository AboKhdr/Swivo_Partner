/**
 * Tests for src/shared/i18n/I18nContext.js
 * Covers: resolve(), t(), setLang(), RTL detection, persistence
 */

import React from 'react';
import {create, act} from 'react-test-renderer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {I18nProvider, useI18n} from '../../src/shared/i18n/I18nContext';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../src/shared/i18n/locales/ar.json', () => ({
  auth: {
    welcome: 'أهلاً',
    login:   'تسجيل الدخول',
    networkError: 'خطأ في الشبكة',
  },
  orders: {
    title: 'الطلبات',
    count: 'عدد الطلبات: {{count}}',
  },
  nested: {deep: {key: 'قيمة عميقة'}},
}), {virtual: true});

jest.mock('../../src/shared/i18n/locales/en.json', () => ({
  auth: {
    welcome: 'Hello',
    login:   'Sign In',
  },
  orders: {
    title: 'Orders',
    count: 'Order count: {{count}}',
  },
  nested: {deep: {key: 'deep value'}},
}), {virtual: true});

jest.mock('../../src/shared/i18n/locales/hi.json', () => ({
  auth: {
    welcome: 'नमस्ते',
    login:   'साइन इन',
  },
  orders: {title: 'ऑर्डर'},
}), {virtual: true});

// ── Test Helper ───────────────────────────────────────────────────────────────

function makeConsumer() {
  let captured = null;
  function Consumer() {
    captured = useI18n();
    return null;
  }
  return {Consumer, getCaptured: () => captured};
}

async function renderWithI18n(resolvedLang = null) {
  AsyncStorage.getItem.mockResolvedValue(resolvedLang);
  const {Consumer, getCaptured} = makeConsumer();
  let instance;
  await act(async () => {
    instance = create(
      <I18nProvider>
        <Consumer />
      </I18nProvider>
    );
  });
  return {instance, getCaptured};
}

// ── Initial State ─────────────────────────────────────────────────────────────

describe('I18nProvider initial state', () => {
  it('defaults to Arabic (ar)', async () => {
    const {getCaptured} = await renderWithI18n(null);
    expect(getCaptured().lang).toBe('ar');
  });

  it('isRTL is true for Arabic', async () => {
    const {getCaptured} = await renderWithI18n(null);
    expect(getCaptured().isRTL).toBe(true);
  });

  it('loads persisted language from AsyncStorage', async () => {
    const {getCaptured} = await renderWithI18n('en');
    expect(getCaptured().lang).toBe('en');
  });

  it('ignores invalid persisted language', async () => {
    const {getCaptured} = await renderWithI18n('xx');
    expect(getCaptured().lang).toBe('ar');
  });

  it('falls back to default when AsyncStorage throws', async () => {
    AsyncStorage.getItem.mockRejectedValueOnce(new Error('fail'));
    const {Consumer, getCaptured} = makeConsumer();
    await act(async () => {
      create(<I18nProvider><Consumer /></I18nProvider>);
    });
    expect(getCaptured().lang).toBe('ar');
  });
});

// ── t() function ──────────────────────────────────────────────────────────────

describe('t()', () => {
  it('translates a simple key in Arabic', async () => {
    const {getCaptured} = await renderWithI18n(null);
    expect(getCaptured().t('auth.welcome')).toBe('أهلاً');
  });

  it('translates a nested dot-notation key', async () => {
    const {getCaptured} = await renderWithI18n(null);
    expect(getCaptured().t('nested.deep.key')).toBe('قيمة عميقة');
  });

  it('interpolates {{param}} correctly', async () => {
    const {getCaptured} = await renderWithI18n(null);
    expect(getCaptured().t('orders.count', {count: 5})).toBe('عدد الطلبات: 5');
  });

  it('returns the key when translation is missing', async () => {
    const {getCaptured} = await renderWithI18n(null);
    expect(getCaptured().t('nonexistent.key')).toBe('nonexistent.key');
  });

  it('returns empty string when key is empty string', async () => {
    const {getCaptured} = await renderWithI18n(null);
    expect(getCaptured().t('')).toBe('');
  });

  it('interpolates with count 99', async () => {
    const {getCaptured} = await renderWithI18n(null);
    expect(getCaptured().t('orders.count', {count: 99})).toBe('عدد الطلبات: 99');
  });
});

// ── setLang() ─────────────────────────────────────────────────────────────────

describe('setLang()', () => {
  it('switches to English', async () => {
    const {getCaptured} = await renderWithI18n(null);
    act(() => getCaptured().setLang('en'));
    expect(getCaptured().lang).toBe('en');
  });

  it('isRTL is false for English', async () => {
    const {getCaptured} = await renderWithI18n(null);
    act(() => getCaptured().setLang('en'));
    expect(getCaptured().isRTL).toBe(false);
  });

  it('persists language to AsyncStorage', async () => {
    const {getCaptured} = await renderWithI18n(null);
    act(() => getCaptured().setLang('hi'));
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('@lang', 'hi');
  });

  it('ignores invalid language code', async () => {
    const {getCaptured} = await renderWithI18n(null);
    act(() => getCaptured().setLang('zz'));
    expect(getCaptured().lang).toBe('ar');
  });

  it('switching lang changes translations', async () => {
    const {getCaptured} = await renderWithI18n(null);
    expect(getCaptured().t('auth.welcome')).toBe('أهلاً');
    act(() => getCaptured().setLang('en'));
    expect(getCaptured().t('auth.welcome')).toBe('Hello');
  });
});
