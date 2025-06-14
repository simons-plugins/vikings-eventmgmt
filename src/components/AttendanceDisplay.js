// src/components/AttendanceDisplay.js
const { ref, computed, watch } = typeof Vue !== 'undefined' ? Vue : { ref: (val) => ({ value: val }), computed: (fn) => ({ value: fn() }), watch: () => {} };

const AttendanceDisplay = {
  props: {
    attendees: {
      type: Array,
      required: true,
      default: () => []
    },
    isLoading: {
      type: Boolean,
      default: false
    }
  },
  setup(props) {
    /** @type {import('vue').Ref<'summary' | 'grouped' | 'camp-groups'>} */
    const activeTab = ref('summary');

    /** @param {'summary' | 'grouped' | 'camp-groups'} tabName */
    const switchTab = (tabName) => {
      activeTab.value = tabName;
    };

    // === Summary Tab Logic ===
    /** @type {import('vue').ComputedRef<Record<string, {firstname: string, lastname: string, events: import('../types').Attendee[], totalYes: number, totalNo: number}>>} */
    const attendeesByPerson = computed(() => {
      if (!props.attendees || props.attendees.length === 0) return {};
      const groups = {};
      (/** @type {import('../types').Attendee[]} */ (props.attendees)).forEach(attendee => {
        const personKey = `${attendee.firstname} ${attendee.lastname}`;
        if (!groups[personKey]) {
          groups[personKey] = {
            firstname: attendee.firstname,
            lastname: attendee.lastname,
            events: [],
            totalYes: 0,
            totalNo: 0
          };
        }
        groups[personKey].events.push(attendee);
        if (attendee.attending === 'Yes') {
          groups[personKey].totalYes++;
        } else if (attendee.attending === 'No') {
          groups[personKey].totalNo++;
        }
      });
      return groups;
    });
    const summaryPersonKeys = computed(() => Object.keys(attendeesByPerson.value).sort((a, b) => {
        const personA = attendeesByPerson.value[a];
        const personB = attendeesByPerson.value[b];
        const lastNameCompare = personA.lastname.localeCompare(personB.lastname);
        return lastNameCompare !== 0 ? lastNameCompare : personA.firstname.localeCompare(personB.firstname);
    }));
    /** @type {import('vue').Ref<Record<string, boolean>>} */
    const expandedSummaryRows = ref({});
    /** @param {string} personKey */
    const toggleSummaryRow = (personKey) => {
      expandedSummaryRows.value[personKey] = !expandedSummaryRows.value[personKey];
    };

    // === Grouped Tab Logic ===
    /** @type {import('vue').ComputedRef<Record<string, import('../types').Attendee[]>>} */
    const attendeesByStatus = computed(() => {
      if (!props.attendees || props.attendees.length === 0) return {};
      /** @type {Record<string, import('../types').Attendee[]>} */
      const groups = {};
      (/** @type {import('../types').Attendee[]} */ (props.attendees)).forEach(attendee => {
        const status = attendee.attending || attendee.status || 'Unknown';
        if (!groups[status]) groups[status] = [];
        groups[status].push(attendee);
      });
      // Sort records within each group by name
      for (const statusKey in groups) {
        groups[statusKey].sort((a, b) => {
            const lastNameCompare = (a.lastname || '').localeCompare(b.lastname || '');
            if (lastNameCompare !== 0) return lastNameCompare;
            return (a.firstname || '').localeCompare(b.firstname || '');
        });
      }
      const statusPriority = { 'Yes': 1, 'No': 2, 'Invited': 3 };
      const sortedKeys = Object.keys(groups).sort((a, b) => {
         const priorityA = statusPriority[a] || 999;
         const priorityB = statusPriority[b] || 999;
         return priorityA !== priorityB ? priorityA - priorityB : a.localeCompare(b);
      });
      /** @type {Record<string, import('../types').Attendee[]>} */
      const sortedGroups = {};
      sortedKeys.forEach(key => sortedGroups[key] = groups[key]);
      return sortedGroups;
    });
    const groupedStatusKeys = computed(() => Object.keys(attendeesByStatus.value));
    /** @type {import('vue').Ref<Record<string, boolean>>} */
    const expandedGroupedSections = ref({});
    /** @param {string} statusKey */
    const toggleGroupedSection = (statusKey) => {
        expandedGroupedSections.value[statusKey] = !expandedGroupedSections.value[statusKey];
    };
    /** @param {string | undefined} status */
    const getStatusColorClass = (status) => {
         switch (status?.toLowerCase()) {
             case 'yes': case 'attended': case 'present': return 'badge-success';
             case 'no': case 'absent': case 'not attended': return 'badge-danger';
             case 'maybe': case 'invited': return 'badge-warning'; // 'Invited' as warning
             default: return 'badge-secondary';
         }
    };

    // === Camp Groups Logic ===
    /** @type {import('vue').ComputedRef<{firstname: string, lastname: string, sectionname?: string}[]>} */
    const uniqueCampAttendees = computed(() => {
      if (!props.attendees || props.attendees.length === 0) return [];
      /** @type {Record<string, {firstname: string, lastname: string, sectionname?: string}>} */
      const unique = {};
      (/** @type {import('../types').Attendee[]} */ (props.attendees)).forEach(attendee => {
        const nameKey = `${attendee.firstname} ${attendee.lastname}`;
        if (!unique[nameKey]) {
          unique[nameKey] = {
            firstname: attendee.firstname,
            lastname: attendee.lastname,
            sectionname: attendee.sectionname // Assuming sectionname is available from the processed attendees
          };
        }
      });
      return Object.values(unique).sort((a, b) => {
        const lastNameCompare = a.lastname.localeCompare(b.lastname);
        return lastNameCompare !== 0 ? lastNameCompare : a.firstname.localeCompare(b.firstname);
      });
    });

     watch(() => props.attendees, () => {
         expandedSummaryRows.value = {};
         // For grouped sections, re-evaluate auto-expansion when attendees change
         const keys = Object.keys(attendeesByStatus.value);
         expandedGroupedSections.value = {}; // Clear old expansions
         if (keys.length > 0) {
             expandedGroupedSections.value[keys[0]] = true; // Auto-expand first group
         }
     }, { deep: true, immediate: true }); // immediate to run on component mount

    return {
      activeTab,
      switchTab,
      attendeesByPerson,
      summaryPersonKeys,
      expandedSummaryRows,
      toggleSummaryRow,
      attendeesByStatus,
      groupedStatusKeys,
      expandedGroupedSections,
      toggleGroupedSection,
      getStatusColorClass,
      uniqueCampAttendees
    };
  },
  template: `
    <div class="card shadow-sm h-100 mt-4">
      <div class="card-header bg-info text-white">
        <h5 class="mb-0"><i class="fas fa-users me-2"></i>Attendance Records</h5>
      </div>
      <div class="card-body p-0">
        <nav>
          <div class="nav nav-tabs border-bottom" id="nav-tab" role="tablist">
            <button class="nav-link" :class="{ active: activeTab === 'summary' }" @click="switchTab('summary')">
              <i class="fas fa-table me-1"></i> Summary
            </button>
            <button class="nav-link" :class="{ active: activeTab === 'grouped' }" @click="switchTab('grouped')">
              <i class="fas fa-layer-group me-1"></i> Detailed Groups
            </button>
            <button class="nav-link" :class="{ active: activeTab === 'camp-groups' }" @click="switchTab('camp-groups')">
              <i class="fas fa-campground me-1"></i> Camp Groups
            </button>
          </div>
        </nav>
        <div class="tab-content p-0" id="nav-tabContent">
          <div v-if="isLoading" class="text-center p-4">
            <div class="spinner-border text-primary" role="status"></div>
            <p class="mt-2">Loading attendance data...</p>
          </div>
          <div v-else-if="!attendees || attendees.length === 0" class="text-center p-4 text-muted">
            <i class="fas fa-info-circle fa-2x mb-2"></i>
            <p>No attendance data to display. Select some events.</p>
          </div>
          <template v-else>
            <!-- Summary Tab -->
            <div class="tab-pane fade" :class="{ 'show active': activeTab === 'summary' }" id="nav-summary">
              <div class="table-responsive">
                <table class="table table-striped table-sm">
                  <thead>
                    <tr>
                      <th style="width: 120px;" class="text-center">Attending (Y/N)</th>
                      <th>First Name</th>
                      <th>Last Name</th>
                      <th style="width: 40px;" class="text-center"><i class="fas fa-chevron-down"></i></th>
                    </tr>
                  </thead>
                  <tbody>
                    <template v-for="personKey in summaryPersonKeys" :key="personKey">
                      <tr @click="toggleSummaryRow(personKey)" style="cursor: pointer;">
                        <td class="text-center">
                          <span class="text-success fw-bold">{{ attendeesByPerson[personKey].totalYes }}</span> /
                          <span class="text-danger">{{ attendeesByPerson[personKey].totalNo }}</span>
                        </td>
                        <td>{{ attendeesByPerson[personKey].firstname }}</td>
                        <td>{{ attendeesByPerson[personKey].lastname }}</td>
                        <td class="text-center">
                          <i :class="['fas', expandedSummaryRows[personKey] ? 'fa-chevron-up' : 'fa-chevron-down']"></i>
                        </td>
                      </tr>
                      <tr v-show="expandedSummaryRows[personKey]">
                        <td colspan="4" class="bg-light p-0">
                          <div class="table-responsive">
                            <table class="table table-sm mb-0">
                              <thead class="bg-secondary text-white">
                                <tr><th>Section</th><th>Event</th><th class="text-center">Status</th></tr>
                              </thead>
                              <tbody>
                                <tr v-for="(event, idx) in attendeesByPerson[personKey].events" :key="idx">
                                  <td class="small">{{ event.sectionname || '' }}</td>
                                  <td class="small">{{ event._eventName || '' }}</td>
                                  <td class="small text-center" :class="{'text-success': event.attending === 'Yes', 'text-danger': event.attending !== 'Yes'}">
                                    <strong>{{ event.attending || '' }}</strong>
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    </template>
                  </tbody>
                </table>
              </div>
            </div>
            <!-- Grouped Tab -->
            <div class="tab-pane fade" :class="{ 'show active': activeTab === 'grouped' }" id="nav-grouped">
              <div v-for="(records, statusKey) in attendeesByStatus" :key="statusKey" class="border-bottom">
                <div class="d-flex justify-content-between align-items-center p-3 bg-light border-bottom"
                     style="cursor: pointer;" @click="toggleGroupedSection(statusKey)">
                  <h6 class="mb-0">
                    <i :class="['fas', 'me-2', expandedGroupedSections[statusKey] ? 'fa-chevron-down' : 'fa-chevron-right']"></i>
                    <span :class="['badge', getStatusColorClass(statusKey), 'me-2']">{{ statusKey }}</span>
                    <span class="text-muted">{{ records.length }} attendees</span>
                  </h6>
                </div>
                <div class="collapse" :class="{ show: expandedGroupedSections[statusKey] }">
                  <div class="table-responsive">
                    <table class="table table-sm table-hover mb-0">
                      <thead class="thead-light"><tr><th>Name</th><th>Section</th><th>Event</th><th>Date</th><th>Status Detail</th></tr></thead>
                      <tbody>
                        <tr v-for="(attendee, idx) in records" :key="idx">
                          <td><strong>{{ attendee.firstname || '' }} {{ attendee.lastname || '' }}</strong></td>
                          <td>{{ attendee.sectionname || '-' }}</td>
                          <td>{{ attendee._eventName || '-' }}</td>
                          <td>{{ attendee._eventDate || '-' }}</td>
                          <td><span :class="['badge', getStatusColorClass(statusKey)]">{{ statusKey }}</span></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
            <!-- Camp Groups Tab -->
            <div class="tab-pane fade" :class="{ 'show active': activeTab === 'camp-groups' }" id="nav-camp-groups">
              <div class="table-responsive">
                <table class="table table-striped table-sm">
                  <thead class="thead-light"><tr><th>Name</th><th>Section</th></tr></thead>
                  <tbody>
                    <tr v-for="(attendee, idx) in uniqueCampAttendees" :key="idx">
                      <td><strong>{{ attendee.firstname }} {{ attendee.lastname }}</strong></td>
                      <td><small class="text-muted">{{ attendee.sectionname || '-' }}</small></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </template>
        </div>
      </div>
    </div>
  `
};
if (typeof window.VUE_COMPONENTS === 'undefined') { window.VUE_COMPONENTS = {}; }
window.VUE_COMPONENTS.AttendanceDisplay = AttendanceDisplay;
