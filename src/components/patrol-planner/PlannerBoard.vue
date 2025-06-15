<template>
  <div class="planner-board">
    <h2>Patrol Planner</h2>
    <div class="zones-container">
      <DropZone
        zone-id="unassigned"
        zone-title="Unassigned Personnel"
        zone-type="unassigned"
        :unassigned-items="unassignedPersonnel"
        @item-dropped="handleItemDrop"
        class="unassigned-zone"
      />
      <div class="patrol-zones-container">
        <DropZone
          v-for="patrol in patrols"
          :key="patrol.id"
          :zone-id="patrol.id"
          :zone-title="patrol.name"
          zone-type="patrol"
          :patrol-object="patrol"
          :all-personnel="personnel"
          @item-dropped="handleItemDrop"
          class="patrol-zone"
        />
      </div>
    </div>
  </div>
</template>

<script>
import DropZone from './DropZone.vue';

export default {
  name: 'PlannerBoard',
  components: {
    DropZone,
  },
  data() {
    return {
      personnel: [
        { id: 'p1', name: 'Alice' },
        { id: 'p2', name: 'Bob' },
        { id: 'p3', name: 'Charlie' },
        { id: 'p4', name: 'Diana' },
        { id: 'p5', name: 'Edward' },
        { id: 'p6', name: 'Fiona' },
      ],
      patrols: [
        {
          id: 'patrol1',
          name: 'Alpha Patrol',
          roles: [
            { roleId: 'alpha_driver', roleName: 'Driver', assignedPersonnel: [] },
            { roleId: 'alpha_observer', roleName: 'Observer', assignedPersonnel: ['p1'] }
          ]
        },
        {
          id: 'patrol2',
          name: 'Bravo Patrol',
          roles: [
            { roleId: 'bravo_comms', roleName: 'Comms', assignedPersonnel: [] },
            { roleId: 'bravo_medic', roleName: 'Medic', assignedPersonnel: [] }
          ]
        },
        {
          id: 'patrol3',
          name: 'Charlie Patrol',
          roles: [
            { roleId: 'charlie_leader', roleName: 'Leader', assignedPersonnel: ['p5'] },
            { roleId: 'charlie_scout', roleName: 'Scout', assignedPersonnel: [] }
          ]
        }
      ],
      unassignedPersonnelIds: ['p2', 'p3', 'p4', 'p6'], // p1, p5 are initially assigned
    };
  },
  computed: {
    unassignedPersonnel() {
      return this.unassignedPersonnelIds
        .map(id => this.personnel.find(p => p.id === id))
        .filter(p => p);
    }
  },
  methods: {
    handleItemDrop({ itemId, targetZoneId, targetRoleId }) {
      console.log(`PlannerBoard: Item ${itemId} dropped on zone ${targetZoneId}, role ${targetRoleId}`);

      // 1. Remove from source
      // Check unassigned list first
      const unassignedIndex = this.unassignedPersonnelIds.indexOf(itemId);
      if (unassignedIndex > -1) {
        this.unassignedPersonnelIds.splice(unassignedIndex, 1);
        console.log(`Removed ${itemId} from unassigned.`);
      } else {
        // Check all patrols and their roles
        for (const patrol of this.patrols) {
          for (const role of patrol.roles) {
            const itemIndexInRole = role.assignedPersonnel.indexOf(itemId);
            if (itemIndexInRole > -1) {
              role.assignedPersonnel.splice(itemIndexInRole, 1);
              console.log(`Removed ${itemId} from patrol ${patrol.id}, role ${role.roleId}.`);
              // Assuming a person can only be in one role at a time, we can break here
              break;
            }
          }
        }
      }

      // 2. Add to destination
      if (targetZoneId === 'unassigned') {
        if (!this.unassignedPersonnelIds.includes(itemId)) {
          this.unassignedPersonnelIds.push(itemId);
          console.log(`Added ${itemId} to unassigned.`);
        }
      } else { // Target is a patrol role
        const targetPatrol = this.patrols.find(p => p.id === targetZoneId);
        if (targetPatrol) {
          const targetRole = targetPatrol.roles.find(r => r.roleId === targetRoleId);
          if (targetRole) {
            if (!targetRole.assignedPersonnel.includes(itemId)) {
              targetRole.assignedPersonnel.push(itemId);
              console.log(`Added ${itemId} to patrol ${targetZoneId}, role ${targetRoleId}.`);
            }
          } else {
            console.error(`Target role ${targetRoleId} not found in patrol ${targetZoneId}.`);
          }
        } else {
          console.error(`Target patrol ${targetZoneId} not found.`);
        }
      }
    }
  }
};
</script>

<style scoped>
.planner-board {
  padding: 20px;
  background-color: #f4f7f6;
  border-radius: 8px;
  font-family: Arial, sans-serif;
}

.planner-board h2 {
    text-align: center;
    color: #333;
}

.zones-container {
  display: flex;
  gap: 20px;
  margin-top: 20px;
}

.unassigned-zone {
  flex: 1;
  border: 2px solid #FFB74D; /* Orange border for unassigned */
  background-color: #FFF3E0; /* Light orange background */
}

.patrol-zones {
  flex: 3;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.patrol-zone {
   border: 2px solid #81C784; /* Green border for patrol zones */
   background-color: #E8F5E9; /* Light green background */
}

/* Additional styling for DropZone and DraggableItem can be in their respective files or a global style */
</style>
