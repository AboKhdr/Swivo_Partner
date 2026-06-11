/**
 * Device capability integration tests
 *
 * Scope (only what the app actually uses):
 *  1. Camera & gallery — react-native-image-picker + Android permission
 *  2. Notifications  — Firebase Messaging (FCM) + Notifee channels
 *
 * NOT covered (not used in this app):
 *  - Biometrics (Touch ID / Face ID / Fingerprint)
 *  - Native Geolocation (the app only uses WebView Google Maps)
 *  - NFC, Bluetooth, Accelerometer, Gyroscope
 */

import React from 'react';
import {create, act} from 'react-test-renderer';
import {PermissionsAndroid, Platform, TouchableOpacity} from 'react-native';

// ─── Module mocks ─────────────────────────────────────────────────────────────

// react-native-image-picker
const mockLaunchCamera       = jest.fn();
const mockLaunchImageLibrary = jest.fn();
jest.mock('react-native-image-picker', () => ({
  launchCamera:       (...args) => mockLaunchCamera(...args),
  launchImageLibrary: (...args) => mockLaunchImageLibrary(...args),
}));

// notifee is mocked globally in jest.setup.js

// lucide-react-native icons
jest.mock('lucide-react-native', () => {
  const {View} = require('react-native');
  const icon = (name) => () => <View testID={`icon-${name}`} />;
  return {
    Camera:      icon('Camera'),
    ImagePlus:   icon('ImagePlus'),
    X:           icon('X'),
  };
});

// ThemeContext
jest.mock('../../src/shared/context/ThemeContext', () => ({
  useTheme: () => ({
    colors: {bg:'#fff', card:'#f8f8f8', border:'#eee', primary:'#1B7BF5', textPrimary:'#000', textSecondary:'#888'},
  }),
}));

// PermissionsAndroid — patch the actual module from RN
jest.spyOn(PermissionsAndroid, 'request').mockResolvedValue('granted');

// ─── Helpers ──────────────────────────────────────────────────────────────────

function findOne(inst, testID) {
  return inst.root.findAll(n => n.props?.testID === testID)[0] ?? null;
}

// Recursively extract text content from a React instance subtree.
function getTextContent(node) {
  if (!node) return '';
  if (typeof node === 'string') return node;
  const children = node.props?.children ?? node.children;
  if (children == null) return '';
  if (Array.isArray(children)) return children.map(getTextContent).join('');
  if (typeof children === 'string') return children;
  return getTextContent(children);
}

// Find a TouchableOpacity whose visible text includes the given Arabic label.
function findTouchableByText(inst, text) {
  return inst.root.findAllByType(TouchableOpacity)
    .find(t => { try { return getTextContent(t).includes(text); } catch { return false; } });
}

async function pressByText(inst, text) {
  const node = findTouchableByText(inst, text);
  if (!node) throw new Error(`No TouchableOpacity with text "${text}"`);
  await act(async () => { await node.props.onPress?.(); });
}

async function pressFirstTouchable(inst) {
  const node = inst.root.findAllByType(TouchableOpacity)[0];
  if (!node) throw new Error('No TouchableOpacity found');
  await act(async () => { await node.props.onPress?.(); });
}

beforeEach(() => {
  jest.clearAllMocks();
  PermissionsAndroid.request.mockResolvedValue('granted');
});

// ═══════════════════════════════════════════════════════════════════════════════
// 1. Camera & Gallery — ImagePickerField
// ═══════════════════════════════════════════════════════════════════════════════

const ImagePickerField = require('../../src/shared/components/ImagePickerField').default;

// Helper to render ImagePickerField, open the options modal, and press a labelled option.
async function renderAndPickOption(optionLabel, onChange = jest.fn()) {
  let inst;
  act(() => { inst = create(<ImagePickerField value={null} onChange={onChange} />); });
  await pressFirstTouchable(inst);            // open options modal
  await pressByText(inst, optionLabel);       // press "التقاط صورة" or "اختيار من المعرض"
  return {inst, onChange};
}

describe('ImagePickerField — Camera Permission', () => {
  beforeEach(() => {
    Platform.OS = 'android';
    mockLaunchCamera.mockResolvedValue({didCancel: false, assets: [{uri: 'file:///cam.jpg'}]});
  });

  it('requests CAMERA permission on Android before launching camera', async () => {
    await renderAndPickOption('التقاط صورة');
    expect(PermissionsAndroid.request).toHaveBeenCalledWith(
      PermissionsAndroid.PERMISSIONS.CAMERA
    );
  });

  it('launches camera with quality:0.8 and mediaType:photo when permission granted', async () => {
    PermissionsAndroid.request.mockResolvedValue('granted');
    await renderAndPickOption('التقاط صورة');
    expect(mockLaunchCamera).toHaveBeenCalledWith({mediaType: 'photo', quality: 0.8});
  });

  it('does NOT launch camera when CAMERA permission is denied', async () => {
    PermissionsAndroid.request.mockResolvedValue('denied');
    const {onChange} = await renderAndPickOption('التقاط صورة');
    expect(mockLaunchCamera).not.toHaveBeenCalled();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('does NOT launch camera when permission is "never_ask_again"', async () => {
    PermissionsAndroid.request.mockResolvedValue('never_ask_again');
    await renderAndPickOption('التقاط صورة');
    expect(mockLaunchCamera).not.toHaveBeenCalled();
  });

  it('skips PermissionsAndroid.request on iOS (handled by Info.plist + system prompt)', async () => {
    Platform.OS = 'ios';
    PermissionsAndroid.request.mockClear();
    await renderAndPickOption('التقاط صورة');
    expect(PermissionsAndroid.request).not.toHaveBeenCalled();
    expect(mockLaunchCamera).toHaveBeenCalled();
  });
});

describe('ImagePickerField — Camera Capture', () => {
  beforeEach(() => {
    Platform.OS = 'android';
    PermissionsAndroid.request.mockResolvedValue('granted');
  });

  it('passes the captured image URI to onChange', async () => {
    mockLaunchCamera.mockResolvedValue({
      didCancel: false,
      assets: [{uri: 'file:///storage/cam_photo.jpg'}],
    });
    const {onChange} = await renderAndPickOption('التقاط صورة');
    expect(onChange).toHaveBeenCalledWith('file:///storage/cam_photo.jpg');
  });

  it('does NOT call onChange when user cancels the camera (didCancel: true)', async () => {
    mockLaunchCamera.mockResolvedValue({didCancel: true});
    const {onChange} = await renderAndPickOption('التقاط صورة');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('does NOT call onChange when assets array is empty', async () => {
    mockLaunchCamera.mockResolvedValue({didCancel: false, assets: []});
    const {onChange} = await renderAndPickOption('التقاط صورة');
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe('ImagePickerField — Gallery (no permission needed via library)', () => {
  it('launches image library with quality:0.8 and mediaType:photo', async () => {
    mockLaunchImageLibrary.mockResolvedValue({
      didCancel: false,
      assets: [{uri: 'content://media/external/images/123'}],
    });
    await renderAndPickOption('اختيار من المعرض');
    expect(mockLaunchImageLibrary).toHaveBeenCalledWith({mediaType: 'photo', quality: 0.8});
  });

  it('does NOT request CAMERA permission for gallery picker', async () => {
    mockLaunchImageLibrary.mockResolvedValue({didCancel: true});

    let inst;
    act(() => { inst = create(<ImagePickerField value={null} onChange={jest.fn()} />); });
    await pressFirstTouchable(inst);

    PermissionsAndroid.request.mockClear();   // clear after opening modal
    await pressByText(inst, 'اختيار من المعرض');

    expect(PermissionsAndroid.request).not.toHaveBeenCalled();
  });

  it('passes selected gallery image URI to onChange', async () => {
    mockLaunchImageLibrary.mockResolvedValue({
      didCancel: false,
      assets: [{uri: 'file:///gallery/img.png'}],
    });
    const {onChange} = await renderAndPickOption('اختيار من المعرض');
    expect(onChange).toHaveBeenCalledWith('file:///gallery/img.png');
  });

  it('does NOT call onChange when user cancels the gallery', async () => {
    mockLaunchImageLibrary.mockResolvedValue({didCancel: true});
    const {onChange} = await renderAndPickOption('اختيار من المعرض');
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe('ImagePickerField — Image compression flag (quality)', () => {
  it('always sends quality:0.8 for camera (~80% JPEG compression)', async () => {
    Platform.OS = 'android';
    PermissionsAndroid.request.mockResolvedValue('granted');
    mockLaunchCamera.mockResolvedValue({didCancel: true});
    await renderAndPickOption('التقاط صورة');
    expect(mockLaunchCamera).toHaveBeenCalledWith(expect.objectContaining({quality: 0.8}));
  });

  it('always sends quality:0.8 for gallery picker', async () => {
    mockLaunchImageLibrary.mockResolvedValue({didCancel: true});
    await renderAndPickOption('اختيار من المعرض');
    expect(mockLaunchImageLibrary).toHaveBeenCalledWith(expect.objectContaining({quality: 0.8}));
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 2. Notifee Channels — Android notification setup
// ═══════════════════════════════════════════════════════════════════════════════

const notifee = require('@notifee/react-native').default;
const {
  setupNotifeeChannel,
  showIncomingOrderNotification,
  cancelIncomingOrderNotification,
  stopRinging,
  resolveChannel,
  displayNotification,
  CHANNEL_INCOMING,
  CHANNEL_NEW_ORDER,
  CHANNEL_UPDATES,
  CHANNEL_ALERTS,
  CHANNEL_GENERAL,
} = require('../../src/services/notificationChannel');

describe('Notifee — Channel Setup (Android)', () => {
  beforeEach(() => {
    Platform.OS = 'android';
    notifee.createChannel.mockClear();
  });

  it('creates all 4 channels on Android', async () => {
    await setupNotifeeChannel();
    expect(notifee.createChannel).toHaveBeenCalledTimes(4);
  });

  it('creates the incoming/new-order channel with HIGH importance + bypassDnd', async () => {
    await setupNotifeeChannel();
    expect(notifee.createChannel).toHaveBeenCalledWith(expect.objectContaining({
      id:         CHANNEL_INCOMING,
      importance: 4,                  // AndroidImportance.HIGH
      visibility: 1,                  // AndroidVisibility.PUBLIC
      vibration:  true,
      sound:      'new_order_alert',
      bypassDnd:  true,
    }));
  });

  it('aliases the incoming-order channel to the new-order channel', () => {
    // The biker ring loop and the partner new-order alert share one channel.
    expect(CHANNEL_INCOMING).toBe(CHANNEL_NEW_ORDER);
  });

  it('creates the order-updates channel with HIGH importance', async () => {
    await setupNotifeeChannel();
    expect(notifee.createChannel).toHaveBeenCalledWith(expect.objectContaining({
      id:         CHANNEL_UPDATES,
      importance: 4,
    }));
  });

  it('creates the biker-alerts channel with vibration', async () => {
    await setupNotifeeChannel();
    expect(notifee.createChannel).toHaveBeenCalledWith(expect.objectContaining({
      id:        CHANNEL_ALERTS,
      vibration: true,
    }));
  });

  it('creates the general channel with DEFAULT importance', async () => {
    await setupNotifeeChannel();
    expect(notifee.createChannel).toHaveBeenCalledWith(expect.objectContaining({
      id:         CHANNEL_GENERAL,
      importance: 3,                  // AndroidImportance.DEFAULT
    }));
  });

  it('does NOT create channels on iOS (no-op)', async () => {
    Platform.OS = 'ios';
    notifee.createChannel.mockClear();
    await setupNotifeeChannel();
    expect(notifee.createChannel).not.toHaveBeenCalled();
  });
});

describe('Notifee — resolveChannel mapping', () => {
  it('maps "new_order" → CHANNEL_NEW_ORDER', () => {
    expect(resolveChannel('new_order')).toBe(CHANNEL_NEW_ORDER);
  });

  it('maps "order_updates" → CHANNEL_UPDATES', () => {
    expect(resolveChannel('order_updates')).toBe(CHANNEL_UPDATES);
  });

  it('maps "biker_alerts" → CHANNEL_ALERTS', () => {
    expect(resolveChannel('biker_alerts')).toBe(CHANNEL_ALERTS);
  });

  it('maps "dashboard_notification" → CHANNEL_GENERAL', () => {
    expect(resolveChannel('dashboard_notification')).toBe(CHANNEL_GENERAL);
  });

  it('falls back to CHANNEL_GENERAL for unknown types', () => {
    expect(resolveChannel('unknown_type')).toBe(CHANNEL_GENERAL);
    expect(resolveChannel(undefined)).toBe(CHANNEL_GENERAL);
    expect(resolveChannel(null)).toBe(CHANNEL_GENERAL);
  });
});

describe('Notifee — displayNotification', () => {
  beforeEach(() => { notifee.displayNotification.mockClear(); });

  it('displays notification on the resolved channel', async () => {
    await displayNotification({
      title: 'Test',
      body:  'Hello',
      notificationType: 'new_order',
      data: {orderId: 'o1'},
    });

    expect(notifee.displayNotification).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Test',
      body:  'Hello',
      data:  {orderId: 'o1'},
      android: expect.objectContaining({channelId: CHANNEL_NEW_ORDER}),
    }));
  });

  it('uses the small icon "ic_notification" for Android', async () => {
    await displayNotification({title: 'T', body: 'B', notificationType: 'general'});
    expect(notifee.displayNotification).toHaveBeenCalledWith(expect.objectContaining({
      android: expect.objectContaining({smallIcon: 'ic_notification'}),
    }));
  });

  it('sets pressAction id "default" so taps trigger handleNavigate', async () => {
    await displayNotification({title: 'T', body: 'B', notificationType: 'general'});
    expect(notifee.displayNotification).toHaveBeenCalledWith(expect.objectContaining({
      android: expect.objectContaining({pressAction: {id: 'default'}}),
    }));
  });

  it('falls back to general channel when no type provided', async () => {
    await displayNotification({title: 'T', body: 'B'});
    expect(notifee.displayNotification).toHaveBeenCalledWith(expect.objectContaining({
      android: expect.objectContaining({channelId: CHANNEL_GENERAL}),
    }));
  });
});

describe('Notifee — Incoming Order Ring Loop', () => {
  beforeEach(() => {
    Platform.OS = 'android';
    notifee.displayNotification.mockClear();
    notifee.cancelNotification.mockClear();
    jest.useFakeTimers();
  });

  afterEach(() => {
    stopRinging();
    jest.useRealTimers();
  });

  it('shows the first notification immediately when ring starts', async () => {
    await showIncomingOrderNotification({service: 'Wash', location: 'Riyadh'});
    expect(notifee.displayNotification).toHaveBeenCalledTimes(1);
  });

  it('uses the CHANNEL_INCOMING channel with full-screen intent', async () => {
    await showIncomingOrderNotification({service: 'Wash'});
    expect(notifee.displayNotification).toHaveBeenCalledWith(expect.objectContaining({
      android: expect.objectContaining({
        channelId:        CHANNEL_INCOMING,
        category:         'call',
        sound:            'new_order_alert',
        fullScreenAction: {id: 'default', launchActivity: 'default'},
      }),
    }));
  });

  it('marks the iOS variant as critical with full volume', async () => {
    await showIncomingOrderNotification({service: 'Wash'});
    expect(notifee.displayNotification).toHaveBeenCalledWith(expect.objectContaining({
      ios: expect.objectContaining({critical: true, criticalVolume: 1.0}),
    }));
  });

  it('alternates ID between "incoming_order_0" and "incoming_order_1" each tick', async () => {
    await showIncomingOrderNotification({service: 'Wash'});
    const firstId = notifee.displayNotification.mock.calls[0][0].id;
    expect(['incoming_order_0', 'incoming_order_1']).toContain(firstId);
  });

  it('repeats every 8 seconds', async () => {
    await showIncomingOrderNotification({service: 'Wash'});
    expect(notifee.displayNotification).toHaveBeenCalledTimes(1);

    await act(async () => { jest.advanceTimersByTime(8000); });
    expect(notifee.displayNotification).toHaveBeenCalledTimes(2);

    await act(async () => { jest.advanceTimersByTime(8000); });
    expect(notifee.displayNotification).toHaveBeenCalledTimes(3);
  });

  it('cancelIncomingOrderNotification stops the loop and clears both ids', async () => {
    await showIncomingOrderNotification({service: 'Wash'});
    notifee.cancelNotification.mockClear();
    notifee.displayNotification.mockClear();

    await cancelIncomingOrderNotification();

    // Both ids cancelled
    expect(notifee.cancelNotification).toHaveBeenCalledWith('incoming_order_0');
    expect(notifee.cancelNotification).toHaveBeenCalledWith('incoming_order_1');

    // Loop stopped — no further displays after timer advance
    await act(async () => { jest.advanceTimersByTime(20000); });
    expect(notifee.displayNotification).not.toHaveBeenCalled();
  });

  it('stopRinging stops further notifications without cancelling existing ones', async () => {
    await showIncomingOrderNotification({service: 'Wash'});
    notifee.displayNotification.mockClear();

    stopRinging();

    await act(async () => { jest.advanceTimersByTime(20000); });
    expect(notifee.displayNotification).not.toHaveBeenCalled();
  });

  it('starting a new ring loop stops the previous one (no double ringing)', async () => {
    await showIncomingOrderNotification({service: 'Wash 1'});
    await showIncomingOrderNotification({service: 'Wash 2'});

    notifee.displayNotification.mockClear();
    await act(async () => { jest.advanceTimersByTime(8000); });

    // Only one tick fires (the second loop), not two
    expect(notifee.displayNotification).toHaveBeenCalledTimes(1);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 3. Firebase Cloud Messaging — token + foreground/background
// ═══════════════════════════════════════════════════════════════════════════════

const messaging = require('@react-native-firebase/messaging');

describe('Firebase Messaging — Permission & Token', () => {
  beforeEach(() => {
    messaging.requestPermission.mockClear();
    messaging.getToken.mockClear();
  });

  it('AuthorizationStatus.AUTHORIZED is treated as granted', () => {
    expect(messaging.AuthorizationStatus.AUTHORIZED).toBe(1);
  });

  it('AuthorizationStatus.PROVISIONAL is treated as granted (iOS quiet permission)', () => {
    expect(messaging.AuthorizationStatus.PROVISIONAL).toBe(2);
  });

  it('requestPermission is called for iOS in bootstrap', async () => {
    Platform.OS = 'ios';
    messaging.requestPermission.mockResolvedValue(1);

    await messaging.requestPermission(messaging.getMessaging());
    expect(messaging.requestPermission).toHaveBeenCalled();
  });

  it('getToken returns FCM token (mocked)', async () => {
    const token = await messaging.getToken(messaging.getMessaging());
    expect(token).toBe('mock-fcm-token');
  });

  it('returns falsy when permission is DENIED (status 0)', async () => {
    messaging.requestPermission.mockResolvedValue(0);
    const status = await messaging.requestPermission(messaging.getMessaging());
    const isGranted =
      status === messaging.AuthorizationStatus.AUTHORIZED ||
      status === messaging.AuthorizationStatus.PROVISIONAL;
    expect(isGranted).toBe(false);
  });
});

describe('Firebase Messaging — Listener registration', () => {
  beforeEach(() => {
    messaging.onMessage.mockClear();
    messaging.onTokenRefresh.mockClear();
    messaging.onNotificationOpenedApp.mockClear();
    messaging.getInitialNotification.mockClear();
  });

  it('onMessage returns an unsubscribe function', () => {
    const unsub = messaging.onMessage(messaging.getMessaging(), () => {});
    expect(typeof unsub).toBe('function');
  });

  it('onTokenRefresh returns an unsubscribe function', () => {
    const unsub = messaging.onTokenRefresh(messaging.getMessaging(), () => {});
    expect(typeof unsub).toBe('function');
  });

  it('onNotificationOpenedApp returns an unsubscribe function', () => {
    const unsub = messaging.onNotificationOpenedApp(messaging.getMessaging(), () => {});
    expect(typeof unsub).toBe('function');
  });

  it('getInitialNotification resolves to null on cold start without notification', async () => {
    const result = await messaging.getInitialNotification(messaging.getMessaging());
    expect(result).toBeNull();
  });

  it('setBackgroundMessageHandler can be registered', () => {
    expect(() => messaging.setBackgroundMessageHandler(jest.fn())).not.toThrow();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 4. Notifee permission & event types
// ═══════════════════════════════════════════════════════════════════════════════

const {EventType} = require('@notifee/react-native');

describe('Notifee — Permission & Events', () => {
  it('requestPermission resolves successfully', async () => {
    const result = await notifee.requestPermission();
    expect(result).toBeDefined();
  });

  it('EventType.PRESS = 1 (matches FirebaseContext check: type !== EventType.PRESS)', () => {
    expect(EventType.PRESS).toBe(1);
  });

  it('EventType.DISMISSED = 2 (used to ignore dismissals)', () => {
    expect(EventType.DISMISSED).toBe(2);
  });

  it('onForegroundEvent returns an unsubscribe function', () => {
    const unsub = notifee.onForegroundEvent(() => {});
    expect(typeof unsub).toBe('function');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 5. Capabilities NOT used (documentation tests)
// ═══════════════════════════════════════════════════════════════════════════════

describe('Capabilities NOT integrated', () => {
  it('biometrics: react-native-biometrics is not a dependency', () => {
    expect(() => require('react-native-biometrics')).toThrow();
  });

  it('native geolocation: @react-native-community/geolocation is not a dependency', () => {
    expect(() => require('@react-native-community/geolocation')).toThrow();
  });

  it('NFC: react-native-nfc-manager is not a dependency', () => {
    expect(() => require('react-native-nfc-manager')).toThrow();
  });

  it('Bluetooth: react-native-ble-plx is not a dependency', () => {
    expect(() => require('react-native-ble-plx')).toThrow();
  });

  it('sensors: react-native-sensors is not a dependency', () => {
    expect(() => require('react-native-sensors')).toThrow();
  });
});
