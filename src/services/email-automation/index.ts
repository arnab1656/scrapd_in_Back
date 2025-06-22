import { QueuePollerService } from "./queue-poller.service";
import { RateLimiter } from "../../utils/rate.limiter";
import { BackoffStrategy } from "../../utils/backoff.strategy";
import { PollingCompletion, PollingResult } from "../../types/email.types";

export class EmailAutomationService {
  private static instance: EmailAutomationService;
  private queuePoller: QueuePollerService;
  private rateLimiter: RateLimiter;
  private backoffStrategy: BackoffStrategy;
  private isRunning: boolean = false;
  private lastCompletion?: PollingCompletion;

  private constructor() {
    this.queuePoller = QueuePollerService.getInstance();
    this.rateLimiter = RateLimiter.getInstance();
    this.backoffStrategy = BackoffStrategy.getInstance();
  }

  public static getInstance(): EmailAutomationService {
    if (!EmailAutomationService.instance) {
      EmailAutomationService.instance = new EmailAutomationService();
    }
    return EmailAutomationService.instance;
  }

  public async start(): Promise<void> {
    if (this.isRunning) {
      console.log("Email automation service is already running");
      return;
    }

    try {
      console.log("Starting email automation service...");

      // Start the queue poller and wait for completion
      const completion = await this.queuePoller.startPolling();
      this.lastCompletion = completion;

      // Handle different completion scenarios
      switch (completion.status) {
        case PollingResult.COMPLETED:
          console.log(`✅ ${completion.message}`);
          console.log(`📊 Duration: ${this.formatDuration(completion.duration)}`);
          console.log(`📧 Emails processed: ${completion.processedCount}`);
          break;
          
        case PollingResult.STOPPED:
          console.log(`⏹️ ${completion.message}`);
          console.log(`📊 Duration: ${this.formatDuration(completion.duration)}`);
          console.log(`📧 Emails processed: ${completion.processedCount}`);
          break;
          
        case PollingResult.ERROR:
          console.error(`❌ ${completion.message}`);
          console.error(`📊 Duration: ${this.formatDuration(completion.duration)}`);
          console.error(`📧 Emails processed: ${completion.processedCount}`);
          if (completion.error) {
            console.error(`🔍 Error details: ${completion.error}`);
          }
          break;
      }

      this.isRunning = false;
      console.log("Email automation service finished");
    } catch (error) {
      console.error("Error starting email automation service:", error);
      this.isRunning = false;
      throw error;
    }
  }

  public async stop(): Promise<void> {
    if (!this.isRunning) {
      console.log("Email automation service is not running");
      return;
    }

    try {
      console.log("Stopping email automation service...");

      // Stop the queue poller
      this.queuePoller.stopPolling();

      this.isRunning = false;
      console.log("Email automation service stopped successfully");
    } catch (error) {
      console.error("Error stopping email automation service:", error);
      throw error;
    }
  }

  public async getStatus(): Promise<{
    isRunning: boolean;
    pollingStatus: any;
    rateLimitStatus: any;
    backoffStatus: any;
    lastCompletion?: PollingCompletion;
  }> {
    return {
      isRunning: this.isRunning,
      pollingStatus: await this.queuePoller.getPollingStatus(),
      rateLimitStatus: this.rateLimiter.getStatus(),
      backoffStatus: this.backoffStrategy.getStatus(),
      lastCompletion: this.lastCompletion,
    };
  }

  public async getQueueLength(): Promise<number> {
    return await this.queuePoller.getQueueLength();
  }

  public isServiceRunning(): boolean {
    return this.isRunning;
  }

  public getLastCompletion(): PollingCompletion | undefined {
    return this.lastCompletion;
  }

  private formatDuration(milliseconds: number): string {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }
}

// Export individual services for direct access if needed
export { QueuePollerService } from "./queue-poller.service";
export { EmailProcessorService } from "./email-processor.service";
export { StatusManagerService } from "./status-manager.service";
