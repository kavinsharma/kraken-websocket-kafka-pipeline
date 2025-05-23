// Simple Kraken WebSocket test client
const WebSocket = require('ws');

console.log('Connecting to Kraken WebSocket...');
const ws = new WebSocket('wss://ws.kraken.com');

ws.on('open', () => {
  console.log('Connected to Kraken WebSocket');
  
  // Subscribe to XBT/USD ticker updates using the v1 API format
  const subscriptionMessage = {
    event: 'subscribe',
    pair: ['XBT/USD'],
    subscription: {
      name: 'ticker'
    }
  };

  ws.send(JSON.stringify(subscriptionMessage));
  console.log('Sent subscription request for XBT/USD');
});

ws.on('message', (data) => {
  try {
    const message = JSON.parse(data.toString());
    
    // Handle system/subscription messages
    if (typeof message === 'object' && !Array.isArray(message)) {
      console.log('Received message:', JSON.stringify(message, null, 2));
      return;
    }
    
    // Handle ticker data (array format for v1 API)
    if (Array.isArray(message) && message.length >= 4) {
      const channelId = message[0];
      const tickerData = message[1];
      const channelName = message[2];
      const pair = message[3];
      
      if (tickerData && tickerData.c) {
        const lastPrice = tickerData.c[0];
        const lastVolume = tickerData.c[1];
        const bestBid = tickerData.b[0];
        const bestAsk = tickerData.a[0];
        
        console.log(`Ticker update for ${pair}: last ${lastPrice}, bid ${bestBid}, ask ${bestAsk}`);
      }
    }
  } catch (error) {
    console.error('Error processing message:', error);
  }
});

ws.on('error', (error) => {
  console.error('Kraken WebSocket error:', error);
});

ws.on('close', () => {
  console.log('Disconnected from Kraken WebSocket');
});

// Keep the process running
process.on('SIGINT', () => {
  ws.close();
  process.exit(0);
});

console.log('Test client started. Press Ctrl+C to exit.'); 