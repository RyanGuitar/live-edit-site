import { state } from "./state.js";
import { render } from "./renderer.js";
import { sync } from "./sync.js";

class Engine {
  constructor() {
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.isRecording = false;
  }

  start() {
    sync.init((updatedKey) => {
      console.log(`[Realtime Remote Update]: ${updatedKey}`);
      this.render();
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
    const fileInput = document.querySelector("#photo-file-input"); // Explicitly defined

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
            recordBtn.textContent = "⏹️ Stop & Send Voice Note";
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
  }
}

export const engine = new Engine();
