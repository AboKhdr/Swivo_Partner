# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Modifying node_modules is prohibited.

## Commands

```bash
# Start Metro bundler
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios

# Lint
npm run lint

# Run tests
npm test
```

## Architecture & Current State

### App Entry Point
`index.js` → `App.tsx`. After login, `App.tsx` routes by role (`Role = 'biker' | 'admin' | null`):
- `role === 'biker'` → `src/biker/navigation/AppNavigator.js`
- `role === 'admin'` → `src/partner/navigation/PartnerNavigator.js`
- `role === null` → `src/features/auth/LoginScreen.js`

The two apps are **fully isolated** — no shared screens or navigators between `src/biker/` and `src/partner/`. Both share `src/shared/` only.

### Folder Structure
```
/src
  /biker                         — biker app (role: 'biker')
    /features
      /home        — HomeScreen.js, NotificationsScreen.js, components/OrderCard.js
      /orders      — OrdersNavigator.js, OrdersScreen.js, OrderDetailsScreen.js,
                     OrderMapScreen.js, components/OrderListCard.js
      /reviews     — ReviewsScreen.js
      /profile     — ProfileNavigator.js, ProfileScreen.js, PersonalInfoScreen.js,
                     WalletScreen.js, LanguageScreen.js, SupportScreen.js, TermsScreen.js
    /navigation
      AppNavigator.js            — hand-rolled bottom tab bar (Home, Orders, Reviews, Profile)
  /partner                       — partner/manager app (role: 'manager')
    /features
      /dashboard   — DashboardScreen.js (stats + recent orders + opens IncomingOrderScreen)
      /orders      — OrdersNavigator.js, OrdersScreen.js, OrderDetailsScreen.js,
                     IncomingOrderScreen.js, AssignBikerScreen.js, SkipReviewScreen.js
      /operations  — OperationsNavigator.js, ServicesScreen.js, PackagesScreen.js,
                     StaffScreen.js, BranchesScreen.js
      /profile     — PartnerProfileNavigator.js, PartnerPersonalInfoScreen.js,
                   SupportScreen.js, TermsScreen.js
    /navigation
      PartnerNavigator.js        — hand-rolled bottom tab bar (Dashboard, Orders, Operations, Profile)
  /features                      — legacy scaffold (auth still used)
    /auth          — LoginScreen.js (active)
    /home, /orders, /profile, /reviews — OUTDATED duplicates, not used
  /shared                        — used by biker AND partner
    /components    — MapContainer.js, StatusTracker.js
    /constants     — colors.js (LightColors/DarkColors), status.js
    /context       — ThemeContext.js
    /data          — mockData.js
    /i18n          — I18nContext.js, locales/ar.json, en.json, hi.json
    /types         — JSDoc typedefs (index.js)
  /assets
    /steps         — 1.png–5.png (step guide illustrations)
  /hooks                         — planned, not yet created
  /services                      — api.js, auth.js, biker.js, orders.js, partner.js,
                                   notifications.js, notificationChannel.js, cloudinary.js
  /store                         — authStore.js, appStore.js, ordersStore.js (Zustand)
```

**Rules:**
- New biker screens go in `src/biker/features/<feature>/ScreenName.js`
- New partner/manager screens go in `src/partner/features/<feature>/ScreenName.js`
- Sub-components used only within a feature go in the feature's own `components/` subfolder
- Shared components go in `src/shared/components/`
- Auth screen stays in `src/features/auth/LoginScreen.js`
- Never add screens or logic to `App.tsx`
- Never import anything from `src/biker/` inside `src/partner/` or vice versa

### Navigation
All navigation is hand-rolled (no `@react-navigation/bottom-tabs`). Two parallel top-level navigators:

**Biker side:**
1. **`AppNavigator`** (`src/biker/navigation/AppNavigator.js`) — bottom tab bar. Tabs: Home, Orders, Reviews, Profile. Uses `display:'none'` + lazy mount.
2. **`OrdersNavigator`** (`src/biker/features/orders/OrdersNavigator.js`) — stack: list → detail → map. Uses `display:'none'` + `BackHandler`.
3. **`ProfileNavigator`** (`src/biker/features/profile/ProfileNavigator.js`) — same pattern, 5 sub-screens via `onNavigate(name)` / `onBack()`.

**Partner side:**
4. **`PartnerNavigator`** (`src/partner/navigation/PartnerNavigator.js`) — bottom tab bar. Tabs: Dashboard, Orders, Operations, Profile.
5. **`OrdersNavigator`** (`src/partner/features/orders/OrdersNavigator.js`) — stack: list → details (with AssignBiker nested inside OrderDetailsScreen).
6. **`OperationsNavigator`** (`src/partner/features/operations/OperationsNavigator.js`) — menu-style navigator for: Services, Packages, Staff, Branches, SkipReview.
7. **`PartnerProfileNavigator`** (`src/partner/features/profile/PartnerProfileNavigator.js`) — same `display:'none'` + BackHandler pattern.

The **standard nested-stack pattern** for all navigators: `display:'none'` + `BackHandler` + conditional mount. Reuse this for any new stacks.

### Order Status Flow
5-step linear flow in `src/shared/constants/status.js`:
```
ASSIGNED → ON_THE_WAY → ARRIVED → STARTED → COMPLETED
```
`ACTION_MAP` in `OrderDetailsScreen.js` maps each status to its next action label and next status. ARRIVED is a transitional step (no swipe action needed there).

### SwipeButton Pattern
`OrderDetailsScreen.js` contains an inline `SwipeButton` component using `PanResponder` + `Animated.Value` for swipe-to-confirm (right→left). Always add `key={currentStatus}` on `SwipeButton` to force remount and reset on each step transition.

### StatusTracker
`src/shared/components/StatusTracker.js` — 5 icon boxes (Play, MapPin, UserCheck, Droplets, Camera) with separator lines. Uses `React.Fragment` with sibling `View` separators (not `position:absolute`). Root has `direction:'rtl'` and `justifyContent:'center'`. Active box shows a pulse indicator.

### Camera & Image Upload
`OrderDetailsScreen.js` photo upload modal:
- Runtime: `PermissionsAndroid.request(CAMERA)` before calling `launchCamera`
- `launchCamera({mediaType:'photo', quality:0.8})` from `react-native-image-picker`
- Android requires `FileProvider` in `AndroidManifest.xml` + `android/app/src/main/res/xml/file_provider_paths.xml`
- `CAMERA`, `READ_MEDIA_IMAGES`, `READ_EXTERNAL_STORAGE` permissions in manifest

### API Layer
`src/services/api.js` — central HTTP client using `fetch` + `AbortController` (30s timeout). Attaches `Authorization: Bearer <token>` from AsyncStorage. On 401 auto-attempts token refresh via `/auth/refresh`; on failure calls the `_onUnauthorized` handler registered by `setUnauthorizedHandler(fn)` (wired in `App.tsx`). Returns `{success, data, error}` uniformly.

**Response shape from backend:** `{ success, message, token, user, ... }` — the payload is directly in `res.data`, NOT nested under `res.data.data`. `verifyOTP` in `src/services/auth.js` handles both shapes for safety.

Service modules:
- `src/services/auth.js` — `login`, `verifyOTP`, `resendOTP`, `logout` (calls `useAuthStore.getState().setSession`)
- `src/services/orders.js` — biker order endpoints (`/biker/order`)
- `src/services/biker.js` — biker profile/duty endpoints
- `src/services/partner.js` — partner dashboard, orders (`/tenant/orders`), staff, services, packages, branches
- `src/services/notifications.js` — FCM token registration, notification list/read
- `src/services/cloudinary.js` — direct image upload to Cloudinary (unsigned preset `tteamdashboard`)

Image uploads: `uploadToCloudinary(uri)` → `{success, url, error}`. Profile photos go to Cloudinary first, then the returned URL is saved to the backend. Base URL is set in `src/config.js` (`BASE_URL1`) — update for dev/ngrok.

### MapContainer
`src/shared/components/MapContainer.js` — intended to show Google Maps via WebView. `react-native-webview` is NOT installed. MapContainer is non-functional until WebView is installed.

### Styling
NativeWind v4 is installed but **not configured** — `babel.config.js` does not include the NativeWind preset and there is no `tailwind.config.js`. **Do not configure it without explicit instruction.** All screens use `StyleSheet.create`.

### Theme System
`src/shared/context/ThemeContext.js` — provides `{ isDark, colors, toggleTheme }` via `useTheme()`. Persists to AsyncStorage. Wraps the app in `App.tsx`. Always use `colors` from `useTheme()` instead of hardcoding color values. `LightColors`/`DarkColors` are exported from `src/shared/constants/colors.js`.

### Localization (i18n)
`src/shared/i18n/I18nContext.js` — provides `{ lang, setLang, t, isRTL }` via `useI18n()`. Supports `ar`, `en`, `hi`. Locale JSON files in `src/shared/i18n/locales/`. Persists to AsyncStorage. Use `t('key')` for all UI text — do NOT hardcode Arabic strings in new screens. Supports dot-notation keys (`t('orders.title')`) and `{{param}}` interpolation.

**RTL rule:** `App.tsx` sets `direction: isRTL ? 'rtl' : 'ltr'` on the root View — this handles all layout and text direction automatically. Never use `textAlign: 'right'`, `textAlign: 'left'`, `alignItems: 'flex-end'`, `justifyContent: 'flex-end'`, or `alignSelf: 'flex-end'` as RTL overrides in `StyleSheet.create`. Exception: `TextInput` does not inherit `direction` on Android — use `textAlign={isRTL ? 'right' : 'left'}` as a prop directly on `<TextInput>`.

### Profile Navigator (Biker)
`src/biker/features/profile/ProfileNavigator.js` — sub-screens: `PersonalInfoScreen`, `WalletScreen`, `LanguageScreen`, `SupportScreen`, `TermsScreen`. Navigation via `onNavigate(screenName)` / `onBack()` props.

### State Management (Zustand Stores)
Three stores in `src/store/`:
- `authStore.js` — `{ user, token, role, isReady }`. `hydrate()` called once on app start. `setSession(token, user)` persists to AsyncStorage and auto-registers the FCM token. `role` is `'biker' | 'admin' | null`. **Critical:** the backend may return `role: 'client'` or other values for partners — `setSession` normalises: `'biker'` stays `'biker'`, anything else becomes `'admin'`. Never trust `user.role` from the backend directly for routing.
- `appStore.js` — global UI state: loading keys, toast queue, `incomingOrder` / `clearIncomingOrder`, `autoAccept` toggle, `unreadCount` badge, `pendingNav` for notification-tap routing.
- `ordersStore.js` — cached orders list for the biker app.

### Notifications (Push)
`src/services/notificationChannel.js` — uses `@notifee/react-native`. `showIncomingOrderNotification(order)` creates channel `incoming_orders_v6` and re-displays a sound-bearing notification every 8s in a loop (Android requires cancel+redisplay with a new id to re-trigger the sound). Call `cancelIncomingOrderNotification()` after accept/reject/timeout. `@react-native-firebase/messaging` is used for FCM token retrieval and background message handling (configured in `index.js`, not `App.tsx`).

FCM token flow: `bootstrap(role)` in `FirebaseContext.js` fetches the token and calls `registerFCMToken(token, role)` → `POST /notifications/register`. Also called in `setSession` after login. If notifications don't arrive, check backend logs for `"no push tokens found"` — means token wasn't registered. The `role` passed to `registerFCMToken` must be the normalised app role (`'biker'` or `'admin'`), not the raw backend role.

---

## Partner App (role: 'manager')

Completely separate from the biker app. Same shared context (Theme, i18n, colors). Entry: `src/partner/navigation/PartnerNavigator.js`.

### Partner Screens & Their Purpose

**Dashboard tab (`src/partner/features/dashboard/`)**
- `DashboardScreen` — 4 stat cards (today's orders, pending, completed, bikers on duty) + recent orders list. Tapping a `PENDING_PARTNER` order opens `IncomingOrderScreen` inline (replaces the whole screen).

**Orders tab (`src/partner/features/orders/`)**
- `IncomingOrderScreen` — full-screen ring UI with 60-second countdown. Auto-calls `onReject('AUTO_TIMEOUT')` when timer hits 0. Reject opens `RejectOrderModal` (same folder) which requires selecting a reason enum; if "أخرى" is selected, a note field becomes mandatory.
- `OrdersScreen` — filterable list by status (PENDING_PARTNER, ACCEPTED, ASSIGNED, ON_THE_WAY, STARTED, COMPLETED).
- `OrderDetailsScreen` — shows customer info, service, timeline, biker assignment. Contains a "تعيين بايكر" button that mounts `AssignBikerScreen` inline (only shown when `status === 'ACCEPTED'` and no biker assigned).
- `AssignBikerScreen` — lists bikers where `isOnDuty=true`, shows `activeOrdersCount` per biker. Confirm triggers assignment.
- `SkipReviewScreen` — list of pending skip-photo requests. Manager can Approve or Reject each; rejection removes it from pending. Also accessible from `OperationsNavigator`.

**Operations tab (`src/partner/features/operations/`)**
- `OperationsNavigator` — menu screen listing 5 sections as tappable rows; navigates to each screen using `display:'none'` + BackHandler pattern.
- `ServicesScreen` — list of services with S/M/L pricing, category badge, active toggle.
- `PackagesScreen` — list of packages with included services, S/M/L pricing, uses count, validity days, active toggle.
- `StaffScreen` — tabbed (Bikers / Managers). Each row shows duty status toggle and active order count.
- `BranchesScreen` — list of branches with working hours per day (closed days shown greyed), slot duration, buffer time.

### Partner Order State Machine
```
PENDING_PAYMENT → AUTHORIZING → AUTHORIZED → PENDING_PARTNER → ACCEPTED → ASSIGNED → ON_THE_WAY → STARTED → COMPLETED
```
Rejection only from `PENDING_PARTNER`. Cancellation from `ACCEPTED / ASSIGNED / ON_THE_WAY / STARTED`.

### Inline Screen Pattern (Partner)
`IncomingOrderScreen` and `AssignBikerScreen` are not separate navigator screens — they are mounted **inline** inside their parent screen using a local `useState` flag. This keeps them tightly coupled to the order context without needing navigator props.

---

## Strict Rules

### Language & Stack
- React Native CLI project (NOT Expo), version 0.76.9
- JavaScript only — NO TypeScript unless explicitly requested
- No web APIs: `document`, `window`, `localStorage`, `sessionStorage`
- No HTML tags: `<div>`, `<p>`, `<span>`, `<img>` — use RN components only

### Components
- Use: `View`, `Text`, `TextInput`, `TouchableOpacity`, `ScrollView`, `FlatList`
- Never: `<button>`, `<input>`, `<form>`
- Every text must be inside a `<Text>` component — never raw strings in JSX
- All styles use `StyleSheet.create`

### Navigation
- Use `@react-navigation/native` + `@react-navigation/native-stack` only
- Bottom tabs are hand-rolled — do NOT install `@react-navigation/bottom-tabs`
- Nested stacks use the `OrdersNavigator` pattern (`display:'none'` + BackHandler)
- Never mix navigation libraries

### Icons
- `lucide-react-native` v1.11.0 ONLY (NOT `lucide-react`)
- Always pass `size` and `color` props explicitly
- `react-native-svg` is already installed as peer dependency

### State Management
- Local state: `useState`, `useEffect`, `useCallback`, `useMemo`
- Global state: Zustand or Redux Toolkit only
- Context API only for theme/auth — not for large state

### API & Async
- Always handle loading, success, and error states
- Always use try/catch; cancel on unmount with `AbortController`

### Performance
- `FlatList` instead of `ScrollView` for long lists
- `useCallback` for functions passed as props; `useMemo` for expensive calculations
- No anonymous functions in `renderItem`; always use `keyExtractor`

### Platform Specific
- `Platform.OS === 'android'` for checks; `Platform.select({})` for styles

### Images & Assets
- Store in `/src/assets`; always define `width`, `height`, and `resizeMode`

### Code Style
- Functional components only; one component per file
- PascalCase filenames for components, camelCase for utils
- No commented-out code; no `console.log`

## Installed Libraries (Use Only These)
- Navigation: `@react-navigation/native` + `@react-navigation/native-stack`
- Icons: `lucide-react-native` + `react-native-svg` (pinned at `15.11.2`)
- Styling: `StyleSheet.create` (NativeWind installed but not configured)
- Camera/Images: `react-native-image-picker` v7.1.2
- Storage: `@react-native-async-storage/async-storage`
- State: `zustand`
- Push Notifications: `@notifee/react-native` + `@react-native-firebase/messaging` + `@react-native-firebase/app`

## Forbidden
- Expo or any Expo SDK
- `localStorage` / `sessionStorage`
- Class components
- jQuery or any DOM library
- `lucide-react` (web version)
- Installing new packages without explicit user request
- Modifying `node_modules`
- Adding screens or logic to `App.tsx`
- `@react-navigation/bottom-tabs`
- `react-native-maps` or `react-native-webview` (not installed)
