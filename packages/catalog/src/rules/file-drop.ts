import type { Rule } from "../schema.ts";

export const fileDrop: Rule = {
  id: "file-drop",
  title: "File pickers and drop zones",
  category: "forms",
  replaces: ["react-dropzone", "dropzone"],
  featureIds: ["input-file", "input-file-multiple", "draganddrop"],
  native: '<input type="file"> with drop events',
  human: {
    explainer:
      "A file input already handles choosing files, restricting types through accept, taking several through multiple, and opening the camera on a phone through capture. Adding drag and drop to it is two listeners: preventDefault on dragover so the browser stops treating the drop as navigation, and reading event.dataTransfer.files on drop. What the libraries add on top is previews, validation and upload orchestration.",
    snippet: `<input type="file" id="picker" accept="image/*" multiple>

<script>
  const zone = document.getElementById("zone");

  // Required, or the browser navigates to the dropped file.
  zone.addEventListener("dragover", (event) => event.preventDefault());

  zone.addEventListener("drop", (event) => {
    event.preventDefault();
    handleFiles(event.dataTransfer.files);
  });
</script>`,
    mdnUrl:
      "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/file",
  },
  agent: {
    when: "letting someone pick or drop files",
    unless: [
      "You accept dropped folders and walk their contents. That needs webkitGetAsEntry on the dropped items, which the drop event exposes but does not traverse for you, and the recursion is real work.",
      "You want upload progress, chunking, retries or a queue. dropzone does the transfer as well as the picking, and none of that comes from the input.",
      "You render thumbnails and per-file validation state. Reading the files is the easy half; the preview list and its error handling is most of what these libraries are.",
      "You need the drop target to accept files dragged from another application on some older targets, where dataTransfer.items behaves inconsistently.",
    ],
    snippet:
      'zone.addEventListener("dragover", (e) => e.preventDefault());\nzone.addEventListener("drop", (e) => { e.preventDefault(); use(e.dataTransfer.files); });',
    handRolled: [
      "a hidden file input triggered by click() from a styled button, wrapped in a component that forwards the change event",
      "dragenter and dragleave counters kept in state to work out whether the pointer is still over the drop zone",
    ],
  },
};
