// Configuration object for spinner types
const SPINNER_TYPES = {
    DOTS: 'dots',
    RING: 'ring', 
    GRADIENT: 'gradient'
};

// Default spinner type - will be set from main.js
let currentSpinnerType = SPINNER_TYPES.DOTS;

// --- Imports for UI functions ---
// Corrected paths for when ui.js is in src/ui.js
import { loadSectionsFromCacheOrAPI } from '../lib/cache.js';
import { addLogoutButton } from '../lib/auth.js';

// Function to change default spinner type
export function setDefaultSpinner(type) {
    if (Object.values(SPINNER_TYPES).includes(type)) {
        currentSpinnerType = type;
        console.log(`Loading animation set to: ${type}`);
    } else {
        console.warn(`Invalid spinner type: ${type}. Using default: ${currentSpinnerType}`);
    }
}

// Updated showSpinner function
export function showSpinner(text = 'Loading...', spinnerType = currentSpinnerType) {
    const overlay = document.getElementById('loading-overlay');
    if (!overlay) {
        console.warn('Loading overlay not found, creating fallback spinner');
        createFallbackSpinner(text);
        return;
    }
    const textEl = overlay.querySelector('.loading-text');
    const spinnerContainer = overlay.querySelector('#spinner-container');
    if (textEl) textEl.textContent = text;
    if (spinnerContainer) {
        spinnerContainer.innerHTML = '';
        const spinner = createSpinner(spinnerType);
        spinnerContainer.appendChild(spinner);
    }
    overlay.style.display = 'flex';
    overlay.style.opacity = '0';
    setTimeout(() => {
        overlay.style.opacity = '0.9';
    }, 50);
}

export function hideSpinner() {
    const overlay = document.getElementById('loading-overlay');
    if (!overlay) {
        const fallback = document.getElementById('fallback-spinner');
        if (fallback) document.body.removeChild(fallback);
        return;
    }
    overlay.style.opacity = '0';
    setTimeout(() => {
        overlay.style.display = 'none';
    }, 300);
}

function createFallbackSpinner(text) { // Internal helper
    const existing = document.getElementById('fallback-spinner');
    if (existing) return;
    const fallback = document.createElement('div');
    fallback.id = 'fallback-spinner';
    fallback.style.cssText = `position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(255, 255, 255, 0.95); display: flex; align-items: center; justify-content: center; z-index: 9999; flex-direction: column;`;
    fallback.innerHTML = `<div style="width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #007bff; border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 1rem;"></div><div style="color: #6c757d; font-size: 0.9rem;">${text}</div>`;
    document.body.appendChild(fallback);
}

function createSpinner(type) { // Internal helper
    const spinner = document.createElement('div');
    switch (type) {
        case SPINNER_TYPES.DOTS: spinner.className = 'modern-spinner'; break;
        case SPINNER_TYPES.RING: spinner.className = 'ring-spinner'; break;
        case SPINNER_TYPES.GRADIENT: spinner.className = 'gradient-spinner'; break;
        default: spinner.className = 'modern-spinner';
    }
    return spinner;
}

export function showSkeletonLoader(container) {
    if (container) {
        container.innerHTML = `<div class="skeleton-card"><div class="skeleton-header"></div><div class="skeleton-line"></div><div class="skeleton-line short"></div><div class="skeleton-line"></div><div class="skeleton-line short"></div><div class="skeleton-line"></div></div>`;
    } else {
        const skeleton = document.getElementById('skeleton-loader');
        if(skeleton) skeleton.style.display = 'block';
    }
}

export function hideSkeletonLoader() {
    const skeleton = document.getElementById('skeleton-loader');
    if (skeleton) skeleton.style.display = 'none';
}

export function setButtonLoading(buttonId, loading = true, text = 'Loading...') {
    const button = document.getElementById(buttonId);
    if (!button) return;
    if (loading) {
        button.classList.add('btn-loading');
        button.disabled = true;
        if (!button.dataset.originalContent) button.dataset.originalContent = button.innerHTML;
        button.innerHTML = `<span class="btn-text">${text}</span>`;
    } else {
        button.classList.remove('btn-loading');
        button.disabled = false;
        if (button.dataset.originalContent) {
            button.innerHTML = button.dataset.originalContent;
            delete button.dataset.originalContent;
        }
    }
}

export function showError(msg) {
    const toast = document.createElement('div');
    toast.className = 'error-toast';
    toast.innerHTML = `<div class="error-toast-content"><i class="fas fa-exclamation-circle"></i><span>${msg}</span><button class="error-toast-close">&times;</button></div>`;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 300);
    }, 5000);
    toast.querySelector('.error-toast-close').addEventListener('click', () => {
        toast.classList.remove('show');
        setTimeout(() => { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 300);
    });
}

export function renderSectionsTable(sections, onSelectionChange) {
    let container = document.getElementById('sections-table-container');
    if (!container) { /* ... error handling or dynamic creation ... */ return; }
    let html = `<div class="mb-3"><div class="d-flex justify-content-end mb-2"><button class="btn btn-outline-secondary btn-sm" onclick="clearSectionsCache(); loadSectionsFromCacheOrAPI();" title="Refresh sections from API"><i class="fas fa-sync"></i></button></div><table id="sections-table" class="table table-striped table-sm"><thead><tr><th style="width: 40px;"></th><th>Section Name</th></tr></thead><tbody>`;
    sections.forEach(section => { html += `<tr><td><input type="checkbox" class="section-checkbox" value="${section.sectionid}"></td><td>${section.sectionname}</td></tr>`; });
    html += `</tbody></table></div>`;
    container.innerHTML = html;
    const checkboxes = container.querySelectorAll('.section-checkbox');
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            const selectedSections = Array.from(container.querySelectorAll('.section-checkbox:checked')).map(cb => cb.value);
            if (selectedSections.length > 0) {
                onSelectionChange(selectedSections);
            } else {
                const eventsContainer = document.getElementById('events-table-container');
                if (eventsContainer) eventsContainer.innerHTML = `<div class="text-center text-muted py-3"><i class="fas fa-calendar-alt"></i><p class="mb-0 mt-2">Select sections to view events</p></div>`;
            }
        });
    });
}

export function renderEventsTable(events, onLoadAttendees, forceMobileLayout = false) {
    let container = document.getElementById('events-table-container');
    if (!container) { /* ... error handling or dynamic creation ... */ return; }
    const isMobile = window.innerWidth <= 767 || forceMobileLayout;
    let html;
    if (isMobile) {
        html = `<div class="table-responsive"><table id="events-table" class="table table-striped table-sm"><thead><tr><th style="width: 40px;"></th><th style="width: 70px;" class="text-center">Total</th><th>Event Details</th><th style="width: 40px;"><i class="fas fa-expand-alt" title="Tap rows to expand"></i></th></tr></thead><tbody>`;
        events.forEach((event, idx) => { /* ... mobile row HTML ... */ });
    } else {
        html = `<div class="table-responsive"><table id="events-table" class="table table-striped table-sm"><thead><tr><th style="width: 40px;"></th><th style="min-width: 120px;" data-sort="sectionname">Section</th><th style="min-width: 150px;" data-sort="name">Event Name</th><th style="min-width: 100px;" data-sort="date">Date</th><th style="min-width: 60px;" data-sort="yes">Yes</th><th style="min-width: 80px;" data-sort="yes_members">Members</th><th style="min-width: 60px;" data-sort="yes_yls">YLs</th><th style="min-width: 80px;" data-sort="yes_leaders">Leaders</th><th style="min-width: 60px;" data-sort="no">No</th></tr></thead><tbody>`;
        events.forEach((event, idx) => { html += `<tr><td><input type="checkbox" class="event-checkbox" data-idx="${idx}"></td><td class="text-nowrap">${event.sectionname||''}</td><td class="event-name-cell">${event.name||''}</td><td class="text-nowrap">${event.date||''}</td><td class="text-center">${event.yes||0}</td><td class="text-center">${event.yes_members||0}</td><td class="text-center">${event.yes_yls||0}</td><td class="text-center">${event.yes_leaders||0}</td><td class="text-center">${event.no||0}</td></tr>`; });
    }
    html += `</tbody></table></div>`; // Simplified event row HTML for brevity
    container.innerHTML = html;
    if (isMobile) addMobileExpandFunctionality(); // Assuming addMobileExpandFunctionality is defined
    container.eventsData = events;
    const checkboxes = container.querySelectorAll('.event-checkbox');
    checkboxes.forEach(checkbox => { /* ... event listener ... */ });
    // addSortableHeaders('events-table', events, sortedEvents => renderEventsTable(sortedEvents, onLoadAttendees, forceMobileLayout)); // Assuming addSortableHeaders is defined
}

// Minimal addMobileExpandFunctionality (assuming it's defined elsewhere or simplified)
function addMobileExpandFunctionality() { /* ... */ }
// Minimal addSortableHeaders (assuming it's defined elsewhere or simplified)
// function addSortableHeaders(tableId, data, renderFunction) { /* ... */ }


// --- General UI Functions (previously in main.js, then attendance.js, now correctly in ui.js) ---

export function showMainUI() {
    const mainContainer = document.querySelector('main');
    if (!mainContainer) { console.error('Main container not found'); return; }
    mainContainer.innerHTML = `<div class="container-fluid p-0"><div class="row no-gutters"><div class="col-12"><div id="app-content"><div id="attendance-panel" class="mt-4"><div class="card shadow-sm h-100"><div class="card-header bg-info text-white"><h5 class="mb-0">Attendance Details</h5></div><div class="card-body"><p class="text-muted text-center">Use the sidebar to load sections and events, then view attendance details here.</p></div></div></div></div></div></div></div>`;
    initializeSidebar();
    const sidebarContent = document.querySelector('.sidebar-content');
    if (!sidebarContent) {
        console.warn('Sidebar content not found, recreating...');
        const sidebar = document.getElementById('sidebar');
        if (sidebar) {
            sidebar.innerHTML = `<div class="sidebar-header"><h3>Sections & Events</h3></div><div class="sidebar-content"><div id="sections-table-container"></div><div id="events-table-container" class="mt-3"></div></div>`;
        }
    }
    addLogoutButton(); // Imported from ../lib/auth.js
    console.log('Main UI initialized - ready for sidebar interaction');
}

function initializeSidebar() { // Internal helper for showMainUI
    const sidebar = document.getElementById('sidebar');
    const toggleBtn = document.getElementById('sidebarToggle');
    const overlay = document.getElementById('sidebarOverlay');
    if (!sidebar || !toggleBtn) { console.warn('Sidebar elements not found'); return; }
    function closeSidebar() {
        sidebar.classList.remove('open');
        document.body.classList.remove('sidebar-open');
        if (overlay) overlay.classList.remove('show');
        toggleBtn.style.left = '1rem';
    }
    toggleBtn.addEventListener('click', () => { /* ... */ }); // Simplified
    if (overlay) overlay.addEventListener('click', closeSidebar);
    document.addEventListener('click', (e) => { /* ... */ }); // Simplified
    document.addEventListener('keydown', (e) => { /* ... */ }); // Simplified
}

export function updateSidebarToggleVisibility() {
    const sidebarToggle = document.getElementById('sidebarToggle');
    if (sidebarToggle) {
        const isLoginScreen = document.body.classList.contains('login-screen');
        sidebarToggle.style.display = isLoginScreen ? 'none' : 'block';
    }
}

export function showBlockedScreen() {
    const mainContainer = document.querySelector('main.container') || document.querySelector('main');
    if (!mainContainer) { console.error('Main container not found for blocked screen'); return; }
    document.body.classList.add('login-screen');
    updateSidebarToggleVisibility();
    mainContainer.style.display = 'block';
    mainContainer.className = 'container';
    mainContainer.innerHTML = `<div class="row justify-content-center"><div class="col-12 col-sm-10 col-md-8 col-lg-6"><div class="card shadow border-danger mb-4"><div class="card-header bg-danger text-white text-center"><h3 class="mb-0">🚨 CRITICAL ERROR</h3></div><div class="card-body text-center p-4"><div class="alert alert-danger mb-4"><h4 class="alert-heading">API Access Blocked!</h4><p class="mb-0">This application has been <strong>blocked by Online Scout Manager</strong> and can no longer access OSM data.</p></div><div class="mb-4"><i class="fas fa-ban text-danger" style="font-size: 4rem;"></i></div><h5 class="text-danger mb-3">Application Suspended</h5><p class="text-muted mb-4">All API functionality has been disabled. <strong>Contact admin.</strong></p><div class="bg-light p-3 rounded mb-4"><small class="text-muted"><strong>Blocked at:</strong> ${new Date().toLocaleString()}<br><strong>Session ID:</strong> ${sessionStorage.getItem('access_token')?.substring(0, 12) || 'N/A'}...</small></div><button onclick="alert('Application is blocked. Contact administrator.')" class="btn btn-danger btn-lg disabled mb-3"><i class="fas fa-ban me-2"></i>Application Blocked</button><div class="mt-3"><small class="text-muted"><a href="#" onclick="if(confirm('Clear blocked status?')) { sessionStorage.removeItem('osm_blocked'); window.location.reload(); }" class="text-secondary">Admin: Clear Blocked Status</a></small></div></div></div></div></div>`;
}

export function showLoadingState() {
    const mainContainer = document.querySelector('main.container') || document.querySelector('main');
    if (!mainContainer) { console.error('Main container not found for loading state'); return; }
    mainContainer.style.display = 'block';
    mainContainer.innerHTML = `<div class="row justify-content-center"><div class="col-12 col-sm-8 col-md-6 col-lg-4"><div class="card shadow-sm mb-4"><div class="card-body text-center"><div class="spinner-border text-primary mb-3" role="status"><span class="sr-only">Loading...</span></div><p class="text-muted">Loading application...</p></div></div></div></div>`;
}
