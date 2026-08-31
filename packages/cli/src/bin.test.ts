import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { findPackageJson, resolveTarget } from "./bin.ts";

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

describe("entry point detection through a symlink", () => {
  // npm and npx never invoke a package's bin directly. They run it through a
  // symlink in node_modules/.bin, which import.meta.url reports dereferenced
  // while argv[1] stays the symlink path. Comparing the two without
  // realpathSync() makes the CLI silently no-op under every real npm/npx
  // invocation, which is exactly how this regressed once already.
  it("runs main() when invoked through a node_modules/.bin-style symlink", () => {
    const link = join(dir, "youmightnotneed");
    symlinkSync(resolve(import.meta.dirname, "bin.ts"), link);

    const result = spawnSync(process.execPath, [link, "--version"], {
      encoding: "utf8",
    });

    expect(result.status).toBe(0);
    expect(result.stdout.trim().length).toBeGreaterThan(0);
  });

  it("still exits non-zero for an unknown option through the symlink", () => {
    const link = join(dir, "youmightnotneed");
    symlinkSync(resolve(import.meta.dirname, "bin.ts"), link);

    const result = spawnSync(process.execPath, [link, "--bogus"], {
      encoding: "utf8",
    });

    expect(result.status).toBe(2);
  });
});
