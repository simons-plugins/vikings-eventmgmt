import { UIComponents } from '../ui/components.js';
import { UIHelpers } from '../utils/helpers.js';

export class EventManager {
    constructor(state, apiClient) {
        this.state = state;
        this.api = apiClient;
        this.isInitialized = false;
    }

    initialize() {
        if (this.isInitialized) return;
        
        this.setupEventListeners();
        this.setupStateSubscriptions();
        this.isInitialized = true;
    }

    setupEventListeners() {
        // Listen for loadAttendees custom event from sidebar
        window.addEventListener('loadAttendees', (event) => {
            this.loadAttendees(event.detail.events);
        });

        // Mini load attendees button
        const loadAttendeesMini = document.getElementById('load-attendees-btn-mini');
        if (loadAttendeesMini) {
            loadAttendeesMini.addEventListener('click', () => {
                this.loadSelectedAttendees();
            });
        }
    }

    setupStateSubscriptions() {
        // Listen for attendees changes
        this.state.subscribe('attendees', (attendees) => {
            this.renderAttendees(attendees);
        });
    }

    loadSelectedAttendees() {
        const selectedCheckboxes = document.querySelectorAll('.event-checkbox:checked');
        const events = this.state.get('events');
        
        if (!events || !selectedCheckboxes.length) {
            UIHelpers.showError('Please select at least one event');
            return;
        }

        const selectedIndices = Array.from(selectedCheckboxes).map(cb => parseInt(cb.dataset.idx));
        const selectedEvents = selectedIndices.map(idx => events[idx]);
        
        this.loadAttendees(selectedEvents);
    }

    async loadAttendees(selectedEvents) {
        if (!selectedEvents || selectedEvents.length === 0) {
            UIHelpers.showError('No events selected');
            return;
        }

        try {
            const attendeesData = await UIHelpers.withLoading(
                () => this.processEventAttendance(selectedEvents),
                'Processing attendance data...',
                'gradient'
            );
            
            this.state.set('attendees', attendeesData);
            
            // Auto-close mobile sidebar if open
            if (UIHelpers.isMobile()) {
                setTimeout(() => this.closeMobileSidebar(), 500);
            }
            
        } catch (error) {
            UIHelpers.showError('Failed to load attendance data');
        }
    }

    async processEventAttendance(selectedEvents) {
        const allAttendeeData = new Map();
        
        for (const event of selectedEvents) {
            try {
                // Get most recent term for this section
                const termId = await this.api.getMostRecentTermId(event.sectionid);
                
                // Get attendance for this event
                const attendanceData = await this.api.getEventAttendance(
                    event.sectionid, 
                    event.eventid, 
                    termId
                );
                
                if (attendanceData && attendanceData.items) {
                    attendanceData.items.forEach(person => {
                        const personKey = `${person.scoutid}-${person.firstname}-${person.lastname}`;
                        
                        if (!allAttendeeData.has(personKey)) {
                            allAttendeeData.set(personKey, {
                                scoutid: person.scoutid,
                                firstname: person.firstname,
                                lastname: person.lastname,
                                section: person.section || 'Unknown',
                                events: new Map(),
                                totalEvents: 0,
                                attendedEvents: 0
                            });
                        }
                        
                        const attendeeRecord = allAttendeeData.get(personKey);
                        const eventKey = `${event.eventid}-${event.name}`;
                        
                        attendeeRecord.events.set(eventKey, {
                            eventName: event.name,
                            date: event.date,
                            attended: person.attending === 'Yes'
                        });
                        
                        attendeeRecord.totalEvents++;
                        if (person.attending === 'Yes') {
                            attendeeRecord.attendedEvents++;
                        }
                    });
                }
            } catch (error) {
                console.error(`Failed to process event ${event.name}:`, error);
            }
        }
        
        // Convert to array and sort
        const attendeesArray = Array.from(allAttendeeData.values())
            .sort((a, b) => a.lastname.localeCompare(b.lastname));
        
        return {
            attendees: attendeesArray,
            events: selectedEvents,
            summary: {
                totalPeople: attendeesArray.length,
                totalEvents: selectedEvents.length,
                averageAttendance: this.calculateAverageAttendance(attendeesArray)
            }
        };
    }

    calculateAverageAttendance(attendees) {
        if (attendees.length === 0) return 0;
        
        const totalAttendanceRate = attendees.reduce((sum, person) => {
            return sum + (person.totalEvents > 0 ? (person.attendedEvents / person.totalEvents) : 0);
        }, 0);
        
        return Math.round((totalAttendanceRate / attendees.length) * 100);
    }

    renderAttendees(attendeesData) {
        const panel = document.getElementById('attendance-panel');
        if (!panel) return;
        
        if (!attendeesData || !attendeesData.attendees || attendeesData.attendees.length === 0) {
            panel.innerHTML = `
                <p class="text-muted text-center">
                    Select events from the sidebar to view attendance details.
                </p>
            `;
            return;
        }

        const { attendees, events, summary } = attendeesData;
        
        // Create summary section
        const summaryHtml = `
            <div class="attendance-summary mb-4">
                <div class="row">
                    <div class="col-md-3 col-6">
                        <div class="summary-card">
                            <h3 class="summary-number">${summary.totalPeople}</h3>
                            <p class="summary-label">Total People</p>
                        </div>
                    </div>
                    <div class="col-md-3 col-6">
                        <div class="summary-card">
                            <h3 class="summary-number">${summary.totalEvents}</h3>
                            <p class="summary-label">Events Selected</p>
                        </div>
                    </div>
                    <div class="col-md-3 col-6">
                        <div class="summary-card">
                            <h3 class="summary-number">${summary.averageAttendance}%</h3>
                            <p class="summary-label">Avg Attendance</p>
                        </div>
                    </div>
                    <div class="col-md-3 col-6">
                        <div class="summary-card">
                            <button class="btn btn-primary btn-sm w-100" id="export-btn">
                                <i class="fas fa-download"></i> Export
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Create table headers
        const headers = [
            { content: 'Name', classes: 'sticky-column' },
            { content: 'Section', width: '100px' },
            { content: 'Attendance', width: '100px' },
            ...events.map(event => ({
                content: `${UIHelpers.formatDate(event.date)}<br><small>${event.name}</small>`,
                width: '120px',
                classes: 'text-center event-column'
            }))
        ];

        // Create table data
        const data = attendees.map(person => {
            const attendanceRate = person.totalEvents > 0 
                ? Math.round((person.attendedEvents / person.totalEvents) * 100)
                : 0;
            
            const nameCell = UIHelpers.isMobile() 
                ? this.createMobileNameCell(person, events)
                : `${person.firstname} ${person.lastname}`;
            
            const attendanceCell = `
                <span class="attendance-badge ${this.getAttendanceBadgeClass(attendanceRate)}">
                    ${person.attendedEvents}/${person.totalEvents} (${attendanceRate}%)
                </span>
            `;

            const eventCells = events.map(event => {
                const eventKey = `${event.eventid}-${event.name}`;
                const eventAttendance = person.events.get(eventKey);
                
                if (!eventAttendance) {
                    return '<span class="attendance-status unknown">-</span>';
                }
                
                return `<span class="attendance-status ${eventAttendance.attended ? 'present' : 'absent'}">
                    ${eventAttendance.attended ? '✓' : '✗'}
                </span>`;
            });

            return [nameCell, person.section, attendanceCell, ...eventCells];
        });

        const table = UIComponents.createTable({
            id: 'attendance-table',
            classes: 'table table-striped table-sm attendance-table',
            headers,
            data
        });

        panel.innerHTML = summaryHtml;
        panel.appendChild(table);

        // Add mobile expand functionality
        if (UIHelpers.isMobile()) {
            this.addMobileExpandFunctionality();
        }

        // Add export functionality
        const exportBtn = document.getElementById('export-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportAttendanceData(attendeesData));
        }

        // Add responsive table wrapper
        if (!table.parentElement?.classList.contains('table-responsive')) {
            const wrapper = document.createElement('div');
            wrapper.className = 'table-responsive';
            table.parentNode.insertBefore(wrapper, table);
            wrapper.appendChild(table);
        }
    }

    createMobileNameCell(person, events) {
        const attendanceDetails = events.map(event => {
            const eventKey = `${event.eventid}-${event.name}`;
            const eventAttendance = person.events.get(eventKey);
            const status = eventAttendance ? (eventAttendance.attended ? 'Present' : 'Absent') : 'Unknown';
            const statusClass = eventAttendance ? (eventAttendance.attended ? 'present' : 'absent') : 'unknown';
            
            return `
                <div class="mobile-event-detail">
                    <span class="event-name">${event.name}</span>
                    <span class="event-date">${UIHelpers.formatDate(event.date)}</span>
                    <span class="attendance-status ${statusClass}">${status}</span>
                </div>
            `;
        }).join('');

        return `
            <div class="mobile-name-cell">
                <div class="person-summary">
                    <span class="person-name">${person.firstname} ${person.lastname}</span>
                    <span class="expand-icon">▼</span>
                </div>
                <div class="person-details" style="display: none;">
                    ${attendanceDetails}
                </div>
            </div>
        `;
    }

    addMobileExpandFunctionality() {
        const nameElements = document.querySelectorAll('.person-summary');
        nameElements.forEach(element => {
            element.addEventListener('click', () => {
                const details = element.nextElementSibling;
                const icon = element.querySelector('.expand-icon');
                
                if (details.style.display === 'none') {
                    details.style.display = 'block';
                    icon.textContent = '▲';
                    element.parentElement.parentElement.classList.add('expanded');
                } else {
                    details.style.display = 'none';
                    icon.textContent = '▼';
                    element.parentElement.parentElement.classList.remove('expanded');
                }
            });
        });
    }

    getAttendanceBadgeClass(rate) {
        if (rate >= 80) return 'badge-success';
        if (rate >= 60) return 'badge-warning';
        return 'badge-danger';
    }

    exportAttendanceData(attendeesData) {
        try {
            const { attendees, events } = attendeesData;
            
            // Create CSV content
            const headers = ['Name', 'Section', 'Total Attended', 'Total Events', 'Attendance Rate'];
            events.forEach(event => {
                headers.push(`${event.name} (${UIHelpers.formatDate(event.date)})`);
            });
            
            const csvContent = [
                headers.join(','),
                ...attendees.map(person => {
                    const attendanceRate = person.totalEvents > 0 
                        ? Math.round((person.attendedEvents / person.totalEvents) * 100)
                        : 0;
                    
                    const baseData = [
                        `"${person.firstname} ${person.lastname}"`,
                        `"${person.section}"`,
                        person.attendedEvents,
                        person.totalEvents,
                        `${attendanceRate}%`
                    ];
                    
                    const eventData = events.map(event => {
                        const eventKey = `${event.eventid}-${event.name}`;
                        const eventAttendance = person.events.get(eventKey);
                        return eventAttendance ? (eventAttendance.attended ? 'Present' : 'Absent') : 'Unknown';
                    });
                    
                    return [...baseData, ...eventData].join(',');
                })
            ].join('\n');
            
            // Download CSV
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `attendance-report-${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            UIHelpers.showError('Attendance data exported successfully!', 3000);
            
        } catch (error) {
            console.error('Export failed:', error);
            UIHelpers.showError('Failed to export attendance data');
        }
    }

    closeMobileSidebar() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebar-overlay');
        const toggleBtn = document.getElementById('sidebar-toggle');
        
        sidebar?.classList.remove('show');
        overlay?.classList.remove('show');
        document.body.style.overflow = '';
        
        // Reset arrow direction
        const chevron = toggleBtn?.querySelector('i');
        if (chevron) {
            chevron.classList.remove('fa-chevron-left');
            chevron.classList.add('fa-chevron-right');
        }
    }
}