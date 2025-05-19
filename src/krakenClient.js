const WebSocket = require('ws');
require('dotenv').config();

class KrakenClient {
  constructor(kafkaProducer) {
    this.ws = null;
    this.kafkaProducer = kafkaProducer;
    this.url = process.env.KRAKEN_WS_URL || 'wss://ws.kraken.com';
    this.pairs = (process.env.CRYPTO_PAIRS || 'XBT/USD,ETH/USD').split(',').map(pair => pair.trim());
  }

  connect() {
    console.log('Connecting to Kraken WebSocket...');
    this.ws = new WebSocket(this.url);

    this.ws.on('open', () => {
      console.log('Connected to Kraken WebSocket');
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
          console.log('Received system message:', JSON.stringify(message));
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
            
            console.log(`Received ticker update for ${formattedData.symbol}: bid ${formattedData.bid}, ask ${formattedData.ask}`);
            
            // Send to Kafka
            await this.kafkaProducer.sendMessage(formattedData);
          }
        }
      } catch (error) {
        console.error('Error processing message:', error);
      }
    });

    this.ws.on('error', (error) => {
      console.error('Kraken WebSocket error:', error);
    });

    this.ws.on('close', () => {
      console.log('Disconnected from Kraken WebSocket, reconnecting in 5 seconds...');
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
      console.log(`Sent subscription request for ${pair}`);
    }
  }
}

module.exports = KrakenClient; 