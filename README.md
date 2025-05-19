# Crypto Market Data Pipeline

A real-time data pipeline that ingests live trading data from Kraken, processes it through Kafka, and delivers it to clients via WebSocket.

## Architecture

```
Kraken WebSocket → Kafka Producer → Kafka Topic → Kafka Consumer → WebSocket Server → Clients
```

The data flow:
1. Connects to Kraken WebSocket API and subscribes to ticker updates for specified crypto pairs
2. Formats the data and publishes it to a Kafka topic
3. Consumes the data from Kafka
4. Broadcasts the data to all connected WebSocket clients

## Prerequisites

- Node.js (v14+ recommended)
- Apache Kafka (v2.8+ recommended)
- Zookeeper (required for Kafka)

**OR**

- Docker and Docker Compose (recommended for easier setup)

## Option 1: Running with Docker Compose (Recommended)

This is the easiest way to run the complete application including Kafka and Zookeeper:

1. Make sure Docker and Docker Compose are installed
2. Run the following command:
```
docker-compose up -d
```

This will:
- Start Zookeeper
- Start Kafka and create the required topic
- Build and start the application container

Alternatively, you can use the provided startup script:
```
./start.sh
```

The script performs additional checks and cleanup before starting the containers.

To check the application logs:
```
docker logs -f crypto-market-data
```

To stop all services:
```
docker-compose down
```

## Option 2: Manual Setup

### Kafka Setup

1. Start Zookeeper:
```
bin/zookeeper-server-start.sh config/zookeeper.properties
```

2. Start Kafka:
```
bin/kafka-server-start.sh config/server.properties
```

3. Create the required topic:
```
bin/kafka-topics.sh --create --topic quotes.crypto --bootstrap-server localhost:9092 --partitions 1 --replication-factor 1
```

### Installation

1. Install dependencies:
```
npm install
```

2. Create a `.env` file with the following content (or use default values):
```
# Kraken WebSocket
KRAKEN_WS_URL=wss://ws.kraken.com

# Kafka Configuration
KAFKA_BROKER=localhost:9092
KAFKA_TOPIC=quotes.crypto

# WebSocket Server
WS_PORT=8080

# Crypto pairs to track
CRYPTO_PAIRS=XBT/USD,ETH/USD
```

### Running the Application

Start the application:
```
npm start
```

For testing without Kafka (Kraken WebSocket client only):
```
node src/standalone.js
```

This will:
1. Connect to Kraken WebSocket API for XBT/USD and ETH/USD ticker data
2. Forward data to Kafka topic "quotes.crypto"
3. Consume from the Kafka topic
4. Broadcast to all connected WebSocket clients

## Testing

There are two ways to test the WebSocket server:

### 1. Using the included test client

The project includes a simple WebSocket client for testing:

```
npm run test-client
```

This will connect to the WebSocket server and display real-time market data in your terminal.

### 2. Using wscat

You can also use a tool like wscat:

```
npx wscat -c ws://localhost:8080
```

You should start receiving real-time market data for the configured crypto pairs.

## Data Format

### Kraken WebSocket API Format (Input)

The Kraken WebSocket API sends ticker data in this format:
```json
[
  0,
  {
    "a": ["5525.40000", 1, "1.000"],
    "b": ["5525.10000", 1, "1.000"],
    "c": ["5525.10000", "0.00398963"],
    "h": ["5783.00000", "5783.00000"],
    "l": ["5505.00000", "5505.00000"],
    "o": ["5760.70000", "5763.40000"],
    "p": ["5631.44067", "5653.78939"],
    "t": [11493, 16267],
    "v": ["2634.11501494", "3591.17907851"]
  },
  "ticker",
  "XBT/USD"
]
```
Where:
- `a`: Ask [price, whole lot volume, lot volume]
- `b`: Bid [price, whole lot volume, lot volume]
- `c`: Last trade closed [price, lot volume]

### Kafka Message Format (Internal)

Data published to Kafka is formatted as:
```json
{
  "symbol": "XBTUSD",
  "timestamp": "2025-05-16T12:00:01.123Z",
  "bid": 64350.55,
  "ask": 64360.10
}
```

### WebSocket Client Format (Output)

Data sent to WebSocket clients is the same as the Kafka message format:
```json
{
  "symbol": "XBTUSD",
  "timestamp": "2025-05-16T12:00:01.123Z",
  "bid": 64350.55,
  "ask": 64360.10
}
```

## Environment Variables

- `KRAKEN_WS_URL`: Kraken WebSocket URL (default: wss://ws.kraken.com)
- `KAFKA_BROKER`: Kafka broker address (default: localhost:9092)
- `KAFKA_TOPIC`: Kafka topic name (default: quotes.crypto)
- `WS_PORT`: WebSocket server port (default: 8080)
- `CRYPTO_PAIRS`: Comma-separated list of crypto pairs to track (default: XBT/USD,ETH/USD)

## Troubleshooting

### Docker Networking Issues

If containers can't communicate with each other, make sure they're on the same network:
```
docker network create crypto-network
```

And ensure containers are connected to this network in the docker-compose.yml file.

### Kraken WebSocket Connection Issues

If you're seeing errors with the Kraken WebSocket connection, verify:
1. You're using the correct API format for subscriptions
2. The crypto pair symbols are valid
3. Your internet connection can access the Kraken WebSocket API

### WebSocket Client Connection Issues

If clients can't connect to the WebSocket server:
1. Verify the port mapping is correct in the Docker setup (8080:8080)
2. Check if the WebSocket server is running on the expected port
3. Ensure your client is using the correct WebSocket URL (ws://localhost:8080)

## Project Structure

```
├── src/                      # Source code
│   ├── index.js              # Main application entry point
│   ├── krakenClient.js       # Kraken WebSocket client
│   ├── kafkaProducer.js      # Kafka producer
│   ├── kafkaConsumer.js      # Kafka consumer
│   ├── wsServer.js           # WebSocket server
│   └── standalone.js         # Standalone test without Kafka
├── test-client.js            # WebSocket test client
├── docker-compose.yml        # Docker Compose configuration
├── Dockerfile                # Docker image configuration
├── start.sh                  # Startup script for Docker
├── package.json              # Node.js dependencies
└── .env                      # Environment variables
``` 