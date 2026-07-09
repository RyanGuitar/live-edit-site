// server.js
import { WebSocketServer } from "ws";

// Use host-provided PORT or fallback to 8080 for local dev
const PORT = process.env.PORT || 8080;

const wss = new WebSocketServer({ port: PORT });

console.log(`🚀 Realtime Sync Server live on port ${PORT}`);

wss.on("connection", (ws) => {
  console.log("⚡ Client connected globally");

  ws.on("message", (message) => {
    // Relay edit to all other active clients across the globe
    wss.clients.forEach((client) => {
      if (client !== ws && client.readyState === 1) {
        client.send(message.toString());
      }
    });
  });

  ws.on("close", () => {
    console.log("❌ Client disconnected");
  });
});
