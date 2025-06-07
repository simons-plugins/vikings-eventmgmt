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
    const mainContainer = document.querySelector('main.container');
    if (!mainContainer) {
        console.error('Main container not found for showMainUI');
        return;
    }

    // Update mobile button to use chevron-right instead of bars
    mainContainer.className = 'container-fluid';
    mainContainer.innerHTML = `
        <div class="row">
            <!-- Mobile sidebar toggle button with chevron -->
            <button id="sidebar-toggle" class="btn btn-primary d-lg-none position-fixed" 
                    style="top: 80px; left: 10px; z-index: 1050; border-radius: 50%; width: 50px; height: 50px;">
                <i class="fas fa-chevron-right"></i>
            </button>
            
            <!-- Sidebar overlay for mobile -->
            <div id="sidebar-overlay" class="sidebar-overlay d-lg-none"></div>
            
            <!-- Left Column - Sections & Events -->
            <div class="col-12 col-lg-4">
                <div id="sidebar" class="sidebar">
                    <!-- Desktop collapse button - keep FontAwesome icons -->
                    <button class="desktop-collapse-btn d-none d-lg-flex" id="desktop-collapse" title="Collapse sidebar">
                        <i class="fas fa-chevron-left"></i>
                    </button>
                    
                    <!-- Mobile header -->
                    <div class="sidebar-header d-lg-none">
                        <h6 class="mb-0 text-white">Sections & Events</h6>
                        <button id="sidebar-close" class="btn btn-sm btn-outline-light">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    
                    <!-- Rest of the HTML stays the same... -->
                    <div class="card shadow-sm h-100">
                        <div class="card-header bg-info text-white d-none d-lg-block regular-content">
                            <h5 class="mb-0">Sections & Events</h5>
                        </div>
                        <div class="card-body">
                            <!-- Regular content (hidden when collapsed on desktop) -->
                            <div class="regular-content">
                                <button id="get-sections-btn" class="btn btn-primary btn-block mb-3">
                                    Get Sections
                                </button>
                                <div id="sections-table-container"></div>
                                <div id="events-table-container" class="mt-3"></div>
                            </div>
                            
                            <!-- Mini buttons (shown when collapsed on desktop) - START HIDDEN -->
                            <button id="get-sections-btn-mini" class="mini-btn btn btn-primary" title="Get Sections" style="display: none;">
                                <i class="fas fa-list"></i>
                            </button>
                            <button id="load-events-btn-mini" class="mini-btn btn btn-success" title="Load Events" style="display: none;">
                                <i class="fas fa-calendar"></i>
                            </button>
                            <button id="load-attendees-btn-mini" class="mini-btn btn btn-info" title="Show Attendees" style="display: none;">
                                <i class="fas fa-users"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Right Column - Attendance Details -->
            <div class="col-12 col-lg-8">
                <div id="main-content" class="main-content">
                    <div class="card shadow-sm h-100">
                        <div class="card-header bg-info text-white">
                            <h5 class="mb-0">Attendance Details</h5>
                        </div>
                        <div class="card-body">
                            <div id="attendance-panel">
                                <p class="text-muted text-center">
                                    Select events from the sidebar to view attendance details.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Initialize sidebar functionality
    initializeSidebar();

    // Re-attach event listeners with null checks
    const getSectionsBtn = document.getElementById('get-sections-btn');
    const getSectionsBtnMini = document.getElementById('get-sections-btn-mini');
    
    if (getSectionsBtn) {
        getSectionsBtn.addEventListener('click', handleGetSections);
    }
    
    if (getSectionsBtnMini) {
        getSectionsBtnMini.addEventListener('click', handleGetSections);
    }
}

// Add sidebar functionality
function initializeSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    const toggleBtn = document.getElementById('sidebar-toggle');
    const closeBtn = document.getElementById('sidebar-close');
    const mainContent = document.getElementById('main-content');
    const desktopCollapseBtn = document.getElementById('desktop-collapse');

    // Toggle sidebar on mobile
    toggleBtn?.addEventListener('click', () => {
        sidebar.classList.add('show');
        overlay.classList.add('show');
        document.body.style.overflow = 'hidden';
    });

    // Close sidebar
    function closeSidebar() {
        sidebar.classList.remove('show');
        overlay.classList.remove('show');
        document.body.style.overflow = '';
    }

    closeBtn?.addEventListener('click', closeSidebar);
    overlay?.addEventListener('click', closeSidebar);

    // Desktop sidebar toggle with proper mini button management
    desktopCollapseBtn?.addEventListener('click', () => {
        const isCurrentlyCollapsed = sidebar.classList.contains('collapsed');
        
        sidebar.classList.toggle('collapsed');
        mainContent.classList.toggle('expanded');
        
        // Update the chevron direction
        const chevron = desktopCollapseBtn.querySelector('i');
        
        if (!isCurrentlyCollapsed) {
            // Collapsing - show mini buttons, hide regular content
            chevron.classList.remove('fa-chevron-left');
            chevron.classList.add('fa-chevron-right');
            desktopCollapseBtn.title = 'Expand sidebar';
            
            // Show appropriate mini buttons based on current state
            const getSectionsMini = document.getElementById('get-sections-btn-mini');
            const loadEventsMini = document.getElementById('load-events-btn-mini');
            const loadAttendeesMini = document.getElementById('load-attendees-btn-mini');
            
            if (getSectionsMini) getSectionsMini.style.display = 'block';
            
            // Only show load events mini if events are loaded
            if (loadEventsMini && document.querySelector('#events-table')) {
                loadEventsMini.style.display = 'block';
            }
            
            // Only show load attendees mini if attendees are loaded
            if (loadAttendeesMini && document.querySelector('#attendance-table')) {
                loadAttendeesMini.style.display = 'block';
            }
            
        } else {
            // Expanding - hide mini buttons, show regular content
            chevron.classList.remove('fa-chevron-right');
            chevron.classList.add('fa-chevron-left');
            desktopCollapseBtn.title = 'Collapse sidebar';
            
            // Hide all mini buttons
            document.querySelectorAll('.mini-btn').forEach(btn => {
                btn.style.display = 'none';
            });
        }
        
        // Hide any open dropdown content that might overflow
        document.querySelectorAll('.mobile-details-row, .person-details-row').forEach(row => {
            if (row.style.display !== 'none') {
                row.style.display = 'none';
                const parentRow = row.previousElementSibling;
                if (parentRow) {
                    parentRow.classList.remove('expanded');
                    const icon = parentRow.querySelector('.expand-icon');
                    if (icon) icon.textContent = '▼';
                }
            }
        });
    });

    // Auto-close sidebar on mobile after selection
    function autoCloseMobile() {
        if (window.innerWidth <= 991) {
            setTimeout(closeSidebar, 500);
        }
    }

    // Close sidebar when attendees are loaded (mobile)
    const originalLoadAttendees = window.loadAttendees;
    window.loadAttendees = function(...args) {
        if (originalLoadAttendees) originalLoadAttendees.apply(this, args);
        autoCloseMobile();
    };
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

        // Render the events table
        renderEventsTable(allEvents, handleEventSelect);
        
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

// Function to handle getting sections (extracted to avoid duplication)
async function handleGetSections() {
    showSpinner('Loading sections...');
    setButtonLoading('get-sections-btn', true, 'Loading...');
    setButtonLoading('get-sections-btn-mini', true, 'Loading...');
    
    try {
        const roles = await getUserRoles();
        currentSections = roles;
        renderSectionsTable(roles, handleSectionSelect);
        
        // Show the mini load events button when sections are loaded
        const loadEventsMini = document.getElementById('load-events-btn-mini');
        if (loadEventsMini) {
            loadEventsMini.style.display = 'block';
        }
        
    } catch (err) {
        showError('Failed to load sections');
    } finally {
        hideSpinner();
        // Clear loading state for both buttons
        setButtonLoading('get-sections-btn', false);
        setButtonLoading('get-sections-btn-mini', false);
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