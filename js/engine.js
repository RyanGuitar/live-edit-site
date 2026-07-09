// js/engine.js
import { state } from "./state.js";
import { render } from "./renderer.js";
import { sync } from "./sync.js";
import { webrtc } from "./webrtc.js";

class Engine {
  constructor() {
    // Voice Note State
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.isRecording = false;

    // Live Broadcast State
    this.liveStream = null;
    this.isBroadcasting = false;
  }

  start() {
    sync.init((updatedKey) => {
      console.log(`[Realtime Remote Update]: ${updatedKey}`);
      this.render();
    });

    // Bridge: Listen for WebRTC signals coming through our Sync lane
    window.addEventListener("webrtc-signal-received", async (e) => {
      const signal = e.detail;

      if (signal.type === "offer") {
        // Tourist: Receive the guide's offer and send back an answer
        await webrtc.handleOffer(signal.offer);
      } else if (signal.type === "answer") {
        // Guide: Receive the tourist's answer to finalize connection
        await webrtc.peerConnection.setRemoteDescription(
          new RTCSessionDescription(signal.answer)
        );
      } else if (signal.type === "candidate") {
        // Both: Add network route candidates as they arrive
        await webrtc.peerConnection.addIceCandidate(
          new RTCIceCandidate(signal.candidate)
        );
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
            // Request mic access and hold it open
            this.liveStream = await navigator.mediaDevices.getUserMedia({
              audio: true,
            });
            this.isBroadcasting = true;

            // Trigger the WebRTC broadcast
            await webrtc.startBroadcasting(this.liveStream);

            // Update UI
            broadcastBtn.textContent = "🛑 Stop Live Stream";
            broadcastBtn.style.background = "#e74c3c";
            if (broadcastStatus)
              broadcastStatus.textContent = "📡 Mic is live. Broadcasting...";

            // Notify the network that a stream has started
            sync.broadcastChange("live-stream-status", "active");
          } catch (err) {
            console.error("Microphone access error for broadcast:", err);
            alert("Microphone permission required to start the live stream.");
          }
        } else {
          // Turn off all audio tracks to stop the mic
          if (this.liveStream) {
            this.liveStream.getTracks().forEach((track) => track.stop());
            this.liveStream = null;
          }
          this.isBroadcasting = false;

          // Update UI
          broadcastBtn.textContent = "🎤 Start Live Stream";
          broadcastBtn.style.background = "#3498db";
          if (broadcastStatus) broadcastStatus.textContent = "Stream ended.";

          // Notify the network that the stream has stopped
          sync.broadcastChange("live-stream-status", "inactive");
        }
      });
    }
  }
}

export const engine = new Engine();
