const { Kafka } = require('kafkajs');
const config = require('../config');
const logger = require('../utils/logger');

class KafkaConsumer {
  constructor(wsServer) {
    const kafka = new Kafka({
      clientId: 'crypto-market-data-consumer',
      brokers: [config.KAFKA_BROKER]
    });
    
    this.consumer = kafka.consumer({ groupId: 'market-data-group' });
    this.topic = config.KAFKA_TOPIC;
    this.wsServer = wsServer;
  }

  async connect() {
    try {
      await this.consumer.connect();
      await this.consumer.subscribe({ topic: this.topic, fromBeginning: false });
      logger.info(`Connected to Kafka consumer and subscribed to topic: ${this.topic}`);
      
      await this.consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          try {
            const data = JSON.parse(message.value.toString());
            logger.info(`Received from Kafka: ${data.symbol} bid: ${data.bid}, ask: ${data.ask}`);
            
            // Forward to WebSocket server
            this.wsServer.broadcast(data);
          } catch (error) {
            logger.error('Error processing Kafka message:', error);
          }
        }
      });
    } catch (error) {
      logger.error('Failed to connect to Kafka consumer:', error);
      throw error;
    }
  }

  async disconnect() {
    await this.consumer.disconnect();
    logger.info('Disconnected from Kafka consumer');
  }
}

module.exports = KafkaConsumer; 