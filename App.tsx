import React, {useState} from 'react';
import LoginScreen from './src/features/auth/LoginScreen';
import AppNavigator from './src/biker/navigation/AppNavigator';

export default function App() {
  const [authed, setAuthed] = useState(false);

  if (!authed) {
    return <LoginScreen onLogin={() => setAuthed(true)} onGuest={() => setAuthed(true)} />;
  }

  return <AppNavigator />;
}
