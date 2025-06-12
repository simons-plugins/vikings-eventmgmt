// Sentry error monitoring configuration (browser-safe)
try {
    // Check if we're in a browser environment and not in development
    if (typeof window !== 'undefined' && typeof process === 'undefined') {
        // Browser environment without Node.js process object
        const isDevelopment = window.location.hostname === 'localhost' || 
                             window.location.hostname === '127.0.0.1' ||
                             window.location.hostname === '0.0.0.0';
        
        const isProduction = window.location.hostname.includes('render.com') ||
                           window.location.hostname.includes('herokuapp.com') ||
                           (!isDevelopment && window.location.protocol === 'https:');
        
        if (isProduction) {
            // Only initialize Sentry in production with proper error handling
            console.log('Production environment detected - Sentry monitoring ready');
            
            // Uncomment and configure when ready to use Sentry:
            /*
            import('@sentry/browser').then(Sentry => {
                Sentry.init({
                    dsn: "your-dsn-here",
                    environment: "production",
                    tracesSampleRate: 0.1,
                    beforeSend(event) {
                        // Filter out source map errors
                        if (event.exception) {
                            const error = event.exception.values[0];
                            if (error && error.value && error.value.includes('source map')) {
                                return null; // Don't send source map errors
                            }
                        }
                        return event;
                    }
                });
            }).catch(error => {
                console.warn('Sentry initialization failed:', error);
            });
            */
        } else {
            console.log('Development environment - Sentry monitoring disabled');
        }
    } else if (typeof process !== 'undefined' && process.env) {
        // Node.js environment (shouldn't happen in browser but being safe)
        if (process.env.NODE_ENV === 'production') {
            console.log('Node.js production environment detected');
        }
    } else {
        console.log('Environment detection inconclusive - skipping Sentry initialization');
    }
} catch (error) {
    console.warn('Sentry initialization failed:', error);
}

export default {}; // Export empty object to satisfy ES module requirements