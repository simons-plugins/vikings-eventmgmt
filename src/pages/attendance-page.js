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
        
        console.log('💾 Loaded attendance data:', attendanceData?.length || 0, 'attendees');
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
        console.log('🎨 Starting to render attendance views...');
        await renderAttendanceViewsSimple(attendanceData);
        console.log('✅ Finished rendering attendance views');
        
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

// Render attendance views with simplified approach
async function renderAttendanceViewsSimple(attendanceData) {
    try {
        console.log('🔄 renderAttendanceViewsSimple called with', attendanceData?.length || 0, 'attendees');
        
        // Render summary view
        renderSummaryView(attendanceData);
        
        // Render detailed view
        renderDetailedView(attendanceData);
        
        // Render camp groups view with enriched data
        await renderCampGroupsView(attendanceData);
        
    } catch (error) {
        console.error('❌ Error rendering attendance views:', error);
        throw error;
    }
}

// Render the summary view for upcoming event management
function renderSummaryView(attendanceData) {
    const summaryView = document.getElementById('summary-view');
    if (!summaryView) return;
    
    console.log('📊 Rendering summary view for', attendanceData.length, 'registered attendees');
    
    // Group attendees by person
    const attendeesByPerson = {};
    attendanceData.forEach(attendee => {
        const key = `${attendee.firstname}_${attendee.lastname}_${attendee.dob}`;
        if (!attendeesByPerson[key]) {
            attendeesByPerson[key] = {
                firstname: attendee.firstname,
                lastname: attendee.lastname,
                events: []
            };
        }
        attendeesByPerson[key].events.push({
            eventname: attendee.eventname,
            eventdate: attendee.eventdate,
            status: attendee.attending || attendee.status || 'Unknown'
        });
    });
    
    const people = Object.values(attendeesByPerson);
    
    summaryView.innerHTML = `
        <div class="table-responsive">
            <table class="table table-hover">
                <thead class="table-primary">
                    <tr>
                        <th>Name</th>
                        <th>Events Registered</th>
                        <th>Status Overview</th>
                    </tr>
                </thead>
                <tbody>
                    ${people.map(person => {
                        const confirmedCount = person.events.filter(e => e.status?.toLowerCase() === 'yes').length;
                        const pendingCount = person.events.filter(e => ['maybe', 'invited', 'unknown'].includes(e.status?.toLowerCase())).length;
                        const totalEvents = person.events.length;
                        
                        return `
                            <tr>
                                <td><strong>${person.firstname} ${person.lastname}</strong></td>
                                <td>${totalEvents}</td>
                                <td>
                                    ${confirmedCount > 0 ? `<span class="badge bg-success me-1">${confirmedCount} Confirmed</span>` : ''}
                                    ${pendingCount > 0 ? `<span class="badge bg-warning me-1">${pendingCount} Pending</span>` : ''}
                                    ${confirmedCount === 0 && pendingCount === 0 ? '<span class="badge bg-secondary">No Response</span>' : ''}
                                </td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>
        <div class="mt-3 text-muted text-center">
            <small>Showing ${people.length} registered attendees for upcoming events</small>
        </div>
    `;
}

// Render the detailed view for upcoming event management
function renderDetailedView(attendanceData) {
    const detailedView = document.getElementById('detailed-view');
    if (!detailedView) return;
    
    console.log('📋 Rendering detailed view for', attendanceData.length, 'registrations');
    
    detailedView.innerHTML = `
        <div class="table-responsive">
            <table class="table table-sm table-striped">
                <thead class="table-dark">
                    <tr>
                        <th>Name</th>
                        <th>Event</th>
                        <th>Event Date</th>
                        <th>Registration Status</th>
                        <th>Section</th>
                    </tr>
                </thead>
                <tbody>
                    ${attendanceData.map((attendee, index) => {
                        const status = attendee.attending || attendee.status || 'Unknown';
                        const statusColor = status.toLowerCase() === 'yes' ? 'success' : 
                                          ['maybe', 'invited'].includes(status.toLowerCase()) ? 'warning' : 'secondary';
                        
                        return `
                            <tr>
                                <td>${attendee.firstname} ${attendee.lastname}</td>
                                <td>${attendee.eventname}</td>
                                <td>${attendee.eventdate || 'TBA'}</td>
                                <td>
                                    <span class="badge bg-${statusColor}">
                                        ${status}
                                    </span>
                                </td>
                                <td>${attendee.sectionname || 'N/A'}</td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>
        <div class="mt-3 text-muted text-center">
            <small>Showing ${attendanceData.length} event registrations</small>
        </div>
    `;
}

// Render the camp groups view with actual enriched data
async function renderCampGroupsView(attendanceData) {
    const campGroupsView = document.getElementById('campgroups-view');
    if (!campGroupsView) return;
    
    try {
        // Show loading state
        campGroupsView.innerHTML = `
            <div class="text-center py-4">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <p class="mt-2 text-muted">Loading camp group data...</p>
            </div>
        `;
        
        // Get unique attendees (remove duplicates by scoutid)
        const uniqueAttendees = attendanceData.filter((attendee, index, arr) => 
            index === arr.findIndex(a => a.scoutid === attendee.scoutid)
        );
        
        // Get unique section IDs from the attendance data
        const uniqueSectionIds = [...new Set(attendanceData.map(a => a.sectionid))];
        
        console.log(`Enriching ${uniqueAttendees.length} unique attendees from ${uniqueSectionIds.length} sections`);
        
        // Import enrichment function
        const { enrichAttendeesWithCampGroups } = await import('../lib/api.js');
        
        // Enrich attendees with camp group data
        const enrichedAttendees = await enrichAttendeesWithCampGroups(uniqueAttendees, uniqueSectionIds);
        
        console.log(`Enriched attendees:`, enrichedAttendees);
        
        // Import and render the camp groups page
        const { renderCampGroupsPage } = await import('../ui/camp-groups.js');
        
        // Create a container for the camp groups content
        campGroupsView.innerHTML = '<div id="camp-groups-container"></div>';
        
        // Render the camp groups
        renderCampGroupsPage(enrichedAttendees);
        
    } catch (error) {
        console.error('Error loading camp groups:', error);
        campGroupsView.innerHTML = `
            <div class="text-center text-danger py-4">
                <i class="fas fa-exclamation-triangle fa-3x mb-3"></i>
                <h5>Error Loading Camp Groups</h5>
                <p>${error.message || 'Failed to load camp group data'}</p>
                <button class="btn btn-outline-primary" onclick="location.reload()">
                    <i class="fas fa-sync me-2"></i>Try Again
                </button>
            </div>
        `;
    }
}

// Distribute the rendered tabbed content to separate view containers
function distributeRenderedContent(tempContainer) {
    console.log('🔍 Looking for content in temp container...');
    
    // Find the tab content areas in the temporary container
    const summaryContent = tempContainer.querySelector('#attendance-summary');
    const detailedContent = tempContainer.querySelector('#attendance-detailed-groups');
    
    console.log('🔍 Found content:', {
        summary: !!summaryContent,
        detailed: !!detailedContent,
        summaryHTML: summaryContent?.innerHTML?.length || 0,
        detailedHTML: detailedContent?.innerHTML?.length || 0
    });
    
    // Move content to our page containers
    if (summaryContent) {
        const summaryView = document.getElementById('summary-view');
        if (summaryView) {
            console.log('📋 Moving summary content to summary-view');
            summaryView.innerHTML = '';
            summaryView.appendChild(summaryContent);
        } else {
            console.error('❌ summary-view container not found');
        }
    } else {
        console.error('❌ #attendance-summary content not found in temp container');
        console.log('Available elements in temp:', Array.from(tempContainer.querySelectorAll('[id]')).map(el => el.id));
    }
    
    if (detailedContent) {
        const detailedView = document.getElementById('detailed-view');
        if (detailedView) {
            console.log('📋 Moving detailed content to detailed-view');
            detailedView.innerHTML = '';
            detailedView.appendChild(detailedContent);
        } else {
            console.error('❌ detailed-view container not found');
        }
    } else {
        console.error('❌ #attendance-detailed-groups content not found in temp container');
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

// Placeholder function for viewing person details
function viewPersonDetails(firstname, lastname) {
    alert(`View details for ${firstname} ${lastname}\n\nThis will show detailed information about their event registrations and allow editing their information.`);
}

// Placeholder function for updating attendee status
function updateAttendeeStatus(index, status) {
    alert(`Update status for attendee at index ${index} to: ${status}\n\nThis will send the status update to the backend and refresh the view.`);
}

// Make functions globally available
window.viewPersonDetails = viewPersonDetails;
window.updateAttendeeStatus = updateAttendeeStatus;

// Export for use in other modules
export { initializeAttendancePage as default };