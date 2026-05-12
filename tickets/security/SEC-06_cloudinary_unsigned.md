# SEC-06: Cloudinary unsigned upload preset exposed

**Severity:** 🟠 High
**Component:** Media Upload / API
**Status:** Open

---

## الوصف

التطبيق يستخدم Cloudinary unsigned upload preset مع cloud name و preset name مدمجين في كود client. أي شخص يستخرجها (تحليل ساكن للـ APK) يستطيع رفع ملفات لحساب Cloudinary بدون مصادقة.

## الأدلة

- [src/services/cloudinary.js:1-2](../../src/services/cloudinary.js) — `cloudName: 'dxtilztvm'`, `preset: 'tteamdashboard'`
- CLAUDE.md يصرّح بأن preset غير موقّع (`unsigned preset 'tteamdashboard'`)

## التأثير

- استنزاف كوتا الرفع وزيادة الفواتير
- استضافة برمجيات خبيثة / محتوى phishing على نطاق Cloudinary موثوق
- إمكانية استبدال صور المستخدمين/الخدمات إذا لم تُربط بهوية الباك إند

## معايير القبول

- [ ] الانتقال لـ signed uploads عبر الباك إند (الباك إند يولّد signature بـ secret)
- [ ] تقييد الـ preset الحالي بـ:
  - حد أقصى للحجم
  - أنواع ملفات محصورة (image/jpeg, image/png, image/webp)
  - تفعيل moderation عند الحاجة
  - allowed formats / max dimensions
- [ ] إنشاء endpoint `POST /uploads/sign` يرجع timestamp + signature
- [ ] تعديل `uploadToCloudinary(uri)` ليستدعي الباك إند أولاً ثم Cloudinary
- [ ] (اختياري) rotation للـ cloud name الحالي وإطلاق الجديد بـ signed only

## ملاحظات تقنية

- Cloudinary signature: `SHA1(params + apiSecret)` يُحسب على الباك إند
- على الـ client يبقى `apiKey` فقط (آمن نسبياً) ويُمرَّر `signature` و `timestamp`
- CLAUDE.md يذكر أن "Profile photos go to Cloudinary first, then the returned URL is saved" — هذا التدفق يجب تغييره
