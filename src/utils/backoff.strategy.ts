import { BackoffStatus } from '../types/email.types';
import { emailConfig } from '../config/email.config';

export class BackoffStrategy {
  private static instance: BackoffStrategy;
  private attemptCount: number = 0;
  private currentDelay: number = emailConfig.retryPolicy.initialDelay;

  private constructor() {}

  public static getInstance(): BackoffStrategy {
    if (!BackoffStrategy.instance) {
      BackoffStrategy.instance = new BackoffStrategy();
    }
    return BackoffStrategy.instance;
  }

  public async wait(): Promise<void> {
    const delay = this.calculateDelay();
    await new Promise(resolve => setTimeout(resolve, delay));
    this.incrementAttempt();
  }

  public reset(): void {
    this.attemptCount = 0;
    this.currentDelay = emailConfig.retryPolicy.initialDelay;
  }

  public getStatus(): BackoffStatus {
    const nextAttemptTime = new Date(Date.now() + this.currentDelay);

    return {
      currentDelay: this.currentDelay,
      maxDelay: emailConfig.retryPolicy.maxDelay,
      attemptCount: this.attemptCount,
      nextAttemptTime,
    };
  }

  public shouldRetry(): boolean {
    return this.attemptCount < emailConfig.rateLimits.maxRetries;
  }

  public isMaxRetriesReached(): boolean {
    return this.attemptCount >= emailConfig.rateLimits.maxRetries;
  }

  private calculateDelay(): number {
    const delay = Math.min(this.currentDelay, emailConfig.retryPolicy.maxDelay);

    return delay + Math.random() * 1000; // Add jitter
  }

  private incrementAttempt(): void {
    this.attemptCount++;
    this.currentDelay = Math.min(
      this.currentDelay * emailConfig.retryPolicy.backoffMultiplier,
      emailConfig.retryPolicy.maxDelay
    );
  }
}
