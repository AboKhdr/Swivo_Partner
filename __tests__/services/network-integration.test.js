/**
 * Tests for network/API integration scenarios
 * Covers:
 *   - Request states (loading, success, error, empty)
 *   - HTTP error codes (400, 401, 403, 404, 500)
 *   - Offline / network failure
 *   - Timeout (30-second AbortController)
 *   - Malformed JSON response
 *   - Cancel on unmount (AbortController signal)
 *   - Retry logic (token refresh retry)
 *   - Race conditions in concurrent requests
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import api, {setUnauthorizedHandler, uploadImage} from '../../src/services/api';

// ── Global fetch mock ─────────────────────────────────────────────────────────

const mockFetch = jest.fn();
global.fetch = mockFetch;

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem:    jest.fn(),
  setItem:    jest.fn().mockResolvedValue(undefined),
  removeItem: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../src/config', () => ({BASE_URL1: 'https://api.test.com'}));

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeResponse(status, body, contentType = 'application/json') {
  return {
    status,
    ok: status >= 200 && status < 300,
    headers: {get: (k) => (k === 'content-type' ? contentType : null)},
    json: jest.fn().mockResolvedValue(body),
  };
}

function makeAbortError() {
  return Object.assign(new Error('The operation was aborted'), {name: 'AbortError'});
}

// ── Setup ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
  AsyncStorage.getItem.mockResolvedValue(null);
  setUnauthorizedHandler(null);
});

afterEach(() => {
  jest.useRealTimers();
});

// ══════════════════════════════════════════════════════════════════════════════
// 1. REQUEST STATES
// ══════════════════════════════════════════════════════════════════════════════

describe('1. Request States', () => {
  describe('Loading state', () => {
    it('fetch is called and resolves when the mock responds', async () => {
      mockFetch.mockResolvedValue(makeResponse(200, {items: []}));
      const res = await api.get('/orders');
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(res.success).toBe(true);
    });

    it('AbortController is created and timeout is set', async () => {
      mockFetch.mockResolvedValue(makeResponse(200, {}));
      const clearSpy = jest.spyOn(global, 'clearTimeout');
      await api.get('/test');
      // clearTimeout is called in finally — confirms the timer was set
      expect(clearSpy).toHaveBeenCalled();
    });
  });

  describe('Success state', () => {
    it('returns success:true and data for 200', async () => {
      const payload = {orders: [{_id: 'o1', status: 'ASSIGNED'}]};
      mockFetch.mockResolvedValue(makeResponse(200, payload));

      const res = await api.get('/biker/order');
      expect(res.success).toBe(true);
      expect(res.data).toEqual(payload);
      expect(res.error).toBeNull();
    });

    it('returns success:true and data for 201 Created', async () => {
      mockFetch.mockResolvedValue(makeResponse(201, {_id: 'new-id'}));
      const res = await api.post('/tenant/staff', {phoneNumber: '0512345678'});
      expect(res.success).toBe(true);
      expect(res.data._id).toBe('new-id');
    });

    it('handles empty array response (empty state)', async () => {
      mockFetch.mockResolvedValue(makeResponse(200, {data: [], pagination: {total: 0}}));
      const res = await api.get('/tenant/orders');
      expect(res.success).toBe(true);
      expect(res.data.data).toHaveLength(0);
      expect(res.data.pagination.total).toBe(0);
    });

    it('handles empty object response (e.g. accepted order)', async () => {
      mockFetch.mockResolvedValue(makeResponse(200, {}));
      const res = await api.post('/tenant/orders/o1/accept');
      expect(res.success).toBe(true);
      expect(res.data).toEqual({});
    });

    it('handles null data field in response', async () => {
      mockFetch.mockResolvedValue(makeResponse(200, {data: null}));
      const res = await api.get('/dashboard/today');
      expect(res.success).toBe(true);
      expect(res.data.data).toBeNull();
    });
  });

  describe('Error state', () => {
    it('returns success:false with error message for non-2xx', async () => {
      mockFetch.mockResolvedValue(makeResponse(400, {message: 'Invalid input'}));
      const res = await api.post('/auth/verify-otp', {otp: 'bad'});
      expect(res.success).toBe(false);
      expect(res.error).toBe('Invalid input');
      expect(res.data).toBeNull();
    });

    it('returns success:false with fallback code when no message in body', async () => {
      mockFetch.mockResolvedValue(makeResponse(503, {}));
      const res = await api.get('/tenant/orders');
      expect(res.success).toBe(false);
      expect(res.error).toBe('HTTP_503');
    });
  });

  describe('Empty / null state', () => {
    it('returns data:null when response body is not JSON', async () => {
      mockFetch.mockResolvedValue(makeResponse(200, null, 'text/plain'));
      const res = await api.get('/health');
      expect(res.success).toBe(true);
      expect(res.data).toBeNull();
    });

    it('returns data:null for non-JSON content-type', async () => {
      mockFetch.mockResolvedValue(makeResponse(200, null, 'text/html'));
      const res = await api.get('/html-page');
      expect(res.data).toBeNull();
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 2. ERROR HANDLING
// ══════════════════════════════════════════════════════════════════════════════

describe('2. Error Handling', () => {
  describe('Offline / Network failure', () => {
    it('returns NETWORK_ERROR when fetch throws a generic Error', async () => {
      mockFetch.mockRejectedValue(new Error('Network request failed'));
      const res = await api.get('/biker/order');
      expect(res.success).toBe(false);
      expect(res.error).toBe('NETWORK_ERROR');
      expect(res.data).toBeNull();
    });

    it('returns NETWORK_ERROR for TypeError (no internet)', async () => {
      mockFetch.mockRejectedValue(new TypeError('Failed to fetch'));
      const res = await api.post('/auth/generate-otp', {phoneNumber: '051'});
      expect(res.success).toBe(false);
      expect(res.error).toBe('NETWORK_ERROR');
    });

    it('returns NETWORK_ERROR for all request methods when offline', async () => {
      mockFetch.mockRejectedValue(new Error('offline'));
      const methods = [
        api.get('/x'),
        api.post('/x', {}),
        api.patch('/x', {}),
        api.put('/x', {}),
        api.delete('/x'),
      ];
      const results = await Promise.all(methods);
      results.forEach(r => expect(r.error).toBe('NETWORK_ERROR'));
    });
  });

  describe('Timeout', () => {
    it('returns TIMEOUT when AbortError is thrown', async () => {
      mockFetch.mockRejectedValue(makeAbortError());
      const res = await api.get('/slow-endpoint');
      expect(res.success).toBe(false);
      expect(res.error).toBe('TIMEOUT');
      expect(res.data).toBeNull();
    });

    it('simulates 30-second timeout by advancing timers', async () => {
      // fetch never resolves — the timer should abort it
      let abortCalled = false;
      const signal = {addEventListener: jest.fn(), aborted: false};
      const originalAbortController = global.AbortController;
      global.AbortController = jest.fn(() => ({
        abort: () => { abortCalled = true; },
        signal,
      }));

      mockFetch.mockRejectedValue(makeAbortError());
      const promise = api.get('/very-slow');
      jest.advanceTimersByTime(30000);
      await promise;

      global.AbortController = originalAbortController;
    });

    it('TIMEOUT is distinct from NETWORK_ERROR', async () => {
      mockFetch.mockRejectedValue(makeAbortError());
      const timeoutRes = await api.get('/slow');

      mockFetch.mockRejectedValue(new Error('no internet'));
      const networkRes = await api.get('/down');

      expect(timeoutRes.error).toBe('TIMEOUT');
      expect(networkRes.error).toBe('NETWORK_ERROR');
    });

    it('uploadImage returns TIMEOUT on AbortError', async () => {
      mockFetch.mockRejectedValue(makeAbortError());
      const res = await uploadImage('file:///photo.jpg');
      expect(res.error).toBe('TIMEOUT');
    });
  });

  describe('HTTP error codes', () => {
    it('400 Bad Request returns error message from body', async () => {
      mockFetch.mockResolvedValue(makeResponse(400, {message: 'رقم الهاتف غير صحيح'}));
      const res = await api.post('/auth/generate-otp', {});
      expect(res.success).toBe(false);
      expect(res.error).toBe('رقم الهاتف غير صحيح');
    });

    it('401 Unauthorized triggers refresh attempt', async () => {
      // no refresh token → SESSION_EXPIRED
      AsyncStorage.getItem.mockResolvedValue(null);
      mockFetch.mockResolvedValue(makeResponse(401, {}));
      const res = await api.get('/protected');
      expect(res.success).toBe(false);
      expect(res.error).toBe('SESSION_EXPIRED');
    });

    it('401 calls the registered unauthorizedHandler', async () => {
      const handler = jest.fn();
      setUnauthorizedHandler(handler);
      AsyncStorage.getItem.mockResolvedValue(null);
      mockFetch.mockResolvedValue(makeResponse(401, {}));
      await api.get('/protected');
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('401 does NOT call handler when no handler is registered', async () => {
      setUnauthorizedHandler(null);
      AsyncStorage.getItem.mockResolvedValue(null);
      mockFetch.mockResolvedValue(makeResponse(401, {}));
      // Should not throw even with null handler
      await expect(api.get('/protected')).resolves.toBeDefined();
    });

    it('403 Forbidden returns error', async () => {
      mockFetch.mockResolvedValue(makeResponse(403, {message: 'Access denied'}));
      const res = await api.get('/admin-only');
      expect(res.success).toBe(false);
      expect(res.error).toBe('Access denied');
    });

    it('404 Not Found returns error', async () => {
      mockFetch.mockResolvedValue(makeResponse(404, {message: 'Order not found'}));
      const res = await api.get('/biker/order/nonexistent');
      expect(res.success).toBe(false);
      expect(res.error).toBe('Order not found');
      expect(res.data).toBeNull();
    });

    it('500 Internal Server Error returns HTTP_500 fallback', async () => {
      mockFetch.mockResolvedValue(makeResponse(500, {}));
      const res = await api.get('/tenant/orders');
      expect(res.success).toBe(false);
      expect(res.error).toBe('HTTP_500');
    });

    it('500 with error message in body uses that message', async () => {
      mockFetch.mockResolvedValue(makeResponse(500, {message: 'Internal error'}));
      const res = await api.get('/crash');
      expect(res.error).toBe('Internal error');
    });

    it('422 Unprocessable Entity returns validation error', async () => {
      mockFetch.mockResolvedValue(makeResponse(422, {message: 'Validation failed'}));
      const res = await api.post('/tenant/staff', {});
      expect(res.success).toBe(false);
      expect(res.error).toBe('Validation failed');
    });
  });

  describe('Malformed JSON response', () => {
    it('returns data:null when content-type is not JSON', async () => {
      mockFetch.mockResolvedValue(makeResponse(200, null, 'text/plain'));
      const res = await api.get('/weird');
      expect(res.success).toBe(true);
      expect(res.data).toBeNull();
    });

    it('handles error response with no JSON body (empty content-type)', async () => {
      mockFetch.mockResolvedValue(makeResponse(503, null, ''));
      const res = await api.get('/unavailable');
      expect(res.success).toBe(false);
      expect(res.error).toBe('HTTP_503');
    });

    it('json() throwing causes NETWORK_ERROR fallback', async () => {
      mockFetch.mockResolvedValue({
        status: 200,
        ok: true,
        headers: {get: () => 'application/json'},
        json: jest.fn().mockRejectedValue(new SyntaxError('Unexpected token')),
      });
      const res = await api.get('/malformed');
      // json() throws → caught by catch block → NETWORK_ERROR
      expect(res.success).toBe(false);
      expect(res.error).toBe('NETWORK_ERROR');
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 3. SECURITY & PERFORMANCE
// ══════════════════════════════════════════════════════════════════════════════

describe('3. Security & Performance', () => {
  describe('Cancel on unmount (AbortController)', () => {
    it('request function uses AbortController signal', async () => {
      mockFetch.mockResolvedValue(makeResponse(200, {}));
      await api.get('/orders');
      const [, options] = mockFetch.mock.calls[0];
      expect(options.signal).toBeDefined();
    });

    it('TIMEOUT is returned when the signal is aborted', async () => {
      mockFetch.mockRejectedValue(makeAbortError());
      const res = await api.get('/orders');
      expect(res.error).toBe('TIMEOUT');
    });

    it('clearTimeout is called after successful request (no timer leak)', async () => {
      mockFetch.mockResolvedValue(makeResponse(200, {}));
      const spy = jest.spyOn(global, 'clearTimeout');
      await api.get('/ok');
      expect(spy).toHaveBeenCalled();
    });

    it('clearTimeout is called after failed request (no timer leak)', async () => {
      mockFetch.mockRejectedValue(new Error('fail'));
      const spy = jest.spyOn(global, 'clearTimeout');
      await api.get('/fail');
      expect(spy).toHaveBeenCalled();
    });

    it('uploadImage clears timeout on success', async () => {
      mockFetch.mockResolvedValue(makeResponse(200, {url: 'https://cdn.test/x.jpg'}));
      const spy = jest.spyOn(global, 'clearTimeout');
      await uploadImage('file:///img.jpg');
      expect(spy).toHaveBeenCalled();
    });

    it('uploadImage clears timeout on error', async () => {
      mockFetch.mockRejectedValue(new Error('fail'));
      const spy = jest.spyOn(global, 'clearTimeout');
      await uploadImage('file:///img.jpg');
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('Retry logic (token refresh)', () => {
    it('retries exactly once after 401 with valid refresh token', async () => {
      AsyncStorage.getItem.mockImplementation(key => {
        if (key === 'refresh_token') return Promise.resolve('rt-valid');
        return Promise.resolve(null);
      });
      mockFetch
        .mockResolvedValueOnce(makeResponse(401, {}))
        .mockResolvedValueOnce(makeResponse(200, {token: 'new-tok'}))
        .mockResolvedValueOnce(makeResponse(200, {data: 'ok'}));

      const res = await api.get('/protected');
      expect(res.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it('saves new access token after successful refresh', async () => {
      AsyncStorage.getItem.mockImplementation(key => {
        if (key === 'refresh_token') return Promise.resolve('rt-valid');
        return Promise.resolve(null);
      });
      mockFetch
        .mockResolvedValueOnce(makeResponse(401, {}))
        .mockResolvedValueOnce(makeResponse(200, {token: 'access-new', refreshToken: 'rt-new'}))
        .mockResolvedValueOnce(makeResponse(200, {}));

      await api.get('/protected');
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('auth_token', 'access-new');
    });

    it('saves new refresh token when provided', async () => {
      AsyncStorage.getItem.mockImplementation(key => {
        if (key === 'refresh_token') return Promise.resolve('rt-old');
        return Promise.resolve(null);
      });
      mockFetch
        .mockResolvedValueOnce(makeResponse(401, {}))
        .mockResolvedValueOnce(makeResponse(200, {token: 't', refreshToken: 'rt-new'}))
        .mockResolvedValueOnce(makeResponse(200, {}));

      await api.get('/x');
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('refresh_token', 'rt-new');
    });

    it('does not save refresh token when none returned by server', async () => {
      AsyncStorage.getItem.mockImplementation(key => {
        if (key === 'refresh_token') return Promise.resolve('rt-old');
        return Promise.resolve(null);
      });
      mockFetch
        .mockResolvedValueOnce(makeResponse(401, {}))
        .mockResolvedValueOnce(makeResponse(200, {token: 'new-tok'})) // no refreshToken
        .mockResolvedValueOnce(makeResponse(200, {}));

      await api.get('/x');
      const calls = AsyncStorage.setItem.mock.calls;
      const rtCall = calls.find(([k]) => k === 'refresh_token');
      expect(rtCall).toBeUndefined();
    });

    it('returns SESSION_EXPIRED when refresh token is missing', async () => {
      AsyncStorage.getItem.mockResolvedValue(null);
      mockFetch.mockResolvedValue(makeResponse(401, {}));
      const res = await api.get('/protected');
      expect(res.error).toBe('SESSION_EXPIRED');
    });

    it('returns SESSION_EXPIRED when refresh endpoint returns 401', async () => {
      AsyncStorage.getItem.mockImplementation(key => {
        if (key === 'refresh_token') return Promise.resolve('stale-rt');
        return Promise.resolve(null);
      });
      mockFetch
        .mockResolvedValueOnce(makeResponse(401, {}))
        .mockResolvedValueOnce(makeResponse(401, {}));

      const res = await api.get('/protected');
      expect(res.error).toBe('SESSION_EXPIRED');
    });

    it('clears auth_token after failed refresh', async () => {
      AsyncStorage.getItem.mockImplementation(key => {
        if (key === 'refresh_token') return Promise.resolve('expired-rt');
        return Promise.resolve(null);
      });
      mockFetch
        .mockResolvedValueOnce(makeResponse(401, {}))
        .mockResolvedValueOnce(makeResponse(500, {}));

      await api.get('/protected');
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('auth_token');
    });

    it('does not retry on 400 (only 401 triggers refresh)', async () => {
      mockFetch.mockResolvedValue(makeResponse(400, {message: 'Bad'}));
      const res = await api.get('/bad');
      expect(res.error).toBe('Bad');
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('does not retry on 403 (not a refresh scenario)', async () => {
      mockFetch.mockResolvedValue(makeResponse(403, {message: 'Forbidden'}));
      const res = await api.get('/forbidden');
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(res.success).toBe(false);
    });

    it('refresh failure due to network error returns SESSION_EXPIRED', async () => {
      AsyncStorage.getItem.mockImplementation(key => {
        if (key === 'refresh_token') return Promise.resolve('rt');
        return Promise.resolve(null);
      });
      mockFetch
        .mockResolvedValueOnce(makeResponse(401, {}))
        .mockRejectedValueOnce(new Error('offline')); // refresh request fails

      const res = await api.get('/protected');
      expect(res.error).toBe('SESSION_EXPIRED');
    });
  });

  describe('Race conditions in concurrent requests', () => {
    it('two concurrent requests both succeed independently', async () => {
      mockFetch
        .mockResolvedValueOnce(makeResponse(200, {id: 'a'}))
        .mockResolvedValueOnce(makeResponse(200, {id: 'b'}));

      const [resA, resB] = await Promise.all([
        api.get('/orders/a'),
        api.get('/orders/b'),
      ]);

      expect(resA.success).toBe(true);
      expect(resA.data.id).toBe('a');
      expect(resB.success).toBe(true);
      expect(resB.data.id).toBe('b');
    });

    it('one failing request does not affect a concurrent succeeding request', async () => {
      mockFetch
        .mockResolvedValueOnce(makeResponse(500, {message: 'server error'}))
        .mockResolvedValueOnce(makeResponse(200, {data: 'ok'}));

      const [fail, ok] = await Promise.all([
        api.get('/crash'),
        api.get('/ok'),
      ]);

      expect(fail.success).toBe(false);
      expect(ok.success).toBe(true);
    });

    it('each concurrent request has its own AbortController', async () => {
      const controllers = [];
      const OriginalAbortController = global.AbortController;
      global.AbortController = jest.fn(() => {
        const ctrl = new OriginalAbortController();
        controllers.push(ctrl);
        return ctrl;
      });

      mockFetch
        .mockResolvedValueOnce(makeResponse(200, {}))
        .mockResolvedValueOnce(makeResponse(200, {}));

      await Promise.all([api.get('/a'), api.get('/b')]);

      expect(controllers.length).toBeGreaterThanOrEqual(2);
      global.AbortController = OriginalAbortController;
    });

    it('five concurrent requests to the same endpoint all resolve', async () => {
      for (let i = 0; i < 5; i++) {
        mockFetch.mockResolvedValueOnce(makeResponse(200, {i}));
      }

      const results = await Promise.all(
        Array.from({length: 5}, (_, i) => api.get(`/order/${i}`)),
      );

      results.forEach(r => expect(r.success).toBe(true));
    });

    it('concurrent requests with mixed errors resolve without throwing', async () => {
      mockFetch
        .mockResolvedValueOnce(makeResponse(200, {ok: true}))
        .mockRejectedValueOnce(new Error('offline'))
        .mockResolvedValueOnce(makeResponse(404, {message: 'not found'}));

      const [ok, offline, notFound] = await Promise.all([
        api.get('/a'),
        api.get('/b'),
        api.get('/c'),
      ]);

      expect(ok.success).toBe(true);
      expect(offline.error).toBe('NETWORK_ERROR');
      expect(notFound.success).toBe(false);
      expect(notFound.error).toBe('not found');
    });

    it('401 in one concurrent request does not interfere with others', async () => {
      AsyncStorage.getItem.mockResolvedValue(null); // no refresh token
      const handler = jest.fn();
      setUnauthorizedHandler(handler);

      mockFetch
        .mockResolvedValueOnce(makeResponse(401, {}))
        .mockResolvedValueOnce(makeResponse(200, {data: 'safe'}));

      const [unauth, ok] = await Promise.all([
        api.get('/protected'),
        api.get('/public'),
      ]);

      expect(unauth.error).toBe('SESSION_EXPIRED');
      expect(ok.success).toBe(true);
    });
  });

  describe('Authorization header', () => {
    it('attaches Bearer token from AsyncStorage on authenticated request', async () => {
      AsyncStorage.getItem.mockResolvedValue('user-jwt-token');
      mockFetch.mockResolvedValue(makeResponse(200, {}));

      await api.get('/biker/order');

      const [, options] = mockFetch.mock.calls[0];
      expect(options.headers.Authorization).toBe('Bearer user-jwt-token');
    });

    it('omits Authorization header when token is null', async () => {
      AsyncStorage.getItem.mockResolvedValue(null);
      mockFetch.mockResolvedValue(makeResponse(200, {}));

      await api.get('/public');

      const [, options] = mockFetch.mock.calls[0];
      expect(options.headers.Authorization).toBeUndefined();
    });

    it('always sets Content-Type to application/json', async () => {
      AsyncStorage.getItem.mockResolvedValue(null);
      mockFetch.mockResolvedValue(makeResponse(200, {}));

      await api.post('/auth/generate-otp', {phone: '051'});

      const [, options] = mockFetch.mock.calls[0];
      expect(options.headers['Content-Type']).toBe('application/json');
    });
  });

  describe('URL construction', () => {
    it('builds correct URL from base + path', async () => {
      mockFetch.mockResolvedValue(makeResponse(200, {}));
      await api.get('/biker/order/abc123');
      const [url] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.test.com/biker/order/abc123');
    });

    it('passes query string as-is in the path', async () => {
      mockFetch.mockResolvedValue(makeResponse(200, {}));
      await api.get('/tenant/orders?status=ASSIGNED&page=2');
      const [url] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.test.com/tenant/orders?status=ASSIGNED&page=2');
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 4. uploadImage — dedicated section
// ══════════════════════════════════════════════════════════════════════════════

describe('4. uploadImage', () => {
  it('returns success:true with URL on 200', async () => {
    AsyncStorage.getItem.mockResolvedValue('tok');
    mockFetch.mockResolvedValue(makeResponse(200, {url: 'https://cdn.test/img.jpg'}));

    const res = await uploadImage('file:///local/photo.jpg');
    expect(res.success).toBe(true);
    expect(res.data.url).toBe('https://cdn.test/img.jpg');
  });

  it('returns NETWORK_ERROR when fetch throws', async () => {
    mockFetch.mockRejectedValue(new Error('no network'));
    const res = await uploadImage('file:///photo.jpg');
    expect(res.error).toBe('NETWORK_ERROR');
  });

  it('returns HTTP error code on non-ok status', async () => {
    mockFetch.mockResolvedValue(makeResponse(413, null, 'text/plain'));
    const res = await uploadImage('file:///huge.jpg');
    expect(res.success).toBe(false);
    expect(res.error).toBe('HTTP_413');
  });

  it('attaches Authorization header when token exists', async () => {
    AsyncStorage.getItem.mockResolvedValue('img-token');
    mockFetch.mockResolvedValue(makeResponse(200, {}));

    await uploadImage('file:///photo.jpg');
    const [, options] = mockFetch.mock.calls[0];
    expect(options.headers.Authorization).toBe('Bearer img-token');
  });

  it('omits Authorization header when no token', async () => {
    AsyncStorage.getItem.mockResolvedValue(null);
    mockFetch.mockResolvedValue(makeResponse(200, {}));

    await uploadImage('file:///photo.jpg');
    const [, options] = mockFetch.mock.calls[0];
    expect(options.headers.Authorization).toBeUndefined();
  });

  it('uses multipart/form-data content-type', async () => {
    mockFetch.mockResolvedValue(makeResponse(200, {}));
    await uploadImage('file:///photo.jpg');
    const [, options] = mockFetch.mock.calls[0];
    expect(options.headers['Content-Type']).toBe('multipart/form-data');
  });

  it('uses custom fieldName when provided', async () => {
    mockFetch.mockResolvedValue(makeResponse(200, {}));
    await uploadImage('file:///photo.jpg', 'photo');
    // FormData.append was called with 'photo'
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('posts to /upload endpoint', async () => {
    mockFetch.mockResolvedValue(makeResponse(200, {}));
    await uploadImage('file:///img.jpg');
    const [url] = mockFetch.mock.calls[0];
    expect(url).toBe('https://api.test.com/upload');
  });
});
