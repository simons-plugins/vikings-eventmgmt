// Sentry error monitoring - Currently disabled due to CDN import issues
// To enable Sentry, you'll need to use a bundler like Vite or webpack
// or include Sentry via script tag in HTML instead of ES modules

console.log('Sentry monitoring: Disabled (CDN import issues)');

// Placeholder for when you set up proper Sentry integration
const Sentry = {
  captureException: (error) => {
    console.error('Error captured:', error);
  },
  captureMessage: (message) => {
    console.log('Message captured:', message);
  }
};

export default Sentry;