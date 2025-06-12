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
                </div>
            </div>
        </div>
    `;

    attendancePanel.innerHTML = tabsHtml;

    // Render both tab contents
    renderSummaryAttendanceTable(attendees);
    renderGroupedAttendanceTable(attendees);
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
                        <th style="width: 70px;" class="text-center">Status</th>
                        <th>Name</th>
                        <th style="width: 40px;" class="text-center">▼</th>
                    </tr>
                </thead>
                <tbody id="summary-attendance-tbody">`;
    } else {
        // Desktop layout
        html += `
                <thead>
                    <tr>
                        <th style="width: 80px;" class="text-center">Attending</th>
                        <th>First Name</th>
                        <th>Last Name</th>
                        <th style="width: 40px;" class="text-center">▼</th>
                    </tr>
                </thead>
                <tbody id="summary-attendance-tbody">`;
    }

    // Generate person rows
    Object.entries(attendeesByPerson).forEach(([personKey, person], personIdx) => {
        if (isMobile) {
            html += `
                <tr class="summary-person-row" data-person-idx="${personIdx}" style="cursor: pointer;">
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
                <tr class="summary-person-row" data-person-idx="${personIdx}" style="cursor: pointer;">
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

    // Add expand functionality
    addSummaryPersonExpandFunctionality();
    
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

// Render attendance records grouped by status
function renderGroupedAttendeesTable(attendees) {
    const attendancePanel = document.getElementById('attendance-panel');
    if (!attendancePanel) return;

    // Group attendees by status (assuming there's a status field)
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

    let tableHtml = `
        <div class="card shadow-sm h-100">
            <div class="card-header bg-info text-white">
                <h5 class="mb-0">
                    <i class="fas fa-users"></i> 
                    Attendance Records
                    <span class="badge badge-light text-dark ms-2">${attendees.length} total</span>
                </h5>
            </div>
            <div class="card-body p-0">
    `;

    if (sortedStatuses.length === 0) {
        tableHtml += `
            <div class="text-center py-4">
                <i class="fas fa-info-circle text-muted" style="font-size: 2rem;"></i>
                <p class="text-muted mt-2">No attendance records found.</p>
            </div>
        `;
    } else {
        sortedStatuses.forEach((status, index) => {
            const records = groupedAttendees[status];
            const isExpanded = index === 0; // First group expanded by default
            const collapseId = `collapse-${status.replace(/\s+/g, '-').toLowerCase()}`;
            
            // Get status color based on attendance value
            const statusColor = getStatusColor(status);
            
            tableHtml += `
                <div class="border-bottom">
                    <div class="d-flex justify-content-between align-items-center p-3 bg-light border-bottom cursor-pointer" 
                         style="cursor: pointer;"
                         onclick="toggleGroup('${collapseId}')">
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
            `;

            records.forEach(attendee => {
                tableHtml += `
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
                `;
            });

            tableHtml += `
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            `;
        });
    }

    tableHtml += `
            </div>
        </div>
    `;

    attendancePanel.innerHTML = tableHtml;
}

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

// Toggle group expand/collapse
function toggleGroup(collapseId) {
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

// Make toggle function globally available
window.toggleGroup = toggleGroup;

// Render flexi records grouped by status
function renderFlexiRecordsTable(flexiRecords, sectionName) {
    const attendancePanel = document.getElementById('attendance-panel');
    if (!attendancePanel) return;

    // Group records by status
    const groupedRecords = {};
    flexiRecords.forEach(record => {
        const status = record.status || 'Unknown';
        if (!groupedRecords[status]) {
            groupedRecords[status] = [];
        }
        groupedRecords[status].push(record);
    });

    // Sort statuses for consistent display
    const sortedStatuses = Object.keys(groupedRecords).sort();

    let tableHtml = `
        <div class="card shadow-sm h-100">
            <div class="card-header bg-success text-white">
                <h5 class="mb-0">
                    <i class="fas fa-list-alt"></i> 
                    Flexi Records - ${sectionName}
                    <span class="badge badge-light text-dark ms-2">${flexiRecords.length} total</span>
                </h5>
            </div>
            <div class="card-body p-0">
    `;

    if (sortedStatuses.length === 0) {
        tableHtml += `
            <div class="text-center py-4">
                <i class="fas fa-info-circle text-muted" style="font-size: 2rem;"></i>
                <p class="text-muted mt-2">No flexi records found for this section.</p>
            </div>
        `;
    } else {
        sortedStatuses.forEach((status, index) => {
            const records = groupedRecords[status];
            const isExpanded = index === 0; // First group expanded by default
            const collapseId = `collapse-${status.replace(/\s+/g, '-').toLowerCase()}`;
            
            tableHtml += `
                <div class="border-bottom">
                    <div class="d-flex justify-content-between align-items-center p-3 bg-light border-bottom cursor-pointer" 
                         data-bs-toggle="collapse" 
                         data-target="#${collapseId}" 
                         aria-expanded="${isExpanded}" 
                         aria-controls="${collapseId}"
                         onclick="toggleGroup('${collapseId}')">
                        <h6 class="mb-0">
                            <i class="fas fa-chevron-${isExpanded ? 'down' : 'right'} me-2" id="icon-${collapseId}"></i>
                            <strong>${status}</strong>
                            <span class="badge badge-primary ms-2">${records.length}</span>
                        </h6>
                    </div>
                    <div class="collapse ${isExpanded ? 'show' : ''}" id="${collapseId}">
                        <div class="table-responsive">
                            <table class="table table-sm table-hover mb-0">
                                <thead class="thead-light">
                                    <tr>
                                        <th>Name</th>
                                        <th>Date Completed</th>
                                        <th>Completed By</th>
                                        <th>Details</th>
                                    </tr>
                                </thead>
                                <tbody>
            `;

            records.forEach(record => {
                tableHtml += `
                    <tr>
                        <td>
                            <strong>${record.firstname || ''} ${record.lastname || ''}</strong>
                            ${record.section ? `<br><small class="text-muted">${record.section}</small>` : ''}
                        </td>
                        <td>
                            ${record.completed_date ? new Date(record.completed_date).toLocaleDateString() : '-'}
                        </td>
                        <td>
                            ${record.completed_by || '-'}
                        </td>
                        <td>
                            ${record.details || '-'}
                            ${record.comments ? `<br><small class="text-muted">${record.comments}</small>` : ''}
                        </td>
                    </tr>
                `;
            });

            tableHtml += `
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            `;
        });
    }

    tableHtml += `
            </div>
        </div>
    `;

    attendancePanel.innerHTML = tableHtml;
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1haW4uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEiLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vID09PT09IExPQURJTkcgQU5JTUFUSU9OIENPTkZJR1VSQVRJT04gPT09PT0KLy8gQ2hvb3NlIHlvdXIgcHJlZmVycmVkIGxvYWRpbmcgYW5pbWF0aW9uOgovLyAnZG90cycgPSBQdWxzaW5nIGRvdHMgKG1pbmltYWwsIGNsZWFuKQovLyAncmluZycgPSBTcGlubmluZyByaW5nIChjbGFzc2ljLCBzbW9vdGgpCi8vICdncmFkaWVudCcgPSBDb2xvcmZ1bCBncmFkaWVudCBzcGlubmVyIChtb2Rlcm4sIHZpYnJhbnQpCmNvbnN0IFBSRUZFUlJFRF9TUElOTkVSID0gJ3JpbmcnOyAvLyBDaGFuZ2UgdGhpcyB0byB5b3VyIHByZWZlcmVuY2UKCi8vIEluaXRpYWxpemUgZXJyb3IgbW9uaXRvcmluZyAoY29uZGl0aW9uYWxseSBmb3IgcHJvZHVjdGlvbikKdHJ5IHsKICAgIC8vIE9ubHkgbG9hZCBTZW50cnkgaW4gcHJvZHVjdGlvbiBvciB3aGVuIGV4cGxpY2l0bHkgZW5hYmxlZAogICAgaWYgKHdpbmRvdy5sb2NhdGlvbi5ob3N0bmFtZSAhPT0gJ2xvY2FsaG9zdCcgJiYgd2luZG93LmxvY2F0aW9uLmhvc3RuYW1lICE9PSAnMTI3LjAuMC4xJykgewogICAgICAgIGltcG9ydCgnLi9zZW50cnkuanMnKS5jYXRjaChlcnJvciA9PiB7CiAgICAgICAgICAgIGNvbnNvbGUud2FybignU2VudHJ5IGluaXRpYWxpemF0aW9uIGZhaWxlZDonLCBlcnJvcik7CiAgICAgICAgfSk7CiAgICB9Cn0gY2F0Y2ggKGVycm9yKSB7CiAgICBjb25zb2xlLndhcm4oJ0Vycm9yIG1vbml0b3Jpbmcgbm90IGF2YWlsYWJsZTonLCBlcnJvcik7Cn0KCi8vIEltcG9ydCBmdW5jdGlvbnMKaW1wb3J0IHsKICAgIGdldFVzZXJSb2xlcywKICAgIGdldE1vc3RSZWNlbnRUZXJtSWQsCiAgICBnZXRFdmVudHMsCiAgICBnZXRFdmVudEF0dGVuZGFuY2UsCiAgICBnZXRGbGV4aVJlY29yZHMsCiAgICBnZXRUb2tlbiwKICAgIGNsZWFyVG9rZW4KfSBmcm9tICcuL2FwaS5qcyc7CmltcG9ydCB7CiAgICBzaG93U3Bpbm5lciwKICAgIGhpZGVTcGlubmVyLAogICAgc2hvd0Vycm9yLAogICAgcmVuZGVyU2VjdGlvbnNUYWJsZSwKICAgIHJlbmRlckV2ZW50c1RhYmxlLAogICAgcmVuZGVyQXR0ZW5kZWVzVGFibGUsCiAgICBzZXRCdXR0b25Mb2FkaW5nLAogICAgc2V0RGVmYXVsdFNwaW5uZXIKfSBmcm9tICcuL3VpLmpzJzsKCmNvbnN0IGNsaWVudElkID0gJzk4WVdSV3JPUXlVVkFsSnVQSHM4QWRzYlZnMm1VQ1FPJzsKY29uc3Qgc2NvcGUgPSAnc2VjdGlvbjptZW1iZXI6cmVhZCBzZWN0aW9uOnByb2dyYW1tZTpyZWFkIHNlY3Rpb246ZXZlbnQ6cmVhZCc7CmNvbnN0IHJlZGlyZWN0VXJpID0gd2luZG93LmxvY2F0aW9uLm9yaWdpbiArICcvY2FsbGJhY2suaHRtbCc7CgpsZXQgY3VycmVudFNlY3Rpb25zID0gW107CgovLyBBZGQgdGhpcyBmdW5jdGlvbiB0byBjaGVjayBmb3IgcmVxdWlyZWQgZWxlbWVudHMgYmVmb3JlIGluaXRpYWxpemF0aW9uOgpmdW5jdGlvbiB3YWl0Rm9yRE9NKCkgewogICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7CiAgICAgICAgaWYgKGRvY3VtZW50LnJlYWR5U3RhdGUgPT09ICdsb2FkaW5nJykgewogICAgICAgICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdET01Db250ZW50TG9hZGVkJywgcmVzb2x2ZSk7CiAgICAgICAgfSBlbHNlIHsKICAgICAgICAgICAgcmVzb2x2ZSgpOwogICAgICAgIH0KICAgIH0pOwp9CgovLyBVcGRhdGUgc2hvd0xvZ2luU2NyZWVuIHRvIHdvcmsgd2l0aCB5b3VyIEhUTUwgc3RydWN0dXJlOgoKZnVuY3Rpb24gc2hvd0xvZ2luU2NyZWVuKCkgewogICAgY29uc29sZS5sb2coJ1Nob3dpbmcgbG9naW4gc2NyZWVuJyk7CiAgICAKICAgIC8vIENoZWNrIGlmIHdlIGFscmVhZHkgaGF2ZSB0aGUgbG9naW4gVUkgc2hvd2luZwogICAgY29uc3QgZXhpc3RpbmdMb2dpbkJ0biA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdvc20tbG9naW4tYnRuJyk7CiAgICBpZiAoZXhpc3RpbmdMb2dpbkJ0bikgewogICAgICAgIC8vIExvZ2luIFVJIGlzIGFscmVhZHkgc2hvd2luZywganVzdCBlbnN1cmUgaXQgaGFzIHRoZSBjbGljayBoYW5kbGVyCiAgICAgICAgY29uc3QgbWFpbkNvbnRhaW5lciA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ21haW4uY29udGFpbmVyJykgfHwgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignbWFpbicpOwogICAgICAgIGlmIChtYWluQ29udGFpbmVyKSB7CiAgICAgICAgICAgIG1haW5Db250YWluZXIuc3R5bGUuZGlzcGxheSA9ICdibG9jayc7CiAgICAgICAgfQogICAgICAgIGV4aXN0aW5nTG9naW5CdG4ub25jbGljayA9ICgpID0+IHsKICAgICAgICAgICAgY29uc29sZS5sb2coJ0xvZ2luIGJ1dHRvbiBjbGlja2VkLCByZWRpcmVjdGluZyB0byBPU00uLi4nKTsKICAgICAgICAgICAgY29uc3QgYXV0aFVybCA9IGBodHRwczovL3d3dy5vbmxpbmVzY291dG1hbmFnZXIuY28udWsvb2F1dGgvYXV0aG9yaXplP2AgKwogICAgICAgICAgICAgICAgYGNsaWVudF9pZD0ke2NsaWVudElkfSZgICsKICAgICAgICAgICAgICAgIGByZWRpcmVjdF91cmk9JHtlbmNvZGVVUklDb21wb25lbnQocmVkaXJlY3RVcmkpfSZgICsKICAgICAgICAgICAgICAgIGBzY29wZT0ke2VuY29kZVVSSUNvbXBvbmVudChzY29wZSl9JmAgKwogICAgICAgICAgICAgICAgYHJlc3BvbnNlX3R5cGU9Y29kZWA7CiAgICAgICAgICAgIAogICAgICAgICAgICBjb25zb2xlLmxvZygnQXV0aCBVUkw6JywgYXV0aFVybCk7CiAgICAgICAgICAgIHdpbmRvdy5sb2NhdGlvbi5ocmVmID0gYXV0aFVybDsKICAgICAgICB9OwogICAgICAgIHJldHVybjsKICAgIH0KCiAgICAvLyBJZiBubyBleGlzdGluZyBsb2dpbiBidXR0b24sIHJlc3RvcmUgdGhlIG9yaWdpbmFsIGxvZ2luIHN0cnVjdHVyZQogICAgY29uc3QgbWFpbkNvbnRhaW5lciA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ21haW4uY29udGFpbmVyJykgfHwgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignbWFpbicpOwogICAgaWYgKCFtYWluQ29udGFpbmVyKSB7CiAgICAgICAgY29uc29sZS5lcnJvcignTWFpbiBjb250YWluZXIgbm90IGZvdW5kIGZvciBsb2dpbiBzY3JlZW4nKTsKICAgICAgICByZXR1cm47CiAgICB9CiAgICAKICAgIG1haW5Db250YWluZXIuc3R5bGUuZGlzcGxheSA9ICdibG9jayc7CiAgICBtYWluQ29udGFpbmVyLmNsYXNzTmFtZSA9ICdjb250YWluZXInOwogICAgbWFpbkNvbnRhaW5lci5pbm5lckhUTUwgPSBgCiAgICAgICAgPGRpdiBjbGFzcz1cInJvdyBqdXN0aWZ5LWNvbnRlbnQtY2VudGVyXCI+CiAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjb2wtMTIgY29sLXNtLTggY29sLW1kLTYgY29sLWxnLTRcIj4KICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjYXJkIHNoYWRvdy1zbSBtYi00XCI+CiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNhcmQtYm9keSB0ZXh0LWNlbnRlclwiPgogICAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uIGlkPVwib3NtLWxvZ2luLWJ0blwiCiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzcz1cImJ0biBidG4tcHJpbWFyeSBidG4tbGcgbWItM1wiCiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdHlsZT1cImZvbnQtc2l6ZToxLjVlbTsgd2hpdGUtc3BhY2U6IG5vcm1hbDsgbGluZS1oZWlnaHQ6IDEuMjtcIj4KICAgICAgICAgICAgICAgICAgICAgICAgICAgIExvZ2luIHdpdGg8YnI+T25saW5lIFNjb3V0IE1hbmFnZXIgKE9TTSkKICAgICAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+CiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgaWQ9XCJhcHAtY29udGVudFwiPjwvZGl2PgogICAgICAgICAgICAgICAgICAgIDwvZGl2PgogICAgICAgICAgICAgICAgPC9kaXY+CiAgICAgICAgICAgIDwvZGl2PgogICAgICAgIDwvZGl2PgogICAgYDsKCiAgICBjb25zdCBsb2dpbkJ0biA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdvc20tbG9naW4tYnRuJyk7CiAgICBpZiAobG9naW5CdG4pIHsKICAgICAgICBsb2dpbkJ0bi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHsKICAgICAgICAgICAgY29uc29sZS5sb2coJ0xvZ2luIGJ1dHRvbiBjbGlja2VkLCByZWRpcmVjdGluZyB0byBPU00uLi4nKTsKICAgICAgICAgICAgY29uc3QgYXV0aFVybCA9IGBodHRwczovL3d3dy5vbmxpbmVzY291dG1hbmFnZXIuY28udWsvb2F1dGgvYXV0aG9yaXplP2AgKwogICAgICAgICAgICAgICAgYGNsaWVudF9pZD0ke2NsaWVudElkfSZgICsKICAgICAgICAgICAgICAgIGByZWRpcmVjdF91cmk9JHtlbmNvZGVVUklDb21wb25lbnQocmVkaXJlY3RVcmkpfSZgICsKICAgICAgICAgICAgICAgIGBzY29wZT0ke2VuY29kZVVSSUNvbXBvbmVudChzY29wZSl9JmAgKwogICAgICAgICAgICAgICAgYHJlc3BvbnNlX3R5cGU9Y29kZWA7CiAgICAgICAgICAgIAogICAgICAgICAgICBjb25zb2xlLmxvZygnQXV0aCBVUkw6JywgYXV0aFVybCk7CiAgICAgICAgICAgIHdpbmRvdy5sb2NhdGlvbi5ocmVmID0gYXV0aFVybDsKICAgICAgICB9KTsKICAgIH0KfQoKLy8gVXBkYXRlIHRoZSBtb2JpbGUgYnV0dG9uIGluIHNob3dNYWluVUkgdG8gdXNlIGNoZXZyb24gaW5zdGVhZCBvZiBiYXJzOgoKZnVuY3Rpb24gc2hvd01haW5VSSgpIHsKICAgIC8vIEdldCB0aGUgbWFpbiBjb250YWluZXIgYW5kIHJlcGxhY2UgYWxsIGNvbnRlbnQgd2l0aCBhdHRlbmRhbmNlIHBhbmVsCiAgICBjb25zdCBtYWluQ29udGFpbmVyID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignbWFpbicpOwogICAgaWYgKCFtYWluQ29udGFpbmVyKSB7CiAgICAgICAgY29uc29sZS5lcnJvcignTWFpbiBjb250YWluZXIgbm90IGZvdW5kJyk7CiAgICAgICAgcmV0dXJuOwogICAgfQoKICAgIC8vIFJlcGxhY2UgZW50aXJlIG1haW4gY29udGVudCB3aXRoIGF0dGVuZGFuY2UgZGV0YWlscyBwYW5lbAogICAgbWFpbkNvbnRhaW5lci5pbm5lckhUTUwgPSBgCiAgICAgICAgPGRpdiBjbGFzcz1cImNvbnRhaW5lci1mbHVpZCBwLTBcIj4KICAgICAgICAgICAgPGRpdiBjbGFzcz1cInJvdyBuby1ndXR0ZXJzXCI+CiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY29sLTEyXCI+CiAgICAgICAgICAgICAgICAgICAgPGRpdiBpZD1cImFwcC1jb250ZW50XCI+CiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgaWQ9XCJhdHRlbmRhbmNlLXBhbmVsXCIgY2xhc3M9XCJtdC00XCI+CiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY2FyZCBzaGFkb3ctc20gaC0xMDBcIj4KICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY2FyZC1oZWFkZXIgYmctaW5mbyB0ZXh0LXdoaXRlXCI+CiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxoNSBjbGFzcz1cIm1iLTBcIj5BdHRlbmRhbmNlIERldGFpbHM8L2g1PgogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PgogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjYXJkLWJvZHlcIj4KICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHAgY2xhc3M9XCJ0ZXh0LW11dGVkIHRleHQtY2VudGVyXCI+CiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBVc2UgdGhlIHNpZGViYXIgdG8gbG9hZCBzZWN0aW9ucyBhbmQgZXZlbnRzLCB0aGVuIHZpZXcgYXR0ZW5kYW5jZSBkZXRhaWxzIGhlcmUuCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvcD4KICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj4KICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PgogICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj4KICAgICAgICAgICAgICAgICAgICA8L2Rpdj4KICAgICAgICAgICAgICAgIDwvZGl2PgogICAgICAgICAgICA8L2Rpdj4KICAgICAgICA8L2Rpdj4KICAgIGA7CgogICAgLy8gSW5pdGlhbGl6ZSBzaWRlYmFyIGFmdGVyIGNvbnRlbnQgaXMgbG9hZGVkCiAgICBpbml0aWFsaXplU2lkZWJhcigpOwogICAgCiAgICAvLyBFbnN1cmUgc2lkZWJhciBoYXMgcHJvcGVyIGNvbnRlbnQKICAgIGNvbnN0IHNpZGViYXJDb250ZW50ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLnNpZGViYXItY29udGVudCcpOwogICAgaWYgKCFzaWRlYmFyQ29udGVudCkgewogICAgICAgIGNvbnNvbGUud2FybignU2lkZWJhciBjb250ZW50IG5vdCBmb3VuZCwgcmVjcmVhdGluZy4uLicpOwogICAgICAgIGNvbnN0IHNpZGViYXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnc2lkZWJhcicpOwogICAgICAgIGlmIChzaWRlYmFyKSB7CiAgICAgICAgICAgIHNpZGViYXIuaW5uZXJIVE1MID0gYAogICAgICAgICAgICAgICAgPCEtLSBTaWRlYmFyIEhlYWRlciAtLT4KICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJzaWRlYmFyLWhlYWRlclwiPgogICAgICAgICAgICAgICAgICAgIDxoMz5TZWN0aW9ucyAmIEV2ZW50czwvaDM+CiAgICAgICAgICAgICAgICA8L2Rpdj4KICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgPCEtLSBTaWRlYmFyIENvbnRlbnQgLS0+CiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwic2lkZWJhci1jb250ZW50XCI+CiAgICAgICAgICAgICAgICAgICAgPGRpdiBpZD1cInNlY3Rpb25zLXRhYmxlLWNvbnRhaW5lclwiPjwvZGl2PgogICAgICAgICAgICAgICAgICAgIDxkaXYgaWQ9XCJldmVudHMtdGFibGUtY29udGFpbmVyXCIgY2xhc3M9XCJtdC0zXCI+PC9kaXY+CiAgICAgICAgICAgICAgICA8L2Rpdj4KICAgICAgICAgICAgYDsKICAgICAgICB9CiAgICB9CiAgICAKICAgIC8vIEF1dG8tbG9hZCBzZWN0aW9ucyB3aGVuIG1haW4gVUkgaXMgc2hvd24KICAgIGxvYWRTZWN0aW9uc0Zyb21DYWNoZU9yQVBJKCk7CgogICAgLy8gQWRkIGxvZ291dCBidXR0b24gdG8gc2lkZWJhcgogICAgYWRkTG9nb3V0QnV0dG9uKCk7CgogICAgY29uc29sZS5sb2coJ01haW4gVUkgaW5pdGlhbGl6ZWQgLSByZWFkeSBmb3Igc2lkZWJhciBpbnRlcmFjdGlvbicpOwp9CgovLyBNYWtlIGZ1bmN0aW9ucyBnbG9iYWxseSBhdmFpbGFibGUgZm9yIG9uY2xpY2sgaGFuZGxlcnMKd2luZG93LmNsZWFyU2VjdGlvbnNDYWNoZSA9IGNsZWFyU2VjdGlvbnNDYWNoZTsKd2luZG93LmxvYWRTZWN0aW9uc0Zyb21DYWNoZU9yQVBJID0gbG9hZFNlY3Rpb25zRnJvbUNhY2hlT3JBUEk7CgovLyA9PT0gU0lERUJBUiBGVU5DVElPTkFMSVRZID09PQoKZnVuY3Rpb24gaW5pdGlhbGl6ZVNpZGViYXIoKSB7CiAgICBjb25zdCBzaWRlYmFyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3NpZGViYXInKTsKICAgIGNvbnN0IHRvZ2dsZUJ0biA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdzaWRlYmFyVG9nZ2xlJyk7CiAgICBjb25zdCBvdmVybGF5ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3NpZGViYXJPdmVybGF5Jyk7CiAgICAKICAgIGlmICghc2lkZWJhciB8fCAhdG9nZ2xlQnRuKSB7CiAgICAgICAgY29uc29sZS53YXJuKCdTaWRlYmFyIGVsZW1lbnRzIG5vdCBmb3VuZCcpOwogICAgICAgIHJldHVybjsKICAgIH0KCiAgICAvLyBUb2dnbGUgc2lkZWJhciAob3Blbi9jbG9zZSkKICAgIHRvZ2dsZUJ0bi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHsKICAgICAgICBpZiAoc2lkZWJhci5jbGFzc0xpc3QuY29udGFpbnMoJ29wZW4nKSkgewogICAgICAgICAgICAvLyBTaWRlYmFyIGlzIG9wZW4sIHNvIGNsb3NlIGl0CiAgICAgICAgICAgIGNsb3NlU2lkZWJhcigpOwogICAgICAgIH0gZWxzZSB7CiAgICAgICAgICAgIC8vIFNpZGViYXIgaXMgY2xvc2VkLCBzbyBvcGVuIGl0CiAgICAgICAgICAgIHNpZGViYXIuY2xhc3NMaXN0LmFkZCgnb3BlbicpOwogICAgICAgICAgICBkb2N1bWVudC5ib2R5LmNsYXNzTGlzdC5hZGQoJ3NpZGViYXItb3BlbicpOwogICAgICAgICAgICBpZiAob3ZlcmxheSkgb3ZlcmxheS5jbGFzc0xpc3QuYWRkKCdzaG93Jyk7CiAgICAgICAgICAgIAogICAgICAgICAgICAvLyBNb3ZlIHRvZ2dsZSBidXR0b24gdG8gdGhlIHJpZ2h0IHdoZW4gc2lkZWJhciBpcyBvcGVuCiAgICAgICAgICAgIHRvZ2dsZUJ0bi5zdHlsZS5sZWZ0ID0gJzM0MHB4JzsKICAgICAgICB9CiAgICB9KTsKCiAgICAvLyBDbG9zZSBzaWRlYmFyIGZ1bmN0aW9uCiAgICBmdW5jdGlvbiBjbG9zZVNpZGViYXIoKSB7CiAgICAgICAgc2lkZWJhci5jbGFzc0xpc3QucmVtb3ZlKCdvcGVuJyk7CiAgICAgICAgZG9jdW1lbnQuYm9keS5jbGFzc0xpc3QucmVtb3ZlKCdzaWRlYmFyLW9wZW4nKTsKICAgICAgICBpZiAob3ZlcmxheSkgb3ZlcmxheS5jbGFzc0xpc3QucmVtb3ZlKCdzaG93Jyk7CiAgICAgICAgCiAgICAgICAgLy8gTW92ZSB0b2dnbGUgYnV0dG9uIGJhY2sgdG8gb3JpZ2luYWwgcG9zaXRpb24KICAgICAgICB0b2dnbGVCdG4uc3R5bGUubGVmdCA9ICcxcmVtJzsKICAgIH0KICAgIAogICAgLy8gQ2xvc2Ugc2lkZWJhciB3aGVuIGNsaWNraW5nIG92ZXJsYXkKICAgIGlmIChvdmVybGF5KSB7CiAgICAgICAgb3ZlcmxheS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGNsb3NlU2lkZWJhcik7CiAgICB9CgogICAgLy8gQ2xvc2Ugc2lkZWJhciB3aGVuIGNsaWNraW5nIG91dHNpZGUgb2YgaXQKICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKGUpID0+IHsKICAgICAgICBpZiAoCiAgICAgICAgICAgIHNpZGViYXIuY2xhc3NMaXN0LmNvbnRhaW5zKCdvcGVuJykgJiYKICAgICAgICAgICAgIXNpZGViYXIuY29udGFpbnMoZS50YXJnZXQpICYmCiAgICAgICAgICAgIGUudGFyZ2V0ICE9PSB0b2dnbGVCdG4gJiYKICAgICAgICAgICAgIXRvZ2dsZUJ0bi5jb250YWlucyhlLnRhcmdldCkKICAgICAgICApIHsKICAgICAgICAgICAgY2xvc2VTaWRlYmFyKCk7CiAgICAgICAgfQogICAgfSk7CgogICAgLy8gQ2xvc2Ugc2lkZWJhciBvbiBlc2NhcGUga2V5CiAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgKGUpID0+IHsKICAgICAgICBpZiAoZS5rZXkgPT09ICdFc2NhcGUnICYmIHNpZGViYXIuY2xhc3NMaXN0LmNvbnRhaW5zKCdvcGVuJykpIHsKICAgICAgICAgICAgY2xvc2VTaWRlYmFyKCk7CiAgICAgICAgfQogICAgfSk7Cn0KCi8vIEhpZGUgc2lkZWJhciB0b2dnbGUgb24gbG9naW4gc2NyZWVuLCBzaG93IG9uIG1haW4gYXBwCmZ1bmN0aW9uIHVwZGF0ZVNpZGViYXJUb2dnbGVWaXNpYmlsaXR5KCkgewogICAgY29uc3Qgc2lkZWJhclRvZ2dsZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdzaWRlYmFyVG9nZ2xlJyk7CiAgICBpZiAoc2lkZWJhclRvZ2dsZSkgewogICAgICAgIGNvbnN0IGlzTG9naW5TY3JlZW4gPSBkb2N1bWVudC5ib2R5LmNsYXNzTGlzdC5jb250YWlucygnbG9naW4tc2NyZWVuJyk7CiAgICAgICAgc2lkZWJhclRvZ2dsZS5zdHlsZS5kaXNwbGF5ID0gaXNMb2dpblNjcmVlbiA/ICdub25lJyA6ICdibG9jayc7CiAgICB9Cn0KCi8vIEFkZCBsb2dvdXQgZnVuY3Rpb25hbGl0eQpmdW5jdGlvbiBhZGRMb2dvdXRCdXR0b24oKSB7CiAgICBjb25zdCBzaWRlYmFyID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLnNpZGViYXItY29udGVudCcpOwogICAgaWYgKHNpZGViYXIgJiYgIWRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdsb2dvdXQtYnRuJykpIHsKICAgICAgICBjb25zdCBsb2dvdXRCdG4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdidXR0b24nKTsKICAgICAgICBsb2dvdXRCdG4uaWQgPSAnbG9nb3V0LWJ0bic7CiAgICAgICAgbG9nb3V0QnRuLmNsYXNzTmFtZSA9ICdidG4gYnRuLW91dGxpbmUtZGFuZ2VyIGJ0bi1zbSB3LTEwMCBtdC0zJzsKICAgICAgICBsb2dvdXRCdG4uaW5uZXJIVE1MID0gJzxpIGNsYXNzPVwiZmFzIGZhLXNpZ24tb3V0LWFsdFwiPjwvaT4gTG9nb3V0JzsKICAgICAgICBsb2dvdXRCdG4ub25jbGljayA9ICgpID0+IHsKICAgICAgICAgICAgaWYgKGNvbmZpcm0oJ0FyZSB5b3Ugc3VyZSB5b3Ugd2FudCB0byBsb2dvdXQ/JykpIHsKICAgICAgICAgICAgICAgIGNsZWFyVG9rZW4oKTsKICAgICAgICAgICAgICAgIHdpbmRvdy5sb2NhdGlvbi5yZWxvYWQoKTsKICAgICAgICAgICAgfQogICAgICAgIH07CiAgICAgICAgc2lkZWJhci5hcHBlbmRDaGlsZChsb2dvdXRCdG4pOwogICAgfQp9CgovLyA9PT0gU0VDVElPTiBDQUNISU5HIEZVTkNUSU9OQUxJVFkgPT09Cgpjb25zdCBTRUNUSU9OU19DQUNIRV9LRVkgPSAndmlraW5nX3NlY3Rpb25zX2NhY2hlJzsKY29uc3QgU0VDVElPTlNfQ0FDSEVfRVhQSVJZID0gMjQgKiA2MCAqIDYwICogMTAwMDsgLy8gMjQgaG91cnMgaW4gbWlsbGlzZWNvbmRzCgpmdW5jdGlvbiBzYXZlU2VjdGlvbnNUb0NhY2hlKHNlY3Rpb25zKSB7CiAgICB0cnkgewogICAgICAgIGNvbnN0IGNhY2hlRGF0YSA9IHsKICAgICAgICAgICAgc2VjdGlvbnM6IHNlY3Rpb25zLAogICAgICAgICAgICB0aW1lc3RhbXA6IERhdGUubm93KCksCiAgICAgICAgICAgIHZlcnNpb246ICcxLjAnIC8vIEZvciBmdXR1cmUgY2FjaGUgaW52YWxpZGF0aW9uIGlmIG5lZWRlZAogICAgICAgIH07CiAgICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oU0VDVElPTlNfQ0FDSEVfS0VZLCBKU09OLnN0cmluZ2lmeShjYWNoZURhdGEpKTsKICAgICAgICBjb25zb2xlLmxvZyhgQ2FjaGVkICR7c2VjdGlvbnMubGVuZ3RofSBzZWN0aW9ucyB0byBsb2NhbFN0b3JhZ2VgKTsKICAgIH0gY2F0Y2ggKGVycm9yKSB7CiAgICAgICAgY29uc29sZS53YXJuKCdGYWlsZWQgdG8gY2FjaGUgc2VjdGlvbnM6JywgZXJyb3IpOwogICAgfQp9CgpmdW5jdGlvbiBnZXRTZWN0aW9uc0Zyb21DYWNoZSgpIHsKICAgIHRyeSB7CiAgICAgICAgY29uc3QgY2FjaGVkID0gbG9jYWxTdG9yYWdlLmdldEl0ZW0oU0VDVElPTlNfQ0FDSEVfS0VZKTsKICAgICAgICBpZiAoIWNhY2hlZCkgcmV0dXJuIG51bGw7CiAgICAgICAgCiAgICAgICAgY29uc3QgY2FjaGVEYXRhID0gSlNPTi5wYXJzZShjYWNoZWQpOwogICAgICAgIGNvbnN0IG5vdyA9IERhdGUubm93KCk7CiAgICAgICAgCiAgICAgICAgLy8gQ2hlY2sgaWYgY2FjaGUgaXMgZXhwaXJlZAogICAgICAgIGlmIChub3cgLSBjYWNoZURhdGEudGltZXN0YW1wID4gU0VDVElPTlNfQ0FDSEVfRVhQSVJZKSB7CiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdTZWN0aW9ucyBjYWNoZSBleHBpcmVkLCByZW1vdmluZy4uLicpOwogICAgICAgICAgICBsb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbShTRUNUSU9OU19DQUNIRV9LRVkpOwogICAgICAgICAgICByZXR1cm4gbnVsbDsKICAgICAgICB9CiAgICAgICAgCiAgICAgICAgY29uc29sZS5sb2coYExvYWRlZCAke2NhY2hlRGF0YS5zZWN0aW9ucy5sZW5ndGh9IHNlY3Rpb25zIGZyb20gY2FjaGVgKTsKICAgICAgICByZXR1cm4gY2FjaGVEYXRhLnNlY3Rpb25zOwogICAgfSBjYXRjaCAoZXJyb3IpIHsKICAgICAgICBjb25zb2xlLndhcm4oJ0ZhaWxlZCB0byBsb2FkIHNlY3Rpb25zIGZyb20gY2FjaGU6JywgZXJyb3IpOwogICAgICAgIGxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKFNFQ1RJT05TX0NBQ0hFX0tFWSk7CiAgICAgICAgcmV0dXJuIG51bGw7CiAgICB9Cn0KCmZ1bmN0aW9uIGNsZWFyU2VjdGlvbnNDYWNoZSgpIHsKICAgIGxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKFNFQ1RJT05TX0NBQ0hFX0tFWSk7CiAgICBjb25zb2xlLmxvZygnU2VjdGlvbnMgY2FjaGUgY2xlYXJlZCcpOwp9Cgphc3luYyBmdW5jdGlvbiBsb2FkU2VjdGlvbnNGcm9tQ2FjaGVPckFQSSgpIHsKICAgIC8vIFNob3cgbG9hZGluZyBzdGF0ZQogICAgY29uc3Qgc2VjdGlvbnNDb250YWluZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnc2VjdGlvbnMtdGFibGUtY29udGFpbmVyJyk7CiAgICBpZiAoc2VjdGlvbnNDb250YWluZXIpIHsKICAgICAgICBzZWN0aW9uc0NvbnRhaW5lci5pbm5lckhUTUwgPSBgCiAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJ0ZXh0LWNlbnRlciBweS0zXCI+CiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwic3Bpbm5lci1ib3JkZXIgc3Bpbm5lci1ib3JkZXItc20gdGV4dC1wcmltYXJ5XCIgcm9sZT1cInN0YXR1c1wiPgogICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzPVwic3Itb25seVwiPkxvYWRpbmcuLi48L3NwYW4+CiAgICAgICAgICAgICAgICA8L2Rpdj4KICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJzbWFsbCB0ZXh0LW11dGVkIG10LTJcIj5Mb2FkaW5nIHNlY3Rpb25zLi4uPC9kaXY+CiAgICAgICAgICAgIDwvZGl2PgogICAgICAgIGA7CiAgICB9CiAgICAKICAgIHRyeSB7CiAgICAgICAgLy8gRmlyc3QgdHJ5IHRvIGxvYWQgZnJvbSBjYWNoZQogICAgICAgIGxldCBzZWN0aW9ucyA9IGdldFNlY3Rpb25zRnJvbUNhY2hlKCk7CiAgICAgICAgCiAgICAgICAgaWYgKHNlY3Rpb25zKSB7CiAgICAgICAgICAgIC8vIFVzZSBjYWNoZWQgc2VjdGlvbnMKICAgICAgICAgICAgY3VycmVudFNlY3Rpb25zID0gc2VjdGlvbnM7CiAgICAgICAgICAgIHJlbmRlclNlY3Rpb25zVGFibGUoc2VjdGlvbnMsIGhhbmRsZVNlY3Rpb25TZWxlY3QpOwogICAgICAgIH0gZWxzZSB7CiAgICAgICAgICAgIC8vIENhY2hlIG1pc3MgLSBsb2FkIGZyb20gQVBJCiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdObyBjYWNoZWQgc2VjdGlvbnMgZm91bmQsIGxvYWRpbmcgZnJvbSBBUEkuLi4nKTsKICAgICAgICAgICAgc2VjdGlvbnMgPSBhd2FpdCBnZXRVc2VyUm9sZXMoKTsKICAgICAgICAgICAgCiAgICAgICAgICAgIGlmIChzZWN0aW9ucyAmJiBzZWN0aW9ucy5sZW5ndGggPiAwKSB7CiAgICAgICAgICAgICAgICAvLyBTYXZlIHRvIGNhY2hlIGZvciBuZXh0IHRpbWUKICAgICAgICAgICAgICAgIHNhdmVTZWN0aW9uc1RvQ2FjaGUoc2VjdGlvbnMpOwogICAgICAgICAgICAgICAgY3VycmVudFNlY3Rpb25zID0gc2VjdGlvbnM7CiAgICAgICAgICAgICAgICByZW5kZXJTZWN0aW9uc1RhYmxlKHNlY3Rpb25zLCBoYW5kbGVTZWN0aW9uU2VsZWN0KTsKICAgICAgICAgICAgfSBlbHNlIHsKICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignTm8gc2VjdGlvbnMgcmV0dXJuZWQgZnJvbSBBUEknKTsKICAgICAgICAgICAgfQogICAgICAgIH0KICAgICAgICAKICAgIH0gY2F0Y2ggKGVycm9yKSB7CiAgICAgICAgY29uc29sZS5lcnJvcignRmFpbGVkIHRvIGxvYWQgc2VjdGlvbnM6JywgZXJyb3IpOwogICAgICAgIHNob3dFcnJvcignRmFpbGVkIHRvIGxvYWQgc2VjdGlvbnMuIFBsZWFzZSB0cnkgcmVmcmVzaGluZy4nKTsKICAgICAgICAKICAgICAgICAvLyBTaG93IGVycm9yIHN0YXRlIGluIHNpZGViYXIKICAgICAgICBpZiAoc2VjdGlvbnNDb250YWluZXIpIHsKICAgICAgICAgICAgc2VjdGlvbnNDb250YWluZXIuaW5uZXJIVE1MID0gYAogICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImFsZXJ0IGFsZXJ0LXdhcm5pbmcgYWxlcnQtc21cIj4KICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwic21hbGxcIj4KICAgICAgICAgICAgICAgICAgICAgICAgPGkgY2xhc3M9XCJmYXMgZmEtZXhjbGFtYXRpb24tdHJpYW5nbGVcIj48L2k+IAogICAgICAgICAgICAgICAgICAgICAgICBGYWlsZWQgdG8gbG9hZCBzZWN0aW9ucwogICAgICAgICAgICAgICAgICAgIDwvZGl2PgogICAgICAgICAgICAgICAgICAgIDxidXR0b24gY2xhc3M9XCJidG4gYnRuLW91dGxpbmUtcHJpbWFyeSBidG4tc20gbXQtMiB3LTEwMFwiIG9uY2xpY2s9XCJsb2FkU2VjdGlvbnNGcm9tQ2FjaGVPckFQSSgpXCI+CiAgICAgICAgICAgICAgICAgICAgICAgIDxpIGNsYXNzPVwiZmFzIGZhLXJlZG9cIj48L2k+IFJldHJ5CiAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+CiAgICAgICAgICAgICAgICA8L2Rpdj4KICAgICAgICAgICAgYDsKICAgICAgICB9CiAgICB9Cn0KCi8vIENvbXBsZXRlIGhhbmRsZXIgZm9yIHNlY3Rpb24gc2VsZWN0aW9uCmFzeW5jIGZ1bmN0aW9uIGhhbmRsZVNlY3Rpb25TZWxlY3Qoc2VsZWN0ZWRTZWN0aW9uSWRzKSB7CiAgICAvLyBDaGVjayBpZiBhcHBsaWNhdGlvbiBpcyBibG9ja2VkIGJlZm9yZSBtYWtpbmcgYW55IEFQSSBjYWxscwogICAgaWYgKHNlc3Npb25TdG9yYWdlLmdldEl0ZW0oJ29zbV9ibG9ja2VkJykgPT09ICd0cnVlJykgewogICAgICAgIHNob3dFcnJvcignQXBwbGljYXRpb24gaXMgYmxvY2tlZCBieSBPU00uIENvbnRhY3QgYWRtaW5pc3RyYXRvci4nKTsKICAgICAgICBzaG93QmxvY2tlZFNjcmVlbigpOwogICAgICAgIHJldHVybjsKICAgIH0KICAgIAogICAgaWYgKHNlbGVjdGVkU2VjdGlvbklkcy5sZW5ndGggPT09IDApIHsKICAgICAgICBzaG93RXJyb3IoJ1BsZWFzZSBzZWxlY3QgYXQgbGVhc3Qgb25lIHNlY3Rpb24nKTsKICAgICAgICByZXR1cm47CiAgICB9CgogICAgc2hvd1NwaW5uZXIoKTsKICAgIHRyeSB7CiAgICAgICAgbGV0IGFsbEV2ZW50cyA9IFtdOwogICAgICAgIAogICAgICAgIC8vIENyZWF0ZSBhIG1hcHBpbmcgb2Ygc2VjdGlvbklkIHRvIHNlY3Rpb25OYW1lIGZyb20gc3RvcmVkIGRhdGEKICAgICAgICBjb25zdCBzZWN0aW9uSWRUb05hbWUgPSB7fTsKICAgICAgICBjdXJyZW50U2VjdGlvbnMuZm9yRWFjaChzZWN0aW9uID0+IHsKICAgICAgICAgICAgc2VjdGlvbklkVG9OYW1lW3NlY3Rpb24uc2VjdGlvbmlkXSA9IHNlY3Rpb24uc2VjdGlvbm5hbWU7CiAgICAgICAgfSk7CiAgICAgICAgCiAgICAgICAgLy8gRmV0Y2ggZXZlbnRzIGZvciBlYWNoIHNlbGVjdGVkIHNlY3Rpb24KICAgICAgICBmb3IgKGNvbnN0IHNlY3Rpb25JZCBvZiBzZWxlY3RlZFNlY3Rpb25JZHMpIHsKICAgICAgICAgICAgY29uc3QgdGVybUlkID0gYXdhaXQgZ2V0TW9zdFJlY2VudFRlcm1JZChzZWN0aW9uSWQpOwogICAgICAgICAgICBpZiAodGVybUlkKSB7CiAgICAgICAgICAgICAgICBjb25zdCBldmVudHMgPSBhd2FpdCBnZXRFdmVudHMoc2VjdGlvbklkLCB0ZXJtSWQpOwogICAgICAgICAgICAgICAgaWYgKGV2ZW50cy5pdGVtcykgewogICAgICAgICAgICAgICAgICAgIC8vIEFkZCBzZWN0aW9uIG5hbWUgdG8gZWFjaCBldmVudAogICAgICAgICAgICAgICAgICAgIGNvbnN0IGV2ZW50c1dpdGhTZWN0aW9uTmFtZSA9IGV2ZW50cy5pdGVtcy5tYXAoZXZlbnQgPT4gKHsKICAgICAgICAgICAgICAgICAgICAgICAgLi4uZXZlbnQsCiAgICAgICAgICAgICAgICAgICAgICAgIHNlY3Rpb25uYW1lOiBzZWN0aW9uSWRUb05hbWVbc2VjdGlvbklkXSB8fCAnVW5rbm93biBTZWN0aW9uJywKICAgICAgICAgICAgICAgICAgICAgICAgc2VjdGlvbmlkOiBzZWN0aW9uSWQKICAgICAgICAgICAgICAgICAgICB9KSk7CiAgICAgICAgICAgICAgICAgICAgYWxsRXZlbnRzID0gYWxsRXZlbnRzLmNvbmNhdChldmVudHNXaXRoU2VjdGlvbk5hbWUpOwogICAgICAgICAgICAgICAgfQogICAgICAgICAgICB9CiAgICAgICAgfQoKICAgICAgICAvLyBSZW5kZXIgdGhlIGV2ZW50cyB0YWJsZSAtIGZvcmNlIG1vYmlsZSBsYXlvdXQgb24gYWxsIHNjcmVlbiBzaXplcwogICAgICAgIHJlbmRlckV2ZW50c1RhYmxlKGFsbEV2ZW50cywgaGFuZGxlRXZlbnRTZWxlY3QsIHRydWUpOyAvLyB0cnVlID0gZm9yY2UgbW9iaWxlIGxheW91dAogICAgICAgIAogICAgfSBjYXRjaCAoZXJyKSB7CiAgICAgICAgc2hvd0Vycm9yKCdGYWlsZWQgdG8gbG9hZCBldmVudHMnKTsKICAgICAgICBjb25zb2xlLmVycm9yKGVycik7CiAgICB9IGZpbmFsbHkgewogICAgICAgIGhpZGVTcGlubmVyKCk7CiAgICB9Cn0KCi8vIFVwZGF0ZSB5b3VyIGhhbmRsZUV2ZW50U2VsZWN0IHdpdGggbW9yZSBkZXRhaWxlZCBsb2dnaW5nOgphc3luYyBmdW5jdGlvbiBoYW5kbGVFdmVudFNlbGVjdChzZWxlY3RlZEV2ZW50cykgewogICAgaWYgKCFzZWxlY3RlZEV2ZW50cyB8fCBzZWxlY3RlZEV2ZW50cy5sZW5ndGggPT09IDApIHsKICAgICAgICBzaG93RXJyb3IoJ1BsZWFzZSBzZWxlY3QgYXQgbGVhc3Qgb25lIGV2ZW50Jyk7CiAgICAgICAgcmV0dXJuOwogICAgfQoKICAgIHNob3dTcGlubmVyKCk7CiAgICB0cnkgewogICAgICAgIGxldCBhbGxBdHRlbmRlZXMgPSBbXTsKICAgICAgICAKICAgICAgICBmb3IgKGNvbnN0IGV2ZW50IG9mIHNlbGVjdGVkRXZlbnRzKSB7CiAgICAgICAgICAgIHRyeSB7CiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnUHJvY2Vzc2luZyBldmVudDonLCB7CiAgICAgICAgICAgICAgICAgICAgZXZlbnRpZDogZXZlbnQuZXZlbnRpZCwKICAgICAgICAgICAgICAgICAgICBzZWN0aW9uaWQ6IGV2ZW50LnNlY3Rpb25pZCwKICAgICAgICAgICAgICAgICAgICB0ZXJtaWQ6IGV2ZW50LnRlcm1pZCwKICAgICAgICAgICAgICAgICAgICBuYW1lOiBldmVudC5uYW1lCiAgICAgICAgICAgICAgICB9KTsKICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgLy8gR2V0IHRlcm1pZCBmb3IgdGhlIGV2ZW50IChpZiBub3QgYWxyZWFkeSBpbiBldmVudCBvYmplY3QpCiAgICAgICAgICAgICAgICBsZXQgdGVybUlkID0gZXZlbnQudGVybWlkOwogICAgICAgICAgICAgICAgaWYgKCF0ZXJtSWQpIHsKICAgICAgICAgICAgICAgICAgICB0ZXJtSWQgPSBhd2FpdCBnZXRNb3N0UmVjZW50VGVybUlkKGV2ZW50LnNlY3Rpb25pZCk7CiAgICAgICAgICAgICAgICB9CiAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgIGNvbnN0IGF0dGVuZGFuY2VEYXRhID0gYXdhaXQgZ2V0RXZlbnRBdHRlbmRhbmNlKGV2ZW50LnNlY3Rpb25pZCwgZXZlbnQuZXZlbnRpZCwgdGVybUlkKTsKICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ1JhdyBhdHRlbmRhbmNlIGRhdGE6JywgYXR0ZW5kYW5jZURhdGEpOwogICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICBpZiAoYXR0ZW5kYW5jZURhdGEgJiYgYXR0ZW5kYW5jZURhdGEuaXRlbXMgJiYgYXR0ZW5kYW5jZURhdGEuaXRlbXMubGVuZ3RoID4gMCkgewogICAgICAgICAgICAgICAgICAgIGNvbnN0IGV2ZW50QXR0ZW5kZWVzID0gYXR0ZW5kYW5jZURhdGEuaXRlbXMubWFwKGF0dGVuZGVlID0+ICh7CiAgICAgICAgICAgICAgICAgICAgICAgIC4uLmF0dGVuZGVlLAogICAgICAgICAgICAgICAgICAgICAgICBzZWN0aW9ubmFtZTogZXZlbnQuc2VjdGlvbm5hbWUsCiAgICAgICAgICAgICAgICAgICAgICAgIF9ldmVudE5hbWU6IGV2ZW50Lm5hbWUsCiAgICAgICAgICAgICAgICAgICAgICAgIF9ldmVudERhdGU6IGV2ZW50LmRhdGUKICAgICAgICAgICAgICAgICAgICB9KSk7CiAgICAgICAgICAgICAgICAgICAgYWxsQXR0ZW5kZWVzID0gYWxsQXR0ZW5kZWVzLmNvbmNhdChldmVudEF0dGVuZGVlcyk7CiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGF0dGVuZGFuY2VEYXRhICYmIEFycmF5LmlzQXJyYXkoYXR0ZW5kYW5jZURhdGEpICYmIGF0dGVuZGFuY2VEYXRhLmxlbmd0aCA+IDApIHsKICAgICAgICAgICAgICAgICAgICBjb25zdCBldmVudEF0dGVuZGVlcyA9IGF0dGVuZGFuY2VEYXRhLm1hcChhdHRlbmRlZSA9PiAoewogICAgICAgICAgICAgICAgICAgICAgICAuLi5hdHRlbmRlZSwKICAgICAgICAgICAgICAgICAgICAgICAgc2VjdGlvbm5hbWU6IGV2ZW50LnNlY3Rpb25uYW1lLAogICAgICAgICAgICAgICAgICAgICAgICBfZXZlbnROYW1lOiBldmVudC5uYW1lLAogICAgICAgICAgICAgICAgICAgICAgICBfZXZlbnREYXRlOiBldmVudC5kYXRlCiAgICAgICAgICAgICAgICAgICAgfSkpOwogICAgICAgICAgICAgICAgICAgIGFsbEF0dGVuZGVlcyA9IGFsbEF0dGVuZGVlcy5jb25jYXQoZXZlbnRBdHRlbmRlZXMpOwogICAgICAgICAgICAgICAgfSBlbHNlIHsKICAgICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oJ05vIGF0dGVuZGFuY2UgZGF0YSBmb3VuZCBmb3IgZXZlbnQ6JywgZXZlbnQubmFtZSwgYXR0ZW5kYW5jZURhdGEpOwogICAgICAgICAgICAgICAgfQogICAgICAgICAgICAgICAgCiAgICAgICAgICAgIH0gY2F0Y2ggKGV2ZW50RXJyb3IpIHsKICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYEZhaWxlZCB0byBmZXRjaCBhdHRlbmRhbmNlIGZvciBldmVudCAke2V2ZW50Lm5hbWV9OmAsIGV2ZW50RXJyb3IpOwogICAgICAgICAgICB9CiAgICAgICAgfQoKICAgICAgICBpZiAoYWxsQXR0ZW5kZWVzLmxlbmd0aCA9PT0gMCkgewogICAgICAgICAgICBzaG93RXJyb3IoJ05vIGF0dGVuZGFuY2UgZGF0YSBmb3VuZCBmb3Igc2VsZWN0ZWQgZXZlbnRzJyk7CiAgICAgICAgfSBlbHNlIHsKICAgICAgICAgICAgcmVuZGVyVGFiYmVkQXR0ZW5kYW5jZVZpZXcoYWxsQXR0ZW5kZWVzKTsKICAgICAgICB9CiAgICAgICAgCiAgICB9IGNhdGNoIChlcnIpIHsKICAgICAgICBzaG93RXJyb3IoJ0ZhaWxlZCB0byBsb2FkIGF0dGVuZGVlcycpOwogICAgICAgIGNvbnNvbGUuZXJyb3IoJ092ZXJhbGwgZXJyb3I6JywgZXJyKTsKICAgIH0gZmluYWxseSB7CiAgICAgICAgaGlkZVNwaW5uZXIoKTsKICAgIH0KfQoKLy8gUmVuZGVyIHRhYmJlZCBhdHRlbmRhbmNlIHZpZXcgd2l0aCBtdWx0aXBsZSBwYWdlcwpmdW5jdGlvbiByZW5kZXJUYWJiZWRBdHRlbmRhbmNlVmlldyhhdHRlbmRlZXMpIHsKICAgIGNvbnN0IGF0dGVuZGFuY2VQYW5lbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdhdHRlbmRhbmNlLXBhbmVsJyk7CiAgICBpZiAoIWF0dGVuZGFuY2VQYW5lbCkgcmV0dXJuOwoKICAgIGNvbnN0IHRhYnNIdG1sID0gYAogICAgICAgIDxkaXYgY2xhc3M9XCJjYXJkIHNoYWRvdy1zbSBoLTEwMFwiPgogICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY2FyZC1oZWFkZXIgYmctaW5mbyB0ZXh0LXdoaXRlXCI+CiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiZC1mbGV4IGp1c3RpZnktY29udGVudC1iZXR3ZWVuIGFsaWduLWl0ZW1zLWNlbnRlclwiPgogICAgICAgICAgICAgICAgICAgIDxoNSBjbGFzcz1cIm1iLTBcIj4KICAgICAgICAgICAgICAgICAgICAgICAgPGkgY2xhc3M9XCJmYXMgZmEtdXNlcnNcIj48L2k+IAogICAgICAgICAgICAgICAgICAgICAgICBBdHRlbmRhbmNlIFJlY29yZHMKICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3M9XCJiYWRnZSBiYWRnZS1saWdodCB0ZXh0LWRhcmsgbXMtMlwiPiR7YXR0ZW5kZWVzLmxlbmd0aH0gdG90YWw8L3NwYW4+CiAgICAgICAgICAgICAgICAgICAgPC9oNT4KICAgICAgICAgICAgICAgIDwvZGl2PgogICAgICAgICAgICA8L2Rpdj4KICAgICAgICAgICAgCiAgICAgICAgICAgIDwhLS0gVGFiIE5hdmlnYXRpb24gLS0+CiAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjYXJkLWJvZHkgcC0wXCI+CiAgICAgICAgICAgICAgICA8bmF2PgogICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJuYXYgbmF2LXRhYnMgYm9yZGVyLWJvdHRvbVwiIGlkPVwibmF2LXRhYlwiIHJvbGU9XCJ0YWJsaXN0XCI+CiAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b24gY2xhc3M9XCJuYXYtbGluayBhY3RpdmVcIiBpZD1cIm5hdi1zdW1tYXJ5LXRhYlwiIGRhdGEtdG9nZ2xlPVwidGFiXCIgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGF0YS10YXJnZXQ9XCIjbmF2LXN1bW1hcnlcIiB0eXBlPVwiYnV0dG9uXCIgcm9sZT1cInRhYlwiIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFyaWEtY29udHJvbHM9XCJuYXYtc3VtbWFyeVwiIGFyaWEtc2VsZWN0ZWQ9XCJ0cnVlXCIKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbmNsaWNrPVwic3dpdGNoQXR0ZW5kYW5jZVRhYignc3VtbWFyeScpXCI+CiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8aSBjbGFzcz1cImZhcyBmYS10YWJsZSBtZS0xXCI+PC9pPgogICAgICAgICAgICAgICAgICAgICAgICAgICAgQXR0ZW5kYW5jZSBTdW1tYXJ5CiAgICAgICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPgogICAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uIGNsYXNzPVwibmF2LWxpbmtcIiBpZD1cIm5hdi1ncm91cGVkLXRhYlwiIGRhdGEtdG9nZ2xlPVwidGFiXCIgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGF0YS10YXJnZXQ9XCIjbmF2LWdyb3VwZWRcIiB0eXBlPVwiYnV0dG9uXCIgcm9sZT1cInRhYlwiIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFyaWEtY29udHJvbHM9XCJuYXYtZ3JvdXBlZFwiIGFyaWEtc2VsZWN0ZWQ9XCJmYWxzZVwiCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25jbGljaz1cInN3aXRjaEF0dGVuZGFuY2VUYWIoJ2dyb3VwZWQnKVwiPgogICAgICAgICAgICAgICAgICAgICAgICAgICAgPGkgY2xhc3M9XCJmYXMgZmEtbGF5ZXItZ3JvdXAgbWUtMVwiPjwvaT4KICAgICAgICAgICAgICAgICAgICAgICAgICAgIEF0dGVuZGFuY2UgRGV0YWlsZWQgR3JvdXBzCiAgICAgICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPgogICAgICAgICAgICAgICAgICAgIDwvZGl2PgogICAgICAgICAgICAgICAgPC9uYXY+CiAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgIDwhLS0gVGFiIENvbnRlbnQgLS0+CiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwidGFiLWNvbnRlbnRcIiBpZD1cIm5hdi10YWJDb250ZW50XCI+CiAgICAgICAgICAgICAgICAgICAgPCEtLSBTdW1tYXJ5IFRhYiAtLT4KICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwidGFiLXBhbmUgZmFkZSBzaG93IGFjdGl2ZVwiIGlkPVwibmF2LXN1bW1hcnlcIiByb2xlPVwidGFicGFuZWxcIiBhcmlhLWxhYmVsbGVkYnk9XCJuYXYtc3VtbWFyeS10YWJcIj4KICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBpZD1cInN1bW1hcnktY29udGVudFwiIGNsYXNzPVwicC0wXCI+CiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8IS0tIFN1bW1hcnkgdGFibGUgd2lsbCBiZSByZW5kZXJlZCBoZXJlIC0tPgogICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj4KICAgICAgICAgICAgICAgICAgICA8L2Rpdj4KICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICA8IS0tIEdyb3VwZWQgVGFiIC0tPgogICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJ0YWItcGFuZSBmYWRlXCIgaWQ9XCJuYXYtZ3JvdXBlZFwiIHJvbGU9XCJ0YWJwYW5lbFwiIGFyaWEtbGFiZWxsZWRieT1cIm5hdi1ncm91cGVkLXRhYlwiPgogICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGlkPVwiZ3JvdXBlZC1jb250ZW50XCIgY2xhc3M9XCJwLTBcIj4KICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwhLS0gR3JvdXBlZCB0YWJsZSB3aWxsIGJlIHJlbmRlcmVkIGhlcmUgLS0+CiAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PgogICAgICAgICAgICAgICAgICAgIDwvZGl2PgogICAgICAgICAgICAgICAgPC9kaXY+CiAgICAgICAgICAgIDwvZGl2PgogICAgICAgIDwvZGl2PgogICAgYDsKCiAgICBhdHRlbmRhbmNlUGFuZWwuaW5uZXJIVE1MID0gdGFic0h0bWw7CgogICAgLy8gUmVuZGVyIGJvdGggdGFiIGNvbnRlbnRzCiAgICByZW5kZXJTdW1tYXJ5QXR0ZW5kYW5jZVRhYmxlKGF0dGVuZGVlcyk7CiAgICByZW5kZXJHcm91cGVkQXR0ZW5kYW5jZVRhYmxlKGF0dGVuZGVlcyk7Cn0KCi8vIFN3aXRjaCBiZXR3ZWVuIGF0dGVuZGFuY2UgdGFicwpmdW5jdGlvbiBzd2l0Y2hBdHRlbmRhbmNlVGFiKHRhYlR5cGUpIHsKICAgIC8vIFVwZGF0ZSB0YWIgYWN0aXZlIHN0YXRlcwogICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnI25hdi10YWIgLm5hdi1saW5rJykuZm9yRWFjaCh0YWIgPT4gewogICAgICAgIHRhYi5jbGFzc0xpc3QucmVtb3ZlKCdhY3RpdmUnKTsKICAgICAgICB0YWIuc2V0QXR0cmlidXRlKCdhcmlhLXNlbGVjdGVkJywgJ2ZhbHNlJyk7CiAgICB9KTsKICAgIAogICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLnRhYi1wYW5lJykuZm9yRWFjaChwYW5lID0+IHsKICAgICAgICBwYW5lLmNsYXNzTGlzdC5yZW1vdmUoJ3Nob3cnLCAnYWN0aXZlJyk7CiAgICB9KTsKCiAgICBpZiAodGFiVHlwZSA9PT0gJ3N1bW1hcnknKSB7CiAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ25hdi1zdW1tYXJ5LXRhYicpLmNsYXNzTGlzdC5hZGQoJ2FjdGl2ZScpOwogICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCduYXYtc3VtbWFyeS10YWInKS5zZXRBdHRyaWJ1dGUoJ2FyaWEtc2VsZWN0ZWQnLCAndHJ1ZScpOwogICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCduYXYtc3VtbWFyeScpLmNsYXNzTGlzdC5hZGQoJ3Nob3cnLCAnYWN0aXZlJyk7CiAgICB9IGVsc2UgaWYgKHRhYlR5cGUgPT09ICdncm91cGVkJykgewogICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCduYXYtZ3JvdXBlZC10YWInKS5jbGFzc0xpc3QuYWRkKCdhY3RpdmUnKTsKICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbmF2LWdyb3VwZWQtdGFiJykuc2V0QXR0cmlidXRlKCdhcmlhLXNlbGVjdGVkJywgJ3RydWUnKTsKICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbmF2LWdyb3VwZWQnKS5jbGFzc0xpc3QuYWRkKCdzaG93JywgJ2FjdGl2ZScpOwogICAgfQp9CgovLyBNYWtlIHRhYiBzd2l0Y2hpbmcgZ2xvYmFsbHkgYXZhaWxhYmxlCndpbmRvdy5zd2l0Y2hBdHRlbmRhbmNlVGFiID0gc3dpdGNoQXR0ZW5kYW5jZVRhYjsKCi8vIFJlbmRlciBvcmlnaW5hbCBzdW1tYXJ5IGF0dGVuZGFuY2UgdGFibGUgKHVzaW5nIHVpLmpzIGxvZ2ljKQpmdW5jdGlvbiByZW5kZXJTdW1tYXJ5QXR0ZW5kYW5jZVRhYmxlKGF0dGVuZGVlcykgewogICAgY29uc3Qgc3VtbWFyeUNvbnRlbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnc3VtbWFyeS1jb250ZW50Jyk7CiAgICBpZiAoIXN1bW1hcnlDb250ZW50KSByZXR1cm47CgogICAgaWYgKGF0dGVuZGVlcy5sZW5ndGggPT09IDApIHsKICAgICAgICBzdW1tYXJ5Q29udGVudC5pbm5lckhUTUwgPSBgCiAgICAgICAgICAgIDxwIGNsYXNzPVwidGV4dC1tdXRlZCB0ZXh0LWNlbnRlclwiPgogICAgICAgICAgICAgICAgTm8gYXR0ZW5kZWVzIGZvdW5kIGZvciB0aGUgc2VsZWN0ZWQgZXZlbnRzLgogICAgICAgICAgICA8L3A+CiAgICAgICAgYDsKICAgICAgICByZXR1cm47CiAgICB9CgogICAgLy8gR3JvdXAgYXR0ZW5kZWVzIGJ5IHBlcnNvbiAoZmlyc3QgKyBsYXN0IG5hbWUpIC0gY29waWVkIGZyb20gdWkuanMgbG9naWMKICAgIGNvbnN0IGF0dGVuZGVlc0J5UGVyc29uID0ge307CiAgICBhdHRlbmRlZXMuZm9yRWFjaChhdHRlbmRlZSA9PiB7CiAgICAgICAgY29uc3QgcGVyc29uS2V5ID0gYCR7YXR0ZW5kZWUuZmlyc3RuYW1lfSAke2F0dGVuZGVlLmxhc3RuYW1lfWA7CiAgICAgICAgaWYgKCFhdHRlbmRlZXNCeVBlcnNvbltwZXJzb25LZXldKSB7CiAgICAgICAgICAgIGF0dGVuZGVlc0J5UGVyc29uW3BlcnNvbktleV0gPSB7CiAgICAgICAgICAgICAgICBmaXJzdG5hbWU6IGF0dGVuZGVlLmZpcnN0bmFtZSwKICAgICAgICAgICAgICAgIGxhc3RuYW1lOiBhdHRlbmRlZS5sYXN0bmFtZSwKICAgICAgICAgICAgICAgIGV2ZW50czogW10sCiAgICAgICAgICAgICAgICB0b3RhbFllczogMCwKICAgICAgICAgICAgICAgIHRvdGFsTm86IDAKICAgICAgICAgICAgfTsKICAgICAgICB9CiAgICAgICAgCiAgICAgICAgYXR0ZW5kZWVzQnlQZXJzb25bcGVyc29uS2V5XS5ldmVudHMucHVzaChhdHRlbmRlZSk7CiAgICAgICAgaWYgKGF0dGVuZGVlLmF0dGVuZGluZyA9PT0gJ1llcycpIHsKICAgICAgICAgICAgYXR0ZW5kZWVzQnlQZXJzb25bcGVyc29uS2V5XS50b3RhbFllcysrOwogICAgICAgIH0gZWxzZSB7CiAgICAgICAgICAgIGF0dGVuZGVlc0J5UGVyc29uW3BlcnNvbktleV0udG90YWxObysrOwogICAgICAgIH0KICAgIH0pOwoKICAgIC8vIEdldCB1bmlxdWUgdmFsdWVzIGZvciBmaWx0ZXJzCiAgICBjb25zdCB1bmlxdWVTZWN0aW9ucyA9IFsuLi5uZXcgU2V0KGF0dGVuZGVlcy5tYXAoYSA9PiBhLnNlY3Rpb25uYW1lKSldOwogICAgY29uc3QgdW5pcXVlRXZlbnRzID0gWy4uLm5ldyBTZXQoYXR0ZW5kZWVzLm1hcChhID0+IGEuX2V2ZW50TmFtZSkpXTsKICAgIGNvbnN0IHVuaXF1ZVN0YXR1c2VzID0gWy4uLm5ldyBTZXQoYXR0ZW5kZWVzLm1hcChhID0+IGEuYXR0ZW5kaW5nKSldOwoKICAgIC8vIENoZWNrIGlmIG1vYmlsZQogICAgY29uc3QgaXNNb2JpbGUgPSB3aW5kb3cuaW5uZXJXaWR0aCA8PSA3Njc7CgogICAgbGV0IGh0bWwgPSBgCiAgICAgICAgPGRpdiBjbGFzcz1cImQtZmxleCBqdXN0aWZ5LWNvbnRlbnQtYmV0d2VlbiBhbGlnbi1pdGVtcy1jZW50ZXIgbWItM1wiPgogICAgICAgICAgICA8aDYgY2xhc3M9XCJtYi0wXCI+QXR0ZW5kYW5jZSBTdW1tYXJ5PC9oNj4KICAgICAgICAgICAgPHNtYWxsIGNsYXNzPVwidGV4dC1tdXRlZFwiPgogICAgICAgICAgICAgICAgPHNwYW4gaWQ9XCJzdW1tYXJ5LWF0dGVuZGVlLWNvdW50XCI+JHtPYmplY3Qua2V5cyhhdHRlbmRlZXNCeVBlcnNvbikubGVuZ3RofTwvc3Bhbj4gcGVyc29uKHMpLCAKICAgICAgICAgICAgICAgIDxzcGFuIGlkPVwic3VtbWFyeS1ldmVudC1jb3VudFwiPiR7YXR0ZW5kZWVzLmxlbmd0aH08L3NwYW4+IGV2ZW50IHJlY29yZChzKQogICAgICAgICAgICA8L3NtYWxsPgogICAgICAgIDwvZGl2PgogICAgICAgIAogICAgICAgIDwhLS0gRmlsdGVyIENvbnRyb2xzIC0tPgogICAgICAgIDxkaXYgY2xhc3M9XCJyb3cgbWItM1wiPgogICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY29sLW1kLTMgbWItMlwiPgogICAgICAgICAgICAgICAgPHNlbGVjdCBpZD1cInN1bW1hcnktc2VjdGlvbi1maWx0ZXJcIiBjbGFzcz1cImZvcm0tc2VsZWN0IGZvcm0tc2VsZWN0LXNtXCI+CiAgICAgICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cIlwiPkFsbCBTZWN0aW9uczwvb3B0aW9uPgogICAgICAgICAgICAgICAgICAgICR7dW5pcXVlU2VjdGlvbnMubWFwKHNlY3Rpb24gPT4gYDxvcHRpb24gdmFsdWU9XCIke3NlY3Rpb259XCI+JHtzZWN0aW9ufTwvb3B0aW9uPmApLmpvaW4oJycpfQogICAgICAgICAgICAgICAgPC9zZWxlY3Q+CiAgICAgICAgICAgIDwvZGl2PgogICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY29sLW1kLTMgbWItMlwiPgogICAgICAgICAgICAgICAgPHNlbGVjdCBpZD1cInN1bW1hcnktZXZlbnQtZmlsdGVyXCIgY2xhc3M9XCJmb3JtLXNlbGVjdCBmb3JtLXNlbGVjdC1zbVwiPgogICAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XCJcIj5BbGwgRXZlbnRzPC9vcHRpb24+CiAgICAgICAgICAgICAgICAgICAgJHt1bmlxdWVFdmVudHMubWFwKGV2ZW50ID0+IGA8b3B0aW9uIHZhbHVlPVwiJHtldmVudH1cIj4ke2V2ZW50fTwvb3B0aW9uPmApLmpvaW4oJycpfQogICAgICAgICAgICAgICAgPC9zZWxlY3Q+CiAgICAgICAgICAgIDwvZGl2PgogICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY29sLW1kLTMgbWItMlwiPgogICAgICAgICAgICAgICAgPHNlbGVjdCBpZD1cInN1bW1hcnktc3RhdHVzLWZpbHRlclwiIGNsYXNzPVwiZm9ybS1zZWxlY3QgZm9ybS1zZWxlY3Qtc21cIj4KICAgICAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVwiXCI+QWxsIFN0YXR1c2VzPC9vcHRpb24+CiAgICAgICAgICAgICAgICAgICAgJHt1bmlxdWVTdGF0dXNlcy5tYXAoc3RhdHVzID0+IGA8b3B0aW9uIHZhbHVlPVwiJHtzdGF0dXN9XCI+JHtzdGF0dXN9PC9vcHRpb24+YCkuam9pbignJyl9CiAgICAgICAgICAgICAgICA8L3NlbGVjdD4KICAgICAgICAgICAgPC9kaXY+CiAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjb2wtbWQtMyBtYi0yXCI+CiAgICAgICAgICAgICAgICA8aW5wdXQgdHlwZT1cInRleHRcIiBpZD1cInN1bW1hcnktbmFtZS1maWx0ZXJcIiBjbGFzcz1cImZvcm0tY29udHJvbCBmb3JtLWNvbnRyb2wtc21cIiBwbGFjZWhvbGRlcj1cIlNlYXJjaCBuYW1lLi4uXCI+CiAgICAgICAgICAgIDwvZGl2PgogICAgICAgIDwvZGl2PgogICAgICAgIAogICAgICAgIDwhLS0gQ2xlYXIgRmlsdGVycyBCdXR0b24gLS0+CiAgICAgICAgPGRpdiBjbGFzcz1cIm1iLTNcIj4KICAgICAgICAgICAgPGJ1dHRvbiBpZD1cInN1bW1hcnktY2xlYXItZmlsdGVycy1idG5cIiBjbGFzcz1cImJ0biBidG4tb3V0bGluZS1zZWNvbmRhcnkgYnRuLXNtXCI+Q2xlYXIgRmlsdGVyczwvYnV0dG9uPgogICAgICAgIDwvZGl2PgogICAgICAgIAogICAgICAgIDwhLS0gQXR0ZW5kYW5jZSBUYWJsZSAtLT4KICAgICAgICA8ZGl2IGNsYXNzPVwidGFibGUtcmVzcG9uc2l2ZVwiPgogICAgICAgICAgICA8dGFibGUgaWQ9XCJzdW1tYXJ5LWF0dGVuZGFuY2UtdGFibGVcIiBjbGFzcz1cInRhYmxlIHRhYmxlLXN0cmlwZWQgdGFibGUtc21cIj5gOwoKICAgIGlmIChpc01vYmlsZSkgewogICAgICAgIC8vIE1vYmlsZSBsYXlvdXQKICAgICAgICBodG1sICs9IGAKICAgICAgICAgICAgICAgIDx0aGVhZD4KICAgICAgICAgICAgICAgICAgICA8dHI+CiAgICAgICAgICAgICAgICAgICAgICAgIDx0aCBzdHlsZT1cIndpZHRoOiA3MHB4O1wiIGNsYXNzPVwidGV4dC1jZW50ZXJcIj5TdGF0dXM8L3RoPgogICAgICAgICAgICAgICAgICAgICAgICA8dGg+TmFtZTwvdGg+CiAgICAgICAgICAgICAgICAgICAgICAgIDx0aCBzdHlsZT1cIndpZHRoOiA0MHB4O1wiIGNsYXNzPVwidGV4dC1jZW50ZXJcIj7ilrw8L3RoPgogICAgICAgICAgICAgICAgICAgIDwvdHI+CiAgICAgICAgICAgICAgICA8L3RoZWFkPgogICAgICAgICAgICAgICAgPHRib2R5IGlkPVwic3VtbWFyeS1hdHRlbmRhbmNlLXRib2R5XCI+YDsKICAgIH0gZWxzZSB7CiAgICAgICAgLy8gRGVza3RvcCBsYXlvdXQKICAgICAgICBodG1sICs9IGAKICAgICAgICAgICAgICAgIDx0aGVhZD4KICAgICAgICAgICAgICAgICAgICA8dHI+CiAgICAgICAgICAgICAgICAgICAgICAgIDx0aCBzdHlsZT1cIndpZHRoOiA4MHB4O1wiIGNsYXNzPVwidGV4dC1jZW50ZXJcIj5BdHRlbmRpbmc8L3RoPgogICAgICAgICAgICAgICAgICAgICAgICA8dGg+Rmlyc3QgTmFtZTwvdGg+CiAgICAgICAgICAgICAgICAgICAgICAgIDx0aD5MYXN0IE5hbWU8L3RoPgogICAgICAgICAgICAgICAgICAgICAgICA8dGggc3R5bGU9XCJ3aWR0aDogNDBweDtcIiBjbGFzcz1cInRleHQtY2VudGVyXCI+4pa8PC90aD4KICAgICAgICAgICAgICAgICAgICA8L3RyPgogICAgICAgICAgICAgICAgPC90aGVhZD4KICAgICAgICAgICAgICAgIDx0Ym9keSBpZD1cInN1bW1hcnktYXR0ZW5kYW5jZS10Ym9keVwiPmA7CiAgICB9CgogICAgLy8gR2VuZXJhdGUgcGVyc29uIHJvd3MKICAgIE9iamVjdC5lbnRyaWVzKGF0dGVuZGVlc0J5UGVyc29uKS5mb3JFYWNoKChbcGVyc29uS2V5LCBwZXJzb25dLCBwZXJzb25JZHgpID0+IHsKICAgICAgICBpZiAoaXNNb2JpbGUpIHsKICAgICAgICAgICAgaHRtbCArPSBgCiAgICAgICAgICAgICAgICA8dHIgY2xhc3M9XCJzdW1tYXJ5LXBlcnNvbi1yb3dcIiBkYXRhLXBlcnNvbi1pZHg9XCIke3BlcnNvbklkeH1cIiBzdHlsZT1cImN1cnNvcjogcG9pbnRlcjtcIj4KICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3M9XCJ0ZXh0LWNlbnRlciB0b3RhbC1jb2x1bW5cIj4KICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImQtZmxleCBmbGV4LWNvbHVtblwiPgogICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3M9XCJ0ZXh0LXN1Y2Nlc3MgZnctYm9sZFwiPiR7cGVyc29uLnRvdGFsWWVzfTwvc3Bhbj4KICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzPVwidGV4dC1kYW5nZXIgc21hbGxcIj4ke3BlcnNvbi50b3RhbE5vfTwvc3Bhbj4KICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+CiAgICAgICAgICAgICAgICAgICAgPC90ZD4KICAgICAgICAgICAgICAgICAgICA8dGQ+CiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJmdy1ib2xkXCI+JHtwZXJzb24uZmlyc3RuYW1lfSAke3BlcnNvbi5sYXN0bmFtZX08L2Rpdj4KICAgICAgICAgICAgICAgICAgICAgICAgPHNtYWxsIGNsYXNzPVwidGV4dC1tdXRlZFwiPiR7cGVyc29uLmV2ZW50cy5sZW5ndGh9IGV2ZW50KHMpPC9zbWFsbD4KICAgICAgICAgICAgICAgICAgICA8L3RkPgogICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzcz1cInRleHQtY2VudGVyXCI+CiAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzPVwic3VtbWFyeS1leHBhbmQtaWNvblwiPuKWvDwvc3Bhbj4KICAgICAgICAgICAgICAgICAgICA8L3RkPgogICAgICAgICAgICAgICAgPC90cj5gOwogICAgICAgIH0gZWxzZSB7CiAgICAgICAgICAgIGh0bWwgKz0gYAogICAgICAgICAgICAgICAgPHRyIGNsYXNzPVwic3VtbWFyeS1wZXJzb24tcm93XCIgZGF0YS1wZXJzb24taWR4PVwiJHtwZXJzb25JZHh9XCIgc3R5bGU9XCJjdXJzb3I6IHBvaW50ZXI7XCI+CiAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzPVwidGV4dC1jZW50ZXJcIj4KICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3M9XCJ0ZXh0LXN1Y2Nlc3MgZnctYm9sZFwiPiR7cGVyc29uLnRvdGFsWWVzfTwvc3Bhbj4gLyAKICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3M9XCJ0ZXh0LWRhbmdlclwiPiR7cGVyc29uLnRvdGFsTm99PC9zcGFuPgogICAgICAgICAgICAgICAgICAgIDwvdGQ+CiAgICAgICAgICAgICAgICAgICAgPHRkPiR7cGVyc29uLmZpcnN0bmFtZX08L3RkPgogICAgICAgICAgICAgICAgICAgIDx0ZD4ke3BlcnNvbi5sYXN0bmFtZX08L3RkPgogICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzcz1cInRleHQtY2VudGVyXCI+CiAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzPVwic3VtbWFyeS1leHBhbmQtaWNvblwiPuKWvDwvc3Bhbj4KICAgICAgICAgICAgICAgICAgICA8L3RkPgogICAgICAgICAgICAgICAgPC90cj5gOwogICAgICAgIH0KCiAgICAgICAgLy8gQWRkIGV4cGFuZGFibGUgZGV0YWlscyByb3cKICAgICAgICBodG1sICs9IGAKICAgICAgICAgICAgPHRyIGNsYXNzPVwic3VtbWFyeS1wZXJzb24tZGV0YWlscy1yb3dcIiBpZD1cInN1bW1hcnktcGVyc29uLWRldGFpbHMtJHtwZXJzb25JZHh9XCIgc3R5bGU9XCJkaXNwbGF5OiBub25lO1wiPgogICAgICAgICAgICAgICAgPHRkIGNvbHNwYW49XCIke2lzTW9iaWxlID8gMyA6IDR9XCIgY2xhc3M9XCJiZy1saWdodCBwLTBcIj4KICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwidGFibGUtcmVzcG9uc2l2ZVwiPgogICAgICAgICAgICAgICAgICAgICAgICA8dGFibGUgY2xhc3M9XCJ0YWJsZSB0YWJsZS1zbSBtYi0wXCI+CiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGhlYWQgY2xhc3M9XCJiZy1zZWNvbmRhcnkgdGV4dC13aGl0ZVwiPgogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0cj4KICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRoIGNsYXNzPVwic21hbGxcIj5TZWN0aW9uPC90aD4KICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRoIGNsYXNzPVwic21hbGxcIj5FdmVudDwvdGg+CiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0aCBjbGFzcz1cInNtYWxsIHRleHQtY2VudGVyXCI+U3RhdHVzPC90aD4KICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3RyPgogICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90aGVhZD4KICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0Ym9keT5gOwoKICAgICAgICAvLyBBZGQgZXZlbnQgZGV0YWlscyBmb3IgdGhpcyBwZXJzb24KICAgICAgICBwZXJzb24uZXZlbnRzLmZvckVhY2goZXZlbnQgPT4gewogICAgICAgICAgICBjb25zdCBzdGF0dXNDbGFzcyA9IGV2ZW50LmF0dGVuZGluZyA9PT0gJ1llcycgPyAndGV4dC1zdWNjZXNzJyA6ICd0ZXh0LWRhbmdlcic7CiAgICAgICAgICAgIGh0bWwgKz0gYAogICAgICAgICAgICAgICAgPHRyPgogICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzcz1cInNtYWxsXCI+JHtldmVudC5zZWN0aW9ubmFtZSB8fCAnJ308L3RkPgogICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzcz1cInNtYWxsXCI+JHtldmVudC5fZXZlbnROYW1lIHx8ICcnfTwvdGQ+CiAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzPVwic21hbGwgdGV4dC1jZW50ZXIgJHtzdGF0dXNDbGFzc31cIj4KICAgICAgICAgICAgICAgICAgICAgICAgPHN0cm9uZz4ke2V2ZW50LmF0dGVuZGluZyB8fCAnJ308L3N0cm9uZz4KICAgICAgICAgICAgICAgICAgICA8L3RkPgogICAgICAgICAgICAgICAgPC90cj5gOwogICAgICAgIH0pOwoKICAgICAgICBodG1sICs9IGAKICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdGJvZHk+CiAgICAgICAgICAgICAgICAgICAgICAgIDwvdGFibGU+CiAgICAgICAgICAgICAgICAgICAgPC9kaXY+CiAgICAgICAgICAgICAgICA8L3RkPgogICAgICAgICAgICA8L3RyPmA7CiAgICB9KTsKCiAgICBodG1sICs9IGAKICAgICAgICAgICAgICAgIDwvdGJvZHk+CiAgICAgICAgICAgIDwvdGFibGU+CiAgICAgICAgPC9kaXY+CiAgICBgOwoKICAgIHN1bW1hcnlDb250ZW50LmlubmVySFRNTCA9IGh0bWw7CgogICAgLy8gQWRkIGV4cGFuZCBmdW5jdGlvbmFsaXR5CiAgICBhZGRTdW1tYXJ5UGVyc29uRXhwYW5kRnVuY3Rpb25hbGl0eSgpOwogICAgCiAgICAvLyBBZGQgZmlsdGVyaW5nIGZ1bmN0aW9uYWxpdHkKICAgIGFkZFN1bW1hcnlBdHRlbmRlZUZpbHRlcmluZyhhdHRlbmRlZXNCeVBlcnNvbiwgYXR0ZW5kZWVzKTsKfQoKLy8gQWRkIHRoZSBzdW1tYXJ5IHBlcnNvbiBleHBhbmQgZnVuY3Rpb25hbGl0eQpmdW5jdGlvbiBhZGRTdW1tYXJ5UGVyc29uRXhwYW5kRnVuY3Rpb25hbGl0eSgpIHsKICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy5zdW1tYXJ5LXBlcnNvbi1yb3cnKS5mb3JFYWNoKHJvdyA9PiB7CiAgICAgICAgcm93LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24oKSB7CiAgICAgICAgICAgIGNvbnN0IHBlcnNvbklkeCA9IHRoaXMuZGF0YXNldC5wZXJzb25JZHg7CiAgICAgICAgICAgIGNvbnN0IGRldGFpbHNSb3cgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChgc3VtbWFyeS1wZXJzb24tZGV0YWlscy0ke3BlcnNvbklkeH1gKTsKICAgICAgICAgICAgY29uc3QgZXhwYW5kSWNvbiA9IHRoaXMucXVlcnlTZWxlY3RvcignLnN1bW1hcnktZXhwYW5kLWljb24nKTsKICAgICAgICAgICAgCiAgICAgICAgICAgIGlmIChkZXRhaWxzUm93LnN0eWxlLmRpc3BsYXkgPT09ICdub25lJykgewogICAgICAgICAgICAgICAgLy8gRXhwYW5kCiAgICAgICAgICAgICAgICBkZXRhaWxzUm93LnN0eWxlLmRpc3BsYXkgPSAnJzsKICAgICAgICAgICAgICAgIGV4cGFuZEljb24udGV4dENvbnRlbnQgPSAn4payJzsKICAgICAgICAgICAgICAgIHRoaXMuY2xhc3NMaXN0LmFkZCgnZXhwYW5kZWQnKTsKICAgICAgICAgICAgfSBlbHNlIHsKICAgICAgICAgICAgICAgIC8vIENvbGxhcHNlCiAgICAgICAgICAgICAgICBkZXRhaWxzUm93LnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7CiAgICAgICAgICAgICAgICBleHBhbmRJY29uLnRleHRDb250ZW50ID0gJ+KWvCc7CiAgICAgICAgICAgICAgICB0aGlzLmNsYXNzTGlzdC5yZW1vdmUoJ2V4cGFuZGVkJyk7CiAgICAgICAgICAgIH0KICAgICAgICB9KTsKICAgIH0pOwp9CgovLyBBZGQgZmlsdGVyaW5nIGZvciBzdW1tYXJ5IHRhYmxlCmZ1bmN0aW9uIGFkZFN1bW1hcnlBdHRlbmRlZUZpbHRlcmluZyhhdHRlbmRlZXNCeVBlcnNvbiwgb3JpZ2luYWxBdHRlbmRlZXMpIHsKICAgIGNvbnN0IHNlY3Rpb25GaWx0ZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnc3VtbWFyeS1zZWN0aW9uLWZpbHRlcicpOwogICAgY29uc3QgZXZlbnRGaWx0ZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnc3VtbWFyeS1ldmVudC1maWx0ZXInKTsKICAgIGNvbnN0IHN0YXR1c0ZpbHRlciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdzdW1tYXJ5LXN0YXR1cy1maWx0ZXInKTsKICAgIGNvbnN0IG5hbWVGaWx0ZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnc3VtbWFyeS1uYW1lLWZpbHRlcicpOwogICAgY29uc3QgY2xlYXJCdXR0b24gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnc3VtbWFyeS1jbGVhci1maWx0ZXJzLWJ0bicpOwoKICAgIGZ1bmN0aW9uIGFwcGx5RmlsdGVycygpIHsKICAgICAgICBjb25zdCBzZWN0aW9uVmFsdWUgPSBzZWN0aW9uRmlsdGVyLnZhbHVlLnRvTG93ZXJDYXNlKCk7CiAgICAgICAgY29uc3QgZXZlbnRWYWx1ZSA9IGV2ZW50RmlsdGVyLnZhbHVlLnRvTG93ZXJDYXNlKCk7CiAgICAgICAgY29uc3Qgc3RhdHVzVmFsdWUgPSBzdGF0dXNGaWx0ZXIudmFsdWUudG9Mb3dlckNhc2UoKTsKICAgICAgICBjb25zdCBuYW1lVmFsdWUgPSBuYW1lRmlsdGVyLnZhbHVlLnRvTG93ZXJDYXNlKCk7CgogICAgICAgIGxldCB2aXNpYmxlQ291bnQgPSAwOwoKICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcuc3VtbWFyeS1wZXJzb24tcm93JykuZm9yRWFjaChyb3cgPT4gewogICAgICAgICAgICBjb25zdCBwZXJzb25JZHggPSByb3cuZGF0YXNldC5wZXJzb25JZHg7CiAgICAgICAgICAgIGNvbnN0IHBlcnNvbktleSA9IE9iamVjdC5rZXlzKGF0dGVuZGVlc0J5UGVyc29uKVtwZXJzb25JZHhdOwogICAgICAgICAgICBjb25zdCBwZXJzb24gPSBhdHRlbmRlZXNCeVBlcnNvbltwZXJzb25LZXldOwogICAgICAgICAgICAKICAgICAgICAgICAgLy8gQ2hlY2sgaWYgcGVyc29uIG1hdGNoZXMgZmlsdGVycwogICAgICAgICAgICBjb25zdCBuYW1lTWF0Y2ggPSAhbmFtZVZhbHVlIHx8IAogICAgICAgICAgICAgICAgKHBlcnNvbi5maXJzdG5hbWUudG9Mb3dlckNhc2UoKS5pbmNsdWRlcyhuYW1lVmFsdWUpIHx8IAogICAgICAgICAgICAgICAgIHBlcnNvbi5sYXN0bmFtZS50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKG5hbWVWYWx1ZSkpOwogICAgICAgICAgICAgICAgIAogICAgICAgICAgICAvLyBDaGVjayBpZiBhbnkgb2YgdGhlaXIgZXZlbnRzIG1hdGNoIHNlY3Rpb24vZXZlbnQvc3RhdHVzIGZpbHRlcnMKICAgICAgICAgICAgY29uc3QgZXZlbnRzTWF0Y2ggPSBwZXJzb24uZXZlbnRzLnNvbWUoZXZlbnQgPT4gewogICAgICAgICAgICAgICAgY29uc3Qgc2VjdGlvbk1hdGNoID0gIXNlY3Rpb25WYWx1ZSB8fCBldmVudC5zZWN0aW9ubmFtZS50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKHNlY3Rpb25WYWx1ZSk7CiAgICAgICAgICAgICAgICBjb25zdCBldmVudE1hdGNoID0gIWV2ZW50VmFsdWUgfHwgZXZlbnQuX2V2ZW50TmFtZS50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKGV2ZW50VmFsdWUpOwogICAgICAgICAgICAgICAgY29uc3Qgc3RhdHVzTWF0Y2ggPSAhc3RhdHVzVmFsdWUgfHwgZXZlbnQuYXR0ZW5kaW5nLnRvTG93ZXJDYXNlKCkuaW5jbHVkZXMoc3RhdHVzVmFsdWUpOwogICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICByZXR1cm4gc2VjdGlvbk1hdGNoICYmIGV2ZW50TWF0Y2ggJiYgc3RhdHVzTWF0Y2g7CiAgICAgICAgICAgIH0pOwoKICAgICAgICAgICAgaWYgKG5hbWVNYXRjaCAmJiBldmVudHNNYXRjaCkgewogICAgICAgICAgICAgICAgcm93LnN0eWxlLmRpc3BsYXkgPSAnJzsKICAgICAgICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGBzdW1tYXJ5LXBlcnNvbi1kZXRhaWxzLSR7cGVyc29uSWR4fWApLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7CiAgICAgICAgICAgICAgICByb3cuY2xhc3NMaXN0LnJlbW92ZSgnZXhwYW5kZWQnKTsKICAgICAgICAgICAgICAgIHJvdy5xdWVyeVNlbGVjdG9yKCcuc3VtbWFyeS1leHBhbmQtaWNvbicpLnRleHRDb250ZW50ID0gJ+KWvCc7CiAgICAgICAgICAgICAgICB2aXNpYmxlQ291bnQrKzsKICAgICAgICAgICAgfSBlbHNlIHsKICAgICAgICAgICAgICAgIHJvdy5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnOwogICAgICAgICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoYHN1bW1hcnktcGVyc29uLWRldGFpbHMtJHtwZXJzb25JZHh9YCkuc3R5bGUuZGlzcGxheSA9ICdub25lJzsKICAgICAgICAgICAgfQogICAgICAgIH0pOwoKICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnc3VtbWFyeS1hdHRlbmRlZS1jb3VudCcpLnRleHRDb250ZW50ID0gdmlzaWJsZUNvdW50OwogICAgfQoKICAgIC8vIEFkZCBldmVudCBsaXN0ZW5lcnMKICAgIFtzZWN0aW9uRmlsdGVyLCBldmVudEZpbHRlciwgc3RhdHVzRmlsdGVyLCBuYW1lRmlsdGVyXS5mb3JFYWNoKGZpbHRlciA9PiB7CiAgICAgICAgZmlsdGVyLmFkZEV2ZW50TGlzdGVuZXIoJ2NoYW5nZScsIGFwcGx5RmlsdGVycyk7CiAgICAgICAgZmlsdGVyLmFkZEV2ZW50TGlzdGVuZXIoJ2lucHV0JywgYXBwbHlGaWx0ZXJzKTsKICAgIH0pOwoKICAgIGNsZWFyQnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4gewogICAgICAgIFtzZWN0aW9uRmlsdGVyLCBldmVudEZpbHRlciwgc3RhdHVzRmlsdGVyLCBuYW1lRmlsdGVyXS5mb3JFYWNoKGZpbHRlciA9PiB7CiAgICAgICAgICAgIGZpbHRlci52YWx1ZSA9ICcnOwogICAgICAgIH0pOwogICAgICAgIGFwcGx5RmlsdGVycygpOwogICAgfSk7Cn0KCi8vIFJlbmRlciBncm91cGVkIGF0dGVuZGFuY2UgdGFibGUgKG9wdGltaXplZCBmb3IgcGVyZm9ybWFuY2UpCmZ1bmN0aW9uIHJlbmRlckdyb3VwZWRBdHRlbmRhbmNlVGFibGUoYXR0ZW5kZWVzKSB7CiAgICBjb25zdCBncm91cGVkQ29udGVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdncm91cGVkLWNvbnRlbnQnKTsKICAgIGlmICghZ3JvdXBlZENvbnRlbnQpIHJldHVybjsKCiAgICAvLyBVc2UgZG9jdW1lbnQgZnJhZ21lbnQgZm9yIGJldHRlciBwZXJmb3JtYW5jZQogICAgY29uc3QgZnJhZ21lbnQgPSBkb2N1bWVudC5jcmVhdGVEb2N1bWVudEZyYWdtZW50KCk7CiAgICAKICAgIC8vIEdyb3VwIGF0dGVuZGVlcyBieSBzdGF0dXMKICAgIGNvbnN0IGdyb3VwZWRBdHRlbmRlZXMgPSB7fTsKICAgIGF0dGVuZGVlcy5mb3JFYWNoKGF0dGVuZGVlID0+IHsKICAgICAgICBjb25zdCBzdGF0dXMgPSBhdHRlbmRlZS5hdHRlbmRpbmcgfHwgYXR0ZW5kZWUuc3RhdHVzIHx8ICdVbmtub3duJzsKICAgICAgICBpZiAoIWdyb3VwZWRBdHRlbmRlZXNbc3RhdHVzXSkgewogICAgICAgICAgICBncm91cGVkQXR0ZW5kZWVzW3N0YXR1c10gPSBbXTsKICAgICAgICB9CiAgICAgICAgZ3JvdXBlZEF0dGVuZGVlc1tzdGF0dXNdLnB1c2goYXR0ZW5kZWUpOwogICAgfSk7CgogICAgLy8gU29ydCBzdGF0dXNlcyB3aXRoIGN1c3RvbSBwcmlvcml0eTogWWVzLCBObywgSW52aXRlZCwgdGhlbiBhbHBoYWJldGljYWwKICAgIGNvbnN0IHN0YXR1c1ByaW9yaXR5ID0geyAnWWVzJzogMSwgJ05vJzogMiwgJ0ludml0ZWQnOiAzIH07CiAgICBjb25zdCBzb3J0ZWRTdGF0dXNlcyA9IE9iamVjdC5rZXlzKGdyb3VwZWRBdHRlbmRlZXMpLnNvcnQoKGEsIGIpID0+IHsKICAgICAgICBjb25zdCBwcmlvcml0eUEgPSBzdGF0dXNQcmlvcml0eVthXSB8fCA5OTk7CiAgICAgICAgY29uc3QgcHJpb3JpdHlCID0gc3RhdHVzUHJpb3JpdHlbYl0gfHwgOTk5OwogICAgICAgIAogICAgICAgIGlmIChwcmlvcml0eUEgIT09IHByaW9yaXR5QikgewogICAgICAgICAgICByZXR1cm4gcHJpb3JpdHlBIC0gcHJpb3JpdHlCOwogICAgICAgIH0KICAgICAgICAKICAgICAgICAvLyBJZiBzYW1lIHByaW9yaXR5IChib3RoIHVua25vd24pLCBzb3J0IGFscGhhYmV0aWNhbGx5CiAgICAgICAgcmV0dXJuIGEubG9jYWxlQ29tcGFyZShiKTsKICAgIH0pOwoKICAgIGlmIChzb3J0ZWRTdGF0dXNlcy5sZW5ndGggPT09IDApIHsKICAgICAgICBncm91cGVkQ29udGVudC5pbm5lckhUTUwgPSBgCiAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJ0ZXh0LWNlbnRlciBweS00XCI+CiAgICAgICAgICAgICAgICA8aSBjbGFzcz1cImZhcyBmYS1pbmZvLWNpcmNsZSB0ZXh0LW11dGVkXCIgc3R5bGU9XCJmb250LXNpemU6IDJyZW07XCI+PC9pPgogICAgICAgICAgICAgICAgPHAgY2xhc3M9XCJ0ZXh0LW11dGVkIG10LTJcIj5ObyBhdHRlbmRhbmNlIHJlY29yZHMgZm91bmQuPC9wPgogICAgICAgICAgICA8L2Rpdj4KICAgICAgICBgOwogICAgICAgIHJldHVybjsKICAgIH0KCiAgICAvLyBCdWlsZCBIVE1MIHN0cmluZyBlZmZpY2llbnRseSAoZmFzdGVyIHRoYW4gRE9NIG1hbmlwdWxhdGlvbikKICAgIGNvbnN0IGh0bWxQYXJ0cyA9IFtdOwogICAgCiAgICBzb3J0ZWRTdGF0dXNlcy5mb3JFYWNoKChzdGF0dXMsIGluZGV4KSA9PiB7CiAgICAgICAgY29uc3QgcmVjb3JkcyA9IGdyb3VwZWRBdHRlbmRlZXNbc3RhdHVzXTsKICAgICAgICBjb25zdCBpc0V4cGFuZGVkID0gaW5kZXggPT09IDA7IC8vIEZpcnN0IGdyb3VwIGV4cGFuZGVkIGJ5IGRlZmF1bHQKICAgICAgICBjb25zdCBjb2xsYXBzZUlkID0gYGdyb3VwZWQtY29sbGFwc2UtJHtzdGF0dXMucmVwbGFjZSgvXFxzKy9nLCAnLScpLnRvTG93ZXJDYXNlKCl9YDsKICAgICAgICAKICAgICAgICAvLyBHZXQgc3RhdHVzIGNvbG9yIGJhc2VkIG9uIGF0dGVuZGFuY2UgdmFsdWUKICAgICAgICBjb25zdCBzdGF0dXNDb2xvciA9IGdldFN0YXR1c0NvbG9yKHN0YXR1cyk7CiAgICAgICAgCiAgICAgICAgaHRtbFBhcnRzLnB1c2goYAogICAgICAgICAgICA8ZGl2IGNsYXNzPVwiYm9yZGVyLWJvdHRvbVwiPgogICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImQtZmxleCBqdXN0aWZ5LWNvbnRlbnQtYmV0d2VlbiBhbGlnbi1pdGVtcy1jZW50ZXIgcC0zIGJnLWxpZ2h0IGJvcmRlci1ib3R0b20gY3Vyc29yLXBvaW50ZXJcIiAKICAgICAgICAgICAgICAgICAgICAgc3R5bGU9XCJjdXJzb3I6IHBvaW50ZXI7XCIKICAgICAgICAgICAgICAgICAgICAgb25jbGljaz1cInRvZ2dsZUdyb3VwZWRTZWN0aW9uKCcke2NvbGxhcHNlSWR9JylcIj4KICAgICAgICAgICAgICAgICAgICA8aDYgY2xhc3M9XCJtYi0wXCI+CiAgICAgICAgICAgICAgICAgICAgICAgIDxpIGNsYXNzPVwiZmFzIGZhLWNoZXZyb24tJHtpc0V4cGFuZGVkID8gJ2Rvd24nIDogJ3JpZ2h0J30gbWUtMlwiIGlkPVwiaWNvbi0ke2NvbGxhcHNlSWR9XCI+PC9pPgogICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzcz1cImJhZGdlIGJhZGdlLSR7c3RhdHVzQ29sb3J9IG1lLTJcIj4ke3N0YXR1c308L3NwYW4+CiAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzPVwidGV4dC1tdXRlZFwiPiR7cmVjb3Jkcy5sZW5ndGh9IGF0dGVuZGVlczwvc3Bhbj4KICAgICAgICAgICAgICAgICAgICA8L2g2PgogICAgICAgICAgICAgICAgPC9kaXY+CiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY29sbGFwc2UgJHtpc0V4cGFuZGVkID8gJ3Nob3cnIDogJyd9XCIgaWQ9XCIke2NvbGxhcHNlSWR9XCI+CiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInRhYmxlLXJlc3BvbnNpdmVcIj4KICAgICAgICAgICAgICAgICAgICAgICAgPHRhYmxlIGNsYXNzPVwidGFibGUgdGFibGUtc20gdGFibGUtaG92ZXIgbWItMFwiPgogICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRoZWFkIGNsYXNzPVwidGhlYWQtbGlnaHRcIj4KICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dHI+CiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0aD5OYW1lPC90aD4KICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRoPlNlY3Rpb248L3RoPgogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGg+RXZlbnQ8L3RoPgogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGg+RGF0ZTwvdGg+CiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0aD5TdGF0dXM8L3RoPgogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdHI+CiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3RoZWFkPgogICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRib2R5PgogICAgICAgIGApOwoKICAgICAgICAvLyBCYXRjaCBwcm9jZXNzIHJlY29yZHMgZm9yIGJldHRlciBwZXJmb3JtYW5jZQogICAgICAgIGNvbnN0IGJhdGNoU2l6ZSA9IDUwOwogICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcmVjb3Jkcy5sZW5ndGg7IGkgKz0gYmF0Y2hTaXplKSB7CiAgICAgICAgICAgIGNvbnN0IGJhdGNoID0gcmVjb3Jkcy5zbGljZShpLCBpICsgYmF0Y2hTaXplKTsKICAgICAgICAgICAgYmF0Y2guZm9yRWFjaChhdHRlbmRlZSA9PiB7CiAgICAgICAgICAgICAgICBodG1sUGFydHMucHVzaChgCiAgICAgICAgICAgICAgICAgICAgPHRyPgogICAgICAgICAgICAgICAgICAgICAgICA8dGQ+CiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3Ryb25nPiR7YXR0ZW5kZWUuZmlyc3RuYW1lIHx8ICcnfSAke2F0dGVuZGVlLmxhc3RuYW1lIHx8ICcnfTwvc3Ryb25nPgogICAgICAgICAgICAgICAgICAgICAgICA8L3RkPgogICAgICAgICAgICAgICAgICAgICAgICA8dGQ+CiAgICAgICAgICAgICAgICAgICAgICAgICAgICAke2F0dGVuZGVlLnNlY3Rpb25uYW1lIHx8ICctJ30KICAgICAgICAgICAgICAgICAgICAgICAgPC90ZD4KICAgICAgICAgICAgICAgICAgICAgICAgPHRkPgogICAgICAgICAgICAgICAgICAgICAgICAgICAgJHthdHRlbmRlZS5fZXZlbnROYW1lIHx8ICctJ30KICAgICAgICAgICAgICAgICAgICAgICAgPC90ZD4KICAgICAgICAgICAgICAgICAgICAgICAgPHRkPgogICAgICAgICAgICAgICAgICAgICAgICAgICAgJHthdHRlbmRlZS5fZXZlbnREYXRlIHx8ICctJ30KICAgICAgICAgICAgICAgICAgICAgICAgPC90ZD4KICAgICAgICAgICAgICAgICAgICAgICAgPHRkPgogICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3M9XCJiYWRnZSBiYWRnZS0ke3N0YXR1c0NvbG9yfVwiPiR7c3RhdHVzfTwvc3Bhbj4KICAgICAgICAgICAgICAgICAgICAgICAgPC90ZD4KICAgICAgICAgICAgICAgICAgICA8L3RyPgogICAgICAgICAgICAgICAgYCk7CiAgICAgICAgICAgIH0pOwogICAgICAgIH0KCiAgICAgICAgaHRtbFBhcnRzLnB1c2goYAogICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90Ym9keT4KICAgICAgICAgICAgICAgICAgICAgICAgPC90YWJsZT4KICAgICAgICAgICAgICAgICAgICA8L2Rpdj4KICAgICAgICAgICAgICAgIDwvZGl2PgogICAgICAgICAgICA8L2Rpdj4KICAgICAgICBgKTsKICAgIH0pOwoKICAgIC8vIFNpbmdsZSBET00gdXBkYXRlIGZvciBiZXR0ZXIgcGVyZm9ybWFuY2UKICAgIGdyb3VwZWRDb250ZW50LmlubmVySFRNTCA9IGh0bWxQYXJ0cy5qb2luKCcnKTsKfQoKLy8gVG9nZ2xlIGdyb3VwZWQgc2VjdGlvbiAoc2VwYXJhdGUgZnJvbSBtYWluIHRvZ2dsZSB0byBhdm9pZCBjb25mbGljdHMpCmZ1bmN0aW9uIHRvZ2dsZUdyb3VwZWRTZWN0aW9uKGNvbGxhcHNlSWQpIHsKICAgIGNvbnN0IGNvbGxhcHNlRWxlbWVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGNvbGxhcHNlSWQpOwogICAgY29uc3QgaWNvbiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGBpY29uLSR7Y29sbGFwc2VJZH1gKTsKICAgIAogICAgaWYgKGNvbGxhcHNlRWxlbWVudCAmJiBpY29uKSB7CiAgICAgICAgaWYgKGNvbGxhcHNlRWxlbWVudC5jbGFzc0xpc3QuY29udGFpbnMoJ3Nob3cnKSkgewogICAgICAgICAgICBjb2xsYXBzZUVsZW1lbnQuY2xhc3NMaXN0LnJlbW92ZSgnc2hvdycpOwogICAgICAgICAgICBpY29uLmNsYXNzTGlzdC5yZW1vdmUoJ2ZhLWNoZXZyb24tZG93bicpOwogICAgICAgICAgICBpY29uLmNsYXNzTGlzdC5hZGQoJ2ZhLWNoZXZyb24tcmlnaHQnKTsKICAgICAgICB9IGVsc2UgewogICAgICAgICAgICBjb2xsYXBzZUVsZW1lbnQuY2xhc3NMaXN0LmFkZCgnc2hvdycpOwogICAgICAgICAgICBpY29uLmNsYXNzTGlzdC5yZW1vdmUoJ2ZhLWNoZXZyb24tcmlnaHQnKTsKICAgICAgICAgICAgaWNvbi5jbGFzc0xpc3QuYWRkKCdmYS1jaGV2cm9uLWRvd24nKTsKICAgICAgICB9CiAgICB9Cn0KCi8vIE1ha2UgZ3JvdXBlZCB0b2dnbGUgZnVuY3Rpb24gZ2xvYmFsbHkgYXZhaWxhYmxlCndpbmRvdy50b2dnbGVHcm91cGVkU2VjdGlvbiA9IHRvZ2dsZUdyb3VwZWRTZWN0aW9uOwoKLy8gUmVuZGVyIGF0dGVuZGFuY2UgcmVjb3JkcyBncm91cGVkIGJ5IHN0YXR1cwpmdW5jdGlvbiByZW5kZXJHcm91cGVkQXR0ZW5kZWVzVGFibGUoYXR0ZW5kZWVzKSB7CiAgICBjb25zdCBhdHRlbmRhbmNlUGFuZWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYXR0ZW5kYW5jZS1wYW5lbCcpOwogICAgaWYgKCFhdHRlbmRhbmNlUGFuZWwpIHJldHVybjsKCiAgICAvLyBHcm91cCBhdHRlbmRlZXMgYnkgc3RhdHVzIChhc3N1bWluZyB0aGVyZSdzIGEgc3RhdHVzIGZpZWxkKQogICAgY29uc3QgZ3JvdXBlZEF0dGVuZGVlcyA9IHt9OwogICAgYXR0ZW5kZWVzLmZvckVhY2goYXR0ZW5kZWUgPT4gewogICAgICAgIGNvbnN0IHN0YXR1cyA9IGF0dGVuZGVlLmF0dGVuZGluZyB8fCBhdHRlbmRlZS5zdGF0dXMgfHwgJ1Vua25vd24nOwogICAgICAgIGlmICghZ3JvdXBlZEF0dGVuZGVlc1tzdGF0dXNdKSB7CiAgICAgICAgICAgIGdyb3VwZWRBdHRlbmRlZXNbc3RhdHVzXSA9IFtdOwogICAgICAgIH0KICAgICAgICBncm91cGVkQXR0ZW5kZWVzW3N0YXR1c10ucHVzaChhdHRlbmRlZSk7CiAgICB9KTsKCiAgICAvLyBTb3J0IHN0YXR1c2VzIHdpdGggY3VzdG9tIHByaW9yaXR5OiBZZXMsIE5vLCBJbnZpdGVkLCB0aGVuIGFscGhhYmV0aWNhbAogICAgY29uc3Qgc3RhdHVzUHJpb3JpdHkgPSB7ICdZZXMnOiAxLCAnTm8nOiAyLCAnSW52aXRlZCc6IDMgfTsKICAgIGNvbnN0IHNvcnRlZFN0YXR1c2VzID0gT2JqZWN0LmtleXMoZ3JvdXBlZEF0dGVuZGVlcykuc29ydCgoYSwgYikgPT4gewogICAgICAgIGNvbnN0IHByaW9yaXR5QSA9IHN0YXR1c1ByaW9yaXR5W2FdIHx8IDk5OTsKICAgICAgICBjb25zdCBwcmlvcml0eUIgPSBzdGF0dXNQcmlvcml0eVtiXSB8fCA5OTk7CiAgICAgICAgCiAgICAgICAgaWYgKHByaW9yaXR5QSAhPT0gcHJpb3JpdHlCKSB7CiAgICAgICAgICAgIHJldHVybiBwcmlvcml0eUEgLSBwcmlvcml0eUI7CiAgICAgICAgfQogICAgICAgIAogICAgICAgIC8vIElmIHNhbWUgcHJpb3JpdHkgKGJvdGggdW5rbm93biksIHNvcnQgYWxwaGFiZXRpY2FsbHkKICAgICAgICByZXR1cm4gYS5sb2NhbGVDb21wYXJlKGIpOwogICAgfSk7CgogICAgbGV0IHRhYmxlSHRtbCA9IGAKICAgICAgICA8ZGl2IGNsYXNzPVwiY2FyZCBzaGFkb3ctc20gaC0xMDBcIj4KICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNhcmQtaGVhZGVyIGJnLWluZm8gdGV4dC13aGl0ZVwiPgogICAgICAgICAgICAgICAgPGg1IGNsYXNzPVwibWItMFwiPgogICAgICAgICAgICAgICAgICAgIDxpIGNsYXNzPVwiZmFzIGZhLXVzZXJzXCI+PC9pPiAKICAgICAgICAgICAgICAgICAgICBBdHRlbmRhbmNlIFJlY29yZHMKICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzcz1cImJhZGdlIGJhZGdlLWxpZ2h0IHRleHQtZGFyayBtcy0yXCI+JHthdHRlbmRlZXMubGVuZ3RofSB0b3RhbDwvc3Bhbj4KICAgICAgICAgICAgICAgIDwvaDU+CiAgICAgICAgICAgIDwvZGl2PgogICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY2FyZC1ib2R5IHAtMFwiPgogICAgYDsKCiAgICBpZiAoc29ydGVkU3RhdHVzZXMubGVuZ3RoID09PSAwKSB7CiAgICAgICAgdGFibGVIdG1sICs9IGAKICAgICAgICAgICAgPGRpdiBjbGFzcz1cInRleHQtY2VudGVyIHB5LTRcIj4KICAgICAgICAgICAgICAgIDxpIGNsYXNzPVwiZmFzIGZhLWluZm8tY2lyY2xlIHRleHQtbXV0ZWRcIiBzdHlsZT1cImZvbnQtc2l6ZTogMnJlbTtcIj48L2k+CiAgICAgICAgICAgICAgICA8cCBjbGFzcz1cInRleHQtbXV0ZWQgbXQtMlwiPk5vIGF0dGVuZGFuY2UgcmVjb3JkcyBmb3VuZC48L3A+CiAgICAgICAgICAgIDwvZGl2PgogICAgICAgIGA7CiAgICB9IGVsc2UgewogICAgICAgIHNvcnRlZFN0YXR1c2VzLmZvckVhY2goKHN0YXR1cywgaW5kZXgpID0+IHsKICAgICAgICAgICAgY29uc3QgcmVjb3JkcyA9IGdyb3VwZWRBdHRlbmRlZXNbc3RhdHVzXTsKICAgICAgICAgICAgY29uc3QgaXNFeHBhbmRlZCA9IGluZGV4ID09PSAwOyAvLyBGaXJzdCBncm91cCBleHBhbmRlZCBieSBkZWZhdWx0CiAgICAgICAgICAgIGNvbnN0IGNvbGxhcHNlSWQgPSBgY29sbGFwc2UtJHtzdGF0dXMucmVwbGFjZSgvXFxzKy9nLCAnLScpLnRvTG93ZXJDYXNlKCl9YDsKICAgICAgICAgICAgCiAgICAgICAgICAgIC8vIEdldCBzdGF0dXMgY29sb3IgYmFzZWQgb24gYXR0ZW5kYW5jZSB2YWx1ZQogICAgICAgICAgICBjb25zdCBzdGF0dXNDb2xvciA9IGdldFN0YXR1c0NvbG9yKHN0YXR1cyk7CiAgICAgICAgICAgIAogICAgICAgICAgICB0YWJsZUh0bWwgKz0gYAogICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImJvcmRlci1ib3R0b21cIj4KICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiZC1mbGV4IGp1c3RpZnktY29udGVudC1iZXR3ZWVuIGFsaWduLWl0ZW1zLWNlbnRlciBwLTMgYmctbGlnaHQgYm9yZGVyLWJvdHRvbSBjdXJzb3ItcG9pbnRlclwiIAogICAgICAgICAgICAgICAgICAgICAgICAgc3R5bGU9XCJjdXJzb3I6IHBvaW50ZXI7XCIKICAgICAgICAgICAgICAgICAgICAgICAgIG9uY2xpY2s9XCJ0b2dnbGVHcm91cCgnJHtjb2xsYXBzZUlkfScpXCI+CiAgICAgICAgICAgICAgICAgICAgICAgIDxoNiBjbGFzcz1cIm1iLTBcIj4KICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxpIGNsYXNzPVwiZmFzIGZhLWNoZXZyb24tJHtpc0V4cGFuZGVkID8gJ2Rvd24nIDogJ3JpZ2h0J30gbWUtMlwiIGlkPVwiaWNvbi0ke2NvbGxhcHNlSWR9XCI+PC9pPgogICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3M9XCJiYWRnZSBiYWRnZS0ke3N0YXR1c0NvbG9yfSBtZS0yXCI+JHtzdGF0dXN9PC9zcGFuPgogICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3M9XCJ0ZXh0LW11dGVkXCI+JHtyZWNvcmRzLmxlbmd0aH0gYXR0ZW5kZWVzPC9zcGFuPgogICAgICAgICAgICAgICAgICAgICAgICA8L2g2PgogICAgICAgICAgICAgICAgICAgIDwvZGl2PgogICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjb2xsYXBzZSAke2lzRXhwYW5kZWQgPyAnc2hvdycgOiAnJ31cIiBpZD1cIiR7Y29sbGFwc2VJZH1cIj4KICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInRhYmxlLXJlc3BvbnNpdmVcIj4KICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0YWJsZSBjbGFzcz1cInRhYmxlIHRhYmxlLXNtIHRhYmxlLWhvdmVyIG1iLTBcIj4KICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGhlYWQgY2xhc3M9XCJ0aGVhZC1saWdodFwiPgogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dHI+CiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGg+TmFtZTwvdGg+CiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGg+U2VjdGlvbjwvdGg+CiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGg+RXZlbnQ8L3RoPgogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRoPkRhdGU8L3RoPgogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRoPlN0YXR1czwvdGg+CiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdHI+CiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90aGVhZD4KICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGJvZHk+CiAgICAgICAgICAgIGA7CgogICAgICAgICAgICByZWNvcmRzLmZvckVhY2goYXR0ZW5kZWUgPT4gewogICAgICAgICAgICAgICAgdGFibGVIdG1sICs9IGAKICAgICAgICAgICAgICAgICAgICA8dHI+CiAgICAgICAgICAgICAgICAgICAgICAgIDx0ZD4KICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzdHJvbmc+JHthdHRlbmRlZS5maXJzdG5hbWUgfHwgJyd9ICR7YXR0ZW5kZWUubGFzdG5hbWUgfHwgJyd9PC9zdHJvbmc+CiAgICAgICAgICAgICAgICAgICAgICAgIDwvdGQ+CiAgICAgICAgICAgICAgICAgICAgICAgIDx0ZD4KICAgICAgICAgICAgICAgICAgICAgICAgICAgICR7YXR0ZW5kZWUuc2VjdGlvbm5hbWUgfHwgJy0nfQogICAgICAgICAgICAgICAgICAgICAgICA8L3RkPgogICAgICAgICAgICAgICAgICAgICAgICA8dGQ+CiAgICAgICAgICAgICAgICAgICAgICAgICAgICAke2F0dGVuZGVlLl9ldmVudE5hbWUgfHwgJy0nfQogICAgICAgICAgICAgICAgICAgICAgICA8L3RkPgogICAgICAgICAgICAgICAgICAgICAgICA8dGQ+CiAgICAgICAgICAgICAgICAgICAgICAgICAgICAke2F0dGVuZGVlLl9ldmVudERhdGUgfHwgJy0nfQogICAgICAgICAgICAgICAgICAgICAgICA8L3RkPgogICAgICAgICAgICAgICAgICAgICAgICA8dGQ+CiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzcz1cImJhZGdlIGJhZGdlLSR7c3RhdHVzQ29sb3J9XCI+JHtzdGF0dXN9PC9zcGFuPgogICAgICAgICAgICAgICAgICAgICAgICA8L3RkPgogICAgICAgICAgICAgICAgICAgIDwvdHI+CiAgICAgICAgICAgICAgICBgOwogICAgICAgICAgICB9KTsKCiAgICAgICAgICAgIHRhYmxlSHRtbCArPSBgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90Ym9keT4KICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdGFibGU+CiAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PgogICAgICAgICAgICAgICAgICAgIDwvZGl2PgogICAgICAgICAgICAgICAgPC9kaXY+CiAgICAgICAgICAgIGA7CiAgICAgICAgfSk7CiAgICB9CgogICAgdGFibGVIdG1sICs9IGAKICAgICAgICAgICAgPC9kaXY+CiAgICAgICAgPC9kaXY+CiAgICBgOwoKICAgIGF0dGVuZGFuY2VQYW5lbC5pbm5lckhUTUwgPSB0YWJsZUh0bWw7Cn0KCi8vIEdldCBiYWRnZSBjb2xvciBiYXNlZCBvbiBhdHRlbmRhbmNlIHN0YXR1cwpmdW5jdGlvbiBnZXRTdGF0dXNDb2xvcihzdGF0dXMpIHsKICAgIHN3aXRjaCAoc3RhdHVzPy50b0xvd2VyQ2FzZSgpKSB7CiAgICAgICAgY2FzZSAneWVzJzoKICAgICAgICBjYXNlICdhdHRlbmRlZCc6CiAgICAgICAgY2FzZSAncHJlc2VudCc6CiAgICAgICAgICAgIHJldHVybiAnc3VjY2Vzcyc7CiAgICAgICAgY2FzZSAnbm8nOgogICAgICAgIGNhc2UgJ2Fic2VudCc6CiAgICAgICAgY2FzZSAnbm90IGF0dGVuZGVkJzoKICAgICAgICAgICAgcmV0dXJuICdkYW5nZXInOwogICAgICAgIGNhc2UgJ21heWJlJzoKICAgICAgICBjYXNlICd1bmtub3duJzoKICAgICAgICAgICAgcmV0dXJuICd3YXJuaW5nJzsKICAgICAgICBkZWZhdWx0OgogICAgICAgICAgICByZXR1cm4gJ3NlY29uZGFyeSc7CiAgICB9Cn0KCi8vIFRvZ2dsZSBncm91cCBleHBhbmQvY29sbGFwc2UKZnVuY3Rpb24gdG9nZ2xlR3JvdXAoY29sbGFwc2VJZCkgewogICAgY29uc3QgY29sbGFwc2VFbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoY29sbGFwc2VJZCk7CiAgICBjb25zdCBpY29uID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoYGljb24tJHtjb2xsYXBzZUlkfWApOwogICAgCiAgICBpZiAoY29sbGFwc2VFbGVtZW50ICYmIGljb24pIHsKICAgICAgICBpZiAoY29sbGFwc2VFbGVtZW50LmNsYXNzTGlzdC5jb250YWlucygnc2hvdycpKSB7CiAgICAgICAgICAgIGNvbGxhcHNlRWxlbWVudC5jbGFzc0xpc3QucmVtb3ZlKCdzaG93Jyk7CiAgICAgICAgICAgIGljb24uY2xhc3NMaXN0LnJlbW92ZSgnZmEtY2hldnJvbi1kb3duJyk7CiAgICAgICAgICAgIGljb24uY2xhc3NMaXN0LmFkZCgnZmEtY2hldnJvbi1yaWdodCcpOwogICAgICAgIH0gZWxzZSB7CiAgICAgICAgICAgIGNvbGxhcHNlRWxlbWVudC5jbGFzc0xpc3QuYWRkKCdzaG93Jyk7CiAgICAgICAgICAgIGljb24uY2xhc3NMaXN0LnJlbW92ZSgnZmEtY2hldnJvbi1yaWdodCcpOwogICAgICAgICAgICBpY29uLmNsYXNzTGlzdC5hZGQoJ2ZhLWNoZXZyb24tZG93bicpOwogICAgICAgIH0KICAgIH0KfQoKLy8gTWFrZSB0b2dnbGUgZnVuY3Rpb24gZ2xvYmFsbHkgYXZhaWxhYmxlCndpbmRvdy50b2dnbGVHcm91cCA9IHRvZ2dsZUdyb3VwOwoKLy8gUmVuZGVyIGZsZXhpIHJlY29yZHMgZ3JvdXBlZCBieSBzdGF0dXMKZnVuY3Rpb24gcmVuZGVyRmxleGlSZWNvcmRzVGFibGUoZmxleGlSZWNvcmRzLCBzZWN0aW9uTmFtZSkgewogICAgY29uc3QgYXR0ZW5kYW5jZVBhbmVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2F0dGVuZGFuY2UtcGFuZWwnKTsKICAgIGlmICghYXR0ZW5kYW5jZVBhbmVsKSByZXR1cm47CgogICAgLy8gR3JvdXAgcmVjb3JkcyBieSBzdGF0dXMKICAgIGNvbnN0IGdyb3VwZWRSZWNvcmRzID0ge307CiAgICBmbGV4aVJlY29yZHMuZm9yRWFjaChyZWNvcmQgPT4gewogICAgICAgIGNvbnN0IHN0YXR1cyA9IHJlY29yZC5zdGF0dXMgfHwgJ1Vua25vd24nOwogICAgICAgIGlmICghZ3JvdXBlZFJlY29yZHNbc3RhdHVzXSkgewogICAgICAgICAgICBncm91cGVkUmVjb3Jkc1tzdGF0dXNdID0gW107CiAgICAgICAgfQogICAgICAgIGdyb3VwZWRSZWNvcmRzW3N0YXR1c10ucHVzaChyZWNvcmQpOwogICAgfSk7CgogICAgLy8gU29ydCBzdGF0dXNlcyBmb3IgY29uc2lzdGVudCBkaXNwbGF5CiAgICBjb25zdCBzb3J0ZWRTdGF0dXNlcyA9IE9iamVjdC5rZXlzKGdyb3VwZWRSZWNvcmRzKS5zb3J0KCk7CgogICAgbGV0IHRhYmxlSHRtbCA9IGAKICAgICAgICA8ZGl2IGNsYXNzPVwiY2FyZCBzaGFkb3ctc20gaC0xMDBcIj4KICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNhcmQtaGVhZGVyIGJnLXN1Y2Nlc3MgdGV4dC13aGl0ZVwiPgogICAgICAgICAgICAgICAgPGg1IGNsYXNzPVwibWItMFwiPgogICAgICAgICAgICAgICAgICAgIDxpIGNsYXNzPVwiZmFzIGZhLWxpc3QtYWx0XCI+PC9pPiAKICAgICAgICAgICAgICAgICAgICBGbGV4aSBSZWNvcmRzIC0gJHtzZWN0aW9uTmFtZX0KICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzcz1cImJhZGdlIGJhZGdlLWxpZ2h0IHRleHQtZGFyayBtcy0yXCI+JHtmbGV4aVJlY29yZHMubGVuZ3RofSB0b3RhbDwvc3Bhbj4KICAgICAgICAgICAgICAgIDwvaDU+CiAgICAgICAgICAgIDwvZGl2PgogICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY2FyZC1ib2R5IHAtMFwiPgogICAgYDsKCiAgICBpZiAoc29ydGVkU3RhdHVzZXMubGVuZ3RoID09PSAwKSB7CiAgICAgICAgdGFibGVIdG1sICs9IGAKICAgICAgICAgICAgPGRpdiBjbGFzcz1cInRleHQtY2VudGVyIHB5LTRcIj4KICAgICAgICAgICAgICAgIDxpIGNsYXNzPVwiZmFzIGZhLWluZm8tY2lyY2xlIHRleHQtbXV0ZWRcIiBzdHlsZT1cImZvbnQtc2l6ZTogMnJlbTtcIj48L2k+CiAgICAgICAgICAgICAgICA8cCBjbGFzcz1cInRleHQtbXV0ZWQgbXQtMlwiPk5vIGZsZXhpIHJlY29yZHMgZm91bmQgZm9yIHRoaXMgc2VjdGlvbi48L3A+CiAgICAgICAgICAgIDwvZGl2PgogICAgICAgIGA7CiAgICB9IGVsc2UgewogICAgICAgIHNvcnRlZFN0YXR1c2VzLmZvckVhY2goKHN0YXR1cywgaW5kZXgpID0+IHsKICAgICAgICAgICAgY29uc3QgcmVjb3JkcyA9IGdyb3VwZWRSZWNvcmRzW3N0YXR1c107CiAgICAgICAgICAgIGNvbnN0IGlzRXhwYW5kZWQgPSBpbmRleCA9PT0gMDsgLy8gRmlyc3QgZ3JvdXAgZXhwYW5kZWQgYnkgZGVmYXVsdAogICAgICAgICAgICBjb25zdCBjb2xsYXBzZUlkID0gYGNvbGxhcHNlLSR7c3RhdHVzLnJlcGxhY2UoL1xccysvZywgJy0nKS50b0xvd2VyQ2FzZSgpfWA7CiAgICAgICAgICAgIAogICAgICAgICAgICB0YWJsZUh0bWwgKz0gYAogICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImJvcmRlci1ib3R0b21cIj4KICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiZC1mbGV4IGp1c3RpZnktY29udGVudC1iZXR3ZWVuIGFsaWduLWl0ZW1zLWNlbnRlciBwLTMgYmctbGlnaHQgYm9yZGVyLWJvdHRvbSBjdXJzb3ItcG9pbnRlclwiIAogICAgICAgICAgICAgICAgICAgICAgICAgZGF0YS1icy10b2dnbGU9XCJjb2xsYXBzZVwiIAogICAgICAgICAgICAgICAgICAgICAgICAgZGF0YS10YXJnZXQ9XCIjJHtjb2xsYXBzZUlkfVwiIAogICAgICAgICAgICAgICAgICAgICAgICAgYXJpYS1leHBhbmRlZD1cIiR7aXNFeHBhbmRlZH1cIiAKICAgICAgICAgICAgICAgICAgICAgICAgIGFyaWEtY29udHJvbHM9XCIke2NvbGxhcHNlSWR9XCIKICAgICAgICAgICAgICAgICAgICAgICAgIG9uY2xpY2s9XCJ0b2dnbGVHcm91cCgnJHtjb2xsYXBzZUlkfScpXCI+CiAgICAgICAgICAgICAgICAgICAgICAgIDxoNiBjbGFzcz1cIm1iLTBcIj4KICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxpIGNsYXNzPVwiZmFzIGZhLWNoZXZyb24tJHtpc0V4cGFuZGVkID8gJ2Rvd24nIDogJ3JpZ2h0J30gbWUtMlwiIGlkPVwiaWNvbi0ke2NvbGxhcHNlSWR9XCI+PC9pPgogICAgICAgICAgICAgICAgICAgICAgICAgICAgPHN0cm9uZz4ke3N0YXR1c308L3N0cm9uZz4KICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzPVwiYmFkZ2UgYmFkZ2UtcHJpbWFyeSBtcy0yXCI+JHtyZWNvcmRzLmxlbmd0aH08L3NwYW4+CiAgICAgICAgICAgICAgICAgICAgICAgIDwvaDY+CiAgICAgICAgICAgICAgICAgICAgPC9kaXY+CiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNvbGxhcHNlICR7aXNFeHBhbmRlZCA/ICdzaG93JyA6ICcnfVwiIGlkPVwiJHtjb2xsYXBzZUlkfVwiPgogICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwidGFibGUtcmVzcG9uc2l2ZVwiPgogICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRhYmxlIGNsYXNzPVwidGFibGUgdGFibGUtc20gdGFibGUtaG92ZXIgbWItMFwiPgogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0aGVhZCBjbGFzcz1cInRoZWFkLWxpZ2h0XCI+CiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0cj4KICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0aD5OYW1lPC90aD4KICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0aD5EYXRlIENvbXBsZXRlZDwvdGg+CiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGg+Q29tcGxldGVkIEJ5PC90aD4KICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0aD5EZXRhaWxzPC90aD4KICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90cj4KICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3RoZWFkPgogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0Ym9keT4KICAgICAgICAgICAgYDsKCiAgICAgICAgICAgIHJlY29yZHMuZm9yRWFjaChyZWNvcmQgPT4gewogICAgICAgICAgICAgICAgdGFibGVIdG1sICs9IGAKICAgICAgICAgICAgICAgICAgICA8dHI+CiAgICAgICAgICAgICAgICAgICAgICAgIDx0ZD4KICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzdHJvbmc+JHtyZWNvcmQuZmlyc3RuYW1lIHx8ICcnfSAke3JlY29yZC5sYXN0bmFtZSB8fCAnJ308L3N0cm9uZz4KICAgICAgICAgICAgICAgICAgICAgICAgICAgICR7cmVjb3JkLnNlY3Rpb24gPyBgPGJyPjxzbWFsbCBjbGFzcz1cInRleHQtbXV0ZWRcIj4ke3JlY29yZC5zZWN0aW9ufTwvc21hbGw+YCA6ICcnfQogICAgICAgICAgICAgICAgICAgICAgICA8L3RkPgogICAgICAgICAgICAgICAgICAgICAgICA8dGQ+CiAgICAgICAgICAgICAgICAgICAgICAgICAgICAke3JlY29yZC5jb21wbGV0ZWRfZGF0ZSA/IG5ldyBEYXRlKHJlY29yZC5jb21wbGV0ZWRfZGF0ZSkudG9Mb2NhbGVEYXRlU3RyaW5nKCkgOiAnLSd9CiAgICAgICAgICAgICAgICAgICAgICAgIDwvdGQ+CiAgICAgICAgICAgICAgICAgICAgICAgIDx0ZD4KICAgICAgICAgICAgICAgICAgICAgICAgICAgICR7cmVjb3JkLmNvbXBsZXRlZF9ieSB8fCAnLSd9CiAgICAgICAgICAgICAgICAgICAgICAgIDwvdGQ+CiAgICAgICAgICAgICAgICAgICAgICAgIDx0ZD4KICAgICAgICAgICAgICAgICAgICAgICAgICAgICR7cmVjb3JkLmRldGFpbHMgfHwgJy0nfQogICAgICAgICAgICAgICAgICAgICAgICAgICAgJHtyZWNvcmQuY29tbWVudHMgPyBgPGJyPjxzbWFsbCBjbGFzcz1cInRleHQtbXV0ZWRcIj4ke3JlY29yZC5jb21tZW50c308L3NtYWxsPmAgOiAnJ30KICAgICAgICAgICAgICAgICAgICAgICAgPC90ZD4KICAgICAgICAgICAgICAgICAgICA8L3RyPgogICAgICAgICAgICAgICAgYDsKICAgICAgICAgICAgfSk7CgogICAgICAgICAgICB0YWJsZUh0bWwgKz0gYAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdGJvZHk+CiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3RhYmxlPgogICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj4KICAgICAgICAgICAgICAgICAgICA8L2Rpdj4KICAgICAgICAgICAgICAgIDwvZGl2PgogICAgICAgICAgICBgOwogICAgICAgIH0pOwogICAgfQoKICAgIHRhYmxlSHRtbCArPSBgCiAgICAgICAgICAgIDwvZGl2PgogICAgICAgIDwvZGl2PgogICAgYDsKCiAgICBhdHRlbmRhbmNlUGFuZWwuaW5uZXJIVE1MID0gdGFibGVIdG1sOwp9CgovLyBTaG93IGJsb2NrZWQgc2NyZWVuIHdoZW4gT1NNIEFQSSBhY2Nlc3MgaXMgYmxvY2tlZApmdW5jdGlvbiBzaG93QmxvY2tlZFNjcmVlbigpIHsKICAgIGNvbnN0IG1haW5Db250YWluZXIgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdtYWluLmNvbnRhaW5lcicpIHx8IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ21haW4nKTsKICAgIGlmICghbWFpbkNvbnRhaW5lcikgewogICAgICAgIGNvbnNvbGUuZXJyb3IoJ01haW4gY29udGFpbmVyIG5vdCBmb3VuZCBmb3IgYmxvY2tlZCBzY3JlZW4nKTsKICAgICAgICByZXR1cm47CiAgICB9CiAgICAKICAgIGRvY3VtZW50LmJvZHkuY2xhc3NMaXN0LmFkZCgnbG9naW4tc2NyZWVuJyk7CiAgICB1cGRhdGVTaWRlYmFyVG9nZ2xlVmlzaWJpbGl0eSgpOwogICAgCiAgICBtYWluQ29udGFpbmVyLnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snOwogICAgbWFpbkNvbnRhaW5lci5jbGFzc05hbWUgPSAnY29udGFpbmVyJzsKICAgIG1haW5Db250YWluZXIuaW5uZXJIVE1MID0gYAogICAgICAgIDxkaXYgY2xhc3M9XCJyb3cganVzdGlmeS1jb250ZW50LWNlbnRlclwiPgogICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY29sLTEyIGNvbC1zbS0xMCBjb2wtbWQtOCBjb2wtbGctNlwiPgogICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNhcmQgc2hhZG93IGJvcmRlci1kYW5nZXIgbWItNFwiPgogICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjYXJkLWhlYWRlciBiZy1kYW5nZXIgdGV4dC13aGl0ZSB0ZXh0LWNlbnRlclwiPgogICAgICAgICAgICAgICAgICAgICAgICA8aDMgY2xhc3M9XCJtYi0wXCI+8J+aqCBDUklUSUNBTCBFUlJPUjwvaDM+CiAgICAgICAgICAgICAgICAgICAgPC9kaXY+CiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNhcmQtYm9keSB0ZXh0LWNlbnRlciBwLTRcIj4KICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImFsZXJ0IGFsZXJ0LWRhbmdlciBtYi00XCI+CiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8aDQgY2xhc3M9XCJhbGVydC1oZWFkaW5nXCI+QVBJIEFjY2VzcyBCbG9ja2VkITwvaDQ+CiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8cCBjbGFzcz1cIm1iLTBcIj4KICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBUaGlzIGFwcGxpY2F0aW9uIGhhcyBiZWVuIDxzdHJvbmc+YmxvY2tlZCBieSBPbmxpbmUgU2NvdXQgTWFuYWdlcjwvc3Ryb25nPiAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhbmQgY2FuIG5vIGxvbmdlciBhY2Nlc3MgT1NNIGRhdGEuCiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3A+CiAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PgogICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cIm1iLTRcIj4KICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxpIGNsYXNzPVwiZmFzIGZhLWJhbiB0ZXh0LWRhbmdlclwiIHN0eWxlPVwiZm9udC1zaXplOiA0cmVtO1wiPjwvaT4KICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+CiAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICA8aDUgY2xhc3M9XCJ0ZXh0LWRhbmdlciBtYi0zXCI+QXBwbGljYXRpb24gU3VzcGVuZGVkPC9oNT4KICAgICAgICAgICAgICAgICAgICAgICAgPHAgY2xhc3M9XCJ0ZXh0LW11dGVkIG1iLTRcIj4KICAgICAgICAgICAgICAgICAgICAgICAgICAgIEFsbCBBUEkgZnVuY3Rpb25hbGl0eSBoYXMgYmVlbiBkaXNhYmxlZCB0byBwcmV2ZW50IGZ1cnRoZXIgaXNzdWVzLiAKICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzdHJvbmc+UGxlYXNlIGNvbnRhY3QgdGhlIHN5c3RlbSBhZG1pbmlzdHJhdG9yIGltbWVkaWF0ZWx5Ljwvc3Ryb25nPgogICAgICAgICAgICAgICAgICAgICAgICA8L3A+CiAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiYmctbGlnaHQgcC0zIHJvdW5kZWQgbWItNFwiPgogICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNtYWxsIGNsYXNzPVwidGV4dC1tdXRlZFwiPgogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzdHJvbmc+QmxvY2tlZCBhdDo8L3N0cm9uZz4gJHtuZXcgRGF0ZSgpLnRvTG9jYWxlU3RyaW5nKCl9PGJyPgogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzdHJvbmc+U2Vzc2lvbiBJRDo8L3N0cm9uZz4gJHtzZXNzaW9uU3RvcmFnZS5nZXRJdGVtKCdhY2Nlc3NfdG9rZW4nKT8uc3Vic3RyaW5nKDAsIDEyKSB8fCAnTi9BJ30uLi4KICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvc21hbGw+CiAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PgogICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvbiBvbmNsaWNrPVwiYWxlcnQoJ0FwcGxpY2F0aW9uIGlzIGJsb2NrZWQuIENvbnRhY3QgYWRtaW5pc3RyYXRvciB0byByZXNvbHZlIHRoaXMgaXNzdWUuJylcIiAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzcz1cImJ0biBidG4tZGFuZ2VyIGJ0bi1sZyBkaXNhYmxlZCBtYi0zXCI+CiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8aSBjbGFzcz1cImZhcyBmYS1iYW4gbWUtMlwiPjwvaT4KICAgICAgICAgICAgICAgICAgICAgICAgICAgIEFwcGxpY2F0aW9uIEJsb2NrZWQKICAgICAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+CiAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwibXQtM1wiPgogICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNtYWxsIGNsYXNzPVwidGV4dC1tdXRlZFwiPgogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxhIGhyZWY9XCIjXCIgb25jbGljaz1cImlmKGNvbmZpcm0oJ0NsZWFyIGJsb2NrZWQgc3RhdHVzPyBPbmx5IGRvIHRoaXMgaWYgYWRtaW5pc3RyYXRvciBoYXMgcmVzb2x2ZWQgdGhlIGlzc3VlLicpKSB7IHNlc3Npb25TdG9yYWdlLnJlbW92ZUl0ZW0oJ29zbV9ibG9ja2VkJyk7IHdpbmRvdy5sb2NhdGlvbi5yZWxvYWQoKTsgfVwiIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzPVwidGV4dC1zZWNvbmRhcnlcIj4KICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgQWRtaW46IENsZWFyIEJsb2NrZWQgU3RhdHVzCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9hPgogICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9zbWFsbD4KICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+CiAgICAgICAgICAgICAgICAgICAgPC9kaXY+CiAgICAgICAgICAgICAgICA8L2Rpdj4KICAgICAgICAgICAgPC9kaXY+CiAgICAgICAgPC9kaXY+CiAgICBgOwp9CgovLyBBZGQgdGhlIG1pc3NpbmcgY2hlY2tGb3JUb2tlbiBmdW5jdGlvbiBiZWZvcmUgeW91ciBET01Db250ZW50TG9hZGVkIGxpc3RlbmVyOgoKYXN5bmMgZnVuY3Rpb24gY2hlY2tGb3JUb2tlbigpIHsKICAgIGNvbnNvbGUubG9nKCdDaGVja2luZyBmb3IgdG9rZW4uLi4nKTsKICAgIAogICAgLy8gQ2hlY2sgaWYgYXBwbGljYXRpb24gaGFzIGJlZW4gYmxvY2tlZCBmaXJzdAogICAgaWYgKHNlc3Npb25TdG9yYWdlLmdldEl0ZW0oJ29zbV9ibG9ja2VkJykgPT09ICd0cnVlJykgewogICAgICAgIGNvbnNvbGUuZXJyb3IoJ/CfmqggQXBwbGljYXRpb24gaXMgYmxvY2tlZCAtIHNob3dpbmcgYmxvY2tlZCBzY3JlZW4nKTsKICAgICAgICBzaG93QmxvY2tlZFNjcmVlbigpOwogICAgICAgIHJldHVybjsKICAgIH0KICAgIAogICAgLy8gU2hvdyBsb2FkaW5nIHN0YXRlIGluc3RlYWQgb2YgbG9naW4gc2NyZWVuIGluaXRpYWxseQogICAgc2hvd0xvYWRpbmdTdGF0ZSgpOwogICAgCiAgICB0cnkgewogICAgICAgIC8vIENoZWNrIGlmIHdlIGhhdmUgYSB2YWxpZCB0b2tlbgogICAgICAgIGNvbnN0IHRva2VuID0gZ2V0VG9rZW4oKTsKICAgICAgICBpZiAodG9rZW4pIHsKICAgICAgICAgICAgY29uc29sZS5sb2coJ1Rva2VuIGZvdW5kLCB0ZXN0aW5nIHZhbGlkaXR5Li4uJyk7CiAgICAgICAgICAgIC8vIFRlc3QgdGhlIHRva2VuIGJ5IG1ha2luZyBhIHF1aWNrIEFQSSBjYWxsCiAgICAgICAgICAgIGF3YWl0IGdldFVzZXJSb2xlcygpOwogICAgICAgICAgICBjb25zb2xlLmxvZygnVG9rZW4gaXMgdmFsaWQsIHNob3dpbmcgbWFpbiBVSScpOwogICAgICAgICAgICBkb2N1bWVudC5ib2R5LmNsYXNzTGlzdC5yZW1vdmUoJ2xvZ2luLXNjcmVlbicpOwogICAgICAgICAgICB1cGRhdGVTaWRlYmFyVG9nZ2xlVmlzaWJpbGl0eSgpOwogICAgICAgICAgICBzaG93TWFpblVJKCk7CiAgICAgICAgfSBlbHNlIHsKICAgICAgICAgICAgY29uc29sZS5sb2coJ05vIHRva2VuIGZvdW5kLCBzaG93aW5nIGxvZ2luJyk7CiAgICAgICAgICAgIGRvY3VtZW50LmJvZHkuY2xhc3NMaXN0LmFkZCgnbG9naW4tc2NyZWVuJyk7CiAgICAgICAgICAgIHVwZGF0ZVNpZGViYXJUb2dnbGVWaXNpYmlsaXR5KCk7CiAgICAgICAgICAgIHNob3dMb2dpblNjcmVlbigpOwogICAgICAgIH0KICAgIH0gY2F0Y2ggKGVycm9yKSB7CiAgICAgICAgY29uc29sZS5lcnJvcignVG9rZW4gdmFsaWRhdGlvbiBmYWlsZWQ6JywgZXJyb3IpOwogICAgICAgIC8vIENsZWFyIGludmFsaWQgdG9rZW4gYW5kIHNob3cgbG9naW4KICAgICAgICBzZXNzaW9uU3RvcmFnZS5yZW1vdmVJdGVtKCdhY2Nlc3NfdG9rZW4nKTsKICAgICAgICBkb2N1bWVudC5ib2R5LmNsYXNzTGlzdC5hZGQoJ2xvZ2luLXNjcmVlbicpOwogICAgICAgIHVwZGF0ZVNpZGViYXJUb2dnbGVWaXNpYmlsaXR5KCk7CiAgICAgICAgc2hvd0xvZ2luU2NyZWVuKCk7CiAgICB9Cn0KCmZ1bmN0aW9uIHNob3dMb2FkaW5nU3RhdGUoKSB7CiAgICBjb25zdCBtYWluQ29udGFpbmVyID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignbWFpbi5jb250YWluZXInKSB8fCBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdtYWluJyk7CiAgICBpZiAoIW1haW5Db250YWluZXIpIHsKICAgICAgICBjb25zb2xlLmVycm9yKCdNYWluIGNvbnRhaW5lciBub3QgZm91bmQgZm9yIGxvYWRpbmcgc3RhdGUnKTsKICAgICAgICByZXR1cm47CiAgICB9CiAgICAKICAgIC8vIE1ha2UgY29udGFpbmVyIHZpc2libGUgYW5kIHNob3cgbG9hZGluZwogICAgbWFpbkNvbnRhaW5lci5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJzsKICAgIG1haW5Db250YWluZXIuaW5uZXJIVE1MID0gYAogICAgICAgIDxkaXYgY2xhc3M9XCJyb3cganVzdGlmeS1jb250ZW50LWNlbnRlclwiPgogICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY29sLTEyIGNvbC1zbS04IGNvbC1tZC02IGNvbC1sZy00XCI+CiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY2FyZCBzaGFkb3ctc20gbWItNFwiPgogICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjYXJkLWJvZHkgdGV4dC1jZW50ZXJcIj4KICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInNwaW5uZXItYm9yZGVyIHRleHQtcHJpbWFyeSBtYi0zXCIgcm9sZT1cInN0YXR1c1wiPgogICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3M9XCJzci1vbmx5XCI+TG9hZGluZy4uLjwvc3Bhbj4KICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+CiAgICAgICAgICAgICAgICAgICAgICAgIDxwIGNsYXNzPVwidGV4dC1tdXRlZFwiPkxvYWRpbmcgYXBwbGljYXRpb24uLi48L3A+CiAgICAgICAgICAgICAgICAgICAgPC9kaXY+CiAgICAgICAgICAgICAgICA8L2Rpdj4KICAgICAgICAgICAgPC9kaXY+CiAgICAgICAgPC9kaXY+CiAgICBgOwp9CgovLyBNYWtlIHN1cmUgeW91ciBET01Db250ZW50TG9hZGVkIGxpc3RlbmVyIGxvb2tzIGxpa2UgdGhpczoKCmRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ0RPTUNvbnRlbnRMb2FkZWQnLCBhc3luYyBmdW5jdGlvbiBpbml0aWFsaXplQXBwKCkgewogICAgdHJ5IHsKICAgICAgICAvLyBIaWRlIG1haW4gY29udGFpbmVyIGluaXRpYWxseSB0byBwcmV2ZW50IGZsYXNoCiAgICAgICAgY29uc3QgbWFpbkNvbnRhaW5lciA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ21haW4uY29udGFpbmVyJykgfHwgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignbWFpbicpOwogICAgICAgIGlmIChtYWluQ29udGFpbmVyKSB7CiAgICAgICAgICAgIG1haW5Db250YWluZXIuc3R5bGUuZGlzcGxheSA9ICdub25lJzsKICAgICAgICB9CiAgICAgICAgCiAgICAgICAgLy8gU2V0IHRoZSBwcmVmZXJyZWQgc3Bpbm5lciB0eXBlCiAgICAgICAgc2V0RGVmYXVsdFNwaW5uZXIoUFJFRkVSUkVEX1NQSU5ORVIpOwogICAgICAgIAogICAgICAgIC8vIENoZWNrIGZvciBlbGVtZW50cyB0aGF0IHNob3VsZCBleGlzdAogICAgICAgIGlmICghbWFpbkNvbnRhaW5lcikgewogICAgICAgICAgICBjb25zb2xlLmVycm9yKCdNYWluIGNvbnRhaW5lciBub3QgZm91bmQnKTsKICAgICAgICAgICAgcmV0dXJuOwogICAgICAgIH0KICAgICAgICAKICAgICAgICAvLyBEb24ndCBzZXQgdXAgbG9naW4gYnV0dG9uIGltbWVkaWF0ZWx5IC0gbGV0IGNoZWNrRm9yVG9rZW4gZGVjaWRlIHdoYXQgdG8gc2hvdwogICAgICAgIC8vIENoZWNrIGZvciB0b2tlbiBhbmQgc2hvdyBhcHByb3ByaWF0ZSBVSQogICAgICAgIGF3YWl0IGNoZWNrRm9yVG9rZW4oKTsKICAgICAgICAKICAgIH0gY2F0Y2ggKGVycm9yKSB7CiAgICAgICAgY29uc29sZS5lcnJvcignQXBwIGluaXRpYWxpemF0aW9uIGZhaWxlZDonLCBlcnJvcik7CiAgICAgICAgc2hvd0ZhbGxiYWNrRXJyb3IoKTsKICAgIH0KfSk7CgpmdW5jdGlvbiBzaG93RmFsbGJhY2tFcnJvcigpIHsKICAgIGNvbnN0IGJvZHkgPSBkb2N1bWVudC5ib2R5OwogICAgaWYgKGJvZHkpIHsKICAgICAgICBjb25zdCBlcnJvckRpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpOwogICAgICAgIGVycm9yRGl2LmlubmVySFRNTCA9IGAKICAgICAgICAgICAgPGRpdiBzdHlsZT1cInBvc2l0aW9uOiBmaXhlZDsgdG9wOiA1MCU7IGxlZnQ6IDUwJTsgdHJhbnNmb3JtOiB0cmFuc2xhdGUoLTUwJSwgLTUwJSk7IAogICAgICAgICAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kOiB3aGl0ZTsgcGFkZGluZzogMnJlbTsgYm9yZGVyLXJhZGl1czogOHB4OyBib3gtc2hhZG93OiAwIDRweCAxMnB4IHJnYmEoMCwwLDAsMC4xNSk7CiAgICAgICAgICAgICAgICAgICAgICAgIHRleHQtYWxpZ246IGNlbnRlcjsgbWF4LXdpZHRoOiA0MDBweDtcIj4KICAgICAgICAgICAgICAgIDxoMyBzdHlsZT1cImNvbG9yOiAjZGMzNTQ1OyBtYXJnaW4tYm90dG9tOiAxcmVtO1wiPkFwcGxpY2F0aW9uIEVycm9yPC9oMz4KICAgICAgICAgICAgICAgIDxwIHN0eWxlPVwibWFyZ2luLWJvdHRvbTogMS41cmVtO1wiPkZhaWxlZCB0byBsb2FkIHRoZSBhcHBsaWNhdGlvbi4gUGxlYXNlIHJlZnJlc2ggdGhlIHBhZ2UuPC9wPgogICAgICAgICAgICAgICAgPGJ1dHRvbiBvbmNsaWNrPVwid2luZG93LmxvY2F0aW9uLnJlbG9hZCgpXCIgCiAgICAgICAgICAgICAgICAgICAgICAgIHN0eWxlPVwicGFkZGluZzogMC43NXJlbSAxLjVyZW07IGJhY2tncm91bmQ6ICMwMDdiZmY7IGNvbG9yOiB3aGl0ZTsgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBib3JkZXI6IG5vbmU7IGJvcmRlci1yYWRpdXM6IDRweDsgY3Vyc29yOiBwb2ludGVyO1wiPgogICAgICAgICAgICAgICAgICAgIFJlZnJlc2ggUGFnZQogICAgICAgICAgICAgICAgPC9idXR0b24+CiAgICAgICAgICAgIDwvZGl2PgogICAgICAgIGA7CiAgICAgICAgYm9keS5hcHBlbmRDaGlsZChlcnJvckRpdik7CiAgICB9Cn0KCmFzeW5jIGZ1bmN0aW9uIHZhbGlkYXRlVG9rZW5BbmRTaG93VUkoKSB7CiAgICB0cnkgewogICAgICAgIC8vIE1ha2UgYSBxdWljayBBUEkgY2FsbCB0byB0ZXN0IHRoZSB0b2tlbgogICAgICAgIGNvbnN0IHJvbGVzID0gYXdhaXQgZ2V0VXNlclJvbGVzKCk7CiAgICAgICAgaWYgKHJvbGVzICYmIHJvbGVzLmxlbmd0aCA+PSAwKSB7CiAgICAgICAgICAgIC8vIFRva2VuIGlzIHZhbGlkLCBzaG93IG1haW4gVUkKICAgICAgICAgICAgc2hvd01haW5VSSgpOwogICAgICAgIH0gZWxzZSB7CiAgICAgICAgICAgIC8vIFRva2VuIGludmFsaWQsIHNob3cgbG9naW4KICAgICAgICAgICAgc2hvd0xvZ2luU2NyZWVuKCk7CiAgICAgICAgfQogICAgfSBjYXRjaCAoZXJyb3IpIHsKICAgICAgICBjb25zb2xlLmxvZygnVG9rZW4gdmFsaWRhdGlvbiBmYWlsZWQ6JywgZXJyb3IpOwogICAgICAgIC8vIENsZWFyIGludmFsaWQgdG9rZW4gYW5kIHNob3cgbG9naW4KICAgICAgICBzZXNzaW9uU3RvcmFnZS5yZW1vdmVJdGVtKCdhY2Nlc3NfdG9rZW4nKTsKICAgICAgICBzaG93TG9naW5TY3JlZW4oKTsKICAgIH0KfSJdfQo=
