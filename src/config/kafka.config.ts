export const kafkaConfig = {
  clientId: "scrapedIen-backend",
  brokers: ["192.168.29.133:9092"],
  topic: "email-chunks",
};

export const producerConfig = {
  allowAutoTopicCreation: true,
  transactionTimeout: 30000,
};

export const KAFKA_TOPIC = "email-chunks";
