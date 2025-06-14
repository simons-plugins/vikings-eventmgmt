// src/components/BlockedScreen.js
const BlockedScreen = {
  props: {
    adminOverrideEnabled: { type: Boolean, default: true } // To allow showing the clear button
  },
  emits: ['clear-block'],
  setup(props, { emit }) {
    const handleClearBlock = () => {
      if (confirm('Admin: Clear blocked status? Only do this if the administrator has resolved the underlying issue with OSM.')) {
         /**
          * Emitted when the admin attempts to clear the blocked status.
          * @event clear-block
          */
        emit('clear-block');
      }
    };
    return { handleClearBlock };
  },
  template: `
    <div class="container text-center p-5 mt-5">
      <div class="card shadow border-danger mb-4">
        <div class="card-header bg-danger text-white">
          <h3 class="mb-0"><i class="fas fa-shield-alt me-2"></i>CRITICAL ERROR: API Access Blocked</h3>
        </div>
        <div class="card-body text-center p-4">
          <div class="alert alert-danger mb-4">
            <h4 class="alert-heading">Access Denied!</h4>
            <p class="mb-0">
              This application has been <strong>blocked by Online Scout Manager</strong>
              and can no longer access OSM data.
            </p>
          </div>
          <div class="mb-4">
            <i class="fas fa-ban text-danger" style="font-size: 4rem;"></i>
          </div>
          <h5 class="text-danger mb-3">Application Suspended</h5>
          <p class="text-muted mb-4">
            All API functionality has been disabled.
            <strong>Please contact the system administrator immediately.</strong>
          </p>
          <button v-if="adminOverrideEnabled" @click="handleClearBlock" class="btn btn-warning btn-sm mt-3">
            <i class="fas fa-exclamation-triangle me-2"></i>Admin: Attempt to Clear Blocked Status
          </button>
        </div>
      </div>
    </div>
  `
};
if (typeof window.VUE_COMPONENTS === 'undefined') { window.VUE_COMPONENTS = {}; }
window.VUE_COMPONENTS.BlockedScreen = BlockedScreen;
