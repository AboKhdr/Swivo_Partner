# Code Quality Overview

**Last updated:** 2026-05-11
**Total tickets:** 6 (0 Critical, 3 High, 3 Medium)

---

## High 🟠

| ID | Title | Component |
|---|---|---|
| [CQ-01](CQ-01_oversized_files.md) | 3 files exceed 500 lines (OrderDetailsScreen partner/biker, OffersScreen) | Maintainability |
| [CQ-02](CQ-02_hardcoded_arabic_strings.md) | Hardcoded Arabic strings in Alerts and timeline labels | i18n |
| [CQ-03](CQ-03_cross_app_service_import.md) | Partner TermsScreen imports from biker services | Architecture |

## Medium 🟡

| ID | Title | Component |
|---|---|---|
| [CQ-04](CQ-04_async_storage_outside_store.md) | PartnerPersonalInfoScreen accesses AsyncStorage directly | State management |
| [CQ-05](CQ-05_jsdoc_types_thin.md) | JSDoc typedefs are minimal (only OrderType) | Type safety |
| [CQ-06](CQ-06_inconsistent_response_handling.md) | Mixed res.data shapes (data.data vs data) across services | API layer |

---

## Recommended Fix Order

**This sprint:**
CQ-02 → CQ-03 → CQ-04

**Next sprint:**
CQ-01 → CQ-05 → CQ-06
