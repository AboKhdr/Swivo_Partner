# Ticket: Branch Services Toggle Endpoint

**التاريخ:** 2026-05-09
**الأولوية:** 🟠 متوسطة
**الحالة:** ✅ مكتمل

---

## الوصف

شاشة **BranchesScreen** تعرض قائمة الخدمات المتاحة لكل فرع مع مفتاح تفعيل/تعطيل لكل خدمة.
عند تغيير أي مفتاح يظهر زر "حفظ التعديلات"، وعند الضغط عليه يُرسل التعديلات للـ backend.

---

## الـ Endpoints المستخدمة

### 1. جلب خدمات الفرع
```
GET /tenant/branches/:branchId/services
```

**الـ Response المتوقع:**
```json
{
  "data": [
    {
      "serviceId": "abc123",
      "isEnabled": true,
      "service": {
        "name": { "ar": "غسلة سريعة", "en": "Quick Wash" },
        "category": {
          "name": { "ar": "غسيل", "en": "Washing" }
        }
      }
    }
  ]
}
```

---

### 2. تعديل حالة خدمة في فرع
```
PATCH /tenant/branches/:branchId/services/:serviceId
Body: { "isEnabled": true | false }
```

**الـ Response المتوقع:**
```json
{ "success": true }
```

---

## السلوك في الـ Frontend

1. عند تحميل الشاشة → `GET /tenant/branches/:branchId/services` لكل فرع
2. عند تغيير أي Switch → يُحفظ التغيير مؤقتاً (optimistic UI) ويظهر زر "حفظ التعديلات"
3. عند الضغط على الزر → يُرسل `PATCH` لكل خدمة تم تغييرها بالتوازي (`Promise.all`)
4. بعد النجاح → يختفي الزر تلقائياً

---

## ملاحظات

- إذا لم يكن `GET /tenant/branches/:branchId/services` موجوداً، الشاشة لن تعرض أي خدمات
- إذا لم يكن `PATCH /tenant/branches/:branchId/services/:serviceId` موجوداً، الحفظ سيفشل بـ 404
- الـ Frontend جاهز 100% — فقط يحتاج تأكيد وجود الـ endpoints في الـ backend
