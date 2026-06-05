const path = require('node:path');
const base = require('../jest.config.cjs');

module.exports = {
  ...base,
  rootDir: path.resolve(__dirname, '..'),
  testRegex: undefined,
  testMatch: ['<rootDir>/test/**/*.e2e-spec.ts'],
  testTimeout: 30000,
};
