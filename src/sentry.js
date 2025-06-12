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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNlbnRyeS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSIsImZpbGUiOiJzZW50cnkuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBTZW50cnkgZXJyb3IgbW9uaXRvcmluZyBjb25maWd1cmF0aW9uIChicm93c2VyLXNhZmUpCnRyeSB7CiAgICAvLyBDaGVjayBpZiB3ZSdyZSBpbiBhIGJyb3dzZXIgZW52aXJvbm1lbnQgYW5kIG5vdCBpbiBkZXZlbG9wbWVudAogICAgaWYgKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnICYmIHR5cGVvZiBwcm9jZXNzID09PSAndW5kZWZpbmVkJykgewogICAgICAgIC8vIEJyb3dzZXIgZW52aXJvbm1lbnQgd2l0aG91dCBOb2RlLmpzIHByb2Nlc3Mgb2JqZWN0CiAgICAgICAgY29uc3QgaXNEZXZlbG9wbWVudCA9IHdpbmRvdy5sb2NhdGlvbi5ob3N0bmFtZSA9PT0gJ2xvY2FsaG9zdCcgfHwgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgd2luZG93LmxvY2F0aW9uLmhvc3RuYW1lID09PSAnMTI3LjAuMC4xJyB8fAogICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpbmRvdy5sb2NhdGlvbi5ob3N0bmFtZSA9PT0gJzAuMC4wLjAnOwogICAgICAgIAogICAgICAgIGNvbnN0IGlzUHJvZHVjdGlvbiA9IHdpbmRvdy5sb2NhdGlvbi5ob3N0bmFtZS5pbmNsdWRlcygncmVuZGVyLmNvbScpIHx8CiAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpbmRvdy5sb2NhdGlvbi5ob3N0bmFtZS5pbmNsdWRlcygnaGVyb2t1YXBwLmNvbScpIHx8CiAgICAgICAgICAgICAgICAgICAgICAgICAgICghaXNEZXZlbG9wbWVudCAmJiB3aW5kb3cubG9jYXRpb24ucHJvdG9jb2wgPT09ICdodHRwczonKTsKICAgICAgICAKICAgICAgICBpZiAoaXNQcm9kdWN0aW9uKSB7CiAgICAgICAgICAgIC8vIE9ubHkgaW5pdGlhbGl6ZSBTZW50cnkgaW4gcHJvZHVjdGlvbiB3aXRoIHByb3BlciBlcnJvciBoYW5kbGluZwogICAgICAgICAgICBjb25zb2xlLmxvZygnUHJvZHVjdGlvbiBlbnZpcm9ubWVudCBkZXRlY3RlZCAtIFNlbnRyeSBtb25pdG9yaW5nIHJlYWR5Jyk7CiAgICAgICAgICAgIAogICAgICAgICAgICAvLyBVbmNvbW1lbnQgYW5kIGNvbmZpZ3VyZSB3aGVuIHJlYWR5IHRvIHVzZSBTZW50cnk6CiAgICAgICAgICAgIC8qCiAgICAgICAgICAgIGltcG9ydCgnQHNlbnRyeS9icm93c2VyJykudGhlbihTZW50cnkgPT4gewogICAgICAgICAgICAgICAgU2VudHJ5LmluaXQoewogICAgICAgICAgICAgICAgICAgIGRzbjogXCJ5b3VyLWRzbi1oZXJlXCIsCiAgICAgICAgICAgICAgICAgICAgZW52aXJvbm1lbnQ6IFwicHJvZHVjdGlvblwiLAogICAgICAgICAgICAgICAgICAgIHRyYWNlc1NhbXBsZVJhdGU6IDAuMSwKICAgICAgICAgICAgICAgICAgICBiZWZvcmVTZW5kKGV2ZW50KSB7CiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEZpbHRlciBvdXQgc291cmNlIG1hcCBlcnJvcnMKICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGV2ZW50LmV4Y2VwdGlvbikgewogICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZXJyb3IgPSBldmVudC5leGNlcHRpb24udmFsdWVzWzBdOwogICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGVycm9yICYmIGVycm9yLnZhbHVlICYmIGVycm9yLnZhbHVlLmluY2x1ZGVzKCdzb3VyY2UgbWFwJykpIHsKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDsgLy8gRG9uJ3Qgc2VuZCBzb3VyY2UgbWFwIGVycm9ycwogICAgICAgICAgICAgICAgICAgICAgICAgICAgfQogICAgICAgICAgICAgICAgICAgICAgICB9CiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBldmVudDsKICAgICAgICAgICAgICAgICAgICB9CiAgICAgICAgICAgICAgICB9KTsKICAgICAgICAgICAgfSkuY2F0Y2goZXJyb3IgPT4gewogICAgICAgICAgICAgICAgY29uc29sZS53YXJuKCdTZW50cnkgaW5pdGlhbGl6YXRpb24gZmFpbGVkOicsIGVycm9yKTsKICAgICAgICAgICAgfSk7CiAgICAgICAgICAgICovCiAgICAgICAgfSBlbHNlIHsKICAgICAgICAgICAgY29uc29sZS5sb2coJ0RldmVsb3BtZW50IGVudmlyb25tZW50IC0gU2VudHJ5IG1vbml0b3JpbmcgZGlzYWJsZWQnKTsKICAgICAgICB9CiAgICB9IGVsc2UgaWYgKHR5cGVvZiBwcm9jZXNzICE9PSAndW5kZWZpbmVkJyAmJiBwcm9jZXNzLmVudikgewogICAgICAgIC8vIE5vZGUuanMgZW52aXJvbm1lbnQgKHNob3VsZG4ndCBoYXBwZW4gaW4gYnJvd3NlciBidXQgYmVpbmcgc2FmZSkKICAgICAgICBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgPT09ICdwcm9kdWN0aW9uJykgewogICAgICAgICAgICBjb25zb2xlLmxvZygnTm9kZS5qcyBwcm9kdWN0aW9uIGVudmlyb25tZW50IGRldGVjdGVkJyk7CiAgICAgICAgfQogICAgfSBlbHNlIHsKICAgICAgICBjb25zb2xlLmxvZygnRW52aXJvbm1lbnQgZGV0ZWN0aW9uIGluY29uY2x1c2l2ZSAtIHNraXBwaW5nIFNlbnRyeSBpbml0aWFsaXphdGlvbicpOwogICAgfQp9IGNhdGNoIChlcnJvcikgewogICAgY29uc29sZS53YXJuKCdTZW50cnkgaW5pdGlhbGl6YXRpb24gZmFpbGVkOicsIGVycm9yKTsKfQoKZXhwb3J0IGRlZmF1bHQge307IC8vIEV4cG9ydCBlbXB0eSBvYmplY3QgdG8gc2F0aXNmeSBFUyBtb2R1bGUgcmVxdWlyZW1lbnRzIl19Cg==
