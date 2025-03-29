/**
 * This script switches the WhatsApp service from development mode to production mode
 */

const fs = require('fs');
const path = require('path');

// Path to files
const activeFile = path.join(__dirname, '../server/whatsapp-service.ts');
const productionFile = path.join(__dirname, '../server/whatsapp-service.production.ts');

// Check if production file exists
if (!fs.existsSync(productionFile)) {
  console.error('Error: Production WhatsApp service file not found.');
  console.error('Expected file at:', productionFile);
  process.exit(1);
}

// Create backup of development file
try {
  const backupFile = path.join(__dirname, '../server/whatsapp-service.dev.ts');
  fs.copyFileSync(activeFile, backupFile);
  console.log('✅ Development WhatsApp service backed up to:', backupFile);
} catch (error) {
  console.error('Error creating backup:', error.message);
  process.exit(1);
}

// Copy production file to active file
try {
  fs.copyFileSync(productionFile, activeFile);
  console.log('✅ Switched to production WhatsApp service');
  console.log('');
  console.log('🔔 IMPORTANT NOTES FOR PRODUCTION MODE:');
  console.log('1. Make sure you have installed the required system dependencies');
  console.log('   (See DEPLOYMENT.md for details)');
  console.log('2. When you start the application, you will need to scan a QR code');
  console.log('   with your WhatsApp phone to authenticate');
  console.log('3. You will need to do this only once; the session will be saved');
  console.log('');
  console.log('To switch back to development mode, run:');
  console.log('node scripts/switch-to-development-whatsapp.js');
} catch (error) {
  console.error('Error switching to production mode:', error.message);
  process.exit(1);
}