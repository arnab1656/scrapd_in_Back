import { RedisQueueOperations } from "../../queue/redis/queue.operations";
import { EmailProcessorService } from "./email-processor.service";
import { RateLimiter } from "../../utils/rate.limiter";
import { BackoffStrategy } from "../../utils/backoff.strategy";
import { PollingStatus, QueueItem } from "../../types/email.types";
import { emailConfig } from "../../config/email.config";

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

  public async startPolling(): Promise<void> {
    if (this.isPolling) {
      console.log("Queue poller is already running");
      return;
    }

    this.isPolling = true;
    this.shouldStop = false;
    console.log("Starting queue poller...");

    while (!this.shouldStop) {
      try {
        await this.pollAndProcess();

        // Wait before next poll
        await new Promise((resolve) =>
          setTimeout(resolve, emailConfig.queue.pollingInterval)
        );
      } catch (error) {
        console.error("Error in polling loop:", error);

        // Use backoff strategy for errors
        if (this.backoffStrategy.shouldRetry()) {
          await this.backoffStrategy.wait();
        } else {
          console.error("Max retries reached, stopping poller");
          this.stopPolling();
          break;
        }
      }
    }
  }

  public stopPolling(): void {
    this.shouldStop = true;
    this.isPolling = false;
    console.log("Stopping queue poller...");
  }

  private async pollAndProcess(): Promise<void> {
    try {
      // Check rate limits before polling
      await this.rateLimiter.waitForRateLimit();

      // Get item from queue
      const queueItem = await this.queueOperations.popFromQueue();

      // Queue is empty, use backoff strategy
      if (!queueItem) {
        console.log("Queue is empty, waiting...");
        await this.backoffStrategy.wait();
        return;
      }

      // Reset backoff strategy since we got an item
      this.backoffStrategy.reset();

      this.lastPollTime = new Date();
      this.processingCount++;

      console.log(
        `Processing queue item: content ${queueItem.contentId}, email ${queueItem.emailId}`
      );

      // Process the email asynchronously
      this.processEmailAsync(queueItem);
    } catch (error) {
      console.error("Error polling queue:", error);
      throw error;
    }
  }

  private async processEmailAsync(queueItem: QueueItem): Promise<void> {
    try {
      await this.emailProcessor.processEmail(queueItem);
    } catch (error) {
      console.error(
        `Error processing email for content ${queueItem.contentId} and email ${queueItem.emailId}:`,
        error
      );
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
}
