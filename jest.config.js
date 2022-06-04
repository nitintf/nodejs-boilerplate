module.exports = {
  cacheDirectory: './.cache/jest',
  rootDir: './dist',
  clearMocks: true,
  verbose: true,
  reporters: ['default', ['jest-junit', { suiteName: 'unit tests' }]],
  collectCoverage: true,
  coveragePathIgnorePatterns: ["/node_modules/", "src/__artillery_/", "src/__mocha_/"],
  coverageReporters: ["json", "text", "lcov", "clover"],
  coverageDirectory: './../test/coverage/',
};
