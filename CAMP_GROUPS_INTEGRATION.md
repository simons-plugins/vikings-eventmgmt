// Integration Guide for Camp Groups Feature
// 
// 1. Add to your main HTML (index.html):
// 
// In the sidebar navigation, add:
// <li><a href="#" data-view="camp-groups"><i class="fas fa-users"></i> Camp Groups</a></li>
//
// In the main content area, add:
// <div id="camp-groups-container" style="display: none;">
//     <!-- Camp groups will be rendered here -->
// </div>
//
// 2. Add to your main navigation handler:
//
// case 'camp-groups':
//     // Hide other containers
//     document.getElementById('events-table-container').style.display = 'none';
//     document.getElementById('attendance-container').style.display = 'none';
//     
//     // Show camp groups container
//     const campContainer = document.getElementById('camp-groups-container');
//     campContainer.style.display = 'block';
//     
//     // Get selected sections and events
//     const selectedSections = getSelectedSections(); // Your existing function
//     const selectedEvents = getSelectedEvents(); // Your existing function
//     
//     // Load camp groups
//     handleCampGroupsView(selectedSections, selectedEvents);
//     break;
//
// 3. Make sure to import the handler:
// import { handleCampGroupsView } from './lib/handlers.js';
//
// 4. The Camp Groups page will automatically:
//    - Group attendees by their camp group (from f_1, f_2, etc. fields)
//    - Show count of people in each group
//    - Allow expand/collapse of each group
//    - Display attendee photos and details
//    - Show sign-in/sign-out information if available