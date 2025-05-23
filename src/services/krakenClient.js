const WebSocket = require('ws');
const KafkaProducer = require('./kafkaProducer');
const config = require('../config');
const logger = require('../utils/logger');

class KrakenClient {
  constructor(kafkaProducer) {
    this.ws = null;
    this.kafkaProducer = kafkaProducer;
    this.url = config.KRAKEN_WS_URL;
    this.pairs = config.CRYPTO_PAIRS;
  }

  connect() {
    logger.info('Connecting to Kraken WebSocket...');
    this.ws = new WebSocket(this.url);

    this.ws.on('open', () => {
      logger.info('Connected to Kraken WebSocket');
      this.subscribe();
    });

    this.ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        // Handle system/subscription messages
        if (typeof message === 'object' && !Array.isArray(message)) {
          if (message.event === 'heartbeat') {
            // Ignore heartbeat messages for cleaner logs
            return;
          }
          logger.info('Received system message:', JSON.stringify(message));
          return;
        }
        
        // Handle ticker data (array format for v1 API)
        if (Array.isArray(message) && message.length >= 4) {
          const channelId = message[0];
          const tickerData = message[1];
          const channelName = message[2];
          const pair = message[3];
          
          if (tickerData && tickerData.c) {
            const formattedData = {
              symbol: pair.replace('/', ''),
              timestamp: new Date().toISOString(),
              bid: parseFloat(tickerData.b[0]),
              ask: parseFloat(tickerData.a[0])
            };
            
            logger.info(`Received ticker update for ${formattedData.symbol}: bid ${formattedData.bid}, ask ${formattedData.ask}`);
            
            // Send to Kafka
            await this.kafkaProducer.sendMessage(formattedData);
          }
        }
      } catch (error) {
        logger.error('Error processing message:', error);
      }
    });

    this.ws.on('error', (error) => {
      logger.error('Kraken WebSocket error:', error);
    });

    this.ws.on('close', () => {
      logger.warn('Disconnected from Kraken WebSocket, reconnecting in 5 seconds...');
      setTimeout(() => this.connect(), 5000);
    });
  }

  subscribe() {
    // Kraken WebSocket API v1 format
    // Instead of sending all pairs at once, subscribe to each pair individually
    for (const pair of this.pairs) {
      const subscriptionMessage = {
        event: 'subscribe',
        pair: [pair],
        subscription: {
          name: 'ticker'
        }
      };

      this.ws.send(JSON.stringify(subscriptionMessage));
      logger.info(`Sent subscription request for ${pair}`);
    }
  }
}

module.exports = KrakenClient; 