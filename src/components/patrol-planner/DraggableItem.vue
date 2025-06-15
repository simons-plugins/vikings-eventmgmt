<template>
  <div
    class="draggable-item"
    draggable="true"
    @dragstart="handleDragStart"
  >
    {{ item.name }}
  </div>
</template>

<script>
export default {
  name: 'DraggableItem',
  props: {
    item: {
      type: Object,
      required: true, // Should have id and name
    },
  },
  methods: {
    handleDragStart(event) {
      event.dataTransfer.effectAllowed = 'move';
      // Transfer the item's ID. We use JSON.stringify in case IDs are not strings.
      // Though in our sample data, IDs are strings.
      event.dataTransfer.setData('text/plain', JSON.stringify(this.item.id));
      console.log('Dragging item:', this.item.id); // For debugging
    },
  },
};
</script>

<style scoped>
.draggable-item {
  padding: 10px;
  margin: 5px;
  background-color: #4CAF50; /* Green */
  color: white;
  border: 1px solid #388E3C;
  border-radius: 4px;
  cursor: grab;
  text-align: center;
}

.draggable-item:active {
  cursor: grabbing;
}
</style>
