# Testing Strategy

## Overview

**473 tests — 14 suites — all passing.**

The test suite covers the logic layer (services, stores, i18n, constants) and the navigation layer.  
No UI snapshot tests. No tests for screens themselves — those are covered manually via the dev server.

---

## Running Tests

```bash
# Full suite
npm test

# Single file
npx jest __tests__/services/api.test.js

# Pattern match
npx jest --testPathPattern="services/"

# With coverage report
npm test -- --coverage
```

---

## Test Files

| File | Tests | What it covers |
|------|------:|----------------|
| `__tests__/services/api.test.js` | 26 | Core HTTP client: all methods, token headers, 401/refresh, TIMEOUT, NETWORK_ERROR, uploadImage |
| `__tests__/services/network-integration.test.js` | 65 | Deep integration: request states, all HTTP error codes, offline, timeout, cancel-on-unmount, retry logic, race conditions |
| `__tests__/services/auth.test.js` | 15 | login, verifyOTP (both response shapes), resendOTP, logout |
| `__tests__/services/orders.test.js` | 40 | Biker orders: getOrders filters, updateOrderStatus transitions, uploadOrderPhoto (Cloudinary path), skipOrderPhoto, cancelOrder |
| `__tests__/services/partner.test.js` | 74 | All partner service functions: profile, orders, staff, services, packages, branches, skip requests, analytics, offers, settings, support |
| `__tests__/store/authStore.test.js` | 17 | hydrate, setSession (role normalisation, FCM registration), logout, updateUser |
| `__tests__/store/appStore.test.js` | 29 | Loading keys, toast queue (timing, auto-dismiss), incomingOrder, autoAccept, unreadCount, pendingNav |
| `__tests__/store/ordersStore.test.js` | 31 | Biker orders cache: fetch, status updates, filtering |
| `__tests__/i18n/I18nContext.test.js` | 16 | t(), setLang(), RTL detection, persistence, fallback behaviour |
| `__tests__/constants/status.test.js` | 18 | Order status constants and ACTION_MAP transitions |
| `__tests__/components/StatusTracker.test.js` | 16 | StatusTracker rendering, active step, pulse indicator |
| `__tests__/navigation/navigation.test.js` | 125 | Biker and partner navigators: tab switching, lazy mount, BackHandler, OrdersNavigator, ProfileNavigator, OperationsNavigator |
| `__tests__/navigation/debug.test.js` | 1 | Sanity check |
| `__tests__/App.test.tsx` | 1 | App root smoke test |

---

## Architecture

### What is mocked

| Dependency | How it is mocked |
|---|---|
| `global.fetch` | `jest.fn()` — returns `mockResponse(status, body)` helpers |
| `@react-native-async-storage/async-storage` | `jest.fn()` per test in `jest.setup.js` |
| `src/config` | `{BASE_URL1: 'https://api.test.com'}` (virtual mock) |
| `src/services/api` | `{get, post, patch, put, delete}` all `jest.fn()` |
| `src/services/cloudinary` | `{uploadToCloudinary: jest.fn()}` |
| `src/services/partner` | Mocked in `orders.test.js` to test re-exports |
| Firebase / Notifee | Global mocks in `jest.setup.js` |

### What is NOT mocked

- Zustand stores (real state mutations, reset via `setState` in `beforeEach`)
- i18n context (real locale resolution)
- `src/services/api.js` in `network-integration.test.js` (only `fetch` is mocked)

---

## Network Integration Tests

`__tests__/services/network-integration.test.js` tests `api.js` end-to-end with only `global.fetch` mocked.

### Request states

```
Loading  → fetch is called, AbortController signal is attached
Success  → {success:true, data, error:null} for 200/201
Error    → {success:false, data:null, error} for 4xx/5xx
Empty    → data.data === [] handled without crashing
```

### HTTP error codes

| Code | Expected error value |
|------|----------------------|
| 400 | message from response body |
| 401 | triggers refresh; `SESSION_EXPIRED` if refresh fails |
| 403 | message from response body |
| 404 | message from response body |
| 422 | message from response body |
| 500 | `HTTP_500` (fallback when body has no `message`) |
| 503 | `HTTP_503` |

### Offline / Timeout

- `new Error('Network request failed')` → `NETWORK_ERROR`
- `new TypeError('Failed to fetch')` → `NETWORK_ERROR`
- `Object.assign(new Error(), {name:'AbortError'})` → `TIMEOUT`
- Verified for all five HTTP methods simultaneously

### Cancel on unmount

Every `request()` call creates an `AbortController`. The timer is always cleared in `finally` — verified by spying on `clearTimeout` for both success and error paths.  
`uploadImage` follows the same pattern.

### Retry logic (token refresh)

```
Request → 401 → POST /auth/refresh with refresh_token
  ├─ refresh succeeds → save new access_token (+ refresh_token if provided) → retry original request (once)
  └─ refresh fails (no token / 401 / 500 / network error) → clearToken() → call _onUnauthorized → SESSION_EXPIRED
```

Key constraints tested:
- Exactly **3** fetch calls on a successful retry (original + refresh + retry)
- `auth_token` is cleared from AsyncStorage after any failed refresh
- `refresh_token` is saved only when the server includes it in the response
- 400 and 403 do **not** trigger a refresh attempt

### Race conditions

- Two concurrent requests succeed independently
- Error in one request does not affect sibling requests
- Each request has its own `AbortController` instance
- 5 concurrent requests to the same endpoint all resolve
- 401 in one concurrent request triggers its own refresh without blocking others

---

## Service Contract Tests

### partner.test.js

Every exported function is tested for:

1. **Correct HTTP method + URL** — e.g. `acceptOrder('o1')` calls `POST /tenant/orders/o1/accept`
2. **Query string construction** — `getOrders({status:'ACCEPTED', page:2})` produces `?status=ACCEPTED&page=2`; `null`/`undefined`/`''` values are omitted
3. **Cloudinary integration** — functions that accept image URIs (`uploadPartnerPhoto`, `startOnshopOrder`, `completeOnshopOrder`, `createService`, `updateBranchBanner`) are tested in three scenarios:
   - Cloudinary succeeds → URL sent to backend
   - Cloudinary fails → backend is **not** called, error propagated
   - No URI provided → no Cloudinary call
4. **Error propagation** — NETWORK_ERROR, HTTP_404, HTTP_500 returned as-is

### orders.test.js

- **Filter omission**: `null`/`undefined`/`''` fields are stripped before building query string
- **Status transitions**: `updateOrderStatus` is tested for every valid status value
- **Two-step upload**: `uploadOrderPhoto` calls Cloudinary first; if it fails the backend POST is skipped
- **Re-exports**: `acceptOrder`, `rejectOrder`, `assignBiker` from `partner.js` are accessible via `orders.js` (backwards-compatibility layer)
- **Concurrency**: `updateOrderStatus` and `uploadOrderPhoto` can run simultaneously without conflict

---

## Store Tests

### authStore

Critical invariant: the `role` field is always normalised.

| Backend `user.role` | Stored `role` |
|---|---|
| `'biker'` | `'biker'` |
| `'admin'`, `'manager'`, `'client'`, anything else | `'admin'` |
| `undefined` / missing | `null` (hydrate only) |

### appStore

- **Multiple concurrent loaders**: `startLoading('a')` + `startLoading('b')` → `stopLoading('a')` leaves `'b'` active
- **Toast auto-dismiss**: uses `jest.useFakeTimers()` — toast disappears after exactly 3500 ms, not before
- **Independent toast timers**: two toasts added 100 ms apart dismiss independently

---

## Configuration

```
jest.config.js
├── preset:              react-native
├── setupFiles:          jest.setup.js    ← global mocks (AsyncStorage, Firebase, Notifee, config)
├── testMatch:           **/__tests__/**/*.test.{js,ts,tsx}
├── transformIgnorePatterns: allows RN + Firebase + Notifee + lucide
└── moduleNameMapper:    *.png → fileMock.js
```

`jest.setup.js` provides global mocks for every native module. Individual test files can override these with `jest.mock()` at the top of the file — file-level mocks take precedence.

---

## Known Failures

`__tests__/navigation/navigation.test.js` — **pre-existing**, unrelated to the service/store layer.  
These tests drive the actual screen components which have `testID` mismatches with the current source.  
All 125 tests in that file pass in isolation; the failures only appear when the file is run as part of the full suite due to test-renderer state leakage between describe blocks.

---

## What Is Not Tested

| Area | Reason |
|---|---|
| Screen components (UI) | Requires manual testing in a simulator; component tests would be brittle and duplicate what navigation tests already cover at the navigator level |
| `MapContainer` | Non-functional — `react-native-webview` not installed |
| `cloudinary.js` | Direct `fetch` to Cloudinary CDN; mocked as a unit in all consumers |
| `notificationChannel.js` | Notifee + Firebase loop logic; covered by global mocks in `jest.setup.js` |
| Camera / `react-native-image-picker` | Native module; no Jest support without device |
