# Swivo Biker App — React Native Design Spec

## نظرة عامة

تطبيق **Swivo Biker** هو تطبيق React Native CLI خاص بالبايكر (مزود الخدمة) في منصة غسيل السيارات.

---

## Stack المقترح

```
React Native CLI (not Expo)
React Navigation v6 (Stack + Bottom Tabs)
Axios — HTTP client
AsyncStorage — token persistence
React Query (TanStack) — server state / caching
Zustand — light global state (auth, theme)
react-native-image-picker — photo upload
react-native-maps (اختياري للمستقبل)
react-native-push-notification أو Firebase Messaging — push notifications
i18next + react-i18next — العربية/الإنجليزية
```

---

## Base URL

```
https://<domain>/api/biker
```

كل request يحمل:
```
Authorization: Bearer <jwt_token>
Content-Type: application/json   (أو multipart/form-data عند رفع صور)
```

---

## هيكل الشاشات (Navigation Tree)

```
Root
├── AuthStack
│   ├── SplashScreen
│   └── LoginScreen
│
└── AppTabs (Bottom Tab Navigator) — بعد تسجيل الدخول
    ├── Tab: Home           → HomeScreen
    ├── Tab: Orders         → OrdersStack
    │   ├── OrdersListScreen
    │   └── OrderDetailsScreen
    │       └── (modals داخلها: CompletionModal, CancelModal)
    ├── Tab: Notifications  → NotificationsScreen
    └── Tab: Profile        → ProfileStack
        ├── SettingsMenuScreen
        ├── EditProfileScreen
        ├── WalletScreen
        │   └── TransactionsScreen (أو Tab داخل Wallet)
        ├── ReviewsScreen
        ├── ReportsListScreen
        │   ├── CreateReportScreen
        │   └── ReportDetailScreen
        └── PoliciesScreen
```

---

## ألوان مقترحة (يمكن تعديلها حسب Brand)

| Token | Value |
|---|---|
| primary | #1B7BF5 (أزرق Swivo) |
| primaryDark | #1460C7 |
| success | #22C55E |
| warning | #F59E0B |
| danger | #EF4444 |
| bg | #F8FAFC |
| card | #FFFFFF |
| textPrimary | #0F172A |
| textSecondary | #64748B |
| border | #E2E8F0 |
| tabBar | #FFFFFF |

---

## الملفات التالية

| ملف | المحتوى |
|---|---|
| `01_auth_screens.md` | Splash + Login |
| `02_home_screen.md` | الشاشة الرئيسية |
| `03_orders_screens.md` | قائمة الطلبات + تفاصيل الطلب + تقدم الحالة |
| `04_wallet_screens.md` | المحفظة + المعاملات + الرصيد |
| `05_notifications_screen.md` | الإشعارات |
| `06_reviews_screen.md` | التقييمات |
| `07_profile_settings_screens.md` | الإعدادات + تعديل الملف الشخصي + التقارير + السياسات |
