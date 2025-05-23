// Simple WebSocket client to test the market data pipeline
const WebSocket = require('ws');

const ws = new WebSocket('ws://localhost:8080');

ws.on('open', function open() {
  console.log('Connected to WebSocket server');
});

ws.on('message', function incoming(data) {
  const message = JSON.parse(data);
  
  // Handle the welcome message
  if (message.type === 'info') {
    console.log(`Server message: ${message.message}`);
    return;
  }
  
  // Format and display market data
  console.log(`[${message.timestamp}] ${message.symbol}: Bid: ${message.bid}, Ask: ${message.ask}`);
});

ws.on('close', function close() {
  console.log('Disconnected from WebSocket server');
});

ws.on('error', function error(err) {
  console.error('WebSocket error:', err);
});

// Keep the connection alive
process.on('SIGINT', function() {
  ws.close();
  process.exit();
});

console.log('WebSocket client started. Press Ctrl+C to exit.'); 