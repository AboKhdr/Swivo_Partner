// FILE: src/shared/constants/rejectReasons.js
//
// Stable enum codes for order rejection — matches the backend whitelist at
// app/api/tenant/orders/[id]/reject/route.js (REJECT_REASONS).
//
// The UI shows localized labels via i18n keys `partner.incoming.rejectReasons.<key>`,
// but the value sent to the API is the CODE below — never the localized string.
//
export const REJECT_REASONS = [
  {key: 'busy',             code: 'BUSY'},
  {key: 'outOfRange',       code: 'OUT_OF_RANGE'},
  {key: 'noBiker',          code: 'NO_BIKER'},
  {key: 'duplicate',        code: 'DUPLICATE'},
  {key: 'customerRefused',  code: 'CUSTOMER_REFUSED'},
  {key: 'other',            code: 'OTHER'},
];

// Lookup by code → key (for hydrating display from a stored reason)
export const REJECT_CODE_TO_KEY = Object.fromEntries(
  REJECT_REASONS.map(r => [r.code, r.key]),
);
