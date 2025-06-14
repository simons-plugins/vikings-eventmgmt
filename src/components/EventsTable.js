// src/components/EventsTable.js

const EventsTable = {
  props: {
    events: {
      type: Array,
      required: true,
      default: () => []
    },
    isLoading: {
      type: Boolean,
      default: false
    },
    forceMobileLayout: { // Prop to mimic original behavior
      type: Boolean,
      default: true // Original seemed to force mobile layout for events table
    }
  },
  emits: ['event-selection-change'],
  setup(props, { emit }) {
    const { ref, watch, computed } = Vue; // Moved destructuring here
    /** @type {import('vue').Ref<import('../types').Event[]>} */
    const selectedEventsInternal = ref([]); // Store the full event objects that are selected

    const isMobile = computed(() => {
      // In a real scenario, you might check window.innerWidth, but here we use the prop
      return props.forceMobileLayout;
    });

    const handleCheckboxChange = (eventObj, eventDomElement) => {
      if (eventDomElement.target.checked) {
        if (!selectedEventsInternal.value.find(e => e.eventid === eventObj.eventid && e.sectionid === eventObj.sectionid)) {
          selectedEventsInternal.value.push(eventObj);
        }
      } else {
        selectedEventsInternal.value = selectedEventsInternal.value.filter(e => !(e.eventid === eventObj.eventid && e.sectionid === eventObj.sectionid));
      }
      /**
       * Emitted when event selection changes.
       * @event event-selection-change
       * @type {import('../types').Event[]}
       */
      emit('event-selection-change', [...selectedEventsInternal.value]);
    };

    /** @type {import('vue').Ref<Record<number, boolean>>} */
    const expandedMobileRows = ref({}); // For mobile view: { [idx]: boolean }
    /** @param {number} idx */
    const toggleMobileRow = (idx) => {
        expandedMobileRows.value[idx] = !expandedMobileRows.value[idx];
    };

    // Clear selections if the events list itself changes dramatically (e.g., new sections selected)
    watch(() => /** @type {import('../types').Event[]} */ (props.events), () => {
      selectedEventsInternal.value = [];
      expandedMobileRows.value = {}; // Reset expanded rows as well
      // Do not emit here as it might cause circular updates if parent is also watching selectedEvents
      // emit('event-selection-change', []);
    }, { deep: true });

    // To ensure checkboxes reflect internal state if events prop changes
    // This is a bit complex because props.events could change and selectedEventsInternal might hold stale selections
    // For now, this is handled by the watch above clearing selections.
    // A more robust solution might involve reconciling selectedEventsInternal with the new props.events.

    return {
      isMobile,
      selectedEventsInternal, // For :checked binding
      handleCheckboxChange,
      expandedMobileRows,
      toggleMobileRow
    };
  },
  template: `
    <div class="mt-3">
      <h5>Events</h5>
      <div v-if="isLoading" class="text-center">
        <div class="spinner-border spinner-border-sm text-primary" role="status"></div>
        <p>Loading events...</p>
      </div>
      <div v-else-if="!events || events.length === 0" class="text-center text-muted py-3">
        <i class="fas fa-calendar-alt fa-2x mb-2"></i>
        <p class="mb-0 mt-2">No events found for selected sections, or no sections selected.</p>
      </div>
      <div v-else class="table-responsive">
        <table id="events-table" class="table table-striped table-sm">
          <!-- Mobile Layout -->
          <template v-if="isMobile">
            <thead>
              <tr>
                <th style="width: 40px;"></th>
                <th style="width: 70px;" class="text-center">Total</th>
                <th>Event Details</th>
                <th style="width: 40px;"><i class="fas fa-info-circle" title="Tap rows to expand/collapse details"></i></th>
              </tr>
            </thead>
            <tbody>
              <template v-for="(event, idx) in events" :key="event.eventid + '-' + event.sectionid">
                <tr @click="toggleMobileRow(idx)" style="cursor: pointer;">
                  <td>
                    <input
                      type="checkbox"
                      class="event-checkbox"
                      :data-idx="idx"
                      :value="event"
                      :checked="selectedEventsInternal.some(e => e.eventid === event.eventid && e.sectionid === event.sectionid)"
                      @change="handleCheckboxChange(event, $event)"
                      @click.stop
                    >
                  </td>
                  <td class="text-center">
                    <div class="d-flex flex-column">
                      <span class="text-success fw-bold">{{ event.yes || 0 }}</span>
                      <span class="text-danger small">{{ event.no || 0 }}</span>
                    </div>
                  </td>
                  <td>
                    <div class="fw-bold">{{ event.name || '' }}</div>
                    <small class="text-muted">{{ event.sectionname || '' }} &bull; {{ event.date || '' }}</small>
                  </td>
                  <td class="text-center">
                    <i :class="['fas', expandedMobileRows[idx] ? 'fa-chevron-up' : 'fa-chevron-down']"></i>
                  </td>
                </tr>
                <tr v-show="expandedMobileRows[idx]" :id="'details-' + idx">
                  <td colspan="4" class="bg-light p-2">
                    <div class="row text-center">
                      <div class="col-3"><small class="text-muted d-block">Members</small><strong class="text-success">{{ event.yes_members || 0 }}</strong></div>
                      <div class="col-3"><small class="text-muted d-block">YLs</small><strong class="text-success">{{ event.yes_yls || 0 }}</strong></div>
                      <div class="col-3"><small class="text-muted d-block">Leaders</small><strong class="text-success">{{ event.yes_leaders || 0 }}</strong></div>
                      <div class="col-3"><small class="text-muted d-block">No</small><strong class="text-danger">{{ event.no || 0 }}</strong></div>
                    </div>
                  </td>
                </tr>
              </template>
            </tbody>
          </template>
          <!-- Desktop Layout -->
          <template v-else>
             <thead>
                 <tr>
                     <th style="width: 40px;"></th>
                     <th style="min-width: 120px;">Section</th>
                     <th style="min-width: 150px;">Event Name</th>
                     <th style="min-width: 100px;">Date</th>
                     <th style="min-width: 60px;" class="text-center">Yes</th>
                     <th style="min-width: 80px;" class="text-center">Members</th>
                     <th style="min-width: 60px;" class="text-center">YLs</th>
                     <th style="min-width: 80px;" class="text-center">Leaders</th>
                     <th style="min-width: 60px;" class="text-center">No</th>
                 </tr>
             </thead>
             <tbody>
                 <tr v-for="(event, idx) in events" :key="event.eventid + '-' + event.sectionid">
                     <td>
                       <input
                         type="checkbox"
                         class="event-checkbox"
                         :data-idx="idx"
                         :value="event"
                         :checked="selectedEventsInternal.some(e => e.eventid === event.eventid && e.sectionid === event.sectionid)"
                         @change="handleCheckboxChange(event, $event)"
                       >
                     </td>
                     <td class="text-nowrap">{{ event.sectionname || '' }}</td>
                     <td>{{ event.name || '' }}</td>
                     <td class="text-nowrap">{{ event.date || '' }}</td>
                     <td class="text-center">{{ event.yes || 0 }}</td>
                     <td class="text-center">{{ event.yes_members || 0 }}</td>
                     <td class="text-center">{{ event.yes_yls || 0 }}</td>
                     <td class="text-center">{{ event.yes_leaders || 0 }}</td>
                     <td class="text-center">{{ event.no || 0 }}</td>
                 </tr>
             </tbody>
          </template>
        </table>
      </div>
    </div>
  `
};
if (typeof window.VUE_COMPONENTS === 'undefined') { window.VUE_COMPONENTS = {}; }
window.VUE_COMPONENTS.EventsTable = EventsTable;
console.log('EventsTable.js executed and registered');
