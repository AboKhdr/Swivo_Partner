# Biker Endpoints — النقص في الكود مقارنةً بـ biker_endpoints.md

> تاريخ المراجعة: 2026-05-05
> المقارنة: `endpoints/biker_endpoints.md` (23 endpoint) مقابل `src/services/biker.js` + `src/services/orders.js`

---

## ملخص سريع

| الحالة | العدد |
|--------|-------|
| Endpoints مُنفَّذة صحيحاً | 11 |
| Endpoints ناقصة كلياً | 9 |
| Endpoints مُنفَّذة لكن بمسار/method خاطئ | 3 |

---

## ❌ Endpoints ناقصة كلياً (لم تُنفَّذ في الكود)

---

### 1. GET `/api/biker/balance`
**الملف المقترح:** `src/services/biker.js`

```
GET /api/biker/balance
Headers: Authorization: Bearer <token>
Body: لا يحتاج
```

---

### 2. GET `/api/biker/transactions`
**الملف المقترح:** `src/services/biker.js`

```
GET /api/biker/transactions
Query Params (اختيارية):
  page        number   default: 1
  limit       number   default: 20
  startDate   string   ISO date  e.g. "2026-04-01"
  endDate     string   ISO date  e.g. "2026-04-30"
  status      number   0=pending | 1=completed | 2=failed

مثال: GET /api/biker/transactions?startDate=2026-04-01&endDate=2026-04-30&status=1
Body: لا يحتاج
```

---

### 3. GET `/api/biker/notification/:id`
**الملف المقترح:** `src/services/biker.js`

```
GET /api/biker/notification/:id
Headers: Authorization: Bearer <token>
Body: لا يحتاج
```

---

### 4. GET `/api/biker/review/:id`
**الملف المقترح:** `src/services/biker.js`

```
GET /api/biker/review/:id
Headers: Authorization: Bearer <token>
Body: لا يحتاج
```

---

### 5. GET `/api/biker/report`
**الملف المقترح:** `src/services/biker.js`

```
GET /api/biker/report
Query Params (اختيارية):
  page    number   default: 1
  limit   number   default: 20
Body: لا يحتاج
```

---

### 6. POST `/api/biker/report`
**الملف المقترح:** `src/services/biker.js`

```
POST /api/biker/report
Headers: Authorization: Bearer <token>
         Content-Type: application/json
Body:
{
  "description": "مشكلة في الطلب، العميل لم يكن موجوداً",
  "orderId": "ORDER_OBJECT_ID",        // اختياري
  "attachments": [                      // اختياري — URLs من Cloudinary
    "https://res.cloudinary.com/...",
    "https://res.cloudinary.com/..."
  ]
}
```

---

### 7. GET `/api/biker/report/:id`
**الملف المقترح:** `src/services/biker.js`

```
GET /api/biker/report/:id
Headers: Authorization: Bearer <token>
Body: لا يحتاج
```

---

### 8. GET `/api/biker/branch`
**الملف المقترح:** `src/services/biker.js`

```
GET /api/biker/branch
Query Params (اختيارية):
  page    number   default: 1
  limit   number   default: 20
Body: لا يحتاج
```

---

### 9. GET `/api/biker/order/:id/change-car`
**الملف المقترح:** `src/services/orders.js`

```
GET /api/biker/order/:id/change-car
Headers: Authorization: Bearer <token>
Body: لا يحتاج
```

---

### 10. PUT `/api/biker/order/:id/change-car`
**الملف المقترح:** `src/services/orders.js`

```
PUT /api/biker/order/:id/change-car
Headers: Authorization: Bearer <token>
         Content-Type: application/json

Body (موديل موجود):
{
  "brandId": "BRAND_OBJECT_ID",
  "modelId": "MODEL_OBJECT_ID"
}

Body (موديل جديد — غير موجود في القائمة):
{
  "brandId": "BRAND_OBJECT_ID",
  "name": { "en": "New Model", "ar": "موديل جديد" },
  "size": "medium"
}
// قيم size: "small" | "medium" | "large"
```

---

## ⚠️ Endpoints مُنفَّذة بمسار أو method خاطئ

---

### 11. Profile — method خاطئ

**الموجود في الكود:**
```
PATCH /biker/profile   ← خاطئ
```

**الصحيح حسب biker_endpoints.md:**
```
PUT /api/biker/profile
Headers: Authorization: Bearer <token>
         Content-Type: application/json
Body:
{
  "firstName": "أحمد",        // اختياري
  "lastName": "محمد",         // اختياري
  "phoneNumber": "5xxxxxxxx", // اختياري — يعيد verified: false
  "email": "ahmed@example.com", // اختياري
  "image": "https://res.cloudinary.com/...", // اختياري — URL بعد رفعه لـ Cloudinary
  "prefix": "+966"            // اختياري
}
```

> ⚠️ `image` يُرسل كـ URL وليس كـ file — يجب رفع الصورة لـ Cloudinary أولاً ثم إرسال الـ URL.

---

### 12. Reviews — مسار خاطئ

**الموجود في الكود:**
```
GET /biker/reviews    ← خاطئ (reviews بصيغة الجمع)
```

**الصحيح:**
```
GET /api/biker/review
Query Params (اختيارية):
  page    number   default: 1
  limit   number   default: 20
Body: لا يحتاج
```

---

### 13. Cancel Order — body زائد غير موثّق

**الموجود في الكود:**
```js
api.put(`/biker/order/${id}`, {reason})   // يُرسل reason في الـ body
```

**حسب biker_endpoints.md:**
```
PUT /api/biker/order/:id
Body: لا يحتاج body
```

> ⚠️ الـ endpoint الرسمي لا يذكر body. إذا كان الـ backend يرفض الـ body يجب حذف `{reason}` من الاستدعاء.
> **يحتاج تأكيد من الـ backend.**

---

## جدول النقص الكامل

| # | Method | Endpoint | الحالة | الأولوية |
|---|--------|----------|--------|----------|
| 1 | GET | `/api/biker/balance` | ناقص كلياً | 🔴 عالية |
| 2 | GET | `/api/biker/transactions` | ناقص كلياً | 🔴 عالية |
| 3 | GET | `/api/biker/notification/:id` | ناقص كلياً | 🟠 متوسطة |
| 4 | GET | `/api/biker/review` | مسار خاطئ (`/reviews`) | 🔴 عالية |
| 5 | GET | `/api/biker/review/:id` | ناقص كلياً | 🟡 منخفضة |
| 6 | GET | `/api/biker/report` | ناقص كلياً | 🟠 متوسطة |
| 7 | POST | `/api/biker/report` | ناقص كلياً | 🟠 متوسطة |
| 8 | GET | `/api/biker/report/:id` | ناقص كلياً | 🟡 منخفضة |
| 9 | GET | `/api/biker/branch` | ناقص كلياً | 🟠 متوسطة |
| 10 | GET | `/api/biker/order/:id/change-car` | ناقص كلياً | 🟠 متوسطة |
| 11 | PUT | `/api/biker/order/:id/change-car` | ناقص كلياً | 🟠 متوسطة |
| 12 | PUT | `/api/biker/profile` | method خاطئ (PATCH بدل PUT) | 🔴 عالية |
| 13 | PUT | `/api/biker/order/:id` | body غير موثّق (`reason`) | ⚠️ يحتاج تأكيد |
