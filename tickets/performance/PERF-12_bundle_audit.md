# PERF-12: Verify no unused deps post-build

**Severity:** 🟢 Low
**Component:** Bundle Size
**Status:** Open

---

## الوصف

`package.json` يحتوي مكتبات معقولة لكن:
- NativeWind v4 مُثبَّتة لكن **غير مكوّنة** (CLAUDE.md). تستهلك مساحة بدون فائدة
- بعض المكتبات قد لا تُستخدم فعلاً (مخلّفات تجارب سابقة)

## الأدلة (Citations)

- [package.json](../../package.json)
- CLAUDE.md ينصّ: "NativeWind v4 is installed but not configured"
- بحث استخدامات كل dep ضروري

## التأثير

- حجم APK أكبر من اللازم
- وقت bundle أطول
- استهلاك تخزين على جهاز المستخدم

## معايير القبول

- [ ] تشغيل `npx depcheck`:
  ```bash
  npx depcheck
  ```
- [ ] لكل dep غير مستخدم: قرار حذف أو إبقاء (للاستخدام المستقبلي)
- [ ] إذا NativeWind غير مستخدمة فعلاً → `npm uninstall nativewind tailwindcss`
- [ ] تشغيل `npx react-native-bundle-visualizer` لرؤية أكبر deps
- [ ] فحص `node_modules` بعد build:
  ```bash
  du -sh node_modules/* | sort -h | tail -20
  ```
- [ ] قياس حجم APK قبل/بعد
- [ ] في build.gradle: تفعيل `shrinkResources true` مع `minifyEnabled true`

## ملاحظات تقنية

- `npx depcheck` قد يُعطي false positives لـ deps مستخدمة في build configs
- أكبر مكتبات معتادة: Firebase, react-native-svg, lucide
- استخدام Hermes (مفعّل ✅) يقلل JS bundle 30-50%
- يفضّل ABI splits في `android/app/build.gradle`:
  ```gradle
  splits {
      abi {
          enable true
          reset()
          include "armeabi-v7a", "arm64-v8a", "x86", "x86_64"
          universalApk false
      }
  }
  ```
