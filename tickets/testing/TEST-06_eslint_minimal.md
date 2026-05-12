# TEST-06: ESLint config minimal; no exhaustive-deps

**Severity:** 🟡 Medium
**Component:** Tooling
**Status:** Open

---

## الوصف

`.eslintrc.js` يمتد فقط `@react-native` بدون قواعد مخصصة:
- لا `react-hooks/exhaustive-deps` (الذي يكشف missing deps في useCallback/useEffect)
- لا `no-console` (يسمح بترك console.log)
- لا `no-unused-vars` صارم
- لا قواعد a11y

نتيجة: bugs hooks محتملة، console.log في الإنتاج، imports غير مستخدمة.

## الأدلة (Citations)

- [.eslintrc.js](../../.eslintrc.js)
- بحث `console.log` في الكود يحتاج تأكيد
- [package.json](../../package.json) — افحص eslint deps الموجودة

## التأثير

- bugs hooks خفية (missing dependency → stale closure)
- console.log قد يتسرّب إلى الإنتاج
- code style inconsistent بين المطورين
- لا يوجد كاشف لمخالفات a11y (مرتبط بـ PERF-04)

## معايير القبول

- [ ] تحديث `.eslintrc.js`:
  ```js
  module.exports = {
    root: true,
    extends: [
      '@react-native',
      'plugin:react-hooks/recommended',
    ],
    plugins: [
      'react-native-a11y',
      'react-perf',
    ],
    rules: {
      'react-hooks/exhaustive-deps': 'error',
      'no-console': ['warn', {allow: ['warn', 'error']}],
      'no-unused-vars': ['error', {argsIgnorePattern: '^_'}],
      'react-perf/jsx-no-new-function-as-prop': 'warn',
      'react-perf/jsx-no-new-object-as-prop': 'warn',
      'react-perf/jsx-no-new-array-as-prop': 'warn',
      'react-native-a11y/has-accessibility-hint': 'warn',
      'react-native-a11y/has-valid-accessibility-role': 'warn',
      // RTL: ban textAlign in StyleSheet
      'no-restricted-syntax': ['warn', {
        selector: "Property[key.name='textAlign'][value.value=/right|left/]",
        message: 'Avoid textAlign in StyleSheet (CLAUDE.md RTL rule)',
      }],
      // Cross-app imports
      'no-restricted-imports': ['error', {
        patterns: [{
          group: ['**/biker/**'],
          message: 'partner cannot import from biker (CLAUDE.md)',
        }],
      }],
    },
    overrides: [
      {
        files: ['src/biker/**'],
        rules: {
          'no-restricted-imports': ['error', {
            patterns: [{group: ['**/partner/**']}],
          }],
        },
      },
    ],
  };
  ```
- [ ] تثبيت deps:
  ```bash
  npm i -D eslint-plugin-react-hooks eslint-plugin-react-native-a11y eslint-plugin-react-perf
  ```
- [ ] تشغيل `npm run lint -- --fix`
- [ ] حل جميع الـ warnings/errors يدوياً
- [ ] إضافة `lint:strict` في package.json: `eslint . --max-warnings 0`
- [ ] CI يجب أن يفشل على أي warning

## ملاحظات تقنية

- `exhaustive-deps` قد ينتج false positives (نادراً) — استخدام `// eslint-disable-next-line` مع تعليق يشرح
- prettier للـ formatting (إذا غير مستخدم)
- لتنفيذ تدريجي: ابدأ بـ warnings، ثم رفعها لـ errors بعد التنظيف
- مرتبط بـ [PERF-04](../performance/PERF-04_accessibility_missing.md), [PERF-08](../performance/PERF-08_inline_renderitem.md), [PERF-10](../performance/PERF-10_rtl_audit.md), [CQ-03](../code-quality/CQ-03_cross_app_service_import.md)
