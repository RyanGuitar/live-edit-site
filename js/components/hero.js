// js/components/hero.js
export function Hero(elements) {
  return `
        <section class="hero" style="text-align: center; padding: 20px;">
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

            <!-- Photo Component -->
            <div class="photo-container" style="margin-top: 20px;">
                <img 
                    id="hero-img-display"
                    src="${elements["hero-image"].value}" 
                    alt="Hero Media" 
                    style="max-width: 100%; max-height: 400px; border-radius: 8px; object-fit: cover;"
                />
                <br />
                <input 
                    type="file" 
                    id="photo-file-input" 
                    accept="image/*" 
                    capture="environment" 
                    style="display: none;" 
                />
                <button 
                    id="photo-upload-btn" 
                    style="margin-top: 10px; padding: 10px 20px; font-size: 16px; cursor: pointer;"
                >
                    📷 Take / Upload Photo
                </button>
            </div>
        </section>
    `;
}
