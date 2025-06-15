// Configuration object for spinner types
const SPINNER_TYPES = {
    DOTS: 'dots',
    RING: 'ring', 
    GRADIENT: 'gradient'
};

// Default spinner type - will be set from main.js
let currentSpinnerType = SPINNER_TYPES.DOTS;

// --- Imports for moved functions (will be needed) ---
import { loadSectionsFromCacheOrAPI } from './lib/cache.js';
import { addLogoutButton } from './lib/auth.js';

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
    
    // Fallback if overlay doesn't exist
    if (!overlay) {
        console.warn('Loading overlay not found, creating fallback spinner');
        createFallbackSpinner(text);
        return;
    }
    
    const textEl = overlay.querySelector('.loading-text');
    const spinnerContainer = overlay.querySelector('#spinner-container');
    
    if (textEl) textEl.textContent = text;
    
    // Clear existing spinner
    if (spinnerContainer) {
        spinnerContainer.innerHTML = '';
        
        // Create the requested spinner type
        const spinner = createSpinner(spinnerType);
        spinnerContainer.appendChild(spinner);
    }
    
    // Show with smooth transition - don't hide content abruptly
    overlay.style.display = 'flex';
    overlay.style.opacity = '0';
    
    // Small delay for smoother transition
    setTimeout(() => {
        overlay.style.opacity = '0.9'; // Less opaque to show content behind
    }, 50);
}

export function hideSpinner() {
    const overlay = document.getElementById('loading-overlay');
    
    // Fallback if overlay doesn't exist
    if (!overlay) {
        const fallback = document.getElementById('fallback-spinner');
        if (fallback) {
            document.body.removeChild(fallback);
        }
        return;
    }
    
    overlay.style.opacity = '0';
    
    setTimeout(() => {
        overlay.style.display = 'none';
    }, 300);
}

// Fallback spinner creation
function createFallbackSpinner(text) {
    const existing = document.getElementById('fallback-spinner');
    if (existing) return;
    
    const fallback = document.createElement('div');
    fallback.id = 'fallback-spinner';
    fallback.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(255, 255, 255, 0.95);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        flex-direction: column;
    `;
    
    fallback.innerHTML = `
        <div style="
            width: 40px;
            height: 40px;
            border: 4px solid #f3f3f3;
            border-top: 4px solid #007bff;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-bottom: 1rem;
        "></div>
        <div style="color: #6c757d; font-size: 0.9rem;">${text}</div>
    `;
    
    document.body.appendChild(fallback);
}

function createSpinner(type) {
    const spinner = document.createElement('div');
    
    switch (type) {
        case SPINNER_TYPES.DOTS:
            spinner.className = 'modern-spinner';
            break;
        case SPINNER_TYPES.RING:
            spinner.className = 'ring-spinner';
            break;
        case SPINNER_TYPES.GRADIENT:
            spinner.className = 'gradient-spinner';
            break;
        default:
            spinner.className = 'modern-spinner'; // fallback
    }
    
    return spinner;
}

// Add skeleton loading for tables
export function showSkeletonLoader(container) {
    if (container) {
        // Create skeleton placeholder in specific container
        container.innerHTML = `
            <div class="skeleton-card">
                <div class="skeleton-header"></div>
                <div class="skeleton-line"></div>
                <div class="skeleton-line short"></div>
                <div class="skeleton-line"></div>
                <div class="skeleton-line short"></div>
                <div class="skeleton-line"></div>
            </div>
        `;
    } else {
        const skeleton = document.getElementById('skeleton-loader');
        skeleton.style.display = 'block';
    }
}

export function hideSkeletonLoader() {
    const skeleton = document.getElementById('skeleton-loader');
    if (skeleton) skeleton.style.display = 'none';
}

// Add button loading state
export function setButtonLoading(buttonId, loading = true, text = 'Loading...') {
    const button = document.getElementById(buttonId);
    if (!button) return;
    
    if (loading) {
        button.classList.add('btn-loading');
        button.disabled = true;
        // Store original content
        if (!button.dataset.originalContent) {
            button.dataset.originalContent = button.innerHTML;
        }
        button.innerHTML = `<span class="btn-text">${text}</span>`;
    } else {
        button.classList.remove('btn-loading');
        button.disabled = false;
        // Restore original content
        if (button.dataset.originalContent) {
            button.innerHTML = button.dataset.originalContent;
            delete button.dataset.originalContent;
        }
    }
}

// Update showError with modern styling
export function showError(msg) {
    // Create modern toast notification instead of basic alert
    const toast = document.createElement('div');
    toast.className = 'error-toast';
    toast.innerHTML = `
        <div class="error-toast-content">
            <i class="fas fa-exclamation-circle"></i>
            <span>${msg}</span>
            <button class="error-toast-close">&times;</button>
        </div>
    `;
    
    document.body.appendChild(toast);
    
    // Show with animation
    setTimeout(() => toast.classList.add('show'), 10);
    
    // Auto hide after 5 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => document.body.removeChild(toast), 300);
    }, 5000);
    
    // Manual close
    toast.querySelector('.error-toast-close').addEventListener('click', () => {
        toast.classList.remove('show');
        setTimeout(() => document.body.removeChild(toast), 300);
    });
}

export function renderSectionsTable(sections, onSelectionChange) {
    let container = document.getElementById('sections-table-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'sections-table-container';
        // Fix: Look for the correct parent container
        const parentContainer = document.querySelector('#sidebar .card-body') || document.getElementById('app-content');
        if (parentContainer) {
            parentContainer.appendChild(container);
        }
    }
    
    let html = `
        <div class="mb-3">
            <div class="d-flex justify-content-end mb-2">
                <button class="btn btn-outline-secondary btn-sm" onclick="clearSectionsCache(); loadSectionsFromCacheOrAPI();" title="Refresh sections from API">
                    <i class="fas fa-sync"></i>
                </button>
            </div>
            <table id="sections-table" class="table table-striped table-sm">
                <thead>
                    <tr>
                        <th style="width: 40px;"></th>
                        <th>Section Name</th>
                    </tr>
                </thead>
                <tbody>`;
    
    sections.forEach(section => {
        html += `<tr>
            <td><input type="checkbox" class="section-checkbox" value="${section.sectionid}"></td>
            <td>${section.sectionname}</td>
        </tr>`;
    });

    html += `</tbody></table>
        </div>`;
    
    container.innerHTML = html;
    
    // Add event listeners for automatic loading
    const checkboxes = container.querySelectorAll('.section-checkbox');
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            const selectedSections = Array.from(container.querySelectorAll('.section-checkbox:checked'))
                                        .map(cb => cb.value);
            
            if (selectedSections.length > 0) {
                onSelectionChange(selectedSections);
            } else {
                // Clear events table when no sections selected
                const eventsContainer = document.getElementById('events-table-container');
                if (eventsContainer) {
                    eventsContainer.innerHTML = `
                        <div class="text-center text-muted py-3">
                            <i class="fas fa-calendar-alt"></i>
                            <p class="mb-0 mt-2">Select sections to view events</p>
                        </div>
                    `;
                }
            }
        });
    });
}

export function renderEventsTable(events, onLoadAttendees, forceMobileLayout = false) {
    let container = document.getElementById('events-table-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'events-table-container';
        // Fix: Look for the correct parent container
        const parentContainer = document.querySelector('#sidebar .card-body') || document.getElementById('app-content');
        if (parentContainer) {
            parentContainer.appendChild(container);
        }
    }

    // Mobile detection - or force mobile layout
    const isMobile = window.innerWidth <= 767 || forceMobileLayout;
    
    let html;
    
    if (isMobile) {
        // Mobile expandable layout - reorder columns
        html = `<div class="table-responsive">
            <table id="events-table" class="table table-striped table-sm">
                <thead>
                    <tr>
                        <th style="width: 40px;"></th>
                        <th style="width: 70px;" class="text-center">Total</th>
                        <th>Event Details</th>
                        <th style="width: 40px;">
                            <i class="fas fa-expand-alt" title="Tap rows to expand"></i>
                        </th>
                    </tr>
                </thead>
                <tbody>`;
        
        events.forEach((event, idx) => {
            const totalYes = (event.yes || 0);
            const totalNo = (event.no || 0);
            
            html += `
                <tr class="mobile-event-row" data-idx="${idx}" style="cursor: pointer;">
                    <td><input type="checkbox" class="event-checkbox" data-idx="${idx}" onclick="event.stopPropagation();"></td>
                    <td class="text-center total-column">
                        <div class="d-flex flex-column">
                            <span class="text-success fw-bold">${totalYes}</span>
                            <span class="text-danger small">${totalNo}</span>
                        </div>
                    </td>
                    <td class="event-details-column">
                        <div class="fw-bold event-name">${event.name || ''}</div>
                        <small class="text-muted">${event.sectionname || ''} • ${event.date || ''}</small>
                    </td>
                    <td class="text-center">
                        <i class="fas fa-chevron-down expand-icon" data-idx="${idx}"></i>
                    </td>
                </tr>
                <tr class="mobile-details-row" id="details-${idx}" style="display: none;">
                    <td colspan="4" class="bg-light">
                        <div class="p-2">
                            <div class="row text-center">
                                <div class="col-3">
                                    <small class="text-muted d-block">Members</small>
                                    <strong class="text-success">${event.yes_members || 0}</strong>
                                </div>
                                <div class="col-3">
                                    <small class="text-muted d-block">YLs</small>
                                    <strong class="text-success">${event.yes_yls || 0}</strong>
                                </div>
                                <div class="col-3">
                                    <small class="text-muted d-block">Leaders</small>
                                    <strong class="text-success">${event.yes_leaders || 0}</strong>
                                </div>
                                <div class="col-3">
                                    <small class="text-muted d-block">No</small>
                                    <strong class="text-danger">${event.no || 0}</strong>
                                </div>
                            </div>
                        </div>
                    </td>
                </tr>`;
        });
        
    } else {
        // Desktop layout (your existing code)
        html = `<div class="table-responsive">
            <table id="events-table" class="table table-striped table-sm">
                <thead>
                    <tr>
                        <th style="width: 40px;"></th>
                        <th style="min-width: 120px;" data-sort="sectionname">Section</th>
                        <th style="min-width: 150px;" data-sort="name">Event Name</th>
                        <th style="min-width: 100px;" data-sort="date">Date</th>
                        <th style="min-width: 60px;" data-sort="yes">Yes</th>
                        <th style="min-width: 80px;" data-sort="yes_members">Members</th>
                        <th style="min-width: 60px;" data-sort="yes_yls">YLs</th>
                        <th style="min-width: 80px;" data-sort="yes_leaders">Leaders</th>
                        <th style="min-width: 60px;" data-sort="no">No</th>
                    </tr>
                </thead>
                <tbody>`;
        
        events.forEach((event, idx) => {
            html += `<tr>
                <td><input type="checkbox" class="event-checkbox" data-idx="${idx}"></td>
                <td class="text-nowrap">${event.sectionname || ''}</td>
                <td class="event-name-cell">${event.name || ''}</td>
                <td class="text-nowrap">${event.date || ''}</td>
                <td class="text-center">${event.yes || 0}</td>
                <td class="text-center">${event.yes_members || 0}</td>
                <td class="text-center">${event.yes_yls || 0}</td>
                <td class="text-center">${event.yes_leaders || 0}</td>
                <td class="text-center">${event.no || 0}</td>
            </tr>`;
        });
    }
    
    html += `</tbody></table></div>`;
    
    container.innerHTML = html;
    
    // Add mobile expand functionality
    if (isMobile) {
        addMobileExpandFunctionality();
    }
    
    // Store events data for the callback
    container.eventsData = events;
    
    // Add event listeners for automatic loading
    const checkboxes = container.querySelectorAll('.event-checkbox');
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            const selectedCheckboxes = document.querySelectorAll('.event-checkbox:checked');
            const selectedIndices = Array.from(selectedCheckboxes).map(cb => parseInt(cb.dataset.idx));
            const selectedEvents = selectedIndices.map(idx => events[idx]);
            
            if (selectedEvents.length > 0) {
                onLoadAttendees(selectedEvents);
            } else {
                // Clear attendance panel when no events selected
                const attendancePanel = document.getElementById('attendance-panel');
                if (attendancePanel) {
                    attendancePanel.innerHTML = `
                        <div class="card shadow-sm h-100">
                            <div class="card-header bg-info text-white">
                                <h5 class="mb-0">Attendance Details</h5>
                            </div>
                            <div class="card-body">
                                <p class="text-muted text-center">
                                    <i class="fas fa-users"></i><br>
                                    Select events to view attendance details here.
                                </p>
                            </div>
                        </div>
                    `;
                }
            }
        });
    });

    // Add sortable headers
    addSortableHeaders('events-table', events, sortedEvents => renderEventsTable(sortedEvents, onLoadAttendees, forceMobileLayout));
}

// Add the mobile expand functionality
function addMobileExpandFunctionality() {
    document.querySelectorAll('.mobile-event-row').forEach(row => {
        row.addEventListener('click', function(e) {
            // Don't expand if clicking checkbox
            if (e.target.type === 'checkbox') return;
            
            const idx = this.dataset.idx;
            const detailsRow = document.getElementById(`details-${idx}`);
            const expandIcon = this.querySelector('.expand-icon');
            
            if (detailsRow.style.display === 'none') {
                // Expand
                detailsRow.style.display = '';
                expandIcon.classList.remove('fa-chevron-down');
                expandIcon.classList.add('fa-chevron-up');
                this.classList.add('expanded');
            } else {
                // Collapse
                detailsRow.style.display = 'none';
                expandIcon.classList.remove('fa-chevron-up');
                expandIcon.classList.add('fa-chevron-down');
                this.classList.remove('expanded');
            }
        });
    });
}

export function renderAttendeesTable(attendees) {
    let container = document.getElementById('attendance-panel');
    if (!container) {
        container = document.createElement('div');
        container.id = 'attendance-panel';
        document.getElementById('app-content').appendChild(container);
    }

    if (attendees.length === 0) {
        container.innerHTML = `
            <p class="text-muted text-center">
                No attendees found for the selected events.
            </p>
        `;
        return;
    }

    // Group attendees by person (first + last name)
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
            <h5 class="mb-0">Attendance Details</h5>
            <small class="text-muted">
                <span id="attendee-count">${Object.keys(attendeesByPerson).length}</span> person(s), 
                <span id="event-count">${attendees.length}</span> event record(s)
            </small>
        </div>
        
        <!-- Filter Controls -->
        <div class="row mb-3">
            <div class="col-md-3 mb-3">
                <label for="section-filter" class="form-label fw-semibold">Filter by Section</label>
                <select id="section-filter" class="form-select form-select-sm">
                    <option value="">All Sections</option>
                    ${uniqueSections.map(section => `<option value="${section}">${section}</option>`).join('')}
                </select>
            </div>
            <div class="col-md-3 mb-3">
                <label for="event-filter" class="form-label fw-semibold">Filter by Event</label>
                <select id="event-filter" class="form-select form-select-sm">
                    <option value="">All Events</option>
                    ${uniqueEvents.map(event => `<option value="${event}">${event}</option>`).join('')}
                </select>
            </div>
            <div class="col-md-3 mb-3">
                <label for="status-filter" class="form-label fw-semibold">Filter by Status</label>
                <select id="status-filter" class="form-select form-select-sm">
                    <option value="">All Statuses</option>
                    ${uniqueStatuses.map(status => `<option value="${status}">${status}</option>`).join('')}
                </select>
            </div>
            <div class="col-md-3 mb-3">
                <label for="name-filter" class="form-label fw-semibold">Search by Name</label>
                <input type="text" id="name-filter" class="form-control form-control-sm" placeholder="Enter name...">
            </div>
        </div>
        
        <!-- Clear Filters Button -->
        <div class="mb-3">
            <button id="clear-filters-btn" class="btn btn-outline-secondary btn-sm">Clear All Filters</button>
        </div>
        
        <!-- Attendance Table -->
        <div class="table-responsive">
            <table id="attendance-table" class="table table-striped table-sm">`;

    if (isMobile) {
        // Mobile layout
        html += `
                <thead>
                    <tr>
                        <th style="width: 70px;" class="text-center sortable-header" data-sort="totalYes">Status</th>
                        <th class="sortable-header mobile-name-sort" data-sort="firstname" data-alt-sort="lastname">
                            Name <small class="text-muted" id="name-sort-hint">(first)</small>
                        </th>
                        <th style="width: 40px;" class="text-center">▼</th>
                    </tr>
                </thead>
                <tbody id="attendance-tbody">`;
    } else {
        // Desktop layout
        html += `
                <thead>
                    <tr>
                        <th style="width: 80px;" class="text-center sortable-header" data-sort="totalYes">Attending</th>
                        <th class="sortable-header" data-sort="firstname">First Name</th>
                        <th class="sortable-header" data-sort="lastname">Last Name</th>
                        <th style="width: 40px;" class="text-center">▼</th>
                    </tr>
                </thead>
                <tbody id="attendance-tbody">`;
    }

    // Generate person rows
    Object.entries(attendeesByPerson).forEach(([personKey, person], personIdx) => {
        if (isMobile) {
            html += `
                <tr class="person-row" data-person-idx="${personIdx}" style="cursor: pointer;">
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
                        <span class="expand-icon">▼</span>
                    </td>
                </tr>`;
        } else {
            html += `
                <tr class="person-row" data-person-idx="${personIdx}" style="cursor: pointer;">
                    <td class="text-center">
                        <span class="text-success fw-bold">${person.totalYes}</span> / 
                        <span class="text-danger">${person.totalNo}</span>
                    </td>
                    <td>${person.firstname}</td>
                    <td>${person.lastname}</td>
                    <td class="text-center">
                        <span class="expand-icon">▼</span>
                    </td>
                </tr>`;
        }

        // Add expandable details row
        html += `
            <tr class="person-details-row" id="person-details-${personIdx}" style="display: none;">
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

    container.innerHTML = html;

    // Add expand functionality
    addPersonExpandFunctionality();
    
    // Add filtering functionality (update the existing filter functions to work with grouped data)
    addAttendeeFiltering(attendeesByPerson, attendees);

    // Add sortable headers - pass the grouped person data for sorting
    const personDataArray = Object.entries(attendeesByPerson).map(([personKey, person]) => ({
        ...person,
        personKey: personKey
    }));
    
    addSortableHeaders('attendance-table', personDataArray, (sortedPersonData) => {
        // Re-create the attendeesByPerson object in the new sorted order
        const sortedAttendeesByPerson = {};
        sortedPersonData.forEach(person => {
            sortedAttendeesByPerson[person.personKey] = person;
        });
        
        // Re-render with sorted data
        renderSortedAttendeesTable(sortedAttendeesByPerson, attendees);
    });
}

// Function to re-render attendance table with sorted data (without recreating filters)
function renderSortedAttendeesTable(sortedAttendeesByPerson, originalAttendees) {
    const tbody = document.getElementById('attendance-tbody');
    if (!tbody) return;
    
    const isMobile = window.innerWidth <= 767;
    let html = '';
    
    // Generate person rows in sorted order
    Object.entries(sortedAttendeesByPerson).forEach(([personKey, person], personIdx) => {
        if (isMobile) {
            html += `
                <tr class="person-row" data-person-idx="${personIdx}" style="cursor: pointer;">
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
                        <span class="expand-icon">▼</span>
                    </td>
                </tr>`;
        } else {
            html += `
                <tr class="person-row" data-person-idx="${personIdx}" style="cursor: pointer;">
                    <td class="text-center">
                        <span class="text-success fw-bold">${person.totalYes}</span> / 
                        <span class="text-danger">${person.totalNo}</span>
                    </td>
                    <td>${person.firstname}</td>
                    <td>${person.lastname}</td>
                    <td class="text-center">
                        <span class="expand-icon">▼</span>
                    </td>
                </tr>`;
        }

        // Add expandable details row
        html += `
            <tr class="person-details-row" id="person-details-${personIdx}" style="display: none;">
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

    tbody.innerHTML = html;
    
    // Re-add expand functionality
    addPersonExpandFunctionality();
    
    // Re-add filtering functionality
    addAttendeeFiltering(sortedAttendeesByPerson, originalAttendees);
}

// Add the person expand functionality
function addPersonExpandFunctionality() {
    document.querySelectorAll('.person-row').forEach(row => {
        row.addEventListener('click', function() {
            const personIdx = this.dataset.personIdx;
            const detailsRow = document.getElementById(`person-details-${personIdx}`);
            const expandIcon = this.querySelector('.expand-icon');
            
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

// Update filtering to work with grouped data
function addAttendeeFiltering(attendeesByPerson, originalAttendees) {
    const sectionFilter = document.getElementById('section-filter');
    const eventFilter = document.getElementById('event-filter');
    const statusFilter = document.getElementById('status-filter');
    const nameFilter = document.getElementById('name-filter');
    const clearButton = document.getElementById('clear-filters-btn');

    function applyFilters() {
        const sectionValue = sectionFilter.value.toLowerCase();
        const eventValue = eventFilter.value.toLowerCase();
        const statusValue = statusFilter.value.toLowerCase();
        const nameValue = nameFilter.value.toLowerCase();

        let visibleCount = 0;

        document.querySelectorAll('.person-row').forEach(row => {
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
                document.getElementById(`person-details-${personIdx}`).style.display = 'none';
                row.classList.remove('expanded');
                row.querySelector('.expand-icon').textContent = '▼';
                visibleCount++;
            } else {
                row.style.display = 'none';
                document.getElementById(`person-details-${personIdx}`).style.display = 'none';
            }
        });

        document.getElementById('attendee-count').textContent = visibleCount;
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

// === TABLE SORTING FUNCTIONALITY ===

let currentSortColumn = null;
let currentSortDirection = 'asc';

function sortTableData(data, column, direction = 'asc') {
    return [...data].sort((a, b) => {
        let aVal = a[column];
        let bVal = b[column];
        
        // Handle different data types
        if (typeof aVal === 'string' && typeof bVal === 'string') {
            aVal = aVal.toLowerCase();
            bVal = bVal.toLowerCase();
        }
        
        // Handle numbers (attendance counts, yes/no counts, totals)
        if (column.includes('total') || column.includes('count') || 
            column === 'yes' || column === 'no' || column === 'totalYes' || column === 'totalNo' ||
            column.includes('yes_') || column.includes('members') || column.includes('yls') || column.includes('leaders')) {
            aVal = parseInt(aVal) || 0;
            bVal = parseInt(bVal) || 0;
        }
        
        // Handle dates
        if (column.includes('date') || column === '_eventDate') {
            aVal = new Date(aVal);
            bVal = new Date(bVal);
        }
        
        if (direction === 'asc') {
            return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        } else {
            return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
        }
    });
}

function addSortableHeaders(tableId, data, renderFunction) {
    const table = document.getElementById(tableId);
    if (!table) return;
    
    const headers = table.querySelectorAll('th[data-sort]');
    
    headers.forEach(header => {
        header.style.cursor = 'pointer';
        header.style.userSelect = 'none';
        
        // Add sort indicator
        if (!header.querySelector('.sort-indicator')) {
            const indicator = document.createElement('span');
            indicator.className = 'sort-indicator ml-1';
            indicator.innerHTML = '⇅'; // Up-down arrow
            header.appendChild(indicator);
        }
        
        header.addEventListener('click', () => {
            const column = header.getAttribute('data-sort');
            const altColumn = header.getAttribute('data-alt-sort');
            
            // Special handling for mobile name column with dual sort
            if (header.classList.contains('mobile-name-sort')) {
                const nameHint = document.getElementById('name-sort-hint');
                
                // If currently sorting by firstname, switch to lastname
                if (currentSortColumn === 'firstname') {
                    header.setAttribute('data-sort', 'lastname');
                    if (nameHint) nameHint.textContent = '(last)';
                    currentSortColumn = 'lastname';
                } else {
                    // Otherwise sort by firstname
                    header.setAttribute('data-sort', 'firstname');
                    if (nameHint) nameHint.textContent = '(first)';
                    currentSortColumn = 'firstname';
                }
                currentSortDirection = 'asc'; // Reset to ascending when switching sort type
            } else {
                // Normal sorting behavior
                // Toggle direction if same column, otherwise default to asc
                if (currentSortColumn === column) {
                    currentSortDirection = currentSortDirection === 'asc' ? 'desc' : 'asc';
                } else {
                    currentSortDirection = 'asc';
                }
                currentSortColumn = column;
            }
            
            // Update sort indicators
            headers.forEach(h => {
                const indicator = h.querySelector('.sort-indicator');
                if (h === header) {
                    indicator.innerHTML = currentSortDirection === 'asc' ? '↑' : '↓';
                    h.style.backgroundColor = '#e3f2fd';
                } else {
                    indicator.innerHTML = '⇅';
                    h.style.backgroundColor = '';
                }
            });
            
            // Sort and re-render
            const sortedData = sortTableData(data, currentSortColumn, currentSortDirection);
            renderFunction(sortedData);
        });
    });
}

// Helper functions for attendance table
function getAttendanceBadgeClass(attending) {
    switch (attending) {
        case 'Yes': return 'badge-success';
        case 'No': return 'badge-danger';
        default: return 'badge-secondary';
    }
}

function getAttendanceStatus(attending) {
    return attending || 'Unknown';
}

// --- UI functions moved from main.js will be appended below ---
// (Content from previous overwrite_file_with_block will be prepended here by the tool)
