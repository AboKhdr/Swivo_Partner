# Biker API Endpoints
> Base URL: `https://<domain>/api`
> كل request يحمل: `Authorization: Bearer <jwt_token>` (ما عدا Auth endpoints)

---

## AUTH HEADER (بعد تسجيل الدخول)
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

---

## 0. AUTH (لا يحتاج token)

### POST /api/auth/generate-otp
إرسال OTP على رقم الهاتف

**Body:**
```json
{
  "prefix": "966",
  "phoneNumber": "5xxxxxxxx",
  "tenantId": "TENANT_OBJECT_ID",
  "fcmToken": "FCM_TOKEN_STRING"
}
```
> - `prefix` — بدون `+` — default: `"966"`
> - `tenantId` — مطلوب للبايكر (staff flow) — يُجلب من إعدادات التطبيق
> - `fcmToken` — اختياري — يُسجَّل مع المستخدم عند الإرسال
> - **Test phone:** أي رقم ينتهي بـ `2271` يعيد OTP ثابت `0000` بدون إرسال SMS

**Response (success):**
```json
{
  "success": true,
  "message": "OTP sent successfully"
}
```

**Response (test phone فقط):**
```json
{
  "success": true,
  "message": "OTP sent successfully",
  "otp": "0000"
}
```

**Response (errors):**
```json
{ "success": false, "message": "prefix and phoneNumber are required" }
{ "success": false, "message": "Too many OTP requests. Try again later.", "retryAfter": 3600 }
```
> Rate limit: 5 طلبات / ساعة لنفس الرقم

---

### POST /api/auth/verify-otp
التحقق من الـ OTP واستلام الـ JWT token

**Body:**
```json
{
  "prefix": "966",
  "phoneNumber": "5xxxxxxxx",
  "otp": "123456",
  "tenantId": "TENANT_OBJECT_ID",
  "fcmToken": "FCM_TOKEN_STRING"
}
```
> - `otp` — الكود المستلم على الهاتف
> - `tenantId` — نفس القيمة المُرسلة في generate-otp
> - `fcmToken` — اختياري — يُحدَّث عند التحقق الناجح

**Response (success):**
```json
{
  "success": true,
  "message": "OTP verified successfully",
  "token": "JWT_TOKEN_STRING",
  "user": {
    "_id": "...",
    "name": "أحمد محمد",
    "phoneNumber": "5xxxxxxxx",
    "preferredLanguage": "ar",
    "tenantId": "TENANT_OBJECT_ID",
    "role": "biker"
  }
}
```
> ⭐ خزّن `token` في AsyncStorage — يُستخدم في كل الـ requests التالية

**Response (errors):**
```json
{ "success": false, "message": "phoneNumber and otp are required" }
{ "success": false, "message": "User not found. Request a new OTP." }
{ "success": false, "message": "OTP expired. Request a new OTP." }
{ "success": false, "message": "Invalid OTP." }
{ "success": false, "message": "Too many failed attempts. Request a new OTP." }
```
> Rate limit: 3 محاولات خاطئة / OTP — بعدها يُلغى الـ OTP ويجب إعادة الطلب

---

## 1. PROFILE

### GET /api/biker/profile
جلب بيانات البايكر + المحفظة + التقييم

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "firstName": "أحمد",
    "lastName": "محمد",
    "phoneNumber": "5xxxxxxxx",
    "email": "ahmed@example.com",
    "image": "https://res.cloudinary.com/...",
    "prefix": "+966",
    "roles": [...],
    "wallet": {
      "_id": "...",
      "balance": 1250.00,
      "currency": "SAR"
    },
    "rating": {
      "avg": 4.7,
      "count": 58
    }
  }
}
```

---

### PUT /api/biker/profile
تحديث بيانات البايكر

**Body:**
```json
{
  "firstName": "أحمد",
  "lastName": "محمد",
  "phoneNumber": "5xxxxxxxx",
  "email": "ahmed@example.com",
  "image": "https://res.cloudinary.com/...",
  "prefix": "+966"
}
```
> جميع الحقول اختيارية — أرسل فقط ما تريد تغييره
> تغيير `phoneNumber` يعيد `verified: false`

**Response (success):**
```json
{
  "message": "User updated successfully",
  "data": {
    "user": { "...updatedUser": "..." },
    "cars": [],
    "addresses": []
  }
}
```

**Response (errors):**
```json
{ "error": "Invalid phone number" }
{ "error": "Invalid email" }
{ "error": "A user with this email and phone number already exists" }
{ "error": "No valid fields to update" }
```

---

## 2. ORDERS

### GET /api/biker/order
جلب قائمة الطلبات

**Query Params:**
```
page        number   default: 1
limit       number   default: 20, max: 100
filter      string   "active" | "past"
status      string   "ASSIGNED" | "ON_THE_WAY" | "STARTED" | "COMPLETED" | "CANCELLED"
from        string   ISO date — scheduledAt >= from
schedule    string   ISO date — تاريخ محدد
comparison  string   "gte" | "lt" — يُستخدم مع schedule
```

**أمثلة:**
```
GET /api/biker/order?filter=active
GET /api/biker/order?filter=past&page=1&limit=20
GET /api/biker/order?filter=past&from=2026-04-01&schedule=2026-04-30&comparison=lt
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "orderNumber": "ORD-1234",
      "status": "ASSIGNED",
      "scheduledAt": "2026-04-27T10:30:00.000Z",
      "tenantNetSnapshot": 50.00,
      "proof": {
        "afterPhotos": [],
        "afterSkipRequest": {
          "status": null,
          "reason": null
        }
      },
      "client": {
        "firstName": "سعد",
        "lastName": "أحمد",
        "phoneNumber": "5xxxxxxxx"
      },
      "branch": {
        "name": "فرع النزهة",
        "address": "..."
      },
      "userCar": {
        "model": { "name": "Camry", "size": "medium" },
        "brand": { "name": "Toyota", "image": "..." }
      }
    }
  ],
  "pagination": {
    "total": 5,
    "page": 1,
    "limit": 20,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPrevPage": false
  }
}
```

---

### GET /api/biker/order/:id
جلب تفاصيل طلب واحد

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "orderNumber": "ORD-1234",
    "status": "ASSIGNED",
    "scheduledAt": "2026-04-27T10:30:00.000Z",
    "tenantNetSnapshot": 50.00,
    "timeline": [
      { "status": "ASSIGNED", "at": "2026-04-27T09:00:00.000Z", "byUserId": "..." }
    ],
    "proof": {
      "afterPhotos": [],
      "afterSkipRequest": { "status": null, "reason": null }
    },
    "client": {
      "firstName": "سعد",
      "lastName": "أحمد",
      "email": "saad@example.com",
      "phoneNumber": "5xxxxxxxx"
    },
    "branch": {
      "name": "فرع النزهة",
      "address": "...",
      "arriveTime": 30
    },
    "userCar": {
      "model": { "name": "Camry" },
      "brand": { "name": "Toyota" }
    }
  }
}
```

---

### PUT /api/biker/order/:id
إلغاء الطلب
> فقط قبل STARTED وخلال 20 دقيقة من وقت الوصول

**Body:** لا يحتاج body

**Response (success):**
```json
{
  "success": true,
  "message": "Order cancelled",
  "data": {
    "orderId": "...",
    "status": "CANCELLED"
  }
}
```

**Response (errors):**
```json
{ "success": false, "message": "Cannot cancel order in current status" }
{ "success": false, "message": "Cannot cancel after 20 minutes past arrival time" }
{ "success": false, "message": "You can't cancel an order not assigned to you" }
```

---

### PATCH /api/biker/order/:id/status
⭐ تغيير حالة الطلب (الـ endpoint الموحد — استخدم هذا فقط)

**State Machine:**
```
ASSIGNED → ON_THE_WAY → STARTED → COMPLETED
```

**Body:**
```json
{ "status": "ON_THE_WAY" }
```
```json
{ "status": "STARTED" }
```
```json
{ "status": "COMPLETED" }
```

> عند إرسال `COMPLETED` يجب أحد الشرطين:
> - `proof.afterPhotos.length > 0`
> - أو `proof.afterSkipRequest.status === "APPROVED"`
> وإلا يُرجع 422

**Response (success):**
```json
{
  "success": true,
  "message": "Order status updated to ON_THE_WAY",
  "data": {
    "orderId": "...",
    "status": "ON_THE_WAY"
  }
}
```

**Response (errors):**
```json
{ "success": false, "message": "Invalid status. Allowed: ON_THE_WAY, STARTED, COMPLETED" }
{ "success": false, "message": "Cannot transition to COMPLETED: order must be in STARTED (current: ON_THE_WAY)" }
{ "success": false, "message": "Cannot complete order: upload at least one after-photo or get a photo skip approved" }
{ "success": false, "message": "You are not assigned to this order" }
```

---

### GET /api/biker/order/:id/change-car
جلب قائمة الماركات والموديلات

**Response:**
```json
[
  {
    "_id": "...",
    "name": "Toyota",
    "image": "...",
    "isActive": true,
    "models": [
      { "_id": "...", "name": "Camry", "size": "medium", "isActive": true },
      { "_id": "...", "name": "Corolla", "size": "small", "isActive": true }
    ]
  }
]
```

---

### PUT /api/biker/order/:id/change-car
تغيير سيارة الطلب

**Body (موديل موجود):**
```json
{
  "brandId": "BRAND_OBJECT_ID",
  "modelId": "MODEL_OBJECT_ID"
}
```

**Body (موديل جديد):**
```json
{
  "brandId": "BRAND_OBJECT_ID",
  "name": { "en": "New Model", "ar": "موديل جديد" },
  "size": "medium"
}
```
> قيم `size`: `"small"` | `"medium"` | `"large"`

**Response:**
```json
{
  "success": true,
  "message": "User car update it need approved from supervisor",
  "data": { "...order": "..." }
}
```

---

## 3. BALANCE

### GET /api/biker/balance
جلب الرصيد + الإحصائيات + آخر 10 معاملات

**Response:**
```json
{
  "success": true,
  "data": {
    "balance": {
      "available": 1250.00,
      "totalEarnings": 4200.00,
      "totalPayouts": 2950.00
    },
    "stats": {
      "completedOrders": 94,
      "totalEarned": 4200.00,
      "payoutsReceived": 12,
      "totalPaidOut": 2950.00
    },
    "recentTransactions": [...],
    "totalTransactions": 106
  }
}
```

---

## 4. WALLET

### GET /api/biker/wallet
جلب المحفظة + آخر 50 معاملة

**Response:**
```json
{
  "wallet": {
    "_id": "...",
    "user": { "...userObject": "..." },
    "balance": 1250.00,
    "credits": 4200.00,
    "debits": 2950.00,
    "currency": "SAR",
    "createdAt": "..."
  },
  "transaction": [
    {
      "_id": "...",
      "type": "order_earning",
      "entryType": "credit",
      "amount": 45.00,
      "status": 1,
      "reference": "EARN-ORD-1234",
      "description": "Earning for order ORD-1234",
      "order": { "orderNumber": "ORD-1234" },
      "createdAt": "2026-04-27T11:00:00.000Z"
    }
  ]
}
```

---

## 5. TRANSACTIONS

### GET /api/biker/transactions
جلب سجل المعاملات

**Query Params:**
```
page        number   default: 1
limit       number   default: 20
startDate   string   ISO date  "2026-04-01"
endDate     string   ISO date  "2026-04-30"
status      number   0=pending | 1=completed | 2=failed
```

**أمثلة:**
```
GET /api/biker/transactions?page=1&limit=20
GET /api/biker/transactions?startDate=2026-04-01&endDate=2026-04-30
GET /api/biker/transactions?status=1
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "type": "order_earning",
      "entryType": "credit",
      "amount": 45.00,
      "status": 1,
      "reference": "EARN-ORD-1234",
      "description": "Earning for order ORD-1234",
      "createdAt": "2026-04-27T11:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 48,
    "totalPages": 3,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

> قيم `type`: `"order_earning"` | `"payout"` | `"commission"` | `"refund"`
> قيم `entryType`: `"credit"` | `"debit"`
> قيم `status`: `0`=pending | `1`=completed | `2`=failed

---

## 6. NOTIFICATIONS

### GET /api/biker/notification
جلب الإشعارات

**Query Params:**
```
page        number   default: 1
limit       number   default: 20
createdAt   string   ISO date (فلتر بالتاريخ)
comparison  string   "gte" | "lte"
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "title": "طلب جديد مُسند إليك",
      "body": "تم تعيين طلب #ORD-1234 إليك",
      "type": 0,
      "isBroadcast": false,
      "recipients": ["USER_ID"],
      "readBy": [],
      "data": { "orderId": "..." },
      "createdAt": "2026-04-27T10:25:00.000Z"
    }
  ],
  "pagination": {
    "total": 14,
    "page": 1,
    "limit": 20,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPrevPage": false
  }
}
```

> قيم `type`: `0`=order | `1`=promo | `2`=system | `3`=reminder | `4`=voucher | `5`=gift
> الإشعار "مقروء" إذا كان `readBy` يحتوي على `userId` الحالي

---

### GET /api/biker/notification/:id
جلب إشعار واحد

**Response:**
```json
{
  "success": true,
  "data": { "...notification": "..." }
}
```

---

### PUT /api/biker/notification/read/:id
تمييز إشعار كمقروء

**Body:** لا يحتاج body

**Response:**
```json
{ "success": true, "message": "Notification marked as read successfully!" }
```

---

## 7. REVIEWS

### GET /api/biker/review
جلب التقييمات الواردة للبايكر

**Query Params:**
```
page    number   default: 1
limit   number   default: 20
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "rating": 5,
      "description": "خدمة ممتازة",
      "order": {
        "_id": "...",
        "orderNumber": "ORD-1234",
        "status": "COMPLETED"
      },
      "biker": { "_id": "...", "firstName": "أحمد" },
      "service": { "_id": "...", "name": "غسيل كامل" },
      "createdAt": "2026-04-25T14:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 58,
    "page": 1,
    "limit": 20,
    "totalPages": 3,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

---

### GET /api/biker/review/:id
جلب تقييم واحد

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "rating": 5,
    "description": "خدمة ممتازة",
    "order": { "...order": "..." },
    "biker": { "...biker": "..." },
    "service": { "...service": "..." }
  }
}
```

---

## 8. REPORTS

### GET /api/biker/report
جلب بلاغات البايكر

**Query Params:**
```
page    number   default: 1
limit   number   default: 20
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "description": "مشكلة في الطلب...",
      "status": "pending",
      "attachments": ["https://res.cloudinary.com/..."],
      "order": { "_id": "...", "orderNumber": "ORD-1234" },
      "reportedBy": { "_id": "...", "firstName": "أحمد" },
      "createdAt": "2026-04-27T09:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 3,
    "page": 1,
    "limit": 20,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPrevPage": false
  }
}
```

> قيم `status`: `"pending"` | `"in-progress"` | `"resolved"`

---

### POST /api/biker/report
إنشاء بلاغ جديد

**Body:**
```json
{
  "description": "مشكلة في الطلب، العميل لم يكن موجوداً",
  "orderId": "ORDER_OBJECT_ID",
  "attachments": [
    "https://res.cloudinary.com/...",
    "https://res.cloudinary.com/..."
  ]
}
```
> `orderId` و `attachments` اختياريان

**Response (success):**
```json
{
  "success": true,
  "message": "Report created successfully",
  "data": "REPORT_ID"
}
```

**Response (error):**
```json
{ "success": false, "message": "Order not found!" }
```

---

### GET /api/biker/report/:id
جلب تفاصيل بلاغ واحد

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "description": "...",
    "status": "pending",
    "attachments": ["https://..."],
    "order": { "...order": "..." },
    "reportedBy": { "...user": "..." },
    "createdAt": "..."
  }
}
```

---

## 9. BRANCHES / ZONES

### GET /api/biker/branch
جلب المناطق المسندة للبايكر

**Query Params:**
```
page    number   default: 1
limit   number   default: 20
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "branch": {
        "_id": "...",
        "name": "فرع النزهة",
        "city": "RIYADH"
      },
      "bikers": [...],
      "tenantId": "..."
    }
  ],
  "pagination": {
    "total": 2,
    "page": 1,
    "limit": 20,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPrevPage": false
  }
}
```

---

## 10. REASONS

### GET /api/biker/reason
جلب أسباب الإلغاء / تخطي الصور

**Response:**
```json
{
  "success": true,
  "reasons": [
    {
      "_id": "...",
      "name": "العميل رفض التصوير",
      "createdAt": "..."
    }
  ]
}
```

---

## LEGACY ENDPOINTS (لا تستخدم)
> مستبدلة بـ `PATCH /status`

```
PUT /api/biker/order/:id/on-road       →  PATCH /status { "status": "ON_THE_WAY" }
PUT /api/biker/order/:id/arrive        →  PATCH /status { "status": "STARTED" }
PUT /api/biker/order/:id/start-process →  PATCH /status { "status": "STARTED" }
PUT /api/biker/order/:id/finish        →  PATCH /status { "status": "COMPLETED" }
```

---

## ملخص سريع (Quick Reference)

| # | Method | Endpoint | الاستخدام |
|---|--------|----------|-----------|
| 1 | POST | `/api/auth/generate-otp` | إرسال OTP (لا يحتاج token) |
| 2 | POST | `/api/auth/verify-otp` | التحقق من OTP + استلام JWT |
| 3 | GET | `/api/biker/profile` | الملف الشخصي + المحفظة + التقييم |
| 4 | PUT | `/api/biker/profile` | تحديث الملف الشخصي |
| 5 | GET | `/api/biker/order` | قائمة الطلبات |
| 6 | GET | `/api/biker/order/:id` | تفاصيل طلب واحد |
| 7 | PUT | `/api/biker/order/:id` | إلغاء طلب |
| 8 | PATCH | `/api/biker/order/:id/status` | ⭐ تغيير حالة الطلب |
| 9 | GET | `/api/biker/order/:id/change-car` | قائمة الماركات والموديلات |
| 10 | PUT | `/api/biker/order/:id/change-car` | تغيير سيارة الطلب |
| 11 | GET | `/api/biker/balance` | الرصيد + الإحصائيات |
| 12 | GET | `/api/biker/wallet` | المحفظة + آخر 50 معاملة |
| 13 | GET | `/api/biker/transactions` | سجل المعاملات |
| 14 | GET | `/api/biker/notification` | قائمة الإشعارات |
| 15 | GET | `/api/biker/notification/:id` | إشعار واحد |
| 16 | PUT | `/api/biker/notification/read/:id` | تمييز إشعار كمقروء |
| 17 | GET | `/api/biker/review` | التقييمات الواردة |
| 18 | GET | `/api/biker/review/:id` | تقييم واحد |
| 19 | GET | `/api/biker/report` | قائمة البلاغات |
| 20 | POST | `/api/biker/report` | إنشاء بلاغ جديد |
| 21 | GET | `/api/biker/report/:id` | تفاصيل بلاغ واحد |
| 22 | GET | `/api/biker/branch` | المناطق المسندة |
| 23 | GET | `/api/biker/reason` | أسباب الإلغاء / التخطي |
