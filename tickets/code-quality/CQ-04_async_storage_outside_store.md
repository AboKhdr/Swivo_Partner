# CQ-04: PartnerPersonalInfoScreen accesses AsyncStorage directly

**Severity:** 🟡 Medium
**Component:** State Management
**Status:** Open

---

## الوصف

`PartnerPersonalInfoScreen.js` يستدعي AsyncStorage مباشرة لقراءة/كتابة FCM token. هذا ينتهك مبدأ التغليف (encapsulation): AsyncStorage يجب أن يكون مخفياً خلف stores أو services.

## الأدلة (Citations)

- [src/partner/features/profile/PartnerPersonalInfoScreen.js:62,66](../../src/partner/features/profile/PartnerPersonalInfoScreen.js)
- في المقابل: [src/store/authStore.js](../../src/store/authStore.js) يستخدم AsyncStorage داخل الـ store فقط — هذا هو النمط الصحيح

## التأثير

- ازدواج المنطق إذا احتاج screen آخر نفس البيانات
- صعوبة تحويل التخزين لاحقاً (مثلاً إلى Keychain لـ SEC-01)
- صعوبة اختبار (mocking AsyncStorage بدلاً من mocking الـ store)
- تسرّب abstraction للـ UI layer

## معايير القبول

- [ ] إنشاء أو توسيع store/service مناسب:
  - إذا FCM token state عام: إضافته إلى `appStore.js` أو `notificationsStore.js`
  - إذا منطق محدد للـ profile: helper في `src/services/notifications.js`
- [ ] استبدال `AsyncStorage.getItem('fcm_token')` بـ `useNotifications().fcmToken` أو `getFCMToken()`
- [ ] استبدال `AsyncStorage.setItem(...)` بمثلها
- [ ] بحث المشروع لاستخدامات مماثلة:
  ```bash
  grep -rn "AsyncStorage" src/ --exclude-dir=store
  ```
- [ ] السماح بـ AsyncStorage فقط في:
  - `src/store/*.js`
  - `src/services/*.js`
- [ ] إضافة eslint rule:
  ```js
  'no-restricted-imports': ['error', {
    paths: [{
      name: '@react-native-async-storage/async-storage',
      importNames: ['default'],
      message: 'Use store or service, not direct AsyncStorage'
    }]
  }]
  ```
  مع استثناء لـ `src/store/` و `src/services/`

## ملاحظات تقنية

- بعد SEC-01 (نقل tokens إلى Keychain)، هذه المخالفة تصبح أكثر إلحاحاً
- يفضّل إنشاء hook `useFCMToken()`:
  ```js
  export function useFCMToken() {
    const [token, setToken] = useState(null);
    useEffect(() => {
      AsyncStorage.getItem('fcm_token').then(setToken);
    }, []);
    return token;
  }
  ```
  ووضعه في `src/shared/hooks/useFCMToken.js`
- مرتبط بـ [SEC-01](../security/SEC-01_token_storage.md), [SEC-12](../security/SEC-12_fcm_pii_storage.md)
