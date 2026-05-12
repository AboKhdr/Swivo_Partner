# PERF-08: Inline renderItem in HomeScreen branch picker

**Severity:** 🟡 Medium
**Component:** Re-renders
**Status:** Open

---

## الوصف

`HomeScreen.js` يحتوي على FlatList بـ `renderItem` كـ inline anonymous function. كل مرة يُعاد render للوالد، يُنشَأ function جديدة → جميع العناصر تُعاد render حتى مع `React.memo`.

## الأدلة (Citations)

- [src/biker/features/home/HomeScreen.js:133-139](../../src/biker/features/home/HomeScreen.js)
- المقارنة: [src/partner/features/orders/OrdersScreen.js:184-186](../../src/partner/features/orders/OrdersScreen.js) — يستخدم `useCallback` بشكل صحيح

## التأثير

- re-renders زائدة في القوائم
- FPS أقل عند نقر أي زر في الوالد
- استهلاك CPU/بطارية أعلى

## معايير القبول

- [ ] استخراج `renderItem` إلى `useCallback`:
  ```jsx
  const renderItem = useCallback(({item}) => (
    <BranchCard 
      branch={item}
      isSelected={item._id === selectedBranchId}
      onSelect={handleSelectBranch}
    />
  ), [selectedBranchId, handleSelectBranch]);
  ```
- [ ] استخراج `keyExtractor`:
  ```jsx
  const keyExtractor = useCallback(item => item._id, []);
  ```
- [ ] الـ `BranchCard` يجب أن يكون `React.memo`
- [ ] الـ handlers الممرَّرة (`onSelect`) أيضاً `useCallback`
- [ ] مسح المشروع كاملاً لأنماط مماثلة:
  ```bash
  grep -rn "renderItem={({" src/ | grep -v "useCallback"
  ```

## ملاحظات تقنية

- إضافة eslint rule:
  ```js
  'react-perf/jsx-no-new-function-as-prop': 'warn'
  ```
- البديل الأكثر متانة: استخدام `useMemo` للقائمة كاملة عند الـ dependencies الثابتة
- React DevTools Profiler يكشف هذه الأنماط بسهولة
- مرتبط بـ [PERF-02](PERF-02_scrollview_lists.md), [PERF-06](PERF-06_flatlist_getitemlayout.md)
