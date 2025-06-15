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
const scope = 'section:member:read section:programme:read section:event:read';
// redirectUri: The URL to which OSM redirects the user after authentication.
// Note: This is dynamically constructed in the showLoginScreen function based on the current window origin.

// --- Auth functions originally from api.js ---
// Retrieves the access token from sessionStorage.
export function getToken() {
    return sessionStorage.getItem('access_token');
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
    // Dynamically construct the redirect URI based on the current window's origin.
    // This ensures the callback works correctly across different deployment environments (e.g., localhost, production).
    const redirectUri = window.location.origin + '/callback.html';

    // Check if a login button already exists in the DOM.
    // This can happen if the login screen was previously rendered or is part of the static HTML.
    const existingLoginBtn = document.getElementById('osm-login-btn');
    if (existingLoginBtn) {
        // If an existing button is found, ensure the main container is visible
        // and attach the OAuth click handler to it.
        const mainContainer = document.querySelector('main.container') || document.querySelector('main');
        if (mainContainer) mainContainer.style.display = 'block'; // Make sure the container is visible
        existingLoginBtn.onclick = () => {
            // Construct the OSM OAuth authorization URL.
            // This URL redirects the user to OSM's login page.
            const authUrl = `https://www.onlinescoutmanager.co.uk/oauth/authorize?` +
                `client_id=${clientId}&` + // Application's client ID
                `redirect_uri=${encodeURIComponent(redirectUri)}&` + // Where OSM redirects after auth
                `scope=${encodeURIComponent(scope)}&` + // Permissions requested
                `response_type=code`; // OAuth flow type (Authorization Code Grant)
            window.location.href = authUrl; // Redirect the user to OSM
        };
        return; // Login button is set up, no need to create new UI.
    }

    // If no existing login button, create the login UI from scratch.
    const mainContainer = document.querySelector('main.container') || document.querySelector('main');
    if (!mainContainer) {
        console.error('Main container not found for login screen');
        return; // Cannot proceed without a main container
    }

    mainContainer.style.display = 'block'; // Ensure the main container is visible
    mainContainer.className = 'container'; // Reset or set class for styling
    // Populate the main container with the login UI structure.
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

    // Get the newly created login button and attach the event listener.
    const loginBtn = document.getElementById('osm-login-btn');
    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            // Construct the OSM OAuth authorization URL, same as above.
            const authUrl = `https://www.onlinescoutmanager.co.uk/oauth/authorize?` +
                `client_id=${clientId}&` +
                `redirect_uri=${encodeURIComponent(redirectUri)}&` +
                `scope=${encodeURIComponent(scope)}&` +
                `response_type=code`;
            window.location.href = authUrl; // Redirect the user to OSM
        });
    }
}

// Checks for an existing access token and validates it to determine the user's authentication state.
// This function is typically called on application load.
export async function checkForToken() {
    console.log('Checking for token...');
    // First, check if OSM API access has been flagged as blocked.
    if (sessionStorage.getItem('osm_blocked') === 'true') {
        console.error('🚨 Application is blocked - showing blocked screen');
        showBlockedScreen(); // Display a screen indicating access is blocked
        return; // Halt further execution
    }

    showLoadingState(); // Display a loading indicator while checking token validity

    try {
        const token = getToken(); // Retrieve token from sessionStorage
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
