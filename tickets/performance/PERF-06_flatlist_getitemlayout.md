# PERF-06: 18 FlatLists missing getItemLayout

**Severity:** 🟡 Medium
**Component:** Lists / Rendering
**Status:** Open

---

## الوصف

18 ملف يستخدم FlatList دون `getItemLayout`. هذا يجبر RN على حساب ارتفاع كل عنصر ديناميكياً عند الـ scroll → jank على الأجهزة الضعيفة + سوء أداء عند `scrollToIndex`.

## الأدلة (Citations)

- جميع شاشات القوائم في `src/biker/features/` و `src/partner/features/`
- بحث: `grep -rn "FlatList" src/` يُظهر 18 استخداماً
- لا واحد منها يستخدم `getItemLayout`

## التأثير

- jank عند الـ scroll السريع
- `scrollToIndex` بطيء (يحتاج render تدريجي للوصول)
- معدل الإطارات (FPS) ينخفض إلى 45-50 مع 50+ عنصر
- استهلاك CPU أعلى من اللازم

## معايير القبول

- [ ] لكل `FlatList`: إضافة `getItemLayout` إذا كان ارتفاع العنصر ثابت
  ```jsx
  const ITEM_HEIGHT = 120;
  
  <FlatList
    data={orders}
    renderItem={renderItem}
    keyExtractor={keyExtractor}
    getItemLayout={(_, index) => ({
      length: ITEM_HEIGHT,
      offset: ITEM_HEIGHT * index,
      index,
    })}
  />
  ```
- [ ] للعناصر بارتفاع متغير: استخدام `onLayout` لتخزين الارتفاعات في Map، أو استخدام `FlashList` من Shopify (أسرع بكثير)
- [ ] إضافة:
  - `initialNumToRender={10}` بدلاً من الافتراضي 10
  - `maxToRenderPerBatch={10}`
  - `windowSize={5}` (الافتراضي 21 — مبالغ)
  - `removeClippedSubviews={true}` (Android فقط)
- [ ] قياس FPS قبل/بعد عبر Flipper

## ملاحظات تقنية

- البديل الأكثر تطوراً: استبدال FlatList بـ `@shopify/flash-list` — أسرع 5-10x ولا يحتاج getItemLayout
- التثبيت يتطلب pod install
- مرتبط بـ [PERF-02](PERF-02_scrollview_lists.md), [PERF-07](PERF-07_fastimage.md)

```jsx
import {FlashList} from '@shopify/flash-list';

<FlashList
  data={orders}
  renderItem={renderItem}
  estimatedItemSize={120}
/>
```
