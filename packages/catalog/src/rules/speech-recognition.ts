import type { Rule } from "../schema.ts";

export const speechRecognition: Rule = {
  id: "speech-recognition",
  title: "Voice input",
  replaces: ["annyang", "react-speech-recognition"],
  featureIds: ["speech-recognition"],
  native: "SpeechRecognition",
  human: {
    explainer:
      "annyang and react-speech-recognition both wrap the same underlying API, adding phrase matching or restart-on-silence logic around it. The API itself lets a page listen for speech and hands back a transcript with confidence scores. The constructor is the one part worth copying carefully: the unprefixed name only arrived in Chrome {{chrome:speech-recognition}}, and Safari has exposed it as webkitSpeechRecognition for years, so read both off the window before calling it.",
    snippet: `// Unprefixed is Chrome {{chrome:speech-recognition}} and up. Safari has only
// the prefixed name,
// and reading it off window avoids a ReferenceError everywhere else.
const SpeechRecognitionCtor =
  window.SpeechRecognition ?? window.webkitSpeechRecognition;

if (SpeechRecognitionCtor) {
  const recognition = new SpeechRecognitionCtor();
  recognition.onresult = (event) => {
    console.log(event.results[0][0].transcript);
  };
  recognition.start();
}`,
    mdnUrl:
      "https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition",
  },
  agent: {
    when: "capturing a speech-to-text transcript directly in the browser",
    unless: [
      "You want one constructor name that works everywhere. The unprefixed SpeechRecognition is Chrome and Edge {{chrome:speech-recognition}} and up, Safari has only webkitSpeechRecognition, and Firefox ships neither, so the feature detection is yours to write.",
      "You need continuous recognition that automatically restarts after the browser's built-in silence timeout. That restart logic is exactly what these libraries still add.",
      "You need recognition to stay on the device. Chrome sends audio to Google's servers by default, and on-device transcription is a separate opt-in rather than the behaviour you get for free.",
    ],
    snippet: `const Ctor = window.SpeechRecognition ?? window.webkitSpeechRecognition;
if (Ctor) new Ctor().start();`,
  },
};
