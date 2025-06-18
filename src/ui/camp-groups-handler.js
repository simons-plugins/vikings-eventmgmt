// Camp Groups functionality for Attendance Details
// This replaces the existing camp groups implementation

import { enrichAttendeesWithCampGroups } from '../lib/api.js';

// Function to load and display camp groups for selected events
export async function loadCampGroupsForEvents(selectedEvents, attendees) {
    try {
        console.log('Loading camp groups for selected events...');
        
        // Extract unique section IDs from selected events
        const selectedSectionIds = [...new Set(selectedEvents.map(event => event.sectionid))];
        
        // Enrich attendees with camp groups data
        const enrichedAttendees = await enrichAttendeesWithCampGroups(attendees, selectedSectionIds);
        
        console.log('Successfully enriched attendees with camp groups data');
        return enrichedAttendees;
        
    } catch (error) {
        console.error('Error loading camp groups:', error);
        throw error;
    }
}

// Function to populate the camp groups table in the attendance view
export function populateCampGroupsTable(enrichedAttendees) {
    const campGroupsContent = document.getElementById('camp-groups-content');
    if (!campGroupsContent) {
        console.warn('Camp groups content container not found');
        return;
    }

    if (!enrichedAttendees || enrichedAttendees.length === 0) {
        campGroupsContent.innerHTML = `
            <div class="text-center py-4">
                <i class="fas fa-info-circle text-muted" style="font-size: 2rem;"></i>
                <p class="text-muted mt-2">No attendees found.</p>
            </div>`;
        return;
    }

    // Create unique attendees list with camp group data
    const uniqueAttendees = {};
    
    enrichedAttendees.forEach(attendee => {
        const nameKey = `${attendee.firstname} ${attendee.lastname}`;
        if (!uniqueAttendees[nameKey]) {
            uniqueAttendees[nameKey] = {
                firstname: attendee.firstname,
                lastname: attendee.lastname,
                sectionname: attendee.sectionname,
                // Look for camp group data in various field formats
                campGroup: attendee.campGroup || attendee.f_1 || 'Unassigned',
                signedInBy: attendee.SignedInBy || attendee.f_2 || '-',
                signedInWhen: attendee.SignedInWhen || attendee.f_3 || '-',
                signedOutBy: attendee.SignedOutBy || attendee.f_4 || '-',
                signedOutWhen: attendee.SignedOutWhen || attendee.f_5 || '-'
            };
        }
    });
    
    const uniqueAttendeesList = Object.values(uniqueAttendees);

    // Check if we have meaningful camp group data
    const hasCampGroupData = uniqueAttendeesList.some(attendee => 
        attendee.campGroup !== 'Unassigned' || 
        attendee.signedInBy !== '-' || 
        attendee.signedOutBy !== '-'
    );

    // Build the HTML for the camp groups table
    let html = `
        <div class="d-flex justify-content-between align-items-center mb-3 px-3 pt-3">
            <h6 class="mb-0">
                <i class="fas fa-campground me-2"></i>Camp Groups
            </h6>
            <small class="text-muted">${uniqueAttendeesList.length} attendee(s)</small>
        </div>`;

    if (hasCampGroupData) {
        // Show detailed table with camp group assignments and sign-in/out data
        html += `
            <div class="table-responsive">
                <table class="table table-striped table-sm">
                    <thead class="thead-light">
                        <tr>
                            <th>Name</th>
                            <th>Camp Group</th>
                            <th>Signed In By</th>
                            <th>Signed In When</th>
                            <th>Signed Out By</th>
                            <th>Signed Out When</th>
                        </tr>
                    </thead>
                    <tbody>`;
        
        // Sort by camp group, then by last name
        uniqueAttendeesList.sort((a, b) => {
            const cgc = a.campGroup.localeCompare(b.campGroup);
            if (cgc !== 0) return cgc;
            const lnc = a.lastname.localeCompare(b.lastname);
            if (lnc !== 0) return lnc;
            return a.firstname.localeCompare(b.firstname);
        });
        
        uniqueAttendeesList.forEach(attendee => {
            html += `
                <tr>
                    <td>
                        <strong>${attendee.firstname} ${attendee.lastname}</strong><br>
                        <small class="text-muted">${attendee.sectionname || '-'}</small>
                    </td>
                    <td><span class="badge badge-primary">${attendee.campGroup}</span></td>
                    <td>${attendee.signedInBy}</td>
                    <td>${attendee.signedInWhen}</td>
                    <td>${attendee.signedOutBy}</td>
                    <td>${attendee.signedOutWhen}</td>
                </tr>`;
        });
        
        html += `</tbody></table></div>`;
    } else {
        // Show simple name list if no camp group data is available
        html += `
            <div class="table-responsive">
                <table class="table table-striped table-sm">
                    <thead class="thead-light">
                        <tr><th>Name</th></tr>
                    </thead>
                    <tbody>`;
        
        uniqueAttendeesList.sort((a, b) => {
            const lnc = a.lastname.localeCompare(b.lastname);
            if (lnc !== 0) return lnc;
            return a.firstname.localeCompare(b.firstname);
        });
        
        uniqueAttendeesList.forEach(attendee => {
            html += `
                <tr>
                    <td>
                        <strong>${attendee.firstname} ${attendee.lastname}</strong><br>
                        <small class="text-muted">${attendee.sectionname || '-'}</small>
                    </td>
                </tr>`;
        });
        
        html += `</tbody></table></div>`;
    }
    
    html += `
        <div class="px-3 pb-3">
            <small class="text-muted">
                <i class="fas fa-info-circle me-1"></i>
                ${hasCampGroupData 
                    ? 'Camp group assignments with sign-in/out tracking from OSM flexi records.' 
                    : 'Simple attendee list for camp groups planning.'}
            </small>
        </div>`;
    
    campGroupsContent.innerHTML = html;
    
    console.log(`Populated camp groups table with ${uniqueAttendeesList.length} attendees`);
}