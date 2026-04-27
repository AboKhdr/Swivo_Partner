# 01 — Auth Screens: Splash + Login

---

## 1.1 SplashScreen

### الوصف
أول شاشة تظهر عند فتح التطبيق. تتحقق من وجود token مخزن وتوجه المستخدم.

### التصميم
```
┌─────────────────────────────┐
│                             │
│                             │
│        [LOGO Swivo]         │  ← صورة/SVG وسط الشاشة
│                             │
│     "Biker Partner App"     │  ← نص صغير تحت اللوجو
│                             │
│      [Loading Spinner]      │  ← ActivityIndicator بلون primary
│                             │
└─────────────────────────────┘
```

### السلوك
1. عند Mount: تحقق من `AsyncStorage.getItem('biker_token')`
2. إذا وُجد token صالح → انتقل فوراً لـ `AppTabs` (HomeScreen)
3. إذا لم يوجد → انتقل لـ `LoginScreen`
4. مدة العرض: 1.5 ثانية كحد أدنى (لضمان انتهاء التحقق)

### لا يوجد API call هنا
التحقق من Token يتم محلياً عبر AsyncStorage فقط.

---

## 1.2 LoginScreen

### الوصف
شاشة تسجيل الدخول للبايكر باستخدام رقم الهاتف + كلمة المرور (Credentials Login عبر NextAuth).

### التصميم
```
┌─────────────────────────────┐
│                             │
│        [LOGO Swivo]         │
│                             │
│   مرحباً بك في Swivo Biker   │  ← عنوان H2
│   سجل دخولك للمتابعة        │  ← subtitle textSecondary
│                             │
│  ┌───────────────────────┐  │
│  │  رقم الهاتف / البريد  │  │  ← TextInput, keyboardType="phone-pad"
│  └───────────────────────┘  │
│                             │
│  ┌───────────────────────┐  │
│  │  كلمة المرور      👁  │  │  ← TextInput, secureTextEntry + toggle
│  └───────────────────────┘  │
│                             │
│  ┌───────────────────────┐  │
│  │    تسجيل الدخول       │  │  ← Button primary, full-width
│  └───────────────────────┘  │
│                             │
│   [ActivityIndicator]       │  ← يظهر أثناء الطلب فقط
│                             │
│   رسالة خطأ (إن وجدت)       │  ← نص أحمر تحت الزر
│                             │
└─────────────────────────────┘
```

### API Endpoint
```
POST /api/auth/[...nextauth]
أو مباشرة عبر NextAuth credentials endpoint

Body:
{
  "username": "phone_or_email",
  "password": "password"
}

Response (success):
{
  "token": "JWT_TOKEN_STRING",
  "user": {
    "_id": "...",
    "firstName": "...",
    "lastName": "...",
    "role": "biker",
    "tenantId": "..."
  }
}

Response (error):
{ "error": "رقم الهاتف أو كلمة المرور غير صحيحة" }
```

> **ملاحظة:** التطبيق يستخدم NextAuth في الويب. في React Native، استخدم endpoint مباشر:
> ```
> POST /api/auth/signin/credentials   (أو endpoint مخصص للموبايل)
> ```
> خزّن JWT في AsyncStorage تحت مفتاح `biker_token`.

### السلوك
1. Validate: الحقلان غير فارغين قبل الإرسال
2. عند Success: خزّن token + user → انتقل لـ `HomeScreen` (reset stack)
3. عند Error: اعرض رسالة الخطأ تحت الزر
4. Disable الزر أثناء التحميل (isLoading state)

### State المحلي
```js
{
  username: '',
  password: '',
  showPassword: false,
  isLoading: false,
  error: null
}
```
