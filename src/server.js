const express = require('express');
const KrakenClient = require('./services/krakenClient');
const KafkaProducer = require('./services/kafkaProducer');
const KafkaConsumer = require('./services/kafkaConsumer');
const WebSocketServer = require('./services/wsServer');
const routes = require('./routes');

const app = express();
app.use(express.json());
app.use('/', routes);

const HTTP_PORT = process.env.HTTP_PORT || 3000;

app.listen(HTTP_PORT, () => {
  console.log(`REST API server running on http://localhost:${HTTP_PORT}`);
});

async function main() {
  let wsServer = null;
  let kafkaProducer = null;
  let kafkaConsumer = null;
  let krakenClient = null;

  try {
    // Initialize WebSocket server
    wsServer = new WebSocketServer();
    wsServer.start();

    // Initialize Kafka producer
    kafkaProducer = new KafkaProducer();
    await kafkaProducer.connect();

    // Initialize Kafka consumer with WebSocket server
    kafkaConsumer = new KafkaConsumer(wsServer);
    await kafkaConsumer.connect();

    // Initialize Kraken client with Kafka producer
    krakenClient = new KrakenClient(kafkaProducer);
    krakenClient.connect();

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      console.log('Shutting down...');

      // Disconnect Kafka connections
      if (kafkaProducer) {
        await kafkaProducer.disconnect().catch(err => console.error('Error disconnecting producer:', err));
      }

      if (kafkaConsumer) {
        await kafkaConsumer.disconnect().catch(err => console.error('Error disconnecting consumer:', err));
      }

      // Stop WebSocket server
      if (wsServer) {
        wsServer.stop();
      }

      console.log('All connections closed');
      process.exit(0);
    });

    console.log('Crypto market data pipeline running...');
  } catch (error) {
    console.error('Error starting application:', error);

    // Cleanup in case of error
    if (kafkaProducer) {
      await kafkaProducer.disconnect().catch(() => {});
    }

    if (kafkaConsumer) {
      await kafkaConsumer.disconnect().catch(() => {});
    }

    if (wsServer) {
      wsServer.stop();
    }

    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

main(); 