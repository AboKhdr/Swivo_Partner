# PERF-07: No FastImage for remote Cloudinary images

**Severity:** 🟡 Medium
**Component:** Images
**Status:** Open

---

## الوصف

التطبيق يستخدم `Image` من react-native لتحميل صور Cloudinary البعيدة. هذا المكوّن:
- بدون تخزين مؤقت قوي على Android (يعتمد على نظام التخزين الأصلي بدون priority queue)
- بدون التحميل التدريجي (progressive)
- يعيد تحميل الصور عند كل remount
- لا يدعم priority للقوائم الطويلة

`react-native-fast-image` يحل كل ذلك عبر SDWebImage (iOS) + Glide (Android).

## الأدلة (Citations)

- جميع شاشات تعرض صور: `OrderDetailsScreen`, `ProfileScreen`, `BranchesScreen`
- [package.json](../../package.json) — لا يحتوي `react-native-fast-image`
- صور Cloudinary في `proof.beforePhotos`, `proof.afterPhotos`, `userImage`, etc.

## التأثير

- تجربة بطيئة على 3G/4G
- استهلاك بيانات عالٍ (إعادة تحميل عند كل scroll)
- jank في القوائم بسبب decode على المسار الرئيسي
- بطارية أعلى

## معايير القبول

- [ ] تثبيت `react-native-fast-image`
- [ ] على iOS: `pod install`
- [ ] إنشاء wrapper `<RemoteImage>` يفصل عن المكتبة:
  ```jsx
  import FastImage from 'react-native-fast-image';
  
  export default function RemoteImage({source, style, priority = 'normal', ...props}) {
    return (
      <FastImage
        source={typeof source === 'string' ? {uri: source, priority: FastImage.priority[priority]} : source}
        style={style}
        resizeMode={FastImage.resizeMode.cover}
        {...props}
      />
    );
  }
  ```
- [ ] استبدال جميع `<Image source={{uri:...}}>` بـ `<RemoteImage source={...}>`
- [ ] إبقاء `<Image>` الأصلي للصور المحلية فقط (`require('./assets/...')`)
- [ ] إضافة placeholder للقوائم:
  ```jsx
  <FastImage
    source={{uri}}
    style={styles.thumb}
    fallback
    defaultSource={require('../../assets/placeholder.png')}
  />
  ```
- [ ] قياس bandwidth قبل/بعد (Charles Proxy)

## ملاحظات تقنية

- **يجب** ProGuard rules للـ Glide (مرتبط بـ BUILD-08):
  ```proguard
  -keep public class * implements com.bumptech.glide.module.GlideModule
  -keep class * extends com.bumptech.glide.module.AppGlideModule
  ```
- بديل: `expo-image` (يعمل أيضاً في bare RN عبر expo-modules)
- استخدام Cloudinary transformations في URL لتقليل الحجم:
  ```
  /image/upload/w_400,q_auto,f_auto/...
  ```
