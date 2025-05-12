/** @type {import('ts-jest').JestConfigWithTsJest} **/
module.exports = {
  testEnvironment: "node",
  transform: {
    "^.+\.tsx?$": ["ts-jest",{}],
  },
  testMatch: ["<rootDir>/src/test/**/*.test.ts"],
  moduleFileExtensions: ["ts", "js", "json", "node"],
};