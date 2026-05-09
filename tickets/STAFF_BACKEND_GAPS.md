# Staff Screen — Backend Gaps & Tickets

**Date:** 2026-05-09  
**Scope:** `StaffScreen.js` + `AddBikerScreen.js` — partner app

---

## ✅ مكتمل بالكامل

| Ticket | الوصف | Endpoint |
|---|---|---|
| STAFF-01 | إضافة موظف | `POST /tenant/staff` ✅ |
| STAFF-02 | استعادة حساب موقوف/معطّل | `PATCH /tenant/staff/:id/status { status: 'active' }` ✅ |
| STAFF-03 | activeOrdersCount في كل الحالات | Backend أصلح aggregate ✅ |
| STAFF-04 | تفاصيل الموظف | `GET /tenant/staff/:id` ✅ — مضاف في `partner.js` |
| STAFF-05 | تغيير الفرع | `PATCH /tenant/staff/:id { branchId }` ✅ — مربوط في `AddBikerScreen` |
| STAFF-06 | بحث بالاسم ورقم الجوال | `GET /tenant/staff?search=` ✅ — + client-side filter في `StaffScreen` |

---

## ما تم بناؤه في هذا الـ PR

### `StaffScreen.js`
- زر `+` مربوط → يفتح `AddBikerScreen` inline (يمرر `role: BIKER` أو `MANAGER` حسب التاب النشط)
- SearchBar يفلتر بالاسم ورقم الجوال (client-side + يستخدم `?search=` من الـ API)
- `ActionSheet` يعرض خيار **استعادة الحساب** (`PATCH status: 'active'`) عند الموقوفين/المعطّلين
- Badge الحالة: نشط / موقوف / معطّل / خارج الخدمة
- Switch مخفي على الحسابات الموقوفة/المعطّلة
- Rollback تلقائي على `setDutyStatus` عند الفشل
- `removeStaff` و `setStaffStatus` يتحققان من `res.success` قبل تحديث الـ state

### `AddBikerScreen.js`
- يقبل `role` prop → يدعم إضافة BIKER أو MANAGER من نفس الشاشة
- وضع التعديل (isEdit): يعرض الاسم ورقم الجوال كـ readonly، ويسمح فقط بتغيير الفرع عبر `PATCH /tenant/staff/:id`
- يعرض رسالة خطأ من الـ API إذا فشل الحفظ
- `onSaved` لا يُستدعى إلا عند `res.success`

### `partner.js`
- أُضيف `getStaffById(id)` → `GET /tenant/staff/:id`
- أُضيف `updateStaff(id, data)` → `PATCH /tenant/staff/:id`
- `setStaffStatus` يقبل الآن `'active'` بالإضافة لـ `'suspended'` و `'deactivated'`

---

## ❌ لا يزال معلقاً

| الموضوع | التفاصيل |
|---|---|
| شاشة تفاصيل البايكر الكاملة | `GET /tenant/staff/:id` موجود لكن لا توجد شاشة عرض rating + completedOrdersCount + activeOrders |
| تعديل ساعات العمل | Backend لا يحفظ workingHours للـ staff حالياً |
| البحث server-side | `?search=` مضاف في `partner.js` لكن `StaffScreen` يفلتر client-side حالياً — يمكن تحويله لـ server-side لاحقاً |
