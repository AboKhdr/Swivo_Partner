# TEST-02: Missing auth edge cases

**Severity:** 🟠 High
**Component:** Authentication
**Status:** Open

---

## الوصف

`__tests__/services/auth.test.js` (15 tests) يغطي المسار السعيد و bعض الحالات الأساسية، لكن يفتقد:
- انتهاء صلاحية OTP (timeout)
- OTP resend cooldown
- محاولات OTP خاطئة متعددة
- JWT decode errors (malformed token)
- token expiry قبل الاستخدام
- concurrent refresh attempts

## الأدلة (Citations)

- [__tests__/services/auth.test.js](../../__tests__/services/auth.test.js) — 15 tests الحالية
- [src/services/auth.js](../../src/services/auth.js)
- [src/services/api.js:76-101](../../src/services/api.js) — attemptRefresh logic

## التأثير

- bugs محتملة في الإنتاج عند سيناريوهات نادرة
- مستخدمون قد يَعلقون في حلقات إعادة محاولة
- token قديم قد يُرسل وينتج 401 متكرر
- صعوبة debug عند فشل auth في الإنتاج

## معايير القبول

- [ ] إضافة اختبارات لـ:
  - [ ] OTP expiry: استدعاء `verifyOTP` بعد timeout → يجب أن يُرجع خطأ واضح
  - [ ] OTP retry limit: 5 محاولات فاشلة → lockout
  - [ ] resend cooldown: استدعاء `resendOTP` خلال 30 ثانية → يجب refuse
  - [ ] JWT malformed: استجابة token غريبة → handle gracefully (لا crash)
  - [ ] JWT expired locally: قبل استخدام، فحص exp claim
  - [ ] concurrent refresh: استدعاءان متزامنان → فقط واحد يُنفّذ
  - [ ] refresh failed: استجابة 401 من /auth/refresh → clear session
- [ ] استخدام `jest.useFakeTimers()` للسيناريوهات الزمنية
- [ ] أمثلة:
  ```js
  describe('verifyOTP edge cases', () => {
    it('handles expired OTP', async () => {
      jest.useFakeTimers();
      api.post.mockResolvedValueOnce({success: false, error: 'OTP_EXPIRED'});
      const result = await verifyOTP('1234');
      expect(result.success).toBe(false);
      expect(result.error).toBe('OTP_EXPIRED');
    });
    
    it('handles malformed JWT', async () => {
      api.post.mockResolvedValueOnce({
        success: true, 
        data: {token: 'not.a.jwt', user: {}}
      });
      const result = await verifyOTP('1234');
      // الكود يجب ألا ينهار، حتى لو token غير صالح
      expect(result.success).toBe(true);
    });
  });
  ```
- [ ] هدف: 25+ اختبار في auth.test.js (من 15)

## ملاحظات تقنية

- إضافة `jwt-decode` للتحقق المحلي من exp قبل API call
- استخدام shared Promise للـ refresh لمنع concurrent calls:
  ```js
  let refreshPromise = null;
  async function attemptRefresh() {
    if (refreshPromise) return refreshPromise;
    refreshPromise = doRefresh();
    refreshPromise.finally(() => { refreshPromise = null; });
    return refreshPromise;
  }
  ```
- مرتبط بـ [SEC-08](../security/SEC-08_refresh_token.md), [SEC-11](../security/SEC-11_otp_rate_limiting.md)
