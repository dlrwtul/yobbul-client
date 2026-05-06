/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = {
  rootDir:           '..',
  testMatch:         ['<rootDir>/e2e/**/*.spec.ts'],
  testTimeout:       120_000,
  maxWorkers:        1,
  globalSetup:       'detox/runners/jest/globalSetup',
  globalTeardown:    'detox/runners/jest/globalTeardown',
  reporters:         ['detox/runners/jest/reporter'],
  testEnvironment:   'detox/runners/jest/testEnvironment',
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: { allowJs: true } }],
  },
  setupFilesAfterFramework: ['<rootDir>/e2e/helpers/setup.ts'],
}
