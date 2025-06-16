import { Message, Producer, ProducerBatch, Partitioners } from "kafkajs";
import { KafkaClient } from "../kafkaClient";
import { ExtractedDataType } from "../../types/common.types";

export class ChunkProducer {
  private producer: Producer;

  constructor() {
    this.producer = this.createProducer();
  }

  private createProducer(): Producer {
    const kafka = KafkaClient.initKafka();
    return kafka.producer({
      createPartitioner: Partitioners.LegacyPartitioner,
      retry: {
        initialRetryTime: 100,
        retries: 8,
      },
      transactionTimeout: 30000,
    });
  }

  public async start(): Promise<void> {
    try {
      await this.producer.connect();
      console.log("Producer connected successfully");
    } catch (error) {
      console.error("Error connecting the producer:", error);
      throw error;
    }
  }

  public async sendBatch(messages: Array<ExtractedDataType>) {
    try {
      const kafkaMessages: Array<Message> = messages.map((message, index) => {
        return {
          key: (index + 1).toString() as string,
          value: JSON.stringify(message),
        };
      });

      const topicMessages = {
        topic: "email-chunks",
        messages: kafkaMessages,
      };

      const batch: ProducerBatch = {
        topicMessages: [topicMessages],
      };

      const result = await this.producer.sendBatch(batch);
      console.log("Batch sent successfully. Result:", result);
    } catch (error) {
      console.error("Error sending the batch:", error);
      throw error;
    }
  }

  public async shutdown(): Promise<void> {
    try {
      await this.producer.disconnect();
    } catch (error) {
      console.error("Error disconnecting the producer:", error);
      throw error;
    }
  }

  public getProducer(): Producer {
    return this.producer;
  }
}
