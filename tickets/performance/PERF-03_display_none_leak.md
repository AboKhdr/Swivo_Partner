# PERF-03: display:'none' navigation pattern keeps 11+ screens mounted

**Severity:** 🟠 High
**Component:** Navigation / Memory
**Status:** Open

---

## الوصف

النمط الموثّق في CLAUDE.md (`display:'none'` + BackHandler) يُبقي جميع الشاشات mounted في الذاكرة حتى عند الانتقال. مع 11+ شاشة بين biker و partner navigators، هذا يعني:
- listeners (Firebase, network) نشطة في الخلفية
- صور مُحمّلة في الذاكرة
- timers/intervals لا تُلغى

النمط ممتاز للسرعة لكنه باهظ للذاكرة.

## الأدلة (Citations)

- [src/biker/navigation/AppNavigator.js](../../src/biker/navigation/AppNavigator.js)
- [src/partner/navigation/PartnerNavigator.js](../../src/partner/navigation/PartnerNavigator.js)
- [src/biker/features/orders/OrdersNavigator.js](../../src/biker/features/orders/OrdersNavigator.js) و آخرون
- CLAUDE.md يوثّق النمط كقاعدة قياسية

## التأثير

- استهلاك ذاكرة 80-150 MB على أجهزة منخفضة الموارد (Android Go)
- crashes (OOM) محتملة بعد طويل استخدام
- listeners تُشغّل re-renders لشاشات غير مرئية
- بطارية أعلى بسبب timers خلفية

## معايير القبول

- [ ] تحليل: ما الشاشات التي تحتاج state حياً عند العودة (Orders قائمة)، وما لا (Terms, Support)؟
- [ ] للشاشات الثقيلة (Maps, Image-heavy): استخدام render شرطي بدلاً من `display:'none'`:
  ```jsx
  {screen === 'map' ? <MapScreen /> : null}
  ```
- [ ] للشاشات الخفيفة: الإبقاء على `display:'none'` لكن إضافة `useFocusEffect` (من react-navigation) لإلغاء listeners عند blur
- [ ] إيقاف Firebase listeners في الشاشات غير المرئية
- [ ] قياس قبل/بعد عبر Android Studio Profiler
- [ ] مع PERF-11: useFocusEffect لتعليق i18n re-renders

## ملاحظات تقنية

- بديل: استخدام `lazy: true` في navigator props ليُرَنْدَر المكوّن مرة واحدة عند أول زيارة
- بديل آخر: حالة hybrid — الـ tab الحالي + tab الأخير يبقيان mounted، الباقي unmounted
- مرتبط بـ CLAUDE.md - **تعديل النمط الموثّق يحتاج تنسيق مع الفريق**
- على Android 8+ يمكن استخدام `Process.killProcess` كحل أخير لكنه عدواني
