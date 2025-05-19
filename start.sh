#!/bin/bash

echo "Starting Crypto Market Data Pipeline..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
  echo "Docker is not running. Please start Docker and try again."
  exit 1
fi

# Clean up any existing containers
echo "Cleaning up any existing containers..."
docker-compose down -v 2>/dev/null || true
docker rm -f crypto-market-data kafka zookeeper 2>/dev/null || true

# Build and start containers
echo "Building and starting containers..."
docker-compose build
docker-compose up -d

# Wait for containers to be ready
echo "Waiting for services to start..."
sleep 5

# Check if containers are running
if docker ps | grep -q crypto-market-data; then
  echo "Application container is running."
else
  echo "Error: Application container failed to start."
  docker-compose logs app
  exit 1
fi

if docker ps | grep -q kafka; then
  echo "Kafka container is running."
else
  echo "Error: Kafka container failed to start."
  docker-compose logs kafka
  exit 1
fi

echo "All services are running. Access WebSocket server at ws://localhost:8080"
echo "To view logs: docker-compose logs -f app"
echo "To stop services: docker-compose down" 