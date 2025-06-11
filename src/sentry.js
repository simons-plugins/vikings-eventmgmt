// Use CDN imports for browser compatibility
import * as Sentry from "https://browser.sentry-cdn.com/8.40.0/bundle.tracing.min.js";

Sentry.init({
  dsn: "https://d68b0633ca93454b1c4eada1483a0801@o4509454106165248.ingest.us.sentry.io/4509454116716544", // Replace with your actual DSN from Sentry dashboard
  environment: window.location.hostname === 'localhost' ? 'development' : 'production',
  integrations: [
    new Sentry.BrowserTracing(),
  ],
  
  // Performance Monitoring
  tracesSampleRate: 1.0, // Capture 100% of the transactions

  // Release tracking
  release: "vikings-eventmgmt@1.0.0",
  
  // Error filtering
  beforeSend(event) {
    // Filter out development errors
    if (event.environment === 'development') {
      console.log('Sentry event:', event);
    }
    return event;
  }
});

export default Sentry;