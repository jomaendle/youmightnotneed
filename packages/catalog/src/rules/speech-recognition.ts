import type { Rule } from "../schema.ts";

export const speechRecognition: Rule = {
  id: "speech-recognition",
  title: "Voice input",
  replaces: ["annyang", "react-speech-recognition"],
  featureIds: ["speech-recognition"],
  native: "SpeechRecognition",
  human: {
    explainer:
      "annyang and react-speech-recognition both wrap the same underlying API, adding phrase matching or restart-on-silence logic around it. The API itself lets a page listen for speech and get back a transcript, with no server round-trip for the recognition step in Chromium's implementation.",
    snippet: `const recognition = new SpeechRecognition();
recognition.onresult = (event) => {
  console.log(event.results[0][0].transcript);
};
recognition.start();`,
    mdnUrl:
      "https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition",
  },
  agent: {
    when: "capturing a speech-to-text transcript directly in the browser",
    unless: [
      "You need this outside Chrome or Edge. No other engine ships SpeechRecognition, so this is Chromium-only in practice today.",
      "You need continuous recognition that automatically restarts after the browser's built-in silence timeout. That restart logic is exactly what these libraries still add.",
      "You need offline recognition. Chrome's implementation sends audio to Google's servers for transcription.",
    ],
    snippet: `const recognition = new SpeechRecognition();
recognition.start();`,
  },
};
