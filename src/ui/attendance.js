// Attendance rendering functions, moved from src/ui.js

// Helper function (internal to this module)
function getStatusColor(status) {
    switch (status?.toLowerCase()) {
        case 'yes': case 'attended': case 'present': return 'success';
        case 'no': case 'absent': case 'not attended': return 'danger';
        case 'maybe': case 'unknown': return 'warning';
        default: return 'secondary';
    }
}

// Helper function (internal to this module)
function addSummaryPersonExpandFunctionality() {
    document.querySelectorAll('.summary-person-row').forEach(row => {
        row.addEventListener('click', function() {
            const personIdx = this.dataset.personIdx;
            const detailsRow = document.getElementById(`summary-person-details-${personIdx}`);
            const expandIcon = this.querySelector('.summary-expand-icon');
            if (detailsRow.style.display === 'none') { detailsRow.style.display = ''; expandIcon.textContent = '▲'; this.classList.add('expanded'); }
            else { detailsRow.style.display = 'none'; expandIcon.textContent = '▼'; this.classList.remove('expanded'); }
        });
    });
}

// Helper function (internal to this module)
function addSummaryTableSorting(attendeesByPerson) {
    const sortableHeaders = document.querySelectorAll('#summary-attendance-table .sortable');
    let currentSort = { column: null, direction: 'asc' };
    sortableHeaders.forEach(header => {
        header.addEventListener('click', function() {
            const sortColumn = this.dataset.sort;
            const tbody = document.getElementById('summary-attendance-tbody');
            const rows = Array.from(tbody.querySelectorAll('.summary-person-row'));
            if (currentSort.column === sortColumn) { currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc'; }
            else { currentSort.direction = 'asc'; }
            currentSort.column = sortColumn;
            sortableHeaders.forEach(h => h.classList.remove('sort-asc', 'sort-desc'));
            this.classList.add(currentSort.direction === 'asc' ? 'sort-asc' : 'sort-desc');
            rows.sort((a, b) => {
                let comparison = 0;
                switch (sortColumn) {
                    case 'firstname': comparison = a.dataset.firstname.toLowerCase().localeCompare(b.dataset.firstname.toLowerCase()); break;
                    case 'lastname': comparison = a.dataset.lastname.toLowerCase().localeCompare(b.dataset.lastname.toLowerCase()); break;
                    case 'name': const lnc = a.dataset.lastname.toLowerCase().localeCompare(b.dataset.lastname.toLowerCase()); if (lnc !== 0) comparison = lnc; else comparison = a.dataset.firstname.toLowerCase().localeCompare(b.dataset.firstname.toLowerCase()); break;
                    case 'status': const tYA = parseInt(a.dataset.totalYes) || 0, tNA = parseInt(a.dataset.totalNo) || 0, tYB = parseInt(b.dataset.totalYes) || 0, tNB = parseInt(b.dataset.totalNo) || 0; const totalA = tYA + tNA, totalB = tYB + tNB; const rA = totalA > 0 ? tYA / totalA : 0, rB = totalB > 0 ? tYB / totalB : 0; if (rA < rB) comparison = -1; else if (rA > rB) comparison = 1; else { if (tYA < tYB) comparison = -1; else if (tYA > tYB) comparison = 1; else comparison = 0; } break;
                    default: return 0;
                }
                return currentSort.direction === 'asc' ? comparison : -comparison;
            });
            rows.forEach((row, index) => {
                const personIdx = row.dataset.personIdx; const detailsRow = document.getElementById(`summary-person-details-${personIdx}`);
                row.dataset.personIdx = index; if (detailsRow) detailsRow.id = `summary-person-details-${index}`;
                tbody.appendChild(row); if (detailsRow) tbody.appendChild(detailsRow);
            });
            addSummaryPersonExpandFunctionality();
        });
    });
}

// Helper function (internal to this module)
function addSummaryAttendeeFiltering(attendeesByPerson, originalAttendees) {
    const sectionFilter = document.getElementById('summary-section-filter');
    const eventFilter = document.getElementById('summary-event-filter');
    const statusFilter = document.getElementById('summary-status-filter');
    const nameFilter = document.getElementById('summary-name-filter');
    const clearButton = document.getElementById('summary-clear-filters-btn');
    function applyFilters() {
        const sectionVal = sectionFilter.value.toLowerCase(), eventVal = eventFilter.value.toLowerCase(), statusVal = statusFilter.value.toLowerCase(), nameVal = nameFilter.value.toLowerCase();
        let visibleCount = 0;
        document.querySelectorAll('.summary-person-row').forEach(row => {
            const personIdx = row.dataset.personIdx, personKey = Object.keys(attendeesByPerson)[personIdx], person = attendeesByPerson[personKey];
            const nameMatch = !nameVal || (person.firstname.toLowerCase().includes(nameVal) || person.lastname.toLowerCase().includes(nameVal));
            const eventsMatch = person.events.some(evt => (!sectionVal || evt.sectionname.toLowerCase().includes(sectionVal)) && (!eventVal || evt._eventName.toLowerCase().includes(eventVal)) && (!statusVal || evt.attending.toLowerCase().includes(statusVal)));
            if (nameMatch && eventsMatch) { row.style.display = ''; document.getElementById(`summary-person-details-${personIdx}`).style.display = 'none'; row.classList.remove('expanded'); row.querySelector('.summary-expand-icon').textContent = '▼'; visibleCount++; }
            else { row.style.display = 'none'; document.getElementById(`summary-person-details-${personIdx}`).style.display = 'none'; }
        });
        document.getElementById('summary-attendee-count').textContent = visibleCount;
    }
    [sectionFilter, eventFilter, statusFilter, nameFilter].forEach(f => { f.addEventListener('change', applyFilters); f.addEventListener('input', applyFilters); });
    clearButton.addEventListener('click', () => { [sectionFilter, eventFilter, statusFilter, nameFilter].forEach(f => f.value = ''); applyFilters(); });
}

// Helper function (internal to this module)
function renderSummaryAttendanceTable(attendees) {
    const summaryContent = document.getElementById('summary-content');
    if (!summaryContent) return;
    if (attendees.length === 0) {
        summaryContent.innerHTML = `<p class="text-muted text-center">No attendees found.</p>`;
        return;
    }
    const attendeesByPerson = {};
    attendees.forEach(attendee => {
        const personKey = `${attendee.firstname} ${attendee.lastname}`;
        if (!attendeesByPerson[personKey]) {
            attendeesByPerson[personKey] = { firstname: attendee.firstname, lastname: attendee.lastname, events: [], totalYes: 0, totalNo: 0 };
        }
        attendeesByPerson[personKey].events.push(attendee);
        if (attendee.attending === 'Yes') attendeesByPerson[personKey].totalYes++; else attendeesByPerson[personKey].totalNo++;
    });
    const uniqueSections = [...new Set(attendees.map(a => a.sectionname))];
    const uniqueEvents = [...new Set(attendees.map(a => a._eventName))];
    const uniqueStatuses = [...new Set(attendees.map(a => a.attending))];
    const isMobile = window.innerWidth <= 767;
    let html = `<div class="d-flex justify-content-between align-items-center mb-3"><h6 class="mb-0">Attendance Summary</h6><small class="text-muted"><span id="summary-attendee-count">${Object.keys(attendeesByPerson).length}</span> person(s), <span id="summary-event-count">${attendees.length}</span> record(s)</small></div>`;
    html += `<div class="row mb-3"><div class="col-md-3 mb-2"><select id="summary-section-filter" class="form-select form-select-sm"><option value="">All Sections</option>${uniqueSections.map(s => `<option value="${s}">${s}</option>`).join('')}</select></div><div class="col-md-3 mb-2"><select id="summary-event-filter" class="form-select form-select-sm"><option value="">All Events</option>${uniqueEvents.map(e => `<option value="${e}">${e}</option>`).join('')}</select></div><div class="col-md-3 mb-2"><select id="summary-status-filter" class="form-select form-select-sm"><option value="">All Statuses</option>${uniqueStatuses.map(st => `<option value="${st}">${st}</option>`).join('')}</select></div><div class="col-md-3 mb-2"><input type="text" id="summary-name-filter" class="form-control form-control-sm" placeholder="Search name..."></div></div>`;
    html += `<div class="mb-3"><button id="summary-clear-filters-btn" class="btn btn-outline-secondary btn-sm">Clear Filters</button></div><div class="table-responsive"><table id="summary-attendance-table" class="table table-striped table-sm">`;
    if (isMobile) {
        html += `<thead><tr><th style="width: 70px;" class="text-center sortable" data-sort="status">Status <span class="sort-arrow">⇅</span></th><th class="sortable" data-sort="name">Name <span class="sort-arrow">⇅</span></th><th style="width: 40px;" class="text-center">▼</th></tr></thead><tbody id="summary-attendance-tbody">`;
    } else {
        html += `<thead><tr><th style="width: 120px;" class="text-center sortable" data-sort="status">Attending <span class="sort-arrow">⇅</span></th><th class="sortable" data-sort="firstname">First Name <span class="sort-arrow">⇅</span></th><th class="sortable" data-sort="lastname">Last Name <span class="sort-arrow">⇅</span></th><th style="width: 40px;" class="text-center">▼</th></tr></thead><tbody id="summary-attendance-tbody">`;
    }
    Object.entries(attendeesByPerson).forEach(([personKey, person], personIdx) => {
        if (isMobile) {
            html += `<tr class="summary-person-row" data-person-idx="${personIdx}" data-firstname="${person.firstname}" data-lastname="${person.lastname}" data-total-yes="${person.totalYes}" data-total-no="${person.totalNo}" style="cursor: pointer;"><td class="text-center total-column"><div class="d-flex flex-column"><span class="text-success fw-bold">${person.totalYes}</span><span class="text-danger small">${person.totalNo}</span></div></td><td><div class="fw-bold">${person.firstname} ${person.lastname}</div><small class="text-muted">${person.events.length} event(s)</small></td><td class="text-center"><span class="summary-expand-icon">▼</span></td></tr>`;
        } else {
            html += `<tr class="summary-person-row" data-person-idx="${personIdx}" data-firstname="${person.firstname}" data-lastname="${person.lastname}" data-total-yes="${person.totalYes}" data-total-no="${person.totalNo}" style="cursor: pointer;"><td class="text-center"><span class="text-success fw-bold">${person.totalYes}</span> / <span class="text-danger">${person.totalNo}</span></td><td>${person.firstname}</td><td>${person.lastname}</td><td class="text-center"><span class="summary-expand-icon">▼</span></td></tr>`;
        }
        html += `<tr class="summary-person-details-row" id="summary-person-details-${personIdx}" style="display: none;"><td colspan="${isMobile ? 3 : 4}" class="bg-light p-0"><div class="table-responsive"><table class="table table-sm mb-0"><thead class="bg-secondary text-white"><tr><th class="small">Section</th><th class="small">Event</th><th class="small text-center">Status</th></tr></thead><tbody>`;
        person.events.forEach(event => { html += `<tr><td class="small">${event.sectionname||''}</td><td class="small">${event._eventName||''}</td><td class="small text-center ${event.attending === 'Yes' ? 'text-success':'text-danger'}"><strong>${event.attending||''}</strong></td></tr>`; });
        html += `</tbody></table></div></td></tr>`;
    });
    html += `</tbody></table></div>`;
    summaryContent.innerHTML = html;
    if (!document.getElementById('sortable-style')) { const style = document.createElement('style'); style.id = 'sortable-style'; style.textContent = `.sortable{cursor:pointer;user-select:none;position:relative;}.sortable:hover{background-color:#f8f9fa;}.sort-arrow{font-size:0.8em;margin-left:4px;color:#6c757d;}.sortable.sort-asc .sort-arrow{color:#007bff;}.sortable.sort-desc .sort-arrow{color:#007bff;}.sortable.sort-asc .sort-arrow::after{content:' ▲';}.sortable.sort-desc .sort-arrow::after{content:' ▼';}`; document.head.appendChild(style); }
    addSummaryPersonExpandFunctionality();
    addSummaryTableSorting(attendeesByPerson);
    addSummaryAttendeeFiltering(attendeesByPerson, attendees);
}

// Helper function (internal to this module)
function renderGroupedAttendanceTable(attendees) {
    const groupedContent = document.getElementById('grouped-content');
    if (!groupedContent) return;
    const groupedAttendees = {};
    attendees.forEach(attendee => { const status = attendee.attending || attendee.status || 'Unknown'; if (!groupedAttendees[status]) groupedAttendees[status] = []; groupedAttendees[status].push(attendee); });
    const statusPriority = { 'Yes': 1, 'No': 2, 'Invited': 3 };
    const sortedStatuses = Object.keys(groupedAttendees).sort((a, b) => { const pA = statusPriority[a] || 999, pB = statusPriority[b] || 999; if (pA !== pB) return pA - pB; return a.localeCompare(b); });
    if (sortedStatuses.length === 0) { groupedContent.innerHTML = `<div class="text-center py-4"><i class="fas fa-info-circle text-muted" style="font-size: 2rem;"></i><p class="text-muted mt-2">No records.</p></div>`; return; }
    const htmlParts = [];
    sortedStatuses.forEach((status, index) => {
        const records = groupedAttendees[status], isExpanded = index === 0, collapseId = `grouped-collapse-${status.replace(/\s+/g, '-').toLowerCase()}`, color = getStatusColor(status);
        htmlParts.push(`<div class="border-bottom"><div class="d-flex justify-content-between align-items-center p-3 bg-light border-bottom cursor-pointer" style="cursor:pointer;" onclick="toggleGroupedSection('${collapseId}')"><h6 class="mb-0"><i class="fas fa-chevron-${isExpanded?'down':'right'} me-2" id="icon-${collapseId}"></i><span class="badge badge-${color} me-2">${status}</span><span class="text-muted">${records.length} attendees</span></h6></div><div class="collapse ${isExpanded?'show':''}" id="${collapseId}"><div class="table-responsive"><table class="table table-sm table-hover mb-0"><thead class="thead-light"><tr><th>Name</th><th>Section</th><th>Event</th><th>Date</th><th>Status</th></tr></thead><tbody>`);
        records.forEach(attendee => { htmlParts.push(`<tr><td><strong>${attendee.firstname||''} ${attendee.lastname||''}</strong></td><td>${attendee.sectionname||'-'}</td><td>${attendee._eventName||'-'}</td><td>${attendee._eventDate||'-'}</td><td><span class="badge badge-${color}">${status}</span></td></tr>`); });
        htmlParts.push(`</tbody></table></div></div></div>`);
    });
    groupedContent.innerHTML = htmlParts.join('');
}

// Helper function (internal to this module)
function renderCampGroupsTable(attendees) {
    const campGroupsContent = document.getElementById('camp-groups-content');
    if (!campGroupsContent) return;
    if (attendees.length === 0) { campGroupsContent.innerHTML = `<div class="text-center py-4"><i class="fas fa-info-circle text-muted" style="font-size:2rem;"></i><p class="text-muted mt-2">No attendees.</p></div>`; return; }
    const uniqueAttendees = {};
    attendees.forEach(attendee => { const nameKey = `${attendee.firstname} ${attendee.lastname}`; if (!uniqueAttendees[nameKey]) uniqueAttendees[nameKey] = { firstname: attendee.firstname, lastname: attendee.lastname, sectionname: attendee.sectionname }; });
    const uniqueAttendeesList = Object.values(uniqueAttendees);
    let html = `<div class="d-flex justify-content-between align-items-center mb-3 px-3 pt-3"><h6 class="mb-0"><i class="fas fa-campground me-2"></i>Camp Groups</h6><small class="text-muted">${uniqueAttendeesList.length} attendee(s)</small></div><div class="table-responsive"><table class="table table-striped table-sm"><thead class="thead-light"><tr><th>Name</th></tr></thead><tbody>`;
    uniqueAttendeesList.sort((a,b) => { const lnc = a.lastname.localeCompare(b.lastname); if (lnc !== 0) return lnc; return a.firstname.localeCompare(b.firstname); });
    uniqueAttendeesList.forEach(attendee => { html += `<tr><td><strong>${attendee.firstname} ${attendee.lastname}</strong><br><small class="text-muted">${attendee.sectionname||'-'}</small></td></tr>`; });
    html += `</tbody></table></div><div class="px-3 pb-3"><small class="text-muted"><i class="fas fa-info-circle me-1"></i>Simple list for camp groups.</small></div>`;
    campGroupsContent.innerHTML = html;
}

export function renderTabbedAttendanceView(attendees) {
    const attendancePanel = document.getElementById('attendance-panel');
    if (!attendancePanel) return;

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
    attendancePanel.innerHTML = tabsHtml;
    renderSummaryAttendanceTable(attendees);
    renderGroupedAttendanceTable(attendees);
    renderCampGroupsTable(attendees);
}

export function switchAttendanceTab(tabType) {
    document.querySelectorAll('#nav-tab .nav-link').forEach(tab => {
        tab.classList.remove('active');
        tab.setAttribute('aria-selected', 'false');
    });
    document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('show', 'active'));

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

export function toggleGroupedSection(collapseId) {
    const collapseElement = document.getElementById(collapseId);
    const icon = document.getElementById(`icon-${collapseId}`);
    if (collapseElement && icon) {
        if (collapseElement.classList.contains('show')) { collapseElement.classList.remove('show'); icon.classList.remove('fa-chevron-down'); icon.classList.add('fa-chevron-right'); }
        else { collapseElement.classList.add('show'); icon.classList.remove('fa-chevron-right'); icon.classList.add('fa-chevron-down'); }
    }
}
