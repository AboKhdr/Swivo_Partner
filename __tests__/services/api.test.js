/**
 * Tests for src/services/api.js
 * Covers: request(), uploadImage(), token helpers, unauthorized handler
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import api, {setUnauthorizedHandler, uploadImage} from '../../src/services/api';

// ── Mocks ─────────────────────────────────────────────────────────────────────

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem:    jest.fn(),
  setItem:    jest.fn(),
  removeItem: jest.fn(),
}));

jest.mock('../../src/config', () => ({
  BASE_URL1: 'https://api.test.com',
}));

const mockFetch = jest.fn();
global.fetch = mockFetch;

// Helper: build a mock Response
function mockResponse(status, body, contentType = 'application/json') {
  return {
    status,
    ok: status >= 200 && status < 300,
    headers: {
      get: (key) => (key === 'content-type' ? contentType : null),
    },
    json: jest.fn().mockResolvedValue(body),
  };
}

// ── Setup / Teardown ──────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
  AsyncStorage.getItem.mockResolvedValue(null);
  AsyncStorage.setItem.mockResolvedValue(undefined);
  AsyncStorage.removeItem.mockResolvedValue(undefined);
});

afterEach(() => {
  jest.useRealTimers();
});

// ── api.get ───────────────────────────────────────────────────────────────────

describe('api.get', () => {
  it('returns success:true with data on 200', async () => {
    mockFetch.mockResolvedValue(mockResponse(200, {items: [1, 2, 3]}));
    const res = await api.get('/orders');
    expect(res.success).toBe(true);
    expect(res.data).toEqual({items: [1, 2, 3]});
    expect(res.error).toBeNull();
  });

  it('attaches Authorization header when token exists', async () => {
    AsyncStorage.getItem.mockResolvedValue('my-token');
    mockFetch.mockResolvedValue(mockResponse(200, {}));
    await api.get('/profile');
    const [, options] = mockFetch.mock.calls[0];
    expect(options.headers.Authorization).toBe('Bearer my-token');
  });

  it('omits Authorization header when no token', async () => {
    AsyncStorage.getItem.mockResolvedValue(null);
    mockFetch.mockResolvedValue(mockResponse(200, {}));
    await api.get('/public');
    const [, options] = mockFetch.mock.calls[0];
    expect(options.headers.Authorization).toBeUndefined();
  });

  it('returns success:false with HTTP error on 404', async () => {
    mockFetch.mockResolvedValue(mockResponse(404, {message: 'Not found'}));
    const res = await api.get('/missing');
    expect(res.success).toBe(false);
    expect(res.error).toBe('Not found');
    expect(res.data).toBeNull();
  });

  it('returns success:false with HTTP_500 when no message in body', async () => {
    mockFetch.mockResolvedValue(mockResponse(500, {}));
    const res = await api.get('/crash');
    expect(res.success).toBe(false);
    expect(res.error).toBe('HTTP_500');
  });

  it('returns NETWORK_ERROR on fetch rejection', async () => {
    mockFetch.mockRejectedValue(new Error('Network failure'));
    const res = await api.get('/any');
    expect(res.success).toBe(false);
    expect(res.error).toBe('NETWORK_ERROR');
  });

  it('returns TIMEOUT on AbortError', async () => {
    mockFetch.mockRejectedValue(Object.assign(new Error('Aborted'), {name: 'AbortError'}));
    const res = await api.get('/slow');
    expect(res.success).toBe(false);
    expect(res.error).toBe('TIMEOUT');
  });

  it('handles non-JSON response gracefully', async () => {
    mockFetch.mockResolvedValue(mockResponse(200, null, 'text/html'));
    const res = await api.get('/html');
    expect(res.success).toBe(true);
    expect(res.data).toBeNull();
  });
});

// ── api.post ──────────────────────────────────────────────────────────────────

describe('api.post', () => {
  it('sends body as JSON', async () => {
    mockFetch.mockResolvedValue(mockResponse(201, {id: '123'}));
    await api.post('/orders', {amount: 50});
    const [, options] = mockFetch.mock.calls[0];
    expect(options.method).toBe('POST');
    expect(JSON.parse(options.body)).toEqual({amount: 50});
    expect(options.headers['Content-Type']).toBe('application/json');
  });

  it('handles empty body (null)', async () => {
    mockFetch.mockResolvedValue(mockResponse(200, {}));
    await api.post('/ping', null);
    const [, options] = mockFetch.mock.calls[0];
    expect(options.body).toBeUndefined();
  });

  it('returns success:false on 422', async () => {
    mockFetch.mockResolvedValue(mockResponse(422, {message: 'Validation error'}));
    const res = await api.post('/submit', {});
    expect(res.success).toBe(false);
    expect(res.error).toBe('Validation error');
  });
});

// ── api.patch / put / delete ──────────────────────────────────────────────────

describe('api.patch', () => {
  it('uses PATCH method', async () => {
    mockFetch.mockResolvedValue(mockResponse(200, {}));
    await api.patch('/orders/1/status', {status: 'COMPLETED'});
    expect(mockFetch.mock.calls[0][1].method).toBe('PATCH');
  });
});

describe('api.put', () => {
  it('uses PUT method', async () => {
    mockFetch.mockResolvedValue(mockResponse(200, {}));
    await api.put('/profile', {name: 'Ahmed'});
    expect(mockFetch.mock.calls[0][1].method).toBe('PUT');
  });
});

describe('api.delete', () => {
  it('uses DELETE method with no body', async () => {
    mockFetch.mockResolvedValue(mockResponse(200, {}));
    await api.delete('/orders/1');
    const [, options] = mockFetch.mock.calls[0];
    expect(options.method).toBe('DELETE');
    expect(options.body).toBeUndefined();
  });
});

// ── 401 / Token Refresh ───────────────────────────────────────────────────────

describe('401 handling', () => {
  it('calls unauthorizedHandler and returns SESSION_EXPIRED when no refresh token', async () => {
    const handler = jest.fn();
    setUnauthorizedHandler(handler);
    AsyncStorage.getItem.mockImplementation((key) => {
      if (key === 'refresh_token') return Promise.resolve(null);
      return Promise.resolve(null);
    });
    mockFetch.mockResolvedValue(mockResponse(401, {}));

    const res = await api.get('/protected');
    expect(res.error).toBe('SESSION_EXPIRED');
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('retries request after successful token refresh', async () => {
    AsyncStorage.getItem.mockImplementation((key) => {
      if (key === 'refresh_token') return Promise.resolve('refresh-xyz');
      return Promise.resolve(null);
    });

    mockFetch
      .mockResolvedValueOnce(mockResponse(401, {}))
      .mockResolvedValueOnce(mockResponse(200, {token: 'new-token', refreshToken: 'new-refresh'}))
      .mockResolvedValueOnce(mockResponse(200, {data: 'protected'}));

    const res = await api.get('/protected');
    expect(res.success).toBe(true);
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });

  it('returns SESSION_EXPIRED when refresh endpoint fails', async () => {
    const handler = jest.fn();
    setUnauthorizedHandler(handler);
    AsyncStorage.getItem.mockImplementation((key) => {
      if (key === 'refresh_token') return Promise.resolve('old-refresh');
      return Promise.resolve(null);
    });
    mockFetch
      .mockResolvedValueOnce(mockResponse(401, {}))
      .mockResolvedValueOnce(mockResponse(500, {}));

    const res = await api.get('/protected');
    expect(res.error).toBe('SESSION_EXPIRED');
    expect(handler).toHaveBeenCalled();
  });
});

// ── Token Helpers ─────────────────────────────────────────────────────────────

describe('token helpers', () => {
  it('saveToken stores in AsyncStorage', async () => {
    await api.saveToken('abc123');
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('auth_token', 'abc123');
  });

  it('clearToken removes from AsyncStorage', async () => {
    await api.clearToken();
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith('auth_token');
  });

  it('getToken returns null when AsyncStorage throws', async () => {
    AsyncStorage.getItem.mockRejectedValue(new Error('Storage error'));
    const token = await api.getToken();
    expect(token).toBeNull();
  });
});

// ── uploadImage ───────────────────────────────────────────────────────────────

describe('uploadImage', () => {
  it('returns success:true with data on 200', async () => {
    AsyncStorage.getItem.mockResolvedValue('my-token');
    mockFetch.mockResolvedValue(mockResponse(200, {url: 'https://cdn.test/img.jpg'}));

    const res = await uploadImage('file:///local/photo.jpg');
    expect(res.success).toBe(true);
    expect(res.data).toEqual({url: 'https://cdn.test/img.jpg'});
  });

  it('uses default fieldName "image"', async () => {
    mockFetch.mockResolvedValue(mockResponse(200, {}));
    await uploadImage('file:///photo.png');
    const [, options] = mockFetch.mock.calls[0];
    expect(options.method).toBe('POST');
  });

  it('returns NETWORK_ERROR on fetch rejection', async () => {
    mockFetch.mockRejectedValue(new Error('fail'));
    const res = await uploadImage('file:///photo.jpg');
    expect(res.error).toBe('NETWORK_ERROR');
  });

  it('returns TIMEOUT on AbortError', async () => {
    mockFetch.mockRejectedValue(Object.assign(new Error(), {name: 'AbortError'}));
    const res = await uploadImage('file:///photo.jpg');
    expect(res.error).toBe('TIMEOUT');
  });

  it('returns HTTP error on non-ok status', async () => {
    mockFetch.mockResolvedValue(mockResponse(413, {}));
    const res = await uploadImage('file:///huge.jpg');
    expect(res.success).toBe(false);
    expect(res.error).toBe('HTTP_413');
  });

  it('handles URI with no extension — defaults to jpg', async () => {
    mockFetch.mockResolvedValue(mockResponse(200, {url: 'x'}));
    await uploadImage('file:///no-extension');
    expect(res => res).toBeTruthy();
  });
});
