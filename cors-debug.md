// CORS Debugging Guide
// Your backend CORS config looks correct, but the preflight request is still failing.

// Possible issues:
// 1. Backend not handling OPTIONS requests properly
// 2. Route middleware conflicts
// 3. Headers being modified after CORS

// Quick test - try this in your browser console on localhost:3000:
fetch('https://vikings-osm-event-manager.onrender.com/get-user-roles', {
  method: 'OPTIONS'
}).then(response => {
  console.log('OPTIONS response:', response.status, response.headers);
}).catch(error => {
  console.error('OPTIONS failed:', error);
});

// If this fails, your backend isn't handling OPTIONS requests properly.
// Make sure your backend doesn't have middleware that interferes with CORS preflight.