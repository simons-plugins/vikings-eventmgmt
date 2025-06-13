// src/components/SectionsTable.js
// Ensure Vue is available globally if not using modules/build
const { ref, watch } = typeof Vue !== 'undefined' ? Vue : { ref: () => ({ value: [] }), watch: () => {} }; // Ensure ref returns an object with a value property

const SectionsTable = {
  props: {
    sections: {
      type: Array,
      required: true,
      default: () => []
    }
  },
  emits: ['selection-change'],
  setup(props, { emit }) {
    const selectedSectionIds = ref([]);

    // Function to handle checkbox change
    const handleCheckboxChange = (sectionId, event) => {
      if (event.target.checked) {
        if (!selectedSectionIds.value.includes(sectionId)) {
          selectedSectionIds.value.push(sectionId);
        }
      } else {
        selectedSectionIds.value = selectedSectionIds.value.filter(id => id !== sectionId);
      }
      emit('selection-change', [...selectedSectionIds.value]); // Emit a copy
    };

    // Watch for external changes to sections prop to reset selection if needed
    watch(() => props.sections, (newSections, oldSections) => {
      // A simple approach: if the list of sections fundamentally changes, clear selections.
      // This avoids trying to keep selections for sections that no longer exist.
      // More sophisticated logic could be used to preserve selections for common sections.
      if (JSON.stringify(newSections) !== JSON.stringify(oldSections)) {
          console.log('SectionsTable: Sections prop changed, resetting selection.');
          selectedSectionIds.value = [];
          emit('selection-change', []);
      }
    }, { deep: true });

    // Expose to template
    return {
      // selectedSectionIds, // Not directly needed in template if events drive parent
      handleCheckboxChange
    };
  },
  template: `
    <div class="mb-3">
      <div class="d-flex justify-content-end mb-2">
        <!-- Refresh button can be added here if it's component-specific -->
      </div>
      <table id="sections-table" class="table table-striped table-sm">
        <thead>
          <tr>
            <th style="width: 40px;"></th>
            <th>Section Name</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!sections || sections.length === 0">
            <td colspan="2" class="text-center text-muted">
              No sections loaded or available.
            </td>
          </tr>
          <tr v-for="section in sections" :key="section.sectionid">
            <td>
              <input
                type="checkbox"
                class="section-checkbox"
                :value="section.sectionid"
                :checked="selectedSectionIds.includes(section.sectionid)"
                @change="handleCheckboxChange(section.sectionid, $event)"
              >
            </td>
            <td>{{ section.sectionname }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  `
};

// If not using modules, make it globally available or handle registration in main.js
// For simplicity with CDN, we might attach it to a global object or register in App.
if (typeof window.VUE_COMPONENTS === 'undefined') {
  window.VUE_COMPONENTS = {};
}
window.VUE_COMPONENTS.SectionsTable = SectionsTable;
