/**
 * Tests for src/services/auth.js
 * Covers: login, verifyOTP, resendOTP, logout
 */

const mockPost = jest.fn();
const mockSetSession = jest.fn().mockResolvedValue(undefined);
const mockLogout     = jest.fn().mockResolvedValue(undefined);
const mockGetState   = jest.fn(() => ({setSession: mockSetSession, logout: mockLogout}));

jest.mock('../../src/services/api', () => ({
  __esModule: true,
  default: {post: mockPost},
}));

jest.mock('../../src/store/authStore', () => ({
  __esModule: true,
  default: {getState: mockGetState},
}));

const {login, verifyOTP, resendOTP, logout} = require('../../src/services/auth');

beforeEach(() => {
  jest.clearAllMocks();
  mockGetState.mockReturnValue({setSession: mockSetSession, logout: mockLogout});
});

// ── login ─────────────────────────────────────────────────────────────────────

describe('login', () => {
  it('calls /auth/generate-otp with phone and default prefix', async () => {
    mockPost.mockResolvedValue({success: true, data: {}});
    await login({phone: '0512345678'});
    expect(mockPost).toHaveBeenCalledWith('/auth/generate-otp', {
      phoneNumber: '0512345678',
      prefix: '966',
    });
  });

  it('uses custom prefix when provided', async () => {
    mockPost.mockResolvedValue({success: true, data: {}});
    await login({phone: '123456', prefix: '971'});
    expect(mockPost).toHaveBeenCalledWith('/auth/generate-otp', {
      phoneNumber: '123456',
      prefix: '971',
    });
  });

  it('returns api response as-is on success', async () => {
    const mockRes = {success: true, data: {message: 'OTP sent'}};
    mockPost.mockResolvedValue(mockRes);
    const res = await login({phone: '0512345678'});
    expect(res).toEqual(mockRes);
  });

  it('returns api response as-is on failure', async () => {
    const mockRes = {success: false, error: 'NETWORK_ERROR', data: null};
    mockPost.mockResolvedValue(mockRes);
    const res = await login({phone: '0512345678'});
    expect(res).toEqual(mockRes);
  });

  it('handles empty phone string', async () => {
    mockPost.mockResolvedValue({success: false, error: 'INVALID_PHONE', data: null});
    const res = await login({phone: ''});
    expect(mockPost).toHaveBeenCalledWith('/auth/generate-otp', {
      phoneNumber: '',
      prefix: '966',
    });
    expect(res.success).toBe(false);
  });
});

// ── verifyOTP ─────────────────────────────────────────────────────────────────

describe('verifyOTP', () => {
  const OTP_SUCCESS = {
    success: true,
    data: {token: 'jwt-abc', user: {_id: 'u1', role: 'biker', name: 'Ahmed'}},
  };

  it('calls /auth/verify-otp with correct payload', async () => {
    mockPost.mockResolvedValue(OTP_SUCCESS);
    await verifyOTP({phone: '0512345678', prefix: '966', code: '123456'});
    expect(mockPost).toHaveBeenCalledWith('/auth/verify-otp', {
      phoneNumber: '0512345678',
      prefix: '966',
      otp: '123456',
      fcmToken: 'mock-fcm-token',
    });
  });

  it('calls setSession with token and user on success', async () => {
    mockPost.mockResolvedValue(OTP_SUCCESS);
    await verifyOTP({phone: '0512345678', prefix: '966', code: '123456'});
    expect(mockSetSession).toHaveBeenCalledWith('jwt-abc', {_id: 'u1', role: 'biker', name: 'Ahmed'});
  });

  it('handles nested data.data response shape', async () => {
    const nestedRes = {
      success: true,
      data: {data: {token: 'tok-nested', user: {_id: 'u2', role: 'admin'}}},
    };
    mockPost.mockResolvedValue(nestedRes);
    await verifyOTP({phone: '0512345678', code: '999999'});
    expect(mockSetSession).toHaveBeenCalledWith('tok-nested', {_id: 'u2', role: 'admin'});
  });

  it('does NOT call setSession on failure', async () => {
    mockPost.mockResolvedValue({success: false, error: 'INVALID_OTP', data: null});
    await verifyOTP({phone: '0512345678', code: '000000'});
    expect(mockSetSession).not.toHaveBeenCalled();
  });

  it('returns response object', async () => {
    mockPost.mockResolvedValue(OTP_SUCCESS);
    const res = await verifyOTP({phone: '0512345678', code: '123456'});
    expect(res).toEqual(OTP_SUCCESS);
  });

  it('does not throw when data has no token', async () => {
    mockPost.mockResolvedValue({success: true, data: {}});
    await expect(verifyOTP({phone: '051', code: '111111'})).resolves.not.toThrow();
  });

  it('uses default prefix 966 when not provided', async () => {
    mockPost.mockResolvedValue({success: false, data: null, error: 'X'});
    await verifyOTP({phone: '051', code: '111'});
    expect(mockPost.mock.calls[0][1].prefix).toBe('966');
  });
});

// ── resendOTP ─────────────────────────────────────────────────────────────────

describe('resendOTP', () => {
  it('calls same endpoint as login', async () => {
    mockPost.mockResolvedValue({success: true, data: {}});
    await resendOTP({phone: '0512345678'});
    expect(mockPost).toHaveBeenCalledWith('/auth/generate-otp', {
      phoneNumber: '0512345678',
      prefix: '966',
    });
  });

  it('returns api response', async () => {
    const mockRes = {success: true, data: {message: 'Resent'}};
    mockPost.mockResolvedValue(mockRes);
    const res = await resendOTP({phone: '0512345678'});
    expect(res).toEqual(mockRes);
  });
});

// ── logout ────────────────────────────────────────────────────────────────────

describe('logout', () => {
  it('calls authStore.logout()', async () => {
    await logout();
    expect(mockLogout).toHaveBeenCalledTimes(1);
  });
});
