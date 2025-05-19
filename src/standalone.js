// Standalone test script for Kraken without Kafka
require('dotenv').config();
const KrakenClient = require('./krakenClient');

// Mock Kafka producer
class MockKafkaProducer {
  async connect() {
    console.log('Connected to mock Kafka producer');
    return Promise.resolve();
  }

  async sendMessage(data) {
    console.log(`Mock Kafka: Would send to topic: ${JSON.stringify(data)}`);
    return Promise.resolve();
  }

  async disconnect() {
    console.log('Disconnected from mock Kafka producer');
    return Promise.resolve();
  }
}

async function main() {
  try {
    // Initialize mock Kafka producer
    const mockProducer = new MockKafkaProducer();
    await mockProducer.connect();
    
    // Initialize Kraken client with mock Kafka producer
    const krakenClient = new KrakenClient(mockProducer);
    krakenClient.connect();
    
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      console.log('Shutting down...');
      process.exit(0);
    });
    
    console.log('Standalone Kraken client running...');
  } catch (error) {
    console.error('Error starting application:', error);
    process.exit(1);
  }
}

main(); 