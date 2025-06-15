// src/ui/attendance.js
// This module is dedicated to rendering the various views within the attendance panel.
// It handles the presentation of detailed attendance data, including:
// - A summary table with per-person attendance totals and expandable details.
// - A grouped list view, categorizing attendees by their status (e.g., Yes, No, Invited).
// - A simple list for camp group planning.
// The module also includes helper functions for styling, sorting, filtering, and DOM manipulation
// specific to these attendance views.

// Helper function (internal to this module)
// Returns a Bootstrap color name (e.g., 'success', 'danger') based on the attendance status string.
// Used for styling status badges and indicators.
function getStatusColor(status) {
    switch (status?.toLowerCase()) {
        case 'yes': case 'attended': case 'present': return 'success'; // Green for positive statuses
        case 'no': case 'absent': case 'not attended': return 'danger'; // Red for negative statuses
        case 'maybe': case 'unknown': return 'warning'; // Yellow for uncertain statuses
        default: return 'secondary'; // Grey for other/unknown statuses
    }
}

// Helper function (internal to this module)
// Attaches click event listeners to person rows in the summary attendance table
// to toggle the visibility of their detailed event attendance.
function addSummaryPersonExpandFunctionality() {
    document.querySelectorAll('.summary-person-row').forEach(row => {
        row.addEventListener('click', function() {
            const personIdx = this.dataset.personIdx; // Get person index from data attribute
            const detailsRow = document.getElementById(`summary-person-details-${personIdx}`); // Find corresponding details row
            const expandIcon = this.querySelector('.summary-expand-icon'); // Find expand/collapse icon
            if (detailsRow.style.display === 'none') {
                detailsRow.style.display = ''; // Show details
                expandIcon.textContent = '▲'; // Change icon to indicate 'collapse'
                this.classList.add('expanded'); // Add class for styling expanded row
            } else {
                detailsRow.style.display = 'none'; // Hide details
                expandIcon.textContent = '▼'; // Change icon to indicate 'expand'
                this.classList.remove('expanded'); // Remove expanded class
            }
        });
    });
}

// Helper function (internal to this module)
// Adds click event listeners to sortable table headers in the summary attendance table.
// Sorts the table rows based on the clicked header's data-sort attribute.
// attendeesByPerson: The aggregated data used for sorting (not directly, but context).
function addSummaryTableSorting(attendeesByPerson) {
    const sortableHeaders = document.querySelectorAll('#summary-attendance-table .sortable');
    let currentSort = { column: null, direction: 'asc' }; // Keep track of current sort state

    sortableHeaders.forEach(header => {
        header.addEventListener('click', function() {
            const sortColumn = this.dataset.sort; // Get column to sort by
            const tbody = document.getElementById('summary-attendance-tbody');
            const rows = Array.from(tbody.querySelectorAll('.summary-person-row')); // Get all person rows

            // Determine sort direction
            if (currentSort.column === sortColumn) {
                currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
            } else {
                currentSort.direction = 'asc';
            }
            currentSort.column = sortColumn;

            // Update header styling for sort indicators
            sortableHeaders.forEach(h => h.classList.remove('sort-asc', 'sort-desc'));
            this.classList.add(currentSort.direction === 'asc' ? 'sort-asc' : 'sort-desc');

            // Sort logic based on column
            rows.sort((a, b) => {
                let comparison = 0;
                switch (sortColumn) {
                    case 'firstname': comparison = a.dataset.firstname.toLowerCase().localeCompare(b.dataset.firstname.toLowerCase()); break;
                    case 'lastname': comparison = a.dataset.lastname.toLowerCase().localeCompare(b.dataset.lastname.toLowerCase()); break;
                    case 'name': // Sort by lastname, then firstname
                        const lnc = a.dataset.lastname.toLowerCase().localeCompare(b.dataset.lastname.toLowerCase());
                        if (lnc !== 0) comparison = lnc;
                        else comparison = a.dataset.firstname.toLowerCase().localeCompare(b.dataset.firstname.toLowerCase());
                        break;
                    case 'status': // Sort by attendance ratio (Yes / Total), then by total Yes count
                        const tYA = parseInt(a.dataset.totalYes) || 0, tNA = parseInt(a.dataset.totalNo) || 0;
                        const tYB = parseInt(b.dataset.totalYes) || 0, tNB = parseInt(b.dataset.totalNo) || 0;
                        const totalA = tYA + tNA, totalB = tYB + tNB;
                        const rA = totalA > 0 ? tYA / totalA : 0, rB = totalB > 0 ? tYB / totalB : 0;
                        if (rA < rB) comparison = -1;
                        else if (rA > rB) comparison = 1;
                        else { if (tYA < tYB) comparison = -1; else if (tYA > tYB) comparison = 1; else comparison = 0; }
                        break;
                    default: return 0;
                }
                return currentSort.direction === 'asc' ? comparison : -comparison; // Apply direction
            });

            // Re-append sorted rows (and their detail rows) to the table body
            rows.forEach((row, index) => {
                const personIdx = row.dataset.personIdx; // Old index
                const detailsRow = document.getElementById(`summary-person-details-${personIdx}`);
                // Update data attributes and IDs if necessary (though re-indexing might not be strictly needed if DOM order is sufficient)
                // row.dataset.personIdx = index; if (detailsRow) detailsRow.id = `summary-person-details-${index}`;
                tbody.appendChild(row);
                if (detailsRow) tbody.appendChild(detailsRow);
            });
            addSummaryPersonExpandFunctionality(); // Re-attach expand functionality after reordering
        });
    });
}

// Helper function (internal to this module)
// Adds event listeners to filter inputs (dropdowns, text search) for the summary attendance table.
// Filters the displayed rows based on selected criteria (section, event, status, name).
// attendeesByPerson: The aggregated data used for filtering.
// originalAttendees: The raw attendee list (not directly used here but good for context).
function addSummaryAttendeeFiltering(attendeesByPerson, originalAttendees) {
    const sectionFilter = document.getElementById('summary-section-filter');
    const eventFilter = document.getElementById('summary-event-filter');
    const statusFilter = document.getElementById('summary-status-filter');
    const nameFilter = document.getElementById('summary-name-filter');
    const clearButton = document.getElementById('summary-clear-filters-btn');

    function applyFilters() {
        const sectionVal = sectionFilter.value.toLowerCase();
        const eventVal = eventFilter.value.toLowerCase();
        const statusVal = statusFilter.value.toLowerCase();
        const nameVal = nameFilter.value.toLowerCase();
        let visibleCount = 0;

        document.querySelectorAll('.summary-person-row').forEach(row => {
            // Retrieve person data associated with the row. This assumes personIdx maps correctly to keys in attendeesByPerson.
            // A more robust way might be to store the personKey directly on the row if Object.keys order is not guaranteed.
            const personIdx = row.dataset.personIdx;
            const personKeys = Object.keys(attendeesByPerson);
            const personKey = personKeys[personIdx]; // This mapping could be fragile if original order changes
            const person = attendeesByPerson[personKey];

            if (!person) { // Safety check
                row.style.display = 'none';
                const detailsRow = document.getElementById(`summary-person-details-${personIdx}`);
                if (detailsRow) detailsRow.style.display = 'none';
                return;
            }

            // Check if person's name matches the name filter
            const nameMatch = !nameVal || (person.firstname.toLowerCase().includes(nameVal) || person.lastname.toLowerCase().includes(nameVal));
            // Check if any of the person's events match the section, event, and status filters
            const eventsMatch = person.events.some(evt =>
                (!sectionVal || evt.sectionname.toLowerCase().includes(sectionVal)) &&
                (!eventVal || evt._eventName.toLowerCase().includes(eventVal)) &&
                (!statusVal || evt.attending.toLowerCase().includes(statusVal))
            );

            const detailsRow = document.getElementById(`summary-person-details-${personIdx}`);
            if (nameMatch && eventsMatch) {
                row.style.display = ''; // Show row
                if (detailsRow) detailsRow.style.display = 'none'; // Keep details collapsed initially
                row.classList.remove('expanded');
                const expandIcon = row.querySelector('.summary-expand-icon');
                if (expandIcon) expandIcon.textContent = '▼';
                visibleCount++;
            } else {
                row.style.display = 'none'; // Hide row
                if (detailsRow) detailsRow.style.display = 'none';
            }
        });
        document.getElementById('summary-attendee-count').textContent = visibleCount; // Update visible count
    }

    // Attach event listeners to filter inputs
    [sectionFilter, eventFilter, statusFilter, nameFilter].forEach(f => {
        if (f) {
            f.addEventListener('change', applyFilters);
            f.addEventListener('input', applyFilters); // For text input
        }
    });
    if (clearButton) {
        clearButton.addEventListener('click', () => {
            [sectionFilter, eventFilter, statusFilter, nameFilter].forEach(f => { if (f) f.value = ''; });
            applyFilters(); // Re-apply filters (which will show all rows)
        });
    }
}

// Renders the summary attendance table.
// attendees: An array of attendee objects. Each object is expected to have properties like
//            firstname, lastname, sectionname, _eventName, attending (status).
function renderSummaryAttendanceTable(attendees) {
    const summaryContent = document.getElementById('summary-content');
    if (!summaryContent) return;

    if (attendees.length === 0) {
        summaryContent.innerHTML = `<p class="text-muted text-center">No attendees found.</p>`;
        return;
    }

    // Aggregate attendance data by person (firstname + lastname).
    // attendeesByPerson will be an object where keys are "Firstname Lastname"
    // and values are objects containing person's details and a list of their event attendances.
    const attendeesByPerson = {};
    attendees.forEach(attendee => {
        const personKey = `${attendee.firstname} ${attendee.lastname}`;
        if (!attendeesByPerson[personKey]) {
            attendeesByPerson[personKey] = {
                firstname: attendee.firstname,
                lastname: attendee.lastname,
                events: [], // List of events this person is associated with
                totalYes: 0, // Count of 'Yes' responses
                totalNo: 0   // Count of 'No' responses
            };
        }
        attendeesByPerson[personKey].events.push(attendee);
        if (attendee.attending === 'Yes') attendeesByPerson[personKey].totalYes++;
        else if (attendee.attending === 'No') attendeesByPerson[personKey].totalNo++; // Assuming other statuses are not 'No'
    });

    // Extract unique values for filter dropdowns.
    const uniqueSections = [...new Set(attendees.map(a => a.sectionname))].sort();
    const uniqueEvents = [...new Set(attendees.map(a => a._eventName))].sort();
    const uniqueStatuses = [...new Set(attendees.map(a => a.attending))].sort();

    const isMobile = window.innerWidth <= 767; // Check for mobile view for layout adjustments.

    // Start building HTML for the summary table, including filter controls.
    let html = `<div class="d-flex justify-content-between align-items-center mb-3"><h6 class="mb-0">Attendance Summary</h6><small class="text-muted"><span id="summary-attendee-count">${Object.keys(attendeesByPerson).length}</span> person(s), <span id="summary-event-count">${attendees.length}</span> record(s)</small></div>`;
    // Filter dropdowns and name search input.
    html += `<div class="row mb-3"><div class="col-md-3 mb-2"><select id="summary-section-filter" class="form-select form-select-sm"><option value="">All Sections</option>${uniqueSections.map(s => `<option value="${s}">${s}</option>`).join('')}</select></div><div class="col-md-3 mb-2"><select id="summary-event-filter" class="form-select form-select-sm"><option value="">All Events</option>${uniqueEvents.map(e => `<option value="${e}">${e}</option>`).join('')}</select></div><div class="col-md-3 mb-2"><select id="summary-status-filter" class="form-select form-select-sm"><option value="">All Statuses</option>${uniqueStatuses.map(st => `<option value="${st}">${st}</option>`).join('')}</select></div><div class="col-md-3 mb-2"><input type="text" id="summary-name-filter" class="form-control form-control-sm" placeholder="Search name..."></div></div>`;
    html += `<div class="mb-3"><button id="summary-clear-filters-btn" class="btn btn-outline-secondary btn-sm">Clear Filters</button></div><div class="table-responsive"><table id="summary-attendance-table" class="table table-striped table-sm">`;

    // Table headers, adjusted for mobile view.
    if (isMobile) {
        html += `<thead><tr><th style="width: 70px;" class="text-center sortable" data-sort="status">Status <span class="sort-arrow">⇅</span></th><th class="sortable" data-sort="name">Name <span class="sort-arrow">⇅</span></th><th style="width: 40px;" class="text-center">▼</th></tr></thead><tbody id="summary-attendance-tbody">`;
    } else {
        html += `<thead><tr><th style="width: 120px;" class="text-center sortable" data-sort="status">Attending <span class="sort-arrow">⇅</span></th><th class="sortable" data-sort="firstname">First Name <span class="sort-arrow">⇅</span></th><th class="sortable" data-sort="lastname">Last Name <span class="sort-arrow">⇅</span></th><th style="width: 40px;" class="text-center">▼</th></tr></thead><tbody id="summary-attendance-tbody">`;
    }

    // Iterate over each person to generate their summary row and expandable detail row.
    Object.entries(attendeesByPerson).forEach(([personKey, person], personIdx) => {
        // Main row for the person.
        if (isMobile) {
            html += `<tr class="summary-person-row" data-person-idx="${personIdx}" data-firstname="${person.firstname}" data-lastname="${person.lastname}" data-total-yes="${person.totalYes}" data-total-no="${person.totalNo}" style="cursor: pointer;"><td class="text-center total-column"><div class="d-flex flex-column"><span class="text-success fw-bold">${person.totalYes}</span><span class="text-danger small">${person.totalNo}</span></div></td><td><div class="fw-bold">${person.firstname} ${person.lastname}</div><small class="text-muted">${person.events.length} event(s)</small></td><td class="text-center"><span class="summary-expand-icon">▼</span></td></tr>`;
        } else {
            html += `<tr class="summary-person-row" data-person-idx="${personIdx}" data-firstname="${person.firstname}" data-lastname="${person.lastname}" data-total-yes="${person.totalYes}" data-total-no="${person.totalNo}" style="cursor: pointer;"><td class="text-center"><span class="text-success fw-bold">${person.totalYes}</span> / <span class="text-danger">${person.totalNo}</span></td><td>${person.firstname}</td><td>${person.lastname}</td><td class="text-center"><span class="summary-expand-icon">▼</span></td></tr>`;
        }
        // Hidden detail row for this person, containing a sub-table of their event attendances.
        html += `<tr class="summary-person-details-row" id="summary-person-details-${personIdx}" style="display: none;"><td colspan="${isMobile ? 3 : 4}" class="bg-light p-0"><div class="table-responsive"><table class="table table-sm mb-0"><thead class="bg-secondary text-white"><tr><th class="small">Section</th><th class="small">Event</th><th class="small text-center">Status</th></tr></thead><tbody>`;
        person.events.forEach(event => { html += `<tr><td class="small">${event.sectionname||''}</td><td class="small">${event._eventName||''}</td><td class="small text-center ${event.attending === 'Yes' ? 'text-success':'text-danger'}"><strong>${event.attending||''}</strong></td></tr>`; });
        html += `</tbody></table></div></td></tr>`;
    });
    html += `</tbody></table></div>`;
    summaryContent.innerHTML = html; // Inject the complete table HTML.

    // Invoke helper functions to add interactivity (row expansion, sorting, filtering).
    addSummaryPersonExpandFunctionality();
    addSummaryTableSorting(attendeesByPerson); // Pass data for context if needed by sorting/filtering logic
    addSummaryAttendeeFiltering(attendeesByPerson, attendees);
}

// Renders the "Grouped" attendance table, where attendees are grouped by their status (Yes, No, Invited, etc.).
function renderGroupedAttendanceTable(attendees) {
    const groupedContent = document.getElementById('grouped-content');
    if (!groupedContent) return;

    // Group attendees by their attendance status.
    const groupedAttendees = {};
    attendees.forEach(attendee => {
        const status = attendee.attending || attendee.status || 'Unknown'; // Normalize status
        if (!groupedAttendees[status]) groupedAttendees[status] = [];
        groupedAttendees[status].push(attendee);
    });

    // Define a priority for sorting status groups (e.g., 'Yes' first).
    const statusPriority = { 'Yes': 1, 'No': 2, 'Invited': 3 }; // Lower number = higher priority
    // Sort statuses by priority, then alphabetically.
    const sortedStatuses = Object.keys(groupedAttendees).sort((a, b) => {
        const pA = statusPriority[a] || 999, pB = statusPriority[b] || 999;
        if (pA !== pB) return pA - pB;
        return a.localeCompare(b);
    });

    if (sortedStatuses.length === 0) {
        groupedContent.innerHTML = `<div class="text-center py-4"><i class="fas fa-info-circle text-muted" style="font-size: 2rem;"></i><p class="text-muted mt-2">No records.</p></div>`;
        return;
    }

    const htmlParts = [];
    // Generate HTML for each status group as a collapsible section.
    sortedStatuses.forEach((status, index) => {
        const records = groupedAttendees[status];
        const isExpanded = index === 0; // Expand the first group by default.
        const collapseId = `grouped-collapse-${status.replace(/\s+/g, '-').toLowerCase()}`; // Unique ID for collapse element.
        const color = getStatusColor(status); // Get color for status badge.

        // Header for the collapsible section (status, count, expand/collapse icon).
        htmlParts.push(`<div class="border-bottom"><div class="d-flex justify-content-between align-items-center p-3 bg-light border-bottom cursor-pointer" style="cursor:pointer;" onclick="toggleGroupedSection('${collapseId}')"><h6 class="mb-0"><i class="fas fa-chevron-${isExpanded?'down':'right'} me-2" id="icon-${collapseId}"></i><span class="badge badge-${color} me-2">${status}</span><span class="text-muted">${records.length} attendees</span></h6></div>`);
        // Collapsible content area with a table of attendees for this status.
        htmlParts.push(`<div class="collapse ${isExpanded?'show':''}" id="${collapseId}"><div class="table-responsive"><table class="table table-sm table-hover mb-0"><thead class="thead-light"><tr><th>Name</th><th>Section</th><th>Event</th><th>Date</th><th>Status</th></tr></thead><tbody>`);
        records.forEach(attendee => {
            htmlParts.push(`<tr><td><strong>${attendee.firstname||''} ${attendee.lastname||''}</strong></td><td>${attendee.sectionname||'-'}</td><td>${attendee._eventName||'-'}</td><td>${attendee._eventDate||'-'}</td><td><span class="badge badge-${color}">${status}</span></td></tr>`);
        });
        htmlParts.push(`</tbody></table></div></div></div>`);
    });
    groupedContent.innerHTML = htmlParts.join(''); // Inject the HTML.
}

// Renders the "Camp Groups" table, which is a simple list of unique attendees.
// This view is primarily intended for easily copying names for camp group planning.
function renderCampGroupsTable(attendees) {
    const campGroupsContent = document.getElementById('camp-groups-content');
    if (!campGroupsContent) return;

    if (attendees.length === 0) {
        campGroupsContent.innerHTML = `<div class="text-center py-4"><i class="fas fa-info-circle text-muted" style="font-size:2rem;"></i><p class="text-muted mt-2">No attendees.</p></div>`;
        return;
    }

    // Derive a list of unique attendees (by first and last name).
    const uniqueAttendees = {};
    attendees.forEach(attendee => {
        const nameKey = `${attendee.firstname} ${attendee.lastname}`;
        if (!uniqueAttendees[nameKey]) {
            uniqueAttendees[nameKey] = {
                firstname: attendee.firstname,
                lastname: attendee.lastname,
                sectionname: attendee.sectionname // Keep section name for context
            };
        }
    });
    const uniqueAttendeesList = Object.values(uniqueAttendees);

    // Start building HTML for the list.
    let html = `<div class="d-flex justify-content-between align-items-center mb-3 px-3 pt-3"><h6 class="mb-0"><i class="fas fa-campground me-2"></i>Camp Groups</h6><small class="text-muted">${uniqueAttendeesList.length} attendee(s)</small></div><div class="table-responsive"><table class="table table-striped table-sm"><thead class="thead-light"><tr><th>Name</th></tr></thead><tbody>`;
    // Sort unique attendees by last name, then first name.
    uniqueAttendeesList.sort((a,b) => {
        const lnc = a.lastname.localeCompare(b.lastname);
        if (lnc !== 0) return lnc;
        return a.firstname.localeCompare(b.firstname);
    });
    uniqueAttendeesList.forEach(attendee => {
        html += `<tr><td><strong>${attendee.firstname} ${attendee.lastname}</strong><br><small class="text-muted">${attendee.sectionname||'-'}</small></td></tr>`;
    });
    html += `</tbody></table></div><div class="px-3 pb-3"><small class="text-muted"><i class="fas fa-info-circle me-1"></i>Simple list for camp groups.</small></div>`;
    campGroupsContent.innerHTML = html; // Inject the HTML.
}

// Main function to render the tabbed interface for attendance views.
// It sets up the tab structure and calls the respective rendering functions for each tab pane.
// attendees: The array of all attendee data to be displayed across the tabs.
export function renderTabbedAttendanceView(attendees) {
    const attendancePanel = document.getElementById('attendance-panel');
    if (!attendancePanel) return;

    // HTML structure for the tabs ('Summary', 'Detailed'/'Grouped', 'Camp Groups').
    const tabsHtml = `
        <div class="card shadow-sm h-100">
            <div class="card-header bg-info text-white">
                <div class="d-flex justify-content-between align-items-center">
                    <h5 class="mb-0"><i class="fas fa-users"></i> Attendance Records
                        <span class="badge badge-light text-dark ms-2">${attendees.length} total</span></h5>
                </div>
            </div>
            <div class="card-body p-0">
                <nav>
                    <div class="nav nav-tabs border-bottom" id="nav-tab" role="tablist">
                        <button class="nav-link active" id="nav-summary-tab" data-toggle="tab" data-target="#nav-summary" type="button" role="tab" aria-controls="nav-summary" aria-selected="true" onclick="switchAttendanceTab('summary')">
                            <i class="fas fa-table me-1"></i> Summary
                        </button>
                        <button class="nav-link" id="nav-grouped-tab" data-toggle="tab" data-target="#nav-grouped" type="button" role="tab" aria-controls="nav-grouped" aria-selected="false" onclick="switchAttendanceTab('grouped')">
                            <i class="fas fa-layer-group me-1"></i> Detailed
                        </button>
                        <button class="nav-link" id="nav-camp-groups-tab" data-toggle="tab" data-target="#nav-camp-groups" type="button" role="tab" aria-controls="nav-camp-groups" aria-selected="false" onclick="switchAttendanceTab('camp-groups')">
                            <i class="fas fa-campground me-1"></i> Camp Groups
                        </button>
                    </div>
                </nav>
                <div class="tab-content" id="nav-tabContent">
                    <div class="tab-pane fade show active" id="nav-summary" role="tabpanel" aria-labelledby="nav-summary-tab"><div id="summary-content" class="p-0"></div></div>
                    <div class="tab-pane fade" id="nav-grouped" role="tabpanel" aria-labelledby="nav-grouped-tab"><div id="grouped-content" class="p-0"></div></div>
                    <div class="tab-pane fade" id="nav-camp-groups" role="tabpanel" aria-labelledby="nav-camp-groups-tab"><div id="camp-groups-content" class="p-0"></div></div>
                </div>
            </div>
        </div>`;
    attendancePanel.innerHTML = tabsHtml; // Inject tab structure.

    // Call the rendering functions to populate the content of each tab pane.
    renderSummaryAttendanceTable(attendees);
    renderGroupedAttendanceTable(attendees);
    renderCampGroupsTable(attendees);
}

// Handles the visual switching between tabs in the attendance panel.
// Updates 'active' classes on tab buttons and tab panes.
// tabType: String identifying the tab to switch to ('summary', 'grouped', 'camp-groups').
export function switchAttendanceTab(tabType) {
    // Deactivate all tabs and panes first.
    document.querySelectorAll('#nav-tab .nav-link').forEach(tab => {
        tab.classList.remove('active');
        tab.setAttribute('aria-selected', 'false');
    });
    document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('show', 'active'));

    // Activate the selected tab and its corresponding pane.
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

// Handles the expand/collapse functionality for sections in the 'Grouped' attendance view.
// Toggles the 'show' class on the collapsible element and updates the chevron icon.
// collapseId: The ID of the collapsible element to toggle.
export function toggleGroupedSection(collapseId) {
    const collapseElement = document.getElementById(collapseId);
    const icon = document.getElementById(`icon-${collapseId}`); // Icon associated with this collapsible section.
    if (collapseElement && icon) {
        if (collapseElement.classList.contains('show')) {
            collapseElement.classList.remove('show'); // Collapse
            icon.classList.remove('fa-chevron-down');
            icon.classList.add('fa-chevron-right'); // Change icon to 'expand'
        } else {
            collapseElement.classList.add('show'); // Expand
            icon.classList.remove('fa-chevron-right');
            icon.classList.add('fa-chevron-down'); // Change icon to 'collapse'
        }
    }
}
