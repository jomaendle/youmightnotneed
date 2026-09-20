import type { Rule } from "../schema.ts";

export const fileDownload: Rule = {
  id: "file-download",
  title: "Saving a generated file",
  category: "async-data",
  replaces: ["file-saver", "downloadjs", "js-file-download"],
  featureIds: ["download", "file"],
  native: "a Blob object URL on a download link",
  human: {
    explainer:
      "file-saver was written when saving a blob meant branching across engines, including an msSaveBlob path for old IE and Edge. What is left once those are gone is four lines: make a Blob, turn it into an object URL, click a link carrying the download attribute, then revoke the URL. The attribute also supplies the filename, which is the part people usually reach for the library to get.",
    snippet: `function save(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  // Revoke, or the blob is held in memory until the document goes. Deferred
  // rather than immediate: revoking in the same task cancels the save in
  // some engines, because the fetch behind the download has not started.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

save(new Blob([csv], { type: "text/csv" }), "report.csv");`,
    mdnUrl:
      "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a#download",
  },
  agent: {
    when: "offering a file the page generated for the user to save",
    unless: [
      "The file is larger than memory allows. A Blob is held in memory, so streaming a big export to disk needs the File System Access API, which is not Baseline.",
      "The link points at another origin. The download attribute is ignored cross-origin, so the browser navigates to the file instead of saving it, and object URLs are same-origin so this only applies when the href is a remote one.",
      "You run inside a WebView or an in-app browser that ignores the attribute. Several do, and the library's fallbacks are what papers over that.",
      "You support browsers below Chrome {{chrome:download}}, Firefox {{firefox:download}} or Safari {{safari:download}}. Safari supported the attribute considerably later than the others.",
    ],
    snippet:
      'const url = URL.createObjectURL(blob);\nObject.assign(document.createElement("a"), { href: url, download: name }).click();\nsetTimeout(() => URL.revokeObjectURL(url), 0);',
    handRolled: [
      "a data: URI assigned to window.location to trigger a save, which truncates on larger files",
      "a hidden iframe or form submitted to make the browser treat a response as a download",
    ],
  },
};
