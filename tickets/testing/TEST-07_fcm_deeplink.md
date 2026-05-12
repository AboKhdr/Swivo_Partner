# TEST-07: No tests for FCM deep-link routing

**Severity:** 🟡 Medium
**Component:** Notifications
**Status:** Open

---

## الوصف

`__tests__/device/deviceCapabilities.test.js` (57 tests) يغطي:
- FCM token registration ✅
- channel creation ✅
- foreground/background handlers ✅

لكن يفتقد:
- تحليل payload notification → استخراج orderId
- routing من notification tap إلى شاشة محددة
- التعامل مع notification عند التطبيق مغلق
- token refresh عند logout/login
- الـ unread badge sync

## الأدلة (Citations)

- [__tests__/device/deviceCapabilities.test.js](../../__tests__/device/deviceCapabilities.test.js)
- [src/store/appStore.js](../../src/store/appStore.js) — يحتوي `pendingNav` للـ notification routing
- [src/shared/context/FirebaseContext.js](../../src/shared/context/FirebaseContext.js)

## التأثير

- bug: notification tap لا يفتح الطلب الصحيح
- bug: token قديم يتلقى إشعارات مستخدم جديد
- bug: badge count لا يتزامن
- تجربة سيئة عند flows حرجة (إشعار طلب جديد)

## معايير القبول

- [ ] اختبارات إضافية في `deviceCapabilities.test.js` أو ملف جديد `__tests__/notifications/`:
  - [ ] parse payload `{orderId, type: 'NEW_ORDER'}` → يستخرج orderId
  - [ ] notification tap في foreground → ينقل لـ OrderDetails مباشرة
  - [ ] notification tap في background → يحفظ في `pendingNav`
  - [ ] launch from notification (التطبيق مغلق) → يقرأ initialNotification
  - [ ] logout → `messaging().deleteToken()` يُستدعى + backend unregister
  - [ ] login مختلف → token جديد يُسجَّل
  - [ ] unreadCount يزداد على notification + يتراجع على mark-as-read
- [ ] مثال:
  ```js
  describe('FCM deep-link routing', () => {
    it('extracts orderId from notification data', async () => {
      const payload = {
        notification: {title: 'طلب جديد'},
        data: {orderId: 'order_123', type: 'NEW_ORDER'},
      };
      
      const handler = onMessageHandler();
      await handler(payload);
      
      expect(useAppStore.getState().pendingNav).toEqual({
        screen: 'OrderDetails',
        params: {orderId: 'order_123'},
      });
    });
    
    it('clears FCM token on logout', async () => {
      await useAuthStore.getState().clearSession();
      expect(messaging().deleteToken).toHaveBeenCalled();
      expect(api.post).toHaveBeenCalledWith('/notifications/unregister', expect.any(Object));
    });
  });
  ```

## ملاحظات تقنية

- mock `@react-native-firebase/messaging` بالكامل (موجود في `jest.setup.js` على الأرجح)
- استخدام `messaging.onMessage`, `onNotificationOpenedApp`, `getInitialNotification`
- مرتبط بـ [SEC-12](../security/SEC-12_fcm_pii_storage.md)
- توثيق payload contracts في `FIREBASE_NOTIFICATIONS.md`
