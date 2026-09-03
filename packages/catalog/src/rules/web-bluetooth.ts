import type { Rule } from "../schema.ts";

export const webBluetooth: Rule = {
  id: "web-bluetooth",
  title: "Bluetooth device access",
  replaces: ["@capacitor-community/bluetooth-le", "cordova-plugin-ble-central"],
  featureIds: ["web-bluetooth"],
  native: "navigator.bluetooth.requestDevice()",
  human: {
    explainer:
      "Talking to a Bluetooth peripheral from a web app used to mean wrapping the page in a native shell such as Cordova or Capacitor and reaching for a plugin that called into the operating system's own Bluetooth stack. A page running directly in a supporting browser can request a device, connect to its GATT services, and read or write characteristics with no native wrapper at all. This is a narrower case than most of this catalog. It replaces the native-app packaging step these plugins exist for, rather than a JavaScript library doing work the browser could already do.",
    snippet: `const device = await navigator.bluetooth.requestDevice({
  acceptAllDevices: true,
});
const server = await device.gatt.connect();`,
    mdnUrl:
      "https://developer.mozilla.org/en-US/docs/Web/API/Web_Bluetooth_API",
  },
  agent: {
    when: "connecting to a Bluetooth Low Energy device directly from a web page",
    unless: [
      "You need to support iOS in any browser. Apple has stated it has no plans to implement Web Bluetooth. That gap is permanent for iPhone and iPad users.",
      "You need background scanning or a connection that survives the tab closing. The API only works while the page is open.",
      "You are already shipping a native app shell for other reasons. The plugin ecosystem is more mature for background operation and OS-level pairing UI.",
    ],
    snippet:
      "await navigator.bluetooth.requestDevice({ acceptAllDevices: true });",
  },
};
