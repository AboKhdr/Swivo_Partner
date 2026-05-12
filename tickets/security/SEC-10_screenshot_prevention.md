# SEC-10: No screenshot / FLAG_SECURE prevention

**Severity:** 🟡 Medium
**Component:** UI / Privacy
**Status:** Open

---

## الوصف

التطبيق لا يمنع لقطات الشاشة على الشاشات الحساسة (OTP، المحفظة، تفاصيل العملاء، رقم الهاتف). على Android، `FLAG_SECURE` غير مضاف. على iOS، لا توجد معالجة لـ background snapshots.

## الأدلة

- لا يوجد `getWindow().setFlags(LayoutParams.FLAG_SECURE, ...)` في `MainActivity.java`
- لا توجد مكتبة مثل `react-native-prevent-screenshot-android` مثبّتة
- iOS: لا overlay عند `applicationWillResignActive` لإخفاء المحتوى من app switcher

## التأثير

- لقطة شاشة لشاشة OTP تكشف الرمز (خاصة في Recents/App Switcher)
- محتوى المحفظة وأرصدتها يظهر في Recents
- بيانات العملاء (هاتف/عنوان) قابلة للالتقاط من malware يطلب accessibility

## معايير القبول

- [ ] إضافة `FLAG_SECURE` على شاشات: OtpScreen, WalletScreen, PersonalInfoScreen, OrderDetailsScreen
- [ ] استخدام `useFocusEffect` لتفعيله عند focus وإزالته عند blur
- [ ] على iOS: إضافة overlay (View أبيض/شعار التطبيق) في `applicationWillResignActive` لإخفاء المحتوى من snapshot
- [ ] اختبار: محاولة لقطة على شاشة OTP يجب أن تُمنع على Android
- [ ] اختبار: شاشة Recents يجب أن تُظهر شعاراً لا محتوى الشاشة

## ملاحظات تقنية

```java
// MainActivity.java - onCreate
getWindow().setFlags(
  WindowManager.LayoutParams.FLAG_SECURE,
  WindowManager.LayoutParams.FLAG_SECURE
);
```

أو ديناميكياً عبر native module بسيط (`setFlagSecure(boolean)`) ينفّذه react من الشاشات الحساسة.

iOS:
```objc
- (void)applicationWillResignActive:(UIApplication *)application {
  UIView *blurView = ... ;
  [self.window addSubview:blurView];
}
```
