/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  rootDir: '.',
  testEnvironment: 'node',
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {}],
  },
  // Match *.spec.ts (but exclude *.e2e-spec.ts)
  testMatch: [
    '<rootDir>/src/**/*.spec.ts',
    '<rootDir>/src/**/*.unit-spec.ts',
  ],
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
  // Ignore e2e tests
  testPathIgnorePatterns: ['e2e-spec.ts$'],
  globals: { 'ts-jest': { diagnostics: false } },
}; 