<template>
  <div class="drop-zone-wrapper">
    <h3 class="zone-main-title">{{ zoneTitle }}</h3>

    <!-- Unassigned Zone Type -->
    <div
      v-if="zoneType === 'unassigned'"
      class="drop-zone unassigned-items-area"
      @dragover.prevent="handleDragOver"
      @drop.prevent="handleDropUnassigned"
    >
      <div v-if="!unassignedItems || unassignedItems.length === 0" class="empty-zone-placeholder">
        Drop personnel here
      </div>
      <DraggableItem
        v-for="item in unassignedItems"
        :key="item.id"
        :item="item"
      />
    </div>

    <!-- Patrol Zone Type -->
    <div v-if="zoneType === 'patrol'" class="patrol-roles-container">
      <div
        v-for="role in patrolObject.roles"
        :key="role.roleId"
        class="role-drop-zone"
        @dragover.prevent="handleDragOver"
        @drop.prevent="handleDropRole($event, role.roleId)"
      >
        <h4 class="role-title">{{ role.roleName }}</h4>
        <div v-if="getRolePersonnel(role).length === 0" class="empty-role-placeholder">
          Assign {{ role.roleName }}
        </div>
        <DraggableItem
          v-for="personnel in getRolePersonnel(role)"
          :key="personnel.id"
          :item="personnel"
        />
      </div>
    </div>
  </div>
</template>

<script>
import DraggableItem from './DraggableItem.vue';

export default {
  name: 'DropZone',
  components: {
    DraggableItem,
  },
  props: {
    zoneId: { // Patrol ID or 'unassigned'
      type: String,
      required: true,
    },
    zoneTitle: { // Main title for the zone (Patrol Name or "Unassigned")
      type: String,
      required: true,
    },
    zoneType: { // 'patrol' or 'unassigned'
      type: String,
      required: true,
      validator: value => ['patrol', 'unassigned'].includes(value),
    },
    patrolObject: { // Full patrol object, if zoneType is 'patrol'
      type: Object,
      default: null,
    },
    unassignedItems: { // Array of personnel objects, if zoneType is 'unassigned'
      type: Array,
      default: () => [],
    },
    allPersonnel: { // Needed to map IDs to personnel objects for roles in patrols
      type: Array,
      default: () => [],
    }
  },
  methods: {
    handleDragOver(event) {
      event.dataTransfer.dropEffect = 'move';
    },
    handleDropUnassigned(event) {
      const itemId = JSON.parse(event.dataTransfer.getData('text/plain'));
      this.$emit('item-dropped', {
        itemId,
        targetZoneId: 'unassigned', // zoneId prop will be 'unassigned'
        targetRoleId: null,        // No specific role for unassigned
      });
    },
    handleDropRole(event, roleId) {
      const itemId = JSON.parse(event.dataTransfer.getData('text/plain'));
      this.$emit('item-dropped', {
        itemId,
        targetZoneId: this.zoneId, // zoneId prop will be the patrol's ID
        targetRoleId: roleId,
      });
    },
    getRolePersonnel(role) {
      if (!role || !role.assignedPersonnel) return [];
      return role.assignedPersonnel
        .map(personnelId => this.allPersonnel.find(p => p.id === personnelId))
        .filter(p => p); // Filter out any undefined if an ID isn't found
    }
  },
};
</script>

<style scoped>
.drop-zone-wrapper {
  padding: 10px;
  /* background-color: #e0e0e0; Replaced by specific zone styles from PlannerBoard */
  border-radius: 6px;
  /* min-height: 100px; Removed to allow natural height based on content */
}

.zone-main-title {
  margin-top: 0;
  margin-bottom: 15px;
  font-size: 1.3em;
  color: #333;
  text-align: center;
  font-weight: bold;
}

.drop-zone { /* Common class for actual drop areas, like unassigned-items-area */
  padding: 10px;
  border: 2px dashed #bdbdbd;
  border-radius: 4px;
  min-height: 80px; /* Minimum height for visibility */
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.unassigned-items-area {
  /* Specific styles for unassigned can go here or be controlled by PlannerBoard's class */
}

.patrol-roles-container {
  display: flex;
  flex-direction: column;
  gap: 15px; /* Space between roles */
}

.role-drop-zone {
  padding: 10px;
  background-color: rgba(0, 0, 0, 0.03); /* Slightly different background for role areas */
  border: 1px dashed #a0a0a0;
  border-radius: 4px;
  min-height: 70px; /* Min height for a role area */
}

.role-title {
  margin-top: 0;
  margin-bottom: 8px;
  font-size: 1em;
  font-weight: bold;
  color: #555;
}

.empty-zone-placeholder, .empty-role-placeholder {
  color: #757575;
  font-style: italic;
  text-align: center;
  padding: 15px 0;
  font-size: 0.9em;
}
</style>
