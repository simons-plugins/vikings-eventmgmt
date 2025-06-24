// src/ui.js
// This module serves as a central hub for managing common UI elements and interactions
// across the application. It includes functions for:
// - Displaying various types of loading spinners.
// - Showing and hiding modal-like elements (e.g., error toasts).
// - Rendering skeleton loaders as content placeholders.
// - Generating HTML tables for displaying data (e.g., sections, events).
// - Controlling main UI layout components, such as the sidebar and its behavior.
// - Handling specific UI states like API blocked screens or initial loading messages.

// Configuration object for different loading animation styles.
const SPINNER_TYPES = {
    DOTS: 'dots',    // A modern, pulsing dots animation.
    RING: 'ring',    // A classic spinning ring animation.
    GRADIENT: 'gradient' // A vibrant, colorful gradient spinner.
};

// Stores the currently selected default spinner type.
// This can be changed by the application (e.g., from main.js based on preferences).
let currentSpinnerType = SPINNER_TYPES.DOTS; // Default to 'dots'.

// --- Imports for UI functions ---
// Corrected paths for when ui.js is in src/ui.js
import { loadSectionsFromCacheOrAPI } from './lib/cache.js';
import { addLogoutButton } from './lib/auth.js';

// Allows changing the default loading animation style used by showSpinner.
// type: A string matching one of the keys in SPINNER_TYPES.
export function setDefaultSpinner(type) {
    if (Object.values(SPINNER_TYPES).includes(type)) {
        currentSpinnerType = type;
        console.log(`Loading animation set to: ${type}`);
    } else {
        console.warn(`Invalid spinner type: ${type}. Using default: ${currentSpinnerType}`);
    }
}

// Displays a loading overlay with a spinner and optional text.
// text: Custom text to display below the spinner.
// spinnerType: The type of spinner animation to use (defaults to currentSpinnerType).
export function showSpinner(text = 'Loading...', spinnerType = currentSpinnerType) {
    const overlay = document.getElementById('loading-overlay');
    if (!overlay) {
        // If the main loading overlay element isn't found in the DOM,
        // create and display a simpler fallback spinner directly in the body.
        console.warn('Loading overlay not found, creating fallback spinner');
        createFallbackSpinner(text); // Create a temporary, full-screen spinner.
        return;
    }
    const textEl = overlay.querySelector('.loading-text');
    const spinnerContainer = overlay.querySelector('#spinner-container');
    if (textEl) textEl.textContent = text; // Update the loading text.
    if (spinnerContainer) {
        spinnerContainer.innerHTML = ''; // Clear previous spinner.
        const spinner = createSpinner(spinnerType); // Create the new spinner element.
        spinnerContainer.appendChild(spinner);
    }
    overlay.style.display = 'flex'; // Make the overlay visible.
    overlay.style.opacity = '0'; // Start with opacity 0 for fade-in effect.
    // Use a short timeout to allow the display change to render, then transition opacity.
    setTimeout(() => {
        overlay.style.opacity = '0.9'; // Fade in to 90% opacity.
    }, 50);
}

// Hides the loading overlay with a fade-out effect.
export function hideSpinner() {
    const overlay = document.getElementById('loading-overlay');
    if (!overlay) {
        // If the main overlay isn't found, attempt to remove any fallback spinner.
        const fallback = document.getElementById('fallback-spinner');
        if (fallback) document.body.removeChild(fallback);
        return;
    }
    overlay.style.opacity = '0'; // Fade out the overlay.
    // After the opacity transition completes (300ms), set display to 'none'.
    setTimeout(() => {
        overlay.style.display = 'none';
    }, 300);
}

// Internal helper function to create a simple, full-screen fallback spinner
// when the main 'loading-overlay' element is not available.
function createFallbackSpinner(text) {
    const existing = document.getElementById('fallback-spinner');
    if (existing) return; // Avoid creating multiple fallbacks.
    const fallback = document.createElement('div');
    fallback.id = 'fallback-spinner';
    // Basic styling for the fallback spinner.
    fallback.style.cssText = `position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(255, 255, 255, 0.95); display: flex; align-items: center; justify-content: center; z-index: 9999; flex-direction: column;`;
    fallback.innerHTML = `<div style="width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #007bff; border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 1rem;"></div><div style="color: #6c757d; font-size: 0.9rem;">${text}</div>`;
    document.body.appendChild(fallback);
}

// Internal helper function to generate the HTML element for a specific spinner type.
// type: A string matching one of the keys in SPINNER_TYPES.
function createSpinner(type) {
    const spinner = document.createElement('div');
    // Assign CSS class based on the spinner type to apply the correct animation.
    switch (type) {
        case SPINNER_TYPES.DOTS: spinner.className = 'modern-spinner'; break;
        case SPINNER_TYPES.RING: spinner.className = 'ring-spinner'; break;
        case SPINNER_TYPES.GRADIENT: spinner.className = 'gradient-spinner'; break;
        default: spinner.className = 'modern-spinner'; // Fallback to default.
    }
    return spinner;
}

// Displays a skeleton loader in a specified container or a default one.
// Skeleton loaders provide a visual placeholder while content is being loaded,
// improving perceived performance.
// container: The DOM element where the skeleton loader HTML should be injected.
export function showSkeletonLoader(container) {
    if (container) {
        // If a specific container is provided, fill it with skeleton UI.
        container.innerHTML = `<div class="skeleton-card"><div class="skeleton-header"></div><div class="skeleton-line"></div><div class="skeleton-line short"></div><div class="skeleton-line"></div><div class="skeleton-line short"></div><div class="skeleton-line"></div></div>`;
    } else {
        // Otherwise, try to show a generic, pre-existing skeleton loader element.
        const skeleton = document.getElementById('skeleton-loader');
        if(skeleton) skeleton.style.display = 'block';
    }
}

// Hides a generic, pre-existing skeleton loader element.
export function hideSkeletonLoader() {
    const skeleton = document.getElementById('skeleton-loader');
    if (skeleton) skeleton.style.display = 'none';
}

// Sets the visual state of a button to indicate loading.
// buttonId: The ID of the button element.
// loading: Boolean, true to show loading state, false to restore normal state.
// text: Optional text to display on the button while loading.
export function setButtonLoading(buttonId, loading = true, text = 'Loading...') {
    const button = document.getElementById(buttonId);
    if (!button) return; // Do nothing if button not found.

    if (loading) {
        button.classList.add('btn-loading'); // Add a class for styling loading state.
        button.disabled = true; // Disable the button.
        // Store original content if not already stored, then set loading text.
        if (!button.dataset.originalContent) button.dataset.originalContent = button.innerHTML;
        button.innerHTML = `<span class="btn-text">${text}</span>`;
    } else {
        button.classList.remove('btn-loading'); // Remove loading class.
        button.disabled = false; // Re-enable the button.
        // Restore original content if it was stored.
        if (button.dataset.originalContent) {
            button.innerHTML = button.dataset.originalContent;
            delete button.dataset.originalContent; // Clean up stored data.
        }
    }
}

// Displays a non-blocking toast-like notification for errors.
// msg: The error message to display.
export function showError(msg) {
    const toast = document.createElement('div');
    toast.className = 'error-toast'; // CSS class for styling.
    // Structure of the toast notification.
    toast.innerHTML = `<div class="error-toast-content"><i class="fas fa-exclamation-circle"></i><span>${msg}</span><button class="error-toast-close">&times;</button></div>`;
    document.body.appendChild(toast); // Add toast to the DOM.
    // Show the toast with a slight delay for CSS transition.
    setTimeout(() => toast.classList.add('show'), 10);
    // Automatically hide and remove the toast after 5 seconds.
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 300); // Remove after fade out.
    }, 5000);
    // Allow manual closing of the toast.
    toast.querySelector('.error-toast-close').addEventListener('click', () => {
        toast.classList.remove('show');
        setTimeout(() => { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 300);
    });
}

// Renders a table of sections in the specified container.
// sections: An array of section objects to display.
// onSelectionChange: Callback function invoked when section checkboxes are changed.
export function renderSectionsTable(sections, onSelectionChange) {
    let container = document.getElementById('sections-table-container');
    if (!container) { /* ... error handling or dynamic creation ... */ return; }

    // Table HTML structure, including a refresh button.
    // The refresh button clears the local cache and re-fetches sections from the API.
    let html = `<div class="mb-3"><div class="d-flex justify-content-end mb-2"><button class="btn btn-outline-secondary btn-sm" onclick="clearSectionsCache(); loadSectionsFromCacheOrAPI();" title="Refresh sections from API"><i class="fas fa-sync"></i></button></div><table id="sections-table" class="table table-striped table-sm"><thead><tr><th style="width: 40px;"></th><th>Section Name</th></tr></thead><tbody>`;
    sections.forEach(section => {
        const sectionId = section.sectionid || section.id || 'unknown'; // Handle potential variations in ID field name.
        const sectionName = section.sectionname || section.name || 'Unknown Section'; // Handle potential variations in name field.
        // Each row has a checkbox and the section name.
        html += `<tr><td><input type="checkbox" class="section-checkbox" value="${sectionId}"></td><td>${sectionName}</td></tr>`;
    });
    html += `</tbody></table></div>`;
    container.innerHTML = html; // Inject the HTML into the container.

    // Add event listeners to the newly created checkboxes.
    const checkboxes = container.querySelectorAll('.section-checkbox');
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            // When a checkbox state changes, gather all selected section IDs.
            const selectedSections = Array.from(container.querySelectorAll('.section-checkbox:checked')).map(cb => cb.value);
            if (selectedSections.length > 0) {
                // If there are selected sections, call the onSelectionChange callback with their IDs.
                onSelectionChange(selectedSections);
            } else {
                // If no sections are selected, clear the events table container.
                const eventsContainer = document.getElementById('events-table-container');
                if (eventsContainer) eventsContainer.innerHTML = `<div class="text-center text-muted py-3"><i class="fas fa-calendar-alt"></i><p class="mb-0 mt-2">Select sections to view events</p></div>`;
            }
        });
    });
}

// Renders a table of events, adapting the layout for mobile or desktop views.
// events: An array of event objects to display.
// onLoadAttendees: Callback function invoked when event checkboxes are changed.
// forceMobileLayout: Boolean to force mobile layout regardless of screen width (for testing/consistency).
export function renderEventsTable(events, onLoadAttendees, forceMobileLayout = false) {
    let container = document.getElementById('events-table-container');
    if (!container) { /* ... error handling or dynamic creation ... */ return; }

    const isMobile = window.innerWidth <= 767 || forceMobileLayout; // Determine if mobile layout should be used.
    let html;

    if (isMobile) {
        // Mobile layout: fewer columns, expandable rows for more details.
        html = `<div class="table-responsive"><table id="events-table" class="table table-striped table-sm"><thead><tr><th style="width: 40px;"></th><th style="width: 70px;" class="text-center">Total</th><th>Event Details</th><th style="width: 40px;"><i class="fas fa-expand-alt" title="Tap rows to expand"></i></th></tr></thead><tbody>`;
        events.forEach((event, idx) => {
            const totalYes = event.yes || 0;
            const totalNo = event.no || 0;
            // Checkbox, totals, event name/section/date, and an expand icon.
            html += `<tr>
                <td><input type="checkbox" class="event-checkbox" data-idx="${idx}"></td>
                <td class="text-center">
                    <div class="d-flex flex-column">
                        <span class="text-success fw-bold">${totalYes}</span>
                        <span class="text-danger small">${totalNo}</span>
                    </div>
                </td>
                <td>
                    <div class="fw-bold">${event.name || ''}</div>
                    <small class="text-muted">${event.sectionname || ''}</small>
                    <br><small class="text-muted">${event.date || ''}</small>
                </td>
                <td class="text-center">
                    <span class="expand-icon">▼</span>
                </td>
            </tr>`;
        });
    } else {
        // Desktop layout: more columns with detailed attendance breakdown.
        html = `<div class="table-responsive"><table id="events-table" class="table table-striped table-sm"><thead><tr><th style="width: 40px;"></th><th style="min-width: 120px;" data-sort="sectionname">Section</th><th style="min-width: 150px;" data-sort="name">Event Name</th><th style="min-width: 100px;" data-sort="date">Date</th><th style="min-width: 60px;" data-sort="yes">Yes</th><th style="min-width: 80px;" data-sort="yes_members">Members</th><th style="min-width: 60px;" data-sort="yes_yls">YLs</th><th style="min-width: 80px;" data-sort="yes_leaders">Leaders</th><th style="min-width: 60px;" data-sort="no">No</th></tr></thead><tbody>`;
        events.forEach((event, idx) => {
            html += `<tr>
                <td><input type="checkbox" class="event-checkbox" data-idx="${idx}"></td>
                <td class="text-nowrap">${event.sectionname||''}</td>
                <td class="event-name-cell">${event.name||''}</td>
                <td class="text-nowrap">${event.date||''}</td>
                <td class="text-center">${event.yes||0}</td>
                <td class="text-center">${event.yes_members||0}</td>
                <td class="text-center">${event.yes_yls||0}</td>
                <td class="text-center">${event.yes_leaders||0}</td>
                <td class="text-center">${event.no||0}</td>
            </tr>`;
        });
    }
    html += `</tbody></table></div>`;
    container.innerHTML = html; // Inject table HTML.

    // Mobile expansion functionality would go here if needed
    container.eventsData = events; // Store event data on the container for easy access.

    // Add event listeners to event checkboxes.
    const checkboxes = container.querySelectorAll('.event-checkbox');
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            // When a checkbox changes, gather all selected event objects.
            const selectedEvents = Array.from(container.querySelectorAll('.event-checkbox:checked'))
                .map(cb => events[parseInt(cb.dataset.idx)]); // Retrieve event object using stored index.
            if (selectedEvents.length > 0) {
                // If events are selected, call the onLoadAttendees callback.
                onLoadAttendees(selectedEvents);
            }
        });
    });
}

// --- General UI Functions (previously in main.js, then attendance.js, now correctly in ui.js) ---

// Sets up the primary application interface after successful login.
// This includes creating the main content area and initializing the sidebar.
export function showMainUI() {
    const mainContainer = document.querySelector('main');
    if (!mainContainer) { console.error('Main container not found'); return; }
    // Basic structure for the main content area, including a placeholder for attendance details.
    mainContainer.innerHTML = `<div class="container-fluid p-0"><div class="row no-gutters"><div class="col-12"><div id="app-content"><div id="attendance-panel" class="mt-4"><div class="card shadow-sm h-100"><div class="card-header bg-info text-white"><h5 class="mb-0">Attendance Details</h5></div><div class="card-body"><p class="text-muted text-center">Use the sidebar to load sections and events, then view attendance details here.</p></div></div></div></div></div></div>`;

    initializeSidebar(); // Set up sidebar functionality.

    // Ensure sidebar content area exists, recreate if necessary (e.g., after login screen).
    const sidebarContent = document.querySelector('.sidebar-content');
    if (!sidebarContent) {
        console.warn('Sidebar content not found, recreating...');
        const sidebar = document.getElementById('sidebar');
        if (sidebar) {
            sidebar.innerHTML = `<div class="sidebar-header"><h3>Sections & Events</h3></div><div class="sidebar-content"><div id="sections-table-container"></div><div id="events-table-container" class="mt-3"></div></div>`;
        }
    }
    addLogoutButton(); // Add the logout button to the sidebar.
    console.log('Main UI initialized - ready for sidebar interaction');
}

// Internal helper function for showMainUI to set up sidebar interactions.
// This includes the toggle button, overlay, and event listeners for opening/closing.
function initializeSidebar() {
    const sidebar = document.getElementById('sidebar');
    const toggleBtn = document.getElementById('sidebarToggle');
    const overlay = document.getElementById('sidebarOverlay'); // Overlay for closing sidebar on click outside.
    if (!sidebar || !toggleBtn) { console.warn('Sidebar elements not found for initialization.'); return; }
    
    // Function to close the sidebar.
    function closeSidebar() {
        sidebar.classList.remove('open'); // CSS class controls visibility/animation.
        document.body.classList.remove('sidebar-open'); // Body class for potential global styles.
        if (overlay) overlay.classList.remove('show'); // Hide overlay.
        toggleBtn.style.left = '1rem'; // Reset toggle button position.
    }
    
    // Event listener for the sidebar toggle button.
    toggleBtn.addEventListener('click', () => {
        if (sidebar.classList.contains('open')) {
            closeSidebar();
        } else {
            sidebar.classList.add('open');
            document.body.classList.add('sidebar-open');
            if (overlay) overlay.classList.add('show');
            // Adjust toggle button position when sidebar is open for better UX.
            toggleBtn.style.left = '340px'; // Assuming sidebar width is around 320-340px.
        }
    });
    
    // Event listener for the overlay (closes sidebar on click).
    if (overlay) overlay.addEventListener('click', closeSidebar);
    
    // Event listener for clicks outside the sidebar (closes sidebar).
    document.addEventListener('click', (e) => {
        if (
            sidebar.classList.contains('open') && // Sidebar is open
            !sidebar.contains(e.target) &&      // Click was outside the sidebar
            e.target !== toggleBtn &&           // Click was not on the toggle button itself
            !toggleBtn.contains(e.target)       // Click was not within the toggle button
        ) {
            closeSidebar();
        }
    });
    
    // Event listener for 'Escape' key to close the sidebar.
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && sidebar.classList.contains('open')) {
            closeSidebar();
        }
    });
}

// Shows or hides the sidebar toggle button based on whether the login screen is active.
// The toggle button should typically be hidden on the login screen.
export function updateSidebarToggleVisibility() {
    const sidebarToggle = document.getElementById('sidebarToggle');
    if (sidebarToggle) {
        const isLoginScreen = document.body.classList.contains('login-screen');
        console.log('Updating sidebar toggle visibility:', { isLoginScreen, element: sidebarToggle });
        sidebarToggle.style.display = isLoginScreen ? 'none' : 'block';
    }
}

// Renders a prominent error message and UI state when API access has been blocked by OSM.
// This is a critical state, and the UI reflects this by disabling most functionality.
export function showBlockedScreen() {
    const mainContainer = document.querySelector('main.container') || document.querySelector('main');
    if (!mainContainer) { console.error('Main container not found for blocked screen'); return; }
    document.body.classList.add('login-screen'); // Use login screen styling for consistency.
    updateSidebarToggleVisibility(); // Hide sidebar toggle.
    mainContainer.style.display = 'block';
    mainContainer.className = 'container'; // Ensure consistent container styling.
    // HTML for the blocked screen, including error messages and an admin option to clear status.
    mainContainer.innerHTML = `<div class="row justify-content-center"><div class="col-12 col-sm-10 col-md-8 col-lg-6"><div class="card shadow border-danger mb-4"><div class="card-header bg-danger text-white text-center"><h3 class="mb-0">🚨 CRITICAL ERROR</h3></div><div class="card-body text-center p-4"><div class="alert alert-danger mb-4"><h4 class="alert-heading">API Access Blocked!</h4><p class="mb-0">This application has been <strong>blocked by Online Scout Manager</strong> and can no longer access OSM data.</p></div><div class="mb-4"><i class="fas fa-ban text-danger" style="font-size: 4rem;"></i></div><h5 class="text-danger mb-3">Application Suspended</h5><p class="text-muted mb-4">All API functionality has been disabled. <strong>Contact admin.</strong></p><div class="bg-light p-3 rounded mb-4"><small class="text-muted"><strong>Blocked at:</strong> ${new Date().toLocaleString()}<br><strong>Session ID:</strong> ${sessionStorage.getItem('access_token')?.substring(0, 12) || 'N/A'}...</small></div><button onclick="alert('Application is blocked. Contact administrator.')" class="btn btn-danger btn-lg disabled mb-3"><i class="fas fa-ban me-2"></i>Application Blocked</button><div class="mt-3"><small class="text-muted"><a href="#" onclick="if(confirm('Clear blocked status?')) { sessionStorage.removeItem('osm_blocked'); window.location.reload(); }" class="text-secondary">Admin: Clear Blocked Status</a></small></div></div></div></div></div>`;
}

// Displays a simple loading message within the main container.
// Typically used during initial application load or authentication checks before the main UI is ready.
export function showLoadingState() {
    const mainContainer = document.querySelector('main.container') || document.querySelector('main');
    if (!mainContainer) { console.error('Main container not found for loading state'); return; }
    mainContainer.style.display = 'block';
    // Simple HTML structure with a spinner and loading text.
    mainContainer.innerHTML = `<div class="row justify-content-center"><div class="col-12 col-sm-8 col-md-6 col-lg-4"><div class="card shadow-sm mb-4"><div class="card-body text-center"><div class="spinner-border text-primary mb-3" role="status"><span class="sr-only">Loading...</span></div><p class="text-muted">Loading application...</p></div></div></div></div>`;
}



// Make functions globally available for onclick handlers
window.loadSectionsFromCacheOrAPI = loadSectionsFromCacheOrAPI;
