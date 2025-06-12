import ChunkConsumer from "../kafka/consumer/ChunkConsumer";
import { ChunkProducer } from "../kafka/producer/ChunkProducer";
import { ExtractedDataType } from "../types/common.types";
import { RedisBatchManager } from "../services/redis-batch.service";

export class KafkaOrchestrator {
  private chunkConsumer: ChunkConsumer;
  private producer: ChunkProducer;

  private kafkaProducerData: ExtractedDataType[];
  private kafkaProducerDataLength: number;
  private redisBatchManager: RedisBatchManager;
  private batchId: string;

  constructor(
    kafkaProducerData: ExtractedDataType[],
    redisBatchManager: RedisBatchManager,
    batchId: string
  ) {
    this.chunkConsumer = new ChunkConsumer();
    this.producer = new ChunkProducer();
    this.kafkaProducerData = kafkaProducerData;
    this.kafkaProducerDataLength = kafkaProducerData.length;
    this.redisBatchManager = redisBatchManager;
    this.batchId = batchId;
  }

  private async handleConsumerStartUp() {
    try {
      const isConsumerStarted = await this.chunkConsumer.startConsumer(
        this.kafkaProducerDataLength
      );

      if (isConsumerStarted) {
        await this.redisBatchManager.cleanupBatch(this.batchId);
        await this.chunkConsumer.shutdown();
      }
    } catch (error) {
      throw error;
    }
  }

  private async handleProducer(kafkaProducerData: ExtractedDataType[]) {
    try {
      await this.producer.start();
      await this.producer.sendBatch(kafkaProducerData);
      await this.producer.shutdown();
    } catch (error) {
      throw error;
    }
  }

  public async orchestrator() {
    try {
      await this.handleConsumerStartUp();
      await this.handleProducer(this.kafkaProducerData);
    } catch (error) {
      if (this.chunkConsumer && this.producer) {
        await this.chunkConsumer.shutdown();
        await this.producer.shutdown();
      }
      throw error;
    }
  }
}
