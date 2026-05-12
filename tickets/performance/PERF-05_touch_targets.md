# PERF-05: Touch targets below 48dp WCAG minimum

**Severity:** 🟠 High
**Component:** A11y / UX
**Status:** Open

---

## الوصف

كثير من الأزرار والأيقونات في التطبيق بأحجام 32-36dp، أقل من الحد الأدنى لـ WCAG 2.1 (48×48dp). هذا يصعّب الضغط، خاصة لمستخدمين كبار السن أو ذوي إعاقات حركية.

## الأدلة (Citations)

- [src/biker/features/home/HomeScreen.js](../../src/biker/features/home/HomeScreen.js) — `topBarBtn` 36dp
- [src/biker/features/orders/components/OrderListCard.js](../../src/biker/features/orders/components/OrderListCard.js) — icon buttons 34dp
- [src/partner/features/orders/OrderDetailsScreen.js](../../src/partner/features/orders/OrderDetailsScreen.js) — `phoneBtn` 40dp (قريب لكن أقل)

## التأثير

- صعوبة الاستخدام على شاشات صغيرة
- ضغطات خاطئة → إلغاء طلب بدل قبوله
- ينتهك WCAG 2.1 (Success Criterion 2.5.5)
- تجربة سيئة في الـ landscape mode

## معايير القبول

- [ ] فحص جميع `TouchableOpacity` و `Pressable`:
  - عرض/ارتفاع ≥ 48dp، أو
  - `hitSlop` يوسع منطقة اللمس
- [ ] الأيقونات الصغيرة (16-20dp) يجب أن تكون داخل touch area 48dp:
  ```jsx
  <TouchableOpacity hitSlop={{top: 14, bottom: 14, left: 14, right: 14}}>
    <Icon size={20} />
  </TouchableOpacity>
  ```
- [ ] أو padding داخلي:
  ```jsx
  <TouchableOpacity style={{padding: 14}}>
    <Icon size={20} />
  </TouchableOpacity>
  ```
- [ ] الإبقاء على حجم visual صغير إذا التصميم يتطلب، فقط زيادة touch area عبر hitSlop
- [ ] اختبار يدوي على شاشات صغيرة (4.7"-5.5")
- [ ] إضافة قاعدة eslint: `react-native-a11y/has-valid-accessibility-hit-slop`

## ملاحظات تقنية

- **القاعدة الذهبية:** المسافة الفعّالة بين targets متجاورة ≥ 8dp
- المساحة بين الأزرار في `FooterRow` يجب التحقق منها
- استخدام مكون wrapper:
  ```jsx
  const IconButton = ({onPress, children, accessibilityLabel}) => (
    <TouchableOpacity
      onPress={onPress}
      hitSlop={{top: 12, bottom: 12, left: 12, right: 12}}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={{minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center'}}
    >
      {children}
    </TouchableOpacity>
  );
  ```
- مرتبط بـ [PERF-04](PERF-04_accessibility_missing.md)
