// js/engine.js
import { state } from "./state.js";
import { render } from "./renderer.js";
import { sync } from "./sync.js";

class Engine {
  start() {
    // 1. Initialize real-time listener.
    // When a remote update comes in, re-render the app.
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
    const editables = document.querySelectorAll("[data-editable]");

    editables.forEach((el) => {
      el.contentEditable = "true";

      el.addEventListener("blur", () => {
        const key = el.dataset.element;

        if (key && state.elements[key]) {
          const newValue = el.textContent.trim();

          if (state.elements[key].value !== newValue) {
            // Update local state
            state.elements[key].value = newValue;

            // 2. Broadcast change to all active clients
            sync.broadcastChange(key, newValue);

            // Re-render locally
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
  }
}

export const engine = new Engine();
