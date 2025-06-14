// src/components/RateLimitIndicator.js

const RateLimitIndicator = {
  setup() {
    const { ref, onMounted, onUnmounted, computed } = Vue; // Moved destructuring here
    /** @type {import('vue').Ref<import('../types').RateLimitStatus | null>} */
    const rateLimitInfo = ref(null);
    /** @type {import('vue').Ref<string | null>} */
    const error = ref(null);
    /** @type {number | null} */
    let intervalId = null;

    const fetchData = async () => {
      try {
        if (window.API_FUNCTIONS && window.API_FUNCTIONS.checkRateLimitStatus) {
          const status = await window.API_FUNCTIONS.checkRateLimitStatus();
          if (status) {
            rateLimitInfo.value = status;
            error.value = null;
          } else {
            rateLimitInfo.value = null;
            // error.value = 'Rate limit data not available from API.'; // Optional: show a soft error
          }
        } else {
          error.value = 'API for rate limit status not found.';
        }
      } catch (e) {
        console.error('RateLimitIndicator: Error fetching rate limit status:', e);
        error.value = 'Failed to fetch rate limit status.';
        rateLimitInfo.value = null;
      }
    };

    onMounted(() => {
      fetchData();
      intervalId = setInterval(fetchData, 30000);
    });

    onUnmounted(() => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    });

    /** @type {import('vue').ComputedRef<import('../types').RateLimitDetail | null | undefined>} */
    const osmStatus = computed(() => rateLimitInfo.value?.osm);
    /** @type {import('vue').ComputedRef<import('../types').RateLimitDetail | null | undefined>} */
    const backendStatus = computed(() => rateLimitInfo.value?.backend);

    /** @type {import('vue').ComputedRef<{text: string, class: string, percent: number}>} */
    const osmDisplay = computed(() => {
      if (!osmStatus.value) return { text: 'OSM: N/A', class: 'text-muted', percent: 0 };
      const { limit, remaining, rateLimited, available } = osmStatus.value;
      if (limit === null || typeof limit === 'undefined') {
          return { text: `OSM: Proxied`, class: 'text-info', percent: 0};
      }
      const percent = limit > 0 ? ((limit - remaining) / limit * 100) : 0;
      let textClass = 'text-success';
      if (rateLimited || (typeof available !== 'undefined' && !available)) textClass = 'text-danger fw-bold'; // Check available if present
      else if (percent > 90) textClass = 'text-danger';
      else if (percent > 70) textClass = 'text-warning';

      return {
        text: `OSM: ${remaining}/${limit} (${percent.toFixed(0)}%)`,
        class: textClass,
        percent: percent
      };
    });

    /** @type {import('vue').ComputedRef<{text: string, class: string, percent: number}>} */
    const backendDisplay = computed(() => {
      if (!backendStatus.value) return { text: 'Backend: N/A', class: 'text-muted', percent: 0 };
      const { limit, remaining } = backendStatus.value;
      const percent = limit > 0 ? ((limit - remaining) / limit * 100) : 0;
      let textClass = 'text-success';
      if (percent > 90) textClass = 'text-danger';
      else if (percent > 70) textClass = 'text-warning';
      return {
        text: `Backend: ${remaining}/${limit} (${percent.toFixed(0)}%)`,
        class: textClass,
        percent: percent
      };
    });

    return {
      osmDisplay,
      backendDisplay,
      error,
      // rateLimitInfo // For debugging in template if needed
    };
  },
  template: `
    <div style="position: fixed; bottom: 10px; right: 10px; background: rgba(255, 255, 255, 0.95); border: 1px solid #dee2e6; border-radius: .25rem; padding: .5rem .75rem; font-size: 0.8rem; box-shadow: 0 .125rem .25rem rgba(0,0,0,.075); z-index: 1100;">
      <div v-if="error" class="text-danger small">
        <i class="fas fa-exclamation-circle me-1"></i>{{ error }}
      </div>
      <div v-else class="d-flex flex-column">
        <div :class="osmDisplay.class" :title="'OSM API Usage: ' + osmDisplay.percent.toFixed(1) + '%'">
          <i class="fas fa-shield-alt me-1"></i> {{ osmDisplay.text }}
        </div>
        <div :class="backendDisplay.class" :title="'Backend API Usage: ' + backendDisplay.percent.toFixed(1) + '%'" class="mt-1">
          <i class="fas fa-server me-1"></i> {{ backendDisplay.text }}
        </div>
      </div>
    </div>
  `
};
if (typeof window.VUE_COMPONENTS === 'undefined') { window.VUE_COMPONENTS = {}; }
window.VUE_COMPONENTS.RateLimitIndicator = RateLimitIndicator;
console.log('RateLimitIndicator.js executed and registered');
