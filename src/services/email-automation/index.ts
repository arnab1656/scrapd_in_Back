import { QueuePollerService } from "./queue-poller.service";
import { RateLimiter } from "../../utils/rate.limiter";
import { BackoffStrategy } from "../../utils/backoff.strategy";

export class EmailAutomationService {
  private static instance: EmailAutomationService;
  private queuePoller: QueuePollerService;
  private rateLimiter: RateLimiter;
  private backoffStrategy: BackoffStrategy;
  private isRunning: boolean = false;

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

      // Start the queue poller
      await this.queuePoller.startPolling();

      this.isRunning = true;
      console.log("Email automation service started successfully");
    } catch (error) {
      console.error("Error starting email automation service:", error);
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
  }> {
    return {
      isRunning: this.isRunning,
      pollingStatus: await this.queuePoller.getPollingStatus(),
      rateLimitStatus: this.rateLimiter.getStatus(),
      backoffStatus: this.backoffStrategy.getStatus(),
    };
  }

  public async getQueueLength(): Promise<number> {
    return await this.queuePoller.getQueueLength();
  }

  public isServiceRunning(): boolean {
    return this.isRunning;
  }
}

// Export individual services for direct access if needed
export { QueuePollerService } from "./queue-poller.service";
export { EmailProcessorService } from "./email-processor.service";
export { StatusManagerService } from "./status-manager.service";
