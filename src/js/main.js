import { AuthManager } from './modules/auth.js';
import { ApiClient } from './utils/api.js';
import { SidebarManager } from './modules/sidebar.js';
import { EventManager } from './modules/events.js';

// Simple State Manager with subscribe functionality
class SimpleState {
    constructor() {
        this.data = {
            currentSection: null,
            currentTerm: null,
            events: [],
            attendance: {}
        };
        this.subscribers = [];
    }

    subscribe(callback) {
        this.subscribers.push(callback);
        console.log('State subscription added, total subscribers:', this.subscribers.length);
    }

    unsubscribe(callback) {
        const index = this.subscribers.indexOf(callback);
        if (index > -1) {
            this.subscribers.splice(index, 1);
        }
    }

    setState(updates) {
        this.data = { ...this.data, ...updates };
        this.subscribers.forEach(callback => {
            try {
                callback(this.data);
            } catch (error) {
                console.error('State subscriber error:', error);
            }
        });
    }

    getState() {
        return { ...this.data };
    }

    // Getter methods for convenience
    get currentSection() { return this.data.currentSection; }
    get currentTerm() { return this.data.currentTerm; }
    get events() { return this.data.events; }
    get attendance() { return this.data.attendance; }
}

export class VikingsEventApp {
    constructor() {
        console.log('VikingsEventApp constructor starting...');
        
        // Create instances in correct order
        this.auth = new AuthManager();
        this.api = new ApiClient();
        this.state = new SimpleState();
        this.sidebar = new SidebarManager(this.state, this.api, this.auth);
        this.events = new EventManager(this.state, this.api);
        
        console.log('All managers created:');
        console.log('- Auth:', !!this.auth);
        console.log('- API:', !!this.api);
        console.log('- Sidebar:', !!this.sidebar);
        console.log('- Events:', !!this.events);
        console.log('- Sidebar.auth:', !!this.sidebar.auth);
        console.log('- State has subscribe:', typeof this.state.subscribe === 'function');
        
        // Expose for debugging
        window.app = this;
    }

    async initialize() {
        try {
            console.log('Vikings Event Management System starting...');
            
            // ✅ ALWAYS set up login button first, regardless of auth status
            this.setupLoginButton();
            
            // Check authentication status
            const authStatus = await this.auth.checkForToken();
            console.log('Authentication status:', authStatus);
            
            if (authStatus === 'authenticated') {
                console.log('User is authenticated, showing main UI');
                this.showMainUI();
            } else if (authStatus === 'unauthenticated') {
                console.log('User not authenticated, showing login UI');
                this.showLoginUI();
            } else {
                console.error('Authentication check failed');
                this.showError('Authentication system error');
            }
            
        } catch (error) {
            console.error('Failed to initialize app:', error);
            this.showError('Failed to initialize application');
        }
    }

    // ✅ NEW METHOD - Always set up login button
    setupLoginButton() {
        console.log('Setting up login button...');
        const loginBtn = document.getElementById('login-btn');
        console.log('Login button found:', !!loginBtn);
        
        if (loginBtn) {
            // Remove any existing listeners first
            loginBtn.replaceWith(loginBtn.cloneNode(true));
            const newLoginBtn = document.getElementById('login-btn');
            
            newLoginBtn.addEventListener('click', (e) => {
                console.log('🎯 Login button clicked!');
                e.preventDefault();
                
                console.log('Auth manager available:', !!this.auth);
                console.log('redirectToLogin available:', typeof this.auth.redirectToLogin);
                
                try {
                    this.auth.redirectToLogin();
                } catch (error) {
                    console.error('Login redirect failed:', error);
                }
            });
            
            console.log('✅ Login button listener attached successfully');
        } else {
            console.error('❌ Login button not found in DOM');
        }
    }

    showMainUI() {
        console.log('showMainUI called - checking elements...');
        
        const loginContainer = document.getElementById('login-container');
        const mainContainer = document.getElementById('main-container');
        
        if (!loginContainer || !mainContainer) {
            console.error('Required containers not found');
            return;
        }
        
        // Use CSS classes to override Bootstrap classes
        loginContainer.classList.add('container-hidden');
        loginContainer.classList.remove('d-flex', 'vh-100');
        
        mainContainer.classList.add('container-visible');
        mainContainer.style.display = 'block';
        
        console.log('✅ Containers switched successfully');
        
        // Setup logout button
        this.setupLogoutButton();
        
        // Initialize managers
        console.log('Initializing sidebar...');
        this.sidebar.initialize();
        
        console.log('Initializing events...');
        this.events.initialize();
        
        console.log('Main UI initialized successfully');
    }

    // ✅ NEW METHOD - Set up logout button
    setupLogoutButton() {
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                console.log('Logout button clicked');
                e.preventDefault();
                this.auth.logout();
                location.reload(); // Refresh to show login screen
            });
            console.log('✅ Logout button listener attached');
        }
    }

    showLoginUI() {
        console.log('showLoginUI called');
        
        const mainContainer = document.getElementById('main-container');
        const loginContainer = document.getElementById('login-container');
        
        // Use CSS classes
        if (mainContainer) {
            mainContainer.classList.add('container-hidden');
            mainContainer.classList.remove('container-visible');
        }
        
        if (loginContainer) {
            loginContainer.classList.remove('container-hidden');
            loginContainer.classList.add('d-flex', 'vh-100');
            loginContainer.style.display = '';
        }
        
        console.log('Login UI shown, button listener already attached');
    }

    showError(message) {
        const container = document.getElementById('login-container') || document.body;
        container.innerHTML = `
            <div class="alert alert-danger text-center">
                <h4>Error</h4>
                <p>${message}</p>
                <button onclick="location.reload()" class="btn btn-primary">Reload Page</button>
            </div>
        `;
    }
}

// Initialize the application with better DOM readiness checking
function initializeApp() {
    console.log('Page loaded, initializing Vikings Event Management System...');
    
    // Double-check that all required elements exist
    const requiredElements = ['login-container', 'main-container', 'login-btn'];
    const missingElements = requiredElements.filter(id => !document.getElementById(id));
    
    if (missingElements.length > 0) {
        console.error('Missing required HTML elements:', missingElements);
        setTimeout(initializeApp, 100); // Retry after 100ms
        return;
    }
    
    console.log('All required elements found, creating app...');
    const app = new VikingsEventApp();
    app.initialize();
}

// Use multiple event listeners to ensure DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    // DOM is already loaded
    initializeApp();
}

// Fallback - if DOMContentLoaded already fired
window.addEventListener('load', () => {
    if (!window.app) {
        console.log('Fallback initialization...');
        initializeApp();
    }
});