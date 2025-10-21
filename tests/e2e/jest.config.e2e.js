// E2E Jest Configuration
// Uses SQLite in-memory database for testing without Docker

const nextJest = require('next/jest')
const path = require('path')

// Point to project root (two levels up from tests/e2e/)
const projectRoot = path.join(__dirname, '../..')

const createJestConfig = nextJest({
  dir: projectRoot,
})

const customJestConfig = {
  displayName: 'e2e',
  rootDir: projectRoot,
  testMatch: ['<rootDir>/tests/e2e/specs/**/*.e2e.test.ts'],
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/tests/e2e/setup/jest-setup.ts'],
  globalSetup: '<rootDir>/tests/e2e/setup/global-setup.ts',
  globalTeardown: '<rootDir>/tests/e2e/setup/global-teardown.ts',
  testTimeout: 60000, // E2E tests can take longer
  maxWorkers: 1, // Run E2E tests serially to avoid database conflicts
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  verbose: true,
}

module.exports = createJestConfig(customJestConfig)
