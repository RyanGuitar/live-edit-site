export function Hero(elements) {
  const audioSrc = elements["hero-audio"].value;

  return `
        <section class="hero" style="text-align: center; padding: 20px;">
            <h1 data-element="hero-title" data-editable>${elements["hero-title"].value}</h1>
            <p data-element="hero-subtitle" data-editable>${elements["hero-subtitle"].value}</p>

            <!-- Photo Component -->
            <div class="photo-container" style="margin-top: 20px;">
                <img id="hero-img-display" src="${elements["hero-image"].value}" style="max-width: 100%; max-height: 400px; border-radius: 8px; object-fit: cover;"/>
                <br />
                <input type="file" id="photo-file-input" accept="image/*" capture="environment" style="display: none;" />
                <button id="photo-upload-btn" class="no-select" style="margin-top: 10px; padding: 10px 20px; font-size: 16px; cursor: pointer; border-radius: 5px;">
                    📷 Take / Upload Photo
                </button>
            </div>

            <!-- Voice Note Component -->
            <div class="audio-container" style="margin-top: 25px; padding: 15px; border: 1px dashed #ccc; border-radius: 8px; display: inline-block;">
                <h3>🎙️ Live Voice Message</h3>
                
                <button id="record-audio-btn" class="no-select" style="padding: 10px 20px; font-size: 16px; cursor: pointer; background: #e74c3c; color: white; border: none; border-radius: 5px;">
                    🔴 Tap to Record Voice Note
                </button>
                <p id="recording-status" style="margin: 5px 0; font-size: 14px; color: #666;"></p>

                <div style="margin-top: 10px;">
                    <audio id="audio-player" controls src="${audioSrc}" style="${audioSrc ? "display: block;" : "display: none;"} margin: 10px auto;"></audio>
                </div>
            </div>
        </section>
    `;
}
