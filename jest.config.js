/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: 'tsconfig.test.json' }],
  },
  // Sets test env vars before any app module (and its config) is loaded.
  setupFiles: ['<rootDir>/tests/setupEnv.ts'],
  // First run downloads a MongoDB binary for mongodb-memory-server.
  testTimeout: 60000,
  collectCoverageFrom: ['src/**/*.ts', '!src/server.ts'],
};
