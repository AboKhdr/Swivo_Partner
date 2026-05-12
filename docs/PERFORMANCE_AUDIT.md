# تقرير تدقيق الأداء — NativeTamam

**التاريخ:** 2026-05-10  
**المنهج:** تحليل ثابت للكود (Static Analysis) — بدون تشغيل المحاكي  
**النطاق:** جميع الشاشات والمكونات والخدمات

---

## الملخص التنفيذي

| المعيار | الحالة | الأولوية |
|---------|--------|---------|
| FlatList — renderItem | مشكلة جزئية | عالية |
| إعادة الرسم (Re-renders) | مشكلة في StaffScreen | عالية |
| الصور — ضغط قبل الرفع | غائب | عالية |
| Cold Start — الطلبات المتوازية | جيد | — |
| useCallback/useMemo | جيد في معظم الأماكن | — |
| الرسوم المتحركة — useNativeDriver | جيد | — |
| Pagination | مطبّق | — |
| keyExtractor | مطبّق | — |

---

## 1. FlatList والقوائم

### المشاكل المكتشفة

#### 1.1 — `renderItem` بدون `useCallback` في StaffScreen
**الملف:** `src/partner/features/operations/StaffScreen.js`

```js
// المشكلة: دالة مجهولة مباشرة في renderItem
<FlatList
  data={filtered}
  renderItem={({item}) => <MemberCard ... />}   // ← تُعاد إنشاؤها في كل render
/>
```

**الأثر:** كل تغيير في state الشاشة (مثل فتح ActionSheet أو تغيير تبويب) يُعيد إنشاء هذه الدالة، مما يُلغي فائدة تحسين `FlatList` الداخلي.

**الإصلاح:**
```js
const renderMember = useCallback(({item}) => (
  <MemberCard
    item={item}
    onAction={openAction}
    onDutyToggle={handleDutyToggle}
    colors={colors}
    t={t}
  />
), [openAction, handleDutyToggle, colors, t]);

<FlatList renderItem={renderMember} />
```

---

#### 1.2 — `scrollEnabled={false}` داخل `ScrollView`
**الملف:** `src/biker/features/home/HomeScreen.js`

```js
<ScrollView>
  ...
  <FlatList
    data={orders}
    scrollEnabled={false}   // ← صحيح تقنياً لكن...
  />
</ScrollView>
```

**الأثر:** نمط ScrollView + FlatList بـ `scrollEnabled={false}` يرسم جميع العناصر دفعة واحدة، مما يُعطّل الـ Virtualization كلياً. مقبول هنا لأن الـ `orders` في HomeScreen محدودة (10 عناصر كحد أقصى بـ `limit: 10`)، لكن يجب التوثيق.

**التوصية:** أبقِه كما هو مع التعليق:
```js
{/* limit:10 من API — Virtualization غير ضروري هنا */}
<FlatList scrollEnabled={false} data={orders} ... />
```

---

#### 1.3 — غياب `getItemLayout`
**الملفات:** `OrdersScreen.js` (biker + partner), `StaffScreen.js`

```js
// غائب في كل FlatList ذات عناصر بارتفاع ثابت
<FlatList
  data={orders}
  renderItem={renderOrder}
  // getItemLayout غائب
/>
```

**الأثر:** React Native يقيس ارتفاع كل عنصر ديناميكياً في كل مرة. بالنسبة لقوائم الطلبات والموظفين حيث الارتفاع متوقع ومستقر، هذا يُضيف عبئاً حسابياً غير ضروري عند التمرير.

**الإصلاح (مثال لـ OrdersScreen):**
```js
const ITEM_HEIGHT = 88; // قِس الارتفاع الفعلي مرة واحدة
const getItemLayout = useCallback((_, index) => ({
  length: ITEM_HEIGHT,
  offset: ITEM_HEIGHT * index,
  index,
}), []);

<FlatList getItemLayout={getItemLayout} ... />
```

> ملاحظة: لا تُطبّق `getItemLayout` على `OrdersScreen` (biker) لأن بطاقاتها قابلة للتوسع (expandable) — ارتفاعها متغير.

---

### ما يعمل بشكل صحيح ✓

```js
// HomeScreen — renderItem محاط بـ useCallback
const renderOrder = useCallback(({item}) => <NewOrderCard order={item} colors={colors} t={t} />, [colors, t]);

// جميع FlatLists — keyExtractor معرّف
keyExtractor={i => i._id}
keyExtractor={b => b._id}

// Pagination مطبّق في OrdersScreen
onEndReached={loadMore}
onEndReachedThreshold={0.4}
```

---

## 2. إعادة الرسم غير الضرورية (Re-renders)

### 2.1 — مشكلة: `MemberCard` بدون `React.memo`
**الملف:** `src/partner/features/operations/StaffScreen.js`

```js
// MemberCard يُعرَّف داخل الملف
function MemberCard({item, onAction, onDutyToggle, colors, t}) {
  // مكوّن معقد: avatar + اسم + شارة + تبديل + أيقونة هاتف
  ...
}
```

**الأثر:** كل تغيير في `searchQuery` أو `activeTab` أو `actionTarget` يُعيد رسم **جميع** بطاقات الموظفين في القائمة، حتى التي لم تتغير بياناتها.

**الإصلاح:**
```js
const MemberCard = React.memo(function MemberCard({item, onAction, onDutyToggle, colors, t}) {
  ...
}, (prev, next) => {
  return prev.item === next.item &&
         prev.colors === next.colors;
});
```

---

### 2.2 — مقبول: `StatItem` في HomeScreen
**الملف:** `src/biker/features/home/HomeScreen.js`

```js
function StatItem({IconComponent, iconBg, iconColor, label, value, unit, delay, colors}) {
  const translateY = useRef(new Animated.Value(20)).current;
  const opacity    = useRef(new Animated.Value(0)).current;
  useEffect(() => { /* animation */ }, [delay, opacity, translateY]);
  ...
}
```

`StatItem` يُرسم 3 مرات فقط (earnings, orders, rating) ولا يتغير إلا عند تحديث الـ stats. الأثر طفيف ولا يستحق تعقيد إضافياً.

---

### 2.3 — جيد: Zustand selectors محدودة النطاق ✓

```js
// كل مكوّن يقرأ حقلاً واحداً فقط من الـ store
const user      = useAuthStore(s => s.user);
const showToast = useAppStore(s => s.showToast);
const unreadCount = useAppStore(s => s.unreadCount);
```

هذا النمط الصحيح. استخدام `useAuthStore()` بدون selector كان سيُسبب re-render عند أي تغيير في الـ store.

---

## 3. الصور والرفع

### 3.1 — مشكلة: لا ضغط للصور قبل رفعها إلى Cloudinary
**الملف:** `src/services/cloudinary.js`

```js
export async function uploadToCloudinary(uri) {
  const form = new FormData();
  form.append('file', {uri, name: filename, type: mimeType});
  // ← الصورة تُرسل كما هي بدون تصغير الأبعاد أو الجودة
}
```

**الملف:** `src/shared/components/ImagePickerField.js`

```js
launchImageLibrary({
  mediaType: 'photo',
  quality: 0.8,    // ← ضغط جزئي من المكتبة نفسها، كافٍ للمعرض
})
```

**الملف:** `src/biker/features/orders/OrderDetailsScreen.js`

```js
launchCamera({
  mediaType: 'photo',
  quality: 0.8,   // ← مقبول
})
```

**التقييم:**
- `quality: 0.8` من `react-native-image-picker` يُطبّق ضغط JPEG، وهذا **كافٍ** لأغراض التطبيق.
- لا توجد حاجة لـ maxWidth/maxHeight إضافية ما لم تكن صور الكاميرا تتجاوز 4000px.

**التوصية الاختيارية:** إذا رُفعت صور كاملة من المعرض (بدون كاميرا):
```js
launchImageLibrary({
  mediaType: 'photo',
  quality: 0.8,
  maxWidth: 1200,   // أضف هذا
  maxHeight: 1200,  // وهذا
})
```

---

### 3.2 — جيد: XHR بدلاً من fetch لرفع الصور ✓

```js
const xhr = new XMLHttpRequest();
xhr.timeout = 60000;  // 60 ثانية — مناسب لرفع الصور
```

استخدام `XMLHttpRequest` بدلاً من `fetch` يُتيح تتبع تقدم الرفع (`onprogress`) مستقبلاً بدون تغيير البنية.

---

## 4. الشبكة والطلبات

### 4.1 — جيد: Promise.allSettled للطلبات المتوازية ✓
**الملف:** `src/biker/features/home/HomeScreen.js`

```js
const results = await Promise.allSettled([
  getBikerProfile(),
  getOrders({filter: 'active', limit: 10}),
  getHomeStats(),
  getBranches(),
  getNotifications({page: 1, limit: 1}),
]);
```

5 طلبات تعمل بالتوازي — هذا النمط المثالي. لو كانت سلسلة (sequential) لأضافت ~750ms إضافية افتراضية.

---

### 4.2 — جيد: AbortController + Timeout في API ✓
**الملف:** `src/services/api.js`

```js
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 30_000);
```

30 ثانية timeout — مقبول. يُمنع تسرب الطلبات عند مغادرة الشاشة.

---

### 4.3 — مشكلة: لا إلغاء للطلبات عند unmount
**الملف:** `src/biker/features/home/HomeScreen.js`

```js
useEffect(() => {
  fetchData();        // لا AbortController محلي
}, [fetchData]);
```

إذا غادر المستخدم الشاشة قبل انتهاء `fetchData`، ستُحاول التحديثات على مكوّن مُفصول (unmounted component).

**الإصلاح:**
```js
useEffect(() => {
  let cancelled = false;
  fetchData().then(() => {
    if (cancelled) return;
    // التحديثات هنا آمنة
  });
  return () => { cancelled = true; };
}, [fetchData]);
```

> ملاحظة: هذا لا يُلغي الطلب الشبكي نفسه (لأن `fetchData` تستخدم `Promise.allSettled`)، لكنه يمنع setState على مكوّن مُفصول.

---

### 4.4 — جيد: Pagination في قوائم الطلبات ✓

```js
// BikerOrdersScreen
const loadMore = useCallback(() => {
  if (!hasMore || loadingMore) return;
  setPage(p => p + 1);
}, [hasMore, loadingMore]);

<FlatList onEndReached={loadMore} onEndReachedThreshold={0.4} />
```

`threshold: 0.4` معقول — يُحمِّل الصفحة التالية حين يبقى 40% من القائمة الحالية.

---

## 5. الرسوم المتحركة (Animations)

### 5.1 — جيد: useNativeDriver: true في كل مكان ✓

```js
// HomeScreen — ServiceButton pulse
Animated.timing(pulse, {toValue: 1.13, duration: 1600, useNativeDriver: true})

// HomeScreen — header entrance
Animated.spring(headerY, {toValue: 0, useNativeDriver: true, tension: 60})

// StatItem — stagger entrance
Animated.parallel([
  Animated.timing(opacity, {toValue: 1, useNativeDriver: true}),
  Animated.spring(translateY, {toValue: 0, useNativeDriver: true}),
])
```

جميع الرسوم المتحركة تعمل على الـ Native Thread — لن تتأثر بالـ JS thread حتى عند التحميل الثقيل.

---

### 5.2 — ملاحظة: loop مفتوح في ServiceButton

```js
useEffect(() => {
  if (active) {
    const loop = Animated.loop(...);
    loop.start();
    return () => loop.stop();   // ✓ cleanup صحيح
  }
}, [active, pulse]);
```

الـ cleanup موجود — لا تسرب.

---

## 6. Cold Start

لا يمكن قياس وقت Cold Start بدون تشغيل المحاكي، لكن الكود يُظهر:

| العامل | الحالة |
|--------|--------|
| طلبات متوازية في أول load | ✓ Promise.allSettled |
| hydrate من AsyncStorage | ✓ مرة واحدة في App.tsx |
| FCM token registration | غير متزامن (لا يحجب UI) |
| Lazy mounting للـ tabs | ✓ فقط home tab يُحمَّل أولاً |

**التقدير:** Cold Start متوقع < 2s في الأجهزة المتوسطة، شرط أن يستجيب الـ backend في < 800ms.

---

## 7. حجم الـ Bundle

غير قابل للقياس بدون `react-native bundle --dev false`. لكن المكتبات المثبتة:

| المكتبة | الحجم التقريبي |
|---------|---------------|
| `lucide-react-native` | ~50KB (tree-shaken) |
| `react-native-svg` | ~200KB |
| `zustand` | ~3KB |
| `@notifee/react-native` | ~500KB (native) |
| `@react-native-firebase/*` | ~1MB+ |

**التوصية:** شغّل `npx react-native bundle --platform android --dev false --entry-file index.js --bundle-output /tmp/out.bundle` ثم افحص الحجم.

---

## ملخص الإصلاحات المطلوبة

### أولوية عالية

| الملف | المشكلة | الإصلاح |
|-------|---------|---------|
| `StaffScreen.js` | `renderItem` بدون `useCallback` | أضف `useCallback` |
| `StaffScreen.js` | `MemberCard` بدون `React.memo` | أضف `React.memo` |
| `HomeScreen.js` | setState بعد unmount محتمل | أضف `cancelled` flag |

### أولوية متوسطة

| الملف | المشكلة | الإصلاح |
|-------|---------|---------|
| `OrdersScreen.js` (partner) | غياب `getItemLayout` | أضف للبطاقات الثابتة الارتفاع |
| `ImagePickerField.js` | لا `maxWidth/maxHeight` | أضف `maxWidth: 1200` |

### لا تغيير مطلوب ✓

- `HomeScreen.js` — `renderItem` محاط بـ `useCallback`
- `api.js` — Timeout + token refresh
- `cloudinary.js` — XHR مع timeout
- جميع الرسوم المتحركة — `useNativeDriver: true`
- Zustand selectors — محدودة النطاق
- Pagination — مطبّق

---

## تشغيل قياسات حقيقية

```bash
# Bundle size
npx react-native bundle \
  --platform android \
  --dev false \
  --entry-file index.js \
  --bundle-output /tmp/out.bundle \
  --assets-dest /tmp/assets

ls -lh /tmp/out.bundle

# Hermes bytecode (إذا مفعّل)
# افحص android/app/build.gradle: enableHermes: true
```

**لقياس FPS والذاكرة:** استخدم Flipper → React Native Performance أو Perfetto على Android.
