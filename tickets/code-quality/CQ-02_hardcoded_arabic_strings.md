# CQ-02: Hardcoded Arabic strings in Alerts and labels

**Severity:** 🟠 High
**Component:** i18n
**Status:** Open

---

## الوصف

CLAUDE.md ينصّ: "Use `t('key')` for all UI text — do NOT hardcode Arabic strings in new screens." لكن عدة مواضع تخالف هذه القاعدة، خاصة في:
- Alert messages
- Toast messages
- TIMELINE_STEPS labels
- Fallback strings

في حال إطلاق التطبيق للهند أو دول إنجليزية، هذه النصوص لن تُترجم.

## الأدلة (Citations)

| الملف | السطر | النص المضمّن |
|---|---|---|
| [src/partner/features/orders/OrderDetailsScreen.js](../../src/partner/features/orders/OrderDetailsScreen.js) | 196 | `'تم نسخ رقم الطلب'` |
| [src/partner/features/orders/OrderDetailsScreen.js](../../src/partner/features/orders/OrderDetailsScreen.js) | 198 | `'تم النسخ'`, `'تم نسخ رقم الطلب'` |
| [src/partner/features/orders/OrderDetailsScreen.js](../../src/partner/features/orders/OrderDetailsScreen.js) | 214 | `'تنبيه'`, `'يرجى منح إذن الكاميرا من الإعدادات'` |
| [src/partner/features/orders/OrderDetailsScreen.js](../../src/partner/features/orders/OrderDetailsScreen.js) | 40-50 | TIMELINE labels: `'وصول الطلب'`, `'بدء الغسيل'`, `'انهاء الغسيل'` |
| [src/biker/features/orders/OrderDetailsScreen.js](../../src/biker/features/orders/OrderDetailsScreen.js) | 291 | `'تعذّر تحميل البيانات'` |
| [src/partner/features/orders/OrdersScreen.js](../../src/partner/features/orders/OrdersScreen.js) | ~22 | `'تم نسخ رقم الطلب'` |

## التأثير

- التطبيق غير قابل للتدويل فعلياً
- المستخدمون الناطقون بالإنجليزية/الهندية يرون عربية مفاجئة في popup
- صعوبة التحقق من نصوص لمعرفة هل تم ترجمتها (يجب grep يدوي)

## معايير القبول

- [ ] إضافة المفاتيح المفقودة إلى:
  - `src/shared/i18n/locales/ar.json`
  - `src/shared/i18n/locales/en.json`
  - `src/shared/i18n/locales/hi.json`
- [ ] هيكل مقترح:
  ```json
  {
    "common": {
      "copied": "تم النسخ",
      "copiedOrderNumber": "تم نسخ رقم الطلب",
      "alert": "تنبيه",
      "loadFailed": "تعذّر تحميل البيانات"
    },
    "permissions": {
      "cameraRequired": "يرجى منح إذن الكاميرا من الإعدادات"
    },
    "orders": {
      "timeline": {
        "received": "وصول الطلب",
        "arrived": "وصول البايكر",
        "started": "بدء الغسيل",
        "done": "إنهاء الغسيل"
      }
    }
  }
  ```
- [ ] استبدال جميع الـ hardcoded strings بـ `t('key')`
- [ ] إضافة قاعدة eslint مخصصة (أو grep في pre-commit):
  ```bash
  grep -rnP "['\"][؀-ۿ]+['\"]" src/ --include="*.js"
  ```
- [ ] القيم الناتجة يجب أن تكون كلها داخل `t()` أو في locale files

## ملاحظات تقنية

- بعد إصلاح: تشغيل التطبيق بـ `lang='en'` والتحقق من جميع الـ Alerts والـ Toasts
- يفضّل إضافة `i18n-validator` script يكشف keys مفقودة بين locales:
  ```js
  // scripts/validate-locales.js
  const ar = require('../src/shared/i18n/locales/ar.json');
  const en = require('../src/shared/i18n/locales/en.json');
  const hi = require('../src/shared/i18n/locales/hi.json');
  // قارن المفاتيح، اعرض المفقودة
  ```
- مرتبط بـ [CQ-01](CQ-01_oversized_files.md) — تجزئة الملفات تجعل i18n audit أسهل
