import React, {useState, useEffect, useCallback} from 'react';
import {BackHandler, StyleSheet, View} from 'react-native';
import ProfileScreen from './ProfileScreen';
import PersonalInfoScreen from './PersonalInfoScreen';
import WalletScreen from './WalletScreen';
import TransactionsScreen from './TransactionsScreen';
import LanguageScreen from '../../../shared/components/LanguageScreen';
import SupportScreen from './SupportScreen';
import TermsScreen from './TermsScreen';

export default function ProfileNavigator() {
  const [screen, setScreen] = useState(null); // null | 'info' | 'wallet' | 'language' | 'support' | 'terms'

  const goTo = useCallback(name => setScreen(name), []);
  const goBack = useCallback(() => setScreen(null), []);

  useEffect(() => {
    if (!screen) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      goBack();
      return true;
    });
    return () => sub.remove();
  }, [screen, goBack]);

  return (
    <View style={s.root}>
      <View style={[s.screen, screen && s.hidden]}>
        <ProfileScreen onNavigate={goTo} />
      </View>

      {screen === 'info' && (
        <View style={s.screen}>
          <PersonalInfoScreen onBack={goBack} />
        </View>
      )}
      {screen === 'wallet' && (
        <View style={s.screen}>
          <WalletScreen onBack={goBack} />
        </View>
      )}
      {screen === 'transactions' && (
        <View style={s.screen}>
          <TransactionsScreen onBack={goBack} />
        </View>
      )}
      {screen === 'language' && (
        <View style={s.screen}>
          <LanguageScreen onBack={goBack} />
        </View>
      )}
      {screen === 'support' && (
        <View style={s.screen}>
          <SupportScreen onBack={goBack} />
        </View>
      )}
      {screen === 'terms' && (
        <View style={s.screen}>
          <TermsScreen onBack={goBack} />
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: {flex: 1},
  screen: {flex: 1},
  hidden: {display: 'none'},
});
