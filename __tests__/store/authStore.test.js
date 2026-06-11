/**
 * Tests for src/store/authStore.js
 * Covers: hydrate, setSession, logout, updateUser
 */

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem:    jest.fn(),
  setItem:    jest.fn().mockResolvedValue(undefined),
  removeItem: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../src/services/api', () => ({
  __esModule: true,
  default: {
    saveToken:  jest.fn().mockResolvedValue(undefined),
    clearToken: jest.fn().mockResolvedValue(undefined),
    getToken:   jest.fn().mockResolvedValue(null),
  },
}));

jest.mock('../../src/services/notifications', () => ({
  registerFCMToken: jest.fn().mockResolvedValue({success: true}),
}));

import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../src/services/api';
import {registerFCMToken} from '../../src/services/notifications';
import useAuthStore from '../../src/store/authStore';

const MOCK_USER = {
  _id: 'u1',
  name: 'Ahmed',
  phoneNumber: '0512345678',
  role: 'biker',
};

beforeEach(() => {
  jest.clearAllMocks();
  useAuthStore.setState({user: null, token: null, role: null, isReady: false});
});

// ── hydrate ───────────────────────────────────────────────────────────────────

describe('hydrate', () => {
  it('sets isReady:true and loads session when token+user exist', async () => {
    AsyncStorage.getItem
      .mockResolvedValueOnce('stored-token')
      .mockResolvedValueOnce(JSON.stringify(MOCK_USER));

    await useAuthStore.getState().hydrate();
    const {token, user, role, isReady} = useAuthStore.getState();

    expect(isReady).toBe(true);
    expect(token).toBe('stored-token');
    expect(user.role).toBe('biker');
    expect(role).toBe('biker');
  });

  it('sets isReady:true but no session when storage is empty', async () => {
    AsyncStorage.getItem.mockResolvedValue(null);

    await useAuthStore.getState().hydrate();
    const {token, user, isReady} = useAuthStore.getState();

    expect(isReady).toBe(true);
    expect(token).toBeNull();
    expect(user).toBeNull();
  });

  it('sets isReady:true when only token exists (no user)', async () => {
    AsyncStorage.getItem
      .mockResolvedValueOnce('stored-token')
      .mockResolvedValueOnce(null);

    await useAuthStore.getState().hydrate();
    expect(useAuthStore.getState().isReady).toBe(true);
    expect(useAuthStore.getState().token).toBeNull();
  });

  it('sets isReady:true even when AsyncStorage throws', async () => {
    AsyncStorage.getItem.mockRejectedValue(new Error('storage fail'));

    await useAuthStore.getState().hydrate();
    expect(useAuthStore.getState().isReady).toBe(true);
  });

  it('handles corrupted JSON in auth_user gracefully', async () => {
    AsyncStorage.getItem
      .mockResolvedValueOnce('token-abc')
      .mockResolvedValueOnce('NOT_VALID_JSON{{{');

    await useAuthStore.getState().hydrate();
    expect(useAuthStore.getState().isReady).toBe(true);
    expect(useAuthStore.getState().token).toBeNull();
  });

  it('derives role:admin from user.role = "admin"', async () => {
    const adminUser = {...MOCK_USER, role: 'admin'};
    AsyncStorage.getItem
      .mockResolvedValueOnce('tok')
      .mockResolvedValueOnce(JSON.stringify(adminUser));

    await useAuthStore.getState().hydrate();
    expect(useAuthStore.getState().role).toBe('admin');
  });

  it('sets role:null when user.role is undefined', async () => {
    const noRoleUser = {_id: 'u2', name: 'X'};
    AsyncStorage.getItem
      .mockResolvedValueOnce('tok')
      .mockResolvedValueOnce(JSON.stringify(noRoleUser));

    await useAuthStore.getState().hydrate();
    expect(useAuthStore.getState().role).toBeNull();
  });
});

// ── setSession ────────────────────────────────────────────────────────────────

describe('setSession', () => {
  it('stores token and user, updates state', async () => {
    await useAuthStore.getState().setSession('new-token', MOCK_USER);

    expect(api.saveToken).toHaveBeenCalledWith('new-token');
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      'auth_user',
      expect.any(String),
    );
    const {token, role} = useAuthStore.getState();
    expect(token).toBe('new-token');
    expect(role).toBe('biker');
  });

  it('registers FCM token when fcm_token exists in storage', async () => {
    AsyncStorage.getItem.mockResolvedValue('fcm-device-token');

    await useAuthStore.getState().setSession('tok', MOCK_USER);
    await new Promise(r => setTimeout(r, 10));

    expect(registerFCMToken).toHaveBeenCalledWith('fcm-device-token', 'biker');
  });

  it('falls back to getToken() and registers when fcm_token is absent from storage', async () => {
    // Safety net: setSession resolves the FCM token from the messaging SDK
    // (global mock → 'mock-fcm-token') when it is not yet cached in storage,
    // guaranteeing this device is registered on a first login.
    AsyncStorage.getItem.mockResolvedValue(null);

    await useAuthStore.getState().setSession('tok', MOCK_USER);
    await new Promise(r => setTimeout(r, 10));

    expect(registerFCMToken).toHaveBeenCalledWith('mock-fcm-token', 'biker');
  });

  it('sets role:admin when user.role is not "biker"', async () => {
    await useAuthStore.getState().setSession('tok', {_id: 'u3', name: 'Z', role: 'manager'});
    expect(useAuthStore.getState().role).toBe('admin');
  });
});

// ── logout ────────────────────────────────────────────────────────────────────

describe('logout', () => {
  it('clears token, user, role from state', async () => {
    useAuthStore.setState({token: 'tok', user: MOCK_USER, role: 'biker'});

    await useAuthStore.getState().logout();

    const {token, user, role} = useAuthStore.getState();
    expect(token).toBeNull();
    expect(user).toBeNull();
    expect(role).toBeNull();
  });

  it('calls api.clearToken and removes auth_user from AsyncStorage', async () => {
    await useAuthStore.getState().logout();

    expect(api.clearToken).toHaveBeenCalled();
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith('auth_user');
  });
});

// ── updateUser ────────────────────────────────────────────────────────────────

describe('updateUser', () => {
  it('merges patch into existing user', () => {
    useAuthStore.setState({user: MOCK_USER});
    useAuthStore.getState().updateUser({name: 'Mohammed'});

    expect(useAuthStore.getState().user.name).toBe('Mohammed');
    expect(useAuthStore.getState().user.phoneNumber).toBe('0512345678');
  });

  it('persists updated user to AsyncStorage', () => {
    useAuthStore.setState({user: MOCK_USER});
    useAuthStore.getState().updateUser({name: 'Khalid'});

    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      'auth_user',
      expect.stringContaining('Khalid'),
    );
  });

  it('does not throw when user is null', () => {
    useAuthStore.setState({user: null});
    expect(() => useAuthStore.getState().updateUser({name: 'X'})).not.toThrow();
  });

  it('handles empty patch object', () => {
    useAuthStore.setState({user: MOCK_USER});
    useAuthStore.getState().updateUser({});
    expect(useAuthStore.getState().user).toEqual(MOCK_USER);
  });
});
