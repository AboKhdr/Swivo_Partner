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
`index.js` → `App.tsx` → `src/navigation/AppNavigator.js`. `App.tsx` is minimal: it handles auth state and renders either `LoginScreen` or `AppNavigator`.

### Feature-Based Structure (required — always follow this pattern)
```
/src
  /features
    /auth        — LoginScreen.js
    /home        — HomeScreen.js, components/OrderCard.js, components/StatCard.js
    /orders      — OrdersScreen.js, OrderDetailsScreen.js, components/OrderListCard.js
    /reviews     — ReviewsScreen.js
    /profile     — ProfileScreen.js
    /<feature>   — one folder per feature; screens at root, sub-components in components/
  /navigation
    AppNavigator.js   — custom bottom tab bar (no @react-navigation/bottom-tabs)
  /shared
    /constants   — colors.js, status.js
    /data        — mockData.js
    /components  — reusable components (e.g. StatusTracker.js)
    /types       — JSDoc typedefs (index.js)
  /assets        — images and static files
  /hooks         — custom hooks
  /services      — API call functions (fetch + AbortController)
  /store         — Zustand/Redux state
```

**Rules:**
- Every new screen goes in `src/features/<feature>/ScreenName.js`
- Sub-components used only within a feature go in `src/features/<feature>/components/`
- Shared components used across features go in `src/shared/components/`
- Never add screens or logic back to `App.tsx`

### Navigation
`@react-navigation/native` + `@react-navigation/native-stack` are installed. The bottom tab bar is hand-rolled in `src/navigation/AppNavigator.js` using `useState` + `Animated` — do NOT install `@react-navigation/bottom-tabs`.

### API Layer
No HTTP client is wired up yet. Screens use mock data and `setTimeout` placeholders. Planned base URL: `https://<domain>/api/biker`. Auth uses a JWT passed as `Authorization: Bearer <token>`. When implementing, create service functions in `/src/services` using `fetch` + `AbortController` for cancellation.

### Styling
NativeWind v4 is installed but **not configured** — `babel.config.js` does not include the NativeWind preset and there is no `tailwind.config.js`. **Do not configure it without explicit instruction.** All existing screens use `StyleSheet.create` — continue using `StyleSheet.create` for all new screens until NativeWind is explicitly enabled.

### Localization
All UI text is currently hardcoded in Arabic. No i18n library is set up.

### Planned Screens (see `/tickets/`)
Auth, Home, Orders, Order Details, Wallet, Notifications, Reviews, Profile, Settings, Reports — all defined in `/tickets/0X_*.md` with API contracts and UI specs.

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
- All styles use `StyleSheet.create` (NativeWind is not yet configured)

### Navigation
- Use `@react-navigation/native` + `@react-navigation/native-stack` only
- Bottom tabs are hand-rolled — do NOT install `@react-navigation/bottom-tabs`
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

## Forbidden
- Expo or any Expo SDK
- `localStorage` / `sessionStorage`
- Class components
- jQuery or any DOM library
- `lucide-react` (web version)
- Installing new packages without explicit user request
- Modifying `node_modules`
- Adding screens or logic to `App.tsx` (keep it minimal)
