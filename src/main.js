// ===== LOADING ANIMATION CONFIGURATION =====
// Choose your preferred loading animation:
// 'dots' = Pulsing dots (minimal, clean)
// 'ring' = Spinning ring (classic, smooth)
// 'gradient' = Colorful gradient spinner (modern, vibrant)
const PREFERRED_SPINNER = 'ring'; // Change this to your preference

// Import functions
import {
    getUserRoles,
    getMostRecentTermId,
    getEvents,
    getEventAttendance,
    getToken
} from './api.js';
import {
    showSpinner,
    hideSpinner,
    showError,
    renderSectionsTable,
    renderEventsTable,
    renderAttendeesTable,
    setButtonLoading,
    setDefaultSpinner
} from './ui.js';

const clientId = '98YWRWrOQyUVAlJuPHs8AdsbVg2mUCQO';
const scope = 'section:member:read section:programme:read section:event:read';
const redirectUri = window.location.origin + '/callback.html';

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

// Update showLoginScreen to work with your HTML structure:

function showLoginScreen() {
    console.log('Showing login screen');
    
    // Check if we already have the login UI showing
    const existingLoginBtn = document.getElementById('osm-login-btn');
    if (existingLoginBtn) {
        // Login UI is already showing, just ensure it has the click handler
        existingLoginBtn.onclick = () => {
            console.log('Login button clicked, redirecting to OSM...');
            const authUrl = `https://www.onlinescoutmanager.co.uk/oauth/authorize?` +
                `client_id=${clientId}&` +
                `redirect_uri=${encodeURIComponent(redirectUri)}&` +
                `scope=${encodeURIComponent(scope)}&` +
                `response_type=code`;
            
            console.log('Auth URL:', authUrl);
            window.location.href = authUrl;
        };
        return;
    }

    // If no existing login button, restore the original login structure
    const mainContainer = document.querySelector('main.container');
    if (!mainContainer) {
        console.error('Main container not found for login screen');
        return;
    }
    
    mainContainer.className = 'container';
    mainContainer.innerHTML = `
        <div class="row justify-content-center">
            <div class="col-12 col-sm-8 col-md-6 col-lg-4">
                <div class="card shadow-sm mb-4">
                    <div class="card-body text-center">
                        <button id="osm-login-btn"
                            class="btn btn-primary btn-lg w-100 mb-3"
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
            console.log('Login button clicked, redirecting to OSM...');
            const authUrl = `https://www.onlinescoutmanager.co.uk/oauth/authorize?` +
                `client_id=${clientId}&` +
                `redirect_uri=${encodeURIComponent(redirectUri)}&` +
                `scope=${encodeURIComponent(scope)}&` +
                `response_type=code`;
            
            console.log('Auth URL:', authUrl);
            window.location.href = authUrl;
        });
    }
}

// Update the mobile button in showMainUI to use chevron instead of bars:

function showMainUI() {
    // Get the main container and replace all content with attendance panel
    const mainContainer = document.querySelector('main');
    if (!mainContainer) {
        console.error('Main container not found');
        return;
    }

    // Replace entire main content with attendance details panel
    mainContainer.innerHTML = `
        <div class="container-fluid p-0">
            <div class="row no-gutters">
                <div class="col-12">
                    <div id="app-content">
                        <div id="attendance-panel" class="mt-4">
                            <div class="card shadow-sm h-100">
                                <div class="card-header bg-info text-white">
                                    <h5 class="mb-0">Attendance Details</h5>
                                </div>
                                <div class="card-body">
                                    <p class="text-muted text-center">
                                        Use the sidebar to load sections and events, then view attendance details here.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Initialize sidebar after content is loaded
    initializeSidebar();
    
    // Ensure sidebar has proper content
    const sidebarContent = document.querySelector('.sidebar-content');
    if (!sidebarContent) {
        console.warn('Sidebar content not found, recreating...');
        const sidebar = document.getElementById('sidebar');
        if (sidebar) {
            sidebar.innerHTML = `
                <!-- Sidebar Header -->
                <div class="sidebar-header">
                    <h3>Sections & Events</h3>
                </div>
                
                <!-- Sidebar Content -->
                <div class="sidebar-content">
                    <div id="sections-table-container"></div>
                    <div id="events-table-container" class="mt-3"></div>
                </div>
            `;
        }
    }
    
    // Auto-load sections when main UI is shown
    loadSectionsFromCacheOrAPI();

    console.log('Main UI initialized - ready for sidebar interaction');
}

// Make functions globally available for onclick handlers
window.clearSectionsCache = clearSectionsCache;
window.loadSectionsFromCacheOrAPI = loadSectionsFromCacheOrAPI;

// === SIDEBAR FUNCTIONALITY ===

function initializeSidebar() {
    const sidebar = document.getElementById('sidebar');
    const toggleBtn = document.getElementById('sidebarToggle');
    const overlay = document.getElementById('sidebarOverlay');
    
    if (!sidebar || !toggleBtn) {
        console.warn('Sidebar elements not found');
        return;
    }

    // Toggle sidebar (open/close)
    toggleBtn.addEventListener('click', () => {
        if (sidebar.classList.contains('open')) {
            // Sidebar is open, so close it
            closeSidebar();
        } else {
            // Sidebar is closed, so open it
            sidebar.classList.add('open');
            document.body.classList.add('sidebar-open');
            if (overlay) overlay.classList.add('show');
            
            // Move toggle button to the right when sidebar is open
            toggleBtn.style.left = '340px';
        }
    });

    // Close sidebar function
    function closeSidebar() {
        sidebar.classList.remove('open');
        document.body.classList.remove('sidebar-open');
        if (overlay) overlay.classList.remove('show');
        
        // Move toggle button back to original position
        toggleBtn.style.left = '1rem';
    }
    
    // Close sidebar when clicking overlay
    if (overlay) {
        overlay.addEventListener('click', closeSidebar);
    }

    // Close sidebar when clicking outside of it
    document.addEventListener('click', (e) => {
        if (
            sidebar.classList.contains('open') &&
            !sidebar.contains(e.target) &&
            e.target !== toggleBtn &&
            !toggleBtn.contains(e.target)
        ) {
            closeSidebar();
        }
    });

    // Close sidebar on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && sidebar.classList.contains('open')) {
            closeSidebar();
        }
    });
}

// === SECTION CACHING FUNCTIONALITY ===

const SECTIONS_CACHE_KEY = 'viking_sections_cache';
const SECTIONS_CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

function saveSectionsToCache(sections) {
    try {
        const cacheData = {
            sections: sections,
            timestamp: Date.now(),
            version: '1.0' // For future cache invalidation if needed
        };
        localStorage.setItem(SECTIONS_CACHE_KEY, JSON.stringify(cacheData));
        console.log(`Cached ${sections.length} sections to localStorage`);
    } catch (error) {
        console.warn('Failed to cache sections:', error);
    }
}

function getSectionsFromCache() {
    try {
        const cached = localStorage.getItem(SECTIONS_CACHE_KEY);
        if (!cached) return null;
        
        const cacheData = JSON.parse(cached);
        const now = Date.now();
        
        // Check if cache is expired
        if (now - cacheData.timestamp > SECTIONS_CACHE_EXPIRY) {
            console.log('Sections cache expired, removing...');
            localStorage.removeItem(SECTIONS_CACHE_KEY);
            return null;
        }
        
        console.log(`Loaded ${cacheData.sections.length} sections from cache`);
        return cacheData.sections;
    } catch (error) {
        console.warn('Failed to load sections from cache:', error);
        localStorage.removeItem(SECTIONS_CACHE_KEY);
        return null;
    }
}

function clearSectionsCache() {
    localStorage.removeItem(SECTIONS_CACHE_KEY);
    console.log('Sections cache cleared');
}

async function loadSectionsFromCacheOrAPI() {
    // Show loading state
    const sectionsContainer = document.getElementById('sections-table-container');
    if (sectionsContainer) {
        sectionsContainer.innerHTML = `
            <div class="text-center py-3">
                <div class="spinner-border spinner-border-sm text-primary" role="status">
                    <span class="sr-only">Loading...</span>
                </div>
                <div class="small text-muted mt-2">Loading sections...</div>
            </div>
        `;
    }
    
    try {
        // First try to load from cache
        let sections = getSectionsFromCache();
        
        if (sections) {
            // Use cached sections
            currentSections = sections;
            renderSectionsTable(sections, handleSectionSelect);
        } else {
            // Cache miss - load from API
            console.log('No cached sections found, loading from API...');
            sections = await getUserRoles();
            
            if (sections && sections.length > 0) {
                // Save to cache for next time
                saveSectionsToCache(sections);
                currentSections = sections;
                renderSectionsTable(sections, handleSectionSelect);
            } else {
                throw new Error('No sections returned from API');
            }
        }
        
    } catch (error) {
        console.error('Failed to load sections:', error);
        showError('Failed to load sections. Please try refreshing.');
        
        // Show error state in sidebar
        if (sectionsContainer) {
            sectionsContainer.innerHTML = `
                <div class="alert alert-warning alert-sm">
                    <div class="small">
                        <i class="fas fa-exclamation-triangle"></i> 
                        Failed to load sections
                    </div>
                    <button class="btn btn-outline-primary btn-sm mt-2 w-100" onclick="loadSectionsFromCacheOrAPI()">
                        <i class="fas fa-redo"></i> Retry
                    </button>
                </div>
            `;
        }
    }
}

// Complete handler for section selection
async function handleSectionSelect(selectedSectionIds) {
    if (selectedSectionIds.length === 0) {
        showError('Please select at least one section');
        return;
    }

    showSpinner();
    try {
        let allEvents = [];
        
        // Create a mapping of sectionId to sectionName from stored data
        const sectionIdToName = {};
        currentSections.forEach(section => {
            sectionIdToName[section.sectionid] = section.sectionname;
        });
        
        // Fetch events for each selected section
        for (const sectionId of selectedSectionIds) {
            const termId = await getMostRecentTermId(sectionId);
            if (termId) {
                const events = await getEvents(sectionId, termId);
                if (events.items) {
                    // Add section name to each event
                    const eventsWithSectionName = events.items.map(event => ({
                        ...event,
                        sectionname: sectionIdToName[sectionId] || 'Unknown Section',
                        sectionid: sectionId
                    }));
                    allEvents = allEvents.concat(eventsWithSectionName);
                }
            }
        }

        // Render the events table - force mobile layout on all screen sizes
        renderEventsTable(allEvents, handleEventSelect, true); // true = force mobile layout
        
    } catch (err) {
        showError('Failed to load events');
        console.error(err);
    } finally {
        hideSpinner();
    }
}

// Update your handleEventSelect with more detailed logging:
async function handleEventSelect(selectedEvents) {
    if (!selectedEvents || selectedEvents.length === 0) {
        showError('Please select at least one event');
        return;
    }

    showSpinner();
    try {
        let allAttendees = [];
        
        for (const event of selectedEvents) {
            try {
                console.log('Processing event:', {
                    eventid: event.eventid,
                    sectionid: event.sectionid,
                    termid: event.termid,
                    name: event.name
                });
                
                // Get termid for the event (if not already in event object)
                let termId = event.termid;
                if (!termId) {
                    termId = await getMostRecentTermId(event.sectionid);
                }
                
                const attendanceData = await getEventAttendance(event.sectionid, event.eventid, termId);
                
                console.log('Raw attendance data:', attendanceData);
                
                if (attendanceData && attendanceData.items && attendanceData.items.length > 0) {
                    const eventAttendees = attendanceData.items.map(attendee => ({
                        ...attendee,
                        sectionname: event.sectionname,
                        _eventName: event.name,
                        _eventDate: event.date
                    }));
                    allAttendees = allAttendees.concat(eventAttendees);
                } else if (attendanceData && Array.isArray(attendanceData) && attendanceData.length > 0) {
                    const eventAttendees = attendanceData.map(attendee => ({
                        ...attendee,
                        sectionname: event.sectionname,
                        _eventName: event.name,
                        _eventDate: event.date
                    }));
                    allAttendees = allAttendees.concat(eventAttendees);
                } else {
                    console.warn('No attendance data found for event:', event.name, attendanceData);
                }
                
            } catch (eventError) {
                console.error(`Failed to fetch attendance for event ${event.name}:`, eventError);
            }
        }

        if (allAttendees.length === 0) {
            showError('No attendance data found for selected events');
        } else {
            renderAttendeesTable(allAttendees);
        }
        
    } catch (err) {
        showError('Failed to load attendees');
        console.error('Overall error:', err);
    } finally {
        hideSpinner();
    }
}

// Add the missing checkForToken function before your DOMContentLoaded listener:

async function checkForToken() {
    console.log('Checking for token...');
    
    try {
        // Check if we have a valid token
        const token = await getToken();
        if (token) {
            console.log('Token found, showing main UI');
            showMainUI();
        } else {
            console.log('No token found, showing login');
            showLoginScreen();
        }
    } catch (error) {
        console.error('Error checking token:', error);
        showLoginScreen();
    }
}

// Make sure your DOMContentLoaded listener looks like this:

document.addEventListener('DOMContentLoaded', async function initializeApp() {
    try {
        // Set the preferred spinner type
        setDefaultSpinner(PREFERRED_SPINNER);
        
        // Check for elements that should exist
        const mainContainer = document.querySelector('main');
        if (!mainContainer) {
            console.error('Main container not found');
            return;
        }
        
        // Check for existing login button and replace showLoginScreen logic
        const existingLoginBtn = document.getElementById('osm-login-btn');
        if (existingLoginBtn) {
            existingLoginBtn.addEventListener('click', () => {
                console.log('Login button clicked, redirecting to OSM...');
                const authUrl = `https://www.onlinescoutmanager.co.uk/oauth/authorize?` +
                    `client_id=${clientId}&` +
                    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
                    `scope=${encodeURIComponent(scope)}&` +
                    `response_type=code`;
                
                console.log('Auth URL:', authUrl);
                window.location.href = authUrl;
            });
        }
        
        // Check for token and potentially show main UI
        await checkForToken();
        
    } catch (error) {
        console.error('App initialization failed:', error);
        showFallbackError();
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