# Operations Backend Gaps — ما تبقى من Back-end

> تاريخ المراجعة: 2026-05-06
> بعد ربط شاشات إدارة المغاسل بالـ endpoints المُنشأة

---

## ما تم ربطه بنجاح ✅

| الشاشة | Endpoints المستخدمة |
|--------|---------------------|
| ServicesScreen | `GET /tenant/services` + `PATCH /tenant/services/:id/toggle` |
| PackagesScreen | `GET /tenant/packages` + `PATCH /tenant/packages/:id/toggle` |
| StaffScreen | `GET /tenant/staff?role=BIKER` + `GET /tenant/staff?role=MANAGER` + `PATCH /tenant/staff/:id/status` + `DELETE /tenant/staff/:id` |
| BranchesScreen | `GET /tenant/branches` + `GET /tenant/branches/:id/services` + `PATCH /tenant/branches/:id/services/:serviceId` |
| SkipReviewScreen | `GET /tenant/skip-requests?status=PENDING` + `POST /tenant/orders/:id/review-photo-skip` |

---

## 1. AddServiceScreen — حفظ الخدمة لا يعمل

**الأولوية:** 🔴 عالية

الشاشة تفتح عند إضافة خدمة جديدة أو تعديل خدمة موجودة لكن زر الحفظ لم يُربط بعد بالـ API.

```
POST /api/tenant/services
Body: {
  "name": { "ar": "...", "en": "..." },
  "description": { "ar": "...", "en": "..." },
  "price": { "small": 40, "medium": 50, "large": 60 },
  "estimationTime": 45,
  "categoryId": "...",
  "availableFor": "MOBILE" | "IN_SHOP" | "BOTH",
  "image": "https://..."
}
Response: { "success": true, "data": { ...newService } }

PUT /api/tenant/services/:id
Body: { /* نفس POST — جميع الحقول اختيارية */ }
Response: { "success": true, "data": { ...updatedService } }

DELETE /api/tenant/services/:id
Response: { "success": true, "message": "Service deleted" }
```

**ملاحظة:** يحتاج endpoint لجلب قائمة الفئات:
```
GET /api/tenant/categories
Response: { "data": [{ "_id", "name": { ar, en } }] }
```

---

## 2. AddPackageScreen — حفظ الباقة لا يعمل

**الأولوية:** 🔴 عالية

```
POST /api/tenant/packages
Body: {
  "name": { "ar": "...", "en": "..." },
  "serviceIds": ["id1", "id2"],
  "price": { "small": 100, "medium": 130, "large": 160 },
  "usageLimit": 5,
  "validityDays": 30,
  "banner": "https://..."
}
Response: { "success": true, "data": { ...newPackage } }

PUT /api/tenant/packages/:id
Body: { /* نفس POST — جميع الحقول اختيارية */ }
Response: { "success": true, "data": { ...updatedPackage } }

DELETE /api/tenant/packages/:id
Response: { "success": true, "message": "Package deleted" }
```

---

## 3. EditBranchScreen — حفظ الفرع لا يعمل

**الأولوية:** 🔴 عالية

```
PUT /api/tenant/branches/:id
Body: {
  "name": { "ar": "...", "en": "..." },
  "address": "...",
  "workingHours": [
    { "day": "sunday", "open": "08:00", "close": "22:00", "isClosed": false }
  ],
  "slotDuration": 30,
  "bufferTime": 10,
  "banner": "https://..."
}
Response: { "success": true, "data": { ...updatedBranch } }
Errors:
  { "message": "Branch not found" }
  { "message": "Cannot modify main branch name" }
```

---

## 4. AddStaffScreen — إضافة موظف جديد

**الأولوية:** 🟠 متوسطة

زر `+` في StaffScreen موجود في الواجهة لكن لا يوجد شاشة AddStaff ولا endpoint مربوط.

```
POST /api/tenant/staff
Body: {
  "phoneNumber": "05xxxxxxxx",
  "firstName": "...",
  "lastName": "...",
  "branchId": "...",
  "role": "BIKER" | "MANAGER"
}
Response: {
  "success": true,
  "data": { "_id", "userId", "role", "branchId", "isOnDuty": false }
}
Errors:
  { "message": "User not found with this phone number" }
  { "message": "Staff member already exists" }
```

---

## 5. GET /tenant/services — response ناقص

**الأولوية:** 🟠 متوسطة

ServicesScreen تعرض اسم الفئة (`category.name.ar`) لكنها قد لا تأتي populated في الـ response الحالي.

**المطلوب في كل خدمة:**
```json
{
  "_id": "...",
  "name": { "ar": "...", "en": "..." },
  "price": { "small": 40, "medium": 50, "large": 60 },
  "isActive": true,
  "availableFor": "MOBILE",
  "category": {
    "_id": "...",
    "name": { "ar": "غسيل", "en": "Wash" }
  }
}
```

---

## 6. GET /tenant/packages — response ناقص

**الأولوية:** 🟠 متوسطة

PackagesScreen تعرض اسماء الخدمات (`services[].name.ar`) — تحتاج الـ services populated.

**المطلوب في كل باقة:**
```json
{
  "_id": "...",
  "name": { "ar": "...", "en": "..." },
  "price": { "small": 100, "medium": 130, "large": 160 },
  "usageLimit": 5,
  "validityDays": 30,
  "isActive": true,
  "banner": "https://...",
  "services": [
    { "_id": "...", "name": { "ar": "غسيل خارجي", "en": "Exterior Wash" } }
  ]
}
```

---

## 7. GET /tenant/staff — response ناقص

**الأولوية:** 🟠 متوسطة

StaffScreen يحتاج `rating` و`activeOrdersCount` لكل موظف.

**المطلوب في كل staff member:**
```json
{
  "_id": "...",
  "userId": {
    "_id": "...",
    "firstName": "...",
    "lastName": "...",
    "phoneNumber": "05xxxxxxxx"
  },
  "role": "BIKER",
  "isOnDuty": true,
  "status": "active",
  "activeOrdersCount": 2,
  "rating": 4.8
}
```

---

## 8. GET /tenant/skip-requests — filter الـ orderId

**الأولوية:** 🟡 منخفضة

بعد الموافقة أو الرفض يختفي الطلب من القائمة (فلترة محلية). لكن لو أراد المدير رؤية الطلبات المنتهية يحتاج:

```
GET /api/tenant/skip-requests?status=APPROVED
GET /api/tenant/skip-requests?status=REJECTED
```

هذه موثّقة في PARTNER_ENDPOINTS_GAPS.md ولكن الفلترة بالـ status لم يُتحقق منها.

---

## ملاحظة: DELETE لـ Packages وServices

`DELETE /api/tenant/services/:id` و `DELETE /api/tenant/packages/:id` موثّقان في PARTNER_ENDPOINTS_GAPS.md — لكن لم يُضاف زر الحذف في الواجهة بعد (متروك للـ AddServiceScreen / AddPackageScreen).
