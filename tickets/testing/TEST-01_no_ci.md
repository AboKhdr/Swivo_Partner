# TEST-01: No CI runs tests on PR

**Severity:** 🔴 Critical
**Component:** DevOps / Automation
**Status:** Open

---

## الوصف

المشروع يحتوي على 473 اختبار قوي لكن **لا يوجد CI** يشغّلها تلقائياً عند PR. اختبار قد يُكسر دون علم أحد. ملاحظة: هذا التذكرة مكررة جزئياً مع [BUILD-11](../build/BUILD-11_no_cicd.md) لكن من منظور Testing تحديداً.

## الأدلة (Citations)

- لا يوجد `.github/workflows/`
- لا يوجد `.gitlab-ci.yml`
- `npm test` يعمل يدوياً فقط
- التوثيق في `docs/TESTING.md` يعدد الاختبارات لكنها لا تعمل تلقائياً

## التأثير

- اختبارات تُكسر دون كشف
- مطورين قد لا يشغّلون الاختبارات قبل push
- لا يوجد coverage tracking عبر الزمن
- لا توجد قواعد لمنع دمج PR مع failing tests
- محرّك التأمين على الجودة معطّل

## معايير القبول

- [ ] إنشاء `.github/workflows/test.yml`:
  ```yaml
  name: Tests
  on:
    pull_request:
      branches: [master, main, develop]
    push:
      branches: [master, main]
  
  jobs:
    test:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v4
        - uses: actions/setup-node@v4
          with:
            node-version: '20'
            cache: 'npm'
        - run: npm ci
        - run: npm run lint
        - name: Run tests with coverage
          run: npm test -- --coverage --maxWorkers=2
        - uses: codecov/codecov-action@v4
          with:
            files: ./coverage/lcov.info
            fail_ci_if_error: true
  ```
- [ ] إضافة badge في README:
  ```markdown
  ![Tests](https://github.com/USER/REPO/actions/workflows/test.yml/badge.svg)
  ```
- [ ] إعداد branch protection rule في GitHub:
  - تتطلب passing checks
  - تتطلب مراجعة 1+
  - منع force push على master
- [ ] إعداد codecov.yml بحد أدنى 80% coverage على services/stores
- [ ] إضافة pre-commit hook (مع husky):
  ```json
  "husky": {
    "hooks": {
      "pre-commit": "npm test -- --bail --findRelatedTests"
    }
  }
  ```

## ملاحظات تقنية

- اختبارات navigation/navigation.test.js تفشل عند تشغيل كامل (TEST-03) — يجب حلها أولاً أو وضع `describe.skip` مؤقتاً
- استخدام `--maxWorkers=2` لتجنّب OOM في GitHub Actions free tier
- يفضّل تقسيم الـ jobs: lint, test, build (سرعة أعلى parallel)
- مرتبط بـ [BUILD-11](../build/BUILD-11_no_cicd.md), [TEST-03](TEST-03_navigation_test_leakage.md)
