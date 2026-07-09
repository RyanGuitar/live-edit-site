// server.js
import http from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { WebSocketServer } from "ws";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 8080;

// 1. Create standard HTTP server to serve static frontend files
const server = http.createServer((req, res) => {
  let filePath = path.join(__dirname, req.url === "/" ? "index.html" : req.url);
  const extname = path.extname(filePath);

  let contentType = "text/html";
  if (extname === ".js") contentType = "text/javascript";
  if (extname === ".css") contentType = "text/css";

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404);
      res.end("File Not Found");
    } else {
      res.writeHead(200, { "Content-Type": contentType });
      res.end(content, "utf-8");
    }
  });
});

// 2. Attach WebSocket server to the same HTTP server
const wss = new WebSocketServer({ server, maxPayload: 10 * 1024 * 1024 });

wss.on("connection", (ws) => {
  console.log("⚡ Client connected globally");

  ws.on("message", (message) => {
    wss.clients.forEach((client) => {
      if (client !== ws && client.readyState === 1) {
        client.send(message.toString());
      }
    });
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Live Edit Engine running on port ${PORT}`);
});
