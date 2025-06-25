import { RedisQueueOperations } from '../../queue/redis/queue.operations';
import { EmailProcessorService } from './email-processor.service';
import { RateLimiter } from '../../utils/rate.limiter';
import { BackoffStrategy } from '../../utils/backoff.strategy';
import {
  PollingStatus,
  QueueItem,
  PollingCompletion,
  PollingResult,
} from '../../types/email.types';
import { emailConfig } from '../../config/email.config';

export class QueuePollerService {
  private static instance: QueuePollerService;
  private queueOperations: RedisQueueOperations;
  private emailProcessor: EmailProcessorService;
  private rateLimiter: RateLimiter;
  private backoffStrategy: BackoffStrategy;

  private isPolling: boolean = false;
  private lastPollTime?: Date;
  private processingCount: number = 0;
  private shouldStop: boolean = false;

  // Auto-terminate tracking
  private emptyQueueCount: number = 0;
  private processedCount: number = 0;
  private startTime?: Date;
  private readonly EMPTY_QUEUE_THRESHOLD = 3;

  private constructor() {
    this.queueOperations = RedisQueueOperations.getInstance();
    this.emailProcessor = EmailProcessorService.getInstance();
    this.rateLimiter = RateLimiter.getInstance();
    this.backoffStrategy = BackoffStrategy.getInstance();
  }

  public static getInstance(): QueuePollerService {
    if (!QueuePollerService.instance) {
      QueuePollerService.instance = new QueuePollerService();
    }
    return QueuePollerService.instance;
  }

  public async startPolling(): Promise<PollingCompletion> {
    if (this.isPolling) {
      console.log('Queue poller is already running');
      return {
        status: PollingResult.ERROR,
        message: 'Queue poller is already running',
        processedCount: 0,
        error: 'Already running',
        duration: 0,
        startTime: new Date(),
        endTime: new Date(),
      };
    }

    this.isPolling = true;
    this.shouldStop = false;
    this.emptyQueueCount = 0;
    this.processedCount = 0;
    this.startTime = new Date();

    console.log('Starting queue poller...');

    try {
      // Start the recursive polling
      await this.pollRecursive();

      // When recursion ends, determine the completion status
      const endTime = new Date();
      const duration = endTime.getTime() - this.startTime!.getTime();

      if (this.shouldStop) {
        return {
          status: PollingResult.STOPPED,
          message: `Email automation stopped manually. ${this.processedCount} emails processed.`,
          processedCount: this.processedCount,
          duration,
          startTime: this.startTime!,
          endTime,
        };
      } else {
        return {
          status: PollingResult.COMPLETED,
          message: `Email automation completed successfully. ${this.processedCount} emails processed.`,
          processedCount: this.processedCount,
          duration,
          startTime: this.startTime!,
          endTime,
        };
      }
    } catch (error) {
      console.error('Error in startPolling:', error);
      const endTime = new Date();
      const duration = endTime.getTime() - this.startTime!.getTime();

      return {
        status: PollingResult.ERROR,
        message: 'Error occurred during polling',
        processedCount: this.processedCount,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration,
        startTime: this.startTime!,
        endTime,
      };
    } finally {
      this.isPolling = false;
    }
  }

  public stopPolling(): void {
    this.shouldStop = true;
    console.log('Stopping queue poller...');
  }

  private async pollAndProcess(): Promise<boolean> {
    try {
      // Check rate limits before polling
      await this.rateLimiter.waitForRateLimit();

      // Get item from queue
      const queueItem = await this.queueOperations.popFromQueue();

      // Queue is empty
      if (!queueItem) {
        return false; // Indicate empty queue
      }

      // Reset backoff strategy since we got an item
      this.backoffStrategy.reset();

      this.lastPollTime = new Date();
      this.processingCount++;

      console.log(
        `Processing queue item: content ${queueItem.contentId}, email ${queueItem.emailId}`
      );

      // Process the email and wait for completion - this returns boolean
      const emailResult = await this.processEmailAsync(queueItem);

      return emailResult; // Return the boolean result from email processing
    } catch (error) {
      console.error('Error polling queue:', error);
      throw error;
    }
  }

  private async processEmailAsync(queueItem: QueueItem): Promise<boolean> {
    try {
      const result = await this.emailProcessor.processEmail(queueItem);
      this.processedCount++; // Increment processed count on success

      // Return true if email was processed successfully
      return result.success;
    } catch (error) {
      console.error(
        `Error processing email for content ${queueItem.contentId} and email ${queueItem.emailId}:`,
        error
      );
      return false; // Return false on error
    } finally {
      this.processingCount = Math.max(0, this.processingCount - 1);
    }
  }

  public async getPollingStatus(): Promise<PollingStatus> {
    const queueLength = await this.queueOperations.getQueueLength();

    return {
      isPolling: this.isPolling,
      lastPollTime: this.lastPollTime,
      queueLength,
      processingCount: this.processingCount,
    };
  }

  public async getQueueLength(): Promise<number> {
    return await this.queueOperations.getQueueLength();
  }

  public isRunning(): boolean {
    return this.isPolling && !this.shouldStop;
  }

  private async pollRecursive(): Promise<void> {
    if (this.shouldStop) return;

    try {
      const pollResult = await this.pollAndProcess();

      if (!pollResult) {
        this.emptyQueueCount++;
        console.log(
          `Queue is empty (${this.emptyQueueCount}/${this.EMPTY_QUEUE_THRESHOLD} consecutive checks)`
        );

        // Check if we should stop due to empty queue
        if (this.emptyQueueCount >= this.EMPTY_QUEUE_THRESHOLD) {
          this.shouldStop = true;
          return;
        }

        // Wait before next poll when queue is empty
        await new Promise(resolve =>
          setTimeout(resolve, emailConfig.queue.emptyQueueBackoff)
        );
      } else {
        // Reset empty queue counter when we find items
        this.emptyQueueCount = 0;

        // No waiting - immediate recursive call for next email
        console.log('Email processed, continuing immediately to next email...');
        // Continue recursion
        await this.pollRecursive();
      }

      // await this.pollRecursive();
    } catch (error) {
      console.error('Error in pollRecursive:', error);

      // Use backoff strategy for errors
      if (this.backoffStrategy.shouldRetry()) {
        await this.backoffStrategy.wait();
        // Continue recursion after backoff
        await this.pollRecursive();
      } else {
        console.error('Max retries reached, stopping poller');
        this.shouldStop = true;
      }
    }
  }
}
