// ===== LOADING ANIMATION CONFIGURATION =====
// Choose your preferred loading animation:
// 'dots' = Pulsing dots (minimal, clean)
// 'ring' = Spinning ring (classic, smooth)
// 'gradient' = Colorful gradient spinner (modern, vibrant)
const PREFERRED_SPINNER = 'ring'; // Change this to your preference

// Initialize error monitoring
import './sentry.js';

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

// Render original summary attendance table (original renderAttendeesTable)
function renderSummaryAttendanceTable(attendees) {
    const summaryContent = document.getElementById('summary-content');
    if (!summaryContent) return;

    let tableHtml = `
        <div class="table-responsive">
            <table class="table table-striped table-hover mb-0">
                <thead class="thead-dark">
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

    if (attendees.length === 0) {
        tableHtml += `
            <tr>
                <td colspan="5" class="text-center py-4">
                    <i class="fas fa-info-circle text-muted" style="font-size: 2rem;"></i>
                    <p class="text-muted mt-2">No attendance records found.</p>
                </td>
            </tr>
        `;
    } else {
        attendees.forEach(attendee => {
            const status = attendee.attending || attendee.status || 'Unknown';
            const statusColor = getStatusColor(status);
            
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
    }

    tableHtml += `
                </tbody>
            </table>
        </div>
    `;

    summaryContent.innerHTML = tableHtml;
}

// Render grouped attendance table (renamed for clarity)
function renderGroupedAttendanceTable(attendees) {
    const groupedContent = document.getElementById('grouped-content');
    if (!groupedContent) return;

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

    let tableHtml = '';

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
            const collapseId = `grouped-collapse-${status.replace(/\s+/g, '-').toLowerCase()}`;
            
            // Get status color based on attendance value
            const statusColor = getStatusColor(status);
            
            tableHtml += `
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

    groupedContent.innerHTML = tableHtml;
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