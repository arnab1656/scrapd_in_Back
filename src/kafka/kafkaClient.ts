import { Kafka } from 'kafkajs';
import { kafkaConfig } from '../config/kafka.config';

export const kafka = new Kafka(kafkaConfig);

export class KafkaClient {
  public static initKafka(): Kafka {
    const kafka = new Kafka(kafkaConfig);
    return kafka;
  }
}
