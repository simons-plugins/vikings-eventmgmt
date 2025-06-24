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
                    <div class="attendee-card card h-100">
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
        <style>
            .cursor-pointer { cursor: pointer; }
            .group-header:hover { background-color: #f8f9fa !important; }
            .attendee-card { transition: transform 0.2s; }
            .attendee-card:hover { transform: translateY(-2px); box-shadow: 0 4px 8px rgba(0,0,0,0.1); }
            .attendee-icon-placeholder { font-size: 1.2rem; }
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
}