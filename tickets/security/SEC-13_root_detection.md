# SEC-13: No Jailbreak/Root detection

**Severity:** 🟡 Medium
**Component:** Runtime Integrity
**Status:** Open

---

## الوصف

التطبيق لا يكشف الأجهزة المخترقة (Rooted Android / Jailbroken iOS). على هذه الأجهزة، استخراج tokens من Keychain، تجاوز SSL pinning، ومراقبة الذاكرة كلها سهلة نسبياً.

## الأدلة

- بحث عن: `jailbreak`, `rooted`, `isJailBroken`, `JailMonkey` — لا نتائج
- [package.json](../../package.json) — لا توجد مكتبة فحص integrity

## التأثير

- مستخدم بصلاحيات root يستطيع تجاوز Keychain على Android (SEC-01)
- Frida / Magisk modules تستطيع hook الـ API calls
- تجاوز SSL pinning عبر Frida سهل بدون كشف runtime

## معايير القبول

- [ ] تثبيت `jail-monkey` أو `react-native-device-info` (يوفّر `isEmulator` + `isRooted`)
- [ ] في bootstrap التطبيق: فحص `isJailBroken()` / `isRooted()`
- [ ] القرار: تحذير المستخدم vs منع الاستخدام كلياً
  - **توصية:** تحذير قبل المعاملات المالية (المحفظة)، وليس على الـ login
- [ ] فحص hooks مشهورة (Frida) عبر `JailMonkey.hookDetected()`
- [ ] إرسال flag للباك إند في كل طلب: `X-Device-Integrity: rooted` للمراقبة
- [ ] الباك إند يستطيع تطبيق قواعد إضافية على الأجهزة المخترقة (rate limit أعلى، 2FA إضافي)

## ملاحظات تقنية

- لا يوجد كشف 100% — كل آلية كشف يمكن تجاوزها
- الفلسفة: رفع التكلفة على المهاجم، ليس منعه نهائياً
- Google Play Integrity API و Apple App Attest خيارات أقوى لكن تتطلب backend integration
- قد تُسبب false positives على أجهزة OEM معدّلة (Xiaomi, Huawei) — اختبار واسع مطلوب

---

## الفحوصات الإضافية الموصى بها (مستقبلاً)

- **Play Integrity API** للتحقق من سلامة APK والجهاز
- **App Attest** على iOS 14+
- **Frida detection:** فحص وجود frida-server في `/data/local/tmp/`
- **Debugger detection:** `Debug.isDebuggerConnected()` على Android
