/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  rootDir: '.',
  testEnvironment: 'node',
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {}],
  },
  testMatch: ['<rootDir>/src/test/**/*.e2e-spec.ts'],
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
  testTimeout: 30000,
}; 