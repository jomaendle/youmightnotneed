import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
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
