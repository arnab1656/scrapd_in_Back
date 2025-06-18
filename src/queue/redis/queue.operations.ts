import { Redis } from "ioredis";
import { redisConfig } from "../../config/redis.config";

interface QueueItem {
  contentId: number;
  emailId: number;
  timestamp: Date;
}

export class RedisQueueOperations {
  private static instance: RedisQueueOperations;
  private redisClient: Redis;
  private readonly QUEUE_NAME = "content_email_queue";
  private readonly MAX_QUEUE_SIZE = 10000;

  private constructor() {
    this.redisClient = new Redis(redisConfig);
  }

  public static getInstance(): RedisQueueOperations {
    if (!RedisQueueOperations.instance) {
      RedisQueueOperations.instance = new RedisQueueOperations();
    }
    return RedisQueueOperations.instance;
  }

  public async pushToQueue(contentId: number, emailId: number): Promise<void> {
    try {
      const queueItem: QueueItem = {
        contentId,
        emailId,
        timestamp: new Date(),
      };

      const currentLength = await this.getQueueLength();
      if (currentLength >= this.MAX_QUEUE_SIZE) {
        throw new Error("Queue is full");
      }

      await this.redisClient.rpush(this.QUEUE_NAME, JSON.stringify(queueItem));

      console.log(`Content ID ${contentId} pushed to queue`);
    } catch (error) {
      console.error("Error pushing to queue:", error);
      throw error;
    }
  }

  public async popFromQueue(): Promise<QueueItem | null> {
    try {
      const item = await this.redisClient.lpop(this.QUEUE_NAME);

      if (!item) {
        return null;
      }

      const queueItem: QueueItem = JSON.parse(item);
      return queueItem;
    } catch (error) {
      console.error("Error popping from queue:", error);
      throw error;
    }
  }

  public async getQueueLength(): Promise<number> {
    try {
      return await this.redisClient.llen(this.QUEUE_NAME);
    } catch (error) {
      console.error("Error getting queue length:", error);
      throw error;
    }
  }
}
