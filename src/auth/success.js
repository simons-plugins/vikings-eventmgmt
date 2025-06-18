// src/auth/success.js

// Extract the access token from the URL
const urlParams = new URLSearchParams(window.location.search);
const accessToken = urlParams.get('access_token');

if (accessToken) {
  // Store the token securely in sessionStorage
  sessionStorage.setItem('osm_access_token', accessToken);

  // Redirect the user to the main index.html page
  window.location.href = '../index.html';
} else {
  // Handle the error if no token is found
  const errorMessage = urlParams.get('error') || 'No access token provided';
  document.body.innerHTML = `
    <div style="text-align: center; margin-top: 50px;">
      <h1>Authentication Failed</h1>
      <p>${errorMessage}</p>
      <a href="/login" style="color: blue; text-decoration: underline;">Return to Login</a>
    </div>
  `;
}