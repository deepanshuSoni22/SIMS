/**
 * This script switches the WhatsApp service from production mode to development mode
 */

const fs = require('fs');
const path = require('path');

// Path to files
const devFile = path.join(__dirname, '../server/whatsapp-service.ts');
const backupFile = path.join(__dirname, '../server/whatsapp-service.dev.ts');

// Check if backup file exists
if (!fs.existsSync(backupFile)) {
  console.error('Error: Development WhatsApp service backup not found.');
  console.error('Expected file at:', backupFile);
  console.error('You may need to create or restore the development version manually.');
  process.exit(1);
}

// Create backup of current file (in case it's production)
try {
  const tempBackup = path.join(__dirname, '../server/whatsapp-service.prod.backup.ts');
  fs.copyFileSync(devFile, tempBackup);
  console.log('✅ Current WhatsApp service backed up to:', tempBackup);
} catch (error) {
  console.error('Error creating temporary backup:', error.message);
  // Continue anyway
}

// Copy development file to active file
try {
  fs.copyFileSync(backupFile, devFile);
  console.log('✅ Switched to development WhatsApp service');
  console.log('');
  console.log('🔔 DEVELOPMENT MODE:');
  console.log('1. WhatsApp integration is now mocked');
  console.log('2. OTPs will be logged to the console instead of sent via WhatsApp');
  console.log('3. No QR code scanning is required');
} catch (error) {
  console.error('Error switching to development mode:', error.message);
  process.exit(1);
}