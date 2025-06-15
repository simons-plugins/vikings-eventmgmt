// src/lib/handlers.js
// This module is responsible for managing event handlers related to user
// interactions, primarily selections made in the UI (e.g., selecting sections or events).
// It orchestrates API calls to fetch necessary data (like terms, events, attendance)
// and triggers UI updates to display this data based on user actions.

// --- Imports ---
import { getMostRecentTermId, getEvents, getEventAttendance } from './api.js';
import { showSpinner, hideSpinner, showError, renderEventsTable, showBlockedScreen } from '../ui.js'; // Added showBlockedScreen
import { renderTabbedAttendanceView } from '../ui/attendance.js'; // Moved

// --- Event Handlers ---

// Dependencies for handleSectionSelect:
// - showError (already imported from ui.js)
// - showBlockedScreen (imported above from ui.js)
// - showSpinner, hideSpinner (already imported from ui.js)
// - currentSectionsData (now passed as a parameter)
// - getMostRecentTermId, getEvents (already imported from api.js)
// - renderEventsTable (already imported from ui.js)
// - handleEventSelect (local to this module)

// Handles the selection of one or more sections by the user.
// Fetches events for the selected sections and renders them in a table.
export async function handleSectionSelect(selectedSectionIds, currentSectionsData) {
    // Initial check: if OSM access is blocked, show an error and stop.
    if (sessionStorage.getItem('osm_blocked') === 'true') {
        showError('Application is blocked by OSM. Contact administrator.');
        showBlockedScreen(); // Display a screen indicating access is blocked.
        return;
    }

    // If no sections are selected, show an error message.
    if (selectedSectionIds.length === 0) {
        showError('Please select at least one section');
        return;
    }

    showSpinner(); // Display a loading spinner to indicate background activity.
    try {
        let allEvents = []; // Array to accumulate events from all selected sections.

        // Create a mapping of sectionId to sectionName from currentSectionsData.
        // This is used to enrich event data with the section's name.
        const sectionIdToName = {};
        if (currentSectionsData && Array.isArray(currentSectionsData)) {
            currentSectionsData.forEach(section => {
                sectionIdToName[section.sectionid] = section.sectionname;
            });
        }

        // Iterate through each selected section ID.
        for (const sectionId of selectedSectionIds) {
            // Fetch the most recent term ID for the current section.
            // This is needed to scope the event fetching to the correct term.
            const termId = await getMostRecentTermId(sectionId);
            if (termId) {
                // Fetch events for the current section and term.
                const eventsData = await getEvents(sectionId, termId);
                if (eventsData && eventsData.items) {
                    // Augment each event with its section name and section ID.
                    // This information is useful for display and further processing.
                    const eventsWithSectionName = eventsData.items.map(event => ({
                        ...event,
                        sectionname: sectionIdToName[sectionId] || 'Unknown Section', // Fallback name
                        sectionid: sectionId
                    }));
                    allEvents = allEvents.concat(eventsWithSectionName); // Add to the list of all events.
                }
            }
        }
        // Render the fetched events in a table.
        // Pass a callback (handleEventSelect) to be invoked when events are selected from this table.
        renderEventsTable(allEvents, (events) => handleEventSelect(events, currentSectionsData), true);

    } catch (err) {
        // If any error occurs during the process, show a generic error message.
        showError('Failed to load events');
        console.error(err);
    } finally {
        hideSpinner();
    }
}

// Modified handleEventSelect to accept currentSectionsData, though it doesn't use it directly yet.
// This is for consistency in how handlers might be called, especially if event selection needs context from all sections.

// Handles the selection of one or more events by the user.
// Fetches attendance data for the selected events and renders it in a tabbed view.
export async function handleEventSelect(selectedEvents, currentSectionsData) {
    // If no events are selected, show an error message.
    if (!selectedEvents || selectedEvents.length === 0) {
        showError('Please select at least one event');
        return;
    }

    showSpinner(); // Display a loading spinner.
    try {
        let allAttendees = []; // Array to accumulate attendance data from all selected events.

        // Iterate through each selected event.
        for (const event of selectedEvents) {
            try {
                // Log the event being processed for debugging.
                console.log('Processing event:', {
                    eventid: event.eventid,
                    sectionid: event.sectionid,
                    termid: event.termid,
                    name: event.name
                });

                // Ensure termId is available for the event.
                // Primarily, it should come directly from the event object (event.termid).
                // As a fallback, if event.termid is missing, fetch the most recent termId for the event's section.
                // This fallback might be necessary if the event data structure isn't guaranteed to include termid.
                let termId = event.termid;
                if (!termId) {
                    console.warn(`TermID missing for event ${event.name}, attempting to fetch it.`);
                    termId = await getMostRecentTermId(event.sectionid);
                }

                // Fetch attendance data for the current event, section, and term.
                const attendanceData = await getEventAttendance(event.sectionid, event.eventid, termId);

                console.log('Raw attendance data for event', event.name, ':', attendanceData);

                // Process the fetched attendance data.
                // The API might return data in an object with an 'items' array, or directly as an array.
                if (attendanceData && attendanceData.items && attendanceData.items.length > 0) {
                    // Augment each attendee record with section name, event name, and event date
                    // from the parent event object for richer display in the attendance view.
                    const eventAttendees = attendanceData.items.map(attendee => ({
                        ...attendee,
                        sectionname: event.sectionname, // From the event object, added in handleSectionSelect
                        _eventName: event.name,          // Event's name
                        _eventDate: event.date           // Event's date
                    }));
                    allAttendees = allAttendees.concat(eventAttendees); // Add to the list of all attendees.
                } else if (attendanceData && Array.isArray(attendanceData) && attendanceData.length > 0) {
                    // Handle cases where attendanceData is directly an array.
                    const eventAttendees = attendanceData.map(attendee => ({
                        ...attendee,
                        sectionname: event.sectionname,
                        _eventName: event.name,
                        _eventDate: event.date
                    }));
                    allAttendees = allAttendees.concat(eventAttendees);
                } else {
                    // Log a warning if no attendance data is found for a specific event.
                    console.warn('No attendance data found for event:', event.name, attendanceData);
                }

            } catch (eventError) {
                // If fetching attendance for a specific event fails, log the error and continue with other events.
                // This prevents one failed event from blocking the entire process.
                console.error(`Failed to fetch attendance for event ${event.name}:`, eventError);
                // Optionally, inform the user about the specific event failure here if desired.
            }
        }

        // After processing all selected events:
        if (allAttendees.length === 0) {
            // If no attendance data was found for any of the selected events, show an error.
            showError('No attendance data found for selected events. Some events might have had issues loading.');
        } else {
            // Otherwise, render the aggregated attendance data in a tabbed view.
            renderTabbedAttendanceView(allAttendees);
        }

    } catch (err) {
        // Catch any overall errors that occurred outside individual event processing.
        showError('Failed to load attendees data');
        console.error('Overall error:', err);
    } finally {
        hideSpinner();
    }
}
