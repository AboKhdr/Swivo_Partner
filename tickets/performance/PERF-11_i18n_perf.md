# PERF-11: Audit high-frequency t() calls (currently OK)

**Severity:** 🟢 Low
**Component:** i18n
**Status:** Open (Verification only)

---

## الوصف

`useI18n().t()` في `src/shared/i18n/I18nContext.js` مُعَمَّم بـ `useCallback([lang])` ولكنه يُستدعى داخل كل render. القاموس JSON يُحمَّل في module level (مُخزَّن مؤقتاً ✅). الأداء حالياً مقبول لكن يجب التحقق من عدم وجود استدعاءات داخل loops/maps.

## الأدلة (Citations)

- [src/shared/i18n/I18nContext.js:41-50](../../src/shared/i18n/I18nContext.js) — `t()` مُعَمَّم
- [src/shared/i18n/locales/](../../src/shared/i18n/locales/) — locales في module imports

## التأثير

- إذا تم استدعاء `t()` داخل loop كبير (100+ عنصر) كل render، قد ينشأ bottleneck
- حالياً لا يوجد دليل على المشكلة، فقط verification

## معايير القبول

- [ ] بحث استخدامات داخل loops:
  ```bash
  grep -rn "\.map\|\.forEach\|for (\|while (" src/ -A 5 | grep "t("
  ```
- [ ] إذا وُجد: استخدام `useMemo` للنتائج
  ```jsx
  const labels = useMemo(() => statuses.map(s => t(`orders.status.${s}`)), [statuses, t]);
  ```
- [ ] قياس FPS عند الشاشات الكثيفة بالنصوص
- [ ] التحقق: locale JSON يُحمَّل مرة واحدة لا مرة لكل render
- [ ] لا حاجة لتغيير إذا لا توجد bottlenecks

## ملاحظات تقنية

- `t()` الحالية بسيطة (lookup في object) → سريعة جداً
- البديل لو وُجدت مشكلة: i18next مع caching داخلي
- مرتبط بـ [PERF-03](PERF-03_display_none_leak.md) — `useFocusEffect` يمنع re-renders لشاشات مخفية
