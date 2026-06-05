module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '.*\\.spec\\.ts$',

  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: 'tsconfig.spec.json' }],
  },

  setupFilesAfterEnv: ['<rootDir>/test/jest.setup.ts'],

  roots: ['<rootDir>/test/', '<rootDir>/apps/', '<rootDir>/libs/'],

  collectCoverageFrom: ['**/*.(t|j)s'],

  coverageDirectory: './coverage',

  moduleNameMapper: {
    '^@app/shared$': '<rootDir>/libs/shared/src',
    '^@app/shared/(.*)$': '<rootDir>/libs/shared/src/$1',
    '^@app/telegram-notifier$': '<rootDir>/libs/telegram-notifier/src',
    '^@app/telegram-notifier/(.*)$':
      '<rootDir>/libs/telegram-notifier/src/$1',
  },

  testEnvironment: 'node',
};
