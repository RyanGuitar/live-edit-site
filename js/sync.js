// js/sync.js
import { state } from "./state.js";

class Sync {
  constructor() {
    this.socket = null;
    this.onUpdate = null;
  }

  init(onUpdateCallback) {
    this.onUpdate = onUpdateCallback;

    // Dynamically use wss:// for HTTPS (Render) or ws:// for local development
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}`;

    this.socket = new WebSocket(wsUrl);

    this.socket.onopen = () => {
      console.log("✅ Connected to Unified Global Sync Engine");
    };

    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        // Lane 1: UI State Synchronization
        if (data.type === "state-sync") {
          if (data.key && state.elements[data.key]) {
            state.elements[data.key].value = data.value;
            if (this.onUpdate) this.onUpdate(data.key);
          }
        }
        // Lane 2: WebRTC Signaling for Live Media
        else if (data.type === "webrtc-signal") {
          // Dispatch a custom event so our WebRTC logic can listen for handshakes
          window.dispatchEvent(
            new CustomEvent("webrtc-signal-received", { detail: data.payload })
          );
        }
      } catch (err) {
        console.error("Failed to parse sync payload:", err);
      }
    };

    this.socket.onclose = () => {
      console.log("⚠️ Sync Engine connection closed. Retrying in 3 seconds...");
      setTimeout(() => this.init(this.onUpdate), 3000);
    };
  }

  // Broadcast standard UI changes (Text, Images, Recorded Voice Notes)
  broadcastChange(key, value) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      const payload = {
        type: "state-sync",
        key: key,
        value: value,
      };
      this.socket.send(JSON.stringify(payload));
    }
  }

  // Broadcast lightning-fast WebRTC handshakes
  broadcastSignal(signalData) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      const payload = {
        type: "webrtc-signal",
        payload: signalData,
      };
      this.socket.send(JSON.stringify(payload));
    }
  }
}

export const sync = new Sync();
