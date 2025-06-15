// Module for authentication related functions.
// Will include functions moved from api.js and main.js.

// --- Imports ---
import { getUserRoles } from './api.js';
// Assuming these UI functions will be available from ui.js or similar
import { showBlockedScreen, showLoadingState, updateSidebarToggleVisibility, showMainUI } from '../ui.js';

// --- Constants ---
const clientId = 'x7hx1M0NExVdSiksH1gUBPxkSTn8besx';
const scope = 'section:member:read section:programme:read section:event:read';
// redirectUri is constructed dynamically in showLoginScreen

// --- Auth functions originally from api.js ---
export function getToken() {
    return sessionStorage.getItem('access_token');
}

export function isTokenValid(responseData) {
    if (responseData && (
        (responseData.status === false && responseData.error && responseData.error.code === 'access-error-2') ||
        responseData.error === 'Invalid access token' ||
        responseData.message === 'Unauthorized' ||
        responseData.error === 'Token expired'
    )) {
        return false;
    }
    return true;
}

export function handleTokenExpiration() {
    console.log('Token expired - redirecting to login');
    sessionStorage.removeItem('access_token');
    localStorage.removeItem('viking_sections_cache'); // SECTIONS_CACHE_KEY can be imported if needed for consistency

    const isTestEnvironment = typeof jest !== 'undefined' ||
                             (typeof window !== 'undefined' && window.navigator && window.navigator.userAgent === 'jsdom');

    if (isTestEnvironment) {
        console.log('Test environment detected - skipping alert and page reload');
        return;
    }
    if (typeof window !== 'undefined' && window.alert) {
        alert('Your session has expired. Please log in again.');
    }
    if (typeof window !== 'undefined' && window.location) {
        window.location.reload();
    }
}

export function clearToken() {
    sessionStorage.removeItem('access_token');
    console.log('Authentication token cleared');
}

export function isAuthenticated() {
    return !!getToken();
}

// --- Auth functions originally from main.js ---
export function showLoginScreen() {
    console.log('Showing login screen');
    const redirectUri = window.location.origin + '/callback.html'; // Dynamic construction

    const existingLoginBtn = document.getElementById('osm-login-btn');
    if (existingLoginBtn) {
        const mainContainer = document.querySelector('main.container') || document.querySelector('main');
        if (mainContainer) mainContainer.style.display = 'block';
        existingLoginBtn.onclick = () => {
            const authUrl = `https://www.onlinescoutmanager.co.uk/oauth/authorize?` +
                `client_id=${clientId}&` +
                `redirect_uri=${encodeURIComponent(redirectUri)}&` +
                `scope=${encodeURIComponent(scope)}&` +
                `response_type=code`;
            window.location.href = authUrl;
        };
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

export async function checkForToken() {
    console.log('Checking for token...');
    if (sessionStorage.getItem('osm_blocked') === 'true') {
        console.error('🚨 Application is blocked - showing blocked screen');
        showBlockedScreen(); // Imported from ui.js (assumed)
        return;
    }

    showLoadingState(); // Imported from ui.js (assumed)

    try {
        const token = getToken();
        if (token) {
            console.log('Token found, testing validity...');
            await getUserRoles(); // Imported from api.js
            console.log('Token is valid, showing main UI');
            document.body.classList.remove('login-screen');
            updateSidebarToggleVisibility(); // Imported from ui.js (assumed)
            showMainUI(); // Imported from ui.js (assumed)
        } else {
            console.log('No token found, showing login');
            document.body.classList.add('login-screen');
            updateSidebarToggleVisibility(); // Imported from ui.js (assumed)
            showLoginScreen();
        }
    } catch (error) {
        console.error('Token validation failed:', error);
        sessionStorage.removeItem('access_token');
        document.body.classList.add('login-screen');
        updateSidebarToggleVisibility(); // Imported from ui.js (assumed)
        showLoginScreen();
    }
}

export function addLogoutButton() {
    const sidebar = document.querySelector('.sidebar-content');
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
