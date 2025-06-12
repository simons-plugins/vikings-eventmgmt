// Configuration object for spinner types
const SPINNER_TYPES = {
    DOTS: 'dots',
    RING: 'ring', 
    GRADIENT: 'gradient'
};

// Default spinner type - will be set from main.js
let currentSpinnerType = SPINNER_TYPES.DOTS;

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInVpLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBIiwiZmlsZSI6InVpLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29uZmlndXJhdGlvbiBvYmplY3QgZm9yIHNwaW5uZXIgdHlwZXMKY29uc3QgU1BJTk5FUl9UWVBFUyA9IHsKICAgIERPVFM6ICdkb3RzJywKICAgIFJJTkc6ICdyaW5nJywgCiAgICBHUkFESUVOVDogJ2dyYWRpZW50Jwp9OwoKLy8gRGVmYXVsdCBzcGlubmVyIHR5cGUgLSB3aWxsIGJlIHNldCBmcm9tIG1haW4uanMKbGV0IGN1cnJlbnRTcGlubmVyVHlwZSA9IFNQSU5ORVJfVFlQRVMuRE9UUzsKCi8vIEZ1bmN0aW9uIHRvIGNoYW5nZSBkZWZhdWx0IHNwaW5uZXIgdHlwZQpleHBvcnQgZnVuY3Rpb24gc2V0RGVmYXVsdFNwaW5uZXIodHlwZSkgewogICAgaWYgKE9iamVjdC52YWx1ZXMoU1BJTk5FUl9UWVBFUykuaW5jbHVkZXModHlwZSkpIHsKICAgICAgICBjdXJyZW50U3Bpbm5lclR5cGUgPSB0eXBlOwogICAgICAgIGNvbnNvbGUubG9nKGBMb2FkaW5nIGFuaW1hdGlvbiBzZXQgdG86ICR7dHlwZX1gKTsKICAgIH0gZWxzZSB7CiAgICAgICAgY29uc29sZS53YXJuKGBJbnZhbGlkIHNwaW5uZXIgdHlwZTogJHt0eXBlfS4gVXNpbmcgZGVmYXVsdDogJHtjdXJyZW50U3Bpbm5lclR5cGV9YCk7CiAgICB9Cn0KCi8vIFVwZGF0ZWQgc2hvd1NwaW5uZXIgZnVuY3Rpb24KZXhwb3J0IGZ1bmN0aW9uIHNob3dTcGlubmVyKHRleHQgPSAnTG9hZGluZy4uLicsIHNwaW5uZXJUeXBlID0gY3VycmVudFNwaW5uZXJUeXBlKSB7CiAgICBjb25zdCBvdmVybGF5ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2xvYWRpbmctb3ZlcmxheScpOwogICAgCiAgICAvLyBGYWxsYmFjayBpZiBvdmVybGF5IGRvZXNuJ3QgZXhpc3QKICAgIGlmICghb3ZlcmxheSkgewogICAgICAgIGNvbnNvbGUud2FybignTG9hZGluZyBvdmVybGF5IG5vdCBmb3VuZCwgY3JlYXRpbmcgZmFsbGJhY2sgc3Bpbm5lcicpOwogICAgICAgIGNyZWF0ZUZhbGxiYWNrU3Bpbm5lcih0ZXh0KTsKICAgICAgICByZXR1cm47CiAgICB9CiAgICAKICAgIGNvbnN0IHRleHRFbCA9IG92ZXJsYXkucXVlcnlTZWxlY3RvcignLmxvYWRpbmctdGV4dCcpOwogICAgY29uc3Qgc3Bpbm5lckNvbnRhaW5lciA9IG92ZXJsYXkucXVlcnlTZWxlY3RvcignI3NwaW5uZXItY29udGFpbmVyJyk7CiAgICAKICAgIGlmICh0ZXh0RWwpIHRleHRFbC50ZXh0Q29udGVudCA9IHRleHQ7CiAgICAKICAgIC8vIENsZWFyIGV4aXN0aW5nIHNwaW5uZXIKICAgIGlmIChzcGlubmVyQ29udGFpbmVyKSB7CiAgICAgICAgc3Bpbm5lckNvbnRhaW5lci5pbm5lckhUTUwgPSAnJzsKICAgICAgICAKICAgICAgICAvLyBDcmVhdGUgdGhlIHJlcXVlc3RlZCBzcGlubmVyIHR5cGUKICAgICAgICBjb25zdCBzcGlubmVyID0gY3JlYXRlU3Bpbm5lcihzcGlubmVyVHlwZSk7CiAgICAgICAgc3Bpbm5lckNvbnRhaW5lci5hcHBlbmRDaGlsZChzcGlubmVyKTsKICAgIH0KICAgIAogICAgLy8gU2hvdyB3aXRoIHNtb290aCB0cmFuc2l0aW9uIC0gZG9uJ3QgaGlkZSBjb250ZW50IGFicnVwdGx5CiAgICBvdmVybGF5LnN0eWxlLmRpc3BsYXkgPSAnZmxleCc7CiAgICBvdmVybGF5LnN0eWxlLm9wYWNpdHkgPSAnMCc7CiAgICAKICAgIC8vIFNtYWxsIGRlbGF5IGZvciBzbW9vdGhlciB0cmFuc2l0aW9uCiAgICBzZXRUaW1lb3V0KCgpID0+IHsKICAgICAgICBvdmVybGF5LnN0eWxlLm9wYWNpdHkgPSAnMC45JzsgLy8gTGVzcyBvcGFxdWUgdG8gc2hvdyBjb250ZW50IGJlaGluZAogICAgfSwgNTApOwp9CgpleHBvcnQgZnVuY3Rpb24gaGlkZVNwaW5uZXIoKSB7CiAgICBjb25zdCBvdmVybGF5ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2xvYWRpbmctb3ZlcmxheScpOwogICAgCiAgICAvLyBGYWxsYmFjayBpZiBvdmVybGF5IGRvZXNuJ3QgZXhpc3QKICAgIGlmICghb3ZlcmxheSkgewogICAgICAgIGNvbnN0IGZhbGxiYWNrID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2ZhbGxiYWNrLXNwaW5uZXInKTsKICAgICAgICBpZiAoZmFsbGJhY2spIHsKICAgICAgICAgICAgZG9jdW1lbnQuYm9keS5yZW1vdmVDaGlsZChmYWxsYmFjayk7CiAgICAgICAgfQogICAgICAgIHJldHVybjsKICAgIH0KICAgIAogICAgb3ZlcmxheS5zdHlsZS5vcGFjaXR5ID0gJzAnOwogICAgCiAgICBzZXRUaW1lb3V0KCgpID0+IHsKICAgICAgICBvdmVybGF5LnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7CiAgICB9LCAzMDApOwp9CgovLyBGYWxsYmFjayBzcGlubmVyIGNyZWF0aW9uCmZ1bmN0aW9uIGNyZWF0ZUZhbGxiYWNrU3Bpbm5lcih0ZXh0KSB7CiAgICBjb25zdCBleGlzdGluZyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdmYWxsYmFjay1zcGlubmVyJyk7CiAgICBpZiAoZXhpc3RpbmcpIHJldHVybjsKICAgIAogICAgY29uc3QgZmFsbGJhY2sgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTsKICAgIGZhbGxiYWNrLmlkID0gJ2ZhbGxiYWNrLXNwaW5uZXInOwogICAgZmFsbGJhY2suc3R5bGUuY3NzVGV4dCA9IGAKICAgICAgICBwb3NpdGlvbjogZml4ZWQ7CiAgICAgICAgdG9wOiAwOwogICAgICAgIGxlZnQ6IDA7CiAgICAgICAgd2lkdGg6IDEwMCU7CiAgICAgICAgaGVpZ2h0OiAxMDAlOwogICAgICAgIGJhY2tncm91bmQ6IHJnYmEoMjU1LCAyNTUsIDI1NSwgMC45NSk7CiAgICAgICAgZGlzcGxheTogZmxleDsKICAgICAgICBhbGlnbi1pdGVtczogY2VudGVyOwogICAgICAgIGp1c3RpZnktY29udGVudDogY2VudGVyOwogICAgICAgIHotaW5kZXg6IDk5OTk7CiAgICAgICAgZmxleC1kaXJlY3Rpb246IGNvbHVtbjsKICAgIGA7CiAgICAKICAgIGZhbGxiYWNrLmlubmVySFRNTCA9IGAKICAgICAgICA8ZGl2IHN0eWxlPVwiCiAgICAgICAgICAgIHdpZHRoOiA0MHB4OwogICAgICAgICAgICBoZWlnaHQ6IDQwcHg7CiAgICAgICAgICAgIGJvcmRlcjogNHB4IHNvbGlkICNmM2YzZjM7CiAgICAgICAgICAgIGJvcmRlci10b3A6IDRweCBzb2xpZCAjMDA3YmZmOwogICAgICAgICAgICBib3JkZXItcmFkaXVzOiA1MCU7CiAgICAgICAgICAgIGFuaW1hdGlvbjogc3BpbiAxcyBsaW5lYXIgaW5maW5pdGU7CiAgICAgICAgICAgIG1hcmdpbi1ib3R0b206IDFyZW07CiAgICAgICAgXCI+PC9kaXY+CiAgICAgICAgPGRpdiBzdHlsZT1cImNvbG9yOiAjNmM3NTdkOyBmb250LXNpemU6IDAuOXJlbTtcIj4ke3RleHR9PC9kaXY+CiAgICBgOwogICAgCiAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGZhbGxiYWNrKTsKfQoKZnVuY3Rpb24gY3JlYXRlU3Bpbm5lcih0eXBlKSB7CiAgICBjb25zdCBzcGlubmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7CiAgICAKICAgIHN3aXRjaCAodHlwZSkgewogICAgICAgIGNhc2UgU1BJTk5FUl9UWVBFUy5ET1RTOgogICAgICAgICAgICBzcGlubmVyLmNsYXNzTmFtZSA9ICdtb2Rlcm4tc3Bpbm5lcic7CiAgICAgICAgICAgIGJyZWFrOwogICAgICAgIGNhc2UgU1BJTk5FUl9UWVBFUy5SSU5HOgogICAgICAgICAgICBzcGlubmVyLmNsYXNzTmFtZSA9ICdyaW5nLXNwaW5uZXInOwogICAgICAgICAgICBicmVhazsKICAgICAgICBjYXNlIFNQSU5ORVJfVFlQRVMuR1JBRElFTlQ6CiAgICAgICAgICAgIHNwaW5uZXIuY2xhc3NOYW1lID0gJ2dyYWRpZW50LXNwaW5uZXInOwogICAgICAgICAgICBicmVhazsKICAgICAgICBkZWZhdWx0OgogICAgICAgICAgICBzcGlubmVyLmNsYXNzTmFtZSA9ICdtb2Rlcm4tc3Bpbm5lcic7IC8vIGZhbGxiYWNrCiAgICB9CiAgICAKICAgIHJldHVybiBzcGlubmVyOwp9CgovLyBBZGQgc2tlbGV0b24gbG9hZGluZyBmb3IgdGFibGVzCmV4cG9ydCBmdW5jdGlvbiBzaG93U2tlbGV0b25Mb2FkZXIoY29udGFpbmVyKSB7CiAgICBpZiAoY29udGFpbmVyKSB7CiAgICAgICAgLy8gQ3JlYXRlIHNrZWxldG9uIHBsYWNlaG9sZGVyIGluIHNwZWNpZmljIGNvbnRhaW5lcgogICAgICAgIGNvbnRhaW5lci5pbm5lckhUTUwgPSBgCiAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJza2VsZXRvbi1jYXJkXCI+CiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwic2tlbGV0b24taGVhZGVyXCI+PC9kaXY+CiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwic2tlbGV0b24tbGluZVwiPjwvZGl2PgogICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInNrZWxldG9uLWxpbmUgc2hvcnRcIj48L2Rpdj4KICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJza2VsZXRvbi1saW5lXCI+PC9kaXY+CiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwic2tlbGV0b24tbGluZSBzaG9ydFwiPjwvZGl2PgogICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInNrZWxldG9uLWxpbmVcIj48L2Rpdj4KICAgICAgICAgICAgPC9kaXY+CiAgICAgICAgYDsKICAgIH0gZWxzZSB7CiAgICAgICAgY29uc3Qgc2tlbGV0b24gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnc2tlbGV0b24tbG9hZGVyJyk7CiAgICAgICAgc2tlbGV0b24uc3R5bGUuZGlzcGxheSA9ICdibG9jayc7CiAgICB9Cn0KCmV4cG9ydCBmdW5jdGlvbiBoaWRlU2tlbGV0b25Mb2FkZXIoKSB7CiAgICBjb25zdCBza2VsZXRvbiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdza2VsZXRvbi1sb2FkZXInKTsKICAgIGlmIChza2VsZXRvbikgc2tlbGV0b24uc3R5bGUuZGlzcGxheSA9ICdub25lJzsKfQoKLy8gQWRkIGJ1dHRvbiBsb2FkaW5nIHN0YXRlCmV4cG9ydCBmdW5jdGlvbiBzZXRCdXR0b25Mb2FkaW5nKGJ1dHRvbklkLCBsb2FkaW5nID0gdHJ1ZSwgdGV4dCA9ICdMb2FkaW5nLi4uJykgewogICAgY29uc3QgYnV0dG9uID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoYnV0dG9uSWQpOwogICAgaWYgKCFidXR0b24pIHJldHVybjsKICAgIAogICAgaWYgKGxvYWRpbmcpIHsKICAgICAgICBidXR0b24uY2xhc3NMaXN0LmFkZCgnYnRuLWxvYWRpbmcnKTsKICAgICAgICBidXR0b24uZGlzYWJsZWQgPSB0cnVlOwogICAgICAgIC8vIFN0b3JlIG9yaWdpbmFsIGNvbnRlbnQKICAgICAgICBpZiAoIWJ1dHRvbi5kYXRhc2V0Lm9yaWdpbmFsQ29udGVudCkgewogICAgICAgICAgICBidXR0b24uZGF0YXNldC5vcmlnaW5hbENvbnRlbnQgPSBidXR0b24uaW5uZXJIVE1MOwogICAgICAgIH0KICAgICAgICBidXR0b24uaW5uZXJIVE1MID0gYDxzcGFuIGNsYXNzPVwiYnRuLXRleHRcIj4ke3RleHR9PC9zcGFuPmA7CiAgICB9IGVsc2UgewogICAgICAgIGJ1dHRvbi5jbGFzc0xpc3QucmVtb3ZlKCdidG4tbG9hZGluZycpOwogICAgICAgIGJ1dHRvbi5kaXNhYmxlZCA9IGZhbHNlOwogICAgICAgIC8vIFJlc3RvcmUgb3JpZ2luYWwgY29udGVudAogICAgICAgIGlmIChidXR0b24uZGF0YXNldC5vcmlnaW5hbENvbnRlbnQpIHsKICAgICAgICAgICAgYnV0dG9uLmlubmVySFRNTCA9IGJ1dHRvbi5kYXRhc2V0Lm9yaWdpbmFsQ29udGVudDsKICAgICAgICAgICAgZGVsZXRlIGJ1dHRvbi5kYXRhc2V0Lm9yaWdpbmFsQ29udGVudDsKICAgICAgICB9CiAgICB9Cn0KCi8vIFVwZGF0ZSBzaG93RXJyb3Igd2l0aCBtb2Rlcm4gc3R5bGluZwpleHBvcnQgZnVuY3Rpb24gc2hvd0Vycm9yKG1zZykgewogICAgLy8gQ3JlYXRlIG1vZGVybiB0b2FzdCBub3RpZmljYXRpb24gaW5zdGVhZCBvZiBiYXNpYyBhbGVydAogICAgY29uc3QgdG9hc3QgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTsKICAgIHRvYXN0LmNsYXNzTmFtZSA9ICdlcnJvci10b2FzdCc7CiAgICB0b2FzdC5pbm5lckhUTUwgPSBgCiAgICAgICAgPGRpdiBjbGFzcz1cImVycm9yLXRvYXN0LWNvbnRlbnRcIj4KICAgICAgICAgICAgPGkgY2xhc3M9XCJmYXMgZmEtZXhjbGFtYXRpb24tY2lyY2xlXCI+PC9pPgogICAgICAgICAgICA8c3Bhbj4ke21zZ308L3NwYW4+CiAgICAgICAgICAgIDxidXR0b24gY2xhc3M9XCJlcnJvci10b2FzdC1jbG9zZVwiPiZ0aW1lczs8L2J1dHRvbj4KICAgICAgICA8L2Rpdj4KICAgIGA7CiAgICAKICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQodG9hc3QpOwogICAgCiAgICAvLyBTaG93IHdpdGggYW5pbWF0aW9uCiAgICBzZXRUaW1lb3V0KCgpID0+IHRvYXN0LmNsYXNzTGlzdC5hZGQoJ3Nob3cnKSwgMTApOwogICAgCiAgICAvLyBBdXRvIGhpZGUgYWZ0ZXIgNSBzZWNvbmRzCiAgICBzZXRUaW1lb3V0KCgpID0+IHsKICAgICAgICB0b2FzdC5jbGFzc0xpc3QucmVtb3ZlKCdzaG93Jyk7CiAgICAgICAgc2V0VGltZW91dCgoKSA9PiBkb2N1bWVudC5ib2R5LnJlbW92ZUNoaWxkKHRvYXN0KSwgMzAwKTsKICAgIH0sIDUwMDApOwogICAgCiAgICAvLyBNYW51YWwgY2xvc2UKICAgIHRvYXN0LnF1ZXJ5U2VsZWN0b3IoJy5lcnJvci10b2FzdC1jbG9zZScpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4gewogICAgICAgIHRvYXN0LmNsYXNzTGlzdC5yZW1vdmUoJ3Nob3cnKTsKICAgICAgICBzZXRUaW1lb3V0KCgpID0+IGRvY3VtZW50LmJvZHkucmVtb3ZlQ2hpbGQodG9hc3QpLCAzMDApOwogICAgfSk7Cn0KCmV4cG9ydCBmdW5jdGlvbiByZW5kZXJTZWN0aW9uc1RhYmxlKHNlY3Rpb25zLCBvblNlbGVjdGlvbkNoYW5nZSkgewogICAgbGV0IGNvbnRhaW5lciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdzZWN0aW9ucy10YWJsZS1jb250YWluZXInKTsKICAgIGlmICghY29udGFpbmVyKSB7CiAgICAgICAgY29udGFpbmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7CiAgICAgICAgY29udGFpbmVyLmlkID0gJ3NlY3Rpb25zLXRhYmxlLWNvbnRhaW5lcic7CiAgICAgICAgLy8gRml4OiBMb29rIGZvciB0aGUgY29ycmVjdCBwYXJlbnQgY29udGFpbmVyCiAgICAgICAgY29uc3QgcGFyZW50Q29udGFpbmVyID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI3NpZGViYXIgLmNhcmQtYm9keScpIHx8IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdhcHAtY29udGVudCcpOwogICAgICAgIGlmIChwYXJlbnRDb250YWluZXIpIHsKICAgICAgICAgICAgcGFyZW50Q29udGFpbmVyLmFwcGVuZENoaWxkKGNvbnRhaW5lcik7CiAgICAgICAgfQogICAgfQogICAgCiAgICBsZXQgaHRtbCA9IGAKICAgICAgICA8ZGl2IGNsYXNzPVwibWItM1wiPgogICAgICAgICAgICA8ZGl2IGNsYXNzPVwiZC1mbGV4IGp1c3RpZnktY29udGVudC1lbmQgbWItMlwiPgogICAgICAgICAgICAgICAgPGJ1dHRvbiBjbGFzcz1cImJ0biBidG4tb3V0bGluZS1zZWNvbmRhcnkgYnRuLXNtXCIgb25jbGljaz1cImNsZWFyU2VjdGlvbnNDYWNoZSgpOyBsb2FkU2VjdGlvbnNGcm9tQ2FjaGVPckFQSSgpO1wiIHRpdGxlPVwiUmVmcmVzaCBzZWN0aW9ucyBmcm9tIEFQSVwiPgogICAgICAgICAgICAgICAgICAgIDxpIGNsYXNzPVwiZmFzIGZhLXN5bmNcIj48L2k+CiAgICAgICAgICAgICAgICA8L2J1dHRvbj4KICAgICAgICAgICAgPC9kaXY+CiAgICAgICAgICAgIDx0YWJsZSBpZD1cInNlY3Rpb25zLXRhYmxlXCIgY2xhc3M9XCJ0YWJsZSB0YWJsZS1zdHJpcGVkIHRhYmxlLXNtXCI+CiAgICAgICAgICAgICAgICA8dGhlYWQ+CiAgICAgICAgICAgICAgICAgICAgPHRyPgogICAgICAgICAgICAgICAgICAgICAgICA8dGggc3R5bGU9XCJ3aWR0aDogNDBweDtcIj48L3RoPgogICAgICAgICAgICAgICAgICAgICAgICA8dGg+U2VjdGlvbiBOYW1lPC90aD4KICAgICAgICAgICAgICAgICAgICA8L3RyPgogICAgICAgICAgICAgICAgPC90aGVhZD4KICAgICAgICAgICAgICAgIDx0Ym9keT5gOwogICAgCiAgICBzZWN0aW9ucy5mb3JFYWNoKHNlY3Rpb24gPT4gewogICAgICAgIGh0bWwgKz0gYDx0cj4KICAgICAgICAgICAgPHRkPjxpbnB1dCB0eXBlPVwiY2hlY2tib3hcIiBjbGFzcz1cInNlY3Rpb24tY2hlY2tib3hcIiB2YWx1ZT1cIiR7c2VjdGlvbi5zZWN0aW9uaWR9XCI+PC90ZD4KICAgICAgICAgICAgPHRkPiR7c2VjdGlvbi5zZWN0aW9ubmFtZX08L3RkPgogICAgICAgIDwvdHI+YDsKICAgIH0pOwoKICAgIGh0bWwgKz0gYDwvdGJvZHk+PC90YWJsZT4KICAgICAgICA8L2Rpdj5gOwogICAgCiAgICBjb250YWluZXIuaW5uZXJIVE1MID0gaHRtbDsKICAgIAogICAgLy8gQWRkIGV2ZW50IGxpc3RlbmVycyBmb3IgYXV0b21hdGljIGxvYWRpbmcKICAgIGNvbnN0IGNoZWNrYm94ZXMgPSBjb250YWluZXIucXVlcnlTZWxlY3RvckFsbCgnLnNlY3Rpb24tY2hlY2tib3gnKTsKICAgIGNoZWNrYm94ZXMuZm9yRWFjaChjaGVja2JveCA9PiB7CiAgICAgICAgY2hlY2tib3guYWRkRXZlbnRMaXN0ZW5lcignY2hhbmdlJywgKCkgPT4gewogICAgICAgICAgICBjb25zdCBzZWxlY3RlZFNlY3Rpb25zID0gQXJyYXkuZnJvbShjb250YWluZXIucXVlcnlTZWxlY3RvckFsbCgnLnNlY3Rpb24tY2hlY2tib3g6Y2hlY2tlZCcpKQogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLm1hcChjYiA9PiBjYi52YWx1ZSk7CiAgICAgICAgICAgIAogICAgICAgICAgICBpZiAoc2VsZWN0ZWRTZWN0aW9ucy5sZW5ndGggPiAwKSB7CiAgICAgICAgICAgICAgICBvblNlbGVjdGlvbkNoYW5nZShzZWxlY3RlZFNlY3Rpb25zKTsKICAgICAgICAgICAgfSBlbHNlIHsKICAgICAgICAgICAgICAgIC8vIENsZWFyIGV2ZW50cyB0YWJsZSB3aGVuIG5vIHNlY3Rpb25zIHNlbGVjdGVkCiAgICAgICAgICAgICAgICBjb25zdCBldmVudHNDb250YWluZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZXZlbnRzLXRhYmxlLWNvbnRhaW5lcicpOwogICAgICAgICAgICAgICAgaWYgKGV2ZW50c0NvbnRhaW5lcikgewogICAgICAgICAgICAgICAgICAgIGV2ZW50c0NvbnRhaW5lci5pbm5lckhUTUwgPSBgCiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJ0ZXh0LWNlbnRlciB0ZXh0LW11dGVkIHB5LTNcIj4KICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxpIGNsYXNzPVwiZmFzIGZhLWNhbGVuZGFyLWFsdFwiPjwvaT4KICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxwIGNsYXNzPVwibWItMCBtdC0yXCI+U2VsZWN0IHNlY3Rpb25zIHRvIHZpZXcgZXZlbnRzPC9wPgogICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj4KICAgICAgICAgICAgICAgICAgICBgOwogICAgICAgICAgICAgICAgfQogICAgICAgICAgICB9CiAgICAgICAgfSk7CiAgICB9KTsKfQoKZXhwb3J0IGZ1bmN0aW9uIHJlbmRlckV2ZW50c1RhYmxlKGV2ZW50cywgb25Mb2FkQXR0ZW5kZWVzLCBmb3JjZU1vYmlsZUxheW91dCA9IGZhbHNlKSB7CiAgICBsZXQgY29udGFpbmVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2V2ZW50cy10YWJsZS1jb250YWluZXInKTsKICAgIGlmICghY29udGFpbmVyKSB7CiAgICAgICAgY29udGFpbmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7CiAgICAgICAgY29udGFpbmVyLmlkID0gJ2V2ZW50cy10YWJsZS1jb250YWluZXInOwogICAgICAgIC8vIEZpeDogTG9vayBmb3IgdGhlIGNvcnJlY3QgcGFyZW50IGNvbnRhaW5lcgogICAgICAgIGNvbnN0IHBhcmVudENvbnRhaW5lciA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNzaWRlYmFyIC5jYXJkLWJvZHknKSB8fCBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYXBwLWNvbnRlbnQnKTsKICAgICAgICBpZiAocGFyZW50Q29udGFpbmVyKSB7CiAgICAgICAgICAgIHBhcmVudENvbnRhaW5lci5hcHBlbmRDaGlsZChjb250YWluZXIpOwogICAgICAgIH0KICAgIH0KCiAgICAvLyBNb2JpbGUgZGV0ZWN0aW9uIC0gb3IgZm9yY2UgbW9iaWxlIGxheW91dAogICAgY29uc3QgaXNNb2JpbGUgPSB3aW5kb3cuaW5uZXJXaWR0aCA8PSA3NjcgfHwgZm9yY2VNb2JpbGVMYXlvdXQ7CiAgICAKICAgIGxldCBodG1sOwogICAgCiAgICBpZiAoaXNNb2JpbGUpIHsKICAgICAgICAvLyBNb2JpbGUgZXhwYW5kYWJsZSBsYXlvdXQgLSByZW9yZGVyIGNvbHVtbnMKICAgICAgICBodG1sID0gYDxkaXYgY2xhc3M9XCJ0YWJsZS1yZXNwb25zaXZlXCI+CiAgICAgICAgICAgIDx0YWJsZSBpZD1cImV2ZW50cy10YWJsZVwiIGNsYXNzPVwidGFibGUgdGFibGUtc3RyaXBlZCB0YWJsZS1zbVwiPgogICAgICAgICAgICAgICAgPHRoZWFkPgogICAgICAgICAgICAgICAgICAgIDx0cj4KICAgICAgICAgICAgICAgICAgICAgICAgPHRoIHN0eWxlPVwid2lkdGg6IDQwcHg7XCI+PC90aD4KICAgICAgICAgICAgICAgICAgICAgICAgPHRoIHN0eWxlPVwid2lkdGg6IDcwcHg7XCIgY2xhc3M9XCJ0ZXh0LWNlbnRlclwiPlRvdGFsPC90aD4KICAgICAgICAgICAgICAgICAgICAgICAgPHRoPkV2ZW50IERldGFpbHM8L3RoPgogICAgICAgICAgICAgICAgICAgICAgICA8dGggc3R5bGU9XCJ3aWR0aDogNDBweDtcIj4KICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxpIGNsYXNzPVwiZmFzIGZhLWV4cGFuZC1hbHRcIiB0aXRsZT1cIlRhcCByb3dzIHRvIGV4cGFuZFwiPjwvaT4KICAgICAgICAgICAgICAgICAgICAgICAgPC90aD4KICAgICAgICAgICAgICAgICAgICA8L3RyPgogICAgICAgICAgICAgICAgPC90aGVhZD4KICAgICAgICAgICAgICAgIDx0Ym9keT5gOwogICAgICAgIAogICAgICAgIGV2ZW50cy5mb3JFYWNoKChldmVudCwgaWR4KSA9PiB7CiAgICAgICAgICAgIGNvbnN0IHRvdGFsWWVzID0gKGV2ZW50LnllcyB8fCAwKTsKICAgICAgICAgICAgY29uc3QgdG90YWxObyA9IChldmVudC5ubyB8fCAwKTsKICAgICAgICAgICAgCiAgICAgICAgICAgIGh0bWwgKz0gYAogICAgICAgICAgICAgICAgPHRyIGNsYXNzPVwibW9iaWxlLWV2ZW50LXJvd1wiIGRhdGEtaWR4PVwiJHtpZHh9XCIgc3R5bGU9XCJjdXJzb3I6IHBvaW50ZXI7XCI+CiAgICAgICAgICAgICAgICAgICAgPHRkPjxpbnB1dCB0eXBlPVwiY2hlY2tib3hcIiBjbGFzcz1cImV2ZW50LWNoZWNrYm94XCIgZGF0YS1pZHg9XCIke2lkeH1cIiBvbmNsaWNrPVwiZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XCI+PC90ZD4KICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3M9XCJ0ZXh0LWNlbnRlciB0b3RhbC1jb2x1bW5cIj4KICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImQtZmxleCBmbGV4LWNvbHVtblwiPgogICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3M9XCJ0ZXh0LXN1Y2Nlc3MgZnctYm9sZFwiPiR7dG90YWxZZXN9PC9zcGFuPgogICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3M9XCJ0ZXh0LWRhbmdlciBzbWFsbFwiPiR7dG90YWxOb308L3NwYW4+CiAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PgogICAgICAgICAgICAgICAgICAgIDwvdGQ+CiAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzPVwiZXZlbnQtZGV0YWlscy1jb2x1bW5cIj4KICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImZ3LWJvbGQgZXZlbnQtbmFtZVwiPiR7ZXZlbnQubmFtZSB8fCAnJ308L2Rpdj4KICAgICAgICAgICAgICAgICAgICAgICAgPHNtYWxsIGNsYXNzPVwidGV4dC1tdXRlZFwiPiR7ZXZlbnQuc2VjdGlvbm5hbWUgfHwgJyd9IOKAoiAke2V2ZW50LmRhdGUgfHwgJyd9PC9zbWFsbD4KICAgICAgICAgICAgICAgICAgICA8L3RkPgogICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzcz1cInRleHQtY2VudGVyXCI+CiAgICAgICAgICAgICAgICAgICAgICAgIDxpIGNsYXNzPVwiZmFzIGZhLWNoZXZyb24tZG93biBleHBhbmQtaWNvblwiIGRhdGEtaWR4PVwiJHtpZHh9XCI+PC9pPgogICAgICAgICAgICAgICAgICAgIDwvdGQ+CiAgICAgICAgICAgICAgICA8L3RyPgogICAgICAgICAgICAgICAgPHRyIGNsYXNzPVwibW9iaWxlLWRldGFpbHMtcm93XCIgaWQ9XCJkZXRhaWxzLSR7aWR4fVwiIHN0eWxlPVwiZGlzcGxheTogbm9uZTtcIj4KICAgICAgICAgICAgICAgICAgICA8dGQgY29sc3Bhbj1cIjRcIiBjbGFzcz1cImJnLWxpZ2h0XCI+CiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJwLTJcIj4KICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJyb3cgdGV4dC1jZW50ZXJcIj4KICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY29sLTNcIj4KICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNtYWxsIGNsYXNzPVwidGV4dC1tdXRlZCBkLWJsb2NrXCI+TWVtYmVyczwvc21hbGw+CiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzdHJvbmcgY2xhc3M9XCJ0ZXh0LXN1Y2Nlc3NcIj4ke2V2ZW50Lnllc19tZW1iZXJzIHx8IDB9PC9zdHJvbmc+CiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+CiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNvbC0zXCI+CiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzbWFsbCBjbGFzcz1cInRleHQtbXV0ZWQgZC1ibG9ja1wiPllMczwvc21hbGw+CiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzdHJvbmcgY2xhc3M9XCJ0ZXh0LXN1Y2Nlc3NcIj4ke2V2ZW50Lnllc195bHMgfHwgMH08L3N0cm9uZz4KICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj4KICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY29sLTNcIj4KICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNtYWxsIGNsYXNzPVwidGV4dC1tdXRlZCBkLWJsb2NrXCI+TGVhZGVyczwvc21hbGw+CiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzdHJvbmcgY2xhc3M9XCJ0ZXh0LXN1Y2Nlc3NcIj4ke2V2ZW50Lnllc19sZWFkZXJzIHx8IDB9PC9zdHJvbmc+CiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+CiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNvbC0zXCI+CiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzbWFsbCBjbGFzcz1cInRleHQtbXV0ZWQgZC1ibG9ja1wiPk5vPC9zbWFsbD4KICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHN0cm9uZyBjbGFzcz1cInRleHQtZGFuZ2VyXCI+JHtldmVudC5ubyB8fCAwfTwvc3Ryb25nPgogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PgogICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+CiAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PgogICAgICAgICAgICAgICAgICAgIDwvdGQ+CiAgICAgICAgICAgICAgICA8L3RyPmA7CiAgICAgICAgfSk7CiAgICAgICAgCiAgICB9IGVsc2UgewogICAgICAgIC8vIERlc2t0b3AgbGF5b3V0ICh5b3VyIGV4aXN0aW5nIGNvZGUpCiAgICAgICAgaHRtbCA9IGA8ZGl2IGNsYXNzPVwidGFibGUtcmVzcG9uc2l2ZVwiPgogICAgICAgICAgICA8dGFibGUgaWQ9XCJldmVudHMtdGFibGVcIiBjbGFzcz1cInRhYmxlIHRhYmxlLXN0cmlwZWQgdGFibGUtc21cIj4KICAgICAgICAgICAgICAgIDx0aGVhZD4KICAgICAgICAgICAgICAgICAgICA8dHI+CiAgICAgICAgICAgICAgICAgICAgICAgIDx0aCBzdHlsZT1cIndpZHRoOiA0MHB4O1wiPjwvdGg+CiAgICAgICAgICAgICAgICAgICAgICAgIDx0aCBzdHlsZT1cIm1pbi13aWR0aDogMTIwcHg7XCIgZGF0YS1zb3J0PVwic2VjdGlvbm5hbWVcIj5TZWN0aW9uPC90aD4KICAgICAgICAgICAgICAgICAgICAgICAgPHRoIHN0eWxlPVwibWluLXdpZHRoOiAxNTBweDtcIiBkYXRhLXNvcnQ9XCJuYW1lXCI+RXZlbnQgTmFtZTwvdGg+CiAgICAgICAgICAgICAgICAgICAgICAgIDx0aCBzdHlsZT1cIm1pbi13aWR0aDogMTAwcHg7XCIgZGF0YS1zb3J0PVwiZGF0ZVwiPkRhdGU8L3RoPgogICAgICAgICAgICAgICAgICAgICAgICA8dGggc3R5bGU9XCJtaW4td2lkdGg6IDYwcHg7XCIgZGF0YS1zb3J0PVwieWVzXCI+WWVzPC90aD4KICAgICAgICAgICAgICAgICAgICAgICAgPHRoIHN0eWxlPVwibWluLXdpZHRoOiA4MHB4O1wiIGRhdGEtc29ydD1cInllc19tZW1iZXJzXCI+TWVtYmVyczwvdGg+CiAgICAgICAgICAgICAgICAgICAgICAgIDx0aCBzdHlsZT1cIm1pbi13aWR0aDogNjBweDtcIiBkYXRhLXNvcnQ9XCJ5ZXNfeWxzXCI+WUxzPC90aD4KICAgICAgICAgICAgICAgICAgICAgICAgPHRoIHN0eWxlPVwibWluLXdpZHRoOiA4MHB4O1wiIGRhdGEtc29ydD1cInllc19sZWFkZXJzXCI+TGVhZGVyczwvdGg+CiAgICAgICAgICAgICAgICAgICAgICAgIDx0aCBzdHlsZT1cIm1pbi13aWR0aDogNjBweDtcIiBkYXRhLXNvcnQ9XCJub1wiPk5vPC90aD4KICAgICAgICAgICAgICAgICAgICA8L3RyPgogICAgICAgICAgICAgICAgPC90aGVhZD4KICAgICAgICAgICAgICAgIDx0Ym9keT5gOwogICAgICAgIAogICAgICAgIGV2ZW50cy5mb3JFYWNoKChldmVudCwgaWR4KSA9PiB7CiAgICAgICAgICAgIGh0bWwgKz0gYDx0cj4KICAgICAgICAgICAgICAgIDx0ZD48aW5wdXQgdHlwZT1cImNoZWNrYm94XCIgY2xhc3M9XCJldmVudC1jaGVja2JveFwiIGRhdGEtaWR4PVwiJHtpZHh9XCI+PC90ZD4KICAgICAgICAgICAgICAgIDx0ZCBjbGFzcz1cInRleHQtbm93cmFwXCI+JHtldmVudC5zZWN0aW9ubmFtZSB8fCAnJ308L3RkPgogICAgICAgICAgICAgICAgPHRkIGNsYXNzPVwiZXZlbnQtbmFtZS1jZWxsXCI+JHtldmVudC5uYW1lIHx8ICcnfTwvdGQ+CiAgICAgICAgICAgICAgICA8dGQgY2xhc3M9XCJ0ZXh0LW5vd3JhcFwiPiR7ZXZlbnQuZGF0ZSB8fCAnJ308L3RkPgogICAgICAgICAgICAgICAgPHRkIGNsYXNzPVwidGV4dC1jZW50ZXJcIj4ke2V2ZW50LnllcyB8fCAwfTwvdGQ+CiAgICAgICAgICAgICAgICA8dGQgY2xhc3M9XCJ0ZXh0LWNlbnRlclwiPiR7ZXZlbnQueWVzX21lbWJlcnMgfHwgMH08L3RkPgogICAgICAgICAgICAgICAgPHRkIGNsYXNzPVwidGV4dC1jZW50ZXJcIj4ke2V2ZW50Lnllc195bHMgfHwgMH08L3RkPgogICAgICAgICAgICAgICAgPHRkIGNsYXNzPVwidGV4dC1jZW50ZXJcIj4ke2V2ZW50Lnllc19sZWFkZXJzIHx8IDB9PC90ZD4KICAgICAgICAgICAgICAgIDx0ZCBjbGFzcz1cInRleHQtY2VudGVyXCI+JHtldmVudC5ubyB8fCAwfTwvdGQ+CiAgICAgICAgICAgIDwvdHI+YDsKICAgICAgICB9KTsKICAgIH0KICAgIAogICAgaHRtbCArPSBgPC90Ym9keT48L3RhYmxlPjwvZGl2PmA7CiAgICAKICAgIGNvbnRhaW5lci5pbm5lckhUTUwgPSBodG1sOwogICAgCiAgICAvLyBBZGQgbW9iaWxlIGV4cGFuZCBmdW5jdGlvbmFsaXR5CiAgICBpZiAoaXNNb2JpbGUpIHsKICAgICAgICBhZGRNb2JpbGVFeHBhbmRGdW5jdGlvbmFsaXR5KCk7CiAgICB9CiAgICAKICAgIC8vIFN0b3JlIGV2ZW50cyBkYXRhIGZvciB0aGUgY2FsbGJhY2sKICAgIGNvbnRhaW5lci5ldmVudHNEYXRhID0gZXZlbnRzOwogICAgCiAgICAvLyBBZGQgZXZlbnQgbGlzdGVuZXJzIGZvciBhdXRvbWF0aWMgbG9hZGluZwogICAgY29uc3QgY2hlY2tib3hlcyA9IGNvbnRhaW5lci5xdWVyeVNlbGVjdG9yQWxsKCcuZXZlbnQtY2hlY2tib3gnKTsKICAgIGNoZWNrYm94ZXMuZm9yRWFjaChjaGVja2JveCA9PiB7CiAgICAgICAgY2hlY2tib3guYWRkRXZlbnRMaXN0ZW5lcignY2hhbmdlJywgKCkgPT4gewogICAgICAgICAgICBjb25zdCBzZWxlY3RlZENoZWNrYm94ZXMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcuZXZlbnQtY2hlY2tib3g6Y2hlY2tlZCcpOwogICAgICAgICAgICBjb25zdCBzZWxlY3RlZEluZGljZXMgPSBBcnJheS5mcm9tKHNlbGVjdGVkQ2hlY2tib3hlcykubWFwKGNiID0+IHBhcnNlSW50KGNiLmRhdGFzZXQuaWR4KSk7CiAgICAgICAgICAgIGNvbnN0IHNlbGVjdGVkRXZlbnRzID0gc2VsZWN0ZWRJbmRpY2VzLm1hcChpZHggPT4gZXZlbnRzW2lkeF0pOwogICAgICAgICAgICAKICAgICAgICAgICAgaWYgKHNlbGVjdGVkRXZlbnRzLmxlbmd0aCA+IDApIHsKICAgICAgICAgICAgICAgIG9uTG9hZEF0dGVuZGVlcyhzZWxlY3RlZEV2ZW50cyk7CiAgICAgICAgICAgIH0gZWxzZSB7CiAgICAgICAgICAgICAgICAvLyBDbGVhciBhdHRlbmRhbmNlIHBhbmVsIHdoZW4gbm8gZXZlbnRzIHNlbGVjdGVkCiAgICAgICAgICAgICAgICBjb25zdCBhdHRlbmRhbmNlUGFuZWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYXR0ZW5kYW5jZS1wYW5lbCcpOwogICAgICAgICAgICAgICAgaWYgKGF0dGVuZGFuY2VQYW5lbCkgewogICAgICAgICAgICAgICAgICAgIGF0dGVuZGFuY2VQYW5lbC5pbm5lckhUTUwgPSBgCiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjYXJkIHNoYWRvdy1zbSBoLTEwMFwiPgogICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNhcmQtaGVhZGVyIGJnLWluZm8gdGV4dC13aGl0ZVwiPgogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxoNSBjbGFzcz1cIm1iLTBcIj5BdHRlbmRhbmNlIERldGFpbHM8L2g1PgogICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+CiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY2FyZC1ib2R5XCI+CiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHAgY2xhc3M9XCJ0ZXh0LW11dGVkIHRleHQtY2VudGVyXCI+CiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxpIGNsYXNzPVwiZmFzIGZhLXVzZXJzXCI+PC9pPjxicj4KICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgU2VsZWN0IGV2ZW50cyB0byB2aWV3IGF0dGVuZGFuY2UgZGV0YWlscyBoZXJlLgogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvcD4KICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PgogICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj4KICAgICAgICAgICAgICAgICAgICBgOwogICAgICAgICAgICAgICAgfQogICAgICAgICAgICB9CiAgICAgICAgfSk7CiAgICB9KTsKCiAgICAvLyBBZGQgc29ydGFibGUgaGVhZGVycwogICAgYWRkU29ydGFibGVIZWFkZXJzKCdldmVudHMtdGFibGUnLCBldmVudHMsIHNvcnRlZEV2ZW50cyA9PiByZW5kZXJFdmVudHNUYWJsZShzb3J0ZWRFdmVudHMsIG9uTG9hZEF0dGVuZGVlcywgZm9yY2VNb2JpbGVMYXlvdXQpKTsKfQoKLy8gQWRkIHRoZSBtb2JpbGUgZXhwYW5kIGZ1bmN0aW9uYWxpdHkKZnVuY3Rpb24gYWRkTW9iaWxlRXhwYW5kRnVuY3Rpb25hbGl0eSgpIHsKICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy5tb2JpbGUtZXZlbnQtcm93JykuZm9yRWFjaChyb3cgPT4gewogICAgICAgIHJvdy5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uKGUpIHsKICAgICAgICAgICAgLy8gRG9uJ3QgZXhwYW5kIGlmIGNsaWNraW5nIGNoZWNrYm94CiAgICAgICAgICAgIGlmIChlLnRhcmdldC50eXBlID09PSAnY2hlY2tib3gnKSByZXR1cm47CiAgICAgICAgICAgIAogICAgICAgICAgICBjb25zdCBpZHggPSB0aGlzLmRhdGFzZXQuaWR4OwogICAgICAgICAgICBjb25zdCBkZXRhaWxzUm93ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoYGRldGFpbHMtJHtpZHh9YCk7CiAgICAgICAgICAgIGNvbnN0IGV4cGFuZEljb24gPSB0aGlzLnF1ZXJ5U2VsZWN0b3IoJy5leHBhbmQtaWNvbicpOwogICAgICAgICAgICAKICAgICAgICAgICAgaWYgKGRldGFpbHNSb3cuc3R5bGUuZGlzcGxheSA9PT0gJ25vbmUnKSB7CiAgICAgICAgICAgICAgICAvLyBFeHBhbmQKICAgICAgICAgICAgICAgIGRldGFpbHNSb3cuc3R5bGUuZGlzcGxheSA9ICcnOwogICAgICAgICAgICAgICAgZXhwYW5kSWNvbi5jbGFzc0xpc3QucmVtb3ZlKCdmYS1jaGV2cm9uLWRvd24nKTsKICAgICAgICAgICAgICAgIGV4cGFuZEljb24uY2xhc3NMaXN0LmFkZCgnZmEtY2hldnJvbi11cCcpOwogICAgICAgICAgICAgICAgdGhpcy5jbGFzc0xpc3QuYWRkKCdleHBhbmRlZCcpOwogICAgICAgICAgICB9IGVsc2UgewogICAgICAgICAgICAgICAgLy8gQ29sbGFwc2UKICAgICAgICAgICAgICAgIGRldGFpbHNSb3cuc3R5bGUuZGlzcGxheSA9ICdub25lJzsKICAgICAgICAgICAgICAgIGV4cGFuZEljb24uY2xhc3NMaXN0LnJlbW92ZSgnZmEtY2hldnJvbi11cCcpOwogICAgICAgICAgICAgICAgZXhwYW5kSWNvbi5jbGFzc0xpc3QuYWRkKCdmYS1jaGV2cm9uLWRvd24nKTsKICAgICAgICAgICAgICAgIHRoaXMuY2xhc3NMaXN0LnJlbW92ZSgnZXhwYW5kZWQnKTsKICAgICAgICAgICAgfQogICAgICAgIH0pOwogICAgfSk7Cn0KCmV4cG9ydCBmdW5jdGlvbiByZW5kZXJBdHRlbmRlZXNUYWJsZShhdHRlbmRlZXMpIHsKICAgIGxldCBjb250YWluZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYXR0ZW5kYW5jZS1wYW5lbCcpOwogICAgaWYgKCFjb250YWluZXIpIHsKICAgICAgICBjb250YWluZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTsKICAgICAgICBjb250YWluZXIuaWQgPSAnYXR0ZW5kYW5jZS1wYW5lbCc7CiAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2FwcC1jb250ZW50JykuYXBwZW5kQ2hpbGQoY29udGFpbmVyKTsKICAgIH0KCiAgICBpZiAoYXR0ZW5kZWVzLmxlbmd0aCA9PT0gMCkgewogICAgICAgIGNvbnRhaW5lci5pbm5lckhUTUwgPSBgCiAgICAgICAgICAgIDxwIGNsYXNzPVwidGV4dC1tdXRlZCB0ZXh0LWNlbnRlclwiPgogICAgICAgICAgICAgICAgTm8gYXR0ZW5kZWVzIGZvdW5kIGZvciB0aGUgc2VsZWN0ZWQgZXZlbnRzLgogICAgICAgICAgICA8L3A+CiAgICAgICAgYDsKICAgICAgICByZXR1cm47CiAgICB9CgogICAgLy8gR3JvdXAgYXR0ZW5kZWVzIGJ5IHBlcnNvbiAoZmlyc3QgKyBsYXN0IG5hbWUpCiAgICBjb25zdCBhdHRlbmRlZXNCeVBlcnNvbiA9IHt9OwogICAgYXR0ZW5kZWVzLmZvckVhY2goYXR0ZW5kZWUgPT4gewogICAgICAgIGNvbnN0IHBlcnNvbktleSA9IGAke2F0dGVuZGVlLmZpcnN0bmFtZX0gJHthdHRlbmRlZS5sYXN0bmFtZX1gOwogICAgICAgIGlmICghYXR0ZW5kZWVzQnlQZXJzb25bcGVyc29uS2V5XSkgewogICAgICAgICAgICBhdHRlbmRlZXNCeVBlcnNvbltwZXJzb25LZXldID0gewogICAgICAgICAgICAgICAgZmlyc3RuYW1lOiBhdHRlbmRlZS5maXJzdG5hbWUsCiAgICAgICAgICAgICAgICBsYXN0bmFtZTogYXR0ZW5kZWUubGFzdG5hbWUsCiAgICAgICAgICAgICAgICBldmVudHM6IFtdLAogICAgICAgICAgICAgICAgdG90YWxZZXM6IDAsCiAgICAgICAgICAgICAgICB0b3RhbE5vOiAwCiAgICAgICAgICAgIH07CiAgICAgICAgfQogICAgICAgIAogICAgICAgIGF0dGVuZGVlc0J5UGVyc29uW3BlcnNvbktleV0uZXZlbnRzLnB1c2goYXR0ZW5kZWUpOwogICAgICAgIGlmIChhdHRlbmRlZS5hdHRlbmRpbmcgPT09ICdZZXMnKSB7CiAgICAgICAgICAgIGF0dGVuZGVlc0J5UGVyc29uW3BlcnNvbktleV0udG90YWxZZXMrKzsKICAgICAgICB9IGVsc2UgewogICAgICAgICAgICBhdHRlbmRlZXNCeVBlcnNvbltwZXJzb25LZXldLnRvdGFsTm8rKzsKICAgICAgICB9CiAgICB9KTsKCiAgICAvLyBHZXQgdW5pcXVlIHZhbHVlcyBmb3IgZmlsdGVycwogICAgY29uc3QgdW5pcXVlU2VjdGlvbnMgPSBbLi4ubmV3IFNldChhdHRlbmRlZXMubWFwKGEgPT4gYS5zZWN0aW9ubmFtZSkpXTsKICAgIGNvbnN0IHVuaXF1ZUV2ZW50cyA9IFsuLi5uZXcgU2V0KGF0dGVuZGVlcy5tYXAoYSA9PiBhLl9ldmVudE5hbWUpKV07CiAgICBjb25zdCB1bmlxdWVTdGF0dXNlcyA9IFsuLi5uZXcgU2V0KGF0dGVuZGVlcy5tYXAoYSA9PiBhLmF0dGVuZGluZykpXTsKCiAgICAvLyBDaGVjayBpZiBtb2JpbGUKICAgIGNvbnN0IGlzTW9iaWxlID0gd2luZG93LmlubmVyV2lkdGggPD0gNzY3OwoKICAgIGxldCBodG1sID0gYAogICAgICAgIDxkaXYgY2xhc3M9XCJkLWZsZXgganVzdGlmeS1jb250ZW50LWJldHdlZW4gYWxpZ24taXRlbXMtY2VudGVyIG1iLTNcIj4KICAgICAgICAgICAgPGg1IGNsYXNzPVwibWItMFwiPkF0dGVuZGFuY2UgRGV0YWlsczwvaDU+CiAgICAgICAgICAgIDxzbWFsbCBjbGFzcz1cInRleHQtbXV0ZWRcIj4KICAgICAgICAgICAgICAgIDxzcGFuIGlkPVwiYXR0ZW5kZWUtY291bnRcIj4ke09iamVjdC5rZXlzKGF0dGVuZGVlc0J5UGVyc29uKS5sZW5ndGh9PC9zcGFuPiBwZXJzb24ocyksIAogICAgICAgICAgICAgICAgPHNwYW4gaWQ9XCJldmVudC1jb3VudFwiPiR7YXR0ZW5kZWVzLmxlbmd0aH08L3NwYW4+IGV2ZW50IHJlY29yZChzKQogICAgICAgICAgICA8L3NtYWxsPgogICAgICAgIDwvZGl2PgogICAgICAgIAogICAgICAgIDwhLS0gRmlsdGVyIENvbnRyb2xzIC0tPgogICAgICAgIDxkaXYgY2xhc3M9XCJyb3cgbWItM1wiPgogICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY29sLW1kLTMgbWItM1wiPgogICAgICAgICAgICAgICAgPGxhYmVsIGZvcj1cInNlY3Rpb24tZmlsdGVyXCIgY2xhc3M9XCJmb3JtLWxhYmVsIGZ3LXNlbWlib2xkXCI+RmlsdGVyIGJ5IFNlY3Rpb248L2xhYmVsPgogICAgICAgICAgICAgICAgPHNlbGVjdCBpZD1cInNlY3Rpb24tZmlsdGVyXCIgY2xhc3M9XCJmb3JtLXNlbGVjdCBmb3JtLXNlbGVjdC1zbVwiPgogICAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XCJcIj5BbGwgU2VjdGlvbnM8L29wdGlvbj4KICAgICAgICAgICAgICAgICAgICAke3VuaXF1ZVNlY3Rpb25zLm1hcChzZWN0aW9uID0+IGA8b3B0aW9uIHZhbHVlPVwiJHtzZWN0aW9ufVwiPiR7c2VjdGlvbn08L29wdGlvbj5gKS5qb2luKCcnKX0KICAgICAgICAgICAgICAgIDwvc2VsZWN0PgogICAgICAgICAgICA8L2Rpdj4KICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNvbC1tZC0zIG1iLTNcIj4KICAgICAgICAgICAgICAgIDxsYWJlbCBmb3I9XCJldmVudC1maWx0ZXJcIiBjbGFzcz1cImZvcm0tbGFiZWwgZnctc2VtaWJvbGRcIj5GaWx0ZXIgYnkgRXZlbnQ8L2xhYmVsPgogICAgICAgICAgICAgICAgPHNlbGVjdCBpZD1cImV2ZW50LWZpbHRlclwiIGNsYXNzPVwiZm9ybS1zZWxlY3QgZm9ybS1zZWxlY3Qtc21cIj4KICAgICAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVwiXCI+QWxsIEV2ZW50czwvb3B0aW9uPgogICAgICAgICAgICAgICAgICAgICR7dW5pcXVlRXZlbnRzLm1hcChldmVudCA9PiBgPG9wdGlvbiB2YWx1ZT1cIiR7ZXZlbnR9XCI+JHtldmVudH08L29wdGlvbj5gKS5qb2luKCcnKX0KICAgICAgICAgICAgICAgIDwvc2VsZWN0PgogICAgICAgICAgICA8L2Rpdj4KICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNvbC1tZC0zIG1iLTNcIj4KICAgICAgICAgICAgICAgIDxsYWJlbCBmb3I9XCJzdGF0dXMtZmlsdGVyXCIgY2xhc3M9XCJmb3JtLWxhYmVsIGZ3LXNlbWlib2xkXCI+RmlsdGVyIGJ5IFN0YXR1czwvbGFiZWw+CiAgICAgICAgICAgICAgICA8c2VsZWN0IGlkPVwic3RhdHVzLWZpbHRlclwiIGNsYXNzPVwiZm9ybS1zZWxlY3QgZm9ybS1zZWxlY3Qtc21cIj4KICAgICAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVwiXCI+QWxsIFN0YXR1c2VzPC9vcHRpb24+CiAgICAgICAgICAgICAgICAgICAgJHt1bmlxdWVTdGF0dXNlcy5tYXAoc3RhdHVzID0+IGA8b3B0aW9uIHZhbHVlPVwiJHtzdGF0dXN9XCI+JHtzdGF0dXN9PC9vcHRpb24+YCkuam9pbignJyl9CiAgICAgICAgICAgICAgICA8L3NlbGVjdD4KICAgICAgICAgICAgPC9kaXY+CiAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjb2wtbWQtMyBtYi0zXCI+CiAgICAgICAgICAgICAgICA8bGFiZWwgZm9yPVwibmFtZS1maWx0ZXJcIiBjbGFzcz1cImZvcm0tbGFiZWwgZnctc2VtaWJvbGRcIj5TZWFyY2ggYnkgTmFtZTwvbGFiZWw+CiAgICAgICAgICAgICAgICA8aW5wdXQgdHlwZT1cInRleHRcIiBpZD1cIm5hbWUtZmlsdGVyXCIgY2xhc3M9XCJmb3JtLWNvbnRyb2wgZm9ybS1jb250cm9sLXNtXCIgcGxhY2Vob2xkZXI9XCJFbnRlciBuYW1lLi4uXCI+CiAgICAgICAgICAgIDwvZGl2PgogICAgICAgIDwvZGl2PgogICAgICAgIAogICAgICAgIDwhLS0gQ2xlYXIgRmlsdGVycyBCdXR0b24gLS0+CiAgICAgICAgPGRpdiBjbGFzcz1cIm1iLTNcIj4KICAgICAgICAgICAgPGJ1dHRvbiBpZD1cImNsZWFyLWZpbHRlcnMtYnRuXCIgY2xhc3M9XCJidG4gYnRuLW91dGxpbmUtc2Vjb25kYXJ5IGJ0bi1zbVwiPkNsZWFyIEFsbCBGaWx0ZXJzPC9idXR0b24+CiAgICAgICAgPC9kaXY+CiAgICAgICAgCiAgICAgICAgPCEtLSBBdHRlbmRhbmNlIFRhYmxlIC0tPgogICAgICAgIDxkaXYgY2xhc3M9XCJ0YWJsZS1yZXNwb25zaXZlXCI+CiAgICAgICAgICAgIDx0YWJsZSBpZD1cImF0dGVuZGFuY2UtdGFibGVcIiBjbGFzcz1cInRhYmxlIHRhYmxlLXN0cmlwZWQgdGFibGUtc21cIj5gOwoKICAgIGlmIChpc01vYmlsZSkgewogICAgICAgIC8vIE1vYmlsZSBsYXlvdXQKICAgICAgICBodG1sICs9IGAKICAgICAgICAgICAgICAgIDx0aGVhZD4KICAgICAgICAgICAgICAgICAgICA8dHI+CiAgICAgICAgICAgICAgICAgICAgICAgIDx0aCBzdHlsZT1cIndpZHRoOiA3MHB4O1wiIGNsYXNzPVwidGV4dC1jZW50ZXIgc29ydGFibGUtaGVhZGVyXCIgZGF0YS1zb3J0PVwidG90YWxZZXNcIj5TdGF0dXM8L3RoPgogICAgICAgICAgICAgICAgICAgICAgICA8dGggY2xhc3M9XCJzb3J0YWJsZS1oZWFkZXIgbW9iaWxlLW5hbWUtc29ydFwiIGRhdGEtc29ydD1cImZpcnN0bmFtZVwiIGRhdGEtYWx0LXNvcnQ9XCJsYXN0bmFtZVwiPgogICAgICAgICAgICAgICAgICAgICAgICAgICAgTmFtZSA8c21hbGwgY2xhc3M9XCJ0ZXh0LW11dGVkXCIgaWQ9XCJuYW1lLXNvcnQtaGludFwiPihmaXJzdCk8L3NtYWxsPgogICAgICAgICAgICAgICAgICAgICAgICA8L3RoPgogICAgICAgICAgICAgICAgICAgICAgICA8dGggc3R5bGU9XCJ3aWR0aDogNDBweDtcIiBjbGFzcz1cInRleHQtY2VudGVyXCI+4pa8PC90aD4KICAgICAgICAgICAgICAgICAgICA8L3RyPgogICAgICAgICAgICAgICAgPC90aGVhZD4KICAgICAgICAgICAgICAgIDx0Ym9keSBpZD1cImF0dGVuZGFuY2UtdGJvZHlcIj5gOwogICAgfSBlbHNlIHsKICAgICAgICAvLyBEZXNrdG9wIGxheW91dAogICAgICAgIGh0bWwgKz0gYAogICAgICAgICAgICAgICAgPHRoZWFkPgogICAgICAgICAgICAgICAgICAgIDx0cj4KICAgICAgICAgICAgICAgICAgICAgICAgPHRoIHN0eWxlPVwid2lkdGg6IDgwcHg7XCIgY2xhc3M9XCJ0ZXh0LWNlbnRlciBzb3J0YWJsZS1oZWFkZXJcIiBkYXRhLXNvcnQ9XCJ0b3RhbFllc1wiPkF0dGVuZGluZzwvdGg+CiAgICAgICAgICAgICAgICAgICAgICAgIDx0aCBjbGFzcz1cInNvcnRhYmxlLWhlYWRlclwiIGRhdGEtc29ydD1cImZpcnN0bmFtZVwiPkZpcnN0IE5hbWU8L3RoPgogICAgICAgICAgICAgICAgICAgICAgICA8dGggY2xhc3M9XCJzb3J0YWJsZS1oZWFkZXJcIiBkYXRhLXNvcnQ9XCJsYXN0bmFtZVwiPkxhc3QgTmFtZTwvdGg+CiAgICAgICAgICAgICAgICAgICAgICAgIDx0aCBzdHlsZT1cIndpZHRoOiA0MHB4O1wiIGNsYXNzPVwidGV4dC1jZW50ZXJcIj7ilrw8L3RoPgogICAgICAgICAgICAgICAgICAgIDwvdHI+CiAgICAgICAgICAgICAgICA8L3RoZWFkPgogICAgICAgICAgICAgICAgPHRib2R5IGlkPVwiYXR0ZW5kYW5jZS10Ym9keVwiPmA7CiAgICB9CgogICAgLy8gR2VuZXJhdGUgcGVyc29uIHJvd3MKICAgIE9iamVjdC5lbnRyaWVzKGF0dGVuZGVlc0J5UGVyc29uKS5mb3JFYWNoKChbcGVyc29uS2V5LCBwZXJzb25dLCBwZXJzb25JZHgpID0+IHsKICAgICAgICBpZiAoaXNNb2JpbGUpIHsKICAgICAgICAgICAgaHRtbCArPSBgCiAgICAgICAgICAgICAgICA8dHIgY2xhc3M9XCJwZXJzb24tcm93XCIgZGF0YS1wZXJzb24taWR4PVwiJHtwZXJzb25JZHh9XCIgc3R5bGU9XCJjdXJzb3I6IHBvaW50ZXI7XCI+CiAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzPVwidGV4dC1jZW50ZXIgdG90YWwtY29sdW1uXCI+CiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJkLWZsZXggZmxleC1jb2x1bW5cIj4KICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzPVwidGV4dC1zdWNjZXNzIGZ3LWJvbGRcIj4ke3BlcnNvbi50b3RhbFllc308L3NwYW4+CiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzcz1cInRleHQtZGFuZ2VyIHNtYWxsXCI+JHtwZXJzb24udG90YWxOb308L3NwYW4+CiAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PgogICAgICAgICAgICAgICAgICAgIDwvdGQ+CiAgICAgICAgICAgICAgICAgICAgPHRkPgogICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiZnctYm9sZFwiPiR7cGVyc29uLmZpcnN0bmFtZX0gJHtwZXJzb24ubGFzdG5hbWV9PC9kaXY+CiAgICAgICAgICAgICAgICAgICAgICAgIDxzbWFsbCBjbGFzcz1cInRleHQtbXV0ZWRcIj4ke3BlcnNvbi5ldmVudHMubGVuZ3RofSBldmVudChzKTwvc21hbGw+CiAgICAgICAgICAgICAgICAgICAgPC90ZD4KICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3M9XCJ0ZXh0LWNlbnRlclwiPgogICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzcz1cImV4cGFuZC1pY29uXCI+4pa8PC9zcGFuPgogICAgICAgICAgICAgICAgICAgIDwvdGQ+CiAgICAgICAgICAgICAgICA8L3RyPmA7CiAgICAgICAgfSBlbHNlIHsKICAgICAgICAgICAgaHRtbCArPSBgCiAgICAgICAgICAgICAgICA8dHIgY2xhc3M9XCJwZXJzb24tcm93XCIgZGF0YS1wZXJzb24taWR4PVwiJHtwZXJzb25JZHh9XCIgc3R5bGU9XCJjdXJzb3I6IHBvaW50ZXI7XCI+CiAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzPVwidGV4dC1jZW50ZXJcIj4KICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3M9XCJ0ZXh0LXN1Y2Nlc3MgZnctYm9sZFwiPiR7cGVyc29uLnRvdGFsWWVzfTwvc3Bhbj4gLyAKICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3M9XCJ0ZXh0LWRhbmdlclwiPiR7cGVyc29uLnRvdGFsTm99PC9zcGFuPgogICAgICAgICAgICAgICAgICAgIDwvdGQ+CiAgICAgICAgICAgICAgICAgICAgPHRkPiR7cGVyc29uLmZpcnN0bmFtZX08L3RkPgogICAgICAgICAgICAgICAgICAgIDx0ZD4ke3BlcnNvbi5sYXN0bmFtZX08L3RkPgogICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzcz1cInRleHQtY2VudGVyXCI+CiAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzPVwiZXhwYW5kLWljb25cIj7ilrw8L3NwYW4+CiAgICAgICAgICAgICAgICAgICAgPC90ZD4KICAgICAgICAgICAgICAgIDwvdHI+YDsKICAgICAgICB9CgogICAgICAgIC8vIEFkZCBleHBhbmRhYmxlIGRldGFpbHMgcm93CiAgICAgICAgaHRtbCArPSBgCiAgICAgICAgICAgIDx0ciBjbGFzcz1cInBlcnNvbi1kZXRhaWxzLXJvd1wiIGlkPVwicGVyc29uLWRldGFpbHMtJHtwZXJzb25JZHh9XCIgc3R5bGU9XCJkaXNwbGF5OiBub25lO1wiPgogICAgICAgICAgICAgICAgPHRkIGNvbHNwYW49XCIke2lzTW9iaWxlID8gMyA6IDR9XCIgY2xhc3M9XCJiZy1saWdodCBwLTBcIj4KICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwidGFibGUtcmVzcG9uc2l2ZVwiPgogICAgICAgICAgICAgICAgICAgICAgICA8dGFibGUgY2xhc3M9XCJ0YWJsZSB0YWJsZS1zbSBtYi0wXCI+CiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGhlYWQgY2xhc3M9XCJiZy1zZWNvbmRhcnkgdGV4dC13aGl0ZVwiPgogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0cj4KICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRoIGNsYXNzPVwic21hbGxcIj5TZWN0aW9uPC90aD4KICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRoIGNsYXNzPVwic21hbGxcIj5FdmVudDwvdGg+CiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0aCBjbGFzcz1cInNtYWxsIHRleHQtY2VudGVyXCI+U3RhdHVzPC90aD4KICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3RyPgogICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90aGVhZD4KICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0Ym9keT5gOwoKICAgICAgICAvLyBBZGQgZXZlbnQgZGV0YWlscyBmb3IgdGhpcyBwZXJzb24KICAgICAgICBwZXJzb24uZXZlbnRzLmZvckVhY2goZXZlbnQgPT4gewogICAgICAgICAgICBjb25zdCBzdGF0dXNDbGFzcyA9IGV2ZW50LmF0dGVuZGluZyA9PT0gJ1llcycgPyAndGV4dC1zdWNjZXNzJyA6ICd0ZXh0LWRhbmdlcic7CiAgICAgICAgICAgIGh0bWwgKz0gYAogICAgICAgICAgICAgICAgPHRyPgogICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzcz1cInNtYWxsXCI+JHtldmVudC5zZWN0aW9ubmFtZSB8fCAnJ308L3RkPgogICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzcz1cInNtYWxsXCI+JHtldmVudC5fZXZlbnROYW1lIHx8ICcnfTwvdGQ+CiAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzPVwic21hbGwgdGV4dC1jZW50ZXIgJHtzdGF0dXNDbGFzc31cIj4KICAgICAgICAgICAgICAgICAgICAgICAgPHN0cm9uZz4ke2V2ZW50LmF0dGVuZGluZyB8fCAnJ308L3N0cm9uZz4KICAgICAgICAgICAgICAgICAgICA8L3RkPgogICAgICAgICAgICAgICAgPC90cj5gOwogICAgICAgIH0pOwoKICAgICAgICBodG1sICs9IGAKICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdGJvZHk+CiAgICAgICAgICAgICAgICAgICAgICAgIDwvdGFibGU+CiAgICAgICAgICAgICAgICAgICAgPC9kaXY+CiAgICAgICAgICAgICAgICA8L3RkPgogICAgICAgICAgICA8L3RyPmA7CiAgICB9KTsKCiAgICBodG1sICs9IGAKICAgICAgICAgICAgICAgIDwvdGJvZHk+CiAgICAgICAgICAgIDwvdGFibGU+CiAgICAgICAgPC9kaXY+CiAgICBgOwoKICAgIGNvbnRhaW5lci5pbm5lckhUTUwgPSBodG1sOwoKICAgIC8vIEFkZCBleHBhbmQgZnVuY3Rpb25hbGl0eQogICAgYWRkUGVyc29uRXhwYW5kRnVuY3Rpb25hbGl0eSgpOwogICAgCiAgICAvLyBBZGQgZmlsdGVyaW5nIGZ1bmN0aW9uYWxpdHkgKHVwZGF0ZSB0aGUgZXhpc3RpbmcgZmlsdGVyIGZ1bmN0aW9ucyB0byB3b3JrIHdpdGggZ3JvdXBlZCBkYXRhKQogICAgYWRkQXR0ZW5kZWVGaWx0ZXJpbmcoYXR0ZW5kZWVzQnlQZXJzb24sIGF0dGVuZGVlcyk7CgogICAgLy8gQWRkIHNvcnRhYmxlIGhlYWRlcnMgLSBwYXNzIHRoZSBncm91cGVkIHBlcnNvbiBkYXRhIGZvciBzb3J0aW5nCiAgICBjb25zdCBwZXJzb25EYXRhQXJyYXkgPSBPYmplY3QuZW50cmllcyhhdHRlbmRlZXNCeVBlcnNvbikubWFwKChbcGVyc29uS2V5LCBwZXJzb25dKSA9PiAoewogICAgICAgIC4uLnBlcnNvbiwKICAgICAgICBwZXJzb25LZXk6IHBlcnNvbktleQogICAgfSkpOwogICAgCiAgICBhZGRTb3J0YWJsZUhlYWRlcnMoJ2F0dGVuZGFuY2UtdGFibGUnLCBwZXJzb25EYXRhQXJyYXksIChzb3J0ZWRQZXJzb25EYXRhKSA9PiB7CiAgICAgICAgLy8gUmUtY3JlYXRlIHRoZSBhdHRlbmRlZXNCeVBlcnNvbiBvYmplY3QgaW4gdGhlIG5ldyBzb3J0ZWQgb3JkZXIKICAgICAgICBjb25zdCBzb3J0ZWRBdHRlbmRlZXNCeVBlcnNvbiA9IHt9OwogICAgICAgIHNvcnRlZFBlcnNvbkRhdGEuZm9yRWFjaChwZXJzb24gPT4gewogICAgICAgICAgICBzb3J0ZWRBdHRlbmRlZXNCeVBlcnNvbltwZXJzb24ucGVyc29uS2V5XSA9IHBlcnNvbjsKICAgICAgICB9KTsKICAgICAgICAKICAgICAgICAvLyBSZS1yZW5kZXIgd2l0aCBzb3J0ZWQgZGF0YQogICAgICAgIHJlbmRlclNvcnRlZEF0dGVuZGVlc1RhYmxlKHNvcnRlZEF0dGVuZGVlc0J5UGVyc29uLCBhdHRlbmRlZXMpOwogICAgfSk7Cn0KCi8vIEZ1bmN0aW9uIHRvIHJlLXJlbmRlciBhdHRlbmRhbmNlIHRhYmxlIHdpdGggc29ydGVkIGRhdGEgKHdpdGhvdXQgcmVjcmVhdGluZyBmaWx0ZXJzKQpmdW5jdGlvbiByZW5kZXJTb3J0ZWRBdHRlbmRlZXNUYWJsZShzb3J0ZWRBdHRlbmRlZXNCeVBlcnNvbiwgb3JpZ2luYWxBdHRlbmRlZXMpIHsKICAgIGNvbnN0IHRib2R5ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2F0dGVuZGFuY2UtdGJvZHknKTsKICAgIGlmICghdGJvZHkpIHJldHVybjsKICAgIAogICAgY29uc3QgaXNNb2JpbGUgPSB3aW5kb3cuaW5uZXJXaWR0aCA8PSA3Njc7CiAgICBsZXQgaHRtbCA9ICcnOwogICAgCiAgICAvLyBHZW5lcmF0ZSBwZXJzb24gcm93cyBpbiBzb3J0ZWQgb3JkZXIKICAgIE9iamVjdC5lbnRyaWVzKHNvcnRlZEF0dGVuZGVlc0J5UGVyc29uKS5mb3JFYWNoKChbcGVyc29uS2V5LCBwZXJzb25dLCBwZXJzb25JZHgpID0+IHsKICAgICAgICBpZiAoaXNNb2JpbGUpIHsKICAgICAgICAgICAgaHRtbCArPSBgCiAgICAgICAgICAgICAgICA8dHIgY2xhc3M9XCJwZXJzb24tcm93XCIgZGF0YS1wZXJzb24taWR4PVwiJHtwZXJzb25JZHh9XCIgc3R5bGU9XCJjdXJzb3I6IHBvaW50ZXI7XCI+CiAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzPVwidGV4dC1jZW50ZXIgdG90YWwtY29sdW1uXCI+CiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJkLWZsZXggZmxleC1jb2x1bW5cIj4KICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzPVwidGV4dC1zdWNjZXNzIGZ3LWJvbGRcIj4ke3BlcnNvbi50b3RhbFllc308L3NwYW4+CiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzcz1cInRleHQtZGFuZ2VyIHNtYWxsXCI+JHtwZXJzb24udG90YWxOb308L3NwYW4+CiAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PgogICAgICAgICAgICAgICAgICAgIDwvdGQ+CiAgICAgICAgICAgICAgICAgICAgPHRkPgogICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiZnctYm9sZFwiPiR7cGVyc29uLmZpcnN0bmFtZX0gJHtwZXJzb24ubGFzdG5hbWV9PC9kaXY+CiAgICAgICAgICAgICAgICAgICAgICAgIDxzbWFsbCBjbGFzcz1cInRleHQtbXV0ZWRcIj4ke3BlcnNvbi5ldmVudHMubGVuZ3RofSBldmVudChzKTwvc21hbGw+CiAgICAgICAgICAgICAgICAgICAgPC90ZD4KICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3M9XCJ0ZXh0LWNlbnRlclwiPgogICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzcz1cImV4cGFuZC1pY29uXCI+4pa8PC9zcGFuPgogICAgICAgICAgICAgICAgICAgIDwvdGQ+CiAgICAgICAgICAgICAgICA8L3RyPmA7CiAgICAgICAgfSBlbHNlIHsKICAgICAgICAgICAgaHRtbCArPSBgCiAgICAgICAgICAgICAgICA8dHIgY2xhc3M9XCJwZXJzb24tcm93XCIgZGF0YS1wZXJzb24taWR4PVwiJHtwZXJzb25JZHh9XCIgc3R5bGU9XCJjdXJzb3I6IHBvaW50ZXI7XCI+CiAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzPVwidGV4dC1jZW50ZXJcIj4KICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3M9XCJ0ZXh0LXN1Y2Nlc3MgZnctYm9sZFwiPiR7cGVyc29uLnRvdGFsWWVzfTwvc3Bhbj4gLyAKICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3M9XCJ0ZXh0LWRhbmdlclwiPiR7cGVyc29uLnRvdGFsTm99PC9zcGFuPgogICAgICAgICAgICAgICAgICAgIDwvdGQ+CiAgICAgICAgICAgICAgICAgICAgPHRkPiR7cGVyc29uLmZpcnN0bmFtZX08L3RkPgogICAgICAgICAgICAgICAgICAgIDx0ZD4ke3BlcnNvbi5sYXN0bmFtZX08L3RkPgogICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzcz1cInRleHQtY2VudGVyXCI+CiAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzPVwiZXhwYW5kLWljb25cIj7ilrw8L3NwYW4+CiAgICAgICAgICAgICAgICAgICAgPC90ZD4KICAgICAgICAgICAgICAgIDwvdHI+YDsKICAgICAgICB9CgogICAgICAgIC8vIEFkZCBleHBhbmRhYmxlIGRldGFpbHMgcm93CiAgICAgICAgaHRtbCArPSBgCiAgICAgICAgICAgIDx0ciBjbGFzcz1cInBlcnNvbi1kZXRhaWxzLXJvd1wiIGlkPVwicGVyc29uLWRldGFpbHMtJHtwZXJzb25JZHh9XCIgc3R5bGU9XCJkaXNwbGF5OiBub25lO1wiPgogICAgICAgICAgICAgICAgPHRkIGNvbHNwYW49XCIke2lzTW9iaWxlID8gMyA6IDR9XCIgY2xhc3M9XCJiZy1saWdodCBwLTBcIj4KICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwidGFibGUtcmVzcG9uc2l2ZVwiPgogICAgICAgICAgICAgICAgICAgICAgICA8dGFibGUgY2xhc3M9XCJ0YWJsZSB0YWJsZS1zbSBtYi0wXCI+CiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGhlYWQgY2xhc3M9XCJiZy1zZWNvbmRhcnkgdGV4dC13aGl0ZVwiPgogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0cj4KICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRoIGNsYXNzPVwic21hbGxcIj5TZWN0aW9uPC90aD4KICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRoIGNsYXNzPVwic21hbGxcIj5FdmVudDwvdGg+CiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0aCBjbGFzcz1cInNtYWxsIHRleHQtY2VudGVyXCI+U3RhdHVzPC90aD4KICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3RyPgogICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90aGVhZD4KICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0Ym9keT5gOwoKICAgICAgICAvLyBBZGQgZXZlbnQgZGV0YWlscyBmb3IgdGhpcyBwZXJzb24KICAgICAgICBwZXJzb24uZXZlbnRzLmZvckVhY2goZXZlbnQgPT4gewogICAgICAgICAgICBjb25zdCBzdGF0dXNDbGFzcyA9IGV2ZW50LmF0dGVuZGluZyA9PT0gJ1llcycgPyAndGV4dC1zdWNjZXNzJyA6ICd0ZXh0LWRhbmdlcic7CiAgICAgICAgICAgIGh0bWwgKz0gYAogICAgICAgICAgICAgICAgPHRyPgogICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzcz1cInNtYWxsXCI+JHtldmVudC5zZWN0aW9ubmFtZSB8fCAnJ308L3RkPgogICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzcz1cInNtYWxsXCI+JHtldmVudC5fZXZlbnROYW1lIHx8ICcnfTwvdGQ+CiAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzPVwic21hbGwgdGV4dC1jZW50ZXIgJHtzdGF0dXNDbGFzc31cIj4KICAgICAgICAgICAgICAgICAgICAgICAgPHN0cm9uZz4ke2V2ZW50LmF0dGVuZGluZyB8fCAnJ308L3N0cm9uZz4KICAgICAgICAgICAgICAgICAgICA8L3RkPgogICAgICAgICAgICAgICAgPC90cj5gOwogICAgICAgIH0pOwoKICAgICAgICBodG1sICs9IGAKICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdGJvZHk+CiAgICAgICAgICAgICAgICAgICAgICAgIDwvdGFibGU+CiAgICAgICAgICAgICAgICAgICAgPC9kaXY+CiAgICAgICAgICAgICAgICA8L3RkPgogICAgICAgICAgICA8L3RyPmA7CiAgICB9KTsKCiAgICB0Ym9keS5pbm5lckhUTUwgPSBodG1sOwogICAgCiAgICAvLyBSZS1hZGQgZXhwYW5kIGZ1bmN0aW9uYWxpdHkKICAgIGFkZFBlcnNvbkV4cGFuZEZ1bmN0aW9uYWxpdHkoKTsKICAgIAogICAgLy8gUmUtYWRkIGZpbHRlcmluZyBmdW5jdGlvbmFsaXR5CiAgICBhZGRBdHRlbmRlZUZpbHRlcmluZyhzb3J0ZWRBdHRlbmRlZXNCeVBlcnNvbiwgb3JpZ2luYWxBdHRlbmRlZXMpOwp9CgovLyBBZGQgdGhlIHBlcnNvbiBleHBhbmQgZnVuY3Rpb25hbGl0eQpmdW5jdGlvbiBhZGRQZXJzb25FeHBhbmRGdW5jdGlvbmFsaXR5KCkgewogICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLnBlcnNvbi1yb3cnKS5mb3JFYWNoKHJvdyA9PiB7CiAgICAgICAgcm93LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24oKSB7CiAgICAgICAgICAgIGNvbnN0IHBlcnNvbklkeCA9IHRoaXMuZGF0YXNldC5wZXJzb25JZHg7CiAgICAgICAgICAgIGNvbnN0IGRldGFpbHNSb3cgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChgcGVyc29uLWRldGFpbHMtJHtwZXJzb25JZHh9YCk7CiAgICAgICAgICAgIGNvbnN0IGV4cGFuZEljb24gPSB0aGlzLnF1ZXJ5U2VsZWN0b3IoJy5leHBhbmQtaWNvbicpOwogICAgICAgICAgICAKICAgICAgICAgICAgaWYgKGRldGFpbHNSb3cuc3R5bGUuZGlzcGxheSA9PT0gJ25vbmUnKSB7CiAgICAgICAgICAgICAgICAvLyBFeHBhbmQKICAgICAgICAgICAgICAgIGRldGFpbHNSb3cuc3R5bGUuZGlzcGxheSA9ICcnOwogICAgICAgICAgICAgICAgZXhwYW5kSWNvbi50ZXh0Q29udGVudCA9ICfilrInOwogICAgICAgICAgICAgICAgdGhpcy5jbGFzc0xpc3QuYWRkKCdleHBhbmRlZCcpOwogICAgICAgICAgICB9IGVsc2UgewogICAgICAgICAgICAgICAgLy8gQ29sbGFwc2UKICAgICAgICAgICAgICAgIGRldGFpbHNSb3cuc3R5bGUuZGlzcGxheSA9ICdub25lJzsKICAgICAgICAgICAgICAgIGV4cGFuZEljb24udGV4dENvbnRlbnQgPSAn4pa8JzsKICAgICAgICAgICAgICAgIHRoaXMuY2xhc3NMaXN0LnJlbW92ZSgnZXhwYW5kZWQnKTsKICAgICAgICAgICAgfQogICAgICAgIH0pOwogICAgfSk7Cn0KCi8vIFVwZGF0ZSBmaWx0ZXJpbmcgdG8gd29yayB3aXRoIGdyb3VwZWQgZGF0YQpmdW5jdGlvbiBhZGRBdHRlbmRlZUZpbHRlcmluZyhhdHRlbmRlZXNCeVBlcnNvbiwgb3JpZ2luYWxBdHRlbmRlZXMpIHsKICAgIGNvbnN0IHNlY3Rpb25GaWx0ZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnc2VjdGlvbi1maWx0ZXInKTsKICAgIGNvbnN0IGV2ZW50RmlsdGVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2V2ZW50LWZpbHRlcicpOwogICAgY29uc3Qgc3RhdHVzRmlsdGVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3N0YXR1cy1maWx0ZXInKTsKICAgIGNvbnN0IG5hbWVGaWx0ZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbmFtZS1maWx0ZXInKTsKICAgIGNvbnN0IGNsZWFyQnV0dG9uID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NsZWFyLWZpbHRlcnMtYnRuJyk7CgogICAgZnVuY3Rpb24gYXBwbHlGaWx0ZXJzKCkgewogICAgICAgIGNvbnN0IHNlY3Rpb25WYWx1ZSA9IHNlY3Rpb25GaWx0ZXIudmFsdWUudG9Mb3dlckNhc2UoKTsKICAgICAgICBjb25zdCBldmVudFZhbHVlID0gZXZlbnRGaWx0ZXIudmFsdWUudG9Mb3dlckNhc2UoKTsKICAgICAgICBjb25zdCBzdGF0dXNWYWx1ZSA9IHN0YXR1c0ZpbHRlci52YWx1ZS50b0xvd2VyQ2FzZSgpOwogICAgICAgIGNvbnN0IG5hbWVWYWx1ZSA9IG5hbWVGaWx0ZXIudmFsdWUudG9Mb3dlckNhc2UoKTsKCiAgICAgICAgbGV0IHZpc2libGVDb3VudCA9IDA7CgogICAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy5wZXJzb24tcm93JykuZm9yRWFjaChyb3cgPT4gewogICAgICAgICAgICBjb25zdCBwZXJzb25JZHggPSByb3cuZGF0YXNldC5wZXJzb25JZHg7CiAgICAgICAgICAgIGNvbnN0IHBlcnNvbktleSA9IE9iamVjdC5rZXlzKGF0dGVuZGVlc0J5UGVyc29uKVtwZXJzb25JZHhdOwogICAgICAgICAgICBjb25zdCBwZXJzb24gPSBhdHRlbmRlZXNCeVBlcnNvbltwZXJzb25LZXldOwogICAgICAgICAgICAKICAgICAgICAgICAgLy8gQ2hlY2sgaWYgcGVyc29uIG1hdGNoZXMgZmlsdGVycwogICAgICAgICAgICBjb25zdCBuYW1lTWF0Y2ggPSAhbmFtZVZhbHVlIHx8IAogICAgICAgICAgICAgICAgKHBlcnNvbi5maXJzdG5hbWUudG9Mb3dlckNhc2UoKS5pbmNsdWRlcyhuYW1lVmFsdWUpIHx8IAogICAgICAgICAgICAgICAgIHBlcnNvbi5sYXN0bmFtZS50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKG5hbWVWYWx1ZSkpOwogICAgICAgICAgICAgICAgIAogICAgICAgICAgICAvLyBDaGVjayBpZiBhbnkgb2YgdGhlaXIgZXZlbnRzIG1hdGNoIHNlY3Rpb24vZXZlbnQvc3RhdHVzIGZpbHRlcnMKICAgICAgICAgICAgY29uc3QgZXZlbnRzTWF0Y2ggPSBwZXJzb24uZXZlbnRzLnNvbWUoZXZlbnQgPT4gewogICAgICAgICAgICAgICAgY29uc3Qgc2VjdGlvbk1hdGNoID0gIXNlY3Rpb25WYWx1ZSB8fCBldmVudC5zZWN0aW9ubmFtZS50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKHNlY3Rpb25WYWx1ZSk7CiAgICAgICAgICAgICAgICBjb25zdCBldmVudE1hdGNoID0gIWV2ZW50VmFsdWUgfHwgZXZlbnQuX2V2ZW50TmFtZS50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKGV2ZW50VmFsdWUpOwogICAgICAgICAgICAgICAgY29uc3Qgc3RhdHVzTWF0Y2ggPSAhc3RhdHVzVmFsdWUgfHwgZXZlbnQuYXR0ZW5kaW5nLnRvTG93ZXJDYXNlKCkuaW5jbHVkZXMoc3RhdHVzVmFsdWUpOwogICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICByZXR1cm4gc2VjdGlvbk1hdGNoICYmIGV2ZW50TWF0Y2ggJiYgc3RhdHVzTWF0Y2g7CiAgICAgICAgICAgIH0pOwoKICAgICAgICAgICAgaWYgKG5hbWVNYXRjaCAmJiBldmVudHNNYXRjaCkgewogICAgICAgICAgICAgICAgcm93LnN0eWxlLmRpc3BsYXkgPSAnJzsKICAgICAgICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGBwZXJzb24tZGV0YWlscy0ke3BlcnNvbklkeH1gKS5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnOwogICAgICAgICAgICAgICAgcm93LmNsYXNzTGlzdC5yZW1vdmUoJ2V4cGFuZGVkJyk7CiAgICAgICAgICAgICAgICByb3cucXVlcnlTZWxlY3RvcignLmV4cGFuZC1pY29uJykudGV4dENvbnRlbnQgPSAn4pa8JzsKICAgICAgICAgICAgICAgIHZpc2libGVDb3VudCsrOwogICAgICAgICAgICB9IGVsc2UgewogICAgICAgICAgICAgICAgcm93LnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7CiAgICAgICAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChgcGVyc29uLWRldGFpbHMtJHtwZXJzb25JZHh9YCkuc3R5bGUuZGlzcGxheSA9ICdub25lJzsKICAgICAgICAgICAgfQogICAgICAgIH0pOwoKICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYXR0ZW5kZWUtY291bnQnKS50ZXh0Q29udGVudCA9IHZpc2libGVDb3VudDsKICAgIH0KCiAgICAvLyBBZGQgZXZlbnQgbGlzdGVuZXJzCiAgICBbc2VjdGlvbkZpbHRlciwgZXZlbnRGaWx0ZXIsIHN0YXR1c0ZpbHRlciwgbmFtZUZpbHRlcl0uZm9yRWFjaChmaWx0ZXIgPT4gewogICAgICAgIGZpbHRlci5hZGRFdmVudExpc3RlbmVyKCdjaGFuZ2UnLCBhcHBseUZpbHRlcnMpOwogICAgICAgIGZpbHRlci5hZGRFdmVudExpc3RlbmVyKCdpbnB1dCcsIGFwcGx5RmlsdGVycyk7CiAgICB9KTsKCiAgICBjbGVhckJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHsKICAgICAgICBbc2VjdGlvbkZpbHRlciwgZXZlbnRGaWx0ZXIsIHN0YXR1c0ZpbHRlciwgbmFtZUZpbHRlcl0uZm9yRWFjaChmaWx0ZXIgPT4gewogICAgICAgICAgICBmaWx0ZXIudmFsdWUgPSAnJzsKICAgICAgICB9KTsKICAgICAgICBhcHBseUZpbHRlcnMoKTsKICAgIH0pOwp9CgovLyA9PT0gVEFCTEUgU09SVElORyBGVU5DVElPTkFMSVRZID09PQoKbGV0IGN1cnJlbnRTb3J0Q29sdW1uID0gbnVsbDsKbGV0IGN1cnJlbnRTb3J0RGlyZWN0aW9uID0gJ2FzYyc7CgpmdW5jdGlvbiBzb3J0VGFibGVEYXRhKGRhdGEsIGNvbHVtbiwgZGlyZWN0aW9uID0gJ2FzYycpIHsKICAgIHJldHVybiBbLi4uZGF0YV0uc29ydCgoYSwgYikgPT4gewogICAgICAgIGxldCBhVmFsID0gYVtjb2x1bW5dOwogICAgICAgIGxldCBiVmFsID0gYltjb2x1bW5dOwogICAgICAgIAogICAgICAgIC8vIEhhbmRsZSBkaWZmZXJlbnQgZGF0YSB0eXBlcwogICAgICAgIGlmICh0eXBlb2YgYVZhbCA9PT0gJ3N0cmluZycgJiYgdHlwZW9mIGJWYWwgPT09ICdzdHJpbmcnKSB7CiAgICAgICAgICAgIGFWYWwgPSBhVmFsLnRvTG93ZXJDYXNlKCk7CiAgICAgICAgICAgIGJWYWwgPSBiVmFsLnRvTG93ZXJDYXNlKCk7CiAgICAgICAgfQogICAgICAgIAogICAgICAgIC8vIEhhbmRsZSBudW1iZXJzIChhdHRlbmRhbmNlIGNvdW50cywgeWVzL25vIGNvdW50cywgdG90YWxzKQogICAgICAgIGlmIChjb2x1bW4uaW5jbHVkZXMoJ3RvdGFsJykgfHwgY29sdW1uLmluY2x1ZGVzKCdjb3VudCcpIHx8IAogICAgICAgICAgICBjb2x1bW4gPT09ICd5ZXMnIHx8IGNvbHVtbiA9PT0gJ25vJyB8fCBjb2x1bW4gPT09ICd0b3RhbFllcycgfHwgY29sdW1uID09PSAndG90YWxObycgfHwKICAgICAgICAgICAgY29sdW1uLmluY2x1ZGVzKCd5ZXNfJykgfHwgY29sdW1uLmluY2x1ZGVzKCdtZW1iZXJzJykgfHwgY29sdW1uLmluY2x1ZGVzKCd5bHMnKSB8fCBjb2x1bW4uaW5jbHVkZXMoJ2xlYWRlcnMnKSkgewogICAgICAgICAgICBhVmFsID0gcGFyc2VJbnQoYVZhbCkgfHwgMDsKICAgICAgICAgICAgYlZhbCA9IHBhcnNlSW50KGJWYWwpIHx8IDA7CiAgICAgICAgfQogICAgICAgIAogICAgICAgIC8vIEhhbmRsZSBkYXRlcwogICAgICAgIGlmIChjb2x1bW4uaW5jbHVkZXMoJ2RhdGUnKSB8fCBjb2x1bW4gPT09ICdfZXZlbnREYXRlJykgewogICAgICAgICAgICBhVmFsID0gbmV3IERhdGUoYVZhbCk7CiAgICAgICAgICAgIGJWYWwgPSBuZXcgRGF0ZShiVmFsKTsKICAgICAgICB9CiAgICAgICAgCiAgICAgICAgaWYgKGRpcmVjdGlvbiA9PT0gJ2FzYycpIHsKICAgICAgICAgICAgcmV0dXJuIGFWYWwgPCBiVmFsID8gLTEgOiBhVmFsID4gYlZhbCA/IDEgOiAwOwogICAgICAgIH0gZWxzZSB7CiAgICAgICAgICAgIHJldHVybiBhVmFsID4gYlZhbCA/IC0xIDogYVZhbCA8IGJWYWwgPyAxIDogMDsKICAgICAgICB9CiAgICB9KTsKfQoKZnVuY3Rpb24gYWRkU29ydGFibGVIZWFkZXJzKHRhYmxlSWQsIGRhdGEsIHJlbmRlckZ1bmN0aW9uKSB7CiAgICBjb25zdCB0YWJsZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKHRhYmxlSWQpOwogICAgaWYgKCF0YWJsZSkgcmV0dXJuOwogICAgCiAgICBjb25zdCBoZWFkZXJzID0gdGFibGUucXVlcnlTZWxlY3RvckFsbCgndGhbZGF0YS1zb3J0XScpOwogICAgCiAgICBoZWFkZXJzLmZvckVhY2goaGVhZGVyID0+IHsKICAgICAgICBoZWFkZXIuc3R5bGUuY3Vyc29yID0gJ3BvaW50ZXInOwogICAgICAgIGhlYWRlci5zdHlsZS51c2VyU2VsZWN0ID0gJ25vbmUnOwogICAgICAgIAogICAgICAgIC8vIEFkZCBzb3J0IGluZGljYXRvcgogICAgICAgIGlmICghaGVhZGVyLnF1ZXJ5U2VsZWN0b3IoJy5zb3J0LWluZGljYXRvcicpKSB7CiAgICAgICAgICAgIGNvbnN0IGluZGljYXRvciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTsKICAgICAgICAgICAgaW5kaWNhdG9yLmNsYXNzTmFtZSA9ICdzb3J0LWluZGljYXRvciBtbC0xJzsKICAgICAgICAgICAgaW5kaWNhdG9yLmlubmVySFRNTCA9ICfih4UnOyAvLyBVcC1kb3duIGFycm93CiAgICAgICAgICAgIGhlYWRlci5hcHBlbmRDaGlsZChpbmRpY2F0b3IpOwogICAgICAgIH0KICAgICAgICAKICAgICAgICBoZWFkZXIuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB7CiAgICAgICAgICAgIGNvbnN0IGNvbHVtbiA9IGhlYWRlci5nZXRBdHRyaWJ1dGUoJ2RhdGEtc29ydCcpOwogICAgICAgICAgICBjb25zdCBhbHRDb2x1bW4gPSBoZWFkZXIuZ2V0QXR0cmlidXRlKCdkYXRhLWFsdC1zb3J0Jyk7CiAgICAgICAgICAgIAogICAgICAgICAgICAvLyBTcGVjaWFsIGhhbmRsaW5nIGZvciBtb2JpbGUgbmFtZSBjb2x1bW4gd2l0aCBkdWFsIHNvcnQKICAgICAgICAgICAgaWYgKGhlYWRlci5jbGFzc0xpc3QuY29udGFpbnMoJ21vYmlsZS1uYW1lLXNvcnQnKSkgewogICAgICAgICAgICAgICAgY29uc3QgbmFtZUhpbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbmFtZS1zb3J0LWhpbnQnKTsKICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgLy8gSWYgY3VycmVudGx5IHNvcnRpbmcgYnkgZmlyc3RuYW1lLCBzd2l0Y2ggdG8gbGFzdG5hbWUKICAgICAgICAgICAgICAgIGlmIChjdXJyZW50U29ydENvbHVtbiA9PT0gJ2ZpcnN0bmFtZScpIHsKICAgICAgICAgICAgICAgICAgICBoZWFkZXIuc2V0QXR0cmlidXRlKCdkYXRhLXNvcnQnLCAnbGFzdG5hbWUnKTsKICAgICAgICAgICAgICAgICAgICBpZiAobmFtZUhpbnQpIG5hbWVIaW50LnRleHRDb250ZW50ID0gJyhsYXN0KSc7CiAgICAgICAgICAgICAgICAgICAgY3VycmVudFNvcnRDb2x1bW4gPSAnbGFzdG5hbWUnOwogICAgICAgICAgICAgICAgfSBlbHNlIHsKICAgICAgICAgICAgICAgICAgICAvLyBPdGhlcndpc2Ugc29ydCBieSBmaXJzdG5hbWUKICAgICAgICAgICAgICAgICAgICBoZWFkZXIuc2V0QXR0cmlidXRlKCdkYXRhLXNvcnQnLCAnZmlyc3RuYW1lJyk7CiAgICAgICAgICAgICAgICAgICAgaWYgKG5hbWVIaW50KSBuYW1lSGludC50ZXh0Q29udGVudCA9ICcoZmlyc3QpJzsKICAgICAgICAgICAgICAgICAgICBjdXJyZW50U29ydENvbHVtbiA9ICdmaXJzdG5hbWUnOwogICAgICAgICAgICAgICAgfQogICAgICAgICAgICAgICAgY3VycmVudFNvcnREaXJlY3Rpb24gPSAnYXNjJzsgLy8gUmVzZXQgdG8gYXNjZW5kaW5nIHdoZW4gc3dpdGNoaW5nIHNvcnQgdHlwZQogICAgICAgICAgICB9IGVsc2UgewogICAgICAgICAgICAgICAgLy8gTm9ybWFsIHNvcnRpbmcgYmVoYXZpb3IKICAgICAgICAgICAgICAgIC8vIFRvZ2dsZSBkaXJlY3Rpb24gaWYgc2FtZSBjb2x1bW4sIG90aGVyd2lzZSBkZWZhdWx0IHRvIGFzYwogICAgICAgICAgICAgICAgaWYgKGN1cnJlbnRTb3J0Q29sdW1uID09PSBjb2x1bW4pIHsKICAgICAgICAgICAgICAgICAgICBjdXJyZW50U29ydERpcmVjdGlvbiA9IGN1cnJlbnRTb3J0RGlyZWN0aW9uID09PSAnYXNjJyA/ICdkZXNjJyA6ICdhc2MnOwogICAgICAgICAgICAgICAgfSBlbHNlIHsKICAgICAgICAgICAgICAgICAgICBjdXJyZW50U29ydERpcmVjdGlvbiA9ICdhc2MnOwogICAgICAgICAgICAgICAgfQogICAgICAgICAgICAgICAgY3VycmVudFNvcnRDb2x1bW4gPSBjb2x1bW47CiAgICAgICAgICAgIH0KICAgICAgICAgICAgCiAgICAgICAgICAgIC8vIFVwZGF0ZSBzb3J0IGluZGljYXRvcnMKICAgICAgICAgICAgaGVhZGVycy5mb3JFYWNoKGggPT4gewogICAgICAgICAgICAgICAgY29uc3QgaW5kaWNhdG9yID0gaC5xdWVyeVNlbGVjdG9yKCcuc29ydC1pbmRpY2F0b3InKTsKICAgICAgICAgICAgICAgIGlmIChoID09PSBoZWFkZXIpIHsKICAgICAgICAgICAgICAgICAgICBpbmRpY2F0b3IuaW5uZXJIVE1MID0gY3VycmVudFNvcnREaXJlY3Rpb24gPT09ICdhc2MnID8gJ+KGkScgOiAn4oaTJzsKICAgICAgICAgICAgICAgICAgICBoLnN0eWxlLmJhY2tncm91bmRDb2xvciA9ICcjZTNmMmZkJzsKICAgICAgICAgICAgICAgIH0gZWxzZSB7CiAgICAgICAgICAgICAgICAgICAgaW5kaWNhdG9yLmlubmVySFRNTCA9ICfih4UnOwogICAgICAgICAgICAgICAgICAgIGguc3R5bGUuYmFja2dyb3VuZENvbG9yID0gJyc7CiAgICAgICAgICAgICAgICB9CiAgICAgICAgICAgIH0pOwogICAgICAgICAgICAKICAgICAgICAgICAgLy8gU29ydCBhbmQgcmUtcmVuZGVyCiAgICAgICAgICAgIGNvbnN0IHNvcnRlZERhdGEgPSBzb3J0VGFibGVEYXRhKGRhdGEsIGN1cnJlbnRTb3J0Q29sdW1uLCBjdXJyZW50U29ydERpcmVjdGlvbik7CiAgICAgICAgICAgIHJlbmRlckZ1bmN0aW9uKHNvcnRlZERhdGEpOwogICAgICAgIH0pOwogICAgfSk7Cn0KCi8vIEhlbHBlciBmdW5jdGlvbnMgZm9yIGF0dGVuZGFuY2UgdGFibGUKZnVuY3Rpb24gZ2V0QXR0ZW5kYW5jZUJhZGdlQ2xhc3MoYXR0ZW5kaW5nKSB7CiAgICBzd2l0Y2ggKGF0dGVuZGluZykgewogICAgICAgIGNhc2UgJ1llcyc6IHJldHVybiAnYmFkZ2Utc3VjY2Vzcyc7CiAgICAgICAgY2FzZSAnTm8nOiByZXR1cm4gJ2JhZGdlLWRhbmdlcic7CiAgICAgICAgZGVmYXVsdDogcmV0dXJuICdiYWRnZS1zZWNvbmRhcnknOwogICAgfQp9CgpmdW5jdGlvbiBnZXRBdHRlbmRhbmNlU3RhdHVzKGF0dGVuZGluZykgewogICAgcmV0dXJuIGF0dGVuZGluZyB8fCAnVW5rbm93bic7Cn0iXX0K
