# Security Audit — Overview

> تاريخ المراجعة: 2026-05-10
> النطاق: React Native CLI (Biker + Partner) — d:\pioneers\nativetamam
> المنهجية: فحص كود فعلي مع citations (file:line)

---

## ملخص النتائج

| الشدة | العدد | الحالة |
|-------|------|--------|
| 🔴 Critical | 5 | يجب الإصلاح قبل أي إصدار إنتاج |
| 🟠 High | 4 | يجب الإصلاح خلال السبرنت الحالي |
| 🟡 Medium | 4 | يُجدول خلال السبرنت القادم |
| 🟢 Pass | 4 | لا حاجة لإجراء |

---

## فهرس التذاكر

### Critical
- [SEC-01: Token storage in AsyncStorage (no Keychain)](./SEC-01_token_storage.md)
- [SEC-02: No SSL/Certificate Pinning](./SEC-02_ssl_pinning.md)
- [SEC-03: HTTP traffic + cleartext debug manifest](./SEC-03_http_cleartext.md)
- [SEC-04: WebView insecure configuration](./SEC-04_webview_security.md)
- [SEC-05: Release signed with debug keystore](./SEC-05_debug_keystore.md)

### High
- [SEC-06: Cloudinary unsigned upload preset exposed](./SEC-06_cloudinary_unsigned.md)
- [SEC-07: ProGuard disabled in release builds](./SEC-07_proguard_disabled.md)
- [SEC-08: Inconsistent refresh token logic + no JWT expiry check](./SEC-08_refresh_token.md)
- [SEC-09: Exposed API keys (Google Maps + Firebase)](./SEC-09_api_keys_exposure.md)

### Medium
- [SEC-10: No screenshot/FLAG_SECURE prevention](./SEC-10_screenshot_prevention.md)
- [SEC-11: No client-side rate limiting on OTP](./SEC-11_otp_rate_limiting.md)
- [SEC-12: FCM token + PII stored unencrypted](./SEC-12_fcm_pii_storage.md)
- [SEC-13: No Jailbreak/Root detection](./SEC-13_root_detection.md)

### Pass (للتوثيق)
- iOS ATS: `NSAllowsArbitraryLoads=false` ✅ ([ios/PartnerAppNew/Info.plist:27-34](../../ios/PartnerAppNew/Info.plist))
- Android `allowBackup="false"` ✅ ([AndroidManifest.xml:20](../../android/app/src/main/AndroidManifest.xml))
- لا توجد Deep Links مخصّصة (لا attack surface)
- بنية الـ logout صحيحة ([authStore.js — clearSession](../../src/store/authStore.js))

---

## أولوية التنفيذ المقترحة

**Sprint الحالي (إلزامي قبل الإنتاج):**
SEC-01 → SEC-05 → SEC-07 → SEC-04 → SEC-02 → SEC-03

**Sprint القادم:**
SEC-06 → SEC-08 → SEC-09 → SEC-10

**Backlog:**
SEC-11 → SEC-12 → SEC-13
