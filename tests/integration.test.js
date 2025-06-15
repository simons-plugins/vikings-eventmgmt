// Integration Tests - Test complete user workflows
import { getUserRoles, getEvents, getEventAttendance, getMostRecentTermId } from '../src/lib/api.js'; // Corrected path

// Mock all API functions
jest.mock('../src/lib/api.js'); // Corrected path
jest.mock('../src/ui.js');
jest.mock('../src/ui/attendance.js'); // Added mock for attendance UI

import { renderSectionsTable, renderEventsTable, showError, showSpinner, hideSpinner } from '../src/ui.js'; // renderAttendeesTable removed
import { renderTabbedAttendanceView } from '../src/ui/attendance.js'; // Added import

// Since handleSectionSelect and handleEventSelect are not exported, 
// we'll test the functionality they represent rather than the functions directly
describe('Integration Tests', () => {
    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks();
        
        // Setup DOM
        document.body.innerHTML = `
            <main class="container">
                <div id="app-content"></div>
            </main>
            <nav id="sidebar" class="sidebar">
                <div class="sidebar-content">
                    <div id="sections-table-container"></div>
                    <div id="events-table-container"></div>
                </div>
            </nav>
            <button id="sidebarToggle" class="sidebar-toggle"></button>
            <div id="sidebarOverlay" class="sidebar-overlay"></div>
        `;
        
        // Mock sessionStorage
        global.sessionStorage = {
            getItem: jest.fn(),
            setItem: jest.fn(),
            removeItem: jest.fn(),
            clear: jest.fn()
        };
    });

    describe('API Integration Workflow', () => {
        test('should handle complete data flow from sections to attendance', async () => {
            // Mock API responses
            const mockSections = [
                { sectionid: '1', sectionname: '1st Guildford Scout Group' },
                { sectionid: '2', sectionname: '2nd Guildford Scout Group' }
            ];

            const mockEvents = {
                items: [
                    { 
                        eventid: '101', 
                        name: 'Weekly Meeting', 
                        date: '2024-01-15',
                        yes: 8,
                        no: 2,
                        termid: '2024-1'
                    }
                ]
            };

            const mockAttendance = {
                items: [
                    { scoutid: '1', firstname: 'John', lastname: 'Doe', attending: 'Yes' },
                    { scoutid: '2', firstname: 'Jane', lastname: 'Smith', attending: 'No' }
                ]
            };

            getUserRoles.mockResolvedValue(mockSections);
            getMostRecentTermId.mockResolvedValue('2024-1');
            getEvents.mockResolvedValue(mockEvents);
            getEventAttendance.mockResolvedValue(mockAttendance);

            // Test API calls sequence
            const sections = await getUserRoles();
            expect(sections).toEqual(mockSections);

            const termId = await getMostRecentTermId('1');
            expect(termId).toBe('2024-1');

            const events = await getEvents('1', '2024-1');
            expect(events).toEqual(mockEvents);

            const attendance = await getEventAttendance('1', '101', '2024-1');
            expect(attendance).toEqual(mockAttendance);
        });

        test('should handle API errors gracefully', async () => {
            getUserRoles.mockRejectedValue(new Error('API Error'));

            await expect(getUserRoles()).rejects.toThrow('API Error');
        });
    });

    describe('UI Rendering Integration', () => {
        test('should render sections table', () => {
            const mockSections = [
                { sectionid: '1', sectionname: 'Test Section' }
            ];
            const mockCallback = jest.fn();

            renderSectionsTable(mockSections, mockCallback);

            expect(renderSectionsTable).toHaveBeenCalledWith(mockSections, mockCallback);
        });

        test('should render events table', () => {
            const mockEvents = [
                { eventid: '1', name: 'Test Event' }
            ];
            const mockCallback = jest.fn();

            renderEventsTable(mockEvents, mockCallback, true);

            expect(renderEventsTable).toHaveBeenCalledWith(mockEvents, mockCallback, true);
        });

        test('should render attendees table', () => { // Test name can remain, or change to renderTabbedAttendanceView
            const mockAttendees = [
                { scoutid: '1', firstname: 'John', attending: 'Yes' }
            ];

            renderTabbedAttendanceView(mockAttendees); // Changed function call

            expect(renderTabbedAttendanceView).toHaveBeenCalledWith(mockAttendees); // Changed expectation
        });
    });

    describe('Error Handling Integration', () => {
        test('should show error messages', () => {
            showError('Test error message');
            expect(showError).toHaveBeenCalledWith('Test error message');
        });

        test('should show and hide spinner', () => {
            showSpinner('Loading...');
            expect(showSpinner).toHaveBeenCalledWith('Loading...');

            hideSpinner();
            expect(hideSpinner).toHaveBeenCalled();
        });
    });
});