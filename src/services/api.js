import AsyncStorage from '@react-native-async-storage/async-storage';
import config from '../config';

const BASE_URL = config.BASE_URL1;
const TIMEOUT_MS = 30000;

async function getToken() {
  try {
    return await AsyncStorage.getItem('auth_token');
  } catch {
    return null;
  }
}

async function saveToken(token) {
  await AsyncStorage.setItem('auth_token', token);
}

async function clearToken() {
  await AsyncStorage.removeItem('auth_token');
}

let _onUnauthorized = null;
export function setUnauthorizedHandler(fn) {
  _onUnauthorized = fn;
}

async function request(method, path, body, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const token = await getToken();
    const headers = {'Content-Type': 'application/json'};
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
      ...options,
    });

    if (res.status === 401) {
      const refreshed = await attemptRefresh();
      if (refreshed) {
        return request(method, path, body, options);
      }
      await clearToken();
      _onUnauthorized?.();
      return {success: false, error: 'SESSION_EXPIRED', data: null};
    }

    let data = null;
    const ct = res.headers.get('content-type') || '';
    if (ct.includes('application/json')) {
      data = await res.json();
    }

    if (!res.ok) {
      return {success: false, error: data?.message || `HTTP_${res.status}`, data: null};
    }

    return {success: true, data, error: null};
  } catch (err) {
    if (err.name === 'AbortError') {
      return {success: false, error: 'TIMEOUT', data: null};
    }
    return {success: false, error: 'NETWORK_ERROR', data: null};
  } finally {
    clearTimeout(timer);
  }
}

async function attemptRefresh() {
  try {
    const refreshToken = await AsyncStorage.getItem('refresh_token');
    if (!refreshToken) return false;

    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({refreshToken}),
    });

    if (!res.ok) return false;

    const data = await res.json();
    if (data?.token) {
      await saveToken(data.token);
      if (data.refreshToken) {
        await AsyncStorage.setItem('refresh_token', data.refreshToken);
      }
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export async function uploadImage(uri, fieldName = 'image') {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30000);

  try {
    const token = await getToken();
    const form = new FormData();
    const filename = uri.split('/').pop();
    const ext = filename?.split('.').pop() ?? 'jpg';
    form.append(fieldName, {uri, name: filename, type: `image/${ext}`});

    const res = await fetch(`${BASE_URL}/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'multipart/form-data',
        ...(token ? {Authorization: `Bearer ${token}`} : {}),
      },
      body: form,
      signal: controller.signal,
    });

    clearTimeout(timer);
    if (!res.ok) return {success: false, error: `HTTP_${res.status}`, data: null};
    const data = await res.json();
    return {success: true, data, error: null};
  } catch (err) {
    clearTimeout(timer);
    if (err.name === 'AbortError') return {success: false, error: 'TIMEOUT', data: null};
    return {success: false, error: 'NETWORK_ERROR', data: null};
  }
}

const api = {
  get:    (path, opts)        => request('GET',    path, null, opts),
  post:   (path, body, opts)  => request('POST',   path, body, opts),
  patch:  (path, body, opts)  => request('PATCH',  path, body, opts),
  put:    (path, body, opts)  => request('PUT',    path, body, opts),
  delete: (path, body, opts)  => request('DELETE', path, body, opts),
  saveToken,
  clearToken,
  getToken,
};

export default api;
