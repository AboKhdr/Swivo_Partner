# CQ-01: Oversized files (>500 lines)

**Severity:** 🟠 High
**Component:** Maintainability
**Status:** Open

---

## الوصف

ثلاثة ملفات تتجاوز 500 سطر، مما يجعلها صعبة الصيانة، الـ code review، والتطوير المتوازي:

| الملف | الأسطر |
|---|---|
| [src/partner/features/orders/OrderDetailsScreen.js](../../src/partner/features/orders/OrderDetailsScreen.js) | 743 |
| [src/biker/features/orders/OrderDetailsScreen.js](../../src/biker/features/orders/OrderDetailsScreen.js) | 587 |
| [src/partner/features/operations/OffersScreen.js](../../src/partner/features/operations/OffersScreen.js) | 678 |

## الأدلة (Citations)

- partner OrderDetailsScreen: يحتوي على `PhotoConfirmModal`, `SwipeButton`-like logic, timeline rendering, footer logic, AssignBiker modal, RejectOrder modal — كل ذلك في ملف واحد
- biker OrderDetailsScreen: يحتوي step images, photo upload modal, summary card, state machine logic
- OffersScreen: CRUD كامل للعروض في ملف واحد

## التأثير

- صعوبة code review (diff كبير)
- تعارضات Git متكررة عند العمل المتوازي
- صعوبة كتابة unit tests للأجزاء الفرعية
- صعوبة فهم المنطق للمطورين الجدد
- إعادة استخدام أصعب

## معايير القبول

### partner/OrderDetailsScreen.js (الأولوية)
- [ ] استخراج `PhotoConfirmModal` إلى `src/partner/features/orders/components/PhotoConfirmModal.js`
- [ ] استخراج `Timeline` إلى `src/partner/features/orders/components/OrderTimeline.js`
- [ ] استخراج `Footer` (Accept/Reject/Assign/Camera) إلى `src/partner/features/orders/components/OrderActionsFooter.js`
- [ ] استخراج `CustomerCard`, `CarCard`, `PaymentCard` إلى components فرعية
- [ ] الهدف: الملف الرئيسي < 250 سطر

### biker/OrderDetailsScreen.js
- [ ] استخراج `ImageUploadModal` إلى مكوّن منفصل
- [ ] استخراج `SummaryCard` إلى مكوّن منفصل
- [ ] استخراج `StatusActionsFooter`
- [ ] استخراج `SwipeButton` إلى `src/shared/components/SwipeButton.js` (سيُعاد استخدامه)
- [ ] الهدف: < 250 سطر

### partner/operations/OffersScreen.js
- [ ] فصل CRUD operations إلى hook مخصص `useOffers.js`
- [ ] استخراج `OfferFormModal` إلى ملف منفصل
- [ ] استخراج `OfferCard` إلى مكوّن منفصل
- [ ] الهدف: < 300 سطر

## ملاحظات تقنية

- الحفاظ على نفس الـ API الخارجي (props) لتجنّب تعديل الـ navigators
- استخدام barrel exports عبر `index.js` في كل feature folder
- بعد التجزئة: قياس bundle size — قد يقلّل بفضل tree-shaking
- مرتبط بـ [TEST-04](../testing/TEST-04_screen_tests_missing.md) — مكونات صغيرة قابلة للاختبار بسهولة
