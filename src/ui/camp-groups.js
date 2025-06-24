// Renders the Camp Groups page with collapsible group sections
// attendees: Array of attendee objects enriched with camp group data
export function renderCampGroupsPage(attendees) {
    const container = document.getElementById('camp-groups-container');
    if (!container) {
        console.error('Camp groups container not found');
        return;
    }

    // Group attendees by camp group
    const groupedAttendees = attendees.reduce((groups, attendee) => {
        const groupName = attendee.campGroup || attendee.CampGroup || 'Unassigned';
        if (!groups[groupName]) {
            groups[groupName] = [];
        }
        groups[groupName].push(attendee);
        return groups;
    }, {});

    // Sort groups - put "Unassigned" last
    const sortedGroups = Object.keys(groupedAttendees).sort((a, b) => {
        if (a === 'Unassigned') return 1;
        if (b === 'Unassigned') return -1;
        return a.localeCompare(b);
    });

    let html = `
        <div class="camp-groups-header mb-4">
            <h2><i class="fas fa-users"></i> Camp Groups</h2>
            <p class="text-muted">Total Attendees: ${attendees.length} | Groups: ${sortedGroups.length}</p>
            <div class="group-controls mb-3">
                <button class="btn btn-outline-secondary btn-sm" onclick="toggleAllGroups(true)">
                    <i class="fas fa-expand-alt"></i> Expand All
                </button>
                <button class="btn btn-outline-secondary btn-sm ml-2" onclick="toggleAllGroups(false)">
                    <i class="fas fa-compress-alt"></i> Collapse All
                </button>
            </div>
        </div>
        <div class="camp-groups-list">
    `;

    sortedGroups.forEach((groupName, index) => {
        const group = groupedAttendees[groupName];
        const isExpanded = index < 3; // Expand first 3 groups by default
        const groupId = `group-${groupName.replace(/[^a-zA-Z0-9]/g, '-')}`;
        
        html += `
            <div class="camp-group-section mb-3">
                <div class="group-header" onclick="toggleGroup('${groupId}')">
                    <div class="d-flex justify-content-between align-items-center p-3 bg-light border rounded cursor-pointer">
                        <div class="group-info">
                            <h4 class="mb-1">
                                <i class="fas fa-users text-primary"></i>
                                ${groupName}
                                <span class="badge badge-primary ml-2">${group.length}</span>
                            </h4>
                            <small class="text-muted">
                                ${group.length === 1 ? '1 person' : `${group.length} people`}
                            </small>
                        </div>
                        <div class="group-toggle">
                            <i class="fas fa-chevron-${isExpanded ? 'up' : 'down'}" id="icon-${groupId}"></i>
                        </div>
                    </div>
                </div>
                
                <div class="group-content collapse ${isExpanded ? 'show' : ''}" id="${groupId}">
                    <div class="group-members p-3 border-left border-right border-bottom rounded-bottom">
                        <div class="row">
        `;

        // Render each attendee in the group
        group.forEach(attendee => {
            html += `
                <div class="col-md-6 col-lg-4 mb-3">
                    <div class="attendee-card card h-100" onclick="showAttendeeDetails(${JSON.stringify(attendee).replace(/"/g, '&quot;')})">
                        <div class="card-body p-3">
                            <div class="d-flex align-items-center">
                                <div class="attendee-icon-placeholder d-flex align-items-center justify-content-center rounded-circle mr-3 bg-primary text-white" style="width: 50px; height: 50px; min-width: 50px;">
                                    <i class="fas fa-user"></i>
                                </div>
                                <div class="attendee-info flex-grow-1">
                                    <h6 class="mb-1">${attendee.firstname} ${attendee.lastname}</h6>
                                    <small class="text-muted d-block">
                                        ${attendee.patrol ? `${attendee.patrol} • ` : ''}
                                        ${attendee.age || 'Age unknown'}
                                    </small>
                                    ${attendee.SignedInBy || attendee['Signed in by'] ? `
                                        <small class="text-success d-block">
                                            <i class="fas fa-sign-in-alt"></i> 
                                            Signed in by ${attendee.SignedInBy || attendee['Signed in by']}
                                            ${(attendee.SignedInWhen || attendee['Signed in when']) ? `at ${attendee.SignedInWhen || attendee['Signed in when']}` : ''}
                                        </small>
                                    ` : ''}
                                    ${attendee.SignedOutBy || attendee['Signed out by'] ? `
                                        <small class="text-warning d-block">
                                            <i class="fas fa-sign-out-alt"></i> 
                                            Signed out by ${attendee.SignedOutBy || attendee['Signed out by']}
                                            ${(attendee.SignedOutWhen || attendee['Signed out when']) ? `at ${attendee.SignedOutWhen || attendee['Signed out when']}` : ''}
                                        </small>
                                    ` : ''}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });

        html += `
                        </div>
                    </div>
                </div>
            </div>
        `;
    });

    html += `
        </div>
        
        <!-- Attendee Details Modal -->
        <div class="modal fade" id="attendeeDetailsModal" tabindex="-1" role="dialog" aria-labelledby="attendeeDetailsModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-lg" role="document">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="attendeeDetailsModalLabel">Attendee Details</h5>
                        <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                            <span aria-hidden="true">&times;</span>
                        </button>
                    </div>
                    <div class="modal-body">
                        <div id="attendee-details-content">
                            <!-- Content will be populated by JavaScript -->
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
                    </div>
                </div>
            </div>
        </div>
        
        <style>
            .cursor-pointer { cursor: pointer; }
            .group-header:hover { background-color: #f8f9fa !important; }
            .attendee-card { transition: transform 0.2s; cursor: pointer; }
            .attendee-card:hover { transform: translateY(-2px); box-shadow: 0 4px 8px rgba(0,0,0,0.1); }
            .attendee-icon-placeholder { font-size: 1.2rem; }
            .sign-in-out-section { background-color: #f8f9fa; border-radius: 8px; padding: 15px; margin: 10px 0; }
            .status-indicator { padding: 8px 12px; border-radius: 6px; margin: 5px 0; }
            .status-signed-in { background-color: #d4edda; border: 1px solid #c3e6cb; color: #155724; }
            .status-signed-out { background-color: #fff3cd; border: 1px solid #ffeaa7; color: #856404; }
            .status-not-signed { background-color: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; }
        </style>
    `;

    container.innerHTML = html;
    
    // Add global functions for group management
    addCampGroupFunctions();
}

// Add global functions for camp group management
function addCampGroupFunctions() {
    // Make functions globally available
    window.toggleGroup = function(groupId) {
        const groupContent = document.getElementById(groupId);
        const icon = document.getElementById(`icon-${groupId}`);
        
        if (groupContent.classList.contains('show')) {
            groupContent.classList.remove('show');
            icon.classList.remove('fa-chevron-up');
            icon.classList.add('fa-chevron-down');
        } else {
            groupContent.classList.add('show');
            icon.classList.remove('fa-chevron-down'); 
            icon.classList.add('fa-chevron-up');
        }
    };
    
    window.toggleAllGroups = function(expand) {
        const allGroups = document.querySelectorAll('.group-content');
        const allIcons = document.querySelectorAll('[id^="icon-group-"]');
        
        allGroups.forEach(group => {
            if (expand) {
                group.classList.add('show');
            } else {
                group.classList.remove('show');
            }
        });
        
        allIcons.forEach(icon => {
            icon.classList.remove('fa-chevron-up', 'fa-chevron-down');
            icon.classList.add(expand ? 'fa-chevron-up' : 'fa-chevron-down');
        });
    };
    
    // Show attendee details popup
    window.showAttendeeDetails = function(attendee) {
        const modal = document.getElementById('attendeeDetailsModal');
        const content = document.getElementById('attendee-details-content');
        const modalTitle = document.getElementById('attendeeDetailsModalLabel');
        
        if (!modal || !content) {
            console.error('Modal elements not found');
            return;
        }
        
        // Set modal title
        modalTitle.textContent = `${attendee.firstname} ${attendee.lastname}`;
        
        // Get sign-in/out status
        const signedInBy = attendee.SignedInBy || attendee['Signed in by'] || '';
        const signedInWhen = attendee.SignedInWhen || attendee['Signed in when'] || '';
        const signedOutBy = attendee.SignedOutBy || attendee['Signed out by'] || '';
        const signedOutWhen = attendee.SignedOutWhen || attendee['Signed out when'] || '';
        
        // Determine current status
        let statusHtml = '';
        let actionButtons = '';
        
        if (signedOutBy) {
            // Signed out
            statusHtml = `
                <div class="status-indicator status-signed-out">
                    <i class="fas fa-sign-out-alt"></i>
                    <strong>Signed Out</strong>
                    <div>By: ${signedOutBy}</div>
                    ${signedOutWhen ? `<div>When: ${signedOutWhen}</div>` : ''}
                </div>
            `;
            actionButtons = `
                <button class="btn btn-success mr-2" onclick="signInAttendee('${attendee.scoutid}', '${attendee.firstname}', '${attendee.lastname}')">
                    <i class="fas fa-sign-in-alt"></i> Sign In
                </button>
            `;
        } else if (signedInBy) {
            // Signed in but not out
            statusHtml = `
                <div class="status-indicator status-signed-in">
                    <i class="fas fa-sign-in-alt"></i>
                    <strong>Signed In</strong>
                    <div>By: ${signedInBy}</div>
                    ${signedInWhen ? `<div>When: ${signedInWhen}</div>` : ''}
                </div>
            `;
            actionButtons = `
                <button class="btn btn-warning mr-2" onclick="signOutAttendee('${attendee.scoutid}', '${attendee.firstname}', '${attendee.lastname}')">
                    <i class="fas fa-sign-out-alt"></i> Sign Out
                </button>
            `;
        } else {
            // Not signed in
            statusHtml = `
                <div class="status-indicator status-not-signed">
                    <i class="fas fa-user-clock"></i>
                    <strong>Not Signed In</strong>
                    <div>Attendee has not been signed in yet</div>
                </div>
            `;
            actionButtons = `
                <button class="btn btn-success mr-2" onclick="signInAttendee('${attendee.scoutid}', '${attendee.firstname}', '${attendee.lastname}')">
                    <i class="fas fa-sign-in-alt"></i> Sign In
                </button>
            `;
        }
        
        content.innerHTML = `
            <div class="row">
                <div class="col-md-6">
                    <h6>Basic Information</h6>
                    <p><strong>Name:</strong> ${attendee.firstname} ${attendee.lastname}</p>
                    <p><strong>Camp Group:</strong> ${attendee.campGroup || attendee.CampGroup || 'Unassigned'}</p>
                    ${attendee.patrol ? `<p><strong>Patrol:</strong> ${attendee.patrol}</p>` : ''}
                    ${attendee.age ? `<p><strong>Age:</strong> ${attendee.age}</p>` : ''}
                </div>
                <div class="col-md-6">
                    <h6>Sign In/Out Status</h6>
                    ${statusHtml}
                </div>
            </div>
            
            <div class="sign-in-out-section">
                <h6>Actions</h6>
                <div class="d-flex align-items-center">
                    ${actionButtons}
                    <div id="sign-action-status" class="ml-3"></div>
                </div>
            </div>
        `;
        
        // Show the modal - ensure jQuery is available on the window
        if (typeof window.$ !== 'undefined') {
            window.$('#attendeeDetailsModal').modal('show');
        } else {
            // Fallback to native Bootstrap modal API
            const modal = new window.bootstrap.Modal(document.getElementById('attendeeDetailsModal'));
            modal.show();
        }
    };
    
    // Sign in attendee
    window.signInAttendee = async function(scoutid, firstname, lastname) {
        await performSignAction(scoutid, firstname, lastname, 'signin');
    };
    
    // Sign out attendee  
    window.signOutAttendee = async function(scoutid, firstname, lastname) {
        await performSignAction(scoutid, firstname, lastname, 'signout');
    };
}

// Store flexi record info globally for sign actions
let currentFlexiRecordInfo = null;

// Helper function to perform sign in/out actions
async function performSignAction(scoutid, firstname, lastname, action) {
    const statusDiv = document.getElementById('sign-action-status');
    
    try {
        statusDiv.innerHTML = `
            <div class="text-info">
                <i class="fas fa-spinner fa-spin"></i>
                ${action === 'signin' ? 'Signing in' : 'Signing out'} ${firstname}...
            </div>
        `;
        
        // Get current user name and time
        const currentUserName = await getCurrentUserName();
        const currentTime = new Date().toLocaleString();
        
        // Check if we have flexi record info stored (try global window variable first)
        const flexiInfo = window.currentFlexiRecordInfo || currentFlexiRecordInfo;
        if (!flexiInfo) {
            throw new Error('Flexi record information not available. Please reload the page.');
        }
        
        // Determine which field to update based on action  
        const fieldMapping = flexiInfo.fieldMapping || {};
        
        // Import API function once
        const { updateFlexiRecord } = await import('../lib/api.js');
        
        // Helper function to add delay between API calls to prevent rate limiting
        const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
        
        if (action === 'signin') {
            // Find the "Signed in by" field
            const signInByField = Object.keys(fieldMapping).find(field => 
                fieldMapping[field].toLowerCase().includes('signed in by') ||
                fieldMapping[field].toLowerCase().includes('signedinby')
            );
            const signInWhenField = Object.keys(fieldMapping).find(field => 
                fieldMapping[field].toLowerCase().includes('signed in when') ||
                fieldMapping[field].toLowerCase().includes('signedinwhen')
            );
            
            if (!signInByField) {
                throw new Error('Could not find "Signed in by" field in flexi record structure');
            }
            
            console.log('Sign-in: Updating fields:', { signInByField, signInWhenField });
            
            // Update "Signed in by" field
            await updateFlexiRecord(
                flexiInfo.sectionId,
                scoutid,
                flexiInfo.flexiRecordId,
                signInByField,
                currentUserName
            );
            
            // TEMPORARILY COMMENTED OUT for testing - only one API call
            // // Add delay between API calls
            // await delay(500);
            // 
            // // Update "Signed in when" field if it exists
            // if (signInWhenField) {
            //     await updateFlexiRecord(
            //         flexiInfo.sectionId,
            //         scoutid,
            //         flexiInfo.flexiRecordId,
            //         signInWhenField,
            //         currentTime
            //     );
            // }
            
        } else if (action === 'signout') {
            // Find the "Signed out by" field
            const signOutByField = Object.keys(fieldMapping).find(field => 
                fieldMapping[field].toLowerCase().includes('signed out by') ||
                fieldMapping[field].toLowerCase().includes('signedoutby')
            );
            const signOutWhenField = Object.keys(fieldMapping).find(field => 
                fieldMapping[field].toLowerCase().includes('signed out when') ||
                fieldMapping[field].toLowerCase().includes('signedoutwhen')
            );
            
            if (!signOutByField) {
                throw new Error('Could not find "Signed out by" field in flexi record structure');
            }
            
            console.log('Sign-out: Updating fields:', { signOutByField, signOutWhenField });
            
            // Update "Signed out by" field
            await updateFlexiRecord(
                flexiInfo.sectionId,
                scoutid,
                flexiInfo.flexiRecordId,
                signOutByField,
                currentUserName
            );
            
            // TEMPORARILY COMMENTED OUT for testing - only one API call
            // // Add delay between API calls
            // await delay(500);
            // 
            // // Update "Signed out when" field if it exists
            // if (signOutWhenField) {
            //     await updateFlexiRecord(
            //         flexiInfo.sectionId,
            //         scoutid,
            //         flexiInfo.flexiRecordId,
            //         signOutWhenField,
            //         currentTime
            //     );
            // }
        }
        
        // Show success
        statusDiv.innerHTML = `
            <div class="text-success">
                <i class="fas fa-check"></i>
                ${firstname} ${action === 'signin' ? 'signed in' : 'signed out'} successfully!
            </div>
        `;
        
        // Close modal and show success message
        setTimeout(() => {
            if (typeof window.$ !== 'undefined') {
                window.$('#attendeeDetailsModal').modal('hide');
            } else {
                // Fallback to native Bootstrap modal API
                const modal = window.bootstrap.Modal.getInstance(document.getElementById('attendeeDetailsModal'));
                if (modal) modal.hide();
            }
            
            // TODO: Later we'll implement proper data refresh without full page reload
            // For now, just close the modal - the data will refresh when user reopens
            console.log(`${firstname} ${action === 'signin' ? 'signed in' : 'signed out'} successfully - modal closed`);
        }, 1500);
        
    } catch (error) {
        console.error(`Error during ${action}:`, error);
        statusDiv.innerHTML = `
            <div class="text-danger">
                <i class="fas fa-exclamation-triangle"></i>
                Error: ${error.message}
            </div>
        `;
    }
}

// Helper function to get current user name
async function getCurrentUserName() {
    // We'll need to fetch this from the startup data or store it when the user logs in
    try {
        const userInfo = sessionStorage.getItem('user_info');
        if (userInfo) {
            const parsed = JSON.parse(userInfo);
            return parsed.firstname || 'Unknown User';
        }
        return 'Unknown User';
    } catch (error) {
        console.error('Error getting current user name:', error);
        return 'Unknown User';
    }
}