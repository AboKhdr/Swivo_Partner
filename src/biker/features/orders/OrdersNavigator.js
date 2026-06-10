import React, {useState, useEffect, useCallback, useRef} from 'react';
import {ActivityIndicator, BackHandler, View, StyleSheet} from 'react-native';
import OrdersScreen from './OrdersScreen';
import OrderDetailsScreen from './OrderDetailsScreen';
import OrderMapScreen from './OrderMapScreen';
import useAppStore from '../../../store/appStore';
import {useTheme} from '../../../shared/context/ThemeContext';
import {getOrderById} from '../../../services/orders';

export default function OrdersNavigator() {
  const {colors}                          = useTheme();
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [screen, setScreen]               = useState(null);
  const [navLoading, setNavLoading]       = useState(false);
  const mountedRef                        = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

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

  const pendingOrderNav      = useAppStore(s => s.pendingOrderNav);
  const clearPendingOrderNav = useAppStore(s => s.clearPendingOrderNav);
  const pendingNav           = useAppStore(s => s.pendingNav);
  const clearNav             = useAppStore(s => s.clearNav);

  useEffect(() => {
    if (!pendingOrderNav) return;
    clearPendingOrderNav();
    if (pendingOrderNav.type === 'detail') goToDetail(pendingOrderNav.order);
    else if (pendingOrderNav.type === 'map') goToMap(pendingOrderNav.order);
  }, [pendingOrderNav, clearPendingOrderNav, goToDetail, goToMap]);

  useEffect(() => {
    if (pendingNav?.tab !== 'orders' || pendingNav?.screen !== 'detail' || !pendingNav?.orderId) return;
    const orderId = pendingNav.orderId;
    clearNav();
    setNavLoading(true);
    getOrderById(orderId).then(res => {
      if (!mountedRef.current) return;
      if (res.success) {
        const order = res.data?.data ?? res.data;
        if (order) goToDetail(order);
      }
      setNavLoading(false);
    }).catch(() => {
      if (mountedRef.current) setNavLoading(false);
    });
  }, [pendingNav, clearNav, goToDetail]);

  useEffect(() => {
    if (!screen) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      goBack();
      return true;
    });
    return () => sub.remove();
  }, [screen, goBack]);

  if (navLoading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={s.root}>
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
          <OrderMapScreen order={selectedOrder} onBack={goBack} onGoToDetail={goToDetail} />
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root:   {flex: 1},
  screen: {flex: 1},
  hidden: {display: 'none'},
  center: {flex: 1, alignItems: 'center', justifyContent: 'center'},
});
