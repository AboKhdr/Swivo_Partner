module.exports = {
  preset: 'react-native',
  setupFiles: ['./jest.setup.js'],
  testMatch: ['**/__tests__/**/*.test.{js,ts,tsx}'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-native-community|@react-native-async-storage|@notifee|@react-native-firebase|lucide-react-native|react-native-svg|react-native-image-picker|react-native-safe-area-context|react-native-screens)/)',
  ],
  moduleNameMapper: {
    '\\.(png|jpg|jpeg|gif|svg)$': '<rootDir>/__mocks__/fileMock.js',
  },
  collectCoverageFrom: [
    'src/**/*.{js,ts,tsx}',
    '!src/**/*.d.ts',
  ],
};
