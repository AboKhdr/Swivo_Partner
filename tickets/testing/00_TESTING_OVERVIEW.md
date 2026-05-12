# Testing & QA Overview

**Last updated:** 2026-05-11
**Current state:** 473 tests across 14 suites — strong baseline ✅
**Total tickets:** 7 (1 Critical, 4 High, 2 Medium)

---

## Critical 🔴

| ID | Title | Component |
|---|---|---|
| [TEST-01](TEST-01_no_ci.md) | No CI runs tests on PR | DevOps |

## High 🟠

| ID | Title | Component |
|---|---|---|
| [TEST-02](TEST-02_auth_edge_cases.md) | Missing auth edge cases (OTP expiry, JWT decode) | Auth |
| [TEST-03](TEST-03_navigation_test_leakage.md) | Navigation tests have state leakage (125 tests flaky) | Navigation |
| [TEST-04](TEST-04_screen_tests_missing.md) | No screen-level integration tests | UI |
| [TEST-05](TEST-05_race_conditions.md) | No race condition tests for concurrent operations | Concurrency |

## Medium 🟡

| ID | Title | Component |
|---|---|---|
| [TEST-06](TEST-06_eslint_minimal.md) | ESLint config minimal; no exhaustive-deps | Tooling |
| [TEST-07](TEST-07_fcm_deeplink.md) | No tests for FCM deep-link routing | Notifications |

---

## Strengths to Maintain ✅

- 473 behavioral tests (not snapshots)
- Proper Firebase/AsyncStorage/Notifee mocks in jest.setup.js
- 74 partner.js tests covering all endpoints
- Excellent docs (TESTING.md, PERFORMANCE_AUDIT.md, NAVIGATION_TESTS.md)

## Recommended Fix Order

**This sprint:**
TEST-01 → TEST-03 → TEST-06

**Next sprint:**
TEST-02 → TEST-05 → TEST-07 → TEST-04
