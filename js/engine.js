// js/engine.js
import { state } from "./state.js";
import { render } from "./renderer.js";
import { sync } from "./sync.js";
import { webrtc } from "./webrtc.js";

class Engine {
  constructor() {
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.isRecording = false;

    this.liveStream = null;
    this.isBroadcasting = false;
  }

  start() {
    sync.init((updatedKey) => {
      console.log(`[Realtime Remote Update]: ${updatedKey}`);
      this.render();
    });

    // Bridge: Listen for targeted WebRTC mesh signals
    window.addEventListener("webrtc-signal-received", async (e) => {
      const signal = e.detail;

      // Ignore targeted signals that are not meant for this specific device
      if (signal.target && signal.target !== webrtc.myId) return;

      try {
        if (signal.type === "stream-active") {
          // Viewer: Broadcaster just went live! Request an offer to connect.
          if (!webrtc.isBroadcaster) {
            sync.broadcastSignal({
              type: "request-offer",
              target: signal.sender,
              sender: webrtc.myId,
            });
          }
        } else if (signal.type === "request-offer") {
          // Broadcaster: A tourist wants to connect. Create a dedicated peer for them.
          if (webrtc.isBroadcaster) {
            await webrtc.createBroadcasterPeer(signal.sender);
          }
        } else if (signal.type === "offer") {
          // Viewer: Receive the guide's offer and send back an answer
          await webrtc.handleOffer(signal.offer, signal.sender, (stream) => {
            // Create or grab an audio element to actually play the sound
            let audioEl = document.getElementById("live-audio-playback");
            if (!audioEl) {
              audioEl = document.createElement("audio");
              audioEl.id = "live-audio-playback";
              audioEl.autoplay = true;
              document.body.appendChild(audioEl);
            }
            audioEl.srcObject = stream;
          });
        } else if (signal.type === "answer") {
          // Broadcaster: Receive the tourist's answer to finalize their specific connection
          await webrtc.handleAnswer(signal.answer, signal.sender);
        } else if (signal.type === "candidate") {
          // Both: Add network route candidates as they arrive
          await webrtc.handleCandidate(signal.candidate, signal.sender);
        }
      } catch (err) {
        console.error("WebRTC Signaling Error:", err);
      }
    });

    this.render();
  }

  render() {
    render(state);
    this.attachEvents();
  }

  attachEvents() {
    // 1. Text Editing Listeners
    const editables = document.querySelectorAll("[data-editable]");
    editables.forEach((el) => {
      el.contentEditable = "true";
      el.addEventListener("blur", () => {
        const key = el.dataset.element;
        if (key && state.elements[key]) {
          const newValue = el.textContent.trim();
          if (state.elements[key].value !== newValue) {
            state.elements[key].value = newValue;
            sync.broadcastChange(key, newValue);
            this.render();
          }
        }
      });
      el.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && el.tagName.startsWith("H")) {
          e.preventDefault();
          el.blur();
        }
      });
    });

    // 2. Image Upload Listeners
    const uploadBtn = document.querySelector("#photo-upload-btn");
    const fileInput = document.querySelector("#photo-file-input");

    if (uploadBtn && fileInput) {
      uploadBtn.addEventListener("click", () => fileInput.click());
      fileInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
          const base64Image = event.target.result;
          state.elements["hero-image"].value = base64Image;
          sync.broadcastChange("hero-image", base64Image);
          this.render();
        };
        reader.readAsDataURL(file);
      });
    }

    // 3. Voice Note Recording Listeners
    const recordBtn = document.querySelector("#record-audio-btn");
    const statusText = document.querySelector("#recording-status");

    if (recordBtn) {
      recordBtn.addEventListener("click", async () => {
        if (!this.isRecording) {
          try {
            const stream = await navigator.mediaDevices.getUserMedia({
              audio: true,
            });
            this.mediaRecorder = new MediaRecorder(stream);
            this.audioChunks = [];

            this.mediaRecorder.ondataavailable = (event) => {
              this.audioChunks.push(event.data);
            };

            this.mediaRecorder.onstop = () => {
              const audioBlob = new Blob(this.audioChunks, {
                type: "audio/webm",
              });
              const reader = new FileReader();

              reader.onload = (event) => {
                const base64Audio = event.target.result;
                state.elements["hero-audio"].value = base64Audio;
                sync.broadcastChange("hero-audio", base64Audio);
                this.render();
              };
              reader.readAsDataURL(audioBlob);
            };

            this.mediaRecorder.start();
            this.isRecording = true;
            recordBtn.textContent = "⏹️ Stop & Save Note";
            recordBtn.style.background = "#27ae60";
            if (statusText) statusText.textContent = "🎙️ Recording audio...";
          } catch (err) {
            console.error("Microphone access error:", err);
            alert("Microphone permission required to record voice notes.");
          }
        } else {
          if (this.mediaRecorder && this.mediaRecorder.state !== "inactive") {
            this.mediaRecorder.stop();
          }
          this.isRecording = false;
          recordBtn.textContent = "🔴 Tap to Record Voice Note";
          recordBtn.style.background = "#e74c3c";
          if (statusText) statusText.textContent = "Processing audio...";
        }
      });
    }

    // 4. Live Broadcast Toggle Listeners
    const broadcastBtn = document.querySelector("#broadcast-toggle-btn");
    const broadcastStatus = document.querySelector("#broadcast-status");

    if (broadcastBtn) {
      broadcastBtn.addEventListener("click", async () => {
        if (!this.isBroadcasting) {
          try {
            this.liveStream = await navigator.mediaDevices.getUserMedia({
              audio: true,
            });
            this.isBroadcasting = true;

            // Trigger the WebRTC 1-to-many broadcast
            await webrtc.startBroadcasting(this.liveStream);

            // Update UI
            broadcastBtn.textContent = "🛑 Stop Live Stream";
            broadcastBtn.style.background = "#e74c3c";
            if (broadcastStatus)
              broadcastStatus.textContent =
                "📡 Mic is live. Broadcasting to all viewers...";

            sync.broadcastChange("live-stream-status", "active");
          } catch (err) {
            console.error("Microphone access error for broadcast:", err);
            alert("Microphone permission required to start the live stream.");
          }
        } else {
          // Stop broadcast and clean up all peer connections
          webrtc.stopBroadcasting();

          if (this.liveStream) {
            this.liveStream.getTracks().forEach((track) => track.stop());
            this.liveStream = null;
          }
          this.isBroadcasting = false;

          // Update UI
          broadcastBtn.textContent = "🎤 Start Live Stream";
          broadcastBtn.style.background = "#3498db";
          if (broadcastStatus) broadcastStatus.textContent = "Stream ended.";

          sync.broadcastChange("live-stream-status", "inactive");
        }
      });
    }
  }
}

export const engine = new Engine();
