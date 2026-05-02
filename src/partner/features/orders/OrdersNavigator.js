import React, {useCallback, useEffect, useState} from 'react';
import {BackHandler, StyleSheet, View} from 'react-native';
import OrdersScreen from './OrdersScreen';
import OrderDetailsScreen from './OrderDetailsScreen';

export default function OrdersNavigator() {
  const [screen, setScreen]         = useState('list');
  const [selectedOrder, setSelectedOrder] = useState(null);

  const goToDetails = useCallback((order) => {
    setSelectedOrder(order);
    setScreen('details');
  }, []);

  const goBack = useCallback(() => {
    setScreen('list');
    setSelectedOrder(null);
  }, []);

  useEffect(() => {
    if (screen === 'list') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      goBack();
      return true;
    });
    return () => sub.remove();
  }, [screen, goBack]);

  return (
    <View style={s.root}>
      <View style={[s.screen, screen !== 'list' && s.hidden]}>
        <OrdersScreen onSelectOrder={goToDetails} />
      </View>
      {screen === 'details' && selectedOrder && (
        <View style={s.screen}>
          <OrderDetailsScreen order={selectedOrder} onBack={goBack} />
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root:   {flex: 1},
  screen: {flex: 1},
  hidden: {display: 'none'},
});
