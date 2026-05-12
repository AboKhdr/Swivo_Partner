# توثيق اختبارات تكامل قدرات الجهاز

**الملف:** `__tests__/device/deviceCapabilities.test.js`  
**عدد الاختبارات:** 57 اختبار — جميعها تنجح  
**النطاق:** قدرات الجهاز المُستخدمة فعلياً في التطبيق فقط

---

## القرار: ماذا نختبر وماذا نتجاهل

التطبيق **لا يستخدم** كل القدرات المُذكورة في طلبات الاختبار النموذجية. لذا اختبرنا فقط ما هو موجود في الكود فعلياً.

### القدرات المُستخدمة (مُختبَرة) ✓

| القدرة | المكتبة | الاستخدام |
|--------|---------|----------|
| الكاميرا | `react-native-image-picker` | التقاط صور للطلبات والملف الشخصي |
| المعرض | `react-native-image-picker` | اختيار صور موجودة |
| ضغط الصور | quality: 0.8 | يُطبَّق تلقائياً عبر المكتبة |
| إذن الكاميرا | `PermissionsAndroid` | Android فقط |
| Push Notifications | `@react-native-firebase/messaging` | FCM tokens، رسائل foreground/background |
| القنوات والإشعارات | `@notifee/react-native` | 5 قنوات، الرنين، الإلغاء |

### القدرات غير المُستخدمة (مُوثَّقة بـ "not integrated") ✗

| القدرة | السبب |
|--------|-------|
| Biometrics (Touch ID, Face ID) | المكتبة غير مثبتة |
| Native Geolocation | التطبيق يستخدم WebView Maps فقط |
| NFC | غير مطلوب |
| Bluetooth | غير مطلوب |
| Accelerometer / Gyroscope | غير مستخدم |

> اختبارات قسم "Capabilities NOT integrated" تتحقق فعلياً أن `require()` للمكتبات المذكورة يفشل — هذا يحمي من إضافتها بالخطأ في المستقبل بدون تحديث الاختبارات.

---

## البنية التقنية

### مشكلة Babel interop مع notifee (مُصلَحة في jest.setup.js)

الكود يستخدم:
```js
import notifee from '@notifee/react-native';
notifee.createChannel(...);
```

الـ mock الأصلي في `jest.setup.js` كان بدون `__esModule: true` flag — هذا يُسبب Babel أن يُعيد لفّ الكائن في `default` مرة أخرى عند الـ CommonJS interop، فيصبح `notifee.createChannel` غير معرّف.

**الإصلاح في `jest.setup.js`:**

```js
jest.mock('@notifee/react-native', () => ({
  __esModule: true,                // ← المفتاح
  default: {
    requestPermission, createChannel, displayNotification,
    cancelNotification, onForegroundEvent, onBackgroundEvent,
  },
  AndroidImportance: {HIGH: 4, DEFAULT: 3},
  AndroidVisibility: {PUBLIC: 1},
  AndroidCategory:   {CALL: 'call'},
  EventType:         {PRESS: 1, DISMISSED: 2},
}));
```

في ملف الاختبار، نستهلك الـ mock العالمي مباشرة:
```js
const notifee = require('@notifee/react-native').default;
```

### دوال المساعدة

```js
getTextContent(node)              // يستخرج النص من شجرة React (آمن من circular refs)
findTouchableByText(inst, text)   // يجد TouchableOpacity بنص الطفل
pressByText(inst, text)            // يضغط حسب النص
pressFirstTouchable(inst)          // يفتح أول TouchableOpacity (للـ placeholder)
renderAndPickOption(label)         // يُصيِّر + يفتح modal + يضغط الخيار
```

**لماذا `getTextContent` بدلاً من `JSON.stringify`؟**  
React Test Renderer يضع Fiber nodes في `_owner` داخل props.children. `JSON.stringify` يفشل بـ "Converting circular structure". الحل: المرور recursively على `children` فقط دون props.

---

## المجموعات والاختبارات

### 1. ImagePickerField — Camera Permission (5 اختبارات)

اختبار سلوك إذن الكاميرا في 5 حالات:

| الحالة | السلوك المتوقع |
|--------|----------------|
| Android + permission granted | `launchCamera({mediaType:'photo', quality:0.8})` |
| Android + denied | لا يُطلق الكاميرا، لا onChange |
| Android + never_ask_again | لا يُطلق الكاميرا |
| Android — أي حال | `PermissionsAndroid.request(CAMERA)` يُستدعى أولاً |
| iOS | يتخطى `PermissionsAndroid` (يعتمد على Info.plist) |

```js
it('does NOT launch camera when CAMERA permission is denied', async () => {
  PermissionsAndroid.request.mockResolvedValue('denied');
  const {onChange} = await renderAndPickOption('التقاط صورة');
  expect(mockLaunchCamera).not.toHaveBeenCalled();
  expect(onChange).not.toHaveBeenCalled();
});
```

---

### 2. ImagePickerField — Camera Capture (3 اختبارات)

سلوك ما بعد فتح الكاميرا:

| الحالة | السلوك |
|--------|--------|
| نجح + assets[0] | `onChange(uri)` |
| `didCancel: true` | لا onChange |
| `assets: []` (فارغ) | لا onChange |

---

### 3. ImagePickerField — Gallery (4 اختبارات)

| الحالة | السلوك |
|--------|--------|
| نجح | `onChange(uri)` |
| ألغى | لا onChange |
| في كل الأحوال | **لا** يُطلب إذن الكاميرا (المعرض لا يحتاجه) |
| الـ options | `quality: 0.8, mediaType: 'photo'` |

---

### 4. ImagePickerField — Image compression (2 اختبار)

كلا المسارين (الكاميرا والمعرض) يُرسلان `quality: 0.8` دائماً — وهذا يضمن ضغط JPEG ~80% قبل الرفع، بدون الحاجة لمكتبة ضغط منفصلة.

---

### 5. Notifee — Channel Setup (7 اختبارات)

إعداد القنوات الأندرويدية الـ 5:

| القناة | الأهمية | الصوت | bypassDnd |
|-------|--------|-------|-----------|
| `incoming_orders_v6` | HIGH | `incoming_order` | ✓ نعم |
| `new_order_v2` | HIGH | default | لا |
| `order_updates` | HIGH | default | لا |
| `biker_alerts` | HIGH | default | لا |
| `general` | DEFAULT | default | لا |

اختبار خاص: **iOS لا يُنشئ قنوات** (الكود يحرس بـ `if (Platform.OS !== 'android') return`).

---

### 6. Notifee — resolveChannel mapping (5 اختبارات)

اختبار الدالة التي تُوجِّه الإشعارات للقناة الصحيحة:

```
'new_order'             → CHANNEL_NEW_ORDER
'order_updates'         → CHANNEL_UPDATES
'biker_alerts'          → CHANNEL_ALERTS
'dashboard_notification' → CHANNEL_GENERAL
unknown / null / undefined → CHANNEL_GENERAL (fallback)
```

---

### 7. Notifee — displayNotification (4 اختبارات)

| الفحص | السلوك |
|------|--------|
| القناة | يُعرض على القناة المُوجَّهة من `resolveChannel` |
| الأيقونة الصغيرة | `smallIcon: 'ic_notification'` |
| pressAction | `id: 'default'` (يُمكِّن `handleNavigate` عند الضغط) |
| النوع غير معطى | يستخدم القناة العامة fallback |

---

### 8. Notifee — Incoming Order Ring Loop (8 اختبارات)

أهم وأعقد جزء: حلقة الرنين كل 8 ثوانٍ لطلبات الـ partner الجديدة.

```js
it('repeats every 8 seconds', async () => {
  await showIncomingOrderNotification({service: 'Wash'});
  expect(notifee.displayNotification).toHaveBeenCalledTimes(1);

  await act(async () => { jest.advanceTimersByTime(8000); });
  expect(notifee.displayNotification).toHaveBeenCalledTimes(2);

  await act(async () => { jest.advanceTimersByTime(8000); });
  expect(notifee.displayNotification).toHaveBeenCalledTimes(3);
});
```

| الاختبار | التحقق |
|---------|--------|
| إشعار فوري عند البدء | `displayNotification` يُستدعى مرة واحدة |
| استخدام قناة `incoming_orders_v6` + full-screen intent | `category: 'call'`, `fullScreenAction` |
| iOS critical sound | `ios.critical: true, criticalVolume: 1.0` |
| بديل ID `_0` و `_1` | لإجبار Android على إعادة تشغيل الصوت كل تكرار |
| التكرار كل 8s | `jest.advanceTimersByTime(8000)` |
| `cancelIncomingOrderNotification` يوقف الحلقة | لا displays بعد الإلغاء |
| `stopRinging` يوقف فقط دون إلغاء | تماثل مع cancel لكن دون حذف |
| ring جديد يلغي القديم | لا double-ringing |

> **لماذا تكرار كل 8s؟** Android يُسكت الصوت بعد أول إشعار للقناة الواحدة. الحل: إلغاء الإشعار وعرض جديد بـ ID مختلف لإجبار النظام على تشغيل الصوت مرة أخرى. هذا تفسير `tick % 2`.

---

### 9. Firebase Messaging — Permission & Token (5 اختبارات)

| الفحص | التوقع |
|------|-------|
| `AuthorizationStatus.AUTHORIZED` | `1` (granted) |
| `AuthorizationStatus.PROVISIONAL` | `2` (granted on iOS quiet) |
| `requestPermission` يُستدعى على iOS | في bootstrap |
| `getToken` يُعيد token | (mocked: 'mock-fcm-token') |
| status = 0 (DENIED) | `isGranted` تُقيَّم بـ `false` |

---

### 10. Firebase Messaging — Listener registration (5 اختبارات)

التحقق أن جميع الـ listeners تُعيد دالة `unsubscribe`:
- `onMessage` (foreground)
- `onTokenRefresh`
- `onNotificationOpenedApp` (background tap)
- `getInitialNotification` (cold start tap) → resolves to null بدون إشعار
- `setBackgroundMessageHandler` (يُسجَّل بدون أن يُرمى)

---

### 11. Notifee — Permission & Events (4 اختبارات)

- `requestPermission` يُحَل بنجاح
- `EventType.PRESS = 1` ← هذه القيمة مستخدمة في `FirebaseContext` للتحقق `type !== EventType.PRESS`
- `EventType.DISMISSED = 2` ← لتجاهل الـ dismissals
- `onForegroundEvent` يُعيد دالة unsubscribe

---

### 12. Capabilities NOT integrated (5 اختبارات)

اختبارات تأكيد أن الحزم غير مثبتة:

```js
it('biometrics: react-native-biometrics is not a dependency', () => {
  expect(() => require('react-native-biometrics')).toThrow();
});
```

**الفائدة:** إذا أضاف أحدهم `react-native-biometrics` لاحقاً دون كتابة اختبارات الـ biometric flow، سيفشل هذا الاختبار ويُذكِّره.

---

## تشغيل الاختبارات

```bash
# اختبارات قدرات الجهاز فقط
npx jest __tests__/device/deviceCapabilities.test.js

# مع تفاصيل
npx jest __tests__/device/deviceCapabilities.test.js --verbose

# كل الاختبارات
npx jest
```

**النتيجة المتوقعة:** 57 passed, 57 total

---

## ما لا يُغطّيه (وما يجب اختباره يدوياً)

اختبارات Jest **لا** تستطيع التحقق من:

| الأمر | كيف نختبره |
|------|------------|
| الإذن الفعلي يظهر للمستخدم | اختبار يدوي على المحاكي |
| الكاميرا تفتح فعلاً | يدوي |
| الصورة تُلتقط بدقة 1080p+ | يدوي + أداة فحص ملف |
| الإشعار يُسمَع بصوت `incoming_order` | يدوي على جهاز فعلي |
| الـ FCM token يصل للـ backend ويُسجَّل | اختبار طرفي + فحص logs الباك-إند |
| Full-screen intent يُغطّي الشاشة | يدوي على Android 10+ |
| الإشعار يَسبق Do Not Disturb (`bypassDnd`) | يدوي مع DnD مفعَّل |

---

## إضافة اختبارات لقدرة جديدة

عند إضافة قدرة جهاز جديدة (مثلاً Biometrics):

1. **احذف** اختبار "biometrics: not a dependency" من قسم "Capabilities NOT integrated"
2. **أضف** `describe('Biometrics — Permission & Auth')` جديد
3. **اتبع** نفس النمط: mock المكتبة → افحص الاستدعاءات بقيم متعددة (granted/denied/lockout)

```js
// مثال
const mockSimplePrompt = jest.fn();
jest.mock('react-native-biometrics', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    simplePrompt: (...args) => mockSimplePrompt(...args),
  })),
}));

describe('Biometrics — Authentication', () => {
  it('calls simplePrompt with the correct title', async () => { ... });
  it('returns false on cancel', async () => { ... });
  it('returns false on lockout (too many attempts)', async () => { ... });
});
```
