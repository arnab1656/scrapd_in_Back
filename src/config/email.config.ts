export interface EmailConfig {
  smtp: {
    host: string;
    port: number;
    secure: boolean;
    auth: {
      user: string;
      pass: string;
    };
  };
  rateLimits: {
    maxEmailsPerMinute: number;
    maxEmailsPerHour: number;
    maxRetries: number;
  };
  retryPolicy: {
    initialDelay: number;
    maxDelay: number;
    backoffMultiplier: number;
  };
  queue: {
    pollingInterval: number;
    emptyQueueBackoff: number;
    maxConcurrentEmails: number;
  };
  templates: {
    coldEmail: {
      subject: string;
      templateName: string;
    };
  };
  attachments: {
    resume: {
      filename: string;
      path: string;
    };
  };
}

// Validate required environment variables
if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
  console.warn(
    '⚠️  WARNING: Missing Gmail credentials in environment variables'
  );
  console.warn('   - GMAIL_USER: Your Gmail address');
  console.warn('   - GMAIL_APP_PASSWORD: Your Gmail app password');
  console.warn(
    '   Email functionality will not work without these credentials'
  );
  console.warn('   Please set these in your .env file for full functionality');
  // Don't exit, just warn
}

export const emailConfig: EmailConfig = {
  smtp: {
    host: process.env.SMTP_HOST || '',
    port: parseInt(process.env.SMTP_PORT || ''),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.GMAIL_USER || '',
      pass: process.env.GMAIL_APP_PASSWORD || '',
    },
  },
  rateLimits: {
    maxEmailsPerMinute: 28,
    maxEmailsPerHour: 1000,
    maxRetries: 3,
  },
  retryPolicy: {
    initialDelay: 1000,
    maxDelay: 30000,
    backoffMultiplier: 2,
  },
  queue: {
    pollingInterval: 5000,
    emptyQueueBackoff: 10000,
    maxConcurrentEmails: 5,
  },
  templates: {
    coldEmail: {
      subject: 'Full Stack Developer Engineer | {authorName}',
      templateName: 'cold-email',
    },
  },
  attachments: {
    resume: {
      filename: 'Arnab_Paul_Full_Stack_Resume.pdf',
      path: './assets/Arnab_Paul_Full_Stack_Resume.pdf',
    },
  },
};
