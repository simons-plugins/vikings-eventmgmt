// src/pages/events-page.js
// Page component for events selection
// Handles loading and rendering events for selected sections

import { renderEventsTable, showError, showSpinner, hideSpinner } from '../ui.js';
import { getMostRecentTermId, getEvents } from '../lib/api.js';
import { getSelectedSections, getSelectedSectionData, setSelectedEvents } from '../lib/page-router.js';

// Initialize the events page
export async function initializeEventsPage() {
    const selectedSections = getSelectedSections();
    const selectedSectionData = getSelectedSectionData();
    
    console.log('Initializing events page for sections:', selectedSections);
    
    if (selectedSections.length === 0) {
        showError('No sections selected. Please go back and select sections.');
        return;
    }

    // Show loading state
    const container = document.getElementById('events-table-container');
    if (container) {
        container.innerHTML = `
            <div class="text-center py-4">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <p class="mt-2 text-muted">Loading events for selected sections...</p>
            </div>
        `;
    }

    try {
        showSpinner();
        
        // Load events for all selected sections (reusing logic from handlers.js)
        const allEvents = await loadEventsForSections(selectedSections, selectedSectionData);
        
        hideSpinner();
        
        if (!allEvents || allEvents.length === 0) {
            if (container) {
                container.innerHTML = `
                    <div class="text-center text-muted py-4">
                        <i class="fas fa-calendar-times fa-3x mb-3"></i>
                        <h5>No events found</h5>
                        <p>No events were found for the selected sections.</p>
                        <small class="text-muted">This could mean there are no upcoming events or the sections have no events scheduled.</small>
                    </div>
                `;
            }
            return;
        }

        // Render the events table
        renderEventsTable(allEvents, onEventSelectionChange);
        
        console.log(`Loaded ${allEvents.length} events for events page`);
        
    } catch (error) {
        hideSpinner();
        console.error('Error loading events:', error);
        showError('Failed to load events. Please try again.');
        
        if (container) {
            container.innerHTML = `
                <div class="text-center text-danger py-4">
                    <i class="fas fa-exclamation-triangle fa-3x mb-3"></i>
                    <h5>Error Loading Events</h5>
                    <p>${error.message || 'Failed to load events'}</p>
                    <button class="btn btn-outline-primary" onclick="window.location.reload()">
                        <i class="fas fa-sync me-2"></i>Try Again
                    </button>
                </div>
            `;
        }
    }
}

// Load events for selected sections (reused logic from handlers.js)
async function loadEventsForSections(selectedSectionIds, selectedSectionData) {
    let allEvents = [];
    
    // Create section ID to name mapping
    const sectionIdToName = {};
    if (selectedSectionData && Array.isArray(selectedSectionData)) {
        selectedSectionData.forEach(section => {
            sectionIdToName[section.sectionid] = section.sectionname;
        });
    }

    // Load events for each section
    for (const sectionId of selectedSectionIds) {
        try {
            // Get the most recent term for this section
            const termId = await getMostRecentTermId(sectionId);
            if (!termId) {
                console.warn(`No term found for section ${sectionId}`);
                continue;
            }

            // Fetch events for this section and term
            const eventsResponse = await getEvents(sectionId, termId);
            const events = eventsResponse?.items || [];
            
            // Enrich events with section information
            const enrichedEvents = events.map(event => ({
                ...event,
                sectionid: sectionId,
                sectionname: sectionIdToName[sectionId] || `Section ${sectionId}`,
                termid: termId
            }));

            allEvents.push(...enrichedEvents);
            
        } catch (error) {
            console.error(`Error fetching events for section ${sectionId}:`, error);
            // Continue with other sections even if one fails
        }
    }

    return allEvents;
}

// Handle event selection changes
function onEventSelectionChange(selectedEvents) {
    console.log('Events selected:', selectedEvents?.length || 0);
    
    // Update the router state
    setSelectedEvents(selectedEvents || []);
    
    // Show/hide the continue button
    const continueButton = document.getElementById('continue-to-attendance');
    if (continueButton) {
        if (selectedEvents && selectedEvents.length > 0) {
            continueButton.style.display = 'inline-block';
            continueButton.innerHTML = `
                <i class="fas fa-arrow-right me-2"></i>View Attendance 
                <span class="badge bg-light text-dark ms-2">${selectedEvents.length} event${selectedEvents.length === 1 ? '' : 's'}</span>
            `;
        } else {
            continueButton.style.display = 'none';
        }
    }
}

// Get selected events (for external use)
export function getSelectedEventsOnPage() {
    const container = document.getElementById('events-table-container');
    if (!container) return [];
    
    const checkboxes = container.querySelectorAll('.event-checkbox:checked');
    return Array.from(checkboxes).map(cb => {
        const idx = parseInt(cb.dataset.idx);
        return container.eventsData ? container.eventsData[idx] : null;
    }).filter(Boolean);
}