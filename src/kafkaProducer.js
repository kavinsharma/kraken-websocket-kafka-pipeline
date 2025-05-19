const { Kafka } = require('kafkajs');
require('dotenv').config();

class KafkaProducer {
  constructor() {
    const kafka = new Kafka({
      clientId: 'crypto-market-data',
      brokers: [process.env.KAFKA_BROKER || 'localhost:9092']
    });
    
    this.producer = kafka.producer();
    this.topic = process.env.KAFKA_TOPIC || 'quotes.crypto';
  }

  async connect() {
    try {
      await this.producer.connect();
      console.log('Connected to Kafka producer');
    } catch (error) {
      console.error('Failed to connect to Kafka producer:', error);
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
      console.error('Error sending message to Kafka:', error);
    }
  }

  async disconnect() {
    await this.producer.disconnect();
    console.log('Disconnected from Kafka producer');
  }
}

module.exports = KafkaProducer; 