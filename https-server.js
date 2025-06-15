// https-server.js
// This script sets up a local development server using Express.
// It serves static files from the 'src' directory and supports HTTPS if configured
// via environment variables and corresponding SSL certificate files.

import 'dotenv/config'; // Loads environment variables from a .env file into process.env.
import https from 'https'; // Node.js module for HTTPS.
import fs from 'fs'; // Node.js module for file system operations.
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url'; // Utility to convert a file URL to a path.

// Replicates __filename and __dirname behavior in ES modules.
// __filename is the absolute path to the current module file.
// __dirname is the absolute path to the directory containing the current module file.
// This is a common pattern as these variables are not available by default in ES modules.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express(); // Initialize an Express application.

// Serve static files (HTML, CSS, JS, images, etc.) from the 'src' directory.
// path.join ensures platform-independent path construction.
app.use(express.static(path.join(__dirname, 'src')));

// Configure the server port.
// It uses the PORT environment variable if set, otherwise defaults to 3000.
const PORT = process.env.PORT || 3000;

// Determine whether to use HTTPS.
// Controlled by the USE_HTTPS environment variable. If 'true', HTTPS is enabled.
// Defaults to false (HTTP) if the variable is not set or not 'true'.
const USE_HTTPS = process.env.USE_HTTPS === 'true';

// Debug output for current server configuration.
console.log('Server Configuration:');
console.log('PORT:', PORT);
console.log('USE_HTTPS:', USE_HTTPS);
// console.log('process.env.USE_HTTPS (raw):', process.env.USE_HTTPS); // Raw value for debugging

// Check if HTTPS should be used.
if (USE_HTTPS) {
  try {
    // Attempt to read SSL certificate and key files.
    // These files (localhost-key.pem and localhost.pem) are expected to be in the root directory.
    // For production, use valid certificates from a Certificate Authority.
    const httpsOptions = {
      key: fs.readFileSync('./localhost-key.pem'), // Private key for the SSL certificate.
      cert: fs.readFileSync('./localhost.pem')    // SSL certificate.
    };
    
    // Create and start an HTTPS server using the provided SSL credentials and Express app.
    https.createServer(httpsOptions, app).listen(PORT, () => {
      console.log(`✅ HTTPS server running at https://localhost:${PORT}`);
    });
  } catch (error) {
    // Handle errors during HTTPS setup, typically due to missing certificate files.
    console.error('❌ HTTPS setup failed:', error.message);
    console.log('❗ Ensure SSL certificate files are present in the root directory:');
    console.log('  - localhost-key.pem (Private Key)');
    console.log('  - localhost.pem (Certificate)');
    console.log('👉 To run with HTTP instead, set USE_HTTPS=false in your .env file or environment.');
    process.exit(1); // Exit the process if HTTPS setup fails.
  }
} else {
  // Start a simple HTTP server if USE_HTTPS is false.
  app.listen(PORT, () => {
    console.log(`✅ HTTP server running at http://localhost:${PORT}`);
  });
}