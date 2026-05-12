# PERF-02: DashboardScreen uses ScrollView instead of FlatList

**Severity:** 🟠 High
**Component:** Lists / Rendering
**Status:** Open

---

## الوصف

`DashboardScreen` يحتوي على `ScrollView` يلف `.map()` على `pendingOrders` و `activeBikers`. عندما تنمو القائمة (10+ عناصر)، كل عنصر يُرَنْدَر في الذاكرة دون virtualization → بطء + استهلاك ذاكرة عالي.

## الأدلة (Citations)

- [src/partner/features/dashboard/DashboardScreen.js:240-259](../../src/partner/features/dashboard/DashboardScreen.js)

## التأثير

- بطء في initial render مع 20+ طلب pending
- جانك (jank) عند الـ scroll
- استهلاك ذاكرة خطي مع عدد العناصر
- لا يستفيد من virtualization

## معايير القبول

- [ ] استبدال `ScrollView + .map()` بـ `FlatList` لكل قسم له أكثر من 5 عناصر
- [ ] استخراج `OrderCard`, `BikerCard` إلى components مُنفصلة مع `React.memo`
- [ ] إضافة `keyExtractor`, `getItemLayout` (مرتبط بـ PERF-06)
- [ ] لو احتجت scroll للصفحة كلها مع قوائم متعددة: استخدم `SectionList` بدلاً من `FlatList`
- [ ] قياس قبل/بعد بـ React DevTools Profiler

## ملاحظات تقنية

```jsx
<FlatList
  data={pendingOrders}
  renderItem={renderOrderCard}
  keyExtractor={item => item._id}
  ListHeaderComponent={<StatsCards />}
  ListEmptyComponent={<EmptyState />}
  removeClippedSubviews={true}
  maxToRenderPerBatch={10}
  windowSize={10}
/>
```

- استخدام `removeClippedSubviews` على Android فقط (له bugs على iOS)
- مرتبط بـ [PERF-06](PERF-06_flatlist_getitemlayout.md), [PERF-08](PERF-08_inline_renderitem.md)
