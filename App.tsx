import React, {useState} from 'react';
import {View} from 'react-native';
import {ThemeProvider} from './src/shared/context/ThemeContext';
import {I18nProvider, useI18n} from './src/shared/i18n/I18nContext';
import LoginScreen from './src/features/auth/LoginScreen';
import BikerNavigator from './src/biker/navigation/AppNavigator';
import PartnerNavigator from './src/partner/navigation/PartnerNavigator';

type Role = 'biker' | 'manager' | null;

function AppRoot() {
  const [role, setRole] = useState<Role>('manager');
  const {isRTL} = useI18n();

  return (
    <View style={{flex: 1, direction: isRTL ? 'rtl' : 'ltr'}}>
      <ThemeProvider>
        {role === 'biker'   && <BikerNavigator />}
        {role === 'manager' && <PartnerNavigator />}
        {role === null && (
          <LoginScreen
            onLogin={(userRole: Role) => setRole(userRole || 'biker')}
            onGuest={() => setRole('biker')}
          />
        )}
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
