import { Client } from 'whatsapp-web.js';
import qrcode from 'qrcode-terminal';
import otpGenerator from 'otp-generator';

// Map to store active OTPs with userIds
const otpStore = new Map<number, { otp: string, expires: Date }>();

// Initialize WhatsApp client
const client = new Client({
  puppeteer: {
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  }
});

// If we need to authenticate with a QR code
client.on('qr', (qr) => {
  console.log('QR RECEIVED. Scan with WhatsApp mobile app:');
  qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
  console.log('WhatsApp client is ready and connected!');
});

client.on('message', async (message) => {
  console.log(`Message received: ${message.body}`);
});

// Initialize the client connection
let clientReady = false;
let initializationPromise: Promise<void> | null = null;

export async function initializeWhatsAppClient(): Promise<void> {
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
}

// Generate an OTP for a user
export function generateOtp(userId: number): string {
  const otp = otpGenerator(6, { 
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
    if (!clientReady) {
      await initializeWhatsAppClient();
    }
    
    // Format WhatsApp number (ensure it includes country code)
    const formattedNumber = formatWhatsAppNumber(whatsappNumber);
    
    // Message template
    const message = `Your COPO Management System OTP is: ${otp}. Valid for 10 minutes.`;
    
    // Send the message
    const chatId = `${formattedNumber}@c.us`;
    await client.sendMessage(chatId, message);
    
    console.log(`OTP sent to WhatsApp number: ${formattedNumber}`);
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