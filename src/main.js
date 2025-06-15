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
import { checkForToken, addLogoutButton, showLoginScreen } from './lib/auth.js';
import { loadSectionsFromCacheOrAPI, clearSectionsCache } from './lib/cache.js';
import { handleSectionSelect, handleEventSelect } from './lib/handlers.js';

// Imports from ui.js
import {
    setDefaultSpinner,
    showMainUI,
    renderSectionsTable, // For rendering sections after load
    showError, // For error handling
    // Keeping these general utilities in case any remaining main.js code needs them.
    showSpinner,
    hideSpinner,
    setButtonLoading
} from './ui.js';
import {
    switchAttendanceTab, // For window assignment
    toggleGroupedSection // For window assignment
} from './ui/attendance.js';

// Note: The Sentry import logic remains unchanged, handled by its own try/catch block.
// Constants clientId, scope are now defined in auth.js as they are used by showLoginScreen.
// redirectUri is dynamically constructed in showLoginScreen.

let currentSections = [];

// Add this function to check for required elements before initialization:
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
        const mainContainer = document.querySelector('main.container') || document.querySelector('main');
        if (mainContainer) {
            mainContainer.style.display = 'none'; // Prevent FOUC
        }
        
        setDefaultSpinner(PREFERRED_SPINNER);
        
        if (!mainContainer) {
            console.error('Critical: Main container not found. App cannot start.');
            return;
        }
        
        // checkForToken will show login or basic main UI (without data)
        await checkForToken(); // Imported from lib/auth.js
        
        // If user is authenticated (i.e., not on login screen), load and render sections
        // The body will not have 'login-screen' class if authenticated.
        if (!document.body.classList.contains('login-screen')) {
            const sectionsContainer = document.getElementById('sections-table-container');
            if (sectionsContainer) {
                sectionsContainer.innerHTML = `<div class="text-center py-3"><div class="spinner-border spinner-border-sm text-primary"></div> <small class="text-muted ms-2">Loading sections...</small></div>`;
            }
            try {
                const sectionsData = await loadSectionsFromCacheOrAPI(); // Imported from lib/cache.js
                if (sectionsData) {
                    currentSections = sectionsData; // Update global currentSections
                    // Render sections table, passing the actual currentSections for the callback
                    renderSectionsTable(currentSections, (selectedIds) => {
                        handleSectionSelect(selectedIds, currentSections); // handleSectionSelect from lib/handlers.js
                    });
                } else if (sectionsContainer) { // Handle case where sectionsData is null/empty but no error thrown
                    sectionsContainer.innerHTML = `<div class="alert alert-info">No sections found or an issue occurred.</div>`;
                }
            } catch (error) {
                console.error('Error loading sections in main.js:', error);
                if (sectionsContainer) { // Show error in the specific container
                    sectionsContainer.innerHTML = `<div class="alert alert-danger alert-sm"><i class="fas fa-exclamation-triangle"></i> Failed to load sections. <button class="btn btn-outline-primary btn-sm float-end" onclick="window.location.reload()">Retry</button></div>`;
                } else { // Fallback to general showError if container isn't there
                    showError('Failed to load sections data. Please try refreshing.');
                }
            }
        }

    } catch (error) { // Catch errors from checkForToken or other setup
        console.error('App initialization failed:', error);
        showFallbackError(); // General fallback for critical errors
    }
});

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

async function validateTokenAndShowUI() {
    try {
        // Make a quick API call to test the token
        const roles = await getUserRoles();
        if (roles && roles.length >= 0) {
            // Token is valid, show main UI
            showMainUI();
        } else {
            // Token invalid, show login
            showLoginScreen();
        }
    } catch (error) {
        console.log('Token validation failed:', error);
        // Clear invalid token and show login
        sessionStorage.removeItem('access_token');
        showLoginScreen();
    }
}

// Make functions globally available for HTML onclick handlers and legacy access
window.switchAttendanceTab = switchAttendanceTab; // switchAttendanceTab is still in main.js
window.clearSectionsCache = clearSectionsCache; // Imported from ./lib/cache.js
window.loadSectionsFromCacheOrAPI = loadSectionsFromCacheOrAPI; // Imported from ./lib/cache.js
