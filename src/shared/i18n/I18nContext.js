import React, {createContext, useCallback, useContext, useEffect, useMemo, useState} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LOCALES = {
  ar: require('./locales/ar.json'),
  en: require('./locales/en.json'),
  hi: require('./locales/hi.json'),
};

const STORAGE_KEY = '@lang';
const DEFAULT_LANG = 'ar';
const I18nContext = createContext(null);

function resolve(obj, path) {
  const parts = path.split('.');
  let cur = obj;
  for (let i = 0; i < parts.length; i++) {
    if (cur == null) return path;
    cur = cur[parts[i]];
  }
  return cur != null ? cur : path;
}

export function I18nProvider({children}) {
  const [lang, setLangState] = useState(DEFAULT_LANG);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then(val => { if (val && LOCALES[val]) setLangState(val); })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  const setLang = useCallback((code) => {
    if (!LOCALES[code]) return;
    setLangState(code);
    AsyncStorage.setItem(STORAGE_KEY, code).catch(() => {});
  }, []);

  const t = useCallback((key, params) => {
    const val = resolve(LOCALES[lang], key);
    if (Array.isArray(val)) return val;
    if (typeof val !== 'string') return key;
    if (!params) return val;
    return Object.keys(params).reduce(
      (s, k) => s.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), params[k]),
      val,
    );
  }, [lang]);

  const value = useMemo(() => ({
    lang,
    setLang,
    t,
    isRTL: lang === 'ar',
  }), [lang, setLang, t]);

  if (!ready) return null;

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
