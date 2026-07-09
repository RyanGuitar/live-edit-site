// js/components/hero.js
export function Hero(elements) {
  return `
        <section class="hero">
            <h1 
                data-element="hero-title" 
                data-editable
            >
                ${elements["hero-title"].value}
            </h1>
            <p 
                data-element="hero-subtitle" 
                data-editable
            >
                ${elements["hero-subtitle"].value}
            </p>
        </section>
    `;
}
