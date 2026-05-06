import React, {useEffect, useState} from 'react';
import {View} from 'react-native';
import {ThemeProvider} from './src/shared/context/ThemeContext';
import {I18nProvider, useI18n} from './src/shared/i18n/I18nContext';
import {FirebaseProvider} from './src/shared/context/FirebaseContext';
import LoginScreen from './src/features/auth/LoginScreen';
import BikerNavigator from './src/biker/navigation/AppNavigator';
import PartnerNavigator from './src/partner/navigation/PartnerNavigator';
import useAuthStore from './src/store/authStore';
import {setUnauthorizedHandler} from './src/services/api';

type Role = 'biker' | 'admin' | null;

function AppRoot() {
  const {isRTL} = useI18n();
  const {role, isReady, hydrate, logout} = useAuthStore();

  // Temporary override until auth API is live — remove when real login is wired
  const [devRole, setDevRole] = useState<Role>(null);

  useEffect(() => {
    hydrate();
    setUnauthorizedHandler(logout);
  }, [hydrate, logout]);

  if (!isReady) return null;

  const activeRole: Role = role ?? devRole;

  return (
    <View style={{flex: 1, direction: isRTL ? 'rtl' : 'ltr'}}>
      <ThemeProvider>
        <FirebaseProvider>
          {activeRole === 'biker'   && <BikerNavigator />}
          {activeRole === 'admin'   && <PartnerNavigator />}
          {activeRole === null && (
            <LoginScreen
              onLogin={(userRole: Role) => setDevRole(userRole ?? 'biker')}
              onGuest={() => setDevRole('biker')}
            />
          )}
        </FirebaseProvider>
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
