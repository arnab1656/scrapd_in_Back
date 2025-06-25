import Redis from 'ioredis';
import { v4 as uuid } from 'uuid';
import {
  redisConfig,
  BATCH_KEY_PREFIX,
  BATCH_TTL,
} from '../config/redis.config';
import { RedisBatchMetadata, RedisChunkData } from '../types/redis.types';

export class RedisBatchManager {
  private redis: Redis;

  constructor() {
    this.redis = new Redis(redisConfig);
    this.setupRedisErrorHandling();
  }

  private setupRedisErrorHandling(): void {
    this.redis.on('error', (error: Error) => {
      console.error('Redis Error:', error);
      // Implement your error reporting here
    });

    this.redis.on('connect', () => {
      console.log('Successfully connected to Redis');
    });
  }

  private getBatchKey(batchId: string): string {
    return `${BATCH_KEY_PREFIX}${batchId}:metadata`;
  }

  private getChunkKey(batchId: string): string {
    return `${BATCH_KEY_PREFIX}${batchId}:chunks`;
  }

  async initializeBatch(totalChunks: number): Promise<string> {
    const batchId = uuid();
    const batchKey = this.getBatchKey(batchId);

    const batchMetadata: RedisBatchMetadata = {
      totalChunks,
      startTime: Date.now(),
      status: 'initializing',
      receivedChunks: 0,
    };

    try {
      await this.redis
        .multi()
        .hset(batchKey, batchMetadata as any)
        .expire(batchKey, BATCH_TTL)
        .exec();

      return batchId;
    } catch (error) {
      console.error('Error initializing batch:', error);
      throw new Error('Failed to initialize batch');
    }
  }

  async storeChunk(
    batchId: string,
    chunkIndex: number,
    chunkData: any
  ): Promise<void> {
    const chunkKey = this.getChunkKey(batchId);
    const batchKey = this.getBatchKey(batchId);

    const chunk: RedisChunkData = {
      data: chunkData,
      timestamp: Date.now(),
      attempts: 1,
    };

    try {
      await this.redis
        .multi()
        .hset(chunkKey, chunkIndex.toString(), JSON.stringify(chunk))
        .hincrby(batchKey, 'receivedChunks', 1)
        .hset(batchKey, 'status', 'processing')
        .expire(chunkKey, BATCH_TTL)
        .exec();
    } catch (error) {
      throw new Error(
        `Failed to store chunk ${chunkIndex} for batch ${batchId}`
      );
    }
  }

  async markBatchComplete(batchId: string): Promise<boolean> {
    const batchKey = this.getBatchKey(batchId);

    try {
      const [totalChunks, receivedChunks] = await this.redis.hmget(
        batchKey,
        'totalChunks',
        'receivedChunks'
      );

      if (parseInt(receivedChunks!) === parseInt(totalChunks!)) {
        await this.redis.hset(batchKey, 'status', 'completed');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error marking batch complete:', error);
      throw new Error(`Failed to mark batch ${batchId} as complete`);
    }
  }

  async cleanupBatch(batchId: string): Promise<void> {
    const batchKey = this.getBatchKey(batchId);
    const chunkKey = this.getChunkKey(batchId);

    try {
      await this.redis.multi().del(batchKey).del(chunkKey).exec();
    } catch (error) {
      console.error('Error cleaning up batch:', error);
      throw new Error(`Failed to cleanup batch ${batchId}`);
    }
  }

  async getAllChunksData(batchId: string): Promise<RedisChunkData[]> {
    const chunkKey = this.getChunkKey(batchId);

    try {
      const rawChunks = await this.redis.hgetall(chunkKey);

      if (!rawChunks || Object.keys(rawChunks).length === 0) {
        throw new Error(`No chunks found for batch ${batchId}`);
      }
      const chunks = Object.entries(rawChunks).map(
        ([chunkIndex, chunkDataStr]) => {
          const chunkData = JSON.parse(chunkDataStr) as RedisChunkData;
          return {
            ...chunkData,
            index: parseInt(chunkIndex),
          };
        }
      );

      return chunks;
    } catch (error) {
      console.error(`Error retrieving chunks for batch ${batchId}:`, error);
      throw new Error(`Failed to retrieve chunks for batch ${batchId}`);
    }
  }
}
