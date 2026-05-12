# تقرير المشروع التقني — تمام
**React Native Developer Report**
**التاريخ:** 2026-05-10 | **الإصدار:** 0.0.1

---

## 1. نظرة عامة

تطبيق **تمام** هو منصة لإدارة خدمات غسيل السيارات في السوق السعودي. يتضمن تطبيقين مستقلين في مشروع واحد:

| التطبيق | الدور (`role`) | نقطة الدخول |
|---|---|---|
| **بايكر** | `'biker'` | `src/biker/` |
| **بارتنر** | `'admin'` (يُطبَّع من `'manager' / 'client' / ...`) | `src/partner/` |

يتشارك الاثنان: Theme، i18n، Auth، Firebase/Notifications، وبعض المكونات من `src/shared/`.

---

## 2. Stack التقني

| الطبقة | التقنية | الإصدار |
|---|---|---|
| Framework | React Native CLI | 0.76.9 |
| Language | JavaScript + TypeScript (App.tsx فقط) | TS 5.0.4 |
| Engine | Hermes | مفعّل |
| Architecture | New Architecture (Fabric + TurboModules) | مفعّل |
| Navigation | @react-navigation/native + native-stack | 7.2.2 / 7.14.12 |
| Icons | lucide-react-native | 1.11.0 |
| Storage | @react-native-async-storage | 2.1.0 |
| SVG | react-native-svg | 15.11.2 |
| Safe Area | react-native-safe-area-context | 5.7.0 |
| Screens | react-native-screens | 4.4.0 |
| State | zustand | 5.0.12 |
| HTTP | `fetch` + `AbortController` (custom — `src/services/api.js`) | — |
| Camera/Images | react-native-image-picker | 8.2.1 |
| WebView (Maps) | react-native-webview | 13.16.1 |
| Notifications | @notifee/react-native + @react-native-firebase/messaging | 9.1.8 / 24.0.0 |

**ما تمت إضافته منذ التقرير السابق:** API layer، Zustand store، Firebase/FCM + notifee، Cloudinary uploader، WebView، شاشة OTP، اختبارات Jest.

**ما لا يزال غير موجود:** نظام نشر فعلي (CI/CD)، production keystore، Proguard مفعَّل.

---

## 3. بنية الملفات

```
src/                                ← 73 ملف JS
├── biker/                          ← تطبيق البايكر
│   ├── features/
│   │   ├── home/        ← HomeScreen, NotificationsScreen, components/OrderCard
│   │   ├── orders/      ← OrdersNavigator, OrdersScreen, OrderDetailsScreen,
│   │   │                  OrderMapScreen, components/OrderListCard
│   │   ├── reviews/     ← ReviewsScreen
│   │   └── profile/     ← ProfileNavigator + 5 شاشات فرعية
│   └── navigation/AppNavigator.js  ← bottom tabs يدوي
│
├── partner/                        ← تطبيق البارتنر
│   ├── features/
│   │   ├── dashboard/   ← DashboardScreen, NotificationsScreen
│   │   ├── orders/      ← OrdersNavigator, OrdersScreen, OrderDetailsScreen,
│   │   │                  IncomingOrderScreen, AssignBikerScreen, SkipReviewScreen,
│   │   │                  RejectOrderModal
│   │   ├── operations/  ← OperationsNavigator + Services, AddService, Packages,
│   │   │                  AddPackage, Bikers, AddBiker, BikerDetails, Staff,
│   │   │                  Branches, EditBranch, Offers, Payments, Reviews
│   │   └── profile/     ← PartnerProfileNavigator, PartnerPersonalInfoScreen,
│   │                      Support, Terms
│   └── navigation/PartnerNavigator.js
│
├── features/auth/                  ← LoginScreen, OtpScreen
│
├── services/                       ← ✅ جديد — API layer كامل
│   ├── api.js                ← fetch + AbortController + 401 refresh
│   ├── auth.js               ← login / verifyOTP / resendOTP / logout
│   ├── biker.js              ← biker profile + duty
│   ├── orders.js             ← biker order endpoints
│   ├── partner.js            ← dashboard, tenant orders, staff, services...
│   ├── notifications.js      ← FCM register + list/read
│   ├── notificationChannel.js ← notifee channels + incoming-order loop
│   └── cloudinary.js         ← unsigned upload (preset: tteamdashboard)
│
├── store/                          ← ✅ جديد — Zustand
│   ├── authStore.js          ← user, token, role + hydrate + setSession
│   ├── appStore.js           ← loading, toasts, incomingOrder, autoAccept,
│   │                           unreadCount, pendingNav
│   └── ordersStore.js        ← cached orders للبايكر
│
├── shared/
│   ├── components/   ← MapContainer (WebView), StatusTracker, SplashScreen,
│   │                   DeleteConfirmModal, ImagePickerField, SelectField, LanguageScreen
│   ├── constants/    ← colors.js (Light/Dark), status.js
│   ├── context/      ← ThemeContext.js, FirebaseContext.js
│   ├── data/         ← mockData.js
│   ├── i18n/         ← I18nContext.js + ar.json, en.json, hi.json
│   └── types/        ← JSDoc typedefs
│
├── assets/steps/                   ← 1.png – 5.png (step guides)
└── config.js                       ← BASE_URL1 + GOOGLE_MAPS_API_KEY
```

**`__tests__/`:** 12 ملف اختبار يغطي api، auth، orders، partner، network-integration، ordersStore/authStore/appStore، StatusTracker، I18nContext، status constants، navigation.

---

## 4. المعمارية

### 4.1 Navigation

Navigation يدوي بالكامل — bottom tabs مبنية بـ `useState` + `display:'none'` + lazy mount بدلاً من `@react-navigation/bottom-tabs`.

```
App.tsx
└── ErrorBoundary → I18nProvider → AppRoot
    └── ThemeProvider → FirebaseProvider
        ├── LoginScreen           (role === null)
        ├── BikerNavigator         (role === 'biker')
        │   ├── HomeScreen
        │   ├── OrdersNavigator → OrdersScreen → OrderDetailsScreen → OrderMapScreen
        │   ├── ReviewsScreen
        │   └── ProfileNavigator → ProfileScreen → [5 sub-screens]
        └── PartnerNavigator       (role === 'admin')
            ├── DashboardScreen
            ├── OrdersNavigator → OrdersScreen → OrderDetailsScreen
            ├── OperationsNavigator → [Services / Packages / Bikers / Staff / Branches /
            │                           Offers / Payments / Reviews / SkipReview]
            └── PartnerProfileNavigator → [PersonalInfo, Support, Terms, Language]
```

**ErrorBoundary** على مستوى الجذر يلتقط أي خطأ غير معالج ويعرض شاشة fallback عربية مع زر "إعادة المحاولة".

### 4.2 API Layer (`src/services/`)

- **`api.js`** — `fetch` wrapper بـ `AbortController` (timeout 30s). يضع `Authorization: Bearer <token>` تلقائياً، ويعالج 401 بمحاولة `/auth/refresh`؛ في حال الفشل يستدعي `setUnauthorizedHandler(fn)` المسجَّل في `App.tsx` (ينفّذ `logout`).
- **شكل الاستجابة الموحَّد:** `{success, data, error}`.
- **رفع الصور:** Profile photos تذهب لـ Cloudinary أولاً (unsigned preset `tteamdashboard`)، ثم URL يُحفظ في الـ backend.

### 4.3 State Management (Zustand)

- **`authStore`** — `{user, token, role, isReady}`. `hydrate()` تُستدعى مرة عند الإقلاع. `setSession(token, user)` تحفظ في AsyncStorage وتسجّل FCM token تلقائياً. **الـ role يُطبَّع:** `'biker'` يبقى، أي شيء آخر → `'admin'`. لا يوثَق بـ `user.role` من الـ backend مباشرة.
- **`appStore`** — UI state عام: loading keys، toasts، `incomingOrder`، `autoAccept`، `unreadCount`، `pendingNav` لتوجيه ضغطات الـ notifications.
- **`ordersStore`** — قائمة طلبات البايكر مُخزَّنة محلياً.

### 4.4 Push Notifications (Firebase + Notifee)

- **FCM token flow:** `bootstrap(role)` في `FirebaseContext.js` يجلب التوكن ويستدعي `registerFCMToken(token, role)` → `POST /notifications/register`. يُستدعى أيضاً في `setSession` بعد تسجيل الدخول.
- **Background handler** في `index.js` — رسائل `data-only` (لا تحتوي على `notification` block). إذا `data.type === 'NEW_ORDER'`:
  - يُحفظ الـ payload في AsyncStorage تحت `pending_incoming_order`
  - تظهر notification صوتية عبر channel `incoming_orders_v6` (في `notificationChannel.js`)
  - Loop كل 8 ثوانٍ يُعيد عرض الـ notification (Android يحتاج cancel + redisplay لإعادة تشغيل الصوت)
- **Channels:** قناة `incoming_orders_v6` (sound: `incoming_order`، bypass DnD، fullScreen intent للـ CALL category) وقناة عامة للباقي.
- **iOS critical alerts:** `critical: true, criticalVolume: 1.0` على الـ incoming-order.

### 4.5 Theme & i18n

- **ThemeContext** — `{isDark, colors, toggleTheme}`، يحفظ في AsyncStorage. كل الشاشات تستخدم `colors.xxx`.
- **I18nContext** — `{lang, setLang, t, isRTL}`، 3 لغات (ar / en / hi). RTL تلقائي عبر `direction: isRTL ? 'rtl' : 'ltr'` على الـ root View. `TextInput` على Android يحتاج `textAlign={isRTL ? 'right' : 'left'}` كـ prop مباشر.

### 4.6 Inline Screens Pattern

`IncomingOrderScreen` و `AssignBikerScreen` ليست navigator screens — تُعرض داخل الشاشة الأم عبر `useState` flag محلي. هذا يبقيها مرتبطة بـ context الطلب دون تمرير params.

### 4.7 Order Status Flow

```
PENDING_PAYMENT → AUTHORIZING → AUTHORIZED → PENDING_PARTNER
                                                   ↓ (accept / reject / 60s timeout)
                                              ACCEPTED
                                                   ↓ assign biker
                                              ASSIGNED → ON_THE_WAY → ARRIVED → STARTED → COMPLETED
```

**البايكر يرى:** ASSIGNED → ON_THE_WAY → ARRIVED → STARTED → COMPLETED
**`IncomingOrderScreen`:** countdown 60s، انتهاؤه يستدعي `onReject('AUTO_TIMEOUT')` تلقائياً.

---

## 5. حالة كل Feature

| الميزة | الحالة | الملاحظات |
|---|---|---|
| Auth (Login + OTP) | ✅ متصل بالـ API | `verifyOTP` يعالج كلا شكلَي الاستجابة (`res.data` و `res.data.data`) |
| Push Notifications (FCM) | ✅ كامل | data-only messages + background handler + channels |
| Incoming Order (real-time) | ✅ متصل | عبر FCM `data.type === 'NEW_ORDER'` بدلاً من mock |
| Dashboard (بارتنر) | ✅ متصل | يقرأ من `partner.js` |
| Orders List + Filter | ✅ متصل | فلترة بالحالة |
| Order Details | ✅ متصل | AssignBiker inline |
| SwipeButton | ✅ كامل | `key={currentStatus}` يفرض remount |
| StatusTracker | ✅ animated | 5 خطوات + pulse على الـ active |
| Camera Upload | ✅ متصل | `launchCamera` + Cloudinary unsigned + حفظ URL backend |
| Operations CRUD | ✅ متصل | services / packages / bikers / staff / branches / offers / payments / reviews |
| Skip Review | ✅ كامل | approve / reject من `OperationsNavigator` |
| Profile (بايكر / بارتنر) | ✅ متصل | wallet, language, support, terms, personal info |
| Reviews (بايكر) | ✅ عرض | يقرأ من API |
| Dark Mode | ✅ مفعّل | persist AsyncStorage |
| RTL (عربي) | ✅ كامل | direction على root |
| Map | ✅ متصل | `react-native-webview` مثبَّت + Google Maps via embed |
| ErrorBoundary | ✅ موجود | على مستوى الجذر في App.tsx |
| Tests (Jest) | ✅ 12 test file | services + stores + i18n + navigation + StatusTracker |
| API Layer | ✅ كامل | fetch + AbortController + 401 refresh + uploadImage |
| State Management | ✅ Zustand | 3 stores |

---

## 6. إعدادات Android Build

| الإعداد | القيمة |
|---|---|
| Application ID | `com.partnerappnew` |
| Min SDK | 24 (Android 7.0 Nougat) |
| Target SDK | 34 (Android 14) |
| Compile SDK | 35 |
| Version Code | 1 |
| Version Name | 1.0 |
| Hermes | ✅ مفعّل |
| New Architecture | ✅ مفعّل |
| Proguard | ❌ معطّل (`enableProguardInReleaseBuilds = false`) |
| ABI Filters | ✅ `arm64-v8a` + `x86_64` فقط |
| Signing (Release) | ❌ debug keystore فقط |
| NDK | 26.1.10909125 |
| Google Services Plugin | ✅ مفعَّل (`com.google.gms.google-services`) |

**Permissions في AndroidManifest:**
- `INTERNET`، `VIBRATE`، `CAMERA`
- `READ_EXTERNAL_STORAGE`، `WRITE_EXTERNAL_STORAGE`، `READ_MEDIA_IMAGES`
- `POST_NOTIFICATIONS` (Android 13+)
- `USE_FULL_SCREEN_INTENT` (للـ incoming-order)
- `FileProvider` مُعرَّف لمشاركة الصور من الكاميرا

---

## 7. الأصول (Assets)

| الملف | الحجم | الاستخدام |
|---|---|---|
| steps/1.png | 273 KB | ASSIGNED step guide |
| steps/2.png | 260 KB | ON_THE_WAY step guide |
| steps/3.png | 223 KB | ARRIVED step guide |
| steps/4.png | 223 KB | STARTED step guide |
| steps/5.png | 357 KB | COMPLETED step guide |
| **المجموع** | **~1.34 MB** | OrderDetailsScreen |
| `ic_notification.png` | — | drawable للـ FCM data notifications |

**ملاحظة:** صور الخطوات لا تزال PNG — تحويلها لـ WebP يوفر ~1 MB.

---

## 8. توقع حجم الـ APK

| السيناريو | الحجم المتوقع |
|---|---|
| Debug (حالي) | ~135–145 MB |
| Release بدون تحسين (universal arm64+x86_64) | ~22–26 MB |
| Release + Proguard + shrinkResources | ~14–17 MB |
| Release + ABI Split (arm64 فقط) | ~10–12 MB |
| Release + كل التحسينات + WebP | ~8–10 MB |

> الزيادة عن التقرير السابق سببها Firebase + Notifee + WebView + react-native-image-picker.

---

## 9. الديون التقنية (Technical Debt)

### عالي الأولوية
| المشكلة | التأثير | الحل |
|---|---|---|
| Release signing بـ debug keystore | لا يمكن النشر على Google Play | إنشاء production keystore + signingConfig في build.gradle |
| Proguard معطّل | حجم APK كبير + لا obfuscation | `enableProguardInReleaseBuilds = true` + ضبط `proguard-rules.pro` لـ Firebase/Notifee |
| `BASE_URL` ثابت في `src/config.js` | لا يوجد فصل بين dev / staging / prod | استخدام `.env` + `react-native-config` أو build flavors |
| Cloudinary unsigned preset في الكود | يمكن لأي عميل رفع صور | الانتقال لـ signed uploads عبر backend |
| FCM topic / token rotation | إذا تغيّر التوكن لا يُعاد التسجيل تلقائياً | الاشتراك في `onTokenRefresh` (موجود؟ يحتاج تأكيد) |

### متوسط الأولوية
| المشكلة | التأثير | الحل |
|---|---|---|
| صور PNG غير محسّنة (~1.34MB) | حجم APK أكبر | تحويل لـ WebP |
| ABI x86_64 مُضمَّن مع arm64 | حجم زائد للأجهزة الفعلية | إبقاء arm64-v8a فقط للـ release |
| MapContainer عبر WebView (Google embed) | أداء أقل من native maps | تثبيت `react-native-maps` لاحقاً عند الحاجة |
| لا يوجد crash reporting | الـ ErrorBoundary يلتقط محلياً فقط | إضافة Crashlytics (Firebase موجود) |
| Mock data مبعثرة في بعض شاشات Operations | صعوبة الاستبدال بـ API | تنظيف ما تبقى من `src/shared/data/mockData.js` |
| `nativewind` مثبَّت غير مستخدم (إن وُجد) | ~300KB زائد | التأكد من إزالته من package.json |

### منخفض الأولوية
| المشكلة | التأثير | الحل |
|---|---|---|
| TypeScript جزئي (App.tsx فقط) | type safety محدود | تحويل تدريجي لـ .tsx |
| لا يوجد Storybook / component catalog | مراجعة UI أبطأ | اختياري — Storybook RN |
| تغطية الاختبارات تركّز على services/stores فقط | الشاشات بدون snapshot tests | إضافة RTL component tests |

---

## 10. خطة ما تبقى قبل الإنتاج

```
✅ المرحلة 1 — API Layer                    (مكتملة)
✅ المرحلة 2 — Real-time / Push (FCM)       (مكتملة)
✅ المرحلة 3 — Maps (WebView)                (مكتملة)

⏳ المرحلة 4 — Build & Release  (متبقّية)
   ├── Production keystore + signing config (Android + iOS)
   ├── تفعيل Proguard + shrinkResources وضبط rules
   ├── ABI Split: arm64-v8a فقط للـ Play Store، حذف x86_64
   ├── تحويل صور steps/*.png → WebP
   ├── فصل بيئات (dev / staging / prod) عبر .env أو flavors
   ├── Firebase Crashlytics + Performance
   ├── إعداد Fastlane / GitHub Actions للنشر
   └── Privacy policy + App Store / Play Store listings

⏳ المرحلة 5 — تحسينات بعد الإطلاق  (مرحلية)
   ├── الانتقال من Cloudinary unsigned إلى signed-via-backend
   ├── الانتقال من WebView Maps إلى react-native-maps
   ├── توسيع تغطية اختبارات الشاشات (RTL + snapshots)
   └── i18n: مراجعة hi.json وملء الفجوات
```

---

## 11. ملخص تنفيذي

المشروع تجاوز مرحلة الـ **UI-only** وأصبح **متصلاً بالـ backend بالكامل** — الشاشات تقرأ وتكتب عبر `src/services/`، الحالة العامة تُدار بـ Zustand، Push Notifications real-time مفعَّلة عبر FCM + Notifee، رفع الصور يعمل عبر Cloudinary، والكاميرا متكاملة مع الأذونات.

**النقاط الإيجابية:**
- بنية معمارية نظيفة وفصل تام بين تطبيقَي البايكر والبارتنر
- API layer موحَّد مع 401 auto-refresh و AbortController
- ErrorBoundary على مستوى الجذر + tests للـ services والـ stores
- دعم كامل للعربية وRTL والوضع الليلي
- Hermes + New Architecture + autolinking

**الفجوات المتبقية للإنتاج:**
- Production signing + Proguard + ABI optimization
- فصل بيئات dev/prod
- Crashlytics + monitoring
- Cloudinary signed uploads بدلاً من unsigned

**الخلاصة:** المشروع جاهز وظيفياً. ما تبقى هو **عمل DevOps / Release engineering** (keystore، Proguard، CI/CD، environments) وليس تطوير ميزات.
