# توثيق اختبارات منظومة التنقل

**الملف:** `__tests__/navigation/navigation.test.js`  
**عدد الاختبارات:** 125 اختبار — جميعها تنجح  
**بيئة التشغيل:** Jest + react-test-renderer (بدون @testing-library/react-native)

---

## لماذا هذه الاختبارات؟

التنقل في هذا التطبيق مكتوب يدوياً بالكامل (لا `@react-navigation/bottom-tabs`)، مما يعني:
- سلوك الـ BackHandler مُطبَّق يدوياً في كل navigator
- الـ lazy-mount والـ display:none مُدارَان في الـ state
- أي خطأ في منطق `history` أو `mounted` يمكن أن يُخفى بسهولة

هذه الاختبارات تضمن صحة هذا المنطق دون الحاجة لتشغيل المحاكي.

---

## البنية التقنية

### أدوات المحاكاة (Testing Utilities)

```
inst.toJSON()  → شجرة JSON ثابتة — للاستعلامات فقط (exists / findAll / findOne)
inst.root      → شجرة React حية — للتفاعل (press / pressTabByLabel)
```

**السبب:** `toJSON()` لا يحفظ دوال `onPress` (تُحذف عند التسلسل)، لذا نستخدم `inst.root.findAllByType(TouchableOpacity)` للضغط على العناصر الحية.

### محاكاة BackHandler

```js
// يُسجَّل يدوياً في beforeAll
BackHandler.addEventListener = jest.fn((event, handler) => {
  _backListeners.push(handler);
  return { remove: () => { /* يُزيل handler من القائمة */ } };
});

// pressBack(): يُطلق المعالجات بترتيب LIFO (آخر مُسجَّل أولاً)
// يُعيد true إذا استُهلك الضغط، false إذا وصل للجذر
```

### دوال المساعدة

| الدالة | الاستخدام |
|--------|-----------|
| `exists(json, testID)` | هل العنصر موجود في الشجرة؟ |
| `findAll(json, testID)` | كل العناصر بـ testID معين |
| `findOne(json, testID)` | أول عنصر بـ testID معين |
| `press(inst, testID)` | يضغط عنصراً حياً بـ testID |
| `pressTabByLabel(inst, label)` | يضغط تبويباً بنص التسمية |
| `pressBack()` | يُحاكي زر Back Hardware |

---

## المجموعات والاختبارات

### 1. BikerAppNavigator — 23 اختبار

يختبر `src/biker/navigation/AppNavigator.js`

#### الـ Initial Render
- يبدأ على تبويب Home افتراضياً
- لا يُنشئ Reviews/Profile عند البداية (lazy)
- يُصيِّر جميع الـ 4 مفاتيح للتسميات

#### Tab Switching
| السيناريو | السلوك المتوقع |
|----------|----------------|
| أول ضغطة على Reviews | يُنشئ `ReviewsScreen` في الشجرة |
| التبديل من Reviews إلى Home | `ReviewsScreen` يبقى مُنشَأً (display:none) |
| الضغط على التبويب النشط | لا يُكرِّر الإنشاء |
| زيارة الـ 4 تبويبات | بدون crash |

#### Hardware Back Button (Android)
| السيناريو | السلوك المتوقع |
|----------|----------------|
| Back على تبويب الجذر | `false` — لا يُستهلك (OS يتولى) |
| Back بعد تبديل تبويب | `true` — يعود للتبويب السابق |
| `unmount` | يُزيل BackHandler listener |

#### pendingNav (التنقل عبر الإشعارات)
| القيمة | السلوك |
|--------|--------|
| `{tab: 'orders'}` | يستدعي `clearNav` |
| `{tab: 'notifications'}` | يُعيِّن للـ `home` (NAV_TAB_MAP) |
| `{tab: 'nonexistent'}` | يتجاهل بدون crash |
| `null` | لا يستدعي `clearNav` |

---

### 2. PartnerNavigator — 31 اختبار

يختبر `src/partner/navigation/PartnerNavigator.js`

#### Operations Tab — unmount: true
هذا التبويب يختلف عن الباقين: يُدمَّر عند المغادرة ويُعاد إنشاؤه عند العودة.

```
// تبويبات unmount:false  → تبقى في الشجرة (display:none)
// تبويب Operations       → يُحذف من الشجرة عند المغادرة
```

| السيناريو | النتيجة |
|----------|---------|
| ضغط Operations | `screen-OperationsNavigator` يظهر |
| الانتقال لـ Dashboard | `screen-OperationsNavigator` يختفي من الشجرة |
| العودة لـ Operations | يُعاد إنشاؤه من الصفر |
| Orders (unmount:false) → Dashboard | `screen-PartnerOrdersNavigator` يبقى |

#### Badge Count (unreadCount)
```
0    → لا badge
3    → "3"
9    → "9"   (ليس "9+")
10   → "9+"
9999 → "9+"  (لا crash)
```

#### Incoming Order Overlay
يُختبر `IncomingOrderScreen` المُدمَج في PartnerNavigator:

| الحالة | السلوك |
|--------|--------|
| `incomingOrder = null` | لا يُصيِّر الـ overlay |
| `incomingOrder = {id}` | يُصيِّر الـ overlay مع `order.id` |
| ضغط Accept | يستدعي `clearIncomingOrder()` |
| ضغط Reject | يستدعي `clearIncomingOrder()` |

---

### 3. BikerOrdersNavigator — 29 اختبار

يختبر `src/biker/features/orders/OrdersNavigator.js`

#### نمط "Always-Mounted List"
```
OrdersScreen دائماً مُنشأ في الشجرة.
عند فتح Detail أو Map → OrdersScreen يُخفى بـ display:none (ليس unmount).
```

#### Push/Pop
```
list → detail:  OrdersScreen-order pressed → OrderDetailsScreen يظهر
list → map:     OrdersScreen-location pressed → OrderMapScreen يظهر
detail → list:  OrderDetailsScreen-back pressed → يعود + يُفرغ selectedOrder
map → list:     OrderMapScreen-back pressed → يعود
```

#### تمرير الـ Params
```js
// OrdersScreen-order يرسل: {id: 'o1', status: 'ASSIGNED'}
// التحقق: findOne(inst.toJSON(), 'OrderDetailsScreen-order-id').children → 'o1'
```

#### BackHandler
| الحالة | التسجيل |
|--------|---------|
| الشاشة list (screen = null) | لا يُسجَّل (guard: `if (!screen) return`) |
| فتح detail أو map | يُسجَّل |
| Back Hardware | يُعيد لـ list + يُزيل listener |
| unmount مع شاشة مفتوحة | يُزيل listener |

---

### 4. BikerProfileNavigator — 43 اختبار

يختبر `src/biker/features/profile/ProfileNavigator.js`

#### الشاشات الفرعية الخمس
كل شاشة لها **7 اختبارات** مستقلة:

| الاختبار | التحقق |
|----------|--------|
| `onNavigate(action)` | الشاشة تظهر |
| ProfileScreen يبقى | `screen-ProfileScreen` موجود في الشجرة |
| `onBack` | الشاشة تختفي |
| Hardware Back | الشاشة تختفي |
| Back consumed | `pressBack()` يُعيد `true` |
| BackHandler يُسجَّل | بعد فتح الشاشة |
| BackHandler يُزال | بعد `onBack` |

#### الشاشات وأفعالها
```
'info'     → PersonalInfoScreen
'wallet'   → WalletScreen
'language' → LanguageScreen
'support'  → SupportScreen
'terms'    → TermsScreen
```

---

### 5. Auth Flow Routing — 9 اختبارات

يختبر منطق `App.tsx` مباشرة (الـ conditions وليس الـ render).

#### Role Normalisation
```js
// منطق authStore.setSession:
normalise = (backendRole) =>
  backendRole === 'biker' ? 'biker' : backendRole ? 'admin' : null
```

| Backend Role | App Role |
|-------------|----------|
| `'biker'`   | `'biker'` |
| `'client'`  | `'admin'` |
| `'admin'`   | `'admin'` |
| `'manager'` | `'admin'` |
| `null`      | `null` |
| `undefined` | `null` |

#### Navigator Selection (AppRoot JSX)
```jsx
{role === 'biker' && <BikerNavigator />}   // biker فقط
{role === 'admin' && <PartnerNavigator />}  // أي role آخر غير null
{!role && <LoginScreen />}                  // null أو undefined
```

#### isReady Gate
```js
if (!isReady) return null;  // أثناء hydration من AsyncStorage
```

---

### 6. Edge Cases — 9 اختبارات

| السيناريو | السلوك المتوقع |
|----------|----------------|
| 3 تبديلات → 3 ضغطات Back → Back رابع | الأخيرة `false` (جذر) |
| 10 تبديلات سريعة | بدون crash |
| BikerOrders: Back على list | `false` (لا BackHandler مُسجَّل) |
| Profile: Back على menu | `false` |
| IncomingOrder: Accept | `clearIncomingOrder` يُستدعى |
| IncomingOrder: Reject | `clearIncomingOrder` يُستدعى |

---

## تشغيل الاختبارات

```bash
# اختبارات التنقل فقط
npx jest __tests__/navigation/navigation.test.js

# مع تفاصيل كل اختبار
npx jest __tests__/navigation/navigation.test.js --verbose

# كل الاختبارات
npx jest
```

**النتيجة المتوقعة:** 125 passed, 125 total

---

## إضافة اختبارات جديدة

### عند إضافة navigator جديد

1. أضف mock للشاشات الجديدة:
```js
jest.mock('../../src/path/to/NewScreen', () => mockMakeScreen('NewScreen'));
```

2. أضف import للـ navigator بعد الـ mocks:
```js
const NewNavigator = require('../../src/path/NewNavigator').default;
```

3. اتبع نفس النمط:
```js
describe('NewNavigator', () => {
  it('initial render', () => {
    let inst;
    act(() => { inst = create(<NewNavigator />); });
    expect(exists(inst.toJSON(), 'screen-NewScreen')).toBe(true);
  });
});
```

### عند إضافة شاشة فرعية جديدة لـ ProfileNavigator

أضف الشاشة إلى مصفوفة `SUB_SCREENS` في `describe('BikerProfileNavigator')`:
```js
{action: 'newscreen', screen: 'NewScreen'},
```
الـ `describe.each` سيُولِّد الـ 7 اختبارات تلقائياً.

---

## قرارات التصميم

**لماذا `react-test-renderer` وليس `@testing-library/react-native`؟**
لأن `@testing-library/react-native` غير مثبتة في المشروع. `react-test-renderer` يكفي تماماً لاختبار منطق التنقل.

**لماذا `inst.root` للضغط و`inst.toJSON()` للاستعلام؟**
`toJSON()` يُنتج JSON نقي بدون دوال (onPress تُحذف). `inst.root` يُبقي كل شيء حياً. نستخدم كل أداة لما صُمِّمت له.

**لماذا `pressBack()` يُغلِّف `act()`؟**
BackHandler يُطلق setState مباشرة. بدون `act()` يصدر React تحذيراً "state update not wrapped in act".

**لماذا `mockMakeScreen` وليس `makeMockScreen`؟**
Jest يمنع الـ mock factories من الوصول لمتغيرات خارج نطاقها، إلا تلك التي تبدأ بـ `mock` (case-insensitive).
