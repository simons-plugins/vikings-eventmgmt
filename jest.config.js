// jest.config.js
// This file configures Jest, a JavaScript testing framework.
// It defines how Jest discovers tests, processes files, and reports results.
export default {
  // testEnvironment: Specifies the environment in which the tests will be run.
  // 'jsdom' simulates a browser environment (DOM) for testing UI components without a real browser.
  testEnvironment: 'jsdom',

  // setupFilesAfterEnv: A list of paths to modules that run some code to configure or set up
  // the testing framework before each test file in the suite is executed.
  // Useful for global setups, mocks, or extending Jest matchers.
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],

  // moduleFileExtensions: An array of file extensions your modules use.
  // Jest will look for these file types when resolving modules.
  moduleFileExtensions: ['js', 'json'],

  // transform: An object that configures how Jest should transform files before running tests.
  // This is often used for transpiling JavaScript (e.g., with Babel) or handling other file types.
  transform: {
    // Uses 'babel-jest' to transform JavaScript files. This allows using modern JS features
    // in your tests, as Babel will transpile them according to your Babel configuration.
    '^.+\\.js$': 'babel-jest',
  },

  // testMatch: An array of glob patterns Jest uses to detect test files.
  // This pattern looks for .test.js files within the 'tests' directory and its subdirectories.
  testMatch: [
    '<rootDir>/tests/**/*.test.js'
  ],

  // collectCoverageFrom: An array of glob patterns indicating a set of files for which
  // coverage information should be collected.
  collectCoverageFrom: [
    'src/**/*.js', // Collect coverage from all .js files in the src directory.
    '!src/**/*.test.js', // Exclude test files themselves from coverage.
    '!**/node_modules/**' // Exclude the node_modules directory.
  ],

  // coverageDirectory: The directory where Jest should output its coverage files.
  coverageDirectory: 'coverage',

  // coverageReporters: A list of reporter names that Jest uses when writing coverage reports.
  // 'text' (console output), 'lcov' (for services like Coveralls), 'html' (generates an HTML report).
  coverageReporters: ['text', 'lcov', 'html'],

  // verbose: Indicates whether each individual test should be reported during the run.
  verbose: true,

  // testEnvironmentOptions: Options that will be passed to the testEnvironment.
  // For 'jsdom', this can include options like the base URL for the simulated environment.
  testEnvironmentOptions: {
    url: 'http://localhost:3000' // Sets a base URL for tests, useful for relative paths or history API.
  }
  // moduleNameMapper: A map from regular expressions to module names or to arrays of module names
  // that allow to stub out resources, like images or styles with a CommonJS module.
  // e.g., moduleNameMapper: { '\\.(css|less)$': '<rootDir>/__mocks__/styleMock.js' }
};