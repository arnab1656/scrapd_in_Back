# Email Automation Setup Guide

## Prerequisites

1. **Gmail Account with 2FA Enabled**
2. **Gmail App Password** (not your regular password)
3. **Resume PDF File**
4. **Node.js and npm**

## Step 1: Install Dependencies

```bash
npm install nodemailer @types/nodemailer
```

## Step 2: Gmail Configuration

### Enable 2-Factor Authentication
1. Go to your Google Account settings
2. Enable 2-Factor Authentication
3. This is required for App Passwords

### Generate Gmail App Password
1. Go to Google Account settings
2. Navigate to Security → App passwords
3. Generate a new app password for "Mail"
4. Copy the 16-character password

### Environment Variables
Create a `.env` file in your project root:

```env
# Gmail SMTP Configuration
GMAIL_USER=arnab.paul.1656@gmail.com
GMAIL_APP_PASSWORD=your_16_character_app_password_here

# SMTP Settings (Gmail defaults)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false

# Rate Limiting (Gmail limits)
MAX_EMAILS_PER_MINUTE=28
MAX_EMAILS_PER_HOUR=1000
MAX_RETRIES=3

# Queue Settings
POLLING_INTERVAL=5000
EMPTY_QUEUE_BACKOFF=10000
MAX_CONCURRENT_EMAILS=5
```

## Step 3: Resume Setup

1. Place your resume PDF in the `assets/` directory
2. Name it exactly: `Arnab_Paul_Full_Stack_Resume.pdf`
3. Ensure the file is readable

## Step 4: Test Configuration

### Test SMTP Connection
```typescript
import { EmailTransporterService } from './src/services/email-automation/email-transporter.service';

const transporter = EmailTransporterService.getInstance();
const isConnected = await transporter.verifyConnection();
console.log('SMTP Connection:', isConnected ? 'Success' : 'Failed');
```

### Test Resume Attachment
```typescript
import { AttachmentHandler } from './src/utils/attachment-handler';

const attachmentHandler = AttachmentHandler.getInstance();
const exists = await attachmentHandler.checkResumeExists();
console.log('Resume exists:', exists);
```

## Step 5: Run the System

```bash
# Build the project
npm run build

# Run the email automation
node test-auto-terminate.js
```

## Troubleshooting

### Common Issues

1. **Authentication Failed**
   - Ensure 2FA is enabled
   - Use App Password, not regular password
   - Check Gmail account settings

2. **Resume Not Found**
   - Verify file path: `./assets/Arnab_Paul_Full_Stack_Resume.pdf`
   - Check file permissions
   - Ensure file is not corrupted

3. **Rate Limiting**
   - Gmail limits: 500 emails/day, 20 emails/second
   - Check current usage in Gmail settings
   - Wait if limits are exceeded

4. **SMTP Errors**
   - 421: Service not available
   - 450: Mailbox busy
   - 550: Mailbox not found
   - Check recipient email addresses

## Security Notes

- **Never commit** your `.env` file to version control
- **Use App Passwords** instead of regular passwords
- **Enable 2FA** on your Gmail account
- **Monitor** your Gmail usage regularly

## Features

✅ **Real SMTP Integration** with Gmail  
✅ **Professional HTML Templates**  
✅ **PDF Resume Attachments**  
✅ **Rate Limiting** and error handling  
✅ **Recursive Processing** for immediate email sending  
✅ **Auto-termination** when queue is empty  

## File Structure

```
src/
├── services/email-automation/
│   ├── email-processor.service.ts (updated)
│   ├── email-transporter.service.ts (new)
│   └── queue-poller.service.ts (updated)
├── templates/email-templates/
│   └── job-application.html (new)
├── utils/
│   ├── template-engine.ts (new)
│   └── attachment-handler.ts (new)
├── config/
│   └── email.config.ts (updated)
└── assets/
    └── Arnab_Paul_Full_Stack_Resume.pdf (add your resume)
```

## Next Steps

1. Configure your Gmail credentials
2. Add your resume PDF
3. Test the system
4. Monitor email delivery
5. Adjust rate limits if needed 