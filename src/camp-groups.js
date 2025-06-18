// Camp Groups functionality for attendance details
// This should be added to your main attendance handling file

// Function to load and display camp groups
async function loadAndDisplayCampGroups(attendees, eventId) {
    try {
        console.log('Loading camp groups for event:', eventId);
        
        // Import enrichAttendeesWithCampGroups dynamically if needed
        const { enrichAttendeesWithCampGroups } = await import('./lib/api.js');
        
        const enrichedAttendees = await enrichAttendeesWithCampGroups(attendees, eventId);
        populateCampGroupsTable(enrichedAttendees);
        
        console.log('Camp groups loaded successfully');
    } catch (error) {
        console.error('Error loading camp groups:', error);
        showToast('Failed to load camp groups', 'error');
    }
}

// Function to populate the camp groups table
function populateCampGroupsTable(enrichedAttendees) {
    const campGroupsTableBody = document.querySelector('#camp-groups-table tbody');
    if (!campGroupsTableBody) {
        console.warn('Camp groups table not found');
        return;
    }

    campGroupsTableBody.innerHTML = '';
    
    let campGroupEntries = [];
    
    // Extract all camp group entries from attendees
    enrichedAttendees.forEach(attendee => {
        if (attendee.campGroups && attendee.campGroups.length > 0) {
            attendee.campGroups.forEach(campGroup => {
                campGroupEntries.push({
                    attendeeName: `${attendee.firstname} ${attendee.lastname}`,
                    campGroup: campGroup.CampGroup || '-',
                    signedInBy: campGroup.SignedInBy || '-',
                    signedInWhen: campGroup.SignedInWhen || '-',
                    signedOutBy: campGroup.SignedOutBy || '-',
                    signedOutWhen: campGroup.SignedOutWhen || '-'
                });
            });
        }
    });

    // Populate table rows
    campGroupEntries.forEach(entry => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${entry.attendeeName}</td>
            <td>${entry.campGroup}</td>
            <td>${entry.signedInBy}</td>
            <td>${entry.signedInWhen}</td>
            <td>${entry.signedOutBy}</td>
            <td>${entry.signedOutWhen}</td>
        `;
        campGroupsTableBody.appendChild(row);
    });

    // Update table count if element exists
    const countElement = document.querySelector('#camp-groups-count');
    if (countElement) {
        countElement.textContent = campGroupEntries.length;
    }
}

// Export functions for use in main application
window.loadAndDisplayCampGroups = loadAndDisplayCampGroups;
window.populateCampGroupsTable = populateCampGroupsTable;