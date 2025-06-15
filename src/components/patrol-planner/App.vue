<template>
  <div id="app-vue-container">
    <PlannerBoard />
  </div>
</template>

<script>
import PlannerBoard from './PlannerBoard.vue';

export default {
  name: 'App',
  components: {
    PlannerBoard,
  },
};
</script>

<style>
/* Global styles or styles affecting the overall app layout */
body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  margin: 0;
  background-color: #e9ecef; /* Light grey background for the page */
  color: #333;
}

#app-vue-container {
  padding: 20px;
  max-width: 1200px; /* Max width for the planner board container */
  margin: 20px auto; /* Centering the content */
  background-color: #ffffff; /* White background for the app container */
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
}

/*
   The 'scoped' attribute was removed from the original App.vue style block.
   If these styles are intended to be global for the Vue part of the application,
   this is fine. If they were meant to be scoped only to App.vue,
   then specific classes/IDs should be used, or 'scoped' should be re-added
   if this component had its own distinct template elements to style.
   Given PlannerBoard is now the main content, these global styles are reasonable.
*/
</style>
