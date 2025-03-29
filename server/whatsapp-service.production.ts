/**
 * WhatsApp Service - Production Version
 * 
 * This version connects to the real WhatsApp Web service and sends actual messages.
 * It requires QR code authentication with a physical device.
 */

import { Client, LocalAuth } from 'whatsapp-web.js';
import qrcode from 'qrcode-terminal';
import otpGenerator from 'otp-generator';

// Store OTPs in memory with expiration
const otpStore = new Map<number, { otp: string, expires: Date }>();

// Initialize WhatsApp client
let client: Client;

export async function initializeWhatsAppClient(): Promise<void> {
  // Create a new WhatsApp client instance
  client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
      // Add these args for headless servers, especially in containerized environments
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-extensions'
      ],
      headless: true
    }
  });

  // Event handlers
  client.on('qr', (qr) => {
    console.log('\n\n==================================');
    console.log('SCAN THIS QR CODE WITH YOUR PHONE:');
    console.log('==================================\n\n');
    qrcode.generate(qr, { small: true });
  });

  client.on('ready', () => {
    console.log('WhatsApp client is ready and authenticated!');
    console.log('Password reset OTP service is now operational');
  });

  client.on('authenticated', () => {
    console.log('WhatsApp authentication successful');
  });

  client.on('auth_failure', (msg) => {
    console.error('WhatsApp authentication failed:', msg);
  });

  // Initialize the client
  try {
    await client.initialize();
    return Promise.resolve();
  } catch (error) {
    console.error('Failed to initialize WhatsApp client:', error);
    return Promise.reject(error);
  }
}

/**
 * Generates a 6-digit OTP for the specified user and stores it with a 10-minute expiration
 */
export function generateOtp(userId: number): string {
  // Generate a 6-digit OTP
  const otp = otpGenerator.generate(6, { 
    upperCaseAlphabets: false,
    lowerCaseAlphabets: false,
    specialChars: false,
    digits: true
  });
  
  // Set expiration time (10 minutes from now)
  const expires = new Date();
  expires.setMinutes(expires.getMinutes() + 10);
  
  // Store OTP with expiration
  otpStore.set(userId, { otp, expires });
  
  return otp;
}

/**
 * Verifies the OTP for a specific user
 */
export function verifyOtp(userId: number, otpToVerify: string): boolean {
  const storedOtpData = otpStore.get(userId);
  
  // Check if OTP exists and hasn't expired
  if (!storedOtpData) {
    return false;
  }
  
  const { otp, expires } = storedOtpData;
  const now = new Date();
  
  // Check if OTP is expired
  if (now > expires) {
    // Clean up expired OTP
    otpStore.delete(userId);
    return false;
  }
  
  // Verify OTP
  const isValid = otp === otpToVerify;
  
  // Remove OTP after verification attempt (one-time use)
  if (isValid) {
    otpStore.delete(userId);
  }
  
  return isValid;
}

/**
 * Sends an OTP via WhatsApp to the specified number
 */
export async function sendOtpWhatsApp(whatsappNumber: string, otp: string): Promise<boolean> {
  if (!client || !client.info) {
    console.error('WhatsApp client not initialized or authenticated');
    return false;
  }

  try {
    const formattedNumber = formatWhatsAppNumber(whatsappNumber);
    
    // Message template
    const message = `🔑 *SIMS COPO System Password Reset*\n\n` +
                   `Your one-time password (OTP) is: *${otp}*\n\n` +
                   `This code will expire in 10 minutes.\n` +
                   `Please do not share this code with anyone.`;
    
    // Send the message
    await client.sendMessage(formattedNumber, message);
    console.log(`OTP sent to ${formattedNumber}`);
    return true;
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    return false;
  }
}

/**
 * Formats a phone number for WhatsApp
 * Adds country code if missing and ensures format is correct
 */
function formatWhatsAppNumber(number: string): string {
  // Remove any non-digit characters
  let cleaned = number.replace(/\D/g, '');
  
  // Add country code (91 for India) if not present
  if (!cleaned.startsWith('91') && cleaned.length === 10) {
    cleaned = '91' + cleaned;
  }
  
  // Add the WhatsApp suffix (@c.us)
  return `${cleaned}@c.us`;
}