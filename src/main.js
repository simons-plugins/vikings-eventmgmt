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

// Show login button only if not authenticated
function showLoginOnly() {
    document.getElementById('app-content').innerHTML = '';
    document.getElementById('osm-login-btn').style.display = '';
}

// Show the main app UI after authentication
function showMainUI() {
    document.getElementById('osm-login-btn').style.display = 'none';
    
    // Replace the centered login layout with full-width app layout
    const mainContainer = document.querySelector('main .row');
    mainContainer.className = 'row';
    mainContainer.innerHTML = `
        <div class="col-12 col-md-4">
            <div class="card shadow-sm mb-4">
                <div class="card-body">
                    <button id="get-sections-btn" class="btn btn-secondary btn-block mb-3">Get Sections</button>
                    <div id="sections-table-container"></div>
                </div>
            </div>
            <div class="card shadow-sm mb-4">
                <div class="card-body">
                    <div id="events-table-container"></div>
                </div>
            </div>
        </div>
        <div class="col-12 col-md-8">
            <div class="card shadow-sm mb-4">
                <div class="card-body">
                    <div id="attendance-panel"></div>
                </div>
            </div>
        </div>
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
async function handleEventSelect(selectedEventIndices) {
    if (selectedEventIndices.length === 0) {
        showError('Please select at least one event');
        return;
    }

    showSpinner();
    try {
        let allAttendees = [];
        
        // Get the events from the current events table
        const eventsTable = document.getElementById('events-table');
        const eventRows = eventsTable.querySelectorAll('tr');
        
        for (const idx of selectedEventIndices) {
            // You'll need to implement getEventAttendance logic here
            // const attendees = await getEventAttendance(eventId);
            // allAttendees = allAttendees.concat(attendees);
        }
        
        renderAttendeesTable(allAttendees);
        
    } catch (err) {
        showError('Failed to load attendees');
        console.error(err);
    } finally {
        hideSpinner();
    }
}

// Add this function:
function initializeApp() {
    if (getToken()) {
        showMainUI();
    } else {
        showLoginOnly();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Hide UI elements
    document.getElementById('spinner').style.display = 'none';
    const errorMsg = document.getElementById('error-message');
    errorMsg.style.display = 'none';
    errorMsg.textContent = '';
    
    // Initialize app
    initializeApp();
});

// OSM login button logic
document.getElementById('osm-login-btn').addEventListener('click', function () {
    const authUrl = `https://www.onlinescoutmanager.co.uk/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}`;
    window.location.href = authUrl;
});