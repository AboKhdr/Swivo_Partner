# Swivo Partner

> The mobile companion app for **Swivo** car-wash partners — one binary that serves both field **bikers** and branch **managers**.

<p align="left">
  <img alt="React Native" src="https://img.shields.io/badge/React%20Native-0.76-61DAFB?logo=react&logoColor=white" />
  <img alt="React" src="https://img.shields.io/badge/React-18.3-149ECA?logo=react&logoColor=white" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript&logoColor=white" />
  <img alt="Zustand" src="https://img.shields.io/badge/State-Zustand-2D3748" />
  <img alt="Firebase" src="https://img.shields.io/badge/Push-Firebase%20FCM-FFCA28?logo=firebase&logoColor=black" />
  <img alt="Platforms" src="https://img.shields.io/badge/Platforms-Android%20%7C%20iOS-555" />
</p>

---

## Overview

**Swivo Partner** is the React Native application used by service providers on the Swivo car-wash
marketplace. A single app dynamically renders one of two fully isolated experiences based on the
authenticated user's role:

| Role | Experience | Who uses it |
|------|------------|-------------|
| `biker` | **Biker app** — accept jobs, navigate to customers, run the wash, upload proof photos | Field washers / drivers |
| `admin` | **Partner / Manager app** — dashboard, order assignment, branch & service operations | Branch owners and managers |

The app talks to the Swivo backend over a REST API and receives real-time job alerts through
Firebase Cloud Messaging.

---

## Features

### Biker app
- **Home & notifications** — live job feed and incoming-order alerts.
- **Orders** — list, full order details, in-app map navigation, and a step-by-step status tracker.
- **Proof of service** — capture photos with the camera and upload them to Cloudinary.
- **Reviews** — view ratings and customer feedback.
- **Profile** — personal info, **wallet**, language, support, and terms.

### Partner / Manager app
- **Dashboard** — key stats, recent orders, and an incoming-order workflow.
- **Order management** — review incoming orders, **assign bikers**, and handle photo-skip reviews.
- **Operations** — manage services, packages, staff, and branches.
- **Profile** — personal info, support, and terms.

### Platform capabilities
- 🌍 **Internationalization** — English, Arabic (RTL), and Hindi, switchable at runtime.
- 🌓 **Light & dark themes** via a shared theme context.
- 🔔 **Push notifications** — Firebase Cloud Messaging with full-screen incoming-order intents (Notifee).
- 🗺️ **Maps** — Google Maps rendered through an embedded WebView.
- 💳 **Payments** — TAP payment deep-link handling.

---

## Tech Stack

| Area | Technology |
|------|------------|
| Framework | React Native 0.76 · React 18.3 |
| Language | TypeScript / JavaScript |
| Navigation | React Navigation (native-stack) + custom bottom tab bars |
| State management | Zustand |
| Push notifications | `@react-native-firebase/messaging` + `@notifee/react-native` |
| Maps | `react-native-webview` (Google Maps) |
| Media | `react-native-image-picker` + Cloudinary |
| Icons | `lucide-react-native`, `react-native-svg` |
| Testing | Jest + React Test Renderer |

---

## Project Structure

```
src/
├── biker/                  # Biker app (role: 'biker') — fully isolated
│   ├── features/           #   home · orders · reviews · profile
│   └── navigation/         #   AppNavigator (bottom tabs)
├── partner/                # Partner/Manager app (role: 'admin') — fully isolated
│   ├── features/           #   dashboard · orders · operations · profile
│   └── navigation/         #   PartnerNavigator (bottom tabs)
├── features/auth/          # Shared login / OTP flow
├── shared/                 # Used by both apps
│   ├── components/         #   MapContainer, StatusTracker, …
│   ├── constants/          #   colors, order statuses
│   ├── context/            #   ThemeContext
│   ├── i18n/               #   I18nContext + locales (ar, en, hi)
│   └── types/              #   JSDoc typedefs
├── services/               # API clients (auth, biker, partner, orders, notifications, cloudinary, …)
└── store/                  # Zustand stores (auth, app, orders)
```

> **Isolation rule:** the `biker` and `partner` apps share **no** screens or navigators — only
> everything under `src/shared/`. New biker screens go in `src/biker/features/<feature>/`; new
> partner screens go in `src/partner/features/<feature>/`.

Entry point: `index.js` → `App.tsx`, which routes by role after login.

---

## Getting Started

### Prerequisites
- **Node.js ≥ 18**
- React Native development environment — follow the official
  [Set Up Your Environment](https://reactnative.dev/docs/set-up-your-environment) guide.
- **Android:** Android Studio, JDK 17, Android SDK (minSdk 24 / compileSdk 35).
- **iOS:** Xcode + CocoaPods (Ruby `bundler` is included via the `Gemfile`).

### 1. Install dependencies

```bash
npm install

# iOS only — install native pods
bundle install
bundle exec pod install --project-directory=ios
```

### 2. Configure environment

App configuration currently lives in `src/config.js` (API base URL, Google Maps key).
See [`.env.example`](.env.example) for the full list of values to provide:

```
PROD_BASE_URL / DEV_BASE_URL    # Swivo backend API
GOOGLE_MAPS_API_KEY             # Google Cloud → Maps
CLOUDINARY_CLOUD_NAME           # image uploads
CLOUDINARY_UPLOAD_PRESET
```

> Firebase config files (`google-services.json` for Android, `GoogleService-Info.plist` for iOS)
> are required for push notifications — see [`FIREBASE_NOTIFICATIONS.md`](FIREBASE_NOTIFICATIONS.md).

### 3. Run the app

```bash
# Start the Metro bundler
npm start

# In a second terminal:
npm run android      # build & launch on Android
npm run ios          # build & launch on iOS
```

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start the Metro bundler |
| `npm run android` | Build and run on an Android device/emulator |
| `npm run ios` | Build and run on an iOS device/simulator |
| `npm run lint` | Run ESLint |
| `npm test` | Run the Jest test suite |

---

## Internationalization

Translations live in `src/shared/i18n/locales/` (`ar.json`, `en.json`, `hi.json`) and are consumed
through `I18nContext`. Arabic renders right-to-left automatically. Add new strings to **all** locale
files to keep them in sync.

---

## Push Notifications

Real-time order alerts are delivered through Firebase Cloud Messaging and surfaced with Notifee,
including full-screen intents for incoming orders. Full setup instructions — including required
Firebase project files and Android notification channels — are documented in
[`FIREBASE_NOTIFICATIONS.md`](FIREBASE_NOTIFICATIONS.md).

---

## Testing

```bash
npm test
```

Tests use Jest with React Test Renderer; mocks live in `__mocks__/` and `jest.setup.js`.
See [`docs/TESTING.md`](docs/TESTING.md) for the testing strategy.

---

## Documentation

Additional reference material lives in the [`docs/`](docs/) directory:

| Document | Contents |
|----------|----------|
| [`docs/API_ENDPOINTS.md`](docs/API_ENDPOINTS.md) | Backend API endpoints used by the app |
| [`docs/TESTING.md`](docs/TESTING.md) | Testing approach and conventions |
| [`docs/NAVIGATION_TESTS.md`](docs/NAVIGATION_TESTS.md) | Navigation test coverage |
| [`docs/PERFORMANCE_AUDIT.md`](docs/PERFORMANCE_AUDIT.md) | Performance findings |
| [`docs/uiComponents.md`](docs/uiComponents.md) | Shared UI component catalogue |
| [`FIREBASE_NOTIFICATIONS.md`](FIREBASE_NOTIFICATIONS.md) | Push-notification setup |

---

## License

Proprietary — © Swivo. All rights reserved.
