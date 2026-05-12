# CQ-03: Partner TermsScreen imports from biker services

**Severity:** 🟠 High
**Component:** Architecture
**Status:** Open

---

## الوصف

CLAUDE.md ينصّ بوضوح: "Never import anything from `src/biker/` inside `src/partner/` or vice versa". لكن `PartnerTermsScreen.js` يستورد من `src/services/biker.js` — رغم أن `services/` ليس داخل `src/biker/` تماماً، فالاسم يشير إلى أنه biker-specific.

## الأدلة (Citations)

- [src/partner/features/profile/TermsScreen.js](../../src/partner/features/profile/TermsScreen.js) - يحتوي:
  ```js
  import {getTerms} from '../../../services/biker';
  ```
- [src/services/biker.js](../../src/services/biker.js) — مفترض أنه يخدم biker فقط
- [src/services/partner.js](../../src/services/partner.js) — لا يحتوي `getTerms`

## التأثير

- تعطّل العزل المعماري بين biker و partner
- خطر: تعديل `getTerms` للـ biker قد يكسر partner
- ارتباك للمطورين الجدد: "هذا الـ service لمن؟"
- صعوبة rotation الخادم/الـ base path لأحد التطبيقين

## معايير القبول

- [ ] خيار 1 (الموصى به): نقل `getTerms` إلى `src/services/shared.js` لأنه shared:
  ```js
  // src/services/shared.js
  export async function getTerms(role) {
    return api.get(`/terms${role ? `?role=${role}` : ''}`);
  }
  ```
- [ ] خيار 2: إضافة endpoint منفصل في `partner.js` (إذا كانت الشروط مختلفة لكل دور)
- [ ] خيار 3: إذا كانت `services/biker.js` تحتوي على دوال shared فعلياً، إعادة تسميتها إلى `services/auth.js` أو `services/general.js`
- [ ] تحديث IMPORT في `TermsScreen` ليأخذ من المكان الجديد
- [ ] فحص جميع imports عبر الحدود:
  ```bash
  grep -rn "from.*src/biker" src/partner/
  grep -rn "from.*src/partner" src/biker/
  grep -rn "services/biker" src/partner/
  grep -rn "services/partner" src/biker/
  ```
- [ ] إضافة قاعدة eslint:
  ```js
  // .eslintrc.js
  rules: {
    'no-restricted-imports': ['error', {
      patterns: [
        {group: ['*/biker/*'], message: 'partner cannot import from biker'},
      ]
    }]
  }
  ```

## ملاحظات تقنية

- مراجعة `src/services/` بشكل شامل لتصنيف كل ملف: biker-only, partner-only, أو shared
- ربما يستفيد المشروع من إعادة هيكلة:
  ```
  src/services/
    /biker/     — endpoints خاصة بالبايكر
    /partner/   — endpoints خاصة بالشريك  
    /shared/    — auth, terms, etc.
    api.js
  ```
- مرتبط بـ [TEST-06](../testing/TEST-06_eslint_minimal.md) — تفعيل eslint rules
