// In development mode, we don't need to import these libraries
// import { Client } from 'whatsapp-web.js';
// import qrcode from 'qrcode-terminal';
import otpGenerator from 'otp-generator';

// Map to store active OTPs with userIds
const otpStore = new Map<number, { otp: string, expires: Date }>();

// In development mode, we'll mock the WhatsApp client
console.log('DEVELOPMENT MODE: Using mock WhatsApp client');

// Define a minimal type for our mock client
interface MockWhatsAppClient {
  on: (event: string, callback: any) => MockWhatsAppClient;
  sendMessage: (to: string, message: string) => Promise<any>;
  initialize: () => Promise<void>;
}

// Mock client for development (no puppeteer initialization)
const client: MockWhatsAppClient = {
  on: (event: string, callback: any) => {
    console.log(`DEVELOPMENT MODE: Registering mock event listener for ${event}`);
    return client;
  },
  sendMessage: async (to: string, message: string) => {
    console.log(`DEVELOPMENT MODE: Would send message to ${to}: ${message}`);
    return true;
  },
  initialize: () => {
    console.log('DEVELOPMENT MODE: Mock initialization of WhatsApp client');
    return Promise.resolve();
  }
};

// Initialize the client connection
let clientReady = false;
let initializationPromise: Promise<void> | null = null;

export async function initializeWhatsAppClient(): Promise<void> {
  // In development mode, just pretend it's initialized
  console.log('DEVELOPMENT MODE: Skipping WhatsApp client initialization');
  clientReady = true;
  return Promise.resolve();
  
  // In production, we would use the real implementation:
  /*
  if (clientReady) {
    console.log('WhatsApp client already initialized');
    return;
  }

  if (initializationPromise) {
    console.log('WhatsApp client initialization in progress');
    return initializationPromise;
  }

  console.log('Initializing WhatsApp client...');
  initializationPromise = new Promise((resolve) => {
    client.initialize();
    
    client.on('ready', () => {
      clientReady = true;
      resolve();
    });
  });

  return initializationPromise;
  */
}

// Generate an OTP for a user
export function generateOtp(userId: number): string {
  const otp = otpGenerator.generate(6, { 
    digits: true, 
    upperCaseAlphabets: false, 
    lowerCaseAlphabets: false,
    specialChars: false 
  });
  
  // Store OTP with expiration time (10 minutes)
  const expires = new Date();
  expires.setMinutes(expires.getMinutes() + 10);
  
  otpStore.set(userId, { otp, expires });
  
  return otp;
}

// Verify an OTP for a user
export function verifyOtp(userId: number, otpToVerify: string): boolean {
  const record = otpStore.get(userId);
  
  if (!record) {
    console.log(`No OTP found for user ID ${userId}`);
    return false;
  }
  
  const { otp, expires } = record;
  
  // Check if OTP has expired
  if (new Date() > expires) {
    console.log(`OTP for user ID ${userId} has expired`);
    otpStore.delete(userId);
    return false;
  }
  
  // Check if OTP matches
  if (otp !== otpToVerify) {
    console.log(`OTP mismatch for user ID ${userId}`);
    return false;
  }
  
  // OTP verified successfully, remove it from the store
  console.log(`OTP verified successfully for user ID ${userId}`);
  otpStore.delete(userId);
  return true;
}

// Send OTP via WhatsApp
export async function sendOtpWhatsApp(whatsappNumber: string, otp: string): Promise<boolean> {
  try {
    // During development, just log the OTP instead of trying to send it
    const formattedNumber = formatWhatsAppNumber(whatsappNumber);
    const message = `Your COPO Management System OTP is: ${otp}. Valid for 10 minutes.`;
    
    // Log the OTP for development testing
    console.log('=====================================================');
    console.log(`DEVELOPMENT MODE: Would send to WhatsApp number: ${formattedNumber}`);
    console.log(`OTP MESSAGE: ${message}`);
    console.log('=====================================================');
    
    // Skip actual WhatsApp integration in development
    // In production, we would uncomment and use the real implementation:
    /*
    if (!clientReady) {
      await initializeWhatsAppClient();
    }
    
    const chatId = `${formattedNumber}@c.us`;
    await client.sendMessage(chatId, message);
    */
    
    return true;
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    return false;
  }
}

// Helper to format WhatsApp number properly
function formatWhatsAppNumber(number: string): string {
  // Remove any non-digit characters
  let cleaned = number.replace(/\D/g, '');
  
  // Ensure it starts with country code (default to India +91 if none)
  if (!cleaned.startsWith('91') && cleaned.length === 10) {
    cleaned = '91' + cleaned;
  }
  
  return cleaned;
}

// Export the client for use elsewhere if needed
export { client as whatsappClient };