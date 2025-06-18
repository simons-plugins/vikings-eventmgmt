// Camp Groups Implementation for Attendance Details Page
// Add this to your attendance details handler

// 1. Import the enrichAttendeesWithCampGroups function
import { enrichAttendeesWithCampGroups } from './lib/api.js';

// 2. Function to load and display camp groups
async function loadAndDisplayCampGroups(attendees, eventId) {
    try {
        console.log('Loading camp groups for event:', eventId);
        const enrichedAttendees = await enrichAttendeesWithCampGroups(attendees, eventId);
        populateCampGroupsTable(enrichedAttendees);
        showToast('Camp groups loaded successfully', 'success');
    } catch (error) {
        console.error('Error loading camp groups:', error);
        showToast('Failed to load camp groups', 'error');
    }
}

// 3. Function to populate the camp groups table
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

// 4. Call this function after loading event attendance
// Example: After you call getEventAttendance, call this:
// loadAndDisplayCampGroups(attendees, eventId);

// 5. Add this to your existing attendance details loading function
async function loadAttendanceDetailsWithCampGroups(sectionId, termId, eventId) {
    try {
        // Load regular attendance
        const attendanceData = await getEventAttendance(sectionId, termId, eventId);
        
        // Display regular attendance (existing code)
        // ... your existing attendance display code ...
        
        // Load and display camp groups
        if (attendanceData && attendanceData.length > 0) {
            await loadAndDisplayCampGroups(attendanceData, eventId);
        }
        
    } catch (error) {
        console.error('Error loading attendance details:', error);
        showToast('Failed to load attendance details', 'error');
    }
}