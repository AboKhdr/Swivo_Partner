import React, {useEffect} from 'react';
import {Animated, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {ThemeProvider} from './src/shared/context/ThemeContext';
import {I18nProvider, useI18n} from './src/shared/i18n/I18nContext';
import {FirebaseProvider} from './src/shared/context/FirebaseContext';
import LoginScreen from './src/features/auth/LoginScreen';
import BikerNavigator from './src/biker/navigation/AppNavigator';
import PartnerNavigator from './src/partner/navigation/PartnerNavigator';
import useAuthStore from './src/store/authStore';
import useAppStore from './src/store/appStore';
import {setUnauthorizedHandler, setScopedErrorHandler} from './src/services/api';
import {subscribeToTapDeepLink} from './src/services/tapDeepLink';

// ── Error Boundary ────────────────────────────────────────────────────────────

type ErrorBoundaryState = {hasError: boolean; message: string};

class ErrorBoundary extends React.Component<
  {children: React.ReactNode},
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = {hasError: false, message: ''};

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {hasError: true, message: error?.message ?? 'Unknown error'};
  }

  handleReset = () => this.setState({hasError: false, message: ''});

  render() {
    if (this.state.hasError) {
      return (
        <View style={eb.root}>
          <Text style={eb.emoji}>⚠️</Text>
          <Text style={eb.title}>حدث خطأ غير متوقع</Text>
          <Text style={eb.msg}>{this.state.message}</Text>
          <TouchableOpacity style={eb.btn} onPress={this.handleReset}>
            <Text style={eb.btnText}>إعادة المحاولة</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

const eb = StyleSheet.create({
  root:    {flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, backgroundColor: '#fff'},
  emoji:   {fontSize: 48, marginBottom: 16},
  title:   {fontSize: 18, fontWeight: '700', marginBottom: 8, textAlign: 'center'},
  msg:     {fontSize: 13, color: '#666', textAlign: 'center', marginBottom: 24},
  btn:     {backgroundColor: '#1B7BF5', paddingHorizontal: 28, paddingVertical: 12, borderRadius: 12},
  btnText: {color: '#fff', fontWeight: '700', fontSize: 15},
});

// ── Toast Container ───────────────────────────────────────────────────────────

const TOAST_COLORS: Record<string, {bg: string; border: string; text: string}> = {
  error:   {bg: '#FEF2F2', border: '#FCA5A5', text: '#991B1B'},
  success: {bg: '#F0FDF4', border: '#86EFAC', text: '#166534'},
  info:    {bg: '#EFF6FF', border: '#93C5FD', text: '#1E40AF'},
};

function sv(val: any): string {
  if (!val) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'object') return val.ar ?? val.en ?? '';
  return String(val);
}

// Order toast — stays until user taps X, tapping elsewhere → order details
function OrderToastItem({toast, onDismiss}: {toast: any; onDismiss: (id: number) => void}) {
  const anim = React.useRef(new Animated.Value(0)).current;
  const requestNav   = useAppStore(s => s.requestNav);
  const dismissToast = useAppStore(s => s.dismissToast);

  React.useEffect(() => {
    Animated.spring(anim, {toValue: 1, useNativeDriver: true, tension: 80, friction: 10}).start();
  }, [anim]);

  const order    = toast.order ?? {};
  const orderId  = order._id ?? order.id ?? '';
  const svcName  = sv(order.services?.[0]?.name) || sv(order.service?.name) || (typeof order.service === 'string' ? order.service : '') || 'طلب جديد';
  const location = order.location?.addressText ?? order.addressSnapshot?.addressText ?? (typeof order.location === 'string' ? order.location : '') ?? '';
  const earning  = order.bikerEarning ?? order.totalAmount ?? order.price ?? null;

  const handlePress = () => {
    dismissToast(toast.id);
    if (orderId) requestNav('orders', orderId, 'detail');
  };

  return (
    <Animated.View
      style={[
        ot.wrap,
        {opacity: anim, transform: [{translateY: anim.interpolate({inputRange: [0, 1], outputRange: [-24, 0]})}]},
      ]}>
      <TouchableOpacity style={ot.body} onPress={handlePress} activeOpacity={0.85}>
        <View style={ot.iconBox}>
          <Text style={ot.icon}>🚗</Text>
        </View>
        <View style={ot.textBox}>
          <Text style={ot.title}>طلب جديد وارد!</Text>
          <Text style={ot.sub} numberOfLines={1}>{svcName}{location ? ` — ${location}` : ''}</Text>
          {earning != null && <Text style={ot.earning}>﷼ {earning}</Text>}
        </View>
        <TouchableOpacity
          onPress={() => onDismiss(toast.id)}
          hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
          style={ot.closeBtn}>
          <Text style={ot.closeX}>✕</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
}

const ot = StyleSheet.create({
  wrap:     {shadowColor: '#000', shadowOffset: {width: 0, height: 3}, shadowOpacity: 0.14, shadowRadius: 10, elevation: 8},
  body:     {flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 16,
             backgroundColor: '#1B7BF5', borderWidth: 1, borderColor: '#3B82F6'},
  iconBox:  {width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center'},
  icon:     {fontSize: 22},
  textBox:  {flex: 1, gap: 2},
  title:    {color: '#FFF', fontSize: 14, fontWeight: '800'},
  sub:      {color: 'rgba(255,255,255,0.82)', fontSize: 12},
  earning:  {color: '#FFF', fontSize: 13, fontWeight: '700', marginTop: 2},
  closeBtn: {padding: 4},
  closeX:   {color: 'rgba(255,255,255,0.75)', fontSize: 16, fontWeight: '700'},
});

function ToastItem({toast, onDismiss}: {toast: {id: number; message: string; type: string}; onDismiss: (id: number) => void}) {
  const anim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.spring(anim, {toValue: 1, useNativeDriver: true, tension: 80, friction: 10}).start();
  }, [anim]);

  const scheme = TOAST_COLORS[toast.type] ?? TOAST_COLORS.info;

  return (
    <Animated.View
      style={[
        t.toast,
        {backgroundColor: scheme.bg, borderColor: scheme.border},
        {opacity: anim, transform: [{translateY: anim.interpolate({inputRange: [0, 1], outputRange: [-20, 0]})}]},
      ]}>
      <Text style={[t.toastText, {color: scheme.text}]} numberOfLines={3}>{toast.message}</Text>
      <TouchableOpacity onPress={() => onDismiss(toast.id)} hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
        <Text style={[t.toastClose, {color: scheme.text}]}>✕</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

function ToastContainer() {
  const toasts       = useAppStore(s => s.toasts);
  const dismissToast = useAppStore(s => s.dismissToast);
  if (!toasts.length) return null;
  return (
    <View style={t.container} pointerEvents="box-none">
      {toasts.map(toast =>
        toast.type === 'order'
          ? <OrderToastItem key={toast.id} toast={toast} onDismiss={dismissToast} />
          : <ToastItem      key={toast.id} toast={toast} onDismiss={dismissToast} />
      )}
    </View>
  );
}

const t = StyleSheet.create({
  container: {position: 'absolute', top: 52, left: 16, right: 16, zIndex: 9999, gap: 8},
  toast:     {flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14, borderWidth: 1, gap: 10,
               shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.08, shadowRadius: 8, elevation: 6},
  toastText: {flex: 1, fontSize: 14, fontWeight: '600', lineHeight: 20},
  toastClose:{fontSize: 14, fontWeight: '700', opacity: 0.6},
});

// ── App Root ──────────────────────────────────────────────────────────────────

function AppRoot() {
  const {isRTL} = useI18n();
  const {role, isReady, hydrate, logout} = useAuthStore();

  useEffect(() => {
    hydrate();
    setUnauthorizedHandler(logout);
    setScopedErrorHandler((code) => {
      const messages = {
        SUPERVISOR_NO_BRANCH: 'لم يتم تعيين فرع لحسابك، تواصل مع المدير',
        ADMIN_ONLY:           'هذه الميزة للمدير فقط',
        TENANT_SUSPENDED:     'تم تعليق حساب المغسلة، يرجى تجديد الاشتراك',
        TRIAL_EXPIRED:        'انتهت الفترة التجريبية، يرجى تجديد الاشتراك',
        INSUFFICIENT_FUNDS:   'الرصيد غير كافٍ لإتمام العملية',
      };
      useAppStore.getState().showToast(messages[code] ?? 'حدث خطأ', 'error');
    });
    const unsubscribeTap = subscribeToTapDeepLink();
    return () => unsubscribeTap();
  }, [hydrate, logout]);

  if (!isReady) return null;

  return (
    <View style={{flex: 1, direction: isRTL ? 'rtl' : 'ltr'}}>
      <ThemeProvider>
        <FirebaseProvider>
          {role === 'biker' && <BikerNavigator />}
          {role === 'admin' && <PartnerNavigator />}
          {!role && <LoginScreen />}
          <ToastContainer />
        </FirebaseProvider>
      </ThemeProvider>
    </View>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <I18nProvider>
        <AppRoot />
      </I18nProvider>
    </ErrorBoundary>
  );
}
