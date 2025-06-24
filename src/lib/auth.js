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
    
    // Legacy state detection - will be replaced below with more accurate logic
    const forceProduction = window.location.hostname !== 'localhost';
    const legacyStateParam = forceProduction ? 'prod' : 'dev';
    
    console.log('🧪 LEGACY: Forced state detection:', { forceProduction, legacyStateParam });

    // DEBUG: Enhanced logging for production troubleshooting
    console.log('🔍 OAuth Debug Info:', {
        currentDomain: typeof window !== 'undefined' ? window.location.origin : 'unknown',
        hostname: typeof window !== 'undefined' ? window.location.hostname : 'unknown',
        isDevelopment,
        legacyStateParam,
        apiUrl,
        env: {
            VITE_NODE_ENV: env.VITE_NODE_ENV,
            DEV: env.DEV
        }
    });
    
    // Dynamic OAuth URL generation based on current deployment
    const BACKEND_URL = 'https://vikings-osm-event-manager.onrender.com';
    const redirectUri = `${BACKEND_URL}/oauth/callback`;
    
    // Determine environment based on hostname
    const hostname = window.location.hostname;
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
    const isDeployedServer = hostname.includes('.onrender.com') || hostname === 'vikings-eventmgmt.onrender.com';
    
    // For deployed servers (production or PR previews), use production flow
    // For localhost, use dev flow
    const stateParam = isDeployedServer ? 'prod' : 'dev';
    
    // Pass the current frontend URL to the backend so it knows where to redirect back
    const currentFrontendUrl = window.location.origin;
    const redirectUriWithFrontend = `${redirectUri}?frontend_url=${encodeURIComponent(currentFrontendUrl)}`;
    
    console.log('🔧 Dynamic OAuth Config:', {
        hostname,
        isLocalhost,
        isDeployedServer,
        stateParam,
        currentFrontendUrl,
        redirectUri: redirectUriWithFrontend,
        backendUrl: BACKEND_URL
    });

    // Build OAuth redirect URI - backend handles OAuth callback and redirects back to frontend
    // const redirectUri = `${apiUrl}/oauth/callback`;
    
    // Enhanced OAuth URL logging
    const authUrl = `https://www.onlinescoutmanager.co.uk/oauth/authorize?` +
        `client_id=${clientId}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `state=${stateParam}&` +
        `scope=${encodeURIComponent(scope)}&` +
        `response_type=code`;
    
    console.log('🔗 Generated OAuth URL:', authUrl);
    console.log('📍 Redirect URI sent to OSM:', redirectUri);
    console.log('🏷️ State parameter:', stateParam);

    const existingLoginBtn = document.getElementById('osm-login-btn');
    if (existingLoginBtn) {
        const mainContainer = document.querySelector('main.container') || document.querySelector('main');
        if (mainContainer) mainContainer.style.display = 'block';
        existingLoginBtn.addEventListener('click', () => {
            const authUrl = `https://www.onlinescoutmanager.co.uk/oauth/authorize?` +
                `client_id=${clientId}&` +
                `redirect_uri=${encodeURIComponent(redirectUriWithFrontend)}&` +
                `state=${stateParam}&` +
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
                `redirect_uri=${encodeURIComponent(redirectUriWithFrontend)}&` +
                `state=${stateParam}&` +
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
    const env = import.meta.env || {};
    const baseURL = env.VITE_API_URL || 'https://vikings-osm-event-manager.onrender.com';
    const isProduction = env.VITE_NODE_ENV === 'production';
    
    // Remove dev parameter in production
    if (isProduction && baseURL.includes('env=dev')) {
        return baseURL.replace(/[?&]env=dev/, '');
    }
    
    return baseURL;
};

export const API_URL = getAPIURL();

// Debug OAuth configuration in production
const env = import.meta.env || {};
if (env.VITE_NODE_ENV === 'production') {
    console.log('OAuth Config:', {
        clientId: env.VITE_OSM_CLIENT_ID ? 'SET' : 'MISSING',
        redirectUri: env.VITE_OSM_REDIRECT_URI,
        currentDomain: typeof window !== 'undefined' ? window.location.origin : 'unknown'
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

// IMPORTANT: Update OAuth to use state parameter instead of env parameter
// Development: state=dev, Production: state=prod
// Backend will handle redirect URLs based on state parameter

// Update all API calls to use apiUrlWithEnv instead of apiUrl
// This ensures the backend knows whether the request is from prod or dev environment

// CACHE BUSTING v3.0 - Timestamp: 2025-01-23-18:00
// If you see this exact timestamp in production, the cache has been refreshed
console.log('🚀 Auth.js loaded - Version 3.0 - TIMESTAMP: 2025-01-23-18:00');

// Clean up: Remove debug logging now that OAuth flow is working
// Production-ready version without excessive console logs
