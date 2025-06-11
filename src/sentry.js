// Sentry error monitoring configuration (browser-safe)
try {
    // Check if we're in a browser environment and not in development
    if (typeof window !== 'undefined' && typeof process === 'undefined') {
        // Browser environment without Node.js process object
        const isDevelopment = window.location.hostname === 'localhost' || 
                             window.location.hostname === '127.0.0.1' ||
                             window.location.hostname === '0.0.0.0';
        
        if (!isDevelopment) {
            // Only initialize Sentry in production
            console.log('Production environment detected - Sentry monitoring could be initialized here');
            // Sentry.init({ dsn: "your-dsn-here" }); // Uncomment when ready
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