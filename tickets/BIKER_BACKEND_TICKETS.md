# Biker App — Backend Tickets

> تاريخ: 2026-05-05
> المرسَل إلى: Backend Team
> المرسِل: Mobile Team

هذه الـ tickets تصف الـ endpoints المطلوب إنشاؤها أو تصحيحها في الـ backend لإكمال تكامل تطبيق الـ Biker.
كل الـ requests تحمل: `Authorization: Bearer <jwt_token>` — ما عدا ما هو مذكور خلافه.

---

---

## 🔴 أولوية عالية

---

### TICKET-BE-014 — GET `/api/biker/home/stats`

**الوصف:**
شاشة الـ Home تعرض 3 إحصائيات: الإيرادات الأسبوعية، عدد الطلبات، ومتوسط التقييم.
حالياً الـ mobile يستدعي 3 endpoints منفصلة (`/biker/profile` + `/biker/wallet` + `/biker/order`) لجلب هذه البيانات، مما يعني 5 طلبات HTTP متوازية في كل مرة تُفتح الشاشة.

**المطلوب:**
endpoint واحد يجمع كل stats الشاشة الرئيسية للبايكر.

```
GET /api/biker/home/stats
Authorization: Bearer <token>
```

**Response المتوقع:**
```json
{
  "success": true,
  "data": {
    "weeklyEarnings": 320.00,
    "ordersCount": 14,
    "rating": 4.8
  }
}
```

> - `weeklyEarnings`: إجمالي أرباح البايكر خلال الأسبوع الحالي (من الأحد أو الاثنين)
> - `ordersCount`: عدد الطلبات الكلي للبايكر (أو طلبات الأسبوع الحالي — حسب ما يناسب)
> - `rating`: متوسط تقييم البايكر من جميع التقييمات

**السبب:**
تقليل عدد طلبات الشبكة من 5 → 1 عند فتح الشاشة الرئيسية، وتحسين الأداء وسرعة التحميل.

---

---

### TICKET-BE-001 — GET `/api/biker/balance`

**الوصف:**
شاشة المحفظة تحتاج جلب الرصيد الحالي + إجمالي الأرباح + إجمالي المدفوعات + إحصائيات الطلبات المكتملة.

**المطلوب:**
```
GET /api/biker/balance
Authorization: Bearer <token>
```

**Response المتوقع:**
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
    "recentTransactions": [],
    "totalTransactions": 106
  }
}
```

---

### TICKET-BE-002 — GET `/api/biker/transactions`

**الوصف:**
شاشة المحفظة تعرض سجل المعاملات مع دعم فلترة بالتاريخ والحالة وتصفح الصفحات.

**المطلوب:**
```
GET /api/biker/transactions
Authorization: Bearer <token>

Query Params (جميعها اختيارية):
  page        number   default: 1
  limit       number   default: 20
  startDate   string   ISO date   مثال: "2026-04-01"
  endDate     string   ISO date   مثال: "2026-04-30"
  status      number   0=pending | 1=completed | 2=failed
```

**أمثلة:**
```
GET /api/biker/transactions?page=1&limit=20
GET /api/biker/transactions?startDate=2026-04-01&endDate=2026-04-30
GET /api/biker/transactions?status=1
```

**Response المتوقع:**
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

---

### TICKET-BE-003 — تصحيح `PUT /api/biker/profile`

**الوصف:**
الـ mobile team وجدت أن الـ backend يرفض `PUT` ويقبل `PATCH` فقط — أو العكس. يجب التأكيد وتوحيد الـ method.

**حسب التوثيق الرسمي المطلوب:**
```
PUT /api/biker/profile
Authorization: Bearer <token>
Content-Type: application/json

Body (جميع الحقول اختيارية):
{
  "firstName": "أحمد",
  "lastName": "محمد",
  "phoneNumber": "5xxxxxxxx",
  "email": "ahmed@example.com",
  "image": "https://res.cloudinary.com/...",
  "prefix": "+966"
}
```

> ملاحظة: `image` يُرسل كـ URL بعد رفعه لـ Cloudinary — ليس كـ file مباشرة.
> تغيير `phoneNumber` يجب أن يعيد `verified: false`.

**Response المتوقع (success):**
```json
{
  "message": "User updated successfully",
  "data": {
    "user": { "...updatedFields": "..." },
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

### TICKET-BE-004 — تصحيح `GET /api/biker/review`

**الوصف:**
الـ mobile team تستدعي `/biker/reviews` (بالجمع) لكن التوثيق يقول `/biker/review` (بالمفرد). يجب التأكيد أيهما صحيح — وإذا كان المفرد فيُرجى إما التصحيح أو إضافة redirect.

**المطلوب (حسب التوثيق):**
```
GET /api/biker/review
Authorization: Bearer <token>

Query Params (اختيارية):
  page    number   default: 1
  limit   number   default: 20
```

**Response المتوقع:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "rating": 5,
      "description": "خدمة ممتازة",
      "order": { "_id": "...", "orderNumber": "ORD-1234", "status": "COMPLETED" },
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

---

## 🟠 أولوية متوسطة

---

### TICKET-BE-005 — GET `/api/biker/notification/:id`

**الوصف:**
عند الضغط على إشعار معين يجب جلب تفاصيله الكاملة (بما فيها `data.orderId` للتنقل للطلب).

**المطلوب:**
```
GET /api/biker/notification/:id
Authorization: Bearer <token>
```

**Response المتوقع:**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "title": "طلب جديد مُسند إليك",
    "body": "تم تعيين طلب #ORD-1234 إليك",
    "type": 0,
    "isBroadcast": false,
    "readBy": [],
    "data": { "orderId": "ORDER_ID" },
    "createdAt": "2026-04-27T10:25:00.000Z"
  }
}
```

---

### TICKET-BE-006 — GET `/api/biker/report`

**الوصف:**
شاشة البلاغات تعرض قائمة البلاغات التي أرسلها البايكر مع حالة كل بلاغ.

**المطلوب:**
```
GET /api/biker/report
Authorization: Bearer <token>

Query Params (اختيارية):
  page    number   default: 1
  limit   number   default: 20
```

**Response المتوقع:**
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

### TICKET-BE-007 — POST `/api/biker/report`

**الوصف:**
البايكر يرسل بلاغ جديد عن مشكلة في طلب (اختياري) مع إمكانية رفع صور مرفقة.

**المطلوب:**
```
POST /api/biker/report
Authorization: Bearer <token>
Content-Type: application/json

Body:
{
  "description": "مشكلة في الطلب، العميل لم يكن موجوداً",   // مطلوب
  "orderId": "ORDER_OBJECT_ID",                               // اختياري
  "attachments": [                                            // اختياري
    "https://res.cloudinary.com/...",
    "https://res.cloudinary.com/..."
  ]
}
```

> ملاحظة: الصور تُرفع لـ Cloudinary أولاً من الـ mobile ثم تُرسل الـ URLs هنا.

**Response (success):**
```json
{
  "success": true,
  "message": "Report created successfully",
  "data": "REPORT_ID"
}
```

**Response (errors):**
```json
{ "success": false, "message": "description is required" }
{ "success": false, "message": "Order not found!" }
```

---

### TICKET-BE-008 — GET `/api/biker/branch`

**الوصف:**
جلب قائمة الفروع/المناطق المسندة للبايكر — تُستخدم في شاشة الملف الشخصي.

**المطلوب:**
```
GET /api/biker/branch
Authorization: Bearer <token>

Query Params (اختيارية):
  page    number   default: 1
  limit   number   default: 20
```

**Response المتوقع:**
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
      "bikers": [],
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

### TICKET-BE-009 — GET `/api/biker/order/:id/change-car`

**الوصف:**
قبل تغيير سيارة الطلب يجب جلب قائمة الماركات والموديلات المتاحة لعرضها في الـ modal.

**المطلوب:**
```
GET /api/biker/order/:id/change-car
Authorization: Bearer <token>
```

**Response المتوقع:**
```json
[
  {
    "_id": "...",
    "name": "Toyota",
    "image": "https://...",
    "isActive": true,
    "models": [
      { "_id": "...", "name": "Camry", "size": "medium", "isActive": true },
      { "_id": "...", "name": "Corolla", "size": "small", "isActive": true }
    ]
  }
]
```

---

### TICKET-BE-010 — PUT `/api/biker/order/:id/change-car`

**الوصف:**
البايكر يغير سيارة الطلب — إما باختيار موديل موجود أو بإضافة موديل جديد يحتاج موافقة.

**المطلوب:**
```
PUT /api/biker/order/:id/change-car
Authorization: Bearer <token>
Content-Type: application/json
```

**Body (حالة 1 — موديل موجود في القائمة):**
```json
{
  "brandId": "BRAND_OBJECT_ID",
  "modelId": "MODEL_OBJECT_ID"
}
```

**Body (حالة 2 — موديل جديد غير موجود):**
```json
{
  "brandId": "BRAND_OBJECT_ID",
  "name": { "en": "New Model", "ar": "موديل جديد" },
  "size": "medium"
}
```

> قيم `size`: `"small"` | `"medium"` | `"large"`

**Response (success):**
```json
{
  "success": true,
  "message": "User car update it need approved from supervisor",
  "data": { "...order": "..." }
}
```

---

---

## 🟡 أولوية منخفضة

---

### TICKET-BE-011 — GET `/api/biker/review/:id`

**الوصف:**
جلب تفاصيل تقييم واحد عند الضغط عليه.

**المطلوب:**
```
GET /api/biker/review/:id
Authorization: Bearer <token>
```

**Response المتوقع:**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "rating": 5,
    "description": "خدمة ممتازة",
    "order": { "_id": "...", "orderNumber": "ORD-1234", "status": "COMPLETED" },
    "biker": { "_id": "...", "firstName": "أحمد", "lastName": "محمد" },
    "service": { "_id": "...", "name": "غسيل كامل" },
    "createdAt": "2026-04-25T14:00:00.000Z"
  }
}
```

---

### TICKET-BE-012 — GET `/api/biker/report/:id`

**الوصف:**
جلب تفاصيل بلاغ واحد لعرضها في شاشة التفاصيل.

**المطلوب:**
```
GET /api/biker/report/:id
Authorization: Bearer <token>
```

**Response المتوقع:**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "description": "مشكلة في الطلب...",
    "status": "pending",
    "attachments": ["https://res.cloudinary.com/..."],
    "order": { "_id": "...", "orderNumber": "ORD-1234" },
    "reportedBy": { "_id": "...", "firstName": "أحمد" },
    "createdAt": "2026-04-27T09:00:00.000Z"
  }
}
```

---

---

## ⚠️ يحتاج تأكيد فقط (لا يحتاج تطوير جديد)

---

### TICKET-BE-013 — توضيح body في `PUT /api/biker/order/:id` (إلغاء الطلب)

**الوصف:**
التوثيق الحالي يقول "Body: لا يحتاج" — لكن الـ mobile team ترسل `{ "reason": "..." }` في الـ body. هل الـ backend يتقبّل الـ reason؟ وإذا كان كذلك يرجى توثيقه.

**السؤال للـ backend:**
```
PUT /api/biker/order/:id
Body: { "reason": "REASON_TEXT_OR_ID" }   ← هل هذا مقبول؟
```

> إذا كان مقبولاً: يرجى توضيح هل `reason` نص حر أم `_id` من `GET /api/biker/reason`.
> إذا كان مرفوضاً: سيتم حذفه من الكود.

---

## ملخص الـ Tickets

| Ticket | Method | Endpoint | الأولوية |
|--------|--------|----------|----------|
| BE-001 | GET | `/api/biker/balance` | 🔴 عالية |
| BE-002 | GET | `/api/biker/transactions` | 🔴 عالية |
| BE-003 | PUT | `/api/biker/profile` | 🔴 عالية — تصحيح method |
| BE-004 | GET | `/api/biker/review` | 🔴 عالية — تصحيح مسار |
| BE-005 | GET | `/api/biker/notification/:id` | 🟠 متوسطة |
| BE-006 | GET | `/api/biker/report` | 🟠 متوسطة |
| BE-007 | POST | `/api/biker/report` | 🟠 متوسطة |
| BE-008 | GET | `/api/biker/branch` | 🟠 متوسطة |
| BE-009 | GET | `/api/biker/order/:id/change-car` | 🟠 متوسطة |
| BE-010 | PUT | `/api/biker/order/:id/change-car` | 🟠 متوسطة |
| BE-011 | GET | `/api/biker/review/:id` | 🟡 منخفضة |
| BE-012 | GET | `/api/biker/report/:id` | 🟡 منخفضة |
| BE-013 | PUT | `/api/biker/order/:id` | ⚠️ يحتاج تأكيد فقط |
| BE-014 | GET | `/api/biker/home/stats` | 🔴 عالية — تحسين أداء |
