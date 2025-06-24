// src/pages/attendance-page.js
// Page component for attendance views
// Handles loading attendance data and managing different view tabs

import { showError, showSpinner, hideSpinner } from '../ui.js';
import { getEventAttendance } from '../lib/api.js';
import { renderTabbedAttendanceView } from '../ui/attendance.js';
import { getSelectedEvents, setAttendanceData, setAttendanceView } from '../lib/page-router.js';

// Initialize the attendance page
export async function initializeAttendancePage() {
    const selectedEvents = getSelectedEvents();
    
    console.log('Initializing attendance page for events:', selectedEvents?.length || 0);
    
    if (!selectedEvents || selectedEvents.length === 0) {
        showError('No events selected. Please go back and select events.');
        return;
    }

    // Show loading state in all views
    const views = ['summary-view', 'detailed-view', 'campgroups-view'];
    views.forEach(viewId => {
        const container = document.getElementById(viewId);
        if (container) {
            container.innerHTML = `
                <div class="text-center py-4">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                    <p class="mt-2 text-muted">Loading attendance data...</p>
                </div>
            `;
        }
    });

    try {
        showSpinner();
        
        // Load attendance data for all selected events
        const attendanceData = await loadAttendanceForEvents(selectedEvents);
        
        hideSpinner();
        
        if (!attendanceData || attendanceData.length === 0) {
            const errorContent = `
                <div class="text-center text-muted py-4">
                    <i class="fas fa-users-slash fa-3x mb-3"></i>
                    <h5>No attendance data found</h5>
                    <p>No attendance records were found for the selected events.</p>
                    <small class="text-muted">This could mean the events have no registered attendees.</small>
                </div>
            `;
            
            views.forEach(viewId => {
                const container = document.getElementById(viewId);
                if (container) {
                    container.innerHTML = errorContent;
                }
            });
            return;
        }

        // Store attendance data
        setAttendanceData(attendanceData);
        
        // Render the attendance views
        await renderAttendanceViews(attendanceData);
        
        // Set default view to summary
        setAttendanceView('summary');
        
        console.log(`Loaded attendance data for ${attendanceData.length} attendees`);
        
    } catch (error) {
        hideSpinner();
        console.error('Error loading attendance:', error);
        showError('Failed to load attendance data. Please try again.');
        
        const errorContent = `
            <div class="text-center text-danger py-4">
                <i class="fas fa-exclamation-triangle fa-3x mb-3"></i>
                <h5>Error Loading Attendance</h5>
                <p>${error.message || 'Failed to load attendance data'}</p>
                <button class="btn btn-outline-primary" onclick="window.location.reload()">
                    <i class="fas fa-sync me-2"></i>Try Again
                </button>
            </div>
        `;
        
        views.forEach(viewId => {
            const container = document.getElementById(viewId);
            if (container) {
                container.innerHTML = errorContent;
            }
        });
    }
}

// Load attendance data for selected events
async function loadAttendanceForEvents(selectedEvents) {
    let allAttendees = [];
    
    // Load attendance for each event
    for (const event of selectedEvents) {
        try {
            console.log(`Loading attendance for event: ${event.name} (${event.eventid})`);
            
            const attendanceResponse = await getEventAttendance(
                event.sectionid, 
                event.eventid, 
                event.termid
            );
            
            const attendees = attendanceResponse?.items || [];
            
            // Enrich attendees with event information
            const enrichedAttendees = attendees.map(attendee => ({
                ...attendee,
                eventid: event.eventid,
                eventname: event.name,
                eventdate: event.date,
                sectionid: event.sectionid,
                sectionname: event.sectionname
            }));
            
            allAttendees.push(...enrichedAttendees);
            
        } catch (error) {
            console.error(`Error fetching attendance for event ${event.eventid}:`, error);
            // Continue with other events even if one fails
        }
    }
    
    return allAttendees;
}

// Render all attendance views
async function renderAttendanceViews(attendanceData) {
    try {
        // For now, we'll render the data using the existing tabbed view logic
        // but adapt it to work with our new page structure
        
        // Create a temporary container for the tabbed view to render into
        const tempContainer = document.createElement('div');
        
        // Use the existing renderTabbedAttendanceView function
        await renderTabbedAttendanceView(attendanceData, getSelectedEvents(), tempContainer);
        
        // Extract the rendered content and distribute it to our view containers
        distributeRenderedContent(tempContainer);
        
    } catch (error) {
        console.error('Error rendering attendance views:', error);
        throw error;
    }
}

// Distribute the rendered tabbed content to separate view containers
function distributeRenderedContent(tempContainer) {
    // Find the tab content areas in the temporary container
    const summaryContent = tempContainer.querySelector('#attendance-summary');
    const detailedContent = tempContainer.querySelector('#attendance-detailed-groups');
    
    // Move content to our page containers
    if (summaryContent) {
        const summaryView = document.getElementById('summary-view');
        if (summaryView) {
            summaryView.innerHTML = '';
            summaryView.appendChild(summaryContent);
        }
    }
    
    if (detailedContent) {
        const detailedView = document.getElementById('detailed-view');
        if (detailedView) {
            detailedView.innerHTML = '';
            detailedView.appendChild(detailedContent);
        }
    }
    
    // For camp groups, we'll create a simple placeholder for now
    const campGroupsView = document.getElementById('campgroups-view');
    if (campGroupsView) {
        campGroupsView.innerHTML = `
            <div class="text-center text-muted py-4">
                <i class="fas fa-campground fa-3x mb-3"></i>
                <h5>Camp Groups View</h5>
                <p>Camp groups functionality will be available soon.</p>
                <small class="text-muted">This view will show attendees organized by their camp group assignments.</small>
            </div>
        `;
    }
}

// Switch between attendance views
export function switchAttendanceView(view) {
    console.log(`Switching to attendance view: ${view}`);
    setAttendanceView(view);
}

// Export for use in other modules
export { initializeAttendancePage as default };