// js/state.js
export const state = {
  elements: {
    "hero-title": {
      type: "text",
      value: "Welcome to Gansbaai",
      editable: true,
    },
    "hero-subtitle": {
      type: "text",
      value: "Book your shark cage diving experience directly on this page.",
      editable: true,
    },
    "about-text": {
      type: "text",
      value:
        "We offer authentic, small-group coastal tours and shark spotter charters.",
      editable: true,
    },
    "hero-image": {
      type: "image",
      value: "https://via.placeholder.com/800x400?text=Upload+Photo",
      editable: true,
    },
    "hero-audio": {
      type: "audio",
      value: "", // Holds base64 audio data string
      editable: true,
    },
  },
};
