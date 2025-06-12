import ChunkConsumer from "../kafka/consumer/ChunkConsumer";
import { ChunkProducer } from "../kafka/producer/ChunkProducer";
import { ExtractedDataType } from "../types/common.types";

export class KafkaOrchestrator {
  private chunkConsumer: ChunkConsumer;
  private producer: ChunkProducer;

  private kafkaProducerData: ExtractedDataType[];
  private kafkaProducerDataLength: number;

  constructor(kafkaProducerData: ExtractedDataType[]) {
    this.chunkConsumer = new ChunkConsumer();
    this.producer = new ChunkProducer();
    this.kafkaProducerData = kafkaProducerData;
    this.kafkaProducerDataLength = kafkaProducerData.length;
  }

  private async startConsumer() {
    try {
      const isConsumerStarted = await this.chunkConsumer.startConsumer(
        this.kafkaProducerDataLength
      );

      if (isConsumerStarted) {
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
      // Start consumer first and keep it running in background
      const consumerPromise = this.startConsumer();

      // Then start producer
      await this.handleProducer(this.kafkaProducerData);

      // Wait for consumer to complete
      await consumerPromise;
    } catch (error) {
      if (this.chunkConsumer && this.producer) {
        await this.chunkConsumer.shutdown();
        await this.producer.shutdown();
      }
      throw error;
    }
  }
}
