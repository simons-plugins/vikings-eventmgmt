// src/pages/sections-page.js
// Page component for sections selection
// Handles rendering sections table with multi-select and continue button

import { renderSectionsTable } from '../ui.js';
import { setSelectedSections } from '../lib/page-router.js';

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
    
    // Render the sections table with our custom callback
    renderSectionsTable(sectionsData, onSectionSelectionChange);
}

// Handle section selection changes
function onSectionSelectionChange(selectedSectionIds) {
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

// Get selected sections (for external use)
export function getSelectedSectionsOnPage() {
    const container = document.getElementById('sections-table-container');
    if (!container) return [];
    
    const checkboxes = container.querySelectorAll('.section-checkbox:checked');
    return Array.from(checkboxes).map(cb => cb.value);
}