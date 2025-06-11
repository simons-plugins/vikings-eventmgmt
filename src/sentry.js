import * as Sentry from "@sentry/browser";
import { Integrations } from "@sentry/tracing";

Sentry.init({
  dsn: "YOUR_SENTRY_DSN", // Replace with your actual DSN from Sentry dashboard
  environment: process.env.NODE_ENV || "development",
  integrations: [
    new Integrations.BrowserTracing(),
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