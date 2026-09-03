import type { Rule } from "../schema.ts";

export const speechSynthesis: Rule = {
  id: "speech-synthesis",
  title: "Text to speech",
  replaces: ["speak-tts"],
  featureIds: ["speech-synthesis"],
  native: "SpeechSynthesis and SpeechSynthesisUtterance",
  human: {
    explainer:
      "speak-tts is a queueing and promise layer over the browser's own SpeechSynthesis API. The browser already exposes every installed system voice and a speaking queue; the wrapper mostly makes calling it feel more like a promise.",
    snippet: `const utterance = new SpeechSynthesisUtterance("Hello there");
speechSynthesis.speak(utterance);`,
    mdnUrl: "https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis",
  },
  agent: {
    when: "reading text aloud with the browser's own text-to-speech engine",
    unless: [
      "You need a specific voice bundled with your app rather than whatever the person's operating system happens to have installed. Voice availability and quality vary by device.",
      "You need the callback-based API wrapped in a promise, or queueing logic across multiple utterances. The library still saves real code there.",
    ],
    snippet: "speechSynthesis.speak(new SpeechSynthesisUtterance(text));",
  },
};
