// babel.config.js
// This file configures Babel, a JavaScript transpiler.
// It's used to convert modern JavaScript (ES6+) into versions compatible
// with older browsers or specific Node.js versions. This particular configuration
// is often used for projects that might involve Jest testing or other build processes
// that pick up `babel.config.js` (as opposed to `.babelrc` which can be more specific to direct transpilation).

export default {
  // "presets" are collections of plugins that define how to transform the code.
  presets: [
    // "@babel/preset-env" intelligently determines the Babel plugins and polyfills
    // needed based on the specified target environments.
    ['@babel/preset-env', {
      // "targets" specifies the environments to target.
      // Here, it's configured for the current Node.js version,
      // which is common for server-side code or test environments.
      targets: {
        node: 'current'
      }
    }],
    // Example: If using React, you might add "@babel/preset-react" here:
    // ['@babel/preset-react', {runtime: 'automatic'}]
  ],
  // "plugins" can be added here for specific transformations not included in presets.
};