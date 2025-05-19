const WebSocket = require('ws');
require('dotenv').config();

class WebSocketServer {
  constructor() {
    this.port = process.env.WS_PORT || 8080;
    this.wss = null;
    this.clients = new Set();
  }

  start() {
    this.wss = new WebSocket.Server({ port: this.port });
    console.log(`WebSocket server running on ws://localhost:${this.port}`);

    this.wss.on('connection', (ws, req) => {
      const clientIp = req.socket.remoteAddress;
      console.log(`New client connected from ${clientIp}`);
      
      // Mark the connection as alive for ping/pong
      ws.isAlive = true;
      ws.on('pong', () => {
        ws.isAlive = true;
      });
      
      this.clients.add(ws);

      ws.on('close', () => {
        console.log(`Client disconnected from ${clientIp}`);
        this.clients.delete(ws);
      });

      ws.on('error', (error) => {
        console.error(`WebSocket error for client ${clientIp}:`, error);
        this.clients.delete(ws);
      });

      // Send a welcome message
      ws.send(JSON.stringify({
        type: 'info',
        message: 'Connected to crypto market data pipeline'
      }));
    });

    this.wss.on('error', (error) => {
      console.error('WebSocket server error:', error);
    });
    
    // Set up ping interval to detect stale connections
    this.heartbeatInterval = setInterval(() => {
      this.clients.forEach((ws) => {
        if (ws.isAlive === false) {
          console.log('Terminating stale connection');
          ws.terminate();
          this.clients.delete(ws);
          return;
        }
        
        ws.isAlive = false;
        try {
          ws.ping();
        } catch (err) {
          console.error('Error pinging client:', err);
          ws.terminate();
          this.clients.delete(ws);
        }
      });
    }, 30000); // Check every 30 seconds
  }

  broadcast(data) {
    let broadcastCount = 0;
    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(JSON.stringify(data));
          broadcastCount++;
        } catch (err) {
          console.error('Error sending message to client:', err);
          client.terminate();
          this.clients.delete(client);
        }
      }
    });
    
    if (broadcastCount > 0) {
      console.log(`Broadcasted message to ${broadcastCount} client(s)`);
    }
  }
  
  stop() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    
    if (this.wss) {
      this.wss.close();
      console.log('WebSocket server stopped');
    }
  }
}

module.exports = WebSocketServer; 