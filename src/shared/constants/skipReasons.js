// FILE: src/shared/constants/skipReasons.js
//
// Stable enum codes for photo-skip — matches the backend whitelist at
// libs/constants/skipReasons.js (SKIP_REASONS).
//
// UI labels are read from i18n key `biker.orderDetails.skipReasons.<key>`.
//
export const SKIP_REASONS = [
  {key: 'customerRefused', code: 'CUSTOMER_REFUSED_PHOTO'},
  {key: 'noInternet',      code: 'NO_INTERNET'},
  {key: 'cameraBroken',    code: 'CAMERA_BROKEN'},
  {key: 'appCrashed',      code: 'APP_CRASHED'},
  {key: 'carLeft',         code: 'CAR_LEFT_BEFORE_PHOTO'},
  {key: 'other',           code: 'OTHER'},
];
