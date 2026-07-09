// js/engine.js
import { state } from "./state.js";
import { render } from "./renderer.js";
import { sync } from "./sync.js";

class Engine {
  start() {
    // Listen for remote updates globally
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
    const fileInput = document.querySelector("#photo-file-input");

    if (uploadBtn && fileInput) {
      uploadBtn.addEventListener("click", () => {
        fileInput.click();
      });

      fileInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
          const base64Image = event.target.result;
          const key = "hero-image";

          // Update local state
          state.elements[key].value = base64Image;

          // Broadcast image payload across WebSockets
          sync.broadcastChange(key, base64Image);

          // Re-render locally
          this.render();
        };

        // Read photo directly into Base64 format
        reader.readAsDataURL(file);
      });
    }
  }
}

export const engine = new Engine();
