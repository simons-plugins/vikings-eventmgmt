document.addEventListener('DOMContentLoaded', () => {
    // Ensure initialScoutData and campGroupDefinitions are loaded (e.g., from inline script in EJS)
    if (typeof initialScoutData === 'undefined' || typeof campGroupDefinitions === 'undefined') {
        console.error('Initial data (initialScoutData or campGroupDefinitions) not found. Ensure it is provided in the EJS template.');
        document.getElementById('statusMessage').textContent = 'Error: Initial data not loaded. Check console.';
        document.getElementById('statusMessage').className = 'status-message error';
        return;
    }

    let originalScouts = JSON.parse(JSON.stringify(initialScoutData));
    let currentScouts = JSON.parse(JSON.stringify(initialScoutData));

    const plannerContainer = document.getElementById('plannerContainer');
    const saveButton = document.getElementById('saveChanges');
    const cancelButton = document.getElementById('cancelChanges');
    const statusMessage = document.getElementById('statusMessage');

    let draggedItem = null; // To store the scout card being dragged

    function renderPlanner() {
        plannerContainer.innerHTML = ''; // Clear existing content

        campGroupDefinitions.forEach(group => {
            const groupBox = document.createElement('div');
            groupBox.className = 'camp-group-box';
            // Use group.name for data attribute if it's unique and what API expects, or group.id
            groupBox.dataset.campGroupName = group.name;

            const title = document.createElement('h3');
            title.textContent = group.name;
            groupBox.appendChild(title);

            const description = document.createElement('p');
            description.className = 'group-description';
            description.textContent = group.description || '';
            groupBox.appendChild(description);

            const scoutList = document.createElement('div');
            scoutList.className = 'scout-list';
            groupBox.appendChild(scoutList);

            // Add drag event listeners to the group box (drop zone)
            groupBox.addEventListener('dragover', handleDragOver);
            groupBox.addEventListener('dragenter', handleDragEnter);
            groupBox.addEventListener('dragleave', handleDragLeave);
            groupBox.addEventListener('drop', handleDrop);

            // Filter scouts for the current group
            // Handle null campGroup for "Unassigned" if group.name is "Unassigned"
            const scoutsInGroup = currentScouts.filter(scout =>
                (scout.campGroup === group.name) || (scout.campGroup === null && group.name === 'Unassigned')
            );

            scoutsInGroup.forEach(scout => {
                const scoutCard = document.createElement('div');
                scoutCard.className = 'scout-card';
                scoutCard.draggable = true;
                scoutCard.dataset.scoutId = scout.id;

                const nameStrong = document.createElement('strong');
                nameStrong.textContent = scout.name;
                scoutCard.appendChild(nameStrong);

                const skillSpan = document.createElement('span');
                skillSpan.className = 'skill';
                skillSpan.textContent = `Skill: ${scout.skill_level || 'N/A'}`;
                scoutCard.appendChild(skillSpan);

                // Add drag event listeners to the scout card
                scoutCard.addEventListener('dragstart', handleDragStart);
                scoutCard.addEventListener('dragend', handleDragEnd);

                scoutList.appendChild(scoutCard);
            });
            plannerContainer.appendChild(groupBox);
        });
        updateButtonStates();
    }

    function handleDragStart(event) {
        draggedItem = event.target; // The scout card
        event.dataTransfer.setData('text/plain', event.target.dataset.scoutId);
        setTimeout(() => { // Timeout to allow browser to paint drag image
            event.target.classList.add('dragging');
        }, 0);
        statusMessage.textContent = `Dragging ${draggedItem.querySelector('strong').textContent}...`;
        statusMessage.className = 'status-message info';
    }

    function handleDragEnd(event) {
        if (draggedItem) { // It might be null if drop was successful and handled
            draggedItem.classList.remove('dragging');
        }
        draggedItem = null;
        // Clear status or set to idle after a short delay
        // setTimeout(() => { if(statusMessage.textContent.startsWith('Dragging')) statusMessage.textContent = ''; }, 2000);
    }

    function handleDragOver(event) {
        event.preventDefault(); // Necessary to allow dropping
        if (event.currentTarget.classList.contains('camp-group-box')) {
            event.currentTarget.classList.add('drag-over');
        }
    }

    function handleDragEnter(event) {
        event.preventDefault();
        if (event.currentTarget.classList.contains('camp-group-box')) {
            event.currentTarget.classList.add('drag-over');
        }
    }

    function handleDragLeave(event) {
        if (event.currentTarget.classList.contains('camp-group-box')) {
            event.currentTarget.classList.remove('drag-over');
        }
    }

    function handleDrop(event) {
        event.preventDefault();
        const targetDropZone = event.currentTarget; // This is the camp-group-box
        targetDropZone.classList.remove('drag-over');

        if (!draggedItem) return; // Should not happen if dragstart was correct

        const scoutId = event.dataTransfer.getData('text/plain');
        const targetCampGroupName = targetDropZone.dataset.campGroupName;

        const scout = currentScouts.find(s => s.id === scoutId);

        if (scout) {
            const oldCampGroup = scout.campGroup;
            // Handle null for 'Unassigned' group name consistently
            const effectiveTargetCampGroup = targetCampGroupName === 'Unassigned' ? null : targetCampGroupName;

            if (oldCampGroup !== effectiveTargetCampGroup) {
                scout.campGroup = effectiveTargetCampGroup;
                // Instead of full re-render, just move the DOM element for smoother UX
                // draggedItem.parentNode.removeChild(draggedItem); // Remove from old list
                // targetDropZone.querySelector('.scout-list').appendChild(draggedItem); // Add to new list
                // A full re-render is safer for now to ensure data consistency with view
                renderPlanner();
                statusMessage.textContent = `${scout.name} moved to ${targetCampGroupName}. Click Save to persist.`;
                statusMessage.className = 'status-message info';
            } else {
                 statusMessage.textContent = `${scout.name} dropped in the same group.`;
                 statusMessage.className = 'status-message info';
            }
        } else {
            console.error('Scout not found for ID:', scoutId);
            statusMessage.textContent = 'Error: Scout data not found for dragged item.';
            statusMessage.className = 'status-message error';
        }
        // draggedItem.classList.remove('dragging'); // Already handled in dragend
        draggedItem = null; // Clear after processing
        updateButtonStates();
    }

    function arraysEqual(arr1, arr2, compareFn) {
        if (arr1.length !== arr2.length) return false;
        for (let i = 0; i < arr1.length; i++) {
            if (!compareFn(arr1[i], arr2[i])) return false;
        }
        return true;
    }

    function scoutsShallowEqual(scout1, scout2) {
        // Compare relevant properties, primarily campGroup for changes
        return scout1.id === scout2.id && scout1.campGroup === scout2.campGroup;
    }


    function updateButtonStates() {
        // Check if currentScouts differs from originalScouts based on campGroup
        let hasChanges = false;
        if (currentScouts.length !== originalScouts.length) { // Should not happen if IDs are constant
            hasChanges = true;
        } else {
            for (let i = 0; i < currentScouts.length; i++) {
                const current = currentScouts.find(s => s.id === originalScouts[i].id);
                const original = originalScouts[i];
                if (!current || current.campGroup !== original.campGroup) {
                    hasChanges = true;
                    break;
                }
            }
        }

        saveButton.disabled = !hasChanges;
        cancelButton.disabled = !hasChanges;
    }

    saveButton.addEventListener('click', async () => {
        saveButton.disabled = true;
        cancelButton.disabled = true;
        statusMessage.textContent = 'Saving changes...';
        statusMessage.className = 'status-message info';

        const changedScouts = [];
        currentScouts.forEach(currentScout => {
            const originalScout = originalScouts.find(os => os.id === currentScout.id);
            if (originalScout && originalScout.campGroup !== currentScout.campGroup) {
                changedScouts.push({
                    id: currentScout.id,
                    campGroup: currentScout.campGroup // Send the new campGroup
                });
            }
        });

        if (changedScouts.length === 0) {
            statusMessage.textContent = 'No changes to save.';
            statusMessage.className = 'status-message info';
            updateButtonStates(); // Re-enable cancel if needed, save stays disabled
            return;
        }

        let successCount = 0;
        const errorMessages = [];

        for (const scoutToSave of changedScouts) {
            try {
                // IMPORTANT: Replace with your actual API endpoint and structure
                const response = await fetch(`/api/scout/${scoutToSave.id}/campgroup`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        // Add CSRF token or other necessary headers if your app uses them
                        // 'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
                    },
                    body: JSON.stringify({ campGroup: scoutToSave.campGroup })
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ message: `HTTP error ${response.status}` }));
                    throw new Error(`Failed to update ${scoutToSave.id}: ${errorData.message || response.statusText}`);
                }
                // const result = await response.json(); // If backend returns data
                // console.log(`Successfully updated ${scoutToSave.id}:`, result);
                successCount++;
            } catch (error) {
                console.error('Error saving scout:', scoutToSave.id, error);
                errorMessages.push(error.message || `Failed to save ${scoutToSave.id}.`);
            }
        }

        if (errorMessages.length > 0) {
            statusMessage.textContent = `Some updates failed: ${errorMessages.join('; ')}. ${successCount} succeeded.`;
            statusMessage.className = 'status-message error';
            // Decide on rollback or partial save state for originalScouts
            // For now, we assume a partial success means originalScouts is not fully updated
            // User might need to retry or fix manually.
        } else {
            statusMessage.textContent = `All ${successCount} changes saved successfully!`;
            statusMessage.className = 'status-message success';
            // Update originalScouts to reflect the new saved state
            originalScouts = JSON.parse(JSON.stringify(currentScouts));
        }
        renderPlanner(); // Re-render to ensure consistency if any partial failures occurred
        updateButtonStates();
    });

    cancelButton.addEventListener('click', () => {
        statusMessage.textContent = 'Cancelling changes...';
        statusMessage.className = 'status-message info';
        currentScouts = JSON.parse(JSON.stringify(originalScouts)); // Revert to original
        renderPlanner();
        statusMessage.textContent = 'Changes cancelled.';
        // setTimeout(() => statusMessage.textContent = '', 3000); // Clear after a delay
        updateButtonStates();
    });

    // Initial render
    renderPlanner();
    if (initialScoutData.length === 0) {
        statusMessage.textContent = 'No scouts to display. Ensure data is loaded.';
        statusMessage.className = 'status-message info';
    }
});
