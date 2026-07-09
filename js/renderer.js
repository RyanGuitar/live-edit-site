// js/renderer.js
import { Hero } from "./components/hero.js";

export function render(state) {
  const app = document.querySelector("#app");

  // Pass the flat elements dictionary to the components
  app.innerHTML = `
        ${Hero(state.elements)}
        <section class="about">
            <p data-element="about-text" data-editable>
                ${state.elements["about-text"].value}
            </p>
        </section>
    `;
}
