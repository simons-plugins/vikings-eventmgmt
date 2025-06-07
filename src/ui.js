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
            <td><input type="checkbox" class="event-checkbox" data-idx="${idx}"></td>
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
    
    document.getElementById('load-attendees-btn').onclick = () => {
        const selected = Array.from(document.querySelectorAll('.event-checkbox:checked')).map(cb => parseInt(cb.dataset.idx));
        onLoadAttendees(selected);
    };
}

export function renderAttendeesTable(attendees) {
    let container = document.getElementById('attendance-panel');
    if (!container) {
        container = document.createElement('div');
        container.id = 'attendance-panel';
        document.getElementById('app-content').appendChild(container);
    }

    let html = `<table id="attendance-table" class="table table-striped">
        <tr>
            <th>Section</th>
            <th>Event</th>
            <th>First Name</th>
            <th>Last Name</th>
            <th>Attending</th>
        </tr>`;
    
    attendees.forEach(attendee => {
        html += `<tr>
            <td>${attendee.sectionname || ''}</td>
            <td>${attendee._eventName || ''}</td>
            <td>${attendee.firstname || ''}</td>
            <td>${attendee.lastname || ''}</td>
            <td>${attendee.attending || ''}</td>
        </tr>`;
    });
    
    html += `</table>`;
    container.innerHTML = html;
}