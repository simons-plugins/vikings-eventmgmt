// UI Functions Tests - Test table rendering and user interactions
import { 
    renderSectionsTable, 
    renderEventsTable, 
    renderAttendeesTable,
    showError,
    showSpinner,
    hideSpinner
} from '../src/ui.js';

// Mock DOM
document.body.innerHTML = `
    <div id="sections-table-container"></div>
    <div id="events-table-container"></div>
    <div id="attendance-panel"></div>
    <div id="app-content"></div>
    <div id="loading-overlay" style="display: none;">
        <div class="loading-text">Loading...</div>
        <div id="spinner-container"></div>
    </div>
`;

describe('UI Functions', () => {
    beforeEach(() => {
        // Reset DOM
        document.getElementById('sections-table-container').innerHTML = '';
        document.getElementById('events-table-container').innerHTML = '';
        document.getElementById('attendance-panel').innerHTML = '';
        document.getElementById('app-content').innerHTML = '';
    });

    describe('renderSectionsTable', () => {
        test('should render sections table with data', () => {
            const mockSections = [
                { sectionid: '1', sectionname: '1st Guildford Scout Group' },
                { sectionid: '2', sectionname: '2nd Guildford Scout Group' }
            ];
            const mockCallback = jest.fn();

            renderSectionsTable(mockSections, mockCallback);

            const container = document.getElementById('sections-table-container');
            expect(container.innerHTML).toContain('1st Guildford Scout Group');
            expect(container.innerHTML).toContain('2nd Guildford Scout Group');
            expect(container.innerHTML).toContain('Load Events for Selected Sections');
        });

        test('should handle empty sections array', () => {
            const mockCallback = jest.fn();

            renderSectionsTable([], mockCallback);

            const container = document.getElementById('sections-table-container');
            expect(container.innerHTML).toContain('table');
            expect(container.querySelector('tbody').children.length).toBe(0);
        });

        test('should create checkboxes for each section', () => {
            const mockSections = [
                { sectionid: '1', sectionname: 'Test Section' }
            ];
            const mockCallback = jest.fn();

            renderSectionsTable(mockSections, mockCallback);

            const checkbox = document.querySelector('.section-checkbox');
            expect(checkbox).toBeTruthy();
            expect(checkbox.value).toBe('1');
        });
    });

    describe('renderEventsTable', () => {
        test('should render events in mobile layout', () => {
            const mockEvents = [
                { 
                    eventid: '1', 
                    name: 'Test Event', 
                    date: '2024-01-15',
                    sectionname: 'Test Section',
                    yes: 5,
                    no: 2
                }
            ];
            const mockCallback = jest.fn();

            // Force mobile layout
            renderEventsTable(mockEvents, mockCallback, true);

            const container = document.getElementById('events-table-container');
            expect(container.innerHTML).toContain('Test Event');
            expect(container.innerHTML).toContain('Test Section');
            expect(container.innerHTML).toContain('2024-01-15');
        });

        test('should create event checkboxes', () => {
            const mockEvents = [
                { eventid: '1', name: 'Test Event' }
            ];
            const mockCallback = jest.fn();

            renderEventsTable(mockEvents, mockCallback, true);

            const checkbox = document.querySelector('.event-checkbox');
            expect(checkbox).toBeTruthy();
        });

        test('should handle events with attendance counts', () => {
            const mockEvents = [
                { 
                    eventid: '1', 
                    name: 'Test Event',
                    yes: 10,
                    no: 3,
                    yes_members: 5,
                    yes_yls: 3,
                    yes_leaders: 2
                }
            ];
            const mockCallback = jest.fn();

            renderEventsTable(mockEvents, mockCallback, true);

            const container = document.getElementById('events-table-container');
            expect(container.innerHTML).toContain('10'); // Total yes
            expect(container.innerHTML).toContain('3');  // Total no
        });
    });

    describe('renderAttendeesTable', () => {
        test('should render attendees table with grouped data', () => {
            const mockAttendees = [
                {
                    scoutid: '1',
                    firstname: 'John',
                    lastname: 'Doe',
                    attending: 'Yes',
                    sectionname: 'Test Section',
                    _eventName: 'Test Event',
                    _eventDate: '2024-01-15'
                },
                {
                    scoutid: '1',
                    firstname: 'John',
                    lastname: 'Doe',
                    attending: 'No',
                    sectionname: 'Test Section',
                    _eventName: 'Another Event',
                    _eventDate: '2024-01-22'
                }
            ];

            renderAttendeesTable(mockAttendees);

            const container = document.getElementById('attendance-panel');
            expect(container.innerHTML).toContain('John');
            expect(container.innerHTML).toContain('Doe');
            expect(container.innerHTML).toContain('Test Event');
            expect(container.innerHTML).toContain('Filter by Section');
        });

        test('should handle empty attendees array', () => {
            renderAttendeesTable([]);

            const container = document.getElementById('attendance-panel');
            expect(container.innerHTML).toContain('No attendees found');
        });

        test('should create filter controls', () => {
            const mockAttendees = [
                {
                    scoutid: '1',
                    firstname: 'John',
                    lastname: 'Doe',
                    attending: 'Yes',
                    sectionname: 'Test Section',
                    _eventName: 'Test Event'
                }
            ];

            renderAttendeesTable(mockAttendees);

            expect(document.getElementById('section-filter')).toBeTruthy();
            expect(document.getElementById('event-filter')).toBeTruthy();
            expect(document.getElementById('status-filter')).toBeTruthy();
            expect(document.getElementById('name-filter')).toBeTruthy();
        });
    });

    describe('Loading and Error Functions', () => {
        test('showSpinner should display loading overlay', () => {
            showSpinner('Test loading...');

            const overlay = document.getElementById('loading-overlay');
            expect(overlay.style.display).toBe('flex');
            expect(overlay.querySelector('.loading-text').textContent).toBe('Test loading...');
        });

        test('hideSpinner should hide loading overlay', () => {
            showSpinner();
            hideSpinner();

            const overlay = document.getElementById('loading-overlay');
            expect(overlay.style.opacity).toBe('0');
        });

        test('showError should create error toast', () => {
            showError('Test error message');

            const toast = document.querySelector('.error-toast');
            expect(toast).toBeTruthy();
            expect(toast.innerHTML).toContain('Test error message');
        });
    });
});