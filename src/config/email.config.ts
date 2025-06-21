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
}

export const emailConfig: EmailConfig = {
  smtp: {
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER || "",
      pass: process.env.SMTP_PASS || "",
    },
  },
  rateLimits: {
    maxEmailsPerMinute: parseInt(process.env.MAX_EMAILS_PER_MINUTE || "28"),
    maxEmailsPerHour: parseInt(process.env.MAX_EMAILS_PER_HOUR || "1000"),
    maxRetries: parseInt(process.env.MAX_RETRIES || "3"),
  },
  retryPolicy: {
    initialDelay: 1000, // 1 second
    maxDelay: 30000, // 30 seconds
    backoffMultiplier: 2,
  },
  queue: {
    pollingInterval: parseInt(process.env.POLLING_INTERVAL || "5000"),     emptyQueueBackoff: parseInt(process.env.EMPTY_QUEUE_BACKOFF || "10000"), 
    maxConcurrentEmails: parseInt(process.env.MAX_CONCURRENT_EMAILS || "5"),
  },
};
