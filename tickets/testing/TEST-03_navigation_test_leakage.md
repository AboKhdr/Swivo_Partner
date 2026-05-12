# TEST-03: Navigation tests have state leakage (125 tests flaky)

**Severity:** 🟠 High
**Component:** Navigation Tests
**Status:** Open

---

## الوصف

`__tests__/navigation/navigation.test.js` يحتوي 125 اختبار يمرّ عند التشغيل بمعزل، لكن يفشل عند التشغيل كجزء من السوّيت الكاملة. السبب على الأرجح:
- state leakage بين `describe` blocks (Zustand persistence)
- BackHandler listeners لا تُنظَّف
- React Test Renderer state يتسرّب

هذا يمنع تفعيل CI (TEST-01).

## الأدلة (Citations)

- [__tests__/navigation/navigation.test.js](../../__tests__/navigation/navigation.test.js)
- موثّق في `docs/TESTING.md:195` (حسب التقرير)
- `docs/NAVIGATION_TESTS.md` يشرح BackHandler mocking

## التأثير

- استحالة تشغيل `npm test` بالكامل بنجاح
- CI سيفشل دائماً (TEST-01)
- المطورون يفقدون الثقة في الاختبارات
- إخفاء regressions حقيقية وراء flakiness

## معايير القبول

- [ ] التشخيص:
  ```bash
  npm test -- --runInBand --verbose navigation.test.js
  ```
- [ ] إضافة `beforeEach` لكل describe block:
  ```js
  beforeEach(() => {
    // Reset Zustand stores
    useAuthStore.setState(useAuthStore.getInitialState());
    useOrdersStore.setState(useOrdersStore.getInitialState());
    
    // Clear AsyncStorage mock
    AsyncStorage.clear();
    
    // Clear BackHandler listeners
    BackHandler.removeAllEventListeners?.();
  });
  ```
- [ ] إضافة `afterEach`:
  ```js
  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    cleanup(); // من @testing-library/react-native
  });
  ```
- [ ] التحقق من Zustand stores: هل يحتوي على `getInitialState`؟ إن لا، إضافته
- [ ] التحقق من custom hooks المستخدمة في navigation: تنظيف أي subscriptions
- [ ] استخدام `--runInBand` كحل مؤقت في CI إذا استمرت المشكلة
- [ ] هدف: 125 test يمرّ في `npm test` كامل بدون flakiness
- [ ] إزالة `describe.skip` المؤقتة إن وُجدت

## ملاحظات تقنية

- Zustand لا يحتوي `getInitialState` افتراضياً — يجب تنفيذه يدوياً:
  ```js
  const initialState = {user: null, token: null, role: null};
  const useAuthStore = create((set) => ({
    ...initialState,
    // ...actions
  }));
  useAuthStore.getInitialState = () => initialState;
  ```
- استخدام `jest.isolateModules` للاختبارات الحرجة
- مكتبة `jest-each` مفيدة لتقليل التكرار
- توثيق التشخيص في `docs/FLAKY_TESTS.md`
