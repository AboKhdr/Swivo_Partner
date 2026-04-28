Modifying node_modules is prohibited.

# CLAUDE.md — React Native Project Rules

## 🔴 STRICT RULES (Never Violate)

### Language & Stack
- This is a React Native CLI project (NOT Expo)
- React Native version: 0.76.9
- Language: JavaScript only — NO TypeScript unless explicitly requested
- No web APIs: no `document`, `window`, `localStorage`, `sessionStorage`
- No HTML tags: no `<div>`, `<p>`, `<span>`, `<img>` — use RN components only

### Components
- Always use: `View`, `Text`, `TextInput`, `TouchableOpacity`, `ScrollView`, `FlatList`
- Never use `<button>`, `<input>`, `<form>` — these are web only
- Every text must be inside a `<Text>` component — never raw strings in JSX
- Use NativeWind className for styles — NOT StyleSheet.create unless necessary

### Navigation
- Use `@react-navigation/native` + `@react-navigation/native-stack` only
- Never mix navigation libraries
- Current versions: native@7.2.2, native-stack@7.14.12

### Styling — NativeWind v4
- Use NativeWind className ONLY — this is Tailwind for React Native
- NativeWind version: 4.2.3 with tailwindcss 3.4.19
- Never use web-only Tailwind classes (no `hover:`, no `focus:` unless RN supported)
- For dynamic styles use `cn()` utility or template literals with className
- StyleSheet.create only for styles NativeWind cannot handle

### Icons
- Use `lucide-react-native` v1.11.0 ONLY
- Always import `react-native-svg` is already installed as peer dependency
- Usage: `import { Home } from 'lucide-react-native'`
- Always pass `size` and `color` props explicitly

### State Management
- Use React hooks: `useState`, `useEffect`, `useCallback`, `useMemo`
- For global state: Zustand or Redux Toolkit only
- No Context API for large state — only for theme/auth

### API & Async
- Always handle loading, success, and error states
- Never leave unhandled promises — always use try/catch
- Cancel requests on component unmount using `AbortController`

### File Structure
- All source code inside `/src`
- `/src/screens` — screen components
- `/src/components` — reusable components
- `/src/navigation` — navigation setup
- `/src/hooks` — custom hooks
- `/src/services` — API calls
- `/src/store` — state management
- `/src/theme` — colors, fonts, spacing
- `/src/utils` — helper functions

### Performance
- Always use `FlatList` instead of `ScrollView` for long lists
- Use `useCallback` for functions passed as props
- Use `useMemo` for expensive calculations
- Never use anonymous functions in `renderItem`
- Use `keyExtractor` always in FlatList

### Platform Specific
- Use `Platform.OS === 'android'` for platform checks
- Use `Platform.select({})` for platform-specific styles

### Images & Assets
- Store assets in `/src/assets`
- Always define width and height for images
- Use `resizeMode` always

### Error Handling
- Show user-friendly error messages — no raw error objects to UI
- Always use try/catch in async functions

### Code Style
- Functional components only — no class components
- One component per file
- File names: PascalCase for components, camelCase for utils
- No commented-out code in final version
- No `console.log` in production code

## ✅ Installed Libraries (Use These Only)
- Navigation: `@react-navigation/native` + `@react-navigation/native-stack`
- Icons: `lucide-react-native` + `react-native-svg`
- Styling: `nativewind` v4 + `tailwindcss`

## ❌ Forbidden
- `Expo` or any Expo SDK
- `localStorage` / `sessionStorage`
- Class components
- jQuery or any DOM library
- `lucide-react` (web version) — use `lucide-react-native` only
- Installing new packages without explicit user request
- Modifying `node_modules`
- `StyleSheet.create` when NativeWind can handle it