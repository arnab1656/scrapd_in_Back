import { KafkaClient } from "./kafkaClient";

export const initKafkaAdmin = async () => {
  const admin = KafkaClient.initKafka().admin();

  console.log("Admin connecting...");
  await admin.connect();
  console.log("Kafka admin connected");

  console.log("Creating topics...");
  await admin.createTopics({
    topics: [{ topic: "email-chunks", numPartitions: 1 }],
  });
  console.log("Topics created");

  await admin.disconnect();
  console.log("Admin disconnected");
};
