import {
  Consumer,
  ConsumerSubscribeTopics,
  EachBatchPayload,
  EachMessagePayload,
} from "kafkajs";
import { KafkaClient } from "../kafkaClient";
import { AuthorService } from "../../db/services/author.service";
import { AuthorInput } from "../../db/services/author.service";
import { QueueService } from "../../queue/services/queue.service";

export default class ChunkConsumer {
  private kafkaConsumer: Consumer;
  private messageCount: number = 0;

  private currentProcessingPromise: Promise<void> | null = null;
  private queueService: QueueService;

  constructor() {
    this.kafkaConsumer = this.createKafkaConsumer();
    this.queueService = QueueService.getInstance();
  }

  private async processMessageWithDB(parsedObj: any): Promise<void> {
    try {
      await AuthorService.createOrGetAuthorWithRelations({
        name: parsedObj.author,
        emails: parsedObj.email,
        phoneNumbers: parsedObj.phoneNumber,
        content: parsedObj.content,
        linkedInURL: parsedObj.linkedInURL,
      } as AuthorInput);

      await this.queueService.prepareAndPushToQueue(parsedObj.content);
    } catch (error) {
      console.error("Error in DB operation:", error);
      throw error;
    }
  }

  public async startConsumer(
    kafkaProducerDataLength: number
  ): Promise<boolean> {
    try {
      await this.kafkaConsumer.connect();
      await this.kafkaConsumer.subscribe({
        topics: ["email-chunks"],
        fromBeginning: true,
      });

      return new Promise<boolean>((resolve) => {
        this.kafkaConsumer.run({
          eachMessage: async (messagePayload: EachMessagePayload) => {
            const { message } = messagePayload;
            this.messageCount++;

            try {
              const parsedObj = JSON.parse(message.value as unknown as string);
              console.log("Received message for:", parsedObj.author);

              if (this.currentProcessingPromise) {
                console.log("Waiting for previous message to complete...");
                await this.currentProcessingPromise;
              }

              this.currentProcessingPromise =
                this.processMessageWithDB(parsedObj);
              await this.currentProcessingPromise;

              console.log(
                "Message processing completed for:",
                parsedObj.author
              );

              if (this.messageCount === kafkaProducerDataLength) {
                console.log("All messages processed");
                resolve(true);
              }
            } catch (error) {
              console.error("Error in message processing:", error);
              this.currentProcessingPromise = null;
            }
          },
        });
      });
    } catch (error) {
      console.error("Error in consumer:", error);
      throw error;
    }
  }

  public async startBatchConsumer(): Promise<void> {
    const topic: ConsumerSubscribeTopics = {
      topics: ["email-chunks"],
      fromBeginning: false,
    };

    try {
      await this.kafkaConsumer.connect();
      await this.kafkaConsumer.subscribe(topic);
      await this.kafkaConsumer.run({
        eachBatch: async (eachBatchPayload: EachBatchPayload) => {
          const { batch } = eachBatchPayload;

          for (const message of batch.messages) {
            message;
            // const prefix = `${batch.topic}[${batch.partition} | ${message.offset}] / ${message.timestamp}`;
          }
        },
      });
    } catch (error) {
      console.log("Error in the consumer Subscriber model ", error);
    }
  }

  public async shutdown(): Promise<void> {
    try {
      // Wait for any ongoing processing to complete
      if (this.currentProcessingPromise) {
        await this.currentProcessingPromise;
      }
      await this.kafkaConsumer.disconnect();
    } catch (error) {
      console.error("Error shutting down consumer:", error);
      throw error;
    }
  }

  private createKafkaConsumer(): Consumer {
    try {
      const kafka = KafkaClient.initKafka();
      const consumer = kafka.consumer({
        groupId: "chunk-consumer-group",
        retry: {
          initialRetryTime: 100,
          retries: 8,
        },
        sessionTimeout: 30000,
        heartbeatInterval: 3000,
        maxBytesPerPartition: 1048576, // 1MB
        maxWaitTimeInMs: 5000,
      });

      return consumer;
    } catch (error) {
      console.error("Error creating Kafka consumer:", error);
      throw new Error("Failed to create Kafka consumer");
    }
  }

  // Method to get processing status
  public getProcessingStatus(): { total: number } {
    return {
      total: this.messageCount,
    };
  }
}
