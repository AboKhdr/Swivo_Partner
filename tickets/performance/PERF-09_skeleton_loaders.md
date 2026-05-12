# PERF-09: ActivityIndicator everywhere; no skeleton loaders

**Severity:** 🟡 Medium
**Component:** UX / Perceived Performance
**Status:** Open

---

## الوصف

جميع شاشات التطبيق تعرض `<ActivityIndicator>` (دائرة دوّارة) أثناء التحميل. هذا مقبول لكن:
- لا يعطي إحساساً بالتقدم
- يُظهر "التطبيق مُجمَّد"
- على شبكات بطيئة (<1Mbps) يبدو التطبيق معطّلاً

skeleton loaders (placeholder shimmer) تعطي إحساس أن المحتوى يُحمَّل قريباً → perceived performance أفضل بكثير.

## الأدلة (Citations)

- بحث: `grep -rn "ActivityIndicator" src/` يُظهر 30+ استخداماً
- [src/partner/features/dashboard/DashboardScreen.js:174](../../src/partner/features/dashboard/DashboardScreen.js) — يحوي `SkeletonCard` pattern (نموذج جيد)
- باقي الشاشات لا تستخدمه

## التأثير

- المستخدم يظن التطبيق معطّل على الشبكات البطيئة
- تجربة "بطيئة" حتى لو الأداء الحقيقي جيد
- معدل الـ uninstall أعلى

## معايير القبول

- [ ] إنشاء مكوّن `<Skeleton>` عام في `src/shared/components/Skeleton.js`:
  ```jsx
  import {Animated, View} from 'react-native';
  
  export default function Skeleton({width, height, borderRadius = 8}) {
    const opacity = useRef(new Animated.Value(0.3)).current;
    
    useEffect(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(opacity, {toValue: 0.8, duration: 800, useNativeDriver: true}),
          Animated.timing(opacity, {toValue: 0.3, duration: 800, useNativeDriver: true}),
        ])
      ).start();
    }, []);
    
    return <Animated.View style={{width, height, borderRadius, backgroundColor: '#E5E7EB', opacity}} />;
  }
  ```
- [ ] إنشاء variants: `<OrderCardSkeleton>`, `<StaffCardSkeleton>`, `<DashboardStatsSkeleton>`
- [ ] استبدال `ActivityIndicator` في القوائم الرئيسية:
  - `OrdersScreen` (biker + partner)
  - `DashboardScreen`
  - `StaffScreen`
  - `BranchesScreen`
- [ ] الإبقاء على `ActivityIndicator` للأكشنات المنفصلة (زر "قبول" مثلاً) — مناسبة هناك
- [ ] قياس satisfaction بـ A/B test إذا أمكن

## ملاحظات تقنية

- استخدام مكتبة جاهزة بديل: `react-native-skeleton-placeholder` (تتطلب react-native-linear-gradient)
- أو `moti/skeleton` (يستخدم Reanimated)
- skeleton يجب أن يحاكي شكل المحتوى الحقيقي قدر الإمكان
- التحريك يستخدم `useNativeDriver: true` لتجنّب الـ jank
