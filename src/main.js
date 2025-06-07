import {
    getUserRoles,
    getMostRecentTermId,
    getEvents,
    getEventAttendance,
    getToken
} from './api.js';
import {
    showSpinner,
    hideSpinner,
    showError,
    renderSectionsTable,
    renderEventsTable,
    renderAttendeesTable
} from './ui.js';

const clientId = '98YWRWrOQyUVAlJuPHs8AdsbVg2mUCQO';
const scope = 'section:member:read section:programme:read section:event:read';
const redirectUri = window.location.origin + '/callback.html';

// Always hide spinner and error message on page load
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('spinner').style.display = 'none';
    const errorMsg = document.getElementById('error-message');
    errorMsg.style.display = 'none';
    errorMsg.textContent = '';
});

// Show login button only if not authenticated
function showLoginOnly() {
    document.getElementById('app-content').innerHTML = '';
    document.getElementById('osm-login-btn').style.display = '';
}

// Show the main app UI after authentication
function showMainUI() {
    document.getElementById('osm-login-btn').style.display = 'none';
    document.getElementById('app-content').innerHTML = `
        <button id="get-sections-btn" class="btn btn-secondary btn-block mb-3" style="font-size:1.2em;">Get Sections</button>
        <div id="sections-table-container"></div>
        <div id="events-table-container"></div>
        <div id="attendance-panel"></div>
    `;

    document.getElementById('get-sections-btn').addEventListener('click', async () => {
        showSpinner();
        try {
            const roles = await getUserRoles();
            renderSectionsTable(roles, handleSectionSelect);
        } catch (err) {
            showError('Failed to load sections');
        } finally {
            hideSpinner();
        }
    });
}

// Complete handler for section selection
async function handleSectionSelect(selectedSectionIds) {
    if (selectedSectionIds.length === 0) {
        showError('Please select at least one section');
        return;
    }

    showSpinner();
    try {
        let allEvents = [];
        
        // Fetch events for each selected section
        for (const sectionId of selectedSectionIds) {
            const termId = await getMostRecentTermId(sectionId);
            if (termId) {
                const events = await getEvents(sectionId, termId);
                if (events.items) {
                    allEvents = allEvents.concat(events.items);
                }
            }
        }

        // Render the events table
        renderEventsTable(allEvents, handleEventSelect);
        
    } catch (err) {
        showError('Failed to load events');
        console.error(err);
    } finally {
        hideSpinner();
    }
}

// Handler for event selection (to load attendees)
async function handleEventSelect(selectedEventIds) {
    // Add your attendees loading logic here
    console.log('Selected events:', selectedEventIds);
}

// OSM login button logic
document.getElementById('osm-login-btn').addEventListener('click', function () {
    const authUrl = `https://www.onlinescoutmanager.co.uk/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}`;
    window.location.href = authUrl;
});

// On page load, show correct UI
if (getToken()) {
    showMainUI();
} else {
    showLoginOnly();
}