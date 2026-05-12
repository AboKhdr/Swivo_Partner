# Performance & UX Overview

**Last updated:** 2026-05-11
**Total tickets:** 12 (1 Critical, 4 High, 5 Medium, 2 Low)

---

## Critical 🔴

| ID | Title | Component |
|---|---|---|
| [PERF-01](PERF-01_mapcontainer_broken.md) | MapContainer needs valid Google Maps key + restrictions | Maps |

## High 🟠

| ID | Title | Component |
|---|---|---|
| [PERF-02](PERF-02_scrollview_lists.md) | DashboardScreen uses ScrollView instead of FlatList | Lists |
| [PERF-03](PERF-03_display_none_leak.md) | display:'none' navigation pattern keeps 11+ screens mounted | Navigation / Memory |
| [PERF-04](PERF-04_accessibility_missing.md) | 0% accessibility — no labels, no roles | A11y / WCAG |
| [PERF-05](PERF-05_touch_targets.md) | Touch targets below 48dp WCAG minimum | A11y / UX |

## Medium 🟡

| ID | Title | Component |
|---|---|---|
| [PERF-06](PERF-06_flatlist_getitemlayout.md) | 18 FlatLists missing getItemLayout | Lists |
| [PERF-07](PERF-07_fastimage.md) | No FastImage for remote Cloudinary images | Images |
| [PERF-08](PERF-08_inline_renderitem.md) | Inline renderItem in HomeScreen branch picker | Re-renders |
| [PERF-09](PERF-09_skeleton_loaders.md) | ActivityIndicator everywhere; no skeleton loaders | UX / Perceived perf |
| [PERF-10](PERF-10_rtl_audit.md) | Audit StyleSheet for textAlign/flex-end RTL violations | RTL |

## Low 🟢

| ID | Title | Component |
|---|---|---|
| [PERF-11](PERF-11_i18n_perf.md) | Audit high-frequency t() calls (currently OK) | i18n |
| [PERF-12](PERF-12_bundle_audit.md) | Verify no unused deps post-build | Bundle size |

---

## Recommended Fix Order

**This sprint:**
PERF-01 → PERF-04 → PERF-05 → PERF-02 → PERF-08

**Next sprint:**
PERF-03 → PERF-06 → PERF-07 → PERF-09 → PERF-10

**Backlog:**
PERF-11 → PERF-12
