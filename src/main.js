// Wait for the DOM to be fully loaded before initializing Vue
document.addEventListener('DOMContentLoaded', () => {
  // --- Initial Checks ---
  if (typeof Vue === 'undefined') {
    console.error('Vue is not loaded. Check the CDN link in index.html.');
    document.body.innerHTML = '<p style="color: red; text-align: center; font-size: 1.2em; padding: 20px;">Error: Vue.js did not load. Application cannot start.</p>';
    return;
  }
  if (typeof window.API_FUNCTIONS === 'undefined') {
    console.error('API functions not loaded. Check api.js script tag in index.html.');
    document.body.innerHTML = '<p style="color: red; text-align: center; font-size: 1.2em; padding: 20px;">Error: API script did not load. Application cannot start.</p>';
    return;
  }
  if (typeof window.VUE_COMPONENTS === 'undefined' ||
      !window.VUE_COMPONENTS.SectionsTable ||
      !window.VUE_COMPONENTS.EventsTable ||
      !window.VUE_COMPONENTS.AttendanceDisplay ||
      !window.VUE_COMPONENTS.BlockedScreen ||
      !window.VUE_COMPONENTS.RateLimitIndicator) { // Added RateLimitIndicator check
    console.error('Vue components not loaded. Check component script tags in index.html.');
    document.body.innerHTML = '<p style="color: red; text-align: center; font-size: 1.2em; padding: 20px;">Error: Vue components script did not load. Application cannot start.</p>';
    return;
  }

  // --- Vue App Setup ---
  const { ref, computed, onMounted } = Vue;
      // const API = window.API_FUNCTIONS; // Defined later for clarity
  const SectionsTable = window.VUE_COMPONENTS.SectionsTable;
  const EventsTable = window.VUE_COMPONENTS.EventsTable;
  const AttendanceDisplay = window.VUE_COMPONENTS.AttendanceDisplay;
  const BlockedScreen = window.VUE_COMPONENTS.BlockedScreen;
  const RateLimitIndicator = window.VUE_COMPONENTS.RateLimitIndicator; // Added RateLimitIndicator
  const API = window.API_FUNCTIONS;

  // Auth constants
  const clientId = 'x7hx1M0NExVdSiksH1gUBPxkSTn8besx';
  const scope = 'section:member:read section:programme:read section:event:read';
  const redirectUri = window.location.origin + '/callback.html';

  // Cache constants
  const SECTIONS_CACHE_KEY = 'viking_sections_cache';
  const SECTIONS_CACHE_EXPIRY = 1 * 60 * 60 * 1000; // 1 hour in milliseconds

  const App = {
    components: {
      'sections-table': SectionsTable,
      'events-table': EventsTable,
      'attendance-display': AttendanceDisplay,
      'blocked-screen': BlockedScreen,
      'rate-limit-indicator': RateLimitIndicator // Added RateLimitIndicator
    },
    setup() {
      // Core App State
      const message = ref('Viking Scouts Event Management'); // User-facing title
      /** @type {import('vue').Ref<string | null>} */
      const appError = ref(null); // For displaying errors to the user
      const isAppLoading = ref(true); // For initial auth/block check

      // Blocked State
      /** @type {import('vue').Ref<boolean>} */
      const isBlocked = ref(false);

      // Auth State
      /** @type {import('vue').Ref<boolean>} */
      const isAuthenticated = ref(false);
      /** @type {import('vue').Ref<string>} */
      const osmLoginUrl = ref('');

      // Sidebar State
      /** @type {import('vue').Ref<boolean>} */
      const isSidebarOpen = ref(window.innerWidth >= 768);

      // Data State
      /** @type {import('vue').Ref<import('./types').Section[]>} */
      const sections = ref([]);
      const isLoadingSections = ref(false); // For subsequent section loads/refreshes
      /** @type {import('vue').Ref<string[]>} */
      const selectedSectionIdsFromChild = ref([]);
      /** @type {import('vue').Ref<import('./types').Event[]>} */
      const eventsList = ref([]);
      const isLoadingEvents = ref(false);
      /** @type {import('vue').Ref<import('./types').Event[]>} */
      const selectedEventsFromChild = ref([]);
      /** @type {import('vue').Ref<import('./types').Attendee[]>} */
      const attendeesList = ref([]);
      const isLoadingAttendance = ref(false);

      // Computed section map (used internally)
      /** @type {import('vue').ComputedRef<Record<string, {sectionname: string}>>} */
      const sectionDetailsMap = computed(() => {
        const map = {};
        sections.value.forEach(section => {
          map[section.sectionid] = { sectionname: section.sectionname };
        });
        return map;
      });

      // --- Caching Functions ---
      const getSectionsFromCache = () => {
        try {
          const cached = localStorage.getItem(SECTIONS_CACHE_KEY);
          if (!cached) return null;
          const cacheData = JSON.parse(cached);
          if (Date.now() - cacheData.timestamp > SECTIONS_CACHE_EXPIRY) {
            localStorage.removeItem(SECTIONS_CACHE_KEY);
            console.info('App: Sections cache expired.');
            return null;
          }
          console.info('App: Loaded sections from cache.');
          return cacheData.sections;
        } catch (e) { console.warn('App: Failed to load sections from cache', e); return null; }
      };
      const saveSectionsToCache = (sectionsToCache) => {
        try {
          localStorage.setItem(SECTIONS_CACHE_KEY, JSON.stringify({ sections: sectionsToCache, timestamp: Date.now() }));
          console.info('App: Saved sections to cache.');
        } catch (e) { console.warn('App: Failed to save sections to cache', e); }
      };
      const clearSectionsCache = () => {
        localStorage.removeItem(SECTIONS_CACHE_KEY);
        console.info('App: Sections cache cleared.');
      };

      // --- Blocked State Logic ---
      const checkForBlockedStatus = () => {
        if (sessionStorage.getItem('osm_blocked') === 'true') {
          isBlocked.value = true;
          isAppLoading.value = false;
          return true;
        }
        return false;
      };
      const clearBlockedStatusAdmin = () => {
        sessionStorage.removeItem('osm_blocked');
        isBlocked.value = false;
        isAppLoading.value = true;
        checkAuthStatus();
      };

      // --- Auth Logic ---
      const prepareLoginUrl = () => {
        osmLoginUrl.value = `https://www.onlinescoutmanager.co.uk/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&response_type=code`;
      };
      const login = () => { if (osmLoginUrl.value) window.location.href = osmLoginUrl.value; else console.error("Login URL not prepared.");};
      const clearAppData = () => {
        sections.value = []; eventsList.value = []; selectedSectionIdsFromChild.value = [];
        selectedEventsFromChild.value = []; attendeesList.value = []; appError.value = null;
      };
      const logout = () => {
        if (API.clearToken) API.clearToken();
        clearSectionsCache();
        isAuthenticated.value = false;
        clearAppData();
        prepareLoginUrl();
        console.info('App: Logged out.');
      };

      /**
       * @param {import('./types').Section[]} sectionsData
       */
      const loadSectionsAndMap = (sectionsData) => {
         sections.value = sectionsData;
         // sectionDetailsMap is computed, so it will update automatically
      };

      const checkAuthStatus = async () => {
        if (checkForBlockedStatus()) return;
        isAppLoading.value = true;
        appError.value = null;
        try {
          const token = API.getToken();
          if (token) {
            const cachedSections = getSectionsFromCache();
            if (cachedSections) {
              loadSectionsAndMap(cachedSections);
              // console.info('App: Sections initially loaded from cache during auth check.'); // Less verbose
            }
            const sectionsDataFromApi = await API.getUserRoles();
            if (!cachedSections || JSON.stringify(cachedSections) !== JSON.stringify(sectionsDataFromApi)) {
              loadSectionsAndMap(sectionsDataFromApi);
              saveSectionsToCache(sectionsDataFromApi);
              console.info('App: Cache updated with fresh sections from API.');
            }
            isAuthenticated.value = true;
            console.info('App: User is authenticated and sections are loaded/validated.');
          } else {
            isAuthenticated.value = false;
            prepareLoginUrl();
            console.info('App: No token found. User needs to login.');
          }
        } catch (error) {
          console.error('App: Auth/API error during initial load:', error);
          appError.value = `Authentication or data loading failed: ${error.message}. Try logging out or refreshing.`;
          isAuthenticated.value = false;
          prepareLoginUrl();
        } finally {
          isAppLoading.value = false;
        }
      };

      // --- Sidebar Logic ---
      const toggleSidebar = () => { isSidebarOpen.value = !isSidebarOpen.value; };
      const handleResize = () => { if (window.innerWidth < 768) isSidebarOpen.value = false; else isSidebarOpen.value = true; };

      // --- Data Handling ---
      /**
       * @param {string[]} selectedIds
       */
      const handleSectionSelection = async (selectedIds) => {
        selectedSectionIdsFromChild.value = selectedIds; appError.value = null;
        eventsList.value = []; selectedEventsFromChild.value = []; attendeesList.value = [];
        if (!selectedIds || selectedIds.length === 0) { isLoadingEvents.value = false; return; }
        // console.info('App: Fetching events for selected sections:', selectedIds);
        isLoadingEvents.value = true; let aggregatedEvents = [];
        try {
          for (const sectionId of selectedIds) {
            const termId = await API.getMostRecentTermId(sectionId);
            if (termId) {
              const eventsData = await API.getEvents(sectionId, termId);
              if (eventsData && eventsData.items) {
                const sectionName = sectionDetailsMap.value[sectionId]?.sectionname || 'Unknown Section';
                aggregatedEvents.push(...eventsData.items.map(event => ({ ...event, sectionname: sectionName, sectionid: sectionId, termid: termId })));
              }
            } else { console.warn(`App: No termId found for section ${sectionId}.`);}
          }
        } catch (e) { console.error(`App: Failed to load events: ${e.message || 'Unknown error'}`, e); appError.value = `Failed to load events: ${e.message || 'Unknown error'}`; }
        finally { isLoadingEvents.value = false; }
        eventsList.value = aggregatedEvents;
      };
      /**
       * @param {import('./types').Event[]} selectedEvents
       */
      const handleEventSelection = async (selectedEvents) => {
        selectedEventsFromChild.value = selectedEvents; appError.value = null; attendeesList.value = [];
        if (!selectedEvents || selectedEvents.length === 0) { isLoadingAttendance.value = false; return; }
        // console.info('App: Fetching attendance for selected events:', selectedEvents.map(e => e.eventid));
        isLoadingAttendance.value = true; let aggregatedAttendees = [];
        try {
          for (const event of selectedEvents) {
            if (!event || !event.sectionid || !event.eventid || !event.termid) { console.warn('App: Invalid event object in selection for attendance:', event); continue; }
            const attendanceData = await API.getEventAttendance(event.sectionid, event.eventid, event.termid);
            const items = (attendanceData?.items && Array.isArray(attendanceData.items)) ? attendanceData.items : (Array.isArray(attendanceData) ? attendanceData : []);
            aggregatedAttendees.push(...items.map(att => ({ ...att, _eventName: event.name, _eventDate: event.date, sectionname: event.sectionname })));
          }
        } catch (e) { console.error(`App: Failed to load attendance: ${e.message || 'Unknown error'}`, e); appError.value = `Failed to load attendance: ${e.message || 'Unknown error'}`; }
        finally { isLoadingAttendance.value = false; }
        attendeesList.value = aggregatedAttendees;
      };

      // --- Lifecycle Hooks ---
      onMounted(() => {
        if (checkForBlockedStatus()) return;
        checkAuthStatus();
        window.addEventListener('resize', handleResize);
        handleResize(); // Initial check
      });
      // onUnmounted: window.removeEventListener('resize', handleResize); // If component could be unmounted

      return { // Return all reactive properties and methods for the template
        message, appError, isAppLoading, isBlocked, isAuthenticated, osmLoginUrl, login, logout,
        isSidebarOpen, toggleSidebar,
        sections, isLoadingSections, selectedSectionIdsFromChild, handleSectionSelection,
        eventsList, isLoadingEvents, selectedEventsFromChild, handleEventSelection,
        attendeesList, isLoadingAttendance,
        clearBlockedStatusAdmin
      };
    },
    template: `
      <div id="vue-app-wrapper">
        <template v-if="isBlocked">
          <blocked-screen @clear-block="clearBlockedStatusAdmin"></blocked-screen>
        </template>
        <template v-else-if="isAppLoading">
          <div class="vh-100 d-flex justify-content-center align-items-center bg-light">
            <div class="spinner-border text-primary" style="width: 3rem; height: 3rem;" role="status"></div>
            <p class="ms-3 h4 text-muted">Checking authentication...</p>
          </div>
        </template>
        <template v-else-if="isAuthenticated">
          <button @click="toggleSidebar"
                  class="btn btn-light position-fixed top-0 start-0 m-2 z-index-master shadow-sm d-md-none"
                  style="z-index: 1050;"> <!-- Mobile toggle -->
            <i class="fas fa-bars"></i>
          </button>
          <div class="d-flex"> <!-- Flex container for sidebar and main content -->
            <nav id="sidebar-vue"
                 :class="['bg-light', 'p-3', 'border-end', 'd-flex', 'flex-column', 'vh-100',
                          { 'sidebar-collapsed': !isSidebarOpen, 'sidebar-mobile-open': isSidebarOpen }]">
                 <!-- Sidebar content -->
                <div class="sidebar-header mb-3 d-flex justify-content-between align-items-center">
                  <h3 class="mb-0">Controls</h3>
                  <button @click="toggleSidebar" class="btn btn-sm btn-outline-secondary d-md-none" v-if="isSidebarOpen">
                     <i class="fas fa-times"></i> <!-- Close button for mobile open sidebar -->
                  </button>
                </div>
                <div class="sidebar-content flex-grow-1 overflow-auto">
                  <div v-if="isLoadingSections" class="text-center my-2"><div class="spinner-border spinner-border-sm"></div> <p>Loading sections...</p></div>
                  <sections-table v-else :sections="sections" @selection-change="handleSectionSelection"></sections-table>
                  <hr/>
                  <p class="small text-muted">Selected Sections: {{ selectedSectionIdsFromChild.join(', ') || 'None' }}</p>

                  <div v-if="isLoadingEvents" class="text-center my-2"><div class="spinner-border spinner-border-sm"></div> <p>Loading events...</p></div>
                  <events-table v-else :events="eventsList" :is-loading="isLoadingEvents" @event-selection-change="handleEventSelection"></events-table>
                  <hr/>
                  <p class="small text-muted">Selected Events: {{ selectedEventsFromChild.length }}</p>
                </div>
                <button @click="logout" class="btn btn-outline-danger btn-sm w-100 mt-auto"><i class="fas fa-sign-out-alt me-1"></i>Logout</button>
            </nav>
            <main id="main-content-vue" :class="['flex-grow-1', 'p-0', { 'main-content-shifted': isSidebarOpen }]">
              <header class="bg-primary text-white py-3 mb-0 shadow-sm sticky-top">
                <div class="container-fluid d-flex justify-content-between align-items-center">
                   <button @click="toggleSidebar" class="btn btn-primary me-2 d-none d-md-inline-block"> <!-- Desktop toggle -->
                     <i :class="['fas', isSidebarOpen ? 'fa-chevron-left' : 'fa-chevron-right']"></i>
                   </button>
                  <h1 class="h4 mb-0 text-truncate flex-grow-1" style="max-width: calc(100% - 150px);">{{ message }}</h1>
                  <!-- Desktop logout moved to sidebar for consistency, or keep here if preferred -->
                </div>
              </header>
              <div class="p-3">
                <div v-if="appError" class="alert alert-danger">{{ appError }}</div>
                <attendance-display
                    v-if="selectedEventsFromChild.length > 0"
                    :attendees="attendeesList"
                    :is-loading="isLoadingAttendance">
                </attendance-display>
                <div v-else class="text-center p-md-5 p-3 bg-light rounded mt-3 border">
                    <i class="fas fa-info-circle fa-3x text-muted mb-3"></i>
                    <p v-if="isLoadingSections || isLoadingEvents || isLoadingAttendance" class="text-muted">Loading data, please wait...</p>
                    <p v-else-if="selectedSectionIdsFromChild.length === 0" class="lead text-muted">Please select a section to view events.</p>
                    <p v-else-if="eventsList.length === 0 && !isLoadingEvents" class="lead text-muted">No events found for the selected section(s).</p>
                    <p v-else-if="selectedEventsFromChild.length === 0" class="lead text-muted">Please select one or more events to view attendance.</p>
                </div>
              </div>
            </main>
          </div>
        </template>
        <template v-else>
          <div class="container text-center p-md-5 p-3 mt-5">
            <img src="./favicon.ico" alt="App Logo" style="width:80px; height:80px; margin-bottom:20px;"/>
            <h2 class="mb-3">Viking Scouts Event Management</h2>
            <p class="lead text-muted mb-4">Streamline your event planning and attendance tracking.</p>
            <p>Please log in with your Online Scout Manager account to continue.</p>
            <button @click="login" class="btn btn-primary btn-lg mt-3" :disabled="!osmLoginUrl">
              <i class="fas fa-sign-in-alt me-2"></i>Login with Online Scout Manager
            </button>
            <div v-if="appError" class="alert alert-danger mt-4 col-md-8 offset-md-2">{{ appError }}</div>
            <p v-if="!osmLoginUrl && !isAppLoading" class="text-danger mt-2 small">Login service is currently unavailable. Please try again later or check configuration.</p>
          </div>
        </template>
        <rate-limit-indicator v-if="isAuthenticated"></rate-limit-indicator>
      </div>
    `
  };

  try {
    const appInstance = Vue.createApp(App);

    // --- Vue Global Error Handler for Sentry ---
    if (typeof appInstance !== 'undefined' && appInstance.config) {
      appInstance.config.errorHandler = (err, instance, info) => {
        console.error("Vue errorHandler caught:", err);
        console.error("Vue component instance:", instance);
        console.error("Vue-specific error info:", info);

        if (window.Sentry) {
          window.Sentry.withScope((scope) => {
            // Attempt to get component name
            let componentName = 'UnknownComponent';
            if (instance) {
              if (instance.$options && instance.$options.name) {
                componentName = instance.$options.name;
              } else if (instance.$ && instance.$.type && instance.$.type.name) {
                // For Composition API components, name might be in internal type object
                componentName = instance.$.type.name;
              } else if (instance.$options && instance.$options._componentTag) {
                componentName = instance.$options._componentTag;
              } else if (instance._ && instance._.setupState && instance._.setupState.constructor) {
                 // Fallback for some Composition API setups if a more direct name isn't found
                 componentName = instance._.setupState.constructor.name || 'CompositionComponent';
              }
            }
            scope.setExtra("vue_component_name", componentName);
            scope.setExtra("vue_props", instance ? instance.$props : 'N/A');
            scope.setExtra("vue_lifecycle_hook_info", info);
            window.Sentry.captureException(err);
          });
        } else {
          console.warn("Sentry is not available. Error not reported to Sentry.");
        }
      };

      // Optional: Vue warnHandler
      // appInstance.config.warnHandler = (msg, instance, trace) => {
      //   console.warn("Vue warnHandler caught:", msg, trace);
      //   if (window.Sentry) {
      //     window.Sentry.withScope((scope) => {
      //       let componentName = 'UnknownComponent';
      //       if (instance) { /* ... similar logic to above for componentName ... */ }
      //       scope.setExtra("vue_component_name", componentName);
      //       scope.setExtra("vue_trace", trace);
      //       window.Sentry.captureMessage(`Vue Warning: ${msg}`, 'warning');
      //     });
      //   }
      // };
    }
    // --- End Vue Global Error Handler ---

    appInstance.mount('#app');
    // console.log('Vue app created and mounted, with Sentry error handler, BlockedScreen and Caching logic integrated.'); // Removed for less noise
  } catch (e) {
    console.error('CRITICAL: Error creating or mounting Vue app:', e);
    document.body.innerHTML = `<p style="color: red; text-align: center; font-size: 1.2em; padding: 20px;">Critical Error: Could not initialize the application. Details: ${e.message}</p>`;
  }
});
