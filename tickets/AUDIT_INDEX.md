# Comprehensive Audit Index — NativeTamam

**Audit date:** 2026-05-11
**Auditor:** Senior RN Dev + QA
**Total tickets:** 51 across 5 categories
**Overall grade:** B+ — Not production-ready until critical items resolved

---

## Quick stats

| Category | Tickets | Critical 🔴 | High 🟠 | Medium 🟡 | Low 🟢 |
|---|---|---|---|---|---|
| [Security](security/00_SECURITY_OVERVIEW.md) | 13 | 5 | 4 | 4 | 0 |
| [Build & Deployment](build/00_BUILD_OVERVIEW.md) | 12 | 3 | 3 | 4 | 2 |
| [Performance & UX](performance/00_PERFORMANCE_OVERVIEW.md) | 12 | 1 | 4 | 5 | 2 |
| [Code Quality](code-quality/00_CODE_QUALITY_OVERVIEW.md) | 6 | 0 | 3 | 3 | 0 |
| [Testing & QA](testing/00_TESTING_OVERVIEW.md) | 7 | 1 | 4 | 2 | 0 |
| **TOTAL** | **50** | **10** | **18** | **18** | **4** |

---

## 🚨 Pre-Production Blockers (10 Critical tickets)

| Order | ID | Title |
|---|---|---|
| 1 | [SEC-05](security/SEC-05_debug_keystore.md) / [BUILD-01](build/BUILD-01_release_keystore.md) | Generate release keystore |
| 2 | [SEC-01](security/SEC-01_token_storage.md) | Move tokens to Keychain |
| 3 | [BUILD-02](build/BUILD-02_hardcoded_api_keys.md) / [SEC-09](security/SEC-09_api_keys_exposure.md) | Restrict + rotate API keys |
| 4 | [BUILD-03](build/BUILD-03_firebase_config_drift.md) | Clean google-services.json |
| 5 | [SEC-07](security/SEC-07_proguard_disabled.md) | Enable ProGuard |
| 6 | [SEC-04](security/SEC-04_webview_security.md) / [PERF-01](performance/PERF-01_mapcontainer_broken.md) | Secure WebView/Maps |
| 7 | [SEC-03](security/SEC-03_http_cleartext.md) | Block cleartext traffic in prod |
| 8 | [SEC-02](security/SEC-02_ssl_pinning.md) | Implement SSL pinning |
| 9 | [SEC-06](security/SEC-06_cloudinary_unsigned.md) | Sign Cloudinary uploads |
| 10 | [TEST-01](testing/TEST-01_no_ci.md) / [BUILD-11](build/BUILD-11_no_cicd.md) | Set up CI/CD |

---

## Sprint Planning (Suggested)

### Sprint 1 — Security Hardening (2 weeks)
- SEC-01, SEC-05/BUILD-01, SEC-07
- BUILD-02, BUILD-03, BUILD-05
- TEST-01, TEST-03 (unblock CI)

### Sprint 2 — Security & Maps (2 weeks)
- SEC-02, SEC-03, SEC-04, SEC-06
- PERF-01 (Maps)
- BUILD-07 (gitignore)
- SEC-08 (refresh token)

### Sprint 3 — UX & Accessibility (2 weeks)
- PERF-04, PERF-05 (a11y)
- PERF-02, PERF-08 (lists)
- CQ-02 (i18n strings)
- CQ-03 (cross-app imports)
- TEST-06 (eslint)

### Sprint 4 — Performance & Polish (2 weeks)
- PERF-03, PERF-06, PERF-07, PERF-09
- SEC-10, SEC-11, SEC-12
- CQ-01 (file splitting)
- TEST-02, TEST-05

### Backlog — Continuous Improvement
- BUILD-04, BUILD-06, BUILD-08, BUILD-09, BUILD-10, BUILD-12
- SEC-13
- PERF-10, PERF-11, PERF-12
- CQ-04, CQ-05, CQ-06
- TEST-04, TEST-07

---

## Cross-references between tickets

Many tickets are related and should be coordinated:

- **Keystore + Signing:** SEC-05 ↔ BUILD-01
- **API key exposure:** SEC-09 ↔ BUILD-02
- **CI/CD:** TEST-01 ↔ BUILD-11
- **WebView/Maps:** SEC-04 ↔ PERF-01 ↔ BUILD-02
- **Env management:** BUILD-02 ↔ BUILD-05 ↔ BUILD-07
- **Accessibility:** PERF-04 ↔ PERF-05 ↔ TEST-06
- **ProGuard:** SEC-07 ↔ BUILD-08 ↔ PERF-07 (FastImage needs Glide keeps)
- **i18n:** CQ-02 ↔ TEST-06 (eslint custom rule)
- **Tokens:** SEC-01 ↔ SEC-12 ↔ CQ-04 (AsyncStorage encapsulation)
- **Concurrency:** TEST-05 ↔ SEC-08 ↔ CQ-06

---

## Strengths to Preserve ✅

The audit identified clear strengths that should be **maintained, not refactored**:

- ✅ **Architecture isolation** between biker and partner apps (CLAUDE.md rule honored)
- ✅ **Zustand stores** correctly used (authStore, appStore, ordersStore)
- ✅ **API layer** uniform `{success, data, error}` shape
- ✅ **473 behavioral tests** (not snapshots) — strong baseline
- ✅ **Mocks** in jest.setup.js comprehensive (Firebase, AsyncStorage, Notifee)
- ✅ **No console.log** or dead code
- ✅ **StyleSheet.create** consistently used (no inline styles)
- ✅ **Documentation** in `docs/` excellent (TESTING, PERFORMANCE_AUDIT, NAVIGATION_TESTS, DEVICE_CAPABILITY_TESTS)
- ✅ **Hermes + New Architecture** enabled
- ✅ **iOS ATS** (NSAllowsArbitraryLoads=false)
- ✅ **Android allowBackup=false**
- ✅ **No deep-link attack surface** (no custom schemes)
- ✅ **74 partner.js tests** + comprehensive store coverage

---

## Effort Estimate

| Sprint | Tickets | Estimated effort |
|---|---|---|
| Sprint 1 | 8 | ~80 hrs (2 devs × 2 weeks) |
| Sprint 2 | 7 | ~80 hrs |
| Sprint 3 | 8 | ~80 hrs |
| Sprint 4 | 10 | ~80 hrs |
| Backlog | 17 | continuous |

**Total to production-ready:** ~4 sprints (~320 hours) with 2 dedicated developers.

---

## How to use these tickets

1. **Start with Sprint 1** — production blockers
2. Each ticket has:
   - **الوصف** — what's wrong
   - **الأدلة (Citations)** — file:line references
   - **التأثير** — why it matters
   - **معايير القبول** — actionable checklist
   - **ملاحظات تقنية** — implementation hints
3. Track in your issue tracker (GitHub Issues, Jira, Linear) using `<CATEGORY>-NN` as ID
4. Update ticket `Status:` field as work progresses (Open → In Progress → Review → Done)
5. Add `## التحديثات` section at bottom when partial progress is made
