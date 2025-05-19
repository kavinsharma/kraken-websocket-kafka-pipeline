const { Kafka } = require('kafkajs');
require('dotenv').config();

class KafkaConsumer {
  constructor(wsServer) {
    const kafka = new Kafka({
      clientId: 'crypto-market-data-consumer',
      brokers: [process.env.KAFKA_BROKER || 'localhost:9092']
    });
    
    this.consumer = kafka.consumer({ groupId: 'market-data-group' });
    this.topic = process.env.KAFKA_TOPIC || 'quotes.crypto';
    this.wsServer = wsServer;
  }

  async connect() {
    try {
      await this.consumer.connect();
      await this.consumer.subscribe({ topic: this.topic, fromBeginning: false });
      console.log(`Connected to Kafka consumer and subscribed to topic: ${this.topic}`);
      
      await this.consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          try {
            const data = JSON.parse(message.value.toString());
            console.log(`Received from Kafka: ${data.symbol} bid: ${data.bid}, ask: ${data.ask}`);
            
            // Forward to WebSocket server
            this.wsServer.broadcast(data);
          } catch (error) {
            console.error('Error processing Kafka message:', error);
          }
        }
      });
    } catch (error) {
      console.error('Failed to connect to Kafka consumer:', error);
      throw error;
    }
  }

  async disconnect() {
    await this.consumer.disconnect();
    console.log('Disconnected from Kafka consumer');
  }
}

module.exports = KafkaConsumer; 