# TEST-05: No race condition tests for concurrent operations

**Severity:** 🟠 High
**Component:** Concurrency
**Status:** Open

---

## الوصف

التطبيق يحتوي على عمليات متزامنة محتملة:
- مدير يقبل طلب + يعيّن بايكر في نفس الوقت (سباق)
- بايكر يقبل + الطلب يُلغى من المدير
- refresh token متوازي من tabs/screens متعددة
- API call مع timeout + retry → استجابتان متأخّرتان

لا توجد اختبارات لهذه السيناريوهات → bugs في الإنتاج محتملة.

## الأدلة (Citations)

- [__tests__/store/ordersStore.test.js](../../__tests__/store/ordersStore.test.js) — 31 tests، لا واحدة منها race
- [src/services/api.js:76-101](../../src/services/api.js) — refresh logic بدون Promise sharing

## التأثير

- double-spend bugs (بايكران مُعيَّنان لنفس الطلب)
- state inconsistency بين stores
- crashes غير متوقعة
- صعوبة debug في الإنتاج (race يحدث 1% من الوقت)

## معايير القبول

- [ ] إضافة اختبارات race في `ordersStore.test.js`:
  ```js
  describe('Race conditions', () => {
    it('handles concurrent assignBiker calls', async () => {
      const [r1, r2] = await Promise.all([
        assignBiker('order_1', 'biker_A'),
        assignBiker('order_1', 'biker_B'),
      ]);
      // فقط واحد يجب أن ينجح، أو كلاهما idempotent
      expect([r1.success, r2.success].filter(Boolean).length).toBeLessThanOrEqual(1);
    });
    
    it('handles assign-then-cancel race', async () => {
      const assignPromise = assignBiker('order_1', 'biker_A');
      const cancelPromise = cancelOrder('order_1');
      const [assignRes, cancelRes] = await Promise.all([assignPromise, cancelPromise]);
      // الـ state النهائي يجب أن يكون متّسقاً
      const final = await getOrderById('order_1');
      expect(final.data.status).toMatch(/CANCELLED|ASSIGNED/);
    });
  });
  ```
- [ ] في `api.test.js`: اختبار concurrent refresh:
  ```js
  it('shares refresh promise across concurrent 401s', async () => {
    let refreshCallCount = 0;
    fetch.mockImplementation(url => {
      if (url.includes('/refresh')) refreshCallCount++;
      return Promise.resolve({ok: true, json: () => ({token: 'new'})});
    });
    
    await Promise.all([api.get('/a'), api.get('/b'), api.get('/c')]);
    // كل الطلبات تشترك في refresh واحد
    expect(refreshCallCount).toBe(1);
  });
  ```
- [ ] اختبارات للـ timeout + late response
- [ ] اختبارات لـ AbortController في unmount

## ملاحظات تقنية

- استخدام `jest.useFakeTimers({advanceTimers: true})` للتحكم بالـ async
- مكتبة `@xstate/test` مفيدة لـ state machine testing
- التطبيقات الحرجة تستخدم property-based testing (`fast-check`) لكشف edge cases
- مرتبط بـ [TEST-02](TEST-02_auth_edge_cases.md), [CQ-06](../code-quality/CQ-06_inconsistent_response_handling.md)
