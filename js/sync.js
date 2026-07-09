// js/sync.js
import { state } from "./state.js";

class SyncEngine {
  constructor() {
    // Automatically set socket URL depending on environment
    const isLocal =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";

    // Replace this URL with your hosted server domain later (e.g., wss://my-sync-server.onrender.com)
    const productionServerUrl = "wss://your-websocket-server-name.onrender.com";

    const socketUrl = isLocal
      ? `ws://${window.location.hostname}:8080`
      : productionServerUrl;

    this.socket = new WebSocket(socketUrl);

    this.socket.onopen = () => {
      console.log("⚡ Connected to Global Sync Engine");
    };

    this.socket.onerror = (err) => {
      console.error("WebSocket Error:", err);
    };
  }

  init(onRemoteUpdate) {
    this.socket.onmessage = (event) => {
      try {
        const { key, value } = JSON.parse(event.data);

        if (key && state.elements[key]) {
          state.elements[key].value = value;

          if (onRemoteUpdate) {
            onRemoteUpdate(key);
          }
        }
      } catch (err) {
        console.error("Failed to parse sync payload:", err);
      }
    };
  }

  broadcastChange(key, value) {
    if (this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(
        JSON.stringify({
          key,
          value,
          timestamp: Date.now(),
        })
      );
    }
  }
}

export const sync = new SyncEngine();
