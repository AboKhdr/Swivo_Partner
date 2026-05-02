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
`index.js` → `App.tsx` → `src/biker/navigation/AppNavigator.js`. `App.tsx` is minimal: it handles auth state and renders either `LoginScreen` or `AppNavigator`.

### Folder Structure
```
/src
  /biker                         — active biker app (use this)
    /features
      /home        — HomeScreen.js, components/OrderCard.js, components/StatCard.js
      /orders      — OrdersNavigator.js, OrdersScreen.js, OrderDetailsScreen.js,
                     OrderMapScreen.js, components/OrderListCard.js
      /reviews     — ReviewsScreen.js
      /profile     — ProfileScreen.js
    /navigation
      AppNavigator.js            — hand-rolled bottom tab bar
  /features                      — legacy scaffold (auth still used)
    /auth          — LoginScreen.js (active)
    /home, /orders, /profile, /reviews — OUTDATED duplicates, not used
  /shared                        — used by both
    /components    — MapContainer.js, StatusTracker.js
    /constants     — colors.js, status.js
    /data          — mockData.js
    /types         — JSDoc typedefs (index.js)
  /assets
    /steps         — 1.png–5.png (step guide illustrations)
  /hooks, /services, /store      — planned, not yet created
```

**Rules:**
- New biker screens go in `src/biker/features/<feature>/ScreenName.js`
- Sub-components used only within a feature go in `src/biker/features/<feature>/components/`
- Shared components go in `src/shared/components/`
- Auth screen stays in `src/features/auth/LoginScreen.js`
- Never add screens or logic to `App.tsx`

### Navigation
Two levels, both hand-rolled (no `@react-navigation/bottom-tabs`):

1. **`AppNavigator`** (`src/biker/navigation/AppNavigator.js`) — bottom tab bar using `useState`. Tabs: Home, Orders, Reviews, Profile. Uses `display:'none'` + lazy mount for tab switching. Root has `direction:'rtl'`.

2. **`OrdersNavigator`** (`src/biker/features/orders/OrdersNavigator.js`) — mini-stack inside the Orders tab managing 3 screens: list → detail → map. Uses `display:'none'` + `BackHandler`. Reuse this pattern for any other nested stacks.

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
No HTTP client wired up. Screens use mock data from `src/shared/data/mockData.js` and `setTimeout` placeholders. Planned base URL: `https://<domain>/api/biker`. Auth uses JWT as `Authorization: Bearer <token>`. When implementing, create service functions in `/src/services` using `fetch` + `AbortController`.

### MapContainer
`src/shared/components/MapContainer.js` — intended to show Google Maps via WebView. `react-native-webview` is NOT installed. MapContainer is non-functional until WebView is installed.

### Styling
NativeWind v4 is installed but **not configured** — `babel.config.js` does not include the NativeWind preset and there is no `tailwind.config.js`. **Do not configure it without explicit instruction.** All screens use `StyleSheet.create`.

### Localization
All UI text is hardcoded in Arabic. No i18n library is set up.

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
