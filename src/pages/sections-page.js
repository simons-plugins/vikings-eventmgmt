// src/pages/sections-page.js
// Page component for sections selection
// Handles rendering sections as interactive buttons with multi-select and continue button

import { setSelectedSections } from '../lib/page-router.js';

// Track selected sections
let selectedSectionIds = [];

// Initialize the sections page
export function initializeSectionsPage(sectionsData) {
    console.log('Initializing sections page with', sectionsData?.length || 0, 'sections');
    
    if (!sectionsData || sectionsData.length === 0) {
        const container = document.getElementById('sections-table-container');
        if (container) {
            container.innerHTML = `
                <div class="text-center text-muted py-4">
                    <i class="fas fa-users fa-3x mb-3"></i>
                    <h5>No sections available</h5>
                    <p>Please contact your administrator or try refreshing the page.</p>
                    <button class="btn btn-outline-primary" onclick="window.location.reload()">
                        <i class="fas fa-sync me-2"></i>Refresh Page
                    </button>
                </div>
            `;
        }
        return;
    }

    // Store sections data for use in other pages
    window.currentSectionsData = sectionsData;
    
    // Reset selected sections
    selectedSectionIds = [];
    
    // Render the sections as buttons
    renderSectionsButtons(sectionsData);
}

// Render sections as interactive buttons
function renderSectionsButtons(sectionsData) {
    const container = document.getElementById('sections-table-container');
    if (!container) return;
    
    // Create button grid
    const buttonsHTML = sectionsData.map(section => {
        const sectionId = section.sectionid || section.id;
        const sectionName = section.sectionname || section.name;
        
        return `
            <button 
                class="section-button btn btn-outline-primary btn-lg m-2" 
                data-section-id="${sectionId}"
                onclick="toggleSectionSelection('${sectionId}')"
            >
                <i class="fas fa-users me-2"></i>
                ${sectionName}
            </button>
        `;
    }).join('');
    
    container.innerHTML = `
        <div class="text-center mb-4">
            <p class="text-muted">Select the sections you want to manage events for:</p>
        </div>
        <div class="d-flex flex-wrap justify-content-center">
            ${buttonsHTML}
        </div>
    `;
}

// Toggle section selection
function toggleSectionSelection(sectionId) {
    const button = document.querySelector(`[data-section-id="${sectionId}"]`);
    if (!button) return;
    
    if (selectedSectionIds.includes(sectionId)) {
        // Deselect
        selectedSectionIds = selectedSectionIds.filter(id => id !== sectionId);
        button.classList.remove('btn-primary');
        button.classList.add('btn-outline-primary');
    } else {
        // Select
        selectedSectionIds.push(sectionId);
        button.classList.remove('btn-outline-primary');
        button.classList.add('btn-primary');
    }
    
    onSectionSelectionChange();
}

// Handle section selection changes
function onSectionSelectionChange() {
    console.log('Sections selected:', selectedSectionIds);
    
    // Get the full section data for selected sections
    const selectedSectionData = window.currentSectionsData?.filter(section => 
        selectedSectionIds.includes(section.sectionid || section.id)
    ) || [];
    
    // Update the router state
    setSelectedSections(selectedSectionIds, selectedSectionData);
    
    // Show/hide the continue button
    const continueButton = document.getElementById('continue-to-events');
    if (continueButton) {
        if (selectedSectionIds.length > 0) {
            continueButton.style.display = 'inline-block';
            continueButton.innerHTML = `
                <i class="fas fa-arrow-right me-2"></i>Continue to Events 
                <span class="badge bg-light text-dark ms-2">${selectedSectionIds.length} section${selectedSectionIds.length === 1 ? '' : 's'}</span>
            `;
        } else {
            continueButton.style.display = 'none';
        }
    }
}

// Make toggle function globally available
window.toggleSectionSelection = toggleSectionSelection;

// Get selected sections (for external use)
export function getSelectedSectionsOnPage() {
    return selectedSectionIds;
}