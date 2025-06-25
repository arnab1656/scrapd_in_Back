import { PrismaService } from '../../lib/prisma';
import {
  EmailStatus,
  EmailProcessingResult,
  EmailError,
  EmailErrorType,
} from '../../types/email.types';
import { RateLimiter } from '../../utils/rate.limiter';
import { BackoffStrategy } from '../../utils/backoff.strategy';

const prisma = PrismaService.getInstance().getClient();

export class StatusManagerService {
  private static instance: StatusManagerService;
  private rateLimiter: RateLimiter;
  private backoffStrategy: BackoffStrategy;

  private constructor() {
    this.rateLimiter = RateLimiter.getInstance();
    this.backoffStrategy = BackoffStrategy.getInstance();
  }

  public static getInstance(): StatusManagerService {
    if (!StatusManagerService.instance) {
      StatusManagerService.instance = new StatusManagerService();
    }
    return StatusManagerService.instance;
  }

  public async checkEmailStatus(
    contentId: number,
    emailId: number
  ): Promise<EmailStatus> {
    try {
      const contentEmail = await prisma.contentEmail.findUnique({
        where: {
          contentId_emailId: {
            contentId,
            emailId,
          },
        },
      });

      if (!contentEmail) {
        throw new Error(
          `ContentEmail relationship not found for content ${contentId} and email ${emailId}`
        );
      }

      return {
        contentId,
        emailId,
        isEmailSent: contentEmail.isEmailSent,
        sentAt: contentEmail.sentAt || undefined,
        retryCount: 0, // We'll need to add this field to the schema
        lastError: undefined,
      };
    } catch (error) {
      console.error('Error checking email status:', error);
      throw error;
    }
  }

  public async updateEmailStatus(result: EmailProcessingResult): Promise<void> {
    try {
      // Rate limit is already checked in QueuePollerService, so we don't need to wait here
      // await this.rateLimiter.waitForRateLimit();

      if (result.success) {
        await prisma.contentEmail.update({
          where: {
            contentId_emailId: {
              contentId: result.contentId,
              emailId: result.emailId,
            },
          },
          data: {
            isEmailSent: true,
            sentAt: result.sentAt || new Date(),
          },
        });

        this.rateLimiter.recordEmailSent();
        this.backoffStrategy.reset();

        console.log(
          `Email status updated successfully for content ${result.contentId} and email ${result.emailId}`
        );
      } else {
        // Handle failure - increment retry count or mark as failed
        await this.handleEmailFailure(
          result.contentId,
          result.emailId,
          result.error
        );
      }
    } catch (error) {
      console.error('Error updating email status:', error);
      throw error;
    }
  }

  public async handleEmailFailure(
    contentId: number,
    emailId: number,
    error?: string
  ): Promise<void> {
    try {
      const emailError: EmailError = {
        type: this.determineErrorType(error),
        message: error || 'Unknown error',
        retryable: this.isRetryableError(error),
        timestamp: new Date(),
      };

      if (this.backoffStrategy.shouldRetry() && emailError.retryable) {
        // Increment retry count and continue
        console.log(
          `Email failed, will retry. Content: ${contentId}, Email: ${emailId}, Error: ${error}`
        );
        // Note: We need to add retryCount field to ContentEmail table
      } else {
        // Mark as permanently failed
        console.log(
          `Email permanently failed. Content: ${contentId}, Email: ${emailId}, Error: ${error}`
        );
        // Note: We might want to add a failed status field to ContentEmail table
      }
    } catch (error) {
      console.error('Error handling email failure:', error);
      throw error;
    }
  }

  private determineErrorType(error?: string): EmailErrorType {
    if (!error) return EmailErrorType.DATABASE_ERROR;

    if (error.includes('SMTP') || error.includes('smtp')) {
      return EmailErrorType.SMTP_ERROR;
    }
    if (error.includes('rate limit') || error.includes('throttle')) {
      return EmailErrorType.RATE_LIMIT_EXCEEDED;
    }
    if (error.includes('invalid') || error.includes('email')) {
      return EmailErrorType.INVALID_EMAIL;
    }
    if (error.includes('content') || error.includes('not found')) {
      return EmailErrorType.CONTENT_NOT_FOUND;
    }
    if (error.includes('queue')) {
      return EmailErrorType.QUEUE_ERROR;
    }

    return EmailErrorType.DATABASE_ERROR;
  }

  private isRetryableError(error?: string): boolean {
    if (!error) return false;

    const retryableErrors = [
      'SMTP_ERROR',
      'RATE_LIMIT_EXCEEDED',
      'QUEUE_ERROR',
    ];

    return retryableErrors.some(
      retryableError =>
        error.includes(retryableError) ||
        error.includes('timeout') ||
        error.includes('connection')
    );
  }

  public async getEmailStatus(
    contentId: number,
    emailId: number
  ): Promise<EmailStatus | null> {
    try {
      return await this.checkEmailStatus(contentId, emailId);
    } catch (error) {
      console.error('Error getting email status:', error);
      return null;
    }
  }
}
