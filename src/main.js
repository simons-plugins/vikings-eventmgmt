// src/main.js
// This file serves as the primary entry point for the application.
// It is responsible for initializing the application, handling authentication,
// loading initial data, and setting up the main UI components.

// ===== LOADING ANIMATION CONFIGURATION =====
// Choose your preferred loading animation:
// 'dots' = Pulsing dots (minimal, clean)
// 'ring' = Spinning ring (classic, smooth)
// 'gradient' = Colorful gradient spinner (modern, vibrant)
const PREFERRED_SPINNER = 'ring'; // Change this to your preference

// Initialize error monitoring (conditionally for production)
try {
    // Only load Sentry in production or when explicitly enabled
    if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        import('./sentry.js').catch(error => {
            console.warn('Sentry initialization failed:', error);
        });
    }
} catch (error) {
    console.warn('Error monitoring not available:', error);
}

// Import functions from new lib structure
import { checkForToken } from './lib/auth.js';
import { loadSectionsFromCacheOrAPI, clearSectionsCache } from './lib/cache.js';

// Import new page system
import { initializeRouter, showPage } from './lib/page-router.js';
import { initializeSectionsPage } from './pages/sections-page.js';
import { initializeEventsPage } from './pages/events-page.js';
import { initializeAttendancePage } from './pages/attendance-page.js';

// Imports from ui.js
import {
    setDefaultSpinner,
    showError // For error handling
} from './ui.js';

// Note: The Sentry import logic remains unchanged, handled by its own try/catch block.
// Constants clientId, scope are now defined in auth.js as they are used by showLoginScreen.
// redirectUri is dynamically constructed in showLoginScreen.

let currentSections = [];

// Add this function to check for required elements before initialization:
// Returns a Promise that resolves when the DOM is fully loaded,
// ensuring that scripts execute only after the document structure is ready.
function waitForDOM() {
    return new Promise((resolve) => {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', resolve);
        } else {
            resolve();
        }
    });
}


// Make sure your DOMContentLoaded listener looks like this:

document.addEventListener('DOMContentLoaded', async function initializeApp() {
    try {
        // Debug: Check if token exists
        const token = sessionStorage.getItem('access_token');
        console.log('Token check on page load:', token ? 'Token found' : 'No token found');
        console.log('SessionStorage contents:', {
            access_token: sessionStorage.getItem('access_token'),
            token_type: sessionStorage.getItem('token_type'),
            osm_access_token: sessionStorage.getItem('osm_access_token') // Check for old key too
        });
        
        const mainContainer = document.querySelector('main.container') || document.querySelector('main');
        if (mainContainer) {
            // Hide the main container initially to prevent Flash of Unstyled Content (FOUC)
            // while the application is loading and initializing.
            mainContainer.style.display = 'none'; // Prevent FOUC
        }
        
        setDefaultSpinner(PREFERRED_SPINNER);
        
        if (!mainContainer) {
            console.error('Critical: Main container not found. App cannot start.');
            return;
        }
        
        // Initialize the page router system
        initializeRouter();
        
        // Check for existing token first - this will determine if user is logged in
        console.log('Calling checkForToken...');
        await checkForToken(); // Imported from lib/auth.js
        
        // If user is authenticated (i.e., not on login screen), initialize the app pages
        // The body will not have 'login-screen' class if authenticated.
        if (!document.body.classList.contains('login-screen')) {
            console.log('User is authenticated, initializing page system');
            await initializeAppPages();
        } else {
            console.log('User not authenticated, staying on login screen');
        }

    } catch (error) { // Catch errors from checkForToken or other setup
        console.error('App initialization failed:', error);
        showFallbackError(); // General fallback for critical errors
    }
});

// Initialize the app pages system
async function initializeAppPages() {
    try {
        console.log('Loading sections data for page system...');
        
        // Show the login screen initially while we load data
        const loginScreen = document.getElementById('login-screen');
        if (loginScreen) {
            loginScreen.style.display = 'block';
        }
        
        // Load sections data
        const sectionsData = await loadSectionsFromCacheOrAPI();
        
        if (sectionsData && sectionsData.length > 0) {
            // Hide login screen and show the sections page
            if (loginScreen) {
                loginScreen.style.display = 'none';
            }
            
            // Initialize the sections page with the loaded data
            await initializeSectionsPage(sectionsData);
            
            // Show the sections page
            showPage('sections');
            
            console.log(`Initialized page system with ${sectionsData.length} sections`);
        } else {
            // No sections data available
            console.warn('No sections data available');
            showError('No sections found. Please contact your administrator.');
        }
        
    } catch (error) {
        console.error('Error initializing app pages:', error);
        showError('Failed to load application data. Please try refreshing.');
    }
}

// Displays a generic error message directly in the DOM when critical initialization fails.
// This provides a user-friendly way to suggest a page refresh.
function showFallbackError() {
    const body = document.body;
    if (body) {
        const errorDiv = document.createElement('div');
        errorDiv.innerHTML = `
            <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); 
                        background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                        text-align: center; max-width: 400px;">
                <h3 style="color: #dc3545; margin-bottom: 1rem;">Application Error</h3>
                <p style="margin-bottom: 1.5rem;">Failed to load the application. Please refresh the page.</p>
                <button onclick="window.location.reload()" 
                        style="padding: 0.75rem 1.5rem; background: #007bff; color: white; 
                               border: none; border-radius: 4px; cursor: pointer;">
                    Refresh Page
                </button>
            </div>
        `;
        body.appendChild(errorDiv);
    }
}


// Make functions globally available for HTML onclick handlers and page navigation
window.clearSectionsCache = clearSectionsCache; // Imported from ./lib/cache.js
window.loadSectionsFromCacheOrAPI = loadSectionsFromCacheOrAPI; // Imported from ./lib/cache.js

// Page initialization functions (used when navigating between pages)
window.initializeEventsPage = initializeEventsPage;
window.initializeAttendancePage = initializeAttendancePage;

// Note: Page navigation functions (goToEvents, goToAttendance, goBack, setAttendanceView)
// are already made global by the page router in initializeRouter()
