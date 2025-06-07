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
    console.log('showLoginOnly called'); // Debug
    const mainContainer = document.querySelector('main .row');
    console.log('mainContainer:', mainContainer); // Debug
    
    if (!mainContainer) {
        console.error('main .row not found in DOM');
        return;
    }
    
    mainContainer.className = 'row justify-content-center';
    mainContainer.innerHTML = `
        <div class="col-12 col-sm-8 col-md-6 col-lg-4">
            <div class="card shadow-sm mb-4">
                <div class="card-body text-center">
                    <button id="osm-login-btn"
                        class="btn btn-primary btn-lg w-100 mb-3"
                        style="font-size:1.5em; white-space: normal; line-height: 1.2;">
                        Login with<br>Online Scout Manager (OSM)
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Debug the button
    const loginBtn = document.getElementById('osm-login-btn');
    console.log('Login button:', loginBtn); // Debug
    
    if (loginBtn) {
        loginBtn.addEventListener('click', function () {
            console.log('Login button clicked!'); // Debug
            const authUrl = `https://www.onlinescoutmanager.co.uk/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}`;
            window.location.href = authUrl;
        });
    }
}

// Show the main app UI after authentication
function showMainUI() {
    const mainContainer = document.querySelector('main .row');
    mainContainer.className = 'row';
    mainContainer.innerHTML = `
        <div class="col-12 col-lg-4 mb-4">
            <div class="card shadow-sm h-100">
                <div class="card-header bg-primary text-white">
                    <h5 class="mb-0">Sections & Events</h5>
                </div>
                <div class="card-body">
                    <button id="get-sections-btn" class="btn btn-secondary btn-block mb-3">
                        Get Sections
                    </button>
                    <div id="sections-table-container"></div>
                    <div id="events-table-container" class="mt-3"></div>
                </div>
            </div>
        </div>
        <div class="col-12 col-lg-8 mb-4">
            <div class="card shadow-sm h-100">
                <div class="card-header bg-info text-white">
                    <h5 class="mb-0">Attendance Details</h5>
                </div>
                <div class="card-body">
                    <div id="attendance-panel">
                        <p class="text-muted text-center">
                            Select events from the left panel to view attendance details.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Re-attach event listener for the new button
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

// ONLY ONE handleEventSelect function - this one handles the UI directly
async function handleEventSelect() {
    // Get selected event checkboxes
    const selectedCheckboxes = document.querySelectorAll('.event-checkbox:checked');
    
    if (selectedCheckboxes.length === 0) {
        showError('Please select at least one event');
        return;
    }

    showSpinner();
    try {
        let allAttendees = [];
        
        // Get event data from the table rows
        selectedCheckboxes.forEach(checkbox => {
            const row = checkbox.closest('tr');
            const cells = row.querySelectorAll('td');
            
            // Extract event info from the table row
            const eventInfo = {
                section: cells[1].textContent,
                name: cells[2].textContent,
                date: cells[3].textContent
            };
            
            // For now, create mock attendee data
            // TODO: Replace with actual API call to get attendees
            const mockAttendees = [
                { 
                    sectionname: eventInfo.section, 
                    _eventName: eventInfo.name, 
                    firstname: 'John', 
                    lastname: 'Smith', 
                    attending: 'Yes' 
                },
                { 
                    sectionname: eventInfo.section, 
                    _eventName: eventInfo.name, 
                    firstname: 'Jane', 
                    lastname: 'Doe', 
                    attending: 'No' 
                }
            ];
            
            allAttendees = allAttendees.concat(mockAttendees);
        });

        renderAttendeesTable(allAttendees);
        
    } catch (err) {
        showError('Failed to load attendees');
        console.error(err);
    } finally {
        hideSpinner();
    }
}

function initializeApp() {
    // Hide UI elements
    document.getElementById('spinner').style.display = 'none';
    const errorMsg = document.getElementById('error-message');
    errorMsg.style.display = 'none';
    errorMsg.textContent = '';
    
    // Check if user is logged in
    const token = sessionStorage.getItem('access_token');
    if (token) {
        showMainUI();
    } else {
        showLoginOnly();
    }
}

// Call on page load
document.addEventListener('DOMContentLoaded', initializeApp);