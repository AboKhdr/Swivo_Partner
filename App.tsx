import React, {useState} from 'react';
import {View} from 'react-native';
import {ThemeProvider} from './src/shared/context/ThemeContext';
import {I18nProvider, useI18n} from './src/shared/i18n/I18nContext';
import LoginScreen from './src/features/auth/LoginScreen';
import AppNavigator from './src/biker/navigation/AppNavigator';

function AppRoot() {
  const [authed, setAuthed] = useState(false);
  const {isRTL} = useI18n();

  return (
    <View style={{flex: 1, direction: isRTL ? 'rtl' : 'ltr'}}>
      <ThemeProvider>
        {authed
          ? <AppNavigator />
          : <LoginScreen onLogin={() => setAuthed(true)} onGuest={() => setAuthed(true)} />
        }
      </ThemeProvider>
    </View>
  );
}

export default function App() {
  return (
    <I18nProvider>
      <AppRoot />
    </I18nProvider>
  );
}
