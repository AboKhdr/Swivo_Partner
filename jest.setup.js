// Global mocks for native modules unavailable in Jest

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem:    jest.fn().mockResolvedValue(null),
  setItem:    jest.fn().mockResolvedValue(undefined),
  removeItem: jest.fn().mockResolvedValue(undefined),
  multiGet:   jest.fn().mockResolvedValue([]),
  multiSet:   jest.fn().mockResolvedValue(undefined),
  clear:      jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@react-native-firebase/messaging', () => ({
  getMessaging:            jest.fn(() => ({})),
  getToken:                jest.fn().mockResolvedValue('mock-fcm-token'),
  onMessage:               jest.fn(() => jest.fn()),
  onTokenRefresh:          jest.fn(() => jest.fn()),
  onNotificationOpenedApp: jest.fn(() => jest.fn()),
  getInitialNotification:  jest.fn().mockResolvedValue(null),
  requestPermission:       jest.fn().mockResolvedValue(1),
  setBackgroundMessageHandler: jest.fn(),
  AuthorizationStatus: {AUTHORIZED: 1, PROVISIONAL: 2},
}));

jest.mock('@notifee/react-native', () => ({
  __esModule: true,
  default: {
    requestPermission:        jest.fn().mockResolvedValue({}),
    createChannel:            jest.fn().mockResolvedValue('channel-id'),
    deleteChannel:            jest.fn().mockResolvedValue(undefined),
    displayNotification:      jest.fn().mockResolvedValue(undefined),
    cancelNotification:       jest.fn().mockResolvedValue(undefined),
    cancelAllNotifications:   jest.fn().mockResolvedValue(undefined),
    cancelTriggerNotification: jest.fn().mockResolvedValue(undefined),
    onForegroundEvent:        jest.fn(() => jest.fn()),
    onBackgroundEvent:        jest.fn(),
  },
  AndroidImportance: {HIGH: 4, DEFAULT: 3},
  AndroidVisibility: {PUBLIC: 1},
  AndroidCategory:   {CALL: 'call'},
  EventType:         {PRESS: 1, DISMISSED: 2},
}));

jest.mock('@react-native-firebase/app', () => ({}));

jest.mock('../../src/config', () => ({
  BASE_URL1: 'https://api.test.com',
}), {virtual: true});

jest.mock('src/config', () => ({
  BASE_URL1: 'https://api.test.com',
}), {virtual: true});
