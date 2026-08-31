#!/usr/bin/env node
// Runs after `npm install youmightnotneed`. Points a fresh install at the one
// command that always works, since a bare `youmightnotneed` only works after
// a global install and that trips people up.
import { resolve } from "node:path";

function isDirectInstall() {
  const initCwd = process.env.INIT_CWD;
  if (!initCwd) return false;

  // Installed as a dependency of some other package: this script's own
  // package directory sits under that package's node_modules, not under
  // INIT_CWD directly. import.meta.dirname is .../youmightnotneed/scripts.
  const packageDir = resolve(import.meta.dirname, "..");
  return resolve(initCwd, "node_modules", "youmightnotneed") === packageDir;
}

if (!process.env.CI && isDirectInstall()) {
  console.info(
    "\nyoumightnotneed installed. Run it with: npx youmightnotneed\n",
  );
}
