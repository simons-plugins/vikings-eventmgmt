import '@testing-library/jest-dom';
import { renderSectionsTable, renderEventsTable, renderAttendeesTable, showError } from './ui.js';

describe('Integration: Section/Event/Attendee Flow', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div class="login-container"></div>
      <div id="attendance-panel"></div>
      <div id="error-message" style="display:none"></div>
      <div id="spinner" style="display:none"></div>
    `;
  });

  it('renders sections, events, and attendees tables with user interaction', () => {
    // 1. Render sections table
    const sectionIdToName = { '1': 'Beavers', '2': 'Cubs' };
    const mockLoadEvents = jest.fn();
    renderSectionsTable(sectionIdToName, mockLoadEvents);

    // Check sections table
    const sectionsTable = document.getElementById('sections-table');
    expect(sectionsTable).toBeInTheDocument();
    expect(sectionsTable).toHaveTextContent('Beavers');
    expect(sectionsTable).toHaveTextContent('Cubs');
    // Simulate clicking "Load Events"
    document.getElementById('load-events-btn').click();
    expect(mockLoadEvents).toHaveBeenCalled();

    // 2. Render events table
    const events = [
      { eventid: 'e1', sectionname: 'Beavers', name: 'Camp', date: '2024-07-01', yes: 5, yes_members: 3, yes_yls: 1, yes_leaders: 1, no: 2 },
      { eventid: 'e2', sectionname: 'Cubs', name: 'Hike', date: '2024-08-01', yes: 4, yes_members: 2, yes_yls: 1, yes_leaders: 1, no: 1 }
    ];
    const mockLoadAttendees = jest.fn();
    renderEventsTable(events, mockLoadAttendees);

    // Check events table
    const eventsTable = document.getElementById('events-table');
    expect(eventsTable).toBeInTheDocument();
    expect(eventsTable).toHaveTextContent('Camp');
    expect(eventsTable).toHaveTextContent('Hike');
    // Simulate clicking "Show Attendees for Selected Events"
    document.getElementById('load-attendees-btn').click();
    expect(mockLoadAttendees).toHaveBeenCalled();

    // 3. Render attendees table
    const attendees = [
      { sectionname: 'Beavers', _eventName: 'Camp', attending: 'Yes', firstname: 'Alice', lastname: 'Smith' },
      { sectionname: 'Cubs', _eventName: 'Hike', attending: 'No', firstname: 'Bob', lastname: 'Jones' }
    ];
    renderAttendeesTable(attendees);

    // Check attendees table
    const attendanceTable = document.getElementById('attendance-table');
    expect(attendanceTable).toBeInTheDocument();
    expect(attendanceTable).toHaveTextContent('Alice');
    expect(attendanceTable).toHaveTextContent('Bob');
    expect(attendanceTable).toHaveTextContent('Camp');
    expect(attendanceTable).toHaveTextContent('Hike');
  });

  it('shows error message when showError is called', () => {
    showError('Test error!');
    const el = document.getElementById('error-message');
    expect(el).toBeVisible();
    expect(el).toHaveTextContent('Test error!');
  });
});