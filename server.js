const express = require("express");
const http = require("http");
const { WebSocketServer } = require("ws");
const path = require("path");

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Serve your static vanilla files
app.use(express.static(path.join(__dirname, "public")));

wss.on("connection", (ws) => {
  console.log("🔗 Client connected");

  ws.on("message", (message) => {
    try {
      const data = JSON.parse(message);

      // Traffic Cop: Route the message based on its type
      if (data.type === "state-sync") {
        // Lane 1: Heavy UI updates (Images, Text, Voice Notes)
        wss.clients.forEach((client) => {
          if (client !== ws && client.readyState === 1) {
            client.send(JSON.stringify(data));
          }
        });
      } else if (data.type === "webrtc-signal") {
        // Lane 2: Lightning-fast WebRTC handshakes for live streaming
        wss.clients.forEach((client) => {
          if (client !== ws && client.readyState === 1) {
            client.send(JSON.stringify(data));
          }
        });
      }
    } catch (error) {
      console.error("Error parsing message:", error);
    }
  });

  ws.on("close", () => {
    console.log("❌ Client disconnected");
  });
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
  console.log(`🚀 Unified Engine & Signaling server running on port ${PORT}`);
});
