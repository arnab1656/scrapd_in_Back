import { Kafka, Producer } from "kafkajs";
import { kafkaConfig, producerConfig } from "../../config/kafka.config";

export class ChunkProducer {
  private producer: Producer;
  private isConnected: boolean = false;

  constructor() {
    const kafka = new Kafka(kafkaConfig);
    this.producer = kafka.producer(producerConfig);
  }

  async connect(): Promise<void> {
    try {
      await this.producer.connect();
      this.isConnected = true;
      console.log("Successfully connected to Kafka");
    } catch (error) {
      console.error("Failed to connect to Kafka:", error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.producer.disconnect();
      this.isConnected = false;
      console.log("Disconnected from Kafka");
    } catch (error) {
      console.error("Failed to disconnect from Kafka:", error);
      throw error;
    }
  }

  isKafkaConnected(): boolean {
    return this.isConnected;
  }
}
