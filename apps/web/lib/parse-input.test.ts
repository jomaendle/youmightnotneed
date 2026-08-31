import { describe, expect, it } from "vitest";
import {
  parsePackageJson,
  parseRepoInput,
  rawPackageJsonUrl,
} from "./parse-input.ts";

describe("parsePackageJson", () => {
  it("reads a normal package.json", () => {
    const result = parsePackageJson(
      JSON.stringify({ name: "x", dependencies: { swiper: "^11.0.0" } }),
    );
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.pkg.dependencies?.swiper).toBe("^11.0.0");
  });

  it("accepts a bare dependency map", () => {
    const result = parsePackageJson('{"swiper":"^11.0.0","polished":"^4.3.1"}');
    expect(result.ok).toBe(true);
    if (result.ok)
      expect(Object.keys(result.pkg.dependencies ?? {})).toHaveLength(2);
  });

  it("rejects a package.json that simply has no dependencies", () => {
    // The values are all strings, which a looser check would read as two
    // dependencies named "name" and "version", reporting nothing found.
    const result = parsePackageJson(
      JSON.stringify({ name: "x", version: "1.0.0", license: "MIT" }),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("No dependencies");
  });

  it("accepts the protocol forms npm allows as a range", () => {
    for (const range of [
      "*",
      "latest",
      "workspace:*",
      "npm:react@19",
      "1.2.3",
    ]) {
      expect(parsePackageJson(JSON.stringify({ thing: range })).ok).toBe(true);
    }
  });

  it("reads devDependencies and peerDependencies", () => {
    expect(parsePackageJson('{"devDependencies":{"a":"1"}}').ok).toBe(true);
    expect(parsePackageJson('{"peerDependencies":{"a":"1"}}').ok).toBe(true);
  });

  it("explains itself on empty input, bad JSON and wrong shapes", () => {
    expect(parsePackageJson("   ")).toMatchObject({ ok: false });
    expect(parsePackageJson("{not json")).toMatchObject({ ok: false });
    expect(parsePackageJson("[]")).toMatchObject({ ok: false });
    expect(parsePackageJson('"a string"')).toMatchObject({ ok: false });
    expect(parsePackageJson("null")).toMatchObject({ ok: false });
  });

  it("refuses input too large to be a package.json", () => {
    const result = parsePackageJson(`{"a":"${"x".repeat(500_001)}"}`);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("too large");
  });

  it("survives a null dependency block", () => {
    expect(() => parsePackageJson('{"dependencies":null}')).not.toThrow();
  });
});

describe("parseRepoInput", () => {
  it("reads the owner/repo shorthand, dots in the repo included", () => {
    expect(parseRepoInput("vercel/next.js")).toEqual({
      owner: "vercel",
      repo: "next.js",
    });
  });

  it("reads a plain repository URL", () => {
    for (const input of [
      "https://github.com/o/r",
      "http://github.com/o/r",
      "github.com/o/r",
      "www.github.com/o/r",
      "https://github.com/o/r/",
    ]) {
      expect(parseRepoInput(input)).toEqual({ owner: "o", repo: "r" });
    }
  });

  it("does not read a host as an owner", () => {
    // github.com/vercel is a user page, not a repository. Treating the host as
    // the owner would send a request to raw.githubusercontent.com/github.com.
    expect(parseRepoInput("github.com/vercel")).toBeNull();
    expect(parseRepoInput("https://github.com/vercel")).toBeNull();
  });

  it("strips .git even when the URL also ends with a slash", () => {
    expect(parseRepoInput("https://github.com/o/r.git")).toEqual({
      owner: "o",
      repo: "r",
    });
    expect(parseRepoInput("https://github.com/o/r.git/")).toEqual({
      owner: "o",
      repo: "r",
    });
  });

  it("keeps everything after tree or blob so GitHub can resolve it", () => {
    // A ref and a subdirectory cannot be told apart here: a branch name may
    // contain a slash. The raw CDN resolves the split, so pass it through.
    expect(parseRepoInput("https://github.com/o/r/tree/main")).toEqual({
      owner: "o",
      repo: "r",
      path: "main",
    });
    expect(
      parseRepoInput("https://github.com/o/r/tree/main/packages/foo"),
    ).toEqual({ owner: "o", repo: "r", path: "main/packages/foo" });
    expect(parseRepoInput("https://github.com/o/r/tree/feature/login")).toEqual(
      {
        owner: "o",
        repo: "r",
        path: "feature/login",
      },
    );
  });

  it("drops a trailing package.json from a blob URL", () => {
    expect(
      parseRepoInput("https://github.com/o/r/blob/main/package.json"),
    ).toEqual({ owner: "o", repo: "r", path: "main" });
    expect(
      parseRepoInput("https://github.com/o/r/blob/main/apps/web/package.json"),
    ).toEqual({ owner: "o", repo: "r", path: "main/apps/web" });
  });

  it("ignores markers that are not tree or blob", () => {
    expect(parseRepoInput("https://github.com/o/r/issues/12")).toEqual({
      owner: "o",
      repo: "r",
    });
  });

  it("rejects anything that is not a GitHub repository", () => {
    for (const input of [
      "",
      "   ",
      "not a url",
      "https://gitlab.com/o/r",
      "https://example.com/o/r",
      "https://github.com",
      "ht!tp://[bad",
    ]) {
      expect(parseRepoInput(input)).toBeNull();
    }
  });
});

describe("rawPackageJsonUrl", () => {
  it("defaults to HEAD, which resolves the default branch", () => {
    expect(rawPackageJsonUrl({ owner: "o", repo: "r" })).toBe(
      "https://raw.githubusercontent.com/o/r/HEAD/package.json",
    );
  });

  it("passes a ref and subdirectory through untouched", () => {
    expect(
      rawPackageJsonUrl({ owner: "o", repo: "r", path: "main/packages/foo" }),
    ).toBe(
      "https://raw.githubusercontent.com/o/r/main/packages/foo/package.json",
    );
  });
});
