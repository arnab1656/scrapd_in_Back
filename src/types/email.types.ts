export interface EmailContent {
  contentId: number;
  emailId: number;
  content: string;
  email: string;
  authorName: string | null;
}

export interface EmailStatus {
  contentId: number;
  emailId: number;
  isEmailSent: boolean;
  sentAt?: Date;
  retryCount: number;
  lastError?: string;
}

export interface QueueItem {
  contentId: number;
  emailId: number;
}

export interface EmailProcessingResult {
  success: boolean;
  contentId: number;
  emailId: number;
  error?: string;
  sentAt?: Date;
}

export interface RateLimitStatus {
  emailsSentThisMinute: number;
  emailsSentThisHour: number;
  canSend: boolean;
  nextAvailableTime?: Date;
}

export interface BackoffStatus {
  currentDelay: number;
  maxDelay: number;
  attemptCount: number;
  nextAttemptTime: Date;
}

export interface PollingStatus {
  isPolling: boolean;
  lastPollTime?: Date;
  queueLength: number;
  processingCount: number;
}

// New types for auto-terminate architecture
export enum PollingResult {
  COMPLETED = 'COMPLETED',
  STOPPED = 'STOPPED',
  ERROR = 'ERROR',
}

export interface PollingCompletion {
  status: PollingResult;
  message: string;
  processedCount: number;
  error?: string;
  duration: number;
  startTime: Date;
  endTime: Date;
}

export enum EmailErrorType {
  SMTP_ERROR = 'SMTP_ERROR',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  INVALID_EMAIL = 'INVALID_EMAIL',
  CONTENT_NOT_FOUND = 'CONTENT_NOT_FOUND',
  DATABASE_ERROR = 'DATABASE_ERROR',
  QUEUE_ERROR = 'QUEUE_ERROR',
}

export interface EmailError {
  type: EmailErrorType;
  message: string;
  retryable: boolean;
  timestamp: Date;
}
