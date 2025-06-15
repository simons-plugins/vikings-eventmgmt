// Module for event handlers.
// Will include functions moved from main.js.

// --- Imports ---
import { getMostRecentTermId, getEvents, getEventAttendance } from './api.js';
import { showSpinner, hideSpinner, showError, renderEventsTable } from '../ui.js';
import { renderTabbedAttendanceView } from '../ui/attendance.js'; // Moved

// --- Event Handlers ---

import { showBlockedScreen } from '../ui.js'; // General UI function

// --- Event Handlers ---

// Dependencies for handleSectionSelect:
// - showError (already imported from ui.js)
// - showBlockedScreen (imported above from ui.js)
// - showSpinner, hideSpinner (already imported from ui.js)
// - currentSectionsData (now passed as a parameter)
// - getMostRecentTermId, getEvents (already imported from api.js)
// - renderEventsTable (already imported from ui.js)
// - handleEventSelect (local to this module)
export async function handleSectionSelect(selectedSectionIds, currentSectionsData) {
    // Check if application is blocked before making any API calls
    if (sessionStorage.getItem('osm_blocked') === 'true') {
        showError('Application is blocked by OSM. Contact administrator.');
        showBlockedScreen();
        return;
    }

    if (selectedSectionIds.length === 0) {
        showError('Please select at least one section');
        return;
    }

    showSpinner();
    try {
        let allEvents = [];

        // Create a mapping of sectionId to sectionName from stored data
        const sectionIdToName = {};
        if (currentSectionsData && Array.isArray(currentSectionsData)) {
            currentSectionsData.forEach(section => {
                sectionIdToName[section.sectionid] = section.sectionname;
            });
        }

        for (const sectionId of selectedSectionIds) {
            const termId = await getMostRecentTermId(sectionId);
            if (termId) {
                const eventsData = await getEvents(sectionId, termId);
                if (eventsData && eventsData.items) {
                    const eventsWithSectionName = eventsData.items.map(event => ({
                        ...event,
                        sectionname: sectionIdToName[sectionId] || 'Unknown Section',
                        sectionid: sectionId
                    }));
                    allEvents = allEvents.concat(eventsWithSectionName);
                }
            }
        }
        // Pass currentSectionsData to handleEventSelect if it needs it, or ensure renderEventsTable can correctly
        // set up the callback chain. For now, handleEventSelect does not use currentSectionsData.
        renderEventsTable(allEvents, (events) => handleEventSelect(events, currentSectionsData), true);

    } catch (err) {
        showError('Failed to load events');
        console.error(err);
    } finally {
        hideSpinner();
    }
}

// Modified handleEventSelect to accept currentSectionsData, though it doesn't use it directly yet.
// This is for consistency in how handlers might be called, especially if event selection needs context from all sections.
export async function handleEventSelect(selectedEvents, currentSectionsData) {
    if (!selectedEvents || selectedEvents.length === 0) {
        showError('Please select at least one event');
        return;
    }

    showSpinner();
    try {
        let allAttendees = [];

        for (const event of selectedEvents) {
            try {
                console.log('Processing event:', {
                    eventid: event.eventid,
                    sectionid: event.sectionid,
                    termid: event.termid,
                    name: event.name
                });

                let termId = event.termid;
                if (!termId) {
                    termId = await getMostRecentTermId(event.sectionid);
                }

                const attendanceData = await getEventAttendance(event.sectionid, event.eventid, termId);

                console.log('Raw attendance data:', attendanceData);

                if (attendanceData && attendanceData.items && attendanceData.items.length > 0) {
                    const eventAttendees = attendanceData.items.map(attendee => ({
                        ...attendee,
                        sectionname: event.sectionname,
                        _eventName: event.name,
                        _eventDate: event.date
                    }));
                    allAttendees = allAttendees.concat(eventAttendees);
                } else if (attendanceData && Array.isArray(attendanceData) && attendanceData.length > 0) {
                    const eventAttendees = attendanceData.map(attendee => ({
                        ...attendee,
                        sectionname: event.sectionname,
                        _eventName: event.name,
                        _eventDate: event.date
                    }));
                    allAttendees = allAttendees.concat(eventAttendees);
                } else {
                    console.warn('No attendance data found for event:', event.name, attendanceData);
                }

            } catch (eventError) {
                console.error(`Failed to fetch attendance for event ${event.name}:`, eventError);
            }
        }

        if (allAttendees.length === 0) {
            showError('No attendance data found for selected events');
        } else {
            renderTabbedAttendanceView(allAttendees); // Imported from ui.js (assumed)
        }

    } catch (err) {
        showError('Failed to load attendees');
        console.error('Overall error:', err);
    } finally {
        hideSpinner();
    }
}
