import { KafkaClient } from './kafkaClient';
// import { Partitioners } from "kafkajs";

// for testing purposes config done in this file.
export const initKafkaAdmin = async () => {
  const admin = KafkaClient.initKafka().admin();
  const topicName = 'email-chunks';

  try {
    console.log('Admin connecting...');
    await admin.connect();
    console.log('Kafka admin connected');

    // Check if topic exists and delete it
    const existingTopics = await admin.listTopics();
    console.log('Existing topics:', existingTopics);

    if (existingTopics.includes(topicName)) {
      console.log('Deleting existing topic:', topicName);
      await admin.deleteTopics({
        topics: [topicName],
        timeout: 5000,
      });
      console.log('Topic deleted successfully');
    }

    // Create new topic
    console.log('Creating new topic:', topicName);
    await admin.createTopics({
      topics: [
        {
          topic: topicName,
          numPartitions: 1,
          replicationFactor: 1,
          configEntries: [
            {
              name: 'retention.ms',
              value: '604800000',
            },
            {
              name: 'cleanup.policy',
              value: 'delete',
            },
          ],
        },
      ],
      timeout: 5000,
    });
    console.log('Topic created successfully');

    await admin.disconnect();
    console.log('Admin disconnected');
  } catch (error) {
    console.error('Error in Kafka admin:', error);
    throw error;
  }
};
