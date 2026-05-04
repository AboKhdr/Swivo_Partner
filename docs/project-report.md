# تقرير المشروع التقني — تمام
**React Native Developer Report**
**التاريخ:** 2026-05-04 | **الإصدار:** 0.0.1

---

## 1. نظرة عامة

تطبيق **تمام** هو منصة لإدارة خدمات غسيل السيارات في السوق السعودي. يتضمن تطبيقين مستقلين في مشروع واحد:

| التطبيق | الدور | نقطة الدخول |
|---|---|---|
| **بايكر** | موظف التوصيل والتنفيذ | `src/biker/` |
| **بارتنر** | صاحب المغسلة / المدير | `src/partner/` |

يتشارك الاثنان: Theme، i18n، Auth، وبعض المكونات من `src/shared/`.

---

## 2. Stack التقني

| الطبقة | التقنية | الإصدار |
|---|---|---|
| Framework | React Native CLI | 0.76.9 |
| Language | JavaScript (JS) + TypeScript (App.tsx فقط) | TS 5.0.4 |
| Engine | Hermes | مفعّل |
| Architecture | New Architecture (Fabric + TurboModules) | مفعّل |
| Navigation | @react-navigation/native-stack | 7.14.12 |
| Icons | lucide-react-native | 1.11.0 |
| Storage | @react-native-async-storage | 2.1.0 |
| SVG | react-native-svg | 15.11.2 |
| Safe Area | react-native-safe-area-context | 5.7.0 |
| Screens | react-native-screens | 4.4.0 |

**ما هو غير موجود (مخطط):** HTTP Client، State Management، Push Notifications، Maps

---

## 3. بنية الملفات

```
src/
├── biker/                  ← تطبيق البايكر (17 ملف)
│   ├── features/
│   │   ├── home/           ← HomeScreen, NotificationsScreen, OrderCard
│   │   ├── orders/         ← OrdersNavigator, OrdersScreen, OrderDetailsScreen, OrderMapScreen, OrderListCard
│   │   ├── reviews/        ← ReviewsScreen
│   │   └── profile/        ← ProfileNavigator + 5 شاشات فرعية
│   └── navigation/
│       └── AppNavigator.js ← Bottom tabs يدوي (96 سطر)
│
├── partner/                ← تطبيق البارتنر (27 ملف)
│   ├── features/
│   │   ├── dashboard/      ← DashboardScreen, NotificationsScreen
│   │   ├── orders/         ← OrdersNavigator, OrdersScreen, OrderDetailsScreen,
│   │   │                     IncomingOrderScreen, AssignBikerScreen, SkipReviewScreen
│   │   ├── operations/     ← OperationsNavigator + 9 شاشات (Services, Packages, Bikers,
│   │   │                     Staff, Branches, Payments, Reviews, Offers, SkipReview)
│   │   └── profile/        ← PartnerProfileNavigator + 4 شاشات فرعية
│   └── navigation/
│       └── PartnerNavigator.js ← Bottom tabs يدوي (138 سطر)
│
├── features/
│   └── auth/               ← LoginScreen.js + OtpScreen.js (مشترك)
│
└── shared/                 ← مشترك بين البايكر والبارتنر (13 ملف)
    ├── components/         ← DeleteConfirmModal, ImagePickerField, MapContainer,
    │                         SelectField, StatusTracker, SplashScreen, LanguageScreen
    ├── constants/          ← colors.js, status.js
    ├── context/            ← ThemeContext.js
    ├── data/               ← mockData.js
    ├── i18n/               ← I18nContext.js + ar.json, en.json, hi.json
    └── types/              ← JSDoc typedefs
```

**إجمالي:** 59 ملف JavaScript

---

## 4. المعمارية

### 4.1 نظام الـ Navigation

Navigation يدوي بالكامل — bottom tabs مبنية بـ `useState` + `display:'none'` بدلاً من `@react-navigation/bottom-tabs`.

**السبب:** تخفيف الحجم + تحكم كامل في behavior الـ tabs.

```
App.tsx
├── I18nProvider
│   └── ThemeProvider
│       ├── LoginScreen (role === null)
│       ├── AppNavigator (role === 'biker')
│       │   ├── [Tab] HomeScreen
│       │   ├── [Tab] OrdersNavigator → OrdersScreen → OrderDetailsScreen → OrderMapScreen
│       │   ├── [Tab] ReviewsScreen
│       │   └── [Tab] ProfileNavigator → ProfileScreen → [5 sub-screens]
│       └── PartnerNavigator (role === 'manager')
│           ├── [Tab] DashboardScreen
│           ├── [Tab] OrdersNavigator → OrdersScreen → OrderDetailsScreen
│           ├── [Tab] OperationsNavigator → [9 screens]
│           └── [Tab] PartnerProfileNavigator → [5 screens]
```

**Lazy Loading:** كل tab يُحمَّل عند أول زيارة فقط (mounted map pattern). الـ operations tab يُتلف من الذاكرة عند المغادرة.

### 4.2 نظام الـ Theme

`ThemeContext.js` يوفر `{isDark, colors, toggleTheme}` عبر `useTheme()`.

- يحفظ الاختيار في AsyncStorage
- يدعم Light/Dark mode
- جميع الشاشات تستخدم `colors.xxx` بدلاً من قيم ثابتة

### 4.3 نظام الـ i18n

`I18nContext.js` يوفر `{lang, setLang, t, isRTL}` عبر `useI18n()`.

- 3 لغات: عربي (ar) ← افتراضي، إنجليزي (en)، هندي (hi)
- يحفظ اللغة في AsyncStorage
- RTL تلقائي: `App.tsx` يضع `direction: isRTL ? 'rtl' : 'ltr'` على الـ root View
- **قاعدة:** لا يوجد نص مكتوب مباشرة في الشاشات — كل النصوص عبر `t('key')`

### 4.4 نمط Inline Screens

بعض الشاشات لا تكون navigator screens بل تُعرض **داخل الشاشة الأم** عبر `useState`:

```js
// DashboardScreen — IncomingOrderScreen يظهر فوق الـ dashboard مباشرة
{showIncoming && <IncomingOrderScreen onAccept={...} onReject={...} />}

// OrderDetailsScreen — AssignBikerScreen يظهر inline
{showAssign && <AssignBikerScreen onAssign={...} onBack={...} />}
```

**السبب:** ربط وثيق بـ state الطلب دون الحاجة لتمرير بيانات عبر navigator params.

### 4.5 Order Status Flow

```
PENDING_PAYMENT → AUTHORIZING → AUTHORIZED → PENDING_PARTNER
                                                    ↓ reject/auto-timeout
                                              ACCEPTED
                                                    ↓ assign biker
                                              ASSIGNED → ON_THE_WAY → ARRIVED → STARTED → COMPLETED
```

**البايكر يرى:** ASSIGNED → ON_THE_WAY → ARRIVED → STARTED → COMPLETED

**IncomingOrderScreen:** countdown 60 ثانية، عند انتهائه `onReject('AUTO_TIMEOUT')` تلقائياً.

---

## 5. حالة كل Feature

| الميزة | الحالة | الملاحظات |
|---|---|---|
| Auth (Login + OTP) | ✅ UI كامل | API مُحاكى بـ setTimeout |
| Dashboard (بارتنر) | ✅ UI كامل | بيانات وهمية |
| Incoming Order | ✅ كامل مع countdown | trigger يدوي (MOCK_INCOMING) |
| Orders List + Filter | ✅ كامل | فلترة بالحالة |
| Order Details | ✅ كامل | AssignBiker inline |
| SwipeButton | ✅ PanResponder كامل | يغير الحالة locally |
| StatusTracker | ✅ animated | 5 خطوات مع pulse |
| Camera Upload | ✅ UI + permissions | API غير مربوط |
| Operations Menu | ✅ كامل | 9 screens |
| Services/Packages | ✅ CRUD local | بيانات وهمية |
| Staff/Bikers | ✅ عرض | duty toggle local |
| Branches | ✅ عرض + تعديل | ساعات العمل |
| Offers | ✅ CRUD local | S/M/L pricing |
| Payments | ✅ عرض | بيانات وهمية |
| Profile (بايكر) | ✅ كامل | wallet, language, support |
| Profile (بارتنر) | ✅ كامل | إعدادات كاملة |
| Reviews | ✅ عرض | mock reviews |
| Dark Mode | ✅ مفعّل | persist AsyncStorage |
| RTL (عربي) | ✅ كامل | direction على root |
| Map | ❌ Placeholder | react-native-webview غير مثبّت |
| Push Notifications | ❌ لم يبدأ | MOCK_INCOMING يدوي |
| API Layer | ❌ لم يبدأ | لا يوجد src/services/ |
| State Management | ❌ لم يبدأ | لا Zustand/Redux |

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
| Proguard | ❌ معطّل |
| ABI Splits | ❌ معطّل (universal APK) |
| Signing (Release) | ❌ debug keystore |
| NDK | 26.1.10909125 |
| ABIs | armeabi-v7a, arm64-v8a, x86, x86_64 |

**Permissions في AndroidManifest:**
- `INTERNET`
- `VIBRATE`
- `CAMERA`
- `READ_EXTERNAL_STORAGE`
- `WRITE_EXTERNAL_STORAGE`
- `READ_MEDIA_IMAGES`

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

**ملاحظة:** كلها PNG غير محسّنة — تحويلها لـ WebP يوفر ~1 MB.

---

## 8. توقع حجم الـ APK

| السيناريو | الحجم المتوقع |
|---|---|
| Debug (حالي) | ~130 MB |
| Release بدون تحسين | ~18–22 MB |
| Release + Proguard + shrinkResources | ~12–14 MB |
| Release + ABI Split (arm64 فقط) | ~8–10 MB |
| Release + كل التحسينات + WebP | ~6–8 MB |

---

## 9. الديون التقنية (Technical Debt)

### عالي الأولوية
| المشكلة | التأثير | الحل |
|---|---|---|
| لا يوجد API layer | التطبيق غير قابل للإنتاج | إنشاء `src/services/` مع fetch + AbortController |
| Release signing بـ debug keystore | خطر أمني | إنشاء production keystore |
| Proguard معطّل | حجم كبير + no obfuscation | تفعيل `minifyEnabled true` |
| `MOCK_INCOMING` ثابت في الكود | IncomingOrder لا يعمل real-time | ربط Push Notifications |

### متوسط الأولوية
| المشكلة | التأثير | الحل |
|---|---|---|
| صور PNG غير محسّنة (~1.34MB) | حجم APK أكبر | تحويل لـ WebP |
| ABI Splits معطّلة | APK universal ثقيل | تفعيل splits في build.gradle |
| MapContainer placeholder | الخريطة لا تعمل | تثبيت react-native-webview |
| Camera مكتوبة بدون API | الصور لا تُرفع | ربط upload endpoint |
| `nativewind` مثبّت غير مستخدم | ~300KB زائد | `npm uninstall nativewind` |

### منخفض الأولوية
| المشكلة | التأثير | الحل |
|---|---|---|
| لا يوجد src/services/ أو src/store/ | scalability | تهيئة service layer |
| Mock data مبعثرة في الشاشات | صعوبة الاستبدال بـ API | تمركز في src/shared/data/ |
| TypeScript جزئي (App.tsx فقط) | type safety محدود | تحويل تدريجي لـ .tsx |

---

## 10. خطة ما تبقى قبل الإنتاج

```
المرحلة 1 — API Layer (أسبوعان)
├── إنشاء src/services/api.js (base fetch + auth headers)
├── src/services/auth.js  — login, OTP verify, refresh token
├── src/services/orders.js — list, details, status update
├── src/services/biker.js  — profile, wallet, reviews
└── src/services/partner.js — dashboard stats, operations CRUD

المرحلة 2 — Real-time (أسبوع)
├── Push Notifications (Firebase FCM)
└── IncomingOrder عبر notification بدلاً من MOCK

المرحلة 3 — Maps (أسبوع)
├── تثبيت react-native-webview
└── تفعيل MapContainer بـ Google Maps embed

المرحلة 4 — Build & Release (يومان)
├── Production keystore
├── تفعيل Proguard
├── تفعيل ABI Splits
├── تحويل صور PNG → WebP
└── إعداد CI/CD pipeline
```

---

## 11. ملخص تنفيذي

المشروع في حالة **UI مكتمل** — كل الشاشات والتدفقات مبنية ومصممة. الجزء الغائب هو الـ **backend integration** بالكامل.

**النقاط الإيجابية:**
- بنية معمارية نظيفة وفصل واضح بين تطبيقي البايكر والبارتنر
- دعم كامل للغة العربية وRTL والوضع الليلي
- Hermes مفعّل والـ New Architecture جاهزة
- كود منظم ومتسق بدون تبعيات زائدة

**الخلاصة:** جاهز للربط بالـ backend مباشرة. لا يحتاج إعادة هيكلة — يحتاج فقط إنشاء service layer وربط الـ API endpoints الموجودة كـ placeholders في الكود.
