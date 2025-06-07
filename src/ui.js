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

    let table = document.getElementById('events-table');
    if (!table) {
        table = document.createElement('table');
        table.id = 'events-table';
        table.className = 'table table-striped';
        container.appendChild(table);
    }

    table.innerHTML = `
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
        </tr>
    `;
    
    events.forEach((event, idx) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><input type="checkbox" class="event-checkbox" data-idx="${idx}"></td>
            <td>${event.sectionname || ''}</td>
            <td>${event.name || ''}</td>
            <td>${event.date || ''}</td>
            <td>${event.yes || 0}</td>
            <td>${event.yes_members || 0}</td>
            <td>${event.yes_yls || 0}</td>
            <td>${event.yes_leaders || 0}</td>
            <td>${event.no || 0}</td>
        `;
        table.appendChild(row);
    });

    // Add a button to load attendees for selected events
    let btn = document.getElementById('load-attendees-btn');
    if (!btn) {
        btn = document.createElement('button');
        btn.id = 'load-attendees-btn';
        btn.className = 'btn btn-primary';
        btn.textContent = 'Show Attendees for Selected Events';
        container.appendChild(btn);
    }
    btn.onclick = onLoadAttendees;
}

export function renderAttendeesTable(attendees) {
    let attendancePanel = document.getElementById('attendance-panel');
    attendancePanel.innerHTML = '';

    // --- Filter Bar ---
    const filterBar = document.createElement('div');
    filterBar.style.display = 'flex';
    filterBar.style.gap = '1em';
    filterBar.style.marginBottom = '1em';

    // State for filter
    let filterType = 'all'; // 'all', 'attending', 'youngpeople', 'youngleaders', 'leaders'

    // Buttons
    const btnShowAll = document.createElement('button');
    btnShowAll.textContent = 'Show All';
    btnShowAll.className = 'active-filter';
    const btnAttendingYes = document.createElement('button');
    btnAttendingYes.textContent = 'Attending: Yes';
    const btnYoungPeople = document.createElement('button');
    btnYoungPeople.textContent = 'Young People';
    const btnYoungLeaders = document.createElement('button');
    btnYoungLeaders.textContent = 'Young Leaders';
    const btnLeaders = document.createElement('button');
    btnLeaders.textContent = 'Leaders';

    // Add buttons to filter bar
    filterBar.appendChild(btnShowAll);
    filterBar.appendChild(btnAttendingYes);
    filterBar.appendChild(btnYoungPeople);
    filterBar.appendChild(btnYoungLeaders);
    filterBar.appendChild(btnLeaders);

    attendancePanel.appendChild(filterBar);

    // --- Table ---
    let attendanceTable = document.createElement('table');
    attendanceTable.id = 'attendance-table';
    attendancePanel.appendChild(attendanceTable);

    // Filtering logic
    function filterAttendees() {
        let filtered = attendees;
        if (filterType === 'attending') {
            filtered = attendees.filter(p => (p.attending || '').toLowerCase() === 'yes');
        } else if (filterType === 'youngpeople') {
            filtered = attendees.filter(p => (p.type || '').toLowerCase() === 'youngperson' || (p.type || '').toLowerCase() === 'young people');
        } else if (filterType === 'youngleaders') {
            filtered = attendees.filter(p => (p.type || '').toLowerCase().includes('young leader'));
        } else if (filterType === 'leaders') {
            filtered = attendees.filter(p => (p.type || '').toLowerCase().includes('leader') && !(p.type || '').toLowerCase().includes('young'));
        }
        return filtered;
    }

    function renderTableRows() {
        attendanceTable.innerHTML = `
            <tr>
                <th>Section</th>
                <th>Event</th>
                <th>Attending</th>
                <th>First Name</th>
                <th>Last Name</th>
                <th>Email</th>
                <th>Phone</th>
            </tr>
        `;
        const filtered = filterAttendees();
        if (filtered.length > 0) {
            for (const person of filtered) {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${person.sectionname || ''}</td>
                    <td>${person._eventName || ''}</td>
                    <td>${person.attending}</td>
                    <td>${person.firstname || ''}</td>
                    <td>${person.lastname || ''}</td>
                    <td></td>
                    <td></td>
                `;
                attendanceTable.appendChild(row);
            }
        } else {
            attendanceTable.innerHTML += `<tr><td colspan="7">No attendance data</td></tr>`;
        }
    }

    // Button handlers
    btnShowAll.onclick = () => {
        filterType = 'all';
        setActive(btnShowAll);
        renderTableRows();
    };
    btnAttendingYes.onclick = () => {
        filterType = 'attending';
        setActive(btnAttendingYes);
        renderTableRows();
    };
    btnYoungPeople.onclick = () => {
        filterType = 'youngpeople';
        setActive(btnYoungPeople);
        renderTableRows();
    };
    btnYoungLeaders.onclick = () => {
        filterType = 'youngleaders';
        setActive(btnYoungLeaders);
        renderTableRows();
    };
    btnLeaders.onclick = () => {
        filterType = 'leaders';
        setActive(btnLeaders);
        renderTableRows();
    };

    function setActive(activeBtn) {
        [btnShowAll, btnAttendingYes, btnYoungPeople, btnYoungLeaders, btnLeaders].forEach(btn => {
            btn.className = '';
        });
        activeBtn.className = 'active-filter';
    }

    // Initial render
    renderTableRows();
}