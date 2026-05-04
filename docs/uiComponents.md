# UI Shared Components

مكونات مشتركة بين تطبيق البايكر والبارتنر. كلها تقرأ من `useTheme()` تلقائياً وتدعم الوضع الليلي.

---

## المكونات

### `DeleteConfirmModal`
**المسار:** `src/shared/components/DeleteConfirmModal.js`

مودال تأكيد الحذف مع أيقونة تحذير.

```js
<DeleteConfirmModal
  visible={showDelete}
  title="حذف الفرع"               // default: 'حذف نهائياً'
  message="سيتم حذف الفرع نهائياً" // default نص عربي
  confirmLabel="حذف"               // default: 'حذف'
  cancelLabel="تراجع"              // default: 'تراجع'
  onConfirm={() => handleDelete()}
  onClose={() => setShowDelete(false)}
/>
```

| Prop | النوع | الوصف |
|---|---|---|
| `visible` | bool | يتحكم في ظهور المودال |
| `title` | string | عنوان المودال |
| `message` | string | نص التأكيد |
| `confirmLabel` | string | نص زر التأكيد |
| `cancelLabel` | string | نص زر الإلغاء |
| `onConfirm` | func | عند الضغط على تأكيد |
| `onClose` | func | عند الإغلاق أو الإلغاء |

---

### `SelectField`
**المسار:** `src/shared/components/SelectField.js`

قائمة اختيار منسدلة (dropdown) مع modal.

```js
<SelectField
  label="نوع الخدمة"
  placeholder="اختر نوع..."
  options={[
    {value: 'wash', label: 'غسيل'},
    {value: 'polish', label: 'بوليش'},
  ]}
  value={selectedValue}
  onChange={val => setSelectedValue(val)}
/>
```

| Prop | النوع | الوصف |
|---|---|---|
| `label` | string | تسمية الحقل (اختياري) |
| `placeholder` | string | نص عند عدم الاختيار |
| `options` | `{value, label}[]` | قائمة الخيارات |
| `value` | any | القيمة المحددة حالياً |
| `onChange` | func | callback عند الاختيار |

---

### `ImagePickerField`
**المسار:** `src/shared/components/ImagePickerField.js`

حقل رفع صورة مع معاينة وخيارات كاميرا/معرض.

```js
<ImagePickerField
  label="صورة الخدمة"
  value={imageUri}
  onChange={uri => setImageUri(uri)}
/>
```

| Prop | النوع | الوصف |
|---|---|---|
| `label` | string | تسمية الحقل |
| `value` | string \| null | URI الصورة الحالية |
| `onChange` | func | callback بـ URI الجديد أو null عند الحذف |

**ملاحظة:** وظيفة الكاميرا والمعرض معطّلة حتى يُفعَّل `react-native-image-picker`.

---

### `StatusTracker`
**المسار:** `src/shared/components/StatusTracker.js`

شريط تتبع مراحل الطلب — 5 خطوات أفقية مع خطوط ربط.

```js
<StatusTracker status="ON_THE_WAY" />
```

| Prop | النوع | الوصف |
|---|---|---|
| `status` | string | الحالة الحالية من `STATUS_STEPS` |

**المراحل بالترتيب:**

| Status | الأيقونة | المعنى |
|---|---|---|
| `ASSIGNED` | Play | مُسند |
| `ON_THE_WAY` | MapPin | في الطريق |
| `ARRIVED` | UserCheck | وصل |
| `STARTED` | Droplets | بدأ التنفيذ |
| `COMPLETED` | Camera | مكتمل |

**السلوك البصري:**
- **مكتمل:** خلفية `primary + 18%` مع أيقونة ملونة
- **نشط:** خلفية `primary` صلبة مع `shadow` + نبضة متحركة
- **مستقبلي:** حدود فقط مع أيقونة `textSecondary`

---

### `MapContainer`
**المسار:** `src/shared/components/MapContainer.js`

placeholder للخريطة — غير وظيفي حتى تثبيت `react-native-webview`.

```js
<MapContainer height={250} />  // ارتفاع ثابت
<MapContainer height={null} /> // يملأ المساحة المتاحة
```

| Prop | النوع | الوصف |
|---|---|---|
| `height` | number \| null | الارتفاع بالـ px أو null لـ flex:1 |

---

## الثوابت

### `colors.js`
**المسار:** `src/shared/constants/colors.js`

```js
import {useTheme} from '../context/ThemeContext';
const {colors} = useTheme();
```

**لا تستخدم الألوان مباشرة** — دائماً عبر `useTheme()`.

| Token | Light | Dark | الاستخدام |
|---|---|---|---|
| `primary` | `#1B7BF5` | `#3B9EFF` | أزرار، تركيز، نشط |
| `primaryDark` | `#1460C7` | `#1B7BF5` | hover، ضغط |
| `success` | `#22C55E` | `#22C55E` | مكتمل، نجاح |
| `warning` | `#F59E0B` | `#F59E0B` | تحذير، معلق |
| `danger` | `#EF4444` | `#EF4444` | خطأ، حذف، إلغاء |
| `purple` | `#8B5CF6` | `#A78BFA` | جارٍ التنفيذ |
| `bg` | `#F8FAFC` | `#0F172A` | خلفية الشاشة |
| `card` | `#FFFFFF` | `#1E293B` | خلفية البطاقات |
| `textPrimary` | `#0F172A` | `#F1F5F9` | النصوص الرئيسية |
| `textSecondary` | `#64748B` | `#94A3B8` | النصوص الثانوية |
| `border` | `#E2E8F0` | `#334155` | الحدود والفواصل |

---

### `status.js`
**المسار:** `src/shared/constants/status.js`

```js
import {STATUS_MAP, STATUS_STEPS, STATUS_COLORS} from '../constants/status';
```

**`STATUS_STEPS`** — ترتيب مراحل طلب البايكر:
```js
['ASSIGNED', 'ON_THE_WAY', 'ARRIVED', 'STARTED', 'COMPLETED']
```

**`STATUS_MAP`** — تسمية ولون كل حالة:
```js
STATUS_MAP['ON_THE_WAY'] // {label: 'في الطريق', color: primary}
```

**`STATUS_COLORS`** — ألوان badge لكل حالة (`bg`, `text`, `dot`):
```js
// مثال الاستخدام
const {bg, text, dot} = STATUS_COLORS[order.status] ?? STATUS_COLORS.ASSIGNED;
<View style={{backgroundColor: bg}}>
  <View style={{backgroundColor: dot, width: 6, height: 6, borderRadius: 3}} />
  <Text style={{color: text}}>{STATUS_MAP[order.status]?.label}</Text>
</View>
```

| Status | bg | text | dot |
|---|---|---|---|
| `ASSIGNED` | `#FEF3C7` | `#D97706` | `#F59E0B` |
| `ON_THE_WAY` | `#DBEAFE` | `#1D4ED8` | `#3B82F6` |
| `STARTED` | `#EDE9FE` | `#6D28D9` | `#8B5CF6` |
| `COMPLETED` | `#D1FAE5` | `#065F46` | `#10B981` |
| `CANCELLED` | `#FEE2E2` | `#991B1B` | `#EF4444` |

---

## أنماط متكررة

### SwipeButton
مكوّن inline داخل `src/biker/features/orders/OrderDetailsScreen.js` — للإجراءات الحساسة التي تحتاج تأكيداً بالسحب.

```js
<SwipeButton
  key={currentStatus}   // مهم — يُعيد المكوّن عند تغيير الحالة
  label="ابدأ التنفيذ"
  color={colors.primary}
  onComplete={handleAction}
  loading={isLoading}
/>
```

> `key={currentStatus}` إلزامي لإعادة تهيئة الـ PanResponder عند كل مرحلة.

---

### نمط الـ Header القياسي

```js
<View style={[s.header, {backgroundColor: colors.bg}]}>
  <TouchableOpacity onPress={onBack} style={s.backBtn}>
    <ArrowRight size={22} color={colors.textPrimary} />
  </TouchableOpacity>
  <Text style={[s.title, {color: colors.textPrimary}]}>عنوان الصفحة</Text>
  <View style={s.backBtn} /> {/* spacer للتوازن */}
</View>

// Styles
header: {
  flexDirection: 'row',
  alignItems: 'center',
  paddingTop: Platform.OS === 'ios' ? 56 : 48,
  paddingBottom: 16,
  paddingHorizontal: 16,
},
backBtn: {width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center'},
title: {flex: 1, fontSize: 16, fontWeight: '700', textAlign: 'center'},
```

---

### نمط Badge الحالة

```js
const sc = STATUS_COLORS[status];
<View style={[badge.wrap, {backgroundColor: sc.bg}]}>
  <View style={[badge.dot, {backgroundColor: sc.dot}]} />
  <Text style={[badge.txt, {color: sc.text}]}>{STATUS_MAP[status]?.label}</Text>
</View>

badge: {
  wrap: {flexDirection:'row', alignItems:'center', gap:5, paddingHorizontal:10, paddingVertical:4, borderRadius:20},
  dot:  {width:6, height:6, borderRadius:3},
  txt:  {fontSize:12, fontWeight:'700'},
}
```
