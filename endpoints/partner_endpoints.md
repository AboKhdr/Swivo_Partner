# Partner (Tenant) API Endpoints
> Base URL: `https://<domain>/api`
> الـ Partner هو صاحب محطة الغسيل (admin / manager)
> كل request يحمل: `Authorization: Bearer <jwt_token>`

---

## AUTH HEADER
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

> تسجيل الدخول عبر NextAuth credentials:
> ```
> POST /api/auth/[...nextauth]
> Body: { username: "email_or_phone", password: "..." }
> ```

---

## 0. AUTH

### POST /api/auth/generate-otp
### POST /api/auth/verify-otp
> نفس endpoints الـ Biker — راجع `biker_endpoints.md` Section 0

---

## 1. PROFILE

### GET /api/dashboard/profile
جلب بيانات الـ partner

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "firstName": "محمد",
    "lastName": "العمري",
    "email": "partner@example.com",
    "phoneNumber": "5xxxxxxxx",
    "image": "https://res.cloudinary.com/...",
    "roles": [{ "_id": "...", "name": "TENANT_MANAGER" }]
  }
}
```

---

### PUT /api/dashboard/profile
تحديث بيانات الـ partner

**Body:**
```json
{
  "firstName": "محمد",
  "lastName": "العمري",
  "image": "https://res.cloudinary.com/..."
}
```
> جميع الحقول اختيارية

**Response (success):**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": { "...updatedProfile": "..." }
}
```

**Response (errors):**
```json
{ "success": false, "message": "No valid fields to update" }
{ "success": false, "message": "Profile not found" }
```

---

### PATCH /api/dashboard/change-password
تغيير كلمة المرور

**Body:**
```json
{
  "oldPassword": "CurrentPass123",
  "newPassword": "NewPass456",
  "confirmPassword": "NewPass456"
}
```

**Response (success):**
```json
{
  "success": true,
  "message": "Password updated successfully",
  "data": { "id": "...", "email": "...", "updatedAt": "..." }
}
```

**Response (errors):**
```json
{ "message": "All password fields are required" }
{ "message": "New password and confirmation do not match" }
{ "message": "New password must be different from old password" }
{ "message": "Old password is incorrect" }
```

---

## 2. ORDERS

### GET /api/tenant/orders
جلب قائمة طلبات الـ tenant

**Query Params:**
```
page    number   default: 1
limit   number   default: 20, max: 100
status  string   "PENDING_PARTNER" | "ACCEPTED" | "ASSIGNED" | "ON_THE_WAY" |
                 "STARTED" | "COMPLETED" | "REJECTED" | "CANCELLED"
                 (يمكن فصل أكثر من حالة بفاصلة: "ACCEPTED,ASSIGNED")
```

**أمثلة:**
```
GET /api/tenant/orders?status=PENDING_PARTNER
GET /api/tenant/orders?status=ACCEPTED,ASSIGNED&page=1&limit=20
GET /api/tenant/orders?page=1&limit=20
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "orderNumber": "ORD-1234",
      "status": "PENDING_PARTNER",
      "scheduledAt": "2026-04-27T10:30:00.000Z",
      "tenantNetSnapshot": 50.00,
      "client": {
        "firstName": "سعد",
        "lastName": "أحمد",
        "email": "saad@example.com",
        "phoneNumber": "5xxxxxxxx"
      },
      "biker": {
        "firstName": "أحمد",
        "lastName": "محمد",
        "phoneNumber": "5xxxxxxxx"
      },
      "branch": { "name": "فرع النزهة", "address": "..." },
      "userCar": {
        "model": { "name": "Camry" },
        "brand": { "name": "Toyota" }
      },
      "createdAt": "..."
    }
  ],
  "pagination": {
    "total": 24,
    "page": 1,
    "limit": 20,
    "totalPages": 2,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

> **دورة حياة الطلب (Order Lifecycle):**
> ```
> PENDING_PAYMENT → AUTHORIZING → AUTHORIZED → PENDING_PARTNER
>   → REJECTED  (partner رفض)
>   → ACCEPTED  (partner قبل) → ASSIGNED (بايكر مُعيَّن)
>     → ON_THE_WAY → STARTED → COMPLETED
>   → CANCELLED
> ```

---

### POST /api/tenant/orders/:id/accept
قبول طلب (من حالة PENDING_PARTNER)

**Body:** لا يحتاج body

**Response (success):**
```json
{
  "success": true,
  "message": "Order accepted",
  "data": { "orderId": "...", "status": "ACCEPTED" }
}
```

**Response (errors):**
```json
{ "success": false, "message": "Order not found" }
{ "success": false, "message": "Order cannot be accepted from status: ASSIGNED" }
```

---

### POST /api/tenant/orders/:id/reject
رفض طلب (من حالة PENDING_PARTNER) — يُسترجع المبلغ تلقائياً

**Body:**
```json
{
  "reason": "خارج نطاق الخدمة"
}
```
> `reason` مطلوب

**Response (success):**
```json
{
  "success": true,
  "message": "Order rejected",
  "data": { "orderId": "...", "status": "REJECTED" }
}
```

**Response (errors):**
```json
{ "success": false, "message": "reason is required" }
{ "success": false, "message": "Order cannot be rejected from status: ACCEPTED" }
```

---

### POST /api/tenant/orders/:id/assign-biker
تعيين بايكر على طلب مقبول (من حالة ACCEPTED)
> البايكر يجب أن يكون `isOnDuty: true` في نفس الـ tenant

**Body:**
```json
{
  "bikerId": "BIKER_USER_OBJECT_ID"
}
```

**Response (success):**
```json
{
  "success": true,
  "message": "Biker assigned",
  "data": {
    "orderId": "...",
    "status": "ASSIGNED",
    "biker": "BIKER_USER_OBJECT_ID"
  }
}
```

**Response (errors):**
```json
{ "success": false, "message": "bikerId is required" }
{ "success": false, "message": "Order cannot be assigned from status: PENDING_PARTNER" }
{ "success": false, "message": "Biker not found or not on duty for this tenant" }
```

---

### POST /api/tenant/orders/:id/upload-after
رفع صورة "بعد الخدمة" للطلب (حالة STARTED فقط)
> الصورة تُرفع أولاً لـ Cloudinary/GCS ثم يُرسل URL

**Body:**
```json
{
  "photoUrl": "https://storage.googleapis.com/..."
}
```
> `photoUrl` يجب أن يكون GCS URL صحيح

**Response (success):**
```json
{
  "success": true,
  "message": "After-photo recorded",
  "data": {
    "afterPhotos": [
      { "url": "https://storage.googleapis.com/...", "uploadedAt": "2026-04-27T11:00:00.000Z" }
    ]
  }
}
```

**Response (errors):**
```json
{ "success": false, "message": "photoUrl is required" }
{ "success": false, "message": "photoUrl must be a valid GCS URL" }
{ "success": false, "message": "After-photos can only be uploaded in STARTED status (current: ON_THE_WAY)" }
{ "success": false, "message": "Not assigned to this order" }
```

---

### POST /api/tenant/orders/:id/request-photo-skip
البايكر يطلب تخطي رفع الصور (حالة STARTED فقط)

**Body:**
```json
{
  "reason": "NO_INTERNET",
  "note": "ملاحظة اختيارية"
}
```

> قيم `reason` المتاحة:
> - `CUSTOMER_REFUSED_PHOTO`
> - `NO_INTERNET`
> - `CAMERA_BROKEN`
> - `APP_CRASHED`
> - `CAR_LEFT_BEFORE_PHOTO`
> - `OTHER` ← يتطلب `note` إجباري

**Response (success):**
```json
{
  "success": true,
  "message": "Photo skip request submitted",
  "data": {
    "afterSkipRequest": {
      "requestedBy": "...",
      "requestedAt": "...",
      "reason": "NO_INTERNET",
      "note": null,
      "status": "PENDING"
    }
  }
}
```

**Response (errors):**
```json
{ "success": false, "message": "reason must be one of: CUSTOMER_REFUSED_PHOTO, NO_INTERNET, ..." }
{ "success": false, "message": "note is required when reason is OTHER" }
{ "success": false, "message": "Photo skip can only be requested in STARTED status (current: ON_THE_WAY)" }
{ "success": false, "message": "A skip request is already pending review" }
{ "success": false, "message": "Not assigned to this order" }
```

---

### POST /api/tenant/orders/:id/review-photo-skip
المدير يوافق أو يرفض طلب تخطي الصور

**Body:**
```json
{
  "decision": "APPROVED",
  "reviewNote": "موافق بسبب عطل الكاميرا"
}
```
> `decision`: `"APPROVED"` | `"REJECTED"`
> `reviewNote`: اختياري

**Response (success):**
```json
{
  "success": true,
  "message": "Photo skip approved",
  "data": {
    "afterSkipRequest": {
      "status": "APPROVED",
      "reviewedBy": "...",
      "reviewedAt": "..."
    }
  }
}
```

**Response (errors):**
```json
{ "success": false, "message": "decision must be APPROVED or REJECTED" }
{ "success": false, "message": "No pending skip request on this order" }
```

---

## 3. STAFF (البايكرز والمديرون)

### GET /api/tenant/staff
جلب قائمة الموظفين

**Query Params:**
```
page    number   default: 1
limit   number   default: 20
role    string   "BIKER" | "MANAGER"
branch  string   BRANCH_OBJECT_ID
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "userId": {
        "_id": "...",
        "firstName": "أحمد",
        "lastName": "محمد",
        "phoneNumber": "5xxxxxxxx",
        "image": "...",
        "isActive": true
      },
      "branchId": { "_id": "...", "name": "فرع النزهة", "isMain": true },
      "role": "BIKER",
      "isOnDuty": true,
      "isActive": true,
      "tenantId": "..."
    }
  ],
  "total": 8,
  "page": 1,
  "pages": 1,
  "hasNext": false,
  "hasPrev": false
}
```

---

### POST /api/tenant/staff
إضافة موظف جديد (بايكر أو مدير)

**Body:**
```json
{
  "phoneNumber": "5xxxxxxxx",
  "firstName": "أحمد",
  "lastName": "محمد",
  "branchId": "BRANCH_OBJECT_ID",
  "role": "BIKER"
}
```
> `phoneNumber` + `branchId` + `role` مطلوبة
> `role`: `"BIKER"` | `"MANAGER"`

**Response (success):**
```json
{
  "success": true,
  "message": "Staff member added",
  "data": {
    "_id": "...",
    "userId": "...",
    "tenantId": "...",
    "branchId": "...",
    "role": "BIKER",
    "isOnDuty": false,
    "isActive": true
  }
}
```

**Response (errors):**
```json
{ "success": false, "message": "phoneNumber, branchId, and role are required" }
{ "success": false, "message": "role must be one of: BIKER, MANAGER" }
{ "success": false, "message": "Staff member already exists in this tenant" }
```

---

### PATCH /api/tenant/staff/:id/duty
تغيير حالة الدوام (on duty / off duty)
> البايكر يغير حالة نفسه — المدير يغير أي بايكر

**Body:**
```json
{ "isOnDuty": true }
```
> إذا لم يُرسل `isOnDuty` يتم toggle تلقائي (true→false أو false→true)

**Response:**
```json
{
  "success": true,
  "message": "Duty status set to true",
  "data": {
    "_id": "...",
    "isOnDuty": true,
    "lastLocationAt": "2026-04-27T09:00:00.000Z"
  }
}
```

---

## 4. SERVICES

### GET /api/tenant/services
جلب قائمة الخدمات

**Query Params:**
```
includeInactive   boolean  "true" لإظهار الخدمات غير النشطة
categoryId        string   فلتر بالتصنيف
availableFor      string   "MOBILE" | "IN_SHOP" | "BOTH"
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "name": { "ar": "غسيل كامل", "en": "Full Wash" },
      "description": { "ar": "...", "en": "..." },
      "image": "https://...",
      "price": { "small": 40.0, "medium": 50.0, "large": 60.0 },
      "estimationTime": 45,
      "availableFor": "MOBILE",
      "isActive": true,
      "categoryId": { "_id": "...", "name": { "ar": "غسيل", "en": "Wash" }, "icon": "..." },
      "tenantId": "..."
    }
  ],
  "total": 5
}
```

---

### POST /api/tenant/services
إنشاء خدمة جديدة

**Body:**
```json
{
  "name": { "ar": "غسيل كامل", "en": "Full Wash" },
  "description": { "ar": "وصف عربي", "en": "English description" },
  "image": "https://res.cloudinary.com/...",
  "price": { "small": 40, "medium": 50, "large": 60 },
  "estimationTime": 45,
  "categoryId": "CATEGORY_OBJECT_ID",
  "availableFor": "MOBILE"
}
```
> مطلوب: `name.ar` + `name.en` + `price.small/medium/large` + `estimationTime` + `availableFor`
> اختياري: `description`, `image`, `categoryId`

**Response (success):**
```json
{
  "success": true,
  "message": "Service created",
  "data": { "...service": "..." }
}
```

**Response (errors):**
```json
{ "success": false, "message": "name.ar and name.en are required" }
{ "success": false, "message": "price.small, price.medium, and price.large are required" }
{ "success": false, "message": "estimationTime (slot duration in minutes) is required and must be > 0" }
{ "success": false, "message": "availableFor must be MOBILE, IN_SHOP, or BOTH" }
{ "success": false, "message": "Category not found or inactive" }
```

---

## 5. ANALYTICS

### GET /api/dashboard/analytics/admin
إحصائيات لوحة التحكم الرئيسية

**Query Params:**
```
year    number   e.g. 2026
month   number   1-12
```

**أمثلة:**
```
GET /api/dashboard/analytics/admin
GET /api/dashboard/analytics/admin?year=2026&month=4
GET /api/dashboard/analytics/admin?year=2026
```

**Response:**
```json
{
  "success": true,
  "bikers": { "count": 12 },
  "supervisors": { "count": 3 },
  "branches": { "count": 2 },
  "cars": { "count": 145 },
  "orders": {
    "totalOrders": 284,
    "completedOrders": 231,
    "failureOrders": 18,
    "percentageCompletedOrders": 81.3,
    "avgDailyOrders": 9.4,
    "growth": 12.5,
    "growthPercentage": "12.50%",
    "ordersPerMonth": [0, 0, 0, 284, 0, 0, 0, 0, 0, 0, 0, 0],
    "years": ["all", "2026", "2025"],
    "ordersByStatus": {
      "COMPLETED": 231,
      "CANCELLED": 12,
      "REJECTED": 6,
      "PENDING_PARTNER": 5,
      "ACCEPTED": 8,
      "ASSIGNED": 22
    },
    "filters": { "year": "2026", "month": "4" }
  }
}
```

---

## 6. BIKER PAYOUTS

### GET /api/dashboard/biker/payout
جلب قائمة البايكرز مع رصيدهم (مرتبة من الأعلى رصيداً)

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
      "name": "أحمد محمد",
      "phoneNumber": "5xxxxxxxx",
      "email": "...",
      "image": "...",
      "balance": {
        "available": 1250.00,
        "totalEarnings": 4200.00,
        "totalPayouts": 2950.00
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 12,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPrevPage": false
  }
}
```

---

### POST /api/dashboard/biker/payout
صرف راتب لبايكر

**Body:**
```json
{
  "bikerId": "BIKER_USER_OBJECT_ID",
  "amount": 500.00,
  "paymentMethod": "bank_transfer",
  "notes": "راتب شهر أبريل"
}
```
> `bikerId` + `amount` مطلوبان
> `paymentMethod` default: `"bank_transfer"`
> `notes` اختياري

**Response (success):**
```json
{
  "success": true,
  "message": "Payout created successfully",
  "data": {
    "transaction": { "...transactionObject": "..." },
    "previousBalance": 1250.00,
    "newBalance": 750.00
  }
}
```

**Response (errors):**
```json
{ "success": false, "message": "Biker ID is required" }
{ "success": false, "message": "Valid amount is required" }
{ "success": false, "message": "Biker not found" }
{ "success": false, "message": "This biker does not belong to you" }
{ "success": false, "message": "Payout amount (600) exceeds available balance (500)" }
```

---

## 7. NOTIFICATIONS

### GET /api/dashboard/notification
جلب إشعارات الـ tenant

**Query Params:**
```
page        number   default: 1
limit       number   default: 20
createdAt   string   ISO date
comparison  string   "gte" | "lte"
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "title": "طلب جديد",
      "body": "طلب جديد في انتظار موافقتك",
      "type": 0,
      "isBroadcast": false,
      "createdAt": "..."
    }
  ],
  "pagination": {
    "total": 32,
    "page": 1,
    "limit": 20,
    "totalPages": 2,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

---

## 8. REVIEWS

### GET /api/dashboard/review/admin
جلب تقييمات الـ tenant

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
      "user": { "firstName": "سعد", "lastName": "أحمد" },
      "order": { "orderNumber": "ORD-1234" },
      "biker": { "firstName": "أحمد", "lastName": "محمد" },
      "service": { "name": { "ar": "غسيل كامل", "en": "Full Wash" } },
      "isHidden": false,
      "createdAt": "..."
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

### DELETE /api/dashboard/review/admin
حذف تقييم أو أكثر (soft delete)

**Query Param (تقييم واحد):**
```
DELETE /api/dashboard/review/admin?id=REVIEW_ID
```

**Body (أكثر من تقييم):**
```json
{
  "ids": ["REVIEW_ID_1", "REVIEW_ID_2"]
}
```

**Response:**
```json
{
  "ok": true,
  "deletedCount": 2
}
```

---

## ملخص سريع (Quick Reference)

| # | Method | Endpoint | الاستخدام |
|---|--------|----------|-----------|
| 1 | GET | `/api/dashboard/profile` | الملف الشخصي |
| 2 | PUT | `/api/dashboard/profile` | تحديث الملف الشخصي |
| 3 | PATCH | `/api/dashboard/change-password` | تغيير كلمة المرور |
| 4 | GET | `/api/tenant/orders` | قائمة الطلبات (فلتر بالحالة) |
| 5 | POST | `/api/tenant/orders/:id/accept` | ⭐ قبول طلب |
| 6 | POST | `/api/tenant/orders/:id/reject` | ⭐ رفض طلب (مع السبب) |
| 7 | POST | `/api/tenant/orders/:id/assign-biker` | ⭐ تعيين بايكر |
| 8 | POST | `/api/tenant/orders/:id/upload-after` | رفع صورة بعد الخدمة |
| 9 | POST | `/api/tenant/orders/:id/request-photo-skip` | طلب تخطي الصور (بايكر) |
| 10 | POST | `/api/tenant/orders/:id/review-photo-skip` | موافقة/رفض تخطي الصور (مدير) |
| 11 | GET | `/api/tenant/staff` | قائمة الموظفين |
| 12 | POST | `/api/tenant/staff` | إضافة موظف جديد |
| 13 | PATCH | `/api/tenant/staff/:id/duty` | ⭐ تغيير حالة الدوام |
| 14 | GET | `/api/tenant/services` | قائمة الخدمات |
| 15 | POST | `/api/tenant/services` | إنشاء خدمة جديدة |
| 16 | GET | `/api/dashboard/analytics/admin` | إحصائيات لوحة التحكم |
| 17 | GET | `/api/dashboard/biker/payout` | البايكرز وأرصدتهم |
| 18 | POST | `/api/dashboard/biker/payout` | ⭐ صرف راتب لبايكر |
| 19 | GET | `/api/dashboard/notification` | الإشعارات |
| 20 | GET | `/api/dashboard/review/admin` | التقييمات |
| 21 | DELETE | `/api/dashboard/review/admin` | حذف تقييم |
