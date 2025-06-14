import {
  Consumer,
  ConsumerSubscribeTopics,
  EachBatchPayload,
  EachMessagePayload,
} from "kafkajs";
import { KafkaClient } from "../kafkaClient";
import { AuthorOperations } from "../../db/operations/author.operations";

export default class ChunkConsumer {
  private kafkaConsumer: Consumer;
  private messageCount: number = 0;
  private processedCount: number = 0;

  public constructor() {
    this.kafkaConsumer = this.createKafkaConsumer();
  }

  public async startConsumer(
    kafkaProducerDataLength: number
  ): Promise<boolean> {
    try {
      await this.kafkaConsumer.connect();
      await this.kafkaConsumer.subscribe({ topics: ["email-chunks"] });

      return new Promise<boolean>((resolve) => {
        this.kafkaConsumer.run({
          eachMessage: async (messagePayload: EachMessagePayload) => {
            const { message } = messagePayload;
            this.messageCount++;

            console.log(`- index ${message.key} started processing`);
            const parsedObj = JSON.parse(message.value as unknown as string);

            console.log("parsedObj is ", parsedObj);
            console.log("kafkaProducerDataLength is ", kafkaProducerDataLength);

            const author = await AuthorOperations.findAuthorByName(
              parsedObj.author
            );
            if (!author) {
              const newAuthor = await AuthorOperations.createAuthor(
                parsedObj.author
              );
              console.log("newAuthor is ", newAuthor);
            }

            console.log("author is ", author);

            resolve(true);
            return;

            // await new Promise<void>((resolveTimeout) => {
            //   setTimeout(() => {
            //     console.log(`- index ${message.key} processing completed`);
            //     this.processedCount++;
            //     resolveTimeout();

            //     if (this.messageCount === kafkaProducerDataLength) {
            //       console.log("All messages have been processed!");
            //       resolve(true);
            //     }
            //   }, 200);
            // });
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
            const prefix = `${batch.topic}[${batch.partition} | ${message.offset}] / ${message.timestamp}`;
            console.log(`- ${prefix} ${message.key}#${message.value}`);
          }
        },
      });
    } catch (error) {
      console.log("Error in the consumer Subscriber model ", error);
    }
  }

  public async shutdown(): Promise<void> {
    console.log("shutting down the consumer signal handler");
    await this.kafkaConsumer.disconnect();
  }

  private createKafkaConsumer(): Consumer {
    try {
      const kafka = KafkaClient.initKafka();
      const consumer = kafka.consumer({ groupId: "chunk-consumer-group" });

      console.log("createKafkaConsumer is created");

      return consumer;
    } catch (error) {
      throw new Error("error in createKafkaConsumer Creation");
    }
  }

  // Method to get processing status
  public getProcessingStatus(): { total: number; processed: number } {
    return {
      total: this.messageCount,
      processed: this.processedCount,
    };
  }
}
