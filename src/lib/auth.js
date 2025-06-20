// src/lib/auth.js
// This module is responsible for all authentication-related logic.
// It manages access tokens, handles the OAuth flow with Online Scout Manager (OSM),
// and controls UI changes based on the user's authentication state.

// --- Imports ---
import { getUserRoles } from './api.js';
// Assuming these UI functions will be available from ui.js or similar
import { showBlockedScreen, showLoadingState, updateSidebarToggleVisibility, showMainUI } from '../ui.js';

// --- Constants ---
// clientId: The unique identifier for this application registered with Online Scout Manager (OSM).
const clientId = 'x7hx1M0NExVdSiksH1gUBPxkSTn8besx';
// scope: Defines the permissions requested from OSM (e.g., reading section members, programme, events).
const scope = 'section:member:read section:programme:read section:event:read section:flexirecord:write' ;
// redirectUri: The URL to which OSM redirects the user after authentication.
// Note: This is dynamically constructed in the showLoginScreen function based on the current window origin.

// --- Auth functions originally from api.js ---
// Retrieves the access token from sessionStorage.
export function getToken() {
    return sessionStorage.getItem('access_token'); // Updated to match the key used in success.js
}

// Checks specific error conditions in API responses that indicate an invalid or expired token.
// responseData: The data object from an API response.
export function isTokenValid(responseData) {
    if (responseData && (
        (responseData.status === false && responseData.error && responseData.error.code === 'access-error-2') || // Specific OSM error
        responseData.error === 'Invalid access token' || // General invalid token error
        responseData.message === 'Unauthorized' || // Standard unauthorized message
        responseData.error === 'Token expired' // Specific token expired error
    )) {
        return false; // Token is considered invalid
    }
    return true; // Token is considered valid
}

// Handles the situation when an access token has expired or is invalid.
// Actions include:
// - Logging the event.
// - Removing the token from sessionStorage.
// - Clearing any cached data (e.g., sections cache).
// - Alerting the user about the session expiration (skipped in test environments).
// - Reloading the page to force re-authentication (skipped in test environments).
export function handleTokenExpiration() {
    console.log('Token expired - redirecting to login');
    sessionStorage.removeItem('access_token'); // Remove the expired token
    localStorage.removeItem('viking_sections_cache'); // Clear cached data that might be stale

    // Check if running in a test environment (e.g., Jest with jsdom)
    const isTestEnvironment = typeof jest !== 'undefined' ||
                             (typeof window !== 'undefined' && window.navigator && window.navigator.userAgent === 'jsdom');

    if (isTestEnvironment) {
        console.log('Test environment detected - skipping alert and page reload');
        return; // Do not alert or reload in tests
    }
    // In a browser environment, alert the user and reload the page.
    if (typeof window !== 'undefined' && window.alert) {
        alert('Your session has expired. Please log in again.');
    }
    if (typeof window !== 'undefined' && window.location) {
        window.location.reload();
    }
}

// Removes the access token from sessionStorage.
export function clearToken() {
    sessionStorage.removeItem('access_token');
    console.log('Authentication token cleared');
}

// Checks if an access token exists in sessionStorage, indicating an authenticated user.
// Returns true if a token exists, false otherwise.
export function isAuthenticated() {
    return !!getToken(); // Double negation converts the token string (or null) to a boolean
}

// --- Auth functions originally from main.js ---
// Displays the login screen, allowing users to authenticate via Online Scout Manager (OSM).
export function showLoginScreen() {
    console.log('Showing login screen');

    // Get environment variables with safe fallbacks for test environments
    const env = import.meta.env || {};
    const apiUrl = env.VITE_API_URL || 'https://vikings-osm-event-manager.onrender.com';
    const isDevelopment = env.VITE_NODE_ENV === 'development' || 
                         env.DEV ||
                         (typeof window !== 'undefined' && window.location.hostname === 'localhost');
    
    // Add env=dev parameter only for development (so backend redirects to localhost)
    // Production gets no environment parameter (so backend redirects to production domain)
    const finalApiUrl = isDevelopment 
        ? (apiUrl.includes('?') ? `${apiUrl}&env=dev` : `${apiUrl}?env=dev`)
        : apiUrl;
    
    // Debug environment configuration
    console.log('Environment Debug:', {
        NODE_ENV: env.NODE_ENV,
        VITE_NODE_ENV: env.VITE_NODE_ENV,
        VITE_API_URL: env.VITE_API_URL,
        isDevelopment,
        finalApiUrl,
        currentDomain: typeof window !== 'undefined' ? window.location.origin : 'test-environment'
    });

    // Build OAuth redirect URI with environment parameter
    const baseRedirectUri = `${apiUrl}/oauth/callback`;
    const redirectUri = isDevelopment 
        ? `${baseRedirectUri}?env=dev`
        : baseRedirectUri;

    const existingLoginBtn = document.getElementById('osm-login-btn');
    if (existingLoginBtn) {
        const mainContainer = document.querySelector('main.container') || document.querySelector('main');
        if (mainContainer) mainContainer.style.display = 'block';
        existingLoginBtn.addEventListener('click', () => {
            const authUrl = `https://www.onlinescoutmanager.co.uk/oauth/authorize?` +
                `client_id=${clientId}&` +
                `redirect_uri=${encodeURIComponent(redirectUri)}&` +
                `scope=${encodeURIComponent(scope)}&` +
                `response_type=code`;
            window.location.href = authUrl;
        });
        return;
    }

    const mainContainer = document.querySelector('main.container') || document.querySelector('main');
    if (!mainContainer) {
        console.error('Main container not found for login screen');
        return;
    }

    mainContainer.style.display = 'block';
    mainContainer.className = 'container';
    mainContainer.innerHTML = `
        <div class="row justify-content-center">
            <div class="col-12 col-sm-8 col-md-6 col-lg-4">
                <div class="card shadow-sm mb-4">
                    <div class="card-body text-center">
                        <button id="osm-login-btn"
                            class="btn btn-primary btn-lg mb-3"
                            style="font-size:1.5em; white-space: normal; line-height: 1.2;">
                            Login with<br>Online Scout Manager (OSM)
                        </button>
                        <div id="app-content"></div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Update the click handler for the new login button
    const loginBtn = document.getElementById('osm-login-btn');
    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            const authUrl = `https://www.onlinescoutmanager.co.uk/oauth/authorize?` +
                `client_id=${clientId}&` +
                `redirect_uri=${encodeURIComponent(redirectUri)}&` +
                `scope=${encodeURIComponent(scope)}&` +
                `response_type=code`;
            window.location.href = authUrl;
        });
    }
}

// Checks for an existing access token and validates it to determine the user's authentication state.
// This function is typically called on application load.
export async function checkForToken() {
    console.log('Checking for token...');
    
    // Debug: Check what's in sessionStorage
    const token = getToken();
    console.log('getToken() returned:', token ? 'Token found' : 'No token found');
    
    // First, check if OSM API access has been flagged as blocked.
    if (sessionStorage.getItem('osm_blocked') === 'true') {
        console.error('🚨 Application is blocked - showing blocked screen');
        showBlockedScreen(); // Display a screen indicating access is blocked
        return; // Halt further execution
    }

    showLoadingState(); // Display a loading indicator while checking token validity

    try {
        if (token) {
            // If a token exists, attempt to validate it by making a lightweight API call (e.g., fetching user roles).
            console.log('Token found, testing validity...');
            await getUserRoles(); // This call will implicitly use the token and fail if it's invalid
            // If getUserRoles succeeds, the token is considered valid.
            console.log('Token is valid, showing main UI');
            document.body.classList.remove('login-screen'); // Remove login-specific body class
            updateSidebarToggleVisibility(); // Update UI elements like sidebar visibility
            showMainUI(); // Display the main application interface
        } else {
            // If no token is found, the user is not authenticated.
            console.log('No token found, showing login');
            document.body.classList.add('login-screen'); // Add login-specific body class
            updateSidebarToggleVisibility(); // Update UI elements
            showLoginScreen(); // Display the login screen
        }
    } catch (error) {
        // If token validation fails (e.g., API call returns an auth error), treat as unauthenticated.
        console.error('Token validation failed:', error);
        sessionStorage.removeItem('access_token'); // Remove the invalid token
        document.body.classList.add('login-screen'); // Add login-specific body class
        updateSidebarToggleVisibility(); // Update UI elements
        showLoginScreen(); // Display the login screen
    }
}

// Dynamically adds a logout button to the sidebar.
// The button includes a click handler to clear the authentication token and reload the page.
export function addLogoutButton() {
    const sidebar = document.querySelector('.sidebar-content'); // Target the sidebar container
    // Add button only if sidebar exists and logout button isn't already there.
    if (sidebar && !document.getElementById('logout-btn')) {
        const logoutBtn = document.createElement('button');
        logoutBtn.id = 'logout-btn';
        logoutBtn.className = 'btn btn-outline-danger btn-sm w-100 mt-3';
        logoutBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i> Logout';
        logoutBtn.onclick = () => {
            if (confirm('Are you sure you want to logout?')) {
                clearToken();
                window.location.reload();
            }
        };
        sidebar.appendChild(logoutBtn);
    }
}

// Ensure production uses production API
const getAPIURL = () => {
    const baseURL = import.meta.env.VITE_API_URL || 'https://vikings-osm-event-manager.onrender.com';
    const isProduction = import.meta.env.VITE_NODE_ENV === 'production';
    
    // Remove dev parameter in production
    if (isProduction && baseURL.includes('env=dev')) {
        return baseURL.replace(/[?&]env=dev/, '');
    }
    
    return baseURL;
};

export const API_URL = getAPIURL();

// Debug OAuth configuration in production
if (import.meta.env.VITE_NODE_ENV === 'production') {
    console.log('OAuth Config:', {
        clientId: import.meta.env.VITE_OSM_CLIENT_ID ? 'SET' : 'MISSING',
        redirectUri: import.meta.env.VITE_OSM_REDIRECT_URI,
        currentDomain: window.location.origin
    });
}

// Debug environment configuration
console.log('Environment Debug:', {
    NODE_ENV: import.meta.env.NODE_ENV,
    VITE_NODE_ENV: import.meta.env.VITE_NODE_ENV,
    VITE_API_URL: import.meta.env.VITE_API_URL,
    currentURL: window.location.href,
    isProduction: import.meta.env.VITE_NODE_ENV === 'production'
});

// Update all API calls to use apiUrlWithEnv instead of apiUrl
// This ensures the backend knows whether the request is from prod or dev environment
