import { spawnSync } from "node:child_process";
import {
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { findPackageJson, resolveTarget } from "./bin.ts";

const ownVersion = (
  JSON.parse(
    readFileSync(resolve(import.meta.dirname, "../package.json"), "utf8"),
  ) as { version: string }
).version;

const binPath = resolve(import.meta.dirname, "bin.ts");

// Creating a symlink needs no special privilege on POSIX, but does on
// Windows without Developer Mode or an elevated shell. Probed once at
// module load so the symlink describe block below can skip cleanly there
// instead of failing every contributor's local run on that platform.
const canSymlink = (() => {
  const probeDir = mkdtempSync(
    join(tmpdir(), "youmightnotneed-symlink-probe-"),
  );
  try {
    symlinkSync(join(probeDir, "target"), join(probeDir, "link"));
    return true;
  } catch {
    return false;
  } finally {
    rmSync(probeDir, { recursive: true, force: true });
  }
})();

let dir: string;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "youmightnotneed-cli-test-"));
});

afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

describe("resolveTarget", () => {
  it("accepts a path literally named package.json", () => {
    const file = join(dir, "package.json");
    writeFileSync(file, "{}");
    expect(resolveTarget(file)).toBe(file);
  });

  it("accepts a directory containing a package.json", () => {
    const file = join(dir, "package.json");
    writeFileSync(file, "{}");
    expect(resolveTarget(dir)).toBe(file);
  });

  it("accepts a file under any other name", () => {
    const file = join(dir, "some-other-name.json");
    writeFileSync(file, "{}");
    expect(resolveTarget(file)).toBe(file);
  });
});

describe("findPackageJson", () => {
  it("walks up from a nested directory to find package.json", () => {
    const file = join(dir, "package.json");
    writeFileSync(file, "{}");
    const nested = join(dir, "a", "b", "c");
    expect(findPackageJson(nested)).toBe(file);
  });

  it("returns null when nothing is found before the filesystem root", () => {
    // A directory with no package.json anywhere above it in this sandbox.
    expect(findPackageJson("/")).toBeNull();
  });
});

describe("entry point detection via direct invocation", () => {
  // The ordinary, non-symlinked path: `node bin.ts` directly, the way
  // pnpm's own "start" script runs it. Guards the pathToFileURL()
  // rewrite against a regression on the common case, not just the
  // symlink case below.
  it("runs main() when invoked directly", () => {
    const result = spawnSync(process.execPath, [binPath, "--version"], {
      encoding: "utf8",
    });

    expect(result.status).toBe(0);
    expect(result.stdout.trim()).toBe(ownVersion);
  });
});

describe.skipIf(!canSymlink)("entry point detection through a symlink", () => {
  // npm and npx never invoke a package's bin directly. They run it through a
  // symlink in node_modules/.bin, which import.meta.url reports dereferenced
  // while argv[1] stays the symlink path. Comparing the two without
  // realpathSync() makes the CLI silently no-op under every real npm/npx
  // invocation, which is exactly how this regressed once already.
  let link: string;

  beforeEach(() => {
    link = join(dir, "youmightnotneed");
    symlinkSync(binPath, link);
  });

  it("runs main() when invoked through a node_modules/.bin-style symlink", () => {
    const result = spawnSync(process.execPath, [link, "--version"], {
      encoding: "utf8",
    });

    expect(result.status).toBe(0);
    expect(result.stdout.trim()).toBe(ownVersion);
  });

  it("still exits non-zero for an unknown option through the symlink", () => {
    const result = spawnSync(process.execPath, [link, "--bogus"], {
      encoding: "utf8",
    });

    expect(result.status).toBe(2);
  });
});
