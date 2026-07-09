// js/sync.js
import { state } from "./state.js";

class SyncEngine {
  constructor() {
    // Automatically match ws:// or wss:// based on current protocol
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.host;

    this.socket = new WebSocket(`${protocol}//${host}`);

    this.socket.onopen = () => {
      console.log("⚡ Connected to Global Sync Engine");
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
