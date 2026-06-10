import React, {useCallback, useEffect, useRef, useState} from 'react';
import {ActivityIndicator, BackHandler, StyleSheet, View} from 'react-native';
import OrdersScreen from './OrdersScreen';
import OrderDetailsScreen from './OrderDetailsScreen';
import useAppStore from '../../../store/appStore';
import {useTheme} from '../../../shared/context/ThemeContext';
import {getOrderById} from '../../../services/partner';

export default function OrdersNavigator() {
  const {colors} = useTheme();
  const [screen, setScreen]               = useState('list');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [refreshKey, setRefreshKey]       = useState(0);
  const [navLoading, setNavLoading]       = useState(false);
  const mountedRef                        = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const pendingNav = useAppStore(s => s.pendingNav);
  const clearNav   = useAppStore(s => s.clearNav);

  const goToDetails = useCallback((order) => {
    setSelectedOrder(order);
    setScreen('details');
  }, []);

  const goBack = useCallback(() => {
    setScreen('list');
    setSelectedOrder(null);
    setRefreshKey(k => k + 1);
  }, []);

  useEffect(() => {
    const isForOrders =
      pendingNav?.screen === 'detail' &&
      pendingNav?.orderId &&
      (pendingNav?.tab === 'orders' || pendingNav?.tab === 'notifications');
    if (!isForOrders) return;
    const orderId = pendingNav.orderId;
    clearNav();
    setNavLoading(true);
    getOrderById(orderId).then(res => {
      if (!mountedRef.current) return;
      if (res.success) {
        const order = res.data?.data ?? res.data;
        if (order) goToDetails(order);
      }
      setNavLoading(false);
    }).catch(() => {
      if (mountedRef.current) setNavLoading(false);
    });
  }, [pendingNav, clearNav, goToDetails]);

  useEffect(() => {
    if (screen === 'list') return;
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
      <View style={[s.screen, screen !== 'list' && s.hidden]}>
        <OrdersScreen onSelectOrder={goToDetails} refreshKey={refreshKey} />
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
