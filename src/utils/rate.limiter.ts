import { RateLimitStatus } from '../types/email.types';
import { emailConfig } from '../config/email.config';

export class RateLimiter {
  private static instance: RateLimiter;
  private emailsSentThisMinute: number = 0;
  private emailsSentThisHour: number = 0;
  private lastMinuteReset: Date = new Date();
  private lastHourReset: Date = new Date();

  private constructor() {
    this.startResetTimers();
  }

  public static getInstance(): RateLimiter {
    if (!RateLimiter.instance) {
      RateLimiter.instance = new RateLimiter();
    }
    return RateLimiter.instance;
  }

  public canSendEmail(): boolean {
    this.updateCounters();
    return (
      this.emailsSentThisMinute < emailConfig.rateLimits.maxEmailsPerMinute &&
      this.emailsSentThisHour < emailConfig.rateLimits.maxEmailsPerHour
    );
  }

  public async waitForRateLimit(): Promise<void> {
    while (!this.canSendEmail()) {
      const delay = this.calculateDelay();
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  public recordEmailSent(): void {
    this.emailsSentThisMinute++;
    this.emailsSentThisHour++;
  }

  public getStatus(): RateLimitStatus {
    this.updateCounters();
    const canSend = this.canSendEmail();
    const nextAvailableTime = canSend
      ? undefined
      : this.calculateNextAvailableTime();

    return {
      emailsSentThisMinute: this.emailsSentThisMinute,
      emailsSentThisHour: this.emailsSentThisHour,
      canSend,
      nextAvailableTime,
    };
  }

  private updateCounters(): void {
    const now = new Date();

    // Reset minute counter
    if (now.getTime() - this.lastMinuteReset.getTime() >= 60000) {
      this.emailsSentThisMinute = 0;
      this.lastMinuteReset = now;
    }

    // Reset hour counter
    if (now.getTime() - this.lastHourReset.getTime() >= 3600000) {
      this.emailsSentThisHour = 0;
      this.lastHourReset = now;
    }
  }

  // this function calculates the delay to wait for the rate limit to be reset
  private calculateDelay(): number {
    const now = new Date();
    const minuteDelay =
      60000 - (now.getTime() - this.lastMinuteReset.getTime());
    const hourDelay = 3600000 - (now.getTime() - this.lastHourReset.getTime());

    const calculatedDelay = Math.min(minuteDelay, hourDelay);
    return Math.min(Math.max(calculatedDelay, 1000), 5000);
  }

  private calculateNextAvailableTime(): Date {
    // const now = new Date();
    const minuteReset = new Date(this.lastMinuteReset.getTime() + 60000);
    const hourReset = new Date(this.lastHourReset.getTime() + 3600000);

    return new Date(Math.max(minuteReset.getTime(), hourReset.getTime()));
  }

  private startResetTimers(): void {
    // Reset minute counter every minute
    setInterval(() => {
      this.emailsSentThisMinute = 0; // initialized to 0
      this.lastMinuteReset = new Date(); // initialized to the current time
    }, 60000);

    // Reset hour counter every hour
    setInterval(() => {
      this.emailsSentThisHour = 0; // initialized to 0
      this.lastHourReset = new Date(); // initialized to the current time
    }, 3600000);
  }
}
