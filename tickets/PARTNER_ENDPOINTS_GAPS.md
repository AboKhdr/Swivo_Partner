# Partner Endpoints — النقص والمشاكل

> تاريخ المراجعة: 2026-05-05
> المقارنة: `endpoints/partner_endpoints.md` مقابل شاشات `src/partner/`

---

## ملخص سريع

| الحالة | العدد |
|--------|-------|
| Endpoints موثّقة حالياً | 21 |
| Endpoints ناقصة كلياً | ~20 |
| Endpoints موثّقة لكن ناقصة جزئياً | 2 |

---

## 1. GET `/api/tenant/orders/:id` — مفقود كلياً

**الشاشة:** `src/partner/features/orders/OrderDetailsScreen.js`

الشاشة تفتح تفاصيل طلب واحد بالكامل (بيانات العميل، السيارة، الخريطة، التايم لاين، الصور). لا يوجد endpoint لجلب طلب محدد بـ ID.

```
GET /api/tenant/orders/:id
Response: {
  "_id", "orderNumber", "status", "type" ("mobile"|"onshop"),
  "scheduledAt", "tenantNetSnapshot",
  "client": { firstName, lastName, phoneNumber },
  "biker": { firstName, lastName, phoneNumber },
  "branch": { name, address },
  "userCar": { model: { name }, brand: { name }, plate },
  "service": { name, estimationTime },
  "notes",
  "startPhoto": { url, uploadedAt },
  "afterPhotos": [{ url, uploadedAt }],
  "afterSkipRequest": { status, reason, note }
}
```

---

## 2. OnShop Order Flow — مفقود كلياً

**الشاشة:** `src/partner/features/orders/OrderDetailsScreen.js`

لطلبات النوع `onshop` توجد خطوتان إضافيتان غير موثّقتين:

### 2a. بدء الغسيل + رفع صورة البداية
```
POST /api/tenant/orders/:id/start
Body: { "photoUrl": "https://..." }
Response: {
  "success": true,
  "message": "Order started",
  "data": { "status": "STARTED", "startPhoto": { url, uploadedAt } }
}
Errors:
  { "message": "Order cannot be started from status: PENDING_PARTNER" }
  { "message": "photoUrl is required for onshop orders" }
```

### 2b. إنهاء الطلب + رفع صور النهاية (حتى 3 صور)
```
POST /api/tenant/orders/:id/complete
Body: { "photoUrls": ["https://...", "https://..."] }
Response: {
  "success": true,
  "message": "Order completed",
  "data": { "status": "COMPLETED", "afterPhotos": [{ url, uploadedAt }] }
}
Errors:
  { "message": "Order cannot be completed from status: ACCEPTED" }
  { "message": "At least one photo is required to complete the order" }
  { "message": "Maximum 3 photos allowed" }
```

> ملاحظة: `POST /api/tenant/orders/:id/upload-after` الموثّق حالياً يبدو مخصصاً للـ Biker وليس للـ Partner. يحتاج توضيح من الـ Backend.

---

## 3. Skip Requests List — مفقود

**الشاشة:** `src/partner/features/orders/SkipReviewScreen.js`

الـ endpoint الموجود `review-photo-skip` هو للموافقة/الرفض فقط. جلب قائمة الطلبات المعلّقة غائب.

```
GET /api/tenant/skip-requests
Query Params:
  status  string  "PENDING" | "APPROVED" | "REJECTED"  (default: "PENDING")
  page    number  default: 1
  limit   number  default: 20
Response: {
  "success": true,
  "data": [
    {
      "_id": "...",
      "orderId": { "_id", "orderNumber" },
      "requestedBy": { "firstName", "lastName" },
      "reason": "NO_INTERNET",
      "note": null,
      "status": "PENDING",
      "requestedAt": "..."
    }
  ],
  "pagination": { total, page, limit, totalPages, hasNextPage, hasPrevPage }
}
```

---

## 4. Packages — مفقود كلياً

**الشاشة:** `src/partner/features/operations/PackagesScreen.js`

لا يوجد أي endpoint للباقات في الملف الحالي.

```
GET /api/tenant/packages
Query: { includeInactive?: boolean }
Response: {
  "data": [
    {
      "_id", "name": { ar, en },
      "services": [{ _id, name }],
      "price": { small, medium, large },
      "usageLimit", "validityDays",
      "banner": "https://...",
      "isActive": true
    }
  ]
}

POST /api/tenant/packages
Body: {
  "name": { "ar": "...", "en": "..." },
  "serviceIds": ["id1", "id2"],
  "price": { "small": 100, "medium": 130, "large": 160 },
  "usageLimit": 5,
  "validityDays": 30,
  "banner": "https://..."   // optional
}

PUT /api/tenant/packages/:id
Body: { /* نفس POST — جميع الحقول اختيارية */ }

DELETE /api/tenant/packages/:id

PATCH /api/tenant/packages/:id/toggle
Body: { "isActive": true }
Response: { "success": true, "data": { "_id", "isActive": true } }
```

---

## 5. Services — endpoints ناقصة جزئياً

**الشاشة:** `src/partner/features/operations/ServicesScreen.js`

الموثّق حالياً: `GET` + `POST` فقط. الشاشة تدعم تعديل الخدمات وتفعيل/تعطيلها.

```
PUT /api/tenant/services/:id
Body: {
  "name": { "ar": "...", "en": "..." },
  "description": { "ar": "...", "en": "..." },
  "image": "https://...",
  "price": { "small": 40, "medium": 50, "large": 60 },
  "estimationTime": 45,
  "categoryId": "...",
  "availableFor": "MOBILE"
}
Response: { "success": true, "data": { ...updatedService } }
Errors:
  { "message": "Service not found" }
  { "message": "availableFor must be MOBILE, IN_SHOP, or BOTH" }

DELETE /api/tenant/services/:id
Response: { "success": true, "message": "Service deleted" }
Errors:
  { "message": "Service not found" }
  { "message": "Cannot delete a service linked to active packages" }

PATCH /api/tenant/services/:id/toggle
Body: { "isActive": true }
Response: { "success": true, "data": { "_id", "isActive": true } }
```

---

## 6. Branches — مفقود كلياً

**الشاشة:** `src/partner/features/operations/BranchesScreen.js`

لا يوجد أي endpoint للفروع في الملف الحالي.

```
GET /api/tenant/branches
Response: {
  "data": [
    {
      "_id", "name": { ar, en }, "address",
      "workingHours": [{ day, open, close, isClosed }],
      "slotDuration", "bufferTime",
      "isMain": true,
      "banner": "https://...",
      "activeOrdersCount", "activeBikersCount"
    }
  ]
}

GET /api/tenant/branches/:id/services
Response: {
  "data": [
    { "serviceId": "...", "isEnabled": true, "service": { name, category } }
  ]
}

PUT /api/tenant/branches/:id
Body: {
  "name": { "ar": "...", "en": "..." },
  "address": "...",
  "workingHours": [{ "day": "sunday", "open": "08:00", "close": "22:00", "isClosed": false }],
  "slotDuration": 30,
  "bufferTime": 10,
  "banner": "https://..."
}
Response: { "success": true, "data": { ...updatedBranch } }
Errors:
  { "message": "Branch not found" }
  { "message": "Cannot modify main branch name" }

PATCH /api/tenant/branches/:id/services/:serviceId
Body: { "isEnabled": true }
Response: { "success": true, "data": { "serviceId", "isEnabled": true } }
Errors:
  { "message": "Service not available for this tenant" }
```

---

## 7. Staff — endpoints ناقصة جزئياً

**الشاشة:** `src/partner/features/operations/StaffScreen.js`

الموثّق حالياً: `GET` + `POST` + `PATCH duty` فقط. الشاشة تحتوي Bottom Sheet بـ 3 إجراءات.

```
PATCH /api/tenant/staff/:id/status
Body: { "status": "suspended" | "deactivated" }
Response: {
  "success": true,
  "message": "Staff member suspended",
  "data": { "_id", "isOnDuty": false, "status": "suspended" }
}
Errors:
  { "message": "Staff member not found" }
  { "message": "Cannot modify your own status" }

DELETE /api/tenant/staff/:id
Response: { "success": true, "message": "Staff member removed" }
Errors:
  { "message": "Staff member not found" }
  { "message": "Cannot delete staff with active orders" }
```

---

## 8. Support Message — مفقود

**الشاشة:** `src/partner/features/profile/SupportScreen.js`

الشاشة تحتوي فورم (subject + message) بدون endpoint.

```
POST /api/dashboard/support
Body: {
  "subject": "مشكلة في الطلبات",
  "message": "نص الرسالة..."
}
Response: {
  "success": true,
  "message": "Support message sent",
  "data": { "ticketId": "...", "sentAt": "..." }
}
Errors:
  { "message": "subject and message are required" }
  { "message": "message must be at least 10 characters" }
```

---

## 9. Dashboard Today Stats — `GET /api/dashboard/today`

**الشاشة:** `src/partner/features/dashboard/DashboardScreen.js`

**الـ endpoint موجود** ومربوط، لكن `recentPendingOrders` في الـ response يحتاج إضافة حقلين:

**المطلوب إضافته لكل order في `recentPendingOrders`:**
```json
"itemsSnapshot": [
  { "nameSnapshot": { "ar": "غسيل كامل", "en": "Full Wash" } }
],
"addressSnapshot": {
  "addressText": "طريق الملك فهد",
  "district": "العليا"
}
```

**السبب:** الـ DashboardScreen يعرض اسم الخدمة والموقع في كل بطاقة طلب. بدون هذين الحقلين تظهر البطاقة فارغة.

**الـ response الكامل المطلوب:**
```
GET /api/dashboard/today
Response: {
  "success": true,
  "data": {
    "todayRevenue": 285.00,
    "pendingOrdersCount": 4,
    "activeOrdersCount": 4,
    "totalOrdersToday": 6,
    "availableBikersCount": 3,
    "recentPendingOrders": [
      {
        "_id", "orderNumber", "status": "PENDING_PARTNER",
        "scheduledAt", "tenantNetSnapshot",
        "client": { "firstName", "lastName" },
        "userCar": { "model": { "name" }, "brand": { "name" } },
        "branch": { "name" },
        "itemsSnapshot": [{ "nameSnapshot": { "ar": "...", "en": "..." } }],
        "addressSnapshot": { "addressText": "...", "district": "..." }
      }
    ]
  }
}
```

---

## 10. AssignBikerScreen — query param ناقص

**الشاشة:** `src/partner/features/orders/AssignBikerScreen.js`

الـ endpoint الحالي `GET /api/tenant/staff?role=BIKER` لا يدعم الترتيب. الشاشة تحتوي فلتر "الأقرب" و"الأعلى تقييماً".

يجب إضافة هذه الـ query params للـ endpoint الموجود:

```
GET /api/tenant/staff?role=BIKER&isOnDuty=true&sort=nearest|rated&orderId=ORDER_ID
```

> `orderId` مطلوب لحساب المسافة من موقع الطلب إلى موقع البايكر عند `sort=nearest`.

---

## جدول النقص الكامل

| # | Method | Endpoint | الشاشة | الأولوية |
|---|--------|----------|--------|----------|
| 1 | GET | `/api/tenant/orders/:id` | OrderDetailsScreen | 🔴 عالية |
| 2 | POST | `/api/tenant/orders/:id/start` | OrderDetailsScreen (onshop) | 🔴 عالية |
| 3 | POST | `/api/tenant/orders/:id/complete` | OrderDetailsScreen (onshop) | 🔴 عالية |
| 4 | GET | `/api/tenant/skip-requests` | SkipReviewScreen | 🔴 عالية |
| 5 | GET | `/api/tenant/packages` | PackagesScreen | 🟠 متوسطة |
| 6 | POST | `/api/tenant/packages` | PackagesScreen | 🟠 متوسطة |
| 7 | PUT | `/api/tenant/packages/:id` | PackagesScreen | 🟠 متوسطة |
| 8 | DELETE | `/api/tenant/packages/:id` | PackagesScreen | 🟠 متوسطة |
| 9 | PATCH | `/api/tenant/packages/:id/toggle` | PackagesScreen | 🟠 متوسطة |
| 10 | PUT | `/api/tenant/services/:id` | ServicesScreen | 🟠 متوسطة |
| 11 | DELETE | `/api/tenant/services/:id` | ServicesScreen | 🟠 متوسطة |
| 12 | PATCH | `/api/tenant/services/:id/toggle` | ServicesScreen | 🟠 متوسطة |
| 13 | GET | `/api/tenant/branches` | BranchesScreen | 🟠 متوسطة |
| 14 | PUT | `/api/tenant/branches/:id` | BranchesScreen | 🟠 متوسطة |
| 15 | GET | `/api/tenant/branches/:id/services` | BranchesScreen | 🟠 متوسطة |
| 16 | PATCH | `/api/tenant/branches/:id/services/:serviceId` | BranchesScreen | 🟠 متوسطة |
| 17 | PATCH | `/api/tenant/staff/:id/status` | StaffScreen | 🟠 متوسطة |
| 18 | DELETE | `/api/tenant/staff/:id` | StaffScreen | 🟠 متوسطة |
| 19 | POST | `/api/dashboard/support` | SupportScreen | 🟡 منخفضة |
| 20 | GET | `/api/dashboard/today` | DashboardScreen | 🔴 عالية |
| 21 | — | `?sort=nearest\|rated&orderId=` على staff endpoint | AssignBikerScreen | 🟠 متوسطة |

---

## ملاحظة إضافية

`POST /api/tenant/orders/:id/upload-after` الموثّق في القسم 2 يبدو مخصصاً للـ **Biker** (يتحقق من `"Not assigned to this order"`). يجب توضيح من الـ Backend: هل هو للـ Biker أم للـ Partner أم لكليهما؟ وإذا كان للـ Biker فقط فيجب نقله لـ `biker_endpoints.md`.
