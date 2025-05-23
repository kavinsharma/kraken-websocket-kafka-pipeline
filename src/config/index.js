require('dotenv').config();

module.exports = {
  KRAKEN_WS_URL: process.env.KRAKEN_WS_URL || 'wss://ws.kraken.com',
  KAFKA_BROKER: process.env.KAFKA_BROKER || 'localhost:9092',
  KAFKA_TOPIC: process.env.KAFKA_TOPIC || 'quotes.crypto',
  WS_PORT: process.env.WS_PORT || 8080,
  HTTP_PORT: process.env.HTTP_PORT || 3000,
  CRYPTO_PAIRS: (process.env.CRYPTO_PAIRS || 'XBT/USD,ETH/USD').split(',').map(pair => pair.trim()),
}; 