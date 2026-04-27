# 05 — Notifications & Reviews Screens

---

## 5.1 NotificationsScreen

### الوصف
قائمة إشعارات البايكر (طلبات جديدة، ترقيات، عروض، نظام). مع دعم تمييز "مقروء / غير مقروء".

### التصميم
```
┌──────────────────────────────────────┐
│  Header: "الإشعارات"     [كل مقروء] │  ← زر "تحديد الكل كمقروء" (اختياري)
│                                      │
│  ── اليوم ──────────────────────    │
│  ┌─────────────────────────────────┐ │
│  │ [NotificationCard — غير مقروء] │ │  ← خلفية أزرق فاتح
│  └─────────────────────────────────┘ │
│  ┌─────────────────────────────────┐ │
│  │ [NotificationCard — مقروء]     │ │  ← خلفية عادية
│  └─────────────────────────────────┘ │
│                                      │
│  ── الأمس ──────────────────────    │
│  ┌─────────────────────────────────┐ │
│  │ [NotificationCard]              │ │
│  └─────────────────────────────────┘ │
│                                      │
│  [تحميل المزيد]                      │
│  (Empty: "لا توجد إشعارات")          │
└──────────────────────────────────────┘
```

### NotificationCard
```
┌──────────────────────────────────────────┐
│  🔵  ●  [أيقونة النوع]                   │  ← ● = غير مقروء
│                                          │
│  📦 طلب جديد مُسند إليك                  │  ← title
│  تم تعيين طلب #ORD-1234 إليك، انطلق الآن │  ← body text
│  منذ 5 دقائق                             │  ← timestamp relative
└──────────────────────────────────────────┘
```

أنواع الإشعارات وأيقوناتها:
| النوع | الأيقونة | اللون |
|---|---|---|
| order | 📦 | primary أزرق |
| promo | 🎁 | أخضر |
| system | ⚙️ | رمادي |
| voucher | 🏷️ | بنفسجي |
| general | 🔔 | أزرق فاتح |

عند الضغط على إشعار:
- نوع `order` → انتقل لـ `OrderDetailsScreen` بـ `orderId`
- باقي الأنواع → افتح `NotificationDetailScreen` أو Modal

---

## API Endpoints — NotificationsScreen

### 1. جلب الإشعارات (مع pagination)
```
GET /api/biker/notification?page=1&limit=20

Response:
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "title": "طلب جديد مُسند إليك",
      "body": "تم تعيين طلب #ORD-1234 إليك",
      "type": "order",
      "isRead": false,
      "data": {
        "orderId": "..."     ← لإشعارات الطلبات
      },
      "createdAt": "2026-04-27T10:25:00.000Z"
    }
  ],
  "total": 14,
  "page": 1,
  "pages": 1,
  "hasNext": false
}
```

### 2. تمييز إشعار كمقروء
```
PUT /api/biker/notification/read/:id

Response:
{ "success": true }
```
> استدعِ هذا عند:
> - الضغط على أي إشعار
> - أو عند دخول الشاشة (اختياري: تمييز الأول N كمقروء)

### 3. جلب إشعار واحد
```
GET /api/biker/notification/:id

Response:
{
  "success": true,
  "data": { ...notification }
}
```

---

## Push Notifications (Firebase FCM)

الـ token يُرسل للـ backend عند تسجيل الدخول:
```js
// بعد Login
const fcmToken = await messaging().getToken()
// أرسله مع profile update أو نقطة مخصصة
PUT /api/biker/profile
Body: { "fcmToken": fcmToken }
```

عند استلام notification في الخلفية → React Native Firebase تعرضه تلقائياً.
عند الضغط على الـ notification → navigate حسب `data.type` و `data.orderId`.

---

## 5.2 ReviewsScreen

### الوصف
عرض التقييمات الواردة من العملاء للبايكر مع التقييم ونجوم وتعليق.

### التصميم
```
┌──────────────────────────────────────┐
│  ← Header: "تقييماتي"               │
│                                      │
│  ── ملخص التقييم ───────────────    │
│  ┌──────────────────────────────┐    │
│  │  ⭐ 4.7 / 5.0                │    │  ← تقييم متوسط
│  │  ★★★★☆                      │    │  ← نجوم
│  │  58 تقييم                   │    │
│  └──────────────────────────────┘    │
│                                      │
│  ── قائمة التقييمات ────────────    │
│  ┌─────────────────────────────────┐ │
│  │ [ReviewCard]                    │ │
│  └─────────────────────────────────┘ │
│  ┌─────────────────────────────────┐ │
│  │ [ReviewCard]                    │ │
│  └─────────────────────────────────┘ │
│  ...                                 │
│  [تحميل المزيد]                      │
└──────────────────────────────────────┘
```

### ReviewCard
```
┌──────────────────────────────────────────┐
│  👤 سعد أحمد          ⭐ ★★★★★  5/5     │
│  ─────────────────────────────────────── │
│  "خدمة ممتازة، سريع ونظيف جداً"          │  ← comment
│  ─────────────────────────────────────── │
│  🚗 Toyota Camry — #ORD-1234             │  ← order reference
│  🕐 25 أبريل 2026                        │
└──────────────────────────────────────────┘
```

إذا كان للتقييم صور (review images):
```
┌─────┐ ┌─────┐
│ img │ │ img │  ← صور صغيرة قابلة للتكبير
└─────┘ └─────┘
```

---

## API Endpoints — ReviewsScreen

### 1. جلب تقييمات البايكر (مع pagination)
```
GET /api/biker/review?page=1&limit=20

Response:
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "rating": 5,
      "description": "خدمة ممتازة، سريع ونظيف",
      "user": {
        "firstName": "سعد",
        "lastName": "أحمد",
        "image": "..."
      },
      "order": {
        "_id": "...",
        "orderNumber": "ORD-1234",
        "car": { "brand": "Toyota", "model": "Camry" }
      },
      "service": { "name": "غسيل كامل" },
      "images": [
        { "url": "https://res.cloudinary.com/..." }
      ],
      "createdAt": "2026-04-25T14:00:00.000Z"
    }
  ],
  "total": 58,
  "page": 1,
  "pages": 3,
  "hasNext": true
}
```

### 2. جلب تقييم واحد (للـ Detail View)
```
GET /api/biker/review/:id

Response:
{
  "success": true,
  "data": { ...review }
}
```

---

## Rating Summary

التقييم المتوسط يُحسب من الـ profile endpoint:
```
GET /api/biker/profile

Response يتضمن:
{
  "rating": 4.7,
  "totalReviews": 58
}
```
اعرض هذه القيم في الـ summary card في أعلى الشاشة.

---

## ملاحظات التصميم

**Notifications:**
- عند دخول الشاشة: سجّل timestamp الزيارة لمسح الـ badge count
- Badge عدد الإشعارات: يُخزن في Zustand ويُصفَّر عند فتح الشاشة
- Swipe to dismiss (اختياري): يُمكن تمييز كمقروء بالـ swipe يميناً

**Reviews:**
- Empty state: "لم تحصل على تقييمات بعد" مع أيقونة نجمة
- نجوم التقييم: مكوّن `StarRating` مخصص (لا تستخدم مكتبة ثقيلة)
- الصور: `FlatList` أفقية صغيرة داخل الـ card، قابلة للضغط للتكبير (ImageViewer modal)
