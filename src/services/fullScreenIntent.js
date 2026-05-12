import {NativeModules, Platform} from 'react-native';

const {FullScreenIntent} = NativeModules;

export async function canUseFullScreen() {
  if (Platform.OS !== 'android' || !FullScreenIntent) return true;
  try {
    return await FullScreenIntent.canUseFullScreen();
  } catch {
    return true;
  }
}

export async function openFullScreenSettings() {
  if (Platform.OS !== 'android' || !FullScreenIntent) return false;
  try {
    return await FullScreenIntent.openFullScreenSettings();
  } catch {
    return false;
  }
}

export async function openBatteryOptimizationSettings() {
  if (Platform.OS !== 'android' || !FullScreenIntent) return false;
  try {
    return await FullScreenIntent.openBatteryOptimizationSettings();
  } catch {
    return false;
  }
}

// Launches IncomingOrderActivity over the lock screen. Used from the FCM
// background message handler to bring up the WhatsApp-style call screen
// regardless of the app's lifecycle state.
export async function launchIncomingOrder(orderId, orderJson) {
  if (Platform.OS !== 'android' || !FullScreenIntent) return false;
  try {
    return await FullScreenIntent.launchIncomingOrder(
      String(orderId || ''),
      String(orderJson || ''),
    );
  } catch {
    return false;
  }
}
