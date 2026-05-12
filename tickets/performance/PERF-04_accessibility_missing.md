# PERF-04: 0% accessibility — no labels, no roles

**Severity:** 🟠 High
**Component:** Accessibility / WCAG
**Status:** Open

---

## الوصف

بحث `accessibilityLabel`, `accessibilityRole`, `accessibilityHint` في الكود يُعطي **0 نتائج**. التطبيق غير قابل للاستخدام لمستخدمي:
- قارئات الشاشة (TalkBack / VoiceOver)
- التحكم الصوتي
- Switch Access
- مكبرات الشاشة

ينتهك WCAG 2.1 AA + Saudi accessibility laws + قوانين Play Store ابتداءً من 2025.

## الأدلة (Citations)

- بحث الكود: `grep -r "accessibilityLabel" src/` → 0 نتائج
- جميع أزرار `TouchableOpacity` بدون props للـ a11y

## التأثير

- استبعاد ~3% من المستخدمين (تقدير عالمي)
- مخاطر قانونية في الأسواق التي تتطلب a11y
- Google Play قد ترفض/تخفض ترتيب التطبيقات غير مُتاحة في 2025+
- مظهر غير احترافي

## معايير القبول

- [ ] إضافة `accessibilityLabel` لكل `TouchableOpacity` و `Pressable`:
  ```jsx
  <TouchableOpacity 
    accessibilityLabel={t('orders.acceptButton')}
    accessibilityRole="button"
    accessibilityHint={t('orders.acceptHint')}
  >
  ```
- [ ] إضافة `accessibilityRole` للأدوار: `button`, `header`, `link`, `image`, `tab`
- [ ] إضافة `accessible={true}` لـ Views التي تجمع نصوصاً
- [ ] إضافة `accessibilityState={{disabled, selected, expanded}}` للحالات
- [ ] التحقق من contrast ratios (4.5:1 للنصوص العادية، 3:1 للنصوص الكبيرة)
- [ ] اختبار TalkBack على Android, VoiceOver على iOS
- [ ] إضافة accessibilityLabel للأيقونات decorative بـ `accessibilityElementsHidden={true}`

## ملاحظات تقنية

- استخدام مكون wrapper مخصص:
  ```jsx
  const A11yButton = ({label, hint, ...props}) => (
    <TouchableOpacity 
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={hint}
      {...props}
    />
  );
  ```
- إضافة `eslint-plugin-react-native-a11y` لرصد الانتهاكات في كل commit
- مرتبط بـ [PERF-05](PERF-05_touch_targets.md), [TEST-06](../testing/TEST-06_eslint_minimal.md)
- مرجع: [React Native Accessibility Docs](https://reactnative.dev/docs/accessibility)
