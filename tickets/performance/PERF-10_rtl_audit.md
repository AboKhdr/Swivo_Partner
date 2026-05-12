# PERF-10: Audit StyleSheet for textAlign/flex-end RTL violations

**Severity:** 🟡 Medium
**Component:** RTL
**Status:** Open

---

## الوصف

CLAUDE.md ينصّ:
> Never use `textAlign: 'right'`, `textAlign: 'left'`, `alignItems: 'flex-end'`, `justifyContent: 'flex-end'`, or `alignSelf: 'flex-end'` as RTL overrides in `StyleSheet.create`.
> Exception: `TextInput` does not inherit `direction` on Android — use `textAlign={isRTL ? 'right' : 'left'}` as a **prop** directly on `<TextInput>`.

يجب فحص كل ملف للتأكد من اتباع القاعدة.

## الأدلة (Citations)

- CLAUDE.md (قاعدة RTL)
- بحث مطلوب:
  ```bash
  grep -rn "textAlign.*['\"]right" src/ | grep -v "TextInput"
  grep -rn "alignItems.*flex-end" src/
  grep -rn "justifyContent.*flex-end" src/
  ```

## التأثير

- في اللغة الإنجليزية (LTR)، layouts تظهر معكوسة
- في الفرنسية/الهندية، نفس المشكلة
- ضعف اتساق العرض بين اللغات

## معايير القبول

- [ ] تشغيل البحث المذكور أعلاه
- [ ] لكل نتيجة:
  - إذا كانت داخل `StyleSheet.create`: حذفها (الـ `direction: 'rtl'` في App.tsx يكفي)
  - إذا كانت prop على `TextInput`: تأكيد أنها مع `textAlign={isRTL ? 'right' : 'left'}` ديناميكية
- [ ] اختبار: تشغيل التطبيق بـ `lang='en'` والتحقق من جميع الشاشات
- [ ] اختبار: تشغيل بـ `lang='hi'` (LTR, RTL يختلف)
- [ ] إضافة قاعدة eslint مخصصة لرصد الانتهاكات
- [ ] توثيق في `docs/RTL.md`

## ملاحظات تقنية

- البدائل الصحيحة:
  - `flex-end` → `flex-end` لا يحدد LTR/RTL، لكن CLAUDE.md يمنعه. استخدم `flex-start` و `direction: rtl` يحوّله تلقائياً
  - `textAlign: 'right'` → احذفه، النص يأخذ direction من الـ parent
  - `marginLeft` → `marginStart` (يتبع direction)
  - `marginRight` → `marginEnd`
  - `paddingLeft` → `paddingStart`
- على Android < 21: لا يدعم `Start/End` — لكن minSdk=24 آمن
- استخدام `I18nManager.isRTL` للمنطق المشروط
- مرتبط بـ [BUILD-10](../build/BUILD-10_minsdk_outdated.md) للـ minSdk
