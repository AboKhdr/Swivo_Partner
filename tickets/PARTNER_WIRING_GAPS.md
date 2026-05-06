# Partner App — Backend Gaps
> تاريخ: 2026-05-06

---

## ما تم ربطه الآن ✅

| الشاشة | Endpoint |
|--------|----------|
| OrdersScreen | `GET /tenant/orders?status=&page=&limit=` |
| OrderDetailsScreen | `GET /tenant/orders/:id` |
| OrderDetailsScreen (قبول) | `POST /tenant/orders/:id/accept` |
| OrderDetailsScreen (رفض) | `POST /tenant/orders/:id/reject` |
| AssignBikerScreen | `GET /tenant/staff?role=BIKER&isOnDuty=true` + `POST /tenant/orders/:id/assign-biker` |
| SkipReviewScreen | `GET /tenant/skip-requests?status=PENDING` + `POST /tenant/orders/:id/review-photo-skip` |
| ServicesScreen | `GET /tenant/services` + `PATCH /tenant/services/:id/toggle` |
| AddServiceScreen | `POST /tenant/services` + `PUT /tenant/services/:id` + `GET /tenant/categories` |
| PackagesScreen | `GET /tenant/packages` + `PATCH /tenant/packages/:id/toggle` |
| AddPackageScreen | `POST /tenant/packages` + `PUT /tenant/packages/:id` |
| StaffScreen | `GET /tenant/staff?role=BIKER` + `GET /tenant/staff?role=MANAGER` + `PATCH /tenant/staff/:id/status` + `DELETE /tenant/staff/:id` |
| BikersScreen | `GET /tenant/staff?role=BIKER` + `PATCH /tenant/staff/:id/status` + `DELETE /tenant/staff/:id` |
| AddBikerScreen | `POST /tenant/staff` + `GET /tenant/branches` |
| BranchesScreen | `GET /tenant/branches` + `GET /tenant/branches/:id/services` + `PATCH /tenant/branches/:id/services/:serviceId` |
| EditBranchScreen | `PUT /tenant/branches/:id` |
| ReviewsScreen | `GET /dashboard/review/admin` + `GET /tenant/branches` |
| PaymentsScreen | `GET /dashboard/biker/payout` |
| DashboardScreen | `GET /dashboard/today` + `GET /tenant/staff?role=BIKER&isOnDuty=true` |
| NotificationsScreen | `GET /dashboard/notification` |
| SupportScreen | `POST /dashboard/support` |
| PartnerPersonalInfoScreen | `GET /dashboard/profile` + `PUT /dashboard/profile` |
| PartnerProfileNavigator | اسم المستخدم من authStore + logout |

---

## 1. OffersScreen — Frontend مربوط، ينتظر backend

**الأولوية:** 🔴 عالية

الـ frontend مربوط الآن بالـ service functions في `partner.js`. الشاشة ستعرض قائمة فارغة حتى يوفر الـ backend الـ endpoints:

```
GET    /api/tenant/offers
Response: { data: [{ _id, name:{ar,en}, serviceIds[], prices:{serviceId:{small,medium,large}}, endDate, isActive }] }

POST   /api/tenant/offers
Body: { name:{ar,en}, serviceIds:[], prices:{serviceId:{small,medium,large}}, endDate?, isActive }

PUT    /api/tenant/offers/:id
Body: { /* نفس POST */ }

DELETE /api/tenant/offers/:id

PATCH  /api/tenant/offers/:id/toggle
Body: { isActive: true|false }
```

---

## 2. PaymentsScreen — response shape غير متطابق

**الأولوية:** 🟠 متوسطة

الشاشة تعرض: label (وصف العملية)، amount، type (in/out)، method، date.

`GET /dashboard/biker/payout` يعيد دفعات للبايكر فقط — لا يشمل إيرادات الطلبات.

**المطلوب:** endpoint موحّد لسجل مدفوعات المغسلة:

```
GET /api/tenant/payments?dateFrom=&dateTo=&limit=
Response: {
  data: [{
    _id, createdAt, label:{ar,en}, amount,
    type: "in"|"out",
    paymentMethod: "card"|"wallet"|"cash"|"deduction",
    status: "completed"|"pending"
  }],
  summary: { totalIn, totalOut, net }
}
```

---

## 3. OrderDetailsScreen — timestamps للـ timeline فارغة

**الأولوية:** 🟠 متوسطة

الشاشة تعرض وقت كل خطوة (وصول الطلب، وصول البايكر، بدء الغسيل، الانتهاء).

**المطلوب في response الطلب:**
```json
{
  "createdAt":      "2026-05-06T10:00:00Z",
  "arrivedAt":      "2026-05-06T10:30:00Z",
  "startedAt":      "2026-05-06T10:35:00Z",
  "completedAt":    "2026-05-06T11:00:00Z"
}
```

---

## 4. OrderDetailsScreen — بيانات الخريطة (mobile orders)

**الأولوية:** 🟡 منخفضة

الشاشة تعرض المسافة والوقت المتوقع للبايكر. لا يوجد endpoint لحساب المسافة.

**المطلوب في response الطلب:**
```json
{
  "distanceKm": 2.4,
  "estimatedMinutes": 12
}
```

أو endpoint منفصل: `GET /api/tenant/orders/:id/eta`

---

## 5. GET /tenant/services — categories غير populated

**الأولوية:** 🟠 متوسطة

ServicesScreen تعرض `item.category?.name?.ar` — تحتاج category مع name مـ populated في الـ response.

---

## 6. GET /tenant/packages — services غير populated

**الأولوية:** 🟠 متوسطة

PackagesScreen تعرض أسماء الخدمات — تحتاج `services[]` مع name في الـ response.

---

## 7. GET /tenant/staff — rating و activeOrdersCount ناقصان

**الأولوية:** 🟠 متوسطة

StaffScreen و BikersScreen يعرضان rating و activeOrdersCount لكل موظف.

**المطلوب في كل عنصر:**
```json
{
  "_id": "...",
  "userId": { "firstName": "...", "lastName": "...", "phoneNumber": "..." },
  "role": "BIKER",
  "isOnDuty": true,
  "status": "active",
  "activeOrdersCount": 2,
  "rating": 4.8
}
```

---

## 8. GET /dashboard/review/admin — response shape

**الأولوية:** 🟠 متوسطة

ReviewsScreen تحتاج:
```json
{
  "_id": "...",
  "user": { "firstName": "...", "lastName": "..." },
  "rating": 5,
  "comment": "...",
  "createdAt": "2026-05-06T...",
  "branchId": "..."
}
```

---

## 9. AddServiceScreen — لا يوجد endpoint للفئات

**الأولوية:** 🟠 متوسطة

```
GET /api/tenant/categories
Response: { data: [{ _id, name: { ar, en } }] }
```

---

## 10. OrderDetailsScreen — onshop flow ✅ مربوط

الـ frontend مربوط الآن:
- `POST /tenant/orders/:id/start` — يُرسل صورة بدء الغسيل بعد رفعها على cloudinary
- `POST /tenant/orders/:id/complete` — يُرسل صور نهاية الغسيل بعد رفعها على cloudinary

**ما يحتاجه الـ backend:**
- الـ endpoint يستقبل `{ photo: string }` لـ start
- الـ endpoint يستقبل `{ photos: string[] }` لـ complete
- يُحدّث status الطلب → `STARTED` / `COMPLETED`
