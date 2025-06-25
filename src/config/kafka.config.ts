export const kafkaConfig = {
  clientId: 'scrapedIen-backend',
  brokers: [`${process.env.KAFKA_BROKERS}`],
  topic: 'email-chunks',
};

export const producerConfig = {
  allowAutoTopicCreation: true,
  transactionTimeout: 30000,
};

export const KAFKA_TOPIC = 'email-chunks';
