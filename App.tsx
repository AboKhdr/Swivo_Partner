import React, {useEffect} from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {ThemeProvider} from './src/shared/context/ThemeContext';
import {I18nProvider, useI18n} from './src/shared/i18n/I18nContext';
import {FirebaseProvider} from './src/shared/context/FirebaseContext';
import LoginScreen from './src/features/auth/LoginScreen';
import BikerNavigator from './src/biker/navigation/AppNavigator';
import PartnerNavigator from './src/partner/navigation/PartnerNavigator';
import useAuthStore from './src/store/authStore';
import {setUnauthorizedHandler} from './src/services/api';

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

// ── App Root ──────────────────────────────────────────────────────────────────

function AppRoot() {
  const {isRTL} = useI18n();
  const {role, isReady, hydrate, logout} = useAuthStore();

  useEffect(() => {
    hydrate();
    setUnauthorizedHandler(logout);
  }, [hydrate, logout]);

  if (!isReady) return null;

  return (
    <View style={{flex: 1, direction: isRTL ? 'rtl' : 'ltr'}}>
      <ThemeProvider>
        <FirebaseProvider>
          {role === 'biker' && <BikerNavigator />}
          {role === 'admin' && <PartnerNavigator />}
          {!role && <LoginScreen />}
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
