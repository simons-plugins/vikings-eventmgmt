#!/usr/bin/env node

import crypto from 'crypto';
import https from 'https';
import tls from 'tls';

console.log('Node.js SSL Environment Test');
console.log('============================');

// Check Node version
console.log('Node Version:', process.version);
console.log('Platform:', process.platform);
console.log('Architecture:', process.arch);

// Check SSL/TLS support
try {
  console.log('\n✅ Core SSL modules loaded successfully');
  console.log('TLS Version:', tls.DEFAULT_MAX_VERSION);
  console.log('Available Ciphers:', crypto.getCiphers().length);
  
  // Test certificate creation
  const cert = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
  });
  console.log('✅ Can generate key pairs');
  
} catch (error) {
  console.error('❌ SSL Environment Error:', error.message);
}

// Check environment variables
console.log('\nEnvironment Variables:');
console.log('NODE_OPTIONS:', process.env.NODE_OPTIONS || 'not set');
console.log('NODE_TLS_REJECT_UNAUTHORIZED:', process.env.NODE_TLS_REJECT_UNAUTHORIZED || 'not set');
console.log('OPENSSL_CONF:', process.env.OPENSSL_CONF || 'not set');

// Check OpenSSL info
try {
  console.log('\nOpenSSL Version:', process.versions.openssl);
} catch (error) {
  console.error('❌ OpenSSL Error:', error.message);
}