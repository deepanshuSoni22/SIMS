# WhatsApp Integration Helper Scripts

These scripts help you switch between development and production modes for the WhatsApp integration.

## Usage

### Switch to Production Mode

```bash
node scripts/switch-to-production-whatsapp.js
```

This will:
1. Back up your current development WhatsApp service configuration
2. Replace it with the production version that sends real WhatsApp messages
3. When you restart the application, you'll need to scan a QR code with your WhatsApp phone

### Switch to Development Mode

```bash
node scripts/switch-to-development-whatsapp.js
```

This will:
1. Back up your current WhatsApp service configuration (in case it's production)
2. Restore the development version that mocks WhatsApp functionality
3. OTPs will be logged to the console instead of sent via WhatsApp

## Important Notes

- Make sure to install the required system dependencies before switching to production mode
- See the main DEPLOYMENT.md file for detailed deployment instructions
- The development mode is ideal for testing without requiring WhatsApp authentication
- The production mode requires a phone with WhatsApp to scan the QR code