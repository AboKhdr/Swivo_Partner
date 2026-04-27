# 02 — Home Screen

---

## الوصف العام
الشاشة الرئيسية للبايكر بعد تسجيل الدخول. تعرض:
- ملخص المحفظة (الرصيد الحالي)
- اختيار الفرع/المنطقة النشطة
- الطلبات النشطة المسندة إليه
- آخر الإشعارات (badge عدد غير مقروء)

---

## التصميم

```
┌─────────────────────────────────────┐
│  Header                             │
│  ┌─────────────────────────────┐    │
│  │ مرحباً، [اسم البايكر] 👋    │    │  ← greeting باسم المستخدم
│  │ [أيقونة الإشعار 🔔] [badge] │    │  ← أيقونة تفتح NotificationsScreen
│  └─────────────────────────────┘    │
│                                     │
│  ── Wallet Card ──────────────────  │
│  ┌─────────────────────────────┐    │
│  │  رصيدك الحالي               │    │
│  │  ﷼ 1,250.00                 │    │  ← balance بخط كبير
│  │  [عرض المحفظة →]            │    │  ← navigate to WalletScreen
│  └─────────────────────────────┘    │
│                                     │
│  ── Branch Selector ─────────────  │
│  ┌─────────────────────────────┐    │
│  │  📍 اختر فرعك / منطقتك ▾    │    │  ← Dropdown / BottomSheet picker
│  └─────────────────────────────┘    │
│                                     │
│  ── Active Orders ───────────────  │
│  "طلباتك النشطة" [count]            │  ← section title
│                                     │
│  ┌──────────────────────────────┐   │
│  │ [OrderCard] ← swipeable      │   │  ← FlatList أفقي (horizontal)
│  │ [OrderCard]                  │   │
│  └──────────────────────────────┘   │
│  (فارغة: "لا توجد طلبات نشطة الآن") │
│                                     │
└─────────────────────────────────────┘

Bottom Tab Bar: [Home] [Orders] [Notifications] [Profile]
```

---

## المكونات الداخلية

### WalletCard
```
┌──────────────────────────────────────┐
│  🏦 رصيدك                            │
│  ﷼ 1,250.00          [SAR]           │
│                                      │
│  ────────────────────────────────    │
│  أرباح هذا الشهر    ﷼ 850.00         │
│  أرباح هذا الأسبوع  ﷼ 320.00         │
│                                      │
│  [ عرض المحفظة كاملاً ]              │
└──────────────────────────────────────┘
```

### OrderCard (Horizontal Scroll)
```
┌──────────────────────────────────┐
│  #ORD-1234                 [status badge] │
│  Toyota Camry — أبيض               │
│  📍 الرياض - حي النزهة              │
│  🕐 10:30 ص                        │
│  ← اضغط للتفاصيل →                 │
└──────────────────────────────────┘
```

- اللون الخلفي لـ badge الحالة:
  - `ASSIGNED` → برتقالي `#F59E0B`
  - `ON_THE_WAY` → أزرق `#3B82F6`
  - `STARTED` → بنفسجي `#8B5CF6`

### Branch Dropdown (BottomSheet)
```
┌─────── اختر المنطقة ──────────┐
│  ○  الفرع الرئيسي — الرياض    │
│  ○  فرع العليا                 │
│  ● فرع النزهة (محدد)           │
│  ─────────────────────────    │
│  [ تأكيد ]                     │
└───────────────────────────────┘
```

---

## API Calls

### 1. جلب معلومات البايكر + رصيد المحفظة
```
GET /api/biker/profile

Response:
{
  "success": true,
  "data": {
    "_id": "...",
    "firstName": "أحمد",
    "lastName": "محمد",
    "phoneNumber": "05xxxxxxxx",
    "email": "...",
    "image": "https://res.cloudinary.com/...",
    "rating": 4.7,
    "totalReviews": 58,
    "wallet": {
      "balance": 1250.00,
      "currency": "SAR"
    }
  }
}
```

### 2. جلب الطلبات النشطة
```
GET /api/biker/order?status=active&page=1&limit=10

Response:
{
  "success": true,
  "data": [...orders],
  "total": 3,
  "page": 1,
  "pages": 1,
  "hasNext": false,
  "hasPrev": false
}

كل order تحتوي على:
{
  "_id": "...",
  "orderNumber": "ORD-1234",
  "status": "ASSIGNED",          // ASSIGNED | ON_THE_WAY | STARTED
  "car": {
    "brand": "Toyota",
    "model": "Camry",
    "color": "أبيض",
    "plateNumber": "ABC 1234"
  },
  "address": "الرياض - حي النزهة",
  "scheduledAt": "2026-04-27T10:30:00.000Z",
  "service": { "name": "غسيل كامل" },
  "client": { "firstName": "سعد", "phoneNumber": "..." }
}
```

### 3. جلب الفروع/المناطق المسند إليها
```
GET /api/biker/branch?page=1&limit=50

Response:
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "name": "فرع النزهة",
      "city": "RIYADH"
    }
  ]
}
```

### 4. جلب عدد الإشعارات غير المقروءة (للـ badge)
```
GET /api/biker/notification?page=1&limit=1

Response headers أو في body:
{
  "total": 12,      ← استخدم هذا لحساب الغير مقروء
  "data": [...]
}
```
> **ملاحظة:** لا يوجد endpoint مخصص لعدد الغير مقروء، جلب أول صفحة واستخدام `total` كافٍ للـ badge، أو خزّن الـ total في Zustand.

---

## State Management

```js
// Zustand store: useAuthStore
{
  user: { _id, firstName, lastName, image, rating },
  token: 'JWT...',
  setUser, setToken, logout
}

// React Query keys
['biker-profile']         → GET /api/biker/profile
['biker-orders-active']   → GET /api/biker/order?status=active
['biker-branches']        → GET /api/biker/branch
['biker-notifications']   → GET /api/biker/notification
```

---

## Behavior Notes

- عند فتح الشاشة (onFocus): أعد جلب الطلبات النشطة (refetchOnWindowFocus)
- أيقونة الإشعار: إذا badge > 0 اعرض نقطة حمراء أو رقم فوق الأيقونة
- Empty state للطلبات: صورة placeholder + نص "لا توجد طلبات نشطة"
- Pull to refresh على الـ ScrollView الرئيسي
