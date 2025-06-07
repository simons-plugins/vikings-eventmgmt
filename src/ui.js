export function showSpinner() {
    document.getElementById('spinner').style.display = 'block';
}
export function hideSpinner() {
    document.getElementById('spinner').style.display = 'none';
}
export function showError(msg) {
    const el = document.getElementById('error-message');
    el.textContent = msg;
    el.style.display = 'block';
    setTimeout(() => { el.style.display = 'none'; }, 5000);
}

export function renderSectionsTable(sections, onLoadEvents) {
    let container = document.getElementById('sections-table-container');
    if (!container) {
        // Use the app-content or create the container properly
        container = document.createElement('div');
        container.id = 'sections-table-container';
        document.getElementById('app-content').appendChild(container);
    }
    
    let html = `<table id="sections-table" class="table table-striped">
        <tr><th>Select</th><th>Section Name</th></tr>`;
    
    sections.forEach(section => {
        html += `<tr>
            <td><input type="checkbox" class="section-checkbox" value="${section.sectionid}"></td>
            <td>${section.sectionname}</td>
        </tr>`;
    });
    
    html += `</table>
    <button id="load-events-btn" class="btn btn-primary">Load Events</button>`;
    
    container.innerHTML = html;
    
    document.getElementById('load-events-btn').onclick = () => {
        const selected = Array.from(document.querySelectorAll('.section-checkbox:checked')).map(cb => cb.value);
        onLoadEvents(selected);
    };
}

export function renderEventsTable(events, onLoadAttendees) {
    let container = document.getElementById('events-table-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'events-table-container';
        document.getElementById('app-content').appendChild(container);
    }

    let html = `<table id="events-table" class="table table-striped">
        <tr>
            <th>Select</th>
            <th>Section</th>
            <th>Name</th>
            <th>Date</th>
            <th>Yes</th>
            <th>Yes Members</th>
            <th>Yes YLs</th>
            <th>Yes Leaders</th>
            <th>No</th>
        </tr>`;
    
    events.forEach((event, idx) => {
        html += `<tr>
            <td><input type="checkbox" class="event-checkbox" data-idx="${idx}" data-event='${JSON.stringify(event)}'></td>
            <td>${event.sectionname || ''}</td>
            <td>${event.name || ''}</td>
            <td>${event.date || ''}</td>
            <td>${event.yes || 0}</td>
            <td>${event.yes_members || 0}</td>
            <td>${event.yes_yls || 0}</td>
            <td>${event.yes_leaders || 0}</td>
            <td>${event.no || 0}</td>
        </tr>`;
    });

    html += `</table>
    <button id="load-attendees-btn" class="btn btn-primary">Show Attendees for Selected Events</button>`;
    
    container.innerHTML = html;
    
    // Store events data for the callback
    container.eventsData = events;
    
    document.getElementById('load-attendees-btn').onclick = () => {
        // Get selected event indices
        const selectedCheckboxes = document.querySelectorAll('.event-checkbox:checked');
        const selectedIndices = Array.from(selectedCheckboxes).map(cb => parseInt(cb.dataset.idx));
        
        // Call the callback with selected events data
        const selectedEvents = selectedIndices.map(idx => events[idx]);
        onLoadAttendees(selectedEvents);
    };
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

    // Get unique sections and events for filters
    const uniqueSections = [...new Set(attendees.map(a => a.sectionname))];
    const uniqueEvents = [...new Set(attendees.map(a => a._eventName))];
    const uniqueStatuses = [...new Set(attendees.map(a => a.attending))];

    let html = `
        <div class="d-flex justify-content-between align-items-center mb-3">
            <h5 class="mb-0">Attendance Details</h5>
            <small class="text-muted">
                <span id="attendee-count">${attendees.length}</span> attendee(s)
            </small>
        </div>
        
        <!-- Filter Controls -->
        <div class="row mb-3">
            <div class="col-md-3 mb-2">
                <label for="section-filter" class="form-label small">Filter by Section:</label>
                <select id="section-filter" class="form-select form-select-sm">
                    <option value="">All Sections</option>
                    ${uniqueSections.map(section => `<option value="${section}">${section}</option>`).join('')}
                </select>
            </div>
            <div class="col-md-3 mb-2">
                <label for="event-filter" class="form-label small">Filter by Event:</label>
                <select id="event-filter" class="form-select form-select-sm">
                    <option value="">All Events</option>
                    ${uniqueEvents.map(event => `<option value="${event}">${event}</option>`).join('')}
                </select>
            </div>
            <div class="col-md-3 mb-2">
                <label for="status-filter" class="form-label small">Filter by Status:</label>
                <select id="status-filter" class="form-select form-select-sm">
                    <option value="">All Statuses</option>
                    ${uniqueStatuses.map(status => `<option value="${status}">${status}</option>`).join('')}
                </select>
            </div>
            <div class="col-md-3 mb-2">
                <label for="name-filter" class="form-label small">Search by Name:</label>
                <input type="text" id="name-filter" class="form-control form-control-sm" placeholder="Enter name...">
            </div>
        </div>
        
        <!-- Clear Filters Button -->
        <div class="mb-3">
            <button id="clear-filters-btn" class="btn btn-outline-secondary btn-sm">Clear All Filters</button>
        </div>
        
        <!-- Attendance Table -->
        <div class="table-responsive">
            <table id="attendance-table" class="table table-striped table-sm">
                <thead class="table-dark">
                    <tr>
                        <th>Section</th>
                        <th>Event</th>
                        <th>First Name</th>
                        <th>Last Name</th>
                        <th>Attending</th>
                    </tr>
                </thead>
                <tbody id="attendance-tbody">`;
    
    attendees.forEach((attendee, index) => {
        const attendingClass = attendee.attending === 'Yes' ? 'text-success' : 'text-danger';
        html += `
            <tr data-index="${index}">
                <td>${attendee.sectionname || ''}</td>
                <td>${attendee._eventName || ''}</td>
                <td>${attendee.firstname || ''}</td>
                <td>${attendee.lastname || ''}</td>
                <td class="${attendingClass}">
                    <strong>${attendee.attending || ''}</strong>
                </td>
            </tr>`;
    });
    
    html += `
                </tbody>
            </table>
        </div>
    `;
    
    container.innerHTML = html;

    // Store attendees data for filtering
    container.attendeesData = attendees;

    // Add filter functionality
    addFilterFunctionality();
}

// Add the filtering functionality
function addFilterFunctionality() {
    const sectionFilter = document.getElementById('section-filter');
    const eventFilter = document.getElementById('event-filter');
    const statusFilter = document.getElementById('status-filter');
    const nameFilter = document.getElementById('name-filter');
    const clearFiltersBtn = document.getElementById('clear-filters-btn');
    const attendeeCount = document.getElementById('attendee-count');

    function applyFilters() {
        const container = document.getElementById('attendance-panel');
        const allAttendees = container.attendeesData;
        
        const sectionValue = sectionFilter.value.toLowerCase();
        const eventValue = eventFilter.value.toLowerCase();
        const statusValue = statusFilter.value.toLowerCase();
        const nameValue = nameFilter.value.toLowerCase();

        const rows = document.querySelectorAll('#attendance-tbody tr');
        let visibleCount = 0;

        rows.forEach((row, index) => {
            const attendee = allAttendees[index];
            
            const matchesSection = !sectionValue || (attendee.sectionname || '').toLowerCase().includes(sectionValue);
            const matchesEvent = !eventValue || (attendee._eventName || '').toLowerCase().includes(eventValue);
            const matchesStatus = !statusValue || (attendee.attending || '').toLowerCase().includes(statusValue);
            const matchesName = !nameValue || 
                (attendee.firstname || '').toLowerCase().includes(nameValue) ||
                (attendee.lastname || '').toLowerCase().includes(nameValue);

            const isVisible = matchesSection && matchesEvent && matchesStatus && matchesName;
            
            row.style.display = isVisible ? '' : 'none';
            if (isVisible) visibleCount++;
        });

        attendeeCount.textContent = visibleCount;
    }

    function clearFilters() {
        sectionFilter.value = '';
        eventFilter.value = '';
        statusFilter.value = '';
        nameFilter.value = '';
        applyFilters();
    }

    // Add event listeners
    sectionFilter.addEventListener('change', applyFilters);
    eventFilter.addEventListener('change', applyFilters);
    statusFilter.addEventListener('change', applyFilters);
    nameFilter.addEventListener('input', applyFilters);
    clearFiltersBtn.addEventListener('click', clearFilters);
}