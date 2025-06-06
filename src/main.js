import {
    getUserRoles,
    getMostRecentTermId,
    getEvents,
    getEventAttendance
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

// OSM login button
document.getElementById('osm-login-btn').addEventListener('click', function () {
    const authUrl = `https://www.onlinescoutmanager.co.uk/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}`;
    window.location.href = authUrl;
});

// Get sections button
document.getElementById('get-sections-btn').addEventListener('click', getSections);

async function getSections() {
    showSpinner();
    try {
        const roles = await getUserRoles();
        const sectionIdToName = {};
        roles.forEach(role => {
            if (role.sectionid && role.sectionname) {
                sectionIdToName[role.sectionid] = role.sectionname;
            }
        });

        renderSectionsTable(sectionIdToName, async function () {
            const checked = Array.from(document.querySelectorAll('.section-checkbox:checked'));
            if (checked.length === 0) {
                showError('Please select at least one section.');
                return;
            }
            let allEvents = [];
            showSpinner();
            try {
                for (const cb of checked) {
                    const sectionid = cb.value;
                    const sectionname = sectionIdToName[sectionid];
                    const termid = await getMostRecentTermId(sectionid);
                    if (!termid) continue;
                    const events = await getEvents(sectionid, termid);
                    if (Array.isArray(events.items)) {
                        events.items.forEach(ev => {
                            ev.sectionname = sectionname;
                            ev.sectionid = sectionid;
                            ev.termid = termid;
                        });
                        allEvents = allEvents.concat(events.items);
                    }
                }
                renderEventsTable(allEvents, async function () {
                    const checked = Array.from(document.querySelectorAll('.event-checkbox:checked'));
                    if (checked.length === 0) {
                        showError('Please select at least one event.');
                        return;
                    }
                    let allAttendees = [];
                    showSpinner();
                    try {
                        for (const cb of checked) {
                            const idx = cb.getAttribute('data-idx');
                            const event = allEvents[idx];
                            const attendance = await getEventAttendance(event.eventid, event.sectionid, event.termid);
                            if (attendance.items && Array.isArray(attendance.items)) {
                                const filtered = attendance.items.filter(person => person.attending && person.attending.trim() !== '');
                                filtered.forEach(person => person._eventName = event.name);
                                allAttendees = allAttendees.concat(filtered);
                            }
                        }
                        renderAttendeesTable(allAttendees);
                    } catch (err) {
                        showError('Failed to load attendees.');
                    } finally {
                        hideSpinner();
                    }
                });
            } catch (err) {
                showError('Failed to load events.');
            } finally {
                hideSpinner();
            }
        });
    } catch (err) {
        showError('Failed to load sections.');
    } finally {
        hideSpinner();
    }
}