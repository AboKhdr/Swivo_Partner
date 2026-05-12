# TEST-04: No screen-level integration tests

**Severity:** 🟠 High
**Component:** UI Integration
**Status:** Open

---

## الوصف

الاختبارات الحالية تركّز على services و stores (excellent ✅) لكنها تتجاهل UI screens. لا توجد integration tests تتحقق من:
- نقر زر "قبول" → ينتقل الطلب إلى ACCEPTED
- التقاط صورة → تظهر في القائمة
- تطبيق فلتر → القائمة تنحدر
- تسجيل الدخول → ينتقل للشاشة الرئيسية

`docs/TESTING.md` يوثّق هذا كقرار واعي ("brittle, require simulator") لكن النتيجة: regressions UI لا يتم كشفها.

## الأدلة (Citations)

- [__tests__/](../../__tests__/) — لا يحتوي `screens/` أو `integration/`
- وثائق `docs/TESTING.md` تشرح القرار

## التأثير

- bugs UI تُكتشف فقط يدوياً → بطء
- regressions في الـ flow الأساسي ممكنة
- صعوبة re-factoring بثقة
- لا يوجد دليل على أن مكوّن مُجزّأ (بعد CQ-01) يعمل كما السابق

## معايير القبول

- [ ] تثبيت `@testing-library/react-native` (إذا غير مثبتة)
- [ ] إنشاء `__tests__/screens/` بـ tests للـ flows الحرجة:
  - [ ] `auth_flow.test.js`: login → OTP → main screen
  - [ ] `biker_order_accept.test.js`: تصفّح القائمة → فتح تفاصيل → swipe to accept → حالة جديدة
  - [ ] `partner_assign_biker.test.js`: pending order → accept → assign biker → ASSIGNED
  - [ ] `partner_reject_order.test.js`: pending → reject modal → submit → بوست
  - [ ] `onshop_complete_flow.test.js`: accept → start photo → finish photos → complete
- [ ] استخدام `userEvent` من testing-library:
  ```js
  import {render, screen} from '@testing-library/react-native';
  import userEvent from '@testing-library/user-event';
  
  test('accept order flow', async () => {
    render(<OrderDetailsScreen order={mockOrder} onBack={jest.fn()} />);
    const user = userEvent.setup();
    
    await user.press(screen.getByText('قبول الطلب'));
    
    expect(api.post).toHaveBeenCalledWith(`/tenant/orders/${mockOrder._id}/accept`);
    expect(await screen.findByText('بدء الغسيل والتقاط صورة')).toBeOnTheScreen();
  });
  ```
- [ ] هدف: 20+ integration tests للـ flows الحرجة
- [ ] لا تكتب tests لكل شاشة — فقط الـ flows
- [ ] لا تستخدم snapshots (brittle)

## ملاحظات تقنية

- الاختبارات يجب أن تكون behavioral، ليست implementation-detail
- استخدام MSW (Mock Service Worker) لـ API mocking على مستوى الـ network
- E2E tests (Detox) خيار مكلف لكن قوي للـ flows الأهم — اعتبر لاحقاً
- مرتبط بـ [CQ-01](../code-quality/CQ-01_oversized_files.md) — مكوّنات صغيرة أسهل في الاختبار
- يفضّل بدء بـ flow واحد كـ POC قبل التوسّع
