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

// Import functions
import {
    getUserRoles,
    getMostRecentTermId,
    getEvents,
    getEventAttendance,
    getFlexiRecords,
    getToken,
    clearToken
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

const clientId = 'x7hx1M0NExVdSiksH1gUBPxkSTn8besx';
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
        const mainContainer = document.querySelector('main.container') || document.querySelector('main');
        if (mainContainer) {
            mainContainer.style.display = 'block';
        }
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

    // Add logout button to sidebar
    addLogoutButton();

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

// Hide sidebar toggle on login screen, show on main app
function updateSidebarToggleVisibility() {
    const sidebarToggle = document.getElementById('sidebarToggle');
    if (sidebarToggle) {
        const isLoginScreen = document.body.classList.contains('login-screen');
        sidebarToggle.style.display = isLoginScreen ? 'none' : 'block';
    }
}

// Add logout functionality
function addLogoutButton() {
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
    // Check if application is blocked before making any API calls
    if (sessionStorage.getItem('osm_blocked') === 'true') {
        showError('Application is blocked by OSM. Contact administrator.');
        showBlockedScreen();
        return;
    }
    
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
            renderTabbedAttendanceView(allAttendees);
        }
        
    } catch (err) {
        showError('Failed to load attendees');
        console.error('Overall error:', err);
    } finally {
        hideSpinner();
    }
}

// Render tabbed attendance view with multiple pages
function renderTabbedAttendanceView(attendees) {
    const attendancePanel = document.getElementById('attendance-panel');
    if (!attendancePanel) return;

    const tabsHtml = `
        <div class="card shadow-sm h-100">
            <div class="card-header bg-info text-white">
                <div class="d-flex justify-content-between align-items-center">
                    <h5 class="mb-0">
                        <i class="fas fa-users"></i> 
                        Attendance Records
                        <span class="badge badge-light text-dark ms-2">${attendees.length} total</span>
                    </h5>
                </div>
            </div>
            
            <!-- Tab Navigation -->
            <div class="card-body p-0">
                <nav>
                    <div class="nav nav-tabs border-bottom" id="nav-tab" role="tablist">
                        <button class="nav-link active" id="nav-summary-tab" data-toggle="tab" 
                                data-target="#nav-summary" type="button" role="tab" 
                                aria-controls="nav-summary" aria-selected="true"
                                onclick="switchAttendanceTab('summary')">
                            <i class="fas fa-table me-1"></i>
                            Attendance Summary
                        </button>
                        <button class="nav-link" id="nav-grouped-tab" data-toggle="tab" 
                                data-target="#nav-grouped" type="button" role="tab" 
                                aria-controls="nav-grouped" aria-selected="false"
                                onclick="switchAttendanceTab('grouped')">
                            <i class="fas fa-layer-group me-1"></i>
                            Attendance Detailed Groups
                        </button>
                        <button class="nav-link" id="nav-camp-groups-tab" data-toggle="tab" 
                                data-target="#nav-camp-groups" type="button" role="tab" 
                                aria-controls="nav-camp-groups" aria-selected="false"
                                onclick="switchAttendanceTab('camp-groups')">
                            <i class="fas fa-campground me-1"></i>
                            Camp Groups
                        </button>
                    </div>
                </nav>
                
                <!-- Tab Content -->
                <div class="tab-content" id="nav-tabContent">
                    <!-- Summary Tab -->
                    <div class="tab-pane fade show active" id="nav-summary" role="tabpanel" aria-labelledby="nav-summary-tab">
                        <div id="summary-content" class="p-0">
                            <!-- Summary table will be rendered here -->
                        </div>
                    </div>
                    
                    <!-- Grouped Tab -->
                    <div class="tab-pane fade" id="nav-grouped" role="tabpanel" aria-labelledby="nav-grouped-tab">
                        <div id="grouped-content" class="p-0">
                            <!-- Grouped table will be rendered here -->
                        </div>
                    </div>
                    
                    <!-- Camp Groups Tab -->
                    <div class="tab-pane fade" id="nav-camp-groups" role="tabpanel" aria-labelledby="nav-camp-groups-tab">
                        <div id="camp-groups-content" class="p-0">
                            <!-- Camp groups table will be rendered here -->
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    attendancePanel.innerHTML = tabsHtml;

    // Render both tab contents
    renderSummaryAttendanceTable(attendees);
    renderGroupedAttendanceTable(attendees);
    renderCampGroupsTable(attendees);
}

// Switch between attendance tabs
function switchAttendanceTab(tabType) {
    // Update tab active states
    document.querySelectorAll('#nav-tab .nav-link').forEach(tab => {
        tab.classList.remove('active');
        tab.setAttribute('aria-selected', 'false');
    });
    
    document.querySelectorAll('.tab-pane').forEach(pane => {
        pane.classList.remove('show', 'active');
    });

    if (tabType === 'summary') {
        document.getElementById('nav-summary-tab').classList.add('active');
        document.getElementById('nav-summary-tab').setAttribute('aria-selected', 'true');
        document.getElementById('nav-summary').classList.add('show', 'active');
    } else if (tabType === 'grouped') {
        document.getElementById('nav-grouped-tab').classList.add('active');
        document.getElementById('nav-grouped-tab').setAttribute('aria-selected', 'true');
        document.getElementById('nav-grouped').classList.add('show', 'active');
    } else if (tabType === 'camp-groups') {
        document.getElementById('nav-camp-groups-tab').classList.add('active');
        document.getElementById('nav-camp-groups-tab').setAttribute('aria-selected', 'true');
        document.getElementById('nav-camp-groups').classList.add('show', 'active');
    }
}

// Make tab switching globally available
window.switchAttendanceTab = switchAttendanceTab;

// Render original summary attendance table (using ui.js logic)
function renderSummaryAttendanceTable(attendees) {
    const summaryContent = document.getElementById('summary-content');
    if (!summaryContent) return;

    if (attendees.length === 0) {
        summaryContent.innerHTML = `
            <p class="text-muted text-center">
                No attendees found for the selected events.
            </p>
        `;
        return;
    }

    // Group attendees by person (first + last name) - copied from ui.js logic
    const attendeesByPerson = {};
    attendees.forEach(attendee => {
        const personKey = `${attendee.firstname} ${attendee.lastname}`;
        if (!attendeesByPerson[personKey]) {
            attendeesByPerson[personKey] = {
                firstname: attendee.firstname,
                lastname: attendee.lastname,
                events: [],
                totalYes: 0,
                totalNo: 0
            };
        }
        
        attendeesByPerson[personKey].events.push(attendee);
        if (attendee.attending === 'Yes') {
            attendeesByPerson[personKey].totalYes++;
        } else {
            attendeesByPerson[personKey].totalNo++;
        }
    });

    // Get unique values for filters
    const uniqueSections = [...new Set(attendees.map(a => a.sectionname))];
    const uniqueEvents = [...new Set(attendees.map(a => a._eventName))];
    const uniqueStatuses = [...new Set(attendees.map(a => a.attending))];

    // Check if mobile
    const isMobile = window.innerWidth <= 767;

    let html = `
        <div class="d-flex justify-content-between align-items-center mb-3">
            <h6 class="mb-0">Attendance Summary</h6>
            <small class="text-muted">
                <span id="summary-attendee-count">${Object.keys(attendeesByPerson).length}</span> person(s), 
                <span id="summary-event-count">${attendees.length}</span> event record(s)
            </small>
        </div>
        
        <!-- Filter Controls -->
        <div class="row mb-3">
            <div class="col-md-3 mb-2">
                <select id="summary-section-filter" class="form-select form-select-sm">
                    <option value="">All Sections</option>
                    ${uniqueSections.map(section => `<option value="${section}">${section}</option>`).join('')}
                </select>
            </div>
            <div class="col-md-3 mb-2">
                <select id="summary-event-filter" class="form-select form-select-sm">
                    <option value="">All Events</option>
                    ${uniqueEvents.map(event => `<option value="${event}">${event}</option>`).join('')}
                </select>
            </div>
            <div class="col-md-3 mb-2">
                <select id="summary-status-filter" class="form-select form-select-sm">
                    <option value="">All Statuses</option>
                    ${uniqueStatuses.map(status => `<option value="${status}">${status}</option>`).join('')}
                </select>
            </div>
            <div class="col-md-3 mb-2">
                <input type="text" id="summary-name-filter" class="form-control form-control-sm" placeholder="Search name...">
            </div>
        </div>
        
        <!-- Clear Filters Button -->
        <div class="mb-3">
            <button id="summary-clear-filters-btn" class="btn btn-outline-secondary btn-sm">Clear Filters</button>
        </div>
        
        <!-- Attendance Table -->
        <div class="table-responsive">
            <table id="summary-attendance-table" class="table table-striped table-sm">`;

    if (isMobile) {
        // Mobile layout
        html += `
                <thead>
                    <tr>
                        <th style="width: 70px;" class="text-center sortable" data-sort="status">
                            Status <span class="sort-arrow">⇅</span>
                        </th>
                        <th class="sortable" data-sort="name">
                            Name <span class="sort-arrow">⇅</span>
                        </th>
                        <th style="width: 40px;" class="text-center">▼</th>
                    </tr>
                </thead>
                <tbody id="summary-attendance-tbody">`;
    } else {
        // Desktop layout
        html += `
                <thead>
                    <tr>
                        <th style="width: 120px;" class="text-center sortable" data-sort="status">
                            Attending <span class="sort-arrow">⇅</span>
                        </th>
                        <th class="sortable" data-sort="firstname">
                            First Name <span class="sort-arrow">⇅</span>
                        </th>
                        <th class="sortable" data-sort="lastname">
                            Last Name <span class="sort-arrow">⇅</span>
                        </th>
                        <th style="width: 40px;" class="text-center">▼</th>
                    </tr>
                </thead>
                <tbody id="summary-attendance-tbody">`;
    }

    // Generate person rows
    Object.entries(attendeesByPerson).forEach(([personKey, person], personIdx) => {
        if (isMobile) {
            html += `
                <tr class="summary-person-row" data-person-idx="${personIdx}" 
                    data-firstname="${person.firstname}" 
                    data-lastname="${person.lastname}" 
                    data-total-yes="${person.totalYes}" 
                    data-total-no="${person.totalNo}" 
                    style="cursor: pointer;">
                    <td class="text-center total-column">
                        <div class="d-flex flex-column">
                            <span class="text-success fw-bold">${person.totalYes}</span>
                            <span class="text-danger small">${person.totalNo}</span>
                        </div>
                    </td>
                    <td>
                        <div class="fw-bold">${person.firstname} ${person.lastname}</div>
                        <small class="text-muted">${person.events.length} event(s)</small>
                    </td>
                    <td class="text-center">
                        <span class="summary-expand-icon">▼</span>
                    </td>
                </tr>`;
        } else {
            html += `
                <tr class="summary-person-row" data-person-idx="${personIdx}" 
                    data-firstname="${person.firstname}" 
                    data-lastname="${person.lastname}" 
                    data-total-yes="${person.totalYes}" 
                    data-total-no="${person.totalNo}" 
                    style="cursor: pointer;">
                    <td class="text-center">
                        <span class="text-success fw-bold">${person.totalYes}</span> / 
                        <span class="text-danger">${person.totalNo}</span>
                    </td>
                    <td>${person.firstname}</td>
                    <td>${person.lastname}</td>
                    <td class="text-center">
                        <span class="summary-expand-icon">▼</span>
                    </td>
                </tr>`;
        }

        // Add expandable details row
        html += `
            <tr class="summary-person-details-row" id="summary-person-details-${personIdx}" style="display: none;">
                <td colspan="${isMobile ? 3 : 4}" class="bg-light p-0">
                    <div class="table-responsive">
                        <table class="table table-sm mb-0">
                            <thead class="bg-secondary text-white">
                                <tr>
                                    <th class="small">Section</th>
                                    <th class="small">Event</th>
                                    <th class="small text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody>`;

        // Add event details for this person
        person.events.forEach(event => {
            const statusClass = event.attending === 'Yes' ? 'text-success' : 'text-danger';
            html += `
                <tr>
                    <td class="small">${event.sectionname || ''}</td>
                    <td class="small">${event._eventName || ''}</td>
                    <td class="small text-center ${statusClass}">
                        <strong>${event.attending || ''}</strong>
                    </td>
                </tr>`;
        });

        html += `
                            </tbody>
                        </table>
                    </div>
                </td>
            </tr>`;
    });

    html += `
                </tbody>
            </table>
        </div>
    `;

    summaryContent.innerHTML = html;

    // Add CSS for sortable columns
    if (!document.getElementById('sortable-style')) {
        const style = document.createElement('style');
        style.id = 'sortable-style';
        style.textContent = `
            .sortable {
                cursor: pointer;
                user-select: none;
                position: relative;
            }
            .sortable:hover {
                background-color: #f8f9fa;
            }
            .sort-arrow {
                font-size: 0.8em;
                margin-left: 4px;
                color: #6c757d;
            }
            .sortable.sort-asc .sort-arrow {
                color: #007bff;
            }
            .sortable.sort-desc .sort-arrow {
                color: #007bff;
            }
            .sortable.sort-asc .sort-arrow::after {
                content: ' ▲';
            }
            .sortable.sort-desc .sort-arrow::after {
                content: ' ▼';
            }
        `;
        document.head.appendChild(style);
    }

    // Add expand functionality
    addSummaryPersonExpandFunctionality();
    
    // Add sorting functionality
    addSummaryTableSorting(attendeesByPerson);
    
    // Add filtering functionality
    addSummaryAttendeeFiltering(attendeesByPerson, attendees);
}

// Add the summary person expand functionality
function addSummaryPersonExpandFunctionality() {
    document.querySelectorAll('.summary-person-row').forEach(row => {
        row.addEventListener('click', function() {
            const personIdx = this.dataset.personIdx;
            const detailsRow = document.getElementById(`summary-person-details-${personIdx}`);
            const expandIcon = this.querySelector('.summary-expand-icon');
            
            if (detailsRow.style.display === 'none') {
                // Expand
                detailsRow.style.display = '';
                expandIcon.textContent = '▲';
                this.classList.add('expanded');
            } else {
                // Collapse
                detailsRow.style.display = 'none';
                expandIcon.textContent = '▼';
                this.classList.remove('expanded');
            }
        });
    });
}

// Add table sorting functionality for summary table
function addSummaryTableSorting(attendeesByPerson) {
    const sortableHeaders = document.querySelectorAll('#summary-attendance-table .sortable');
    let currentSort = { column: null, direction: 'asc' };

    sortableHeaders.forEach(header => {
        header.addEventListener('click', function() {
            const sortColumn = this.dataset.sort;
            const tbody = document.getElementById('summary-attendance-tbody');
            const rows = Array.from(tbody.querySelectorAll('.summary-person-row'));

            // Toggle sort direction if same column, otherwise default to asc
            if (currentSort.column === sortColumn) {
                currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
            } else {
                currentSort.direction = 'asc';
            }
            currentSort.column = sortColumn;

            // Update header styling
            sortableHeaders.forEach(h => {
                h.classList.remove('sort-asc', 'sort-desc');
            });
            this.classList.add(currentSort.direction === 'asc' ? 'sort-asc' : 'sort-desc');

            // Sort rows based on column and direction
            rows.sort((a, b) => {
                let comparison = 0;

                switch (sortColumn) {
                    case 'firstname':
                        comparison = a.dataset.firstname.toLowerCase().localeCompare(b.dataset.firstname.toLowerCase());
                        break;
                    case 'lastname':
                        comparison = a.dataset.lastname.toLowerCase().localeCompare(b.dataset.lastname.toLowerCase());
                        break;
                    case 'name':
                        // Sort by last name first, then first name
                        const lastNameCompare = a.dataset.lastname.toLowerCase().localeCompare(b.dataset.lastname.toLowerCase());
                        if (lastNameCompare !== 0) {
                            comparison = lastNameCompare;
                        } else {
                            comparison = a.dataset.firstname.toLowerCase().localeCompare(b.dataset.firstname.toLowerCase());
                        }
                        break;
                    case 'status':
                        // Sort by attendance ratio (Yes / Total events)
                        const totalYesA = parseInt(a.dataset.totalYes) || 0;
                        const totalNoA = parseInt(a.dataset.totalNo) || 0;
                        const totalYesB = parseInt(b.dataset.totalYes) || 0;
                        const totalNoB = parseInt(b.dataset.totalNo) || 0;
                        
                        const totalA = totalYesA + totalNoA;
                        const totalB = totalYesB + totalNoB;
                        const ratioA = totalA > 0 ? totalYesA / totalA : 0;
                        const ratioB = totalB > 0 ? totalYesB / totalB : 0;
                        
                        // Compare ratios
                        if (ratioA < ratioB) comparison = -1;
                        else if (ratioA > ratioB) comparison = 1;
                        else {
                            // If ratios are equal, sort by total Yes count
                            if (totalYesA < totalYesB) comparison = -1;
                            else if (totalYesA > totalYesB) comparison = 1;
                            else comparison = 0;
                        }
                        break;
                    default:
                        return 0;
                }

                // Apply sort direction
                return currentSort.direction === 'asc' ? comparison : -comparison;
            });

            // Re-append sorted rows and their detail rows
            rows.forEach((row, index) => {
                const personIdx = row.dataset.personIdx;
                const detailsRow = document.getElementById(`summary-person-details-${personIdx}`);
                
                // Update person index for correct ordering
                row.dataset.personIdx = index;
                if (detailsRow) {
                    detailsRow.id = `summary-person-details-${index}`;
                }
                
                tbody.appendChild(row);
                if (detailsRow) {
                    tbody.appendChild(detailsRow);
                }
            });

            // Re-add expand functionality after reordering
            addSummaryPersonExpandFunctionality();
        });
    });
}

// Add filtering for summary table
function addSummaryAttendeeFiltering(attendeesByPerson, originalAttendees) {
    const sectionFilter = document.getElementById('summary-section-filter');
    const eventFilter = document.getElementById('summary-event-filter');
    const statusFilter = document.getElementById('summary-status-filter');
    const nameFilter = document.getElementById('summary-name-filter');
    const clearButton = document.getElementById('summary-clear-filters-btn');

    function applyFilters() {
        const sectionValue = sectionFilter.value.toLowerCase();
        const eventValue = eventFilter.value.toLowerCase();
        const statusValue = statusFilter.value.toLowerCase();
        const nameValue = nameFilter.value.toLowerCase();

        let visibleCount = 0;

        document.querySelectorAll('.summary-person-row').forEach(row => {
            const personIdx = row.dataset.personIdx;
            const personKey = Object.keys(attendeesByPerson)[personIdx];
            const person = attendeesByPerson[personKey];
            
            // Check if person matches filters
            const nameMatch = !nameValue || 
                (person.firstname.toLowerCase().includes(nameValue) || 
                 person.lastname.toLowerCase().includes(nameValue));
                 
            // Check if any of their events match section/event/status filters
            const eventsMatch = person.events.some(event => {
                const sectionMatch = !sectionValue || event.sectionname.toLowerCase().includes(sectionValue);
                const eventMatch = !eventValue || event._eventName.toLowerCase().includes(eventValue);
                const statusMatch = !statusValue || event.attending.toLowerCase().includes(statusValue);
                
                return sectionMatch && eventMatch && statusMatch;
            });

            if (nameMatch && eventsMatch) {
                row.style.display = '';
                document.getElementById(`summary-person-details-${personIdx}`).style.display = 'none';
                row.classList.remove('expanded');
                row.querySelector('.summary-expand-icon').textContent = '▼';
                visibleCount++;
            } else {
                row.style.display = 'none';
                document.getElementById(`summary-person-details-${personIdx}`).style.display = 'none';
            }
        });

        document.getElementById('summary-attendee-count').textContent = visibleCount;
    }

    // Add event listeners
    [sectionFilter, eventFilter, statusFilter, nameFilter].forEach(filter => {
        filter.addEventListener('change', applyFilters);
        filter.addEventListener('input', applyFilters);
    });

    clearButton.addEventListener('click', () => {
        [sectionFilter, eventFilter, statusFilter, nameFilter].forEach(filter => {
            filter.value = '';
        });
        applyFilters();
    });
}

// Render grouped attendance table (optimized for performance)
function renderGroupedAttendanceTable(attendees) {
    const groupedContent = document.getElementById('grouped-content');
    if (!groupedContent) return;

    // Use document fragment for better performance
    const fragment = document.createDocumentFragment();
    
    // Group attendees by status
    const groupedAttendees = {};
    attendees.forEach(attendee => {
        const status = attendee.attending || attendee.status || 'Unknown';
        if (!groupedAttendees[status]) {
            groupedAttendees[status] = [];
        }
        groupedAttendees[status].push(attendee);
    });

    // Sort statuses with custom priority: Yes, No, Invited, then alphabetical
    const statusPriority = { 'Yes': 1, 'No': 2, 'Invited': 3 };
    const sortedStatuses = Object.keys(groupedAttendees).sort((a, b) => {
        const priorityA = statusPriority[a] || 999;
        const priorityB = statusPriority[b] || 999;
        
        if (priorityA !== priorityB) {
            return priorityA - priorityB;
        }
        
        // If same priority (both unknown), sort alphabetically
        return a.localeCompare(b);
    });

    if (sortedStatuses.length === 0) {
        groupedContent.innerHTML = `
            <div class="text-center py-4">
                <i class="fas fa-info-circle text-muted" style="font-size: 2rem;"></i>
                <p class="text-muted mt-2">No attendance records found.</p>
            </div>
        `;
        return;
    }

    // Build HTML string efficiently (faster than DOM manipulation)
    const htmlParts = [];
    
    sortedStatuses.forEach((status, index) => {
        const records = groupedAttendees[status];
        const isExpanded = index === 0; // First group expanded by default
        const collapseId = `grouped-collapse-${status.replace(/\s+/g, '-').toLowerCase()}`;
        
        // Get status color based on attendance value
        const statusColor = getStatusColor(status);
        
        htmlParts.push(`
            <div class="border-bottom">
                <div class="d-flex justify-content-between align-items-center p-3 bg-light border-bottom cursor-pointer" 
                     style="cursor: pointer;"
                     onclick="toggleGroupedSection('${collapseId}')">
                    <h6 class="mb-0">
                        <i class="fas fa-chevron-${isExpanded ? 'down' : 'right'} me-2" id="icon-${collapseId}"></i>
                        <span class="badge badge-${statusColor} me-2">${status}</span>
                        <span class="text-muted">${records.length} attendees</span>
                    </h6>
                </div>
                <div class="collapse ${isExpanded ? 'show' : ''}" id="${collapseId}">
                    <div class="table-responsive">
                        <table class="table table-sm table-hover mb-0">
                            <thead class="thead-light">
                                <tr>
                                    <th>Name</th>
                                    <th>Section</th>
                                    <th>Event</th>
                                    <th>Date</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
        `);

        // Batch process records for better performance
        const batchSize = 50;
        for (let i = 0; i < records.length; i += batchSize) {
            const batch = records.slice(i, i + batchSize);
            batch.forEach(attendee => {
                htmlParts.push(`
                    <tr>
                        <td>
                            <strong>${attendee.firstname || ''} ${attendee.lastname || ''}</strong>
                        </td>
                        <td>
                            ${attendee.sectionname || '-'}
                        </td>
                        <td>
                            ${attendee._eventName || '-'}
                        </td>
                        <td>
                            ${attendee._eventDate || '-'}
                        </td>
                        <td>
                            <span class="badge badge-${statusColor}">${status}</span>
                        </td>
                    </tr>
                `);
            });
        }

        htmlParts.push(`
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `);
    });

    // Single DOM update for better performance
    groupedContent.innerHTML = htmlParts.join('');
}

// Toggle grouped section (separate from main toggle to avoid conflicts)
function toggleGroupedSection(collapseId) {
    const collapseElement = document.getElementById(collapseId);
    const icon = document.getElementById(`icon-${collapseId}`);
    
    if (collapseElement && icon) {
        if (collapseElement.classList.contains('show')) {
            collapseElement.classList.remove('show');
            icon.classList.remove('fa-chevron-down');
            icon.classList.add('fa-chevron-right');
        } else {
            collapseElement.classList.add('show');
            icon.classList.remove('fa-chevron-right');
            icon.classList.add('fa-chevron-down');
        }
    }
}

// Make grouped toggle function globally available
window.toggleGroupedSection = toggleGroupedSection;

// Get badge color based on attendance status
function getStatusColor(status) {
    switch (status?.toLowerCase()) {
        case 'yes':
        case 'attended':
        case 'present':
            return 'success';
        case 'no':
        case 'absent':
        case 'not attended':
            return 'danger';
        case 'maybe':
        case 'unknown':
            return 'warning';
        default:
            return 'secondary';
    }
}

// Render camp groups table - simplified with just name for organization
function renderCampGroupsTable(attendees) {
    const campGroupsContent = document.getElementById('camp-groups-content');
    if (!campGroupsContent) return;

    if (attendees.length === 0) {
        campGroupsContent.innerHTML = `
            <div class="text-center py-4">
                <i class="fas fa-info-circle text-muted" style="font-size: 2rem;"></i>
                <p class="text-muted mt-2">No attendees found for camp groups.</p>
            </div>
        `;
        return;
    }

    // Get unique attendees by name (avoiding duplicates from multiple events)
    const uniqueAttendees = {};
    attendees.forEach(attendee => {
        const nameKey = `${attendee.firstname} ${attendee.lastname}`;
        if (!uniqueAttendees[nameKey]) {
            uniqueAttendees[nameKey] = {
                firstname: attendee.firstname,
                lastname: attendee.lastname,
                sectionname: attendee.sectionname
            };
        }
    });

    const uniqueAttendeesList = Object.values(uniqueAttendees);

    let html = `
        <div class="d-flex justify-content-between align-items-center mb-3 px-3 pt-3">
            <h6 class="mb-0">
                <i class="fas fa-campground me-2"></i>
                Camp Groups Assignment
            </h6>
            <small class="text-muted">
                ${uniqueAttendeesList.length} attendee(s)
            </small>
        </div>
        
        <div class="table-responsive">
            <table class="table table-striped table-sm">
                <thead class="thead-light">
                    <tr>
                        <th>Name</th>
                    </tr>
                </thead>
                <tbody>
    `;

    // Sort attendees alphabetically by last name, then first name
    uniqueAttendeesList.sort((a, b) => {
        const lastNameCompare = a.lastname.localeCompare(b.lastname);
        if (lastNameCompare !== 0) return lastNameCompare;
        return a.firstname.localeCompare(b.firstname);
    });

    uniqueAttendeesList.forEach(attendee => {
        html += `
            <tr>
                <td>
                    <strong>${attendee.firstname} ${attendee.lastname}</strong>
                    <br><small class="text-muted">${attendee.sectionname || '-'}</small>
                </td>
            </tr>
        `;
    });

    html += `
                </tbody>
            </table>
        </div>
        
        <div class="px-3 pb-3">
            <small class="text-muted">
                <i class="fas fa-info-circle me-1"></i>
                Simple list for organizing camp groups.
            </small>
        </div>
    `;

    campGroupsContent.innerHTML = html;
}

// Show blocked screen when OSM API access is blocked
function showBlockedScreen() {
    const mainContainer = document.querySelector('main.container') || document.querySelector('main');
    if (!mainContainer) {
        console.error('Main container not found for blocked screen');
        return;
    }
    
    document.body.classList.add('login-screen');
    updateSidebarToggleVisibility();
    
    mainContainer.style.display = 'block';
    mainContainer.className = 'container';
    mainContainer.innerHTML = `
        <div class="row justify-content-center">
            <div class="col-12 col-sm-10 col-md-8 col-lg-6">
                <div class="card shadow border-danger mb-4">
                    <div class="card-header bg-danger text-white text-center">
                        <h3 class="mb-0">🚨 CRITICAL ERROR</h3>
                    </div>
                    <div class="card-body text-center p-4">
                        <div class="alert alert-danger mb-4">
                            <h4 class="alert-heading">API Access Blocked!</h4>
                            <p class="mb-0">
                                This application has been <strong>blocked by Online Scout Manager</strong> 
                                and can no longer access OSM data.
                            </p>
                        </div>
                        
                        <div class="mb-4">
                            <i class="fas fa-ban text-danger" style="font-size: 4rem;"></i>
                        </div>
                        
                        <h5 class="text-danger mb-3">Application Suspended</h5>
                        <p class="text-muted mb-4">
                            All API functionality has been disabled to prevent further issues. 
                            <strong>Please contact the system administrator immediately.</strong>
                        </p>
                        
                        <div class="bg-light p-3 rounded mb-4">
                            <small class="text-muted">
                                <strong>Blocked at:</strong> ${new Date().toLocaleString()}<br>
                                <strong>Session ID:</strong> ${sessionStorage.getItem('access_token')?.substring(0, 12) || 'N/A'}...
                            </small>
                        </div>
                        
                        <button onclick="alert('Application is blocked. Contact administrator to resolve this issue.')" 
                                class="btn btn-danger btn-lg disabled mb-3">
                            <i class="fas fa-ban me-2"></i>
                            Application Blocked
                        </button>
                        
                        <div class="mt-3">
                            <small class="text-muted">
                                <a href="#" onclick="if(confirm('Clear blocked status? Only do this if administrator has resolved the issue.')) { sessionStorage.removeItem('osm_blocked'); window.location.reload(); }" 
                                   class="text-secondary">
                                    Admin: Clear Blocked Status
                                </a>
                            </small>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Add the missing checkForToken function before your DOMContentLoaded listener:

async function checkForToken() {
    console.log('Checking for token...');
    
    // Check if application has been blocked first
    if (sessionStorage.getItem('osm_blocked') === 'true') {
        console.error('🚨 Application is blocked - showing blocked screen');
        showBlockedScreen();
        return;
    }
    
    // Show loading state instead of login screen initially
    showLoadingState();
    
    try {
        // Check if we have a valid token
        const token = getToken();
        if (token) {
            console.log('Token found, testing validity...');
            // Test the token by making a quick API call
            await getUserRoles();
            console.log('Token is valid, showing main UI');
            document.body.classList.remove('login-screen');
            updateSidebarToggleVisibility();
            showMainUI();
        } else {
            console.log('No token found, showing login');
            document.body.classList.add('login-screen');
            updateSidebarToggleVisibility();
            showLoginScreen();
        }
    } catch (error) {
        console.error('Token validation failed:', error);
        // Clear invalid token and show login
        sessionStorage.removeItem('access_token');
        document.body.classList.add('login-screen');
        updateSidebarToggleVisibility();
        showLoginScreen();
    }
}

function showLoadingState() {
    const mainContainer = document.querySelector('main.container') || document.querySelector('main');
    if (!mainContainer) {
        console.error('Main container not found for loading state');
        return;
    }
    
    // Make container visible and show loading
    mainContainer.style.display = 'block';
    mainContainer.innerHTML = `
        <div class="row justify-content-center">
            <div class="col-12 col-sm-8 col-md-6 col-lg-4">
                <div class="card shadow-sm mb-4">
                    <div class="card-body text-center">
                        <div class="spinner-border text-primary mb-3" role="status">
                            <span class="sr-only">Loading...</span>
                        </div>
                        <p class="text-muted">Loading application...</p>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Rate limit status indicator
function updateRateLimitDisplay() {
    // Check if getRateLimitStatus is available
    if (typeof getRateLimitStatus !== 'function') {
        console.warn('getRateLimitStatus not available yet');
        return;
    }
    
    const status = getRateLimitStatus();
    let indicator = document.getElementById('rate-limit-indicator');
    
    if (!indicator) {
        // Create rate limit indicator
        indicator = document.createElement('div');
        indicator.id = 'rate-limit-indicator';
        indicator.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 4px;
            padding: 8px 12px;
            font-size: 12px;
            z-index: 1000;
            min-width: 200px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        `;
        document.body.appendChild(indicator);
    }
    
    if (status.limit === null) {
        indicator.innerHTML = `
            <div style="color: #6c757d;">
                <i class="fas fa-shield-alt"></i> OSM Rate Limit: Backend Proxy
                <br><small>Rate limit headers not available</small>
            </div>
        `;
        return;
    }
    
    const percentUsed = status.limit > 0 ? ((status.limit - status.remaining) / status.limit * 100) : 0;
    let color = '#28a745'; // Green
    let icon = 'fa-circle';
    
    if (status.blocked) {
        color = '#dc3545'; // Red
        icon = 'fa-exclamation-triangle';
    } else if (percentUsed > 90) {
        color = '#ffc107'; // Yellow
        icon = 'fa-exclamation-triangle';
    } else if (percentUsed > 70) {
        color = '#fd7e14'; // Orange
        icon = 'fa-circle';
    }
    
    let queueInfo = '';
    if (status.queueLength > 0) {
        queueInfo = `<br><small>Queue: ${status.queueLength} pending</small>`;
    }
    
    let retryInfo = '';
    if (status.blocked && status.retryAfter) {
        retryInfo = `<br><small style="color: #dc3545;">Retry in: ${status.retryAfter}s</small>`;
    }
    
    indicator.innerHTML = `
        <div style="color: ${color};">
            <i class="fas ${icon}"></i> OSM Rate Limit: ${status.remaining}/${status.limit}
            <br><small>${percentUsed.toFixed(1)}% used</small>
            ${queueInfo}
            ${retryInfo}
        </div>
    `;
}

// Update rate limit display every 5 seconds (start after app initialization)
let rateLimitInterval = null;

function startRateLimitMonitoring() {
    if (rateLimitInterval) {
        clearInterval(rateLimitInterval);
    }
    rateLimitInterval = setInterval(updateRateLimitDisplay, 5000);
    // Also update immediately
    updateRateLimitDisplay();
}

// Make sure your DOMContentLoaded listener looks like this:

document.addEventListener('DOMContentLoaded', async function initializeApp() {
    try {
        // Hide main container initially to prevent flash
        const mainContainer = document.querySelector('main.container') || document.querySelector('main');
        if (mainContainer) {
            mainContainer.style.display = 'none';
        }
        
        // Set the preferred spinner type
        setDefaultSpinner(PREFERRED_SPINNER);
        
        // Check for elements that should exist
        if (!mainContainer) {
            console.error('Main container not found');
            return;
        }
        
        // Don't set up login button immediately - let checkForToken decide what to show
        // Check for token and show appropriate UI
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

