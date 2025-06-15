import { createApp } from 'vue';
import App from './components/patrol-planner/App.vue';

let vueAppInstance = null;

export function mountVueApp() {
  const targetElement = document.getElementById('vue-app');

  if (targetElement && !targetElement.hasAttribute('data-v-app')) { // Check if element exists and not already mounted by Vue
    vueAppInstance = createApp(App);
    vueAppInstance.mount('#vue-app');
    console.log('Vue app mounted successfully to #vue-app.');
  } else if (!targetElement) {
    console.warn('#vue-app element not found in the DOM for mounting.');
  } else if (targetElement.hasAttribute('data-v-app')) {
    console.log('Vue app already mounted to #vue-app.');
  }
}

// Remove the automatic DOMContentLoaded mounting
// document.addEventListener('DOMContentLoaded', () => {
//   mountVueApp(); // Or some other initial call if needed, but now it's controlled externally.
// });
