const { Kafka } = require('kafkajs');
const config = require('../config');
const logger = require('../utils/logger');

class KafkaProducer {
  constructor() {
    const kafka = new Kafka({
      clientId: 'crypto-market-data',
      brokers: [config.KAFKA_BROKER]
    });
    
    this.producer = kafka.producer();
    this.topic = config.KAFKA_TOPIC;
  }

  async connect() {
    try {
      await this.producer.connect();
      logger.info('Connected to Kafka producer');
    } catch (error) {
      logger.error('Failed to connect to Kafka producer:', error);
      throw error;
    }
  }

  async sendMessage(data) {
    try {
      await this.producer.send({
        topic: this.topic,
        messages: [{ value: JSON.stringify(data) }]
      });
    } catch (error) {
      logger.error('Error sending message to Kafka:', error);
    }
  }

  async disconnect() {
    await this.producer.disconnect();
    logger.info('Disconnected from Kafka producer');
  }
}

module.exports = KafkaProducer; 