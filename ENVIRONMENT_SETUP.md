# Environment Setup

This document explains how to set up environment variables for the scrapd_in_Back project.

## 📦 Dependencies

The project uses `dotenv` package to load environment variables from `.env` files. This is automatically configured in `src/index.ts`.

## 🔐 Required Environment Variables

### 1. Create `.env` file
Copy the example file and fill in your values:
```bash
cp env.example .env
```

### 2. Email Configuration (Required)
```env
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-app-password
```

**How to get Gmail App Password:**
1. Go to your Google Account settings
2. Enable 2-Factor Authentication
3. Go to Security → App passwords
4. Generate a new app password for "Mail"
5. Use this password in `GMAIL_APP_PASSWORD`

### 3. Database Configuration
```env
DATABASE_URL="postgresql://username:password@localhost:5432/database_name"
```

### 4. Optional Configuration
```env
# SMTP Settings (defaults to Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false

# Rate Limits
MAX_EMAILS_PER_MINUTE=28
MAX_EMAILS_PER_HOUR=1000
MAX_RETRIES=3

# Queue Settings
POLLING_INTERVAL=5000
EMPTY_QUEUE_BACKOFF=10000
MAX_CONCURRENT_EMAILS=5
```

## 🚀 Quick Setup

1. **Copy example file:**
   ```bash
   cp env.example .env
   ```

2. **Edit `.env` file:**
   ```bash
   nano .env  # or use your preferred editor
   ```

3. **Fill in your values:**
   - `GMAIL_USER`: Your Gmail address
   - `GMAIL_APP_PASSWORD`: Your Gmail app password
   - `DATABASE_URL`: Your PostgreSQL connection string

4. **Test configuration:**
   ```bash
   npm run dev
   ```

## 🔒 Security Notes

- ✅ **Never commit `.env` file** to version control
- ✅ **Use app passwords** instead of your main Gmail password
- ✅ **Keep credentials secure** and rotate them regularly
- ✅ **Use different credentials** for development and production

## 🐛 Troubleshooting

### "Missing required environment variables" error
Make sure your `.env` file exists and contains:
```env
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-app-password
```

### Gmail authentication issues
1. Check if 2-Factor Authentication is enabled
2. Verify you're using an app password, not your main password
3. Ensure the email address is correct

### Database connection issues
1. Verify your PostgreSQL server is running
2. Check the connection string format
3. Ensure the database exists and is accessible 