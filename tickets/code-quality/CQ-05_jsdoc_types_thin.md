# CQ-05: JSDoc typedefs are minimal

**Severity:** 🟡 Medium
**Component:** Type Safety
**Status:** Open

---

## الوصف

المشروع JavaScript-only (لا TypeScript)، لكنه يستخدم JSDoc للتوثيق. حالياً `src/shared/types/index.js` يحتوي فقط `OrderType` (18 سطر). لا توجد types لـ:
- `User`, `Auth`
- `Order` (الـ shape الكامل)
- `Biker`, `Partner`
- Store interfaces
- Service function signatures

## الأدلة (Citations)

- [src/shared/types/index.js](../../src/shared/types/index.js) — 18 سطر فقط
- جميع services تفتقد `@param`/`@returns` JSDoc
- [src/store/](../../src/store/) — لا توجد JSDoc للـ store state shapes

## التأثير

- لا autocomplete في VS Code للـ store state
- لا تحقق ثابت من الـ types (TypeScript يفعل ذلك لكنه ممنوع)
- أخطاء runtime يمكن منعها لو وُجد JSDoc + jsconfig.json
- documentation ضعيف للمطورين الجدد

## معايير القبول

- [ ] توسيع `src/shared/types/index.js` ليشمل:
  ```js
  /**
   * @typedef {Object} User
   * @property {string} _id
   * @property {string} firstName
   * @property {string} lastName
   * @property {string} phoneNumber
   * @property {string} [email]
   * @property {string} [image]
   * @property {'biker'|'admin'|'client'} role
   */
  
  /**
   * @typedef {Object} Order
   * @property {string} _id
   * @property {string} orderNumber
   * @property {'PENDING_PARTNER'|'ACCEPTED'|'ASSIGNED'|'ON_THE_WAY'|'STARTED'|'COMPLETED'|'REJECTED'|'CANCELLED'} status
   * @property {'mobile'|'onshop'} orderType
   * @property {User} [client]
   * @property {Biker} [biker]
   * @property {Object} [proof]
   * @property {string[]} [proof.beforePhotos]
   * @property {string[]} [proof.afterPhotos]
   * // ...
   */
  
  /**
   * @typedef {Object} ApiResponse
   * @property {boolean} success
   * @property {*} data
   * @property {string|null} error
   */
  ```
- [ ] إضافة `@param` / `@returns` لكل function في `src/services/*.js`:
  ```js
  /**
   * @param {string} orderId
   * @param {string} bikerId
   * @returns {Promise<ApiResponse>}
   */
  export async function assignBiker(orderId, bikerId) { ... }
  ```
- [ ] إضافة `@type {import('../shared/types').User}` للـ store state
- [ ] إنشاء `jsconfig.json` في الجذر لتفعيل intellisense:
  ```json
  {
    "compilerOptions": {
      "target": "esnext",
      "moduleResolution": "node",
      "jsx": "react",
      "allowSyntheticDefaultImports": true,
      "checkJs": false,
      "baseUrl": ".",
      "paths": {
        "@/*": ["src/*"]
      }
    },
    "include": ["src/**/*"]
  }
  ```

## ملاحظات تقنية

- يفضّل `checkJs: true` لاحقاً لتشغيل type checking على JS (بطيء لكن مفيد)
- VS Code يفهم JSDoc تلقائياً
- يمكن توليد API docs من JSDoc بـ `documentation.js` أو `jsdoc-to-markdown`
- البديل النهائي: ترحيل تدريجي إلى TypeScript (يتطلب موافقة الفريق — CLAUDE.md ينصّ JS-only)
