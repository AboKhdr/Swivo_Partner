module.exports = {
  root: true,
  extends: '@react-native',
  rules: {
    'react-hooks/exhaustive-deps': 'warn',
    'react-hooks/rules-of-hooks': 'error',
    'no-console': ['warn', {allow: ['warn', 'error']}],
    'no-unused-vars': ['warn', {argsIgnorePattern: '^_', varsIgnorePattern: '^_'}],
  },
  overrides: [
    {
      files: ['src/biker/**/*.js'],
      rules: {
        'no-restricted-imports': [
          'error',
          {
            patterns: [
              {
                group: ['**/partner/**', '**/src/partner/**'],
                message:
                  'biker code must not import from partner (CLAUDE.md isolation rule)',
              },
            ],
          },
        ],
      },
    },
    {
      files: ['src/partner/**/*.js'],
      rules: {
        'no-restricted-imports': [
          'error',
          {
            patterns: [
              {
                group: ['**/biker/**', '**/src/biker/**'],
                message:
                  'partner code must not import from biker (CLAUDE.md isolation rule)',
              },
            ],
          },
        ],
      },
    },
    {
      files: ['__tests__/**/*.js', '__mocks__/**/*.js', 'jest.setup.js'],
      env: {jest: true},
      rules: {
        'no-console': 'off',
      },
    },
  ],
};
