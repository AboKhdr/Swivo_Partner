import React, {useState, useEffect, useCallback} from 'react';
import {BackHandler, View, StyleSheet} from 'react-native';
import OrdersScreen from './OrdersScreen';
import OrderDetailsScreen from './OrderDetailsScreen';
import OrderMapScreen from './OrderMapScreen';

// stack: null | 'detail' | 'map'
export default function OrdersNavigator() {
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [screen, setScreen] = useState(null); // 'detail' | 'map'

  const goToDetail = useCallback(order => {
    setSelectedOrder(order);
    setScreen('detail');
  }, []);

  const goToMap = useCallback(order => {
    setSelectedOrder(order);
    setScreen('map');
  }, []);

  const goBack = useCallback(() => {
    setScreen(null);
    setSelectedOrder(null);
  }, []);

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
      {/* List — always mounted, hidden when child screen is open */}
      <View style={[s.screen, screen && s.hidden]}>
        <OrdersScreen onOrderPress={goToDetail} onLocationPress={goToMap} />
      </View>

      {screen === 'detail' && selectedOrder && (
        <View style={s.screen}>
          <OrderDetailsScreen order={selectedOrder} onBack={goBack} />
        </View>
      )}

      {screen === 'map' && selectedOrder && (
        <View style={s.screen}>
          <OrderMapScreen order={selectedOrder} onBack={goBack} />
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
