# Deployment Instructions

## WhatsApp Integration Setup

The application is currently configured to run in development mode with a mock WhatsApp integration. For production deployment, follow these steps:

### Step 1: Install System Dependencies

On Ubuntu/Debian-based systems, install the required dependencies for Puppeteer/Chrome:

```bash
apt-get update
apt-get install -y libgobject-2.0-0 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 libxrandr2 libgbm1 libasound2
```

### Step 2: Replace WhatsApp Service File

Replace the development version with the production version using the provided helper script:

```bash
# Switch to production mode
node scripts/switch-to-production-whatsapp.js
```

To switch back to development mode if needed:

```bash
# Switch back to development mode
node scripts/switch-to-development-whatsapp.js
```

More information about these scripts can be found in `scripts/README.md`.

### Step 3: First Run and QR Code Authentication

When you first run the application in production:

1. The WhatsApp Web client will generate a QR code in the console
2. Scan this QR code with the WhatsApp mobile app from the number you want to use to send OTPs
3. This authentication is required only once; after that, the session will be saved

### Step 4: Database Configuration

Ensure your PostgreSQL database is properly configured and the following environment variables are set:

- `DATABASE_URL`
- `PGUSER`
- `PGPASSWORD`
- `PGDATABASE`
- `PGHOST`
- `PGPORT`

### Step 5: Session Secret

For production, set a strong session secret:

```
SESSION_SECRET=your-strong-random-secret-here
```

### Step 6: Start the Application

Start the application using:

```bash
npm run start
```

## Testing

### Testing WhatsApp OTP Service

You can test the WhatsApp OTP service using the provided test script:

```bash
tsx test-otp.js
```

This script will:
1. Generate a test OTP
2. Attempt to send it via WhatsApp (in production mode) or log it to console (in development mode)
3. Verify the OTP functionality is working

Before testing in production, update the test phone number in the script to a valid number.

## Troubleshooting

### WhatsApp Authentication Issues

If you encounter issues with WhatsApp authentication:

1. Check the console logs for errors
2. Ensure the WhatsApp number is valid and active
3. Verify that all system dependencies are installed
4. If using a headless server, ensure X11 or virtual display is configured correctly

### Puppeteer Chrome Launch Issues

If Puppeteer fails to launch Chrome:

1. Check that all system dependencies are installed
2. Try running with additional flags:

```typescript
const client = new Client({
  puppeteer: {
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--single-process',
      '--disable-gpu'
    ],
    headless: true
  }
});
```

## Security Notes

- In production, OTPs are sent via WhatsApp and not logged to the console
- Ensure your server is secured with HTTPS
- Regularly rotate your session secret
- OTPs expire after 10 minutes for security
- Failed OTP attempts are logged for auditing