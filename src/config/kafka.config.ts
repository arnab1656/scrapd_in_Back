export const kafkaConfig = {
  clientId: "scrapd-backend",
  brokers: ["localhost:9092"],
  topic: "email-chunks",
};

export const producerConfig = {
  allowAutoTopicCreation: true,
  transactionTimeout: 30000,
};

export const KAFKA_TOPIC = "email-chunks";
