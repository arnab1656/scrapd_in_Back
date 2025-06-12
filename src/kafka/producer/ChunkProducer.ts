import { Message, Producer, ProducerBatch } from "kafkajs";
import { KafkaClient } from "../kafkaClient";
import { ExtractedDataType } from "../../types/common.types";

export class ChunkProducer {
  private producer: Producer;

  constructor() {
    this.producer = this.createProducer();
  }

  private createProducer(): Producer {
    const kafka = KafkaClient.initKafka();
    return kafka.producer();
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
      console.log("messages are being sent to kafka --> producer");
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

      await this.producer.sendBatch(batch);
    } catch (error) {
      console.error("Error sending the batch");
      throw error;
    }
  }

  public async shutdown(): Promise<void> {
    try {
      await this.producer.disconnect();
      setTimeout(() => {
        console.log("Producer disconnected successfully after 1 second");
      }, 1000);
    } catch (error) {
      console.error("Error disconnecting the producer:", error);
      throw error;
    }
  }

  public getProducer(): Producer {
    return this.producer;
  }
}
