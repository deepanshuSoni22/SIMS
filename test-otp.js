/**
 * This script tests the OTP functionality by generating and verifying an OTP.
 * It's useful for testing both development and production WhatsApp service configurations.
 */

// Import the required modules based on environment
import('./server/whatsapp-service.ts').then(async (whatsappService) => {
  console.log('Testing WhatsApp OTP Service Configuration:');
  console.log('----------------------------------------');

  // Test user ID (this would normally be from the database)
  const testUserId = 999;
  
  // Test phone number (replace with a valid number for production testing)
  const testPhone = '9876543210';

  // 1. Generate an OTP
  const otp = whatsappService.generateOtp(testUserId);
  console.log(`Generated OTP: ${otp}`);

  // 2. In development mode, the OTP is logged to console
  // In production mode, we'll try to send it via WhatsApp
  try {
    // Only try to send if initializeWhatsAppClient exists (production mode)
    if (typeof whatsappService.initializeWhatsAppClient === 'function') {
      console.log('Detected production WhatsApp service configuration.');
      console.log('Initializing WhatsApp client...');
      
      await whatsappService.initializeWhatsAppClient();
      
      console.log(`Attempting to send OTP to ${testPhone}...`);
      const success = await whatsappService.sendOtpWhatsApp(testPhone, otp);
      
      if (success) {
        console.log('✅ OTP sent successfully via WhatsApp');
      } else {
        console.log('❌ Failed to send OTP via WhatsApp');
        console.log('This is expected in development mode or if WhatsApp is not properly configured.');
      }
    } else {
      console.log('Detected development WhatsApp service configuration.');
      console.log('OTP would be logged to console instead of sent via WhatsApp.');
    }
  } catch (error) {
    console.error('Error during WhatsApp test:', error);
  }

  // 3. Test OTP verification with correct OTP
  const isValid = whatsappService.verifyOtp(testUserId, otp);
  console.log(`Verification with correct OTP: ${isValid ? '✅ Success' : '❌ Failed'}`);

  // 4. Test OTP verification with incorrect OTP
  const isInvalidOtp = whatsappService.verifyOtp(testUserId, '000000');
  console.log(`Verification with incorrect OTP: ${isInvalidOtp ? '⚠️ Unexpected success' : '✅ Failed as expected'}`);

  console.log('----------------------------------------');
  console.log('OTP Test Complete');
});