import { UIComponents } from '../ui/components.js';
import { UIHelpers } from '../utils/helpers.js';

export class SidebarManager {
    constructor(state, apiClient, auth) {
        console.log('SidebarManager constructor called with:');
        console.log('- state:', !!state);
        console.log('- apiClient:', !!apiClient);
        console.log('- auth:', !!auth);
        console.log('- auth type:', typeof auth);
        
        this.state = state;
        this.api = apiClient;
        this.auth = auth;
        this.isInitialized = false;
        this.currentSectionId = null;
        this.currentTermId = null;
        
        // Verify auth has getToken method
        if (this.auth && typeof this.auth.getToken === 'function') {
            console.log('✅ Auth manager has getToken method');
        } else {
            console.error('❌ Auth manager missing or no getToken method');
        }
    }

    initialize() {
        if (this.isInitialized) return;
        
        console.log('🔧 Initializing SidebarManager...');
        this.setupEventListeners();
        this.setupStateSubscriptions();
        this.isInitialized = true;
        console.log('✅ SidebarManager initialized successfully');
    }

    setupEventListeners() {
        console.log('Setting up sidebar event listeners...');
        
        // Use setTimeout to ensure DOM elements are ready
        setTimeout(() => {
            const loadSectionsBtn = document.getElementById('load-sections-btn');
            console.log('Load sections button found:', !!loadSectionsBtn);
            
            if (loadSectionsBtn) {
                // Use arrow function to preserve 'this' context
                loadSectionsBtn.addEventListener('click', (e) => {
                    console.log('Load sections button clicked!');
                    e.preventDefault();
                    this.loadSections();
                });
                console.log('✅ Load sections listener attached');
            } else {
                console.error('❌ Load sections button not found');
            }
        }, 200);
    }

    setupStateSubscriptions() {
        if (this.state && typeof this.state.subscribe === 'function') {
            this.state.subscribe((newState) => {
                this.handleStateChange(newState);
            });
            console.log('✅ State subscription set up');
        } else {
            console.error('❌ State manager missing or no subscribe method');
        }
    }

    async loadSections() {
        console.log('=== SIDEBAR loadSections DEBUG ===');
        
        try {
            await UIHelpers.withLoading(async () => {
                console.log('Inside withLoading, about to get token...');
                const token = await this.auth.getToken();
                console.log('Token retrieved from auth:', token ? 'present' : 'null/undefined');
                
                if (!token) {
                    throw new Error('No authentication token available');
                }
                
                console.log('Calling getUserRoles API...');
                const result = await this.api.getUserRoles(token);
                console.log('getUserRoles result:', result);
                
                // ✅ FIX: Check if result is an array directly OR has roles property
                let sections = null;
                
                if (Array.isArray(result)) {
                    // API returns array directly
                    sections = result;
                    console.log('✅ Using direct array response');
                } else if (result && result.roles && Array.isArray(result.roles)) {
                    // API returns object with roles property
                    sections = result.roles;
                    console.log('✅ Using result.roles property');
                } else {
                    console.error('❌ Unexpected API response structure:', result);
                    throw new Error('Invalid response from getUserRoles - unexpected structure');
                }
                
                if (sections && sections.length > 0) {
                    this.populateSections(sections);
                    console.log(`✅ Sections loaded successfully - ${sections.length} sections`);
                } else {
                    throw new Error('No sections found in response');
                }
                
            }, 'Loading sections...');
            
        } catch (error) {
            console.error('loadSections failed:', error);
            UIHelpers.showError('Failed to load sections: ' + error.message);
        }
    }

    populateSections(sections) {
        console.log('📝 Populating sections:', sections);
        
        const container = document.getElementById('sections-container');
        if (!container) {
            console.error('Sections container not found');
            return;
        }
        
        // Create sections table with checkboxes for multi-selection
        container.innerHTML = `
            <div class="table-responsive">
                <table class="table table-sm" id="sections-table">
                    <thead>
                        <tr>
                            <th>
                                <input type="checkbox" id="select-all-sections" class="form-check-input">
                            </th>
                            <th>Section</th>
                        </tr>
                    </thead>
                    <tbody></tbody>
                </table>
            </div>
            <div class="mt-2">
                <button class="btn btn-primary btn-sm w-100" id="load-selected-sections" disabled>
                    <i class="fas fa-download me-1"></i>Load Selected Sections
                </button>
            </div>
        `;
        
        const tbody = container.querySelector('#sections-table tbody');
        
        // Add sections with checkboxes
        sections.forEach(section => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>
                    <input type="checkbox" class="form-check-input section-checkbox" 
                           data-section-id="${section.sectionid}" 
                           data-section-name="${section.sectionname || section.name}">
                </td>
                <td>${section.sectionname || section.name || 'Unknown Section'}</td>
            `;
            tbody.appendChild(row);
        });
        
        // Set up event listeners
        this.setupSectionCheckboxListeners(container);
        
        console.log('✅ Sections populated with checkboxes');
    }

    setupSectionCheckboxListeners(container) {
        const selectAllCheckbox = container.querySelector('#select-all-sections');
        const sectionCheckboxes = container.querySelectorAll('.section-checkbox');
        const loadButton = container.querySelector('#load-selected-sections');
        
        // Select all functionality
        selectAllCheckbox.addEventListener('change', () => {
            const isChecked = selectAllCheckbox.checked;
            sectionCheckboxes.forEach(checkbox => {
                checkbox.checked = isChecked;
            });
            this.updateLoadButton(container);
        });
        
        // Individual checkbox functionality
        sectionCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                // Update select all checkbox state
                const checkedCount = container.querySelectorAll('.section-checkbox:checked').length;
                const totalCount = sectionCheckboxes.length;
                
                selectAllCheckbox.checked = checkedCount === totalCount;
                selectAllCheckbox.indeterminate = checkedCount > 0 && checkedCount < totalCount;
                
                this.updateLoadButton(container);
            });
        });
        
        // Load button functionality
        loadButton.addEventListener('click', (e) => {
            e.preventDefault();
            this.loadSelectedSections();
        });
    }

    updateLoadButton(container) {
        const loadButton = container.querySelector('#load-selected-sections');
        const checkedBoxes = container.querySelectorAll('.section-checkbox:checked');
        
        if (checkedBoxes.length > 0) {
            loadButton.disabled = false;
            loadButton.textContent = `Load ${checkedBoxes.length} Section${checkedBoxes.length > 1 ? 's' : ''}`;
        } else {
            loadButton.disabled = true;
            loadButton.innerHTML = '<i class="fas fa-download me-1"></i>Load Selected Sections';
        }
    }

    async loadSelectedSections() {
        const container = document.getElementById('sections-container');
        const checkedBoxes = container.querySelectorAll('.section-checkbox:checked');
        
        if (checkedBoxes.length === 0) {
            UIHelpers.showError('Please select at least one section');
            return;
        }
        
        const selectedSections = Array.from(checkedBoxes).map(checkbox => ({
            id: checkbox.dataset.sectionId,
            name: checkbox.dataset.sectionName
        }));
        
        console.log('📍 Selected sections:', selectedSections);
        
        // Update state with selected sections
        if (this.state) {
            this.state.setState({ 
                selectedSections: selectedSections,
                currentTerm: null,
                events: []
            });
        }
        
        // Load combined events for all selected sections
        await this.loadCombinedEvents(selectedSections);
    }

    async loadCombinedEvents(selectedSections) {
        console.log('🎯 Loading combined events for sections:', selectedSections);
        
        try {
            await UIHelpers.withLoading(async () => {
                const token = await this.auth.getToken();
                const allEvents = [];
                
                // Load events from all selected sections
                for (const section of selectedSections) {
                    console.log(`Loading events for section: ${section.name}`);
                    
                    try {
                        // Get current term for this section (or default term)
                        console.log(`📅 Getting terms for section ${section.id}...`);
                        const termsResult = await this.api.getTerms(token, section.id);
                        console.log(`📅 Terms result for ${section.name}:`, termsResult);
                        
                        // ✅ FIX: Handle the actual API response structure
                        let terms = [];
                        
                        if (termsResult && typeof termsResult === 'object') {
                            // Convert object with numeric keys to array of terms
                            terms = Object.entries(termsResult).map(([termId, termData]) => ({
                                termid: termId,
                                name: termData.name || `Term ${termId}`,
                                // Add any other properties from termData if needed
                                ...termData
                            }));
                            console.log(`✅ Converted terms object to array:`, terms);
                        } else if (Array.isArray(termsResult)) {
                            terms = termsResult;
                            console.log(`✅ Using direct array response`);
                        } else if (termsResult && termsResult.items) {
                            terms = termsResult.items;
                            console.log(`✅ Using result.items property`);
                        }
                        
                        if (terms && terms.length > 0) {
                            const currentTerm = terms[0]; // Use first/current term
                            console.log(`📅 Using term: ${currentTerm.name} (ID: ${currentTerm.termid})`);
                            
                            // Get events for this section/term
                            console.log(`🎯 Getting events for section ${section.id}, term ${currentTerm.termid}...`);
                            const eventsResult = await this.api.getEvents(token, section.id, currentTerm.termid);
                            console.log(`🎯 Events result for ${section.name}:`, eventsResult);
                            
                            // ✅ Handle events response (might also have different structure)
                            let events = [];
                            
                            if (Array.isArray(eventsResult)) {
                                events = eventsResult;
                            } else if (eventsResult && eventsResult.items) {
                                events = eventsResult.items;
                            } else if (eventsResult && typeof eventsResult === 'object') {
                                // Handle object structure similar to terms
                                events = Object.values(eventsResult).flat();
                            }
                            
                            if (events && events.length > 0) {
                                // Add section info to each event
                                const sectionEvents = events.map(event => ({
                                    ...event,
                                    sectionId: section.id,
                                    sectionName: section.name,
                                    termId: currentTerm.termid,
                                    termName: currentTerm.name
                                }));
                                allEvents.push(...sectionEvents);
                                console.log(`✅ Added ${sectionEvents.length} events from ${section.name}`);
                            } else {
                                console.warn(`⚠️ No events found for ${section.name} in term ${currentTerm.name}`);
                                console.log('Events response structure:', eventsResult);
                            }
                        } else {
                            console.warn(`⚠️ No terms found for section ${section.name}`);
                            console.log('Terms response structure:', termsResult);
                        }
                    } catch (sectionError) {
                        console.error(`❌ Error loading data for section ${section.name}:`, sectionError);
                        // Continue with other sections even if one fails
                    }
                }
                
                console.log(`📊 Total events loaded: ${allEvents.length}`);
                
                if (allEvents.length > 0) {
                    // ✅ STAY IN SIDEBAR - Show combined events table in sidebar
                    this.showCombinedEventsInSidebar(allEvents, selectedSections);
                    
                    // Update state
                    if (this.state) {
                        this.state.setState({ events: allEvents });
                    }
                } else {
                    UIHelpers.showError('No events found for selected sections');
                }
                
            }, 'Loading events from all sections...');
            
        } catch (error) {
            console.error('Failed to load combined events:', error);
            UIHelpers.showError('Failed to load events: ' + error.message);
        }
    }

    showCombinedEventsInSidebar(events, selectedSections) {
        console.log('📋 Showing combined events in sidebar');
        
        const container = document.getElementById('sections-container');
        if (!container) {
            console.error('Sections container not found');
            return;
        }
        
        // Group events by event name for combined display
        const eventGroups = this.groupEventsByName(events);
        
        // Create combined events table IN THE SIDEBAR
        container.innerHTML = `
            <div class="mb-2">
                <button class="btn btn-outline-secondary btn-sm w-100" id="back-to-sections">
                    <i class="fas fa-arrow-left me-1"></i>Back to Sections
                </button>
            </div>
            <h6 class="text-center mb-2">Combined Events</h6>
            <div class="table-responsive">
                <table class="table table-sm" id="combined-events-table">
                    <thead>
                        <tr>
                            <th width="15%">
                                <input type="checkbox" id="select-all-events" class="form-check-input">
                            </th>
                            <th width="85%">Event</th>
                        </tr>
                    </thead>
                    <tbody></tbody>
                </table>
            </div>
            <div class="mt-2">
                <button class="btn btn-primary btn-sm w-100" id="load-selected-events" disabled>
                    <i class="fas fa-download me-1"></i>Load Selected Events
                </button>
            </div>
        `;
        
        const tbody = container.querySelector('#combined-events-table tbody');
        
        // Add events with checkboxes
        eventGroups.forEach(group => {
            const eventDate = new Date(group.date).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: '2-digit'
            });
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>
                    <input type="checkbox" class="form-check-input event-checkbox" 
                           data-event-group="${group.name}">
                </td>
                <td>
                    <div class="event-name" style="font-size: 0.8rem; line-height: 1.2;">
                        ${group.name}
                    </div>
                    <div class="event-date text-muted" style="font-size: 0.7rem;">
                        ${eventDate}
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });
        
        // Set up event listeners for the combined events table
        this.setupCombinedEventsListeners(container, eventGroups, selectedSections);
        
        console.log('✅ Combined events table shown in sidebar');
    }

    setupCombinedEventsListeners(container, eventGroups, selectedSections) {
        const selectAllCheckbox = container.querySelector('#select-all-events');
        const eventCheckboxes = container.querySelectorAll('.event-checkbox');
        const loadButton = container.querySelector('#load-selected-events');
        const backButton = container.querySelector('#back-to-sections');
        
        // Select all functionality
        selectAllCheckbox.addEventListener('change', () => {
            const isChecked = selectAllCheckbox.checked;
            eventCheckboxes.forEach(checkbox => {
                checkbox.checked = isChecked;
            });
            this.updateEventsLoadButton(container);
        });
        
        // Individual checkbox functionality
        eventCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                const checkedCount = container.querySelectorAll('.event-checkbox:checked').length;
                const totalCount = eventCheckboxes.length;
                
                selectAllCheckbox.checked = checkedCount === totalCount;
                selectAllCheckbox.indeterminate = checkedCount > 0 && checkedCount < totalCount;
                
                this.updateEventsLoadButton(container);
            });
        });
        
        // Back button
        backButton.addEventListener('click', (e) => {
            e.preventDefault();
            this.loadSections();
        });
        
        // Load selected events button
        loadButton.addEventListener('click', (e) => {
            e.preventDefault();
            this.loadSelectedEvents(eventGroups, selectedSections);
        });
    }

    updateEventsLoadButton(container) {
        const loadButton = container.querySelector('#load-selected-events');
        const checkedBoxes = container.querySelectorAll('.event-checkbox:checked');
        
        if (checkedBoxes.length > 0) {
            loadButton.disabled = false;
            loadButton.innerHTML = `<i class="fas fa-download me-1"></i>Load ${checkedBoxes.length} Event${checkedBoxes.length > 1 ? 's' : ''}`;
        } else {
            loadButton.disabled = true;
            loadButton.innerHTML = '<i class="fas fa-download me-1"></i>Load Selected Events';
        }
    }

    async loadSelectedEvents(eventGroups, selectedSections) {
        const container = document.getElementById('sections-container');
        const checkedBoxes = container.querySelectorAll('.event-checkbox:checked');
        
        if (checkedBoxes.length === 0) {
            UIHelpers.showError('Please select at least one event');
            return;
        }
        
        const selectedEventNames = Array.from(checkedBoxes).map(checkbox => 
            checkbox.dataset.eventGroup
        );
        
        console.log('📍 Selected events:', selectedEventNames);
        
        // Filter events to only selected ones
        const selectedEvents = eventGroups.filter(group => 
            selectedEventNames.includes(group.name)
        );
        
        // Show attendance table in MAIN CONTENT (right side)
        this.displayCombinedAttendanceTable(selectedEvents, selectedSections);
    }

    displayCombinedAttendanceTable(selectedEvents, selectedSections) {
        console.log('👥 Displaying combined attendance table in main content');
        
        const mainContent = document.getElementById('main-content');
        if (!mainContent) {
            console.error('Main content area not found');
            return;
        }
        
        // Create attendance table with expandable columns for each section
        const sectionHeaders = selectedSections.map(section => 
            `<th class="text-center">${section.name}</th>`
        ).join('');
        
        const eventRows = selectedEvents.map(eventGroup => {
            const eventDate = new Date(eventGroup.date).toLocaleDateString();
            
            // Create attendance columns for each section
            const attendanceCells = selectedSections.map(section => {
                const sectionEvent = eventGroup.events.find(e => e.sectionId === section.id);
                if (sectionEvent) {
                    return `
                        <td class="text-center">
                            <button class="btn btn-outline-primary btn-sm view-attendance-btn" 
                                    data-event-id="${sectionEvent.eventid}"
                                    data-section-id="${sectionEvent.sectionId}"
                                    data-event-name="${sectionEvent.name}"
                                    data-section-name="${sectionEvent.sectionName}">
                                <i class="fas fa-eye"></i> View
                            </button>
                        </td>
                    `;
                } else {
                    return '<td class="text-center text-muted">-</td>';
                }
            }).join('');
            
            return `
                <tr>
                    <td><strong>${eventGroup.name}</strong></td>
                    <td>${eventDate}</td>
                    ${attendanceCells}
                </tr>
            `;
        }).join('');
        
        mainContent.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h5 class="mb-0">
                        <i class="fas fa-calendar-alt me-2"></i>Selected Events Attendance
                    </h5>
                </div>
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table table-sm table-striped">
                            <thead>
                                <tr>
                                    <th>Event Name</th>
                                    <th>Date</th>
                                    ${sectionHeaders}
                                </tr>
                            </thead>
                            <tbody>
                                ${eventRows}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
        
        // Set up view attendance button listeners
        mainContent.querySelectorAll('.view-attendance-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const eventId = btn.dataset.eventId;
                const sectionId = btn.dataset.sectionId;
                const eventName = btn.dataset.eventName;
                const sectionName = btn.dataset.sectionName;
                this.viewSectionAttendance(eventId, sectionId, eventName, sectionName);
            });
        });
        
        console.log('✅ Combined attendance table displayed in main content');
    }

    groupEventsByName(events) {
        const groups = {};
        
        events.forEach(event => {
            const eventKey = event.name.trim().toLowerCase();
            if (!groups[eventKey]) {
                groups[eventKey] = {
                    name: event.name,
                    date: event.startdate,
                    events: []
                };
            }
            groups[eventKey].events.push(event);
        });
        
        return Object.values(groups);
    }

    async viewSectionAttendance(eventId, sectionId, eventName, sectionName) {
        console.log(`👥 Loading attendance for: ${eventName} in ${sectionName}`);
        
        try {
            await UIHelpers.withLoading(async () => {
                const token = await this.auth.getToken();
                const result = await this.api.getAttendance(token, sectionId, eventId);
                console.log('Attendance result:', result);
                
                if (result && result.items) {
                    this.displaySingleAttendance(result.items, eventName, sectionName);
                } else {
                    throw new Error('Invalid attendance response');
                }
            }, `Loading attendance for ${eventName}...`);
            
        } catch (error) {
            console.error('Failed to load attendance:', error);
            UIHelpers.showError('Failed to load attendance: ' + error.message);
        }
    }

    displaySingleAttendance(attendanceData, eventName, sectionName) {
        const mainContent = document.getElementById('main-content');
        if (!mainContent) return;
        
        const attendanceTable = UIComponents.createAttendanceTable(attendanceData, `${eventName} - ${sectionName}`);
        mainContent.innerHTML = attendanceTable;
        
        console.log('✅ Single attendance displayed');
    }

    async loadTerms(sectionId, sectionName) {
        console.log(`🗓️ Loading terms for section: ${sectionName}`);
        
        try {
            await UIHelpers.withLoading(async () => {
                const token = await this.auth.getToken();
                const result = await this.api.getTerms(token, sectionId);
                console.log('Terms result:', result);
                
                if (result && result.items) {
                    this.populateTerms(result.items, sectionName);
                } else {
                    throw new Error('Invalid terms response');
                }
            }, 'Loading terms...');
            
        } catch (error) {
            console.error('Failed to load terms:', error);
            UIHelpers.showError('Failed to load terms: ' + error.message);
        }
    }

    populateTerms(terms, sectionName) {
        console.log('📅 Populating terms:', terms);
        
        const container = document.getElementById('sections-container');
        
        container.innerHTML = `
            <div class="mb-3">
                <button class="btn btn-outline-secondary btn-sm w-100" id="back-to-sections">
                    <i class="fas fa-arrow-left me-1"></i>Back to Sections
                </button>
            </div>
            <h6 class="text-center mb-3">${sectionName}</h6>
            <div class="table-responsive">
                <table class="table table-sm" id="terms-table">
                    <thead>
                        <tr>
                            <th>Term</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody></tbody>
                </table>
            </div>
        `;
        
        const tbody = container.querySelector('#terms-table tbody');
        
        terms.forEach(term => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${term.name}</td>
                <td>
                    <button class="btn btn-outline-primary btn-sm select-term-btn" 
                            data-term-id="${term.termid}" 
                            data-term-name="${term.name}">
                        Select
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
        
        // Add event listeners
        container.querySelector('#back-to-sections').addEventListener('click', (e) => {
            e.preventDefault();
            this.loadSections();
        });
        
        container.querySelectorAll('.select-term-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const termId = btn.dataset.termId;
                const termName = btn.dataset.termName;
                this.selectTerm(termId, termName);
            });
        });
        
        console.log('✅ Terms populated');
    }

    async selectTerm(termId, termName) {
        console.log(`📅 Term selected: ${termName} (ID: ${termId})`);
        
        this.currentTermId = termId;
        
        // Update state
        if (this.state) {
            this.state.setState({ 
                currentTerm: { id: termId, name: termName }
            });
        }
        
        // Load events for this term
        await this.loadEvents(this.currentSectionId, termId, termName);
    }

    async loadEvents(sectionId, termId, termName) {
        console.log(`🎯 Loading events for term: ${termName}`);
        
        try {
            await UIHelpers.withLoading(async () => {
                const token = await this.auth.getToken();
                const result = await this.api.getEvents(token, sectionId, termId);
                console.log('Events result:', result);
                
                if (result && result.items) {
                    this.populateEvents(result.items, termName);
                    
                    // Update state with events
                    if (this.state) {
                        this.state.setState({ events: result.items });
                    }
                } else {
                    throw new Error('Invalid events response');
                }
            }, 'Loading events...');
            
        } catch (error) {
            console.error('Failed to load events:', error);
            UIHelpers.showError('Failed to load events: ' + error.message);
        }
    }

    populateEvents(events, termName) {
        console.log('🎯 Populating events:', events);
        
        const container = document.getElementById('sections-container');
        
        container.innerHTML = `
            <div class="mb-3">
                <button class="btn btn-outline-secondary btn-sm w-100" id="back-to-terms">
                    <i class="fas fa-arrow-left me-1"></i>Back to Terms
                </button>
            </div>
            <h6 class="text-center mb-3">${termName}</h6>
            <div class="table-responsive">
                <table class="table table-sm" id="events-table">
                    <thead>
                        <tr>
                            <th>Event</th>
                            <th>Date</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody></tbody>
                </table>
            </div>
        `;
        
        const tbody = container.querySelector('#events-table tbody');
        
        events.forEach(event => {
            const eventDate = new Date(event.startdate).toLocaleDateString();
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${event.name}</td>
                <td>${eventDate}</td>
                <td>
                    <button class="btn btn-outline-primary btn-sm view-attendance-btn" 
                            data-event-id="${event.eventid}" 
                            data-event-name="${event.name}">
                        View
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
        
        // Add event listeners
        container.querySelector('#back-to-terms').addEventListener('click', (e) => {
            e.preventDefault();
            this.loadTerms(this.currentSectionId, this.state.currentSection.name);
        });
        
        container.querySelectorAll('.view-attendance-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const eventId = btn.dataset.eventId;
                const eventName = btn.dataset.eventName;
                this.viewAttendance(eventId, eventName);
            });
        });
        
        console.log('✅ Events populated');
    }

    async viewAttendance(eventId, eventName) {
        console.log(`👥 Loading attendance for event: ${eventName} (ID: ${eventId})`);
        
        try {
            await UIHelpers.withLoading(async () => {
                const token = await this.auth.getToken();
                const result = await this.api.getAttendance(token, this.currentSectionId, eventId);
                console.log('Attendance result:', result);
                
                if (result && result.items) {
                    // Display attendance in main content area
                    this.displayAttendance(result.items, eventName);
                } else {
                    throw new Error('Invalid attendance response');
                }
            }, 'Loading attendance...');
            
        } catch (error) {
            console.error('Failed to load attendance:', error);
            UIHelpers.showError('Failed to load attendance: ' + error.message);
        }
    }

    displayAttendance(attendanceData, eventName) {
        console.log('👥 Displaying attendance for:', eventName);
        
        const mainContent = document.getElementById('main-content');
        if (!mainContent) {
            console.error('Main content area not found');
            return;
        }
        
        // Use UIComponents to create attendance table
        const attendanceTable = UIComponents.createAttendanceTable(attendanceData, eventName);
        mainContent.innerHTML = attendanceTable;
        
        console.log('✅ Attendance displayed in main content');
    }

    handleStateChange(newState) {
        console.log('📡 State changed:', newState);
        
        // Handle any UI updates based on state changes
        if (newState.currentSection) {
            console.log('Current section:', newState.currentSection.name);
        }
        
        if (newState.currentTerm) {
            console.log('Current term:', newState.currentTerm.name);
        }
        
        if (newState.events && newState.events.length > 0) {
            console.log(`Loaded ${newState.events.length} events`);
        }
    }
}