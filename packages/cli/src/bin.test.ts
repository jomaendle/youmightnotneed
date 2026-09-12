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
import { rules } from "@jomae/catalog";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { findPackageJson, parseArgs, resolveTarget } from "./bin.ts";

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

describe("parseArgs", () => {
  it("reads --package with a separate value", () => {
    expect(parseArgs(["--package", "swiper"]).package).toBe("swiper");
  });

  it("reads --package= with an attached value", () => {
    expect(parseArgs(["--package=react-modal"]).package).toBe("react-modal");
  });

  it("reads the -p short form", () => {
    expect(parseArgs(["-p", "swiper", "--verbose"])).toMatchObject({
      package: "swiper",
      verbose: true,
    });
  });

  it("leaves package undefined and keeps the path when the flag is absent", () => {
    expect(parseArgs(["./app", "--json"])).toMatchObject({
      package: undefined,
      path: "./app",
      json: true,
    });
  });
});

describe("--rule prints one rule", () => {
  const binPath = resolve(import.meta.dirname, "bin.ts");

  const run = (args: string[]) =>
    spawnSync(process.execPath, [binPath, ...args], { encoding: "utf8" });

  // The route for someone holding code rather than a package name. A
  // hand-rolled focus trap has no dependency to look up, so without this the
  // shape half of the catalog has no offline answer at all.
  it.each([["--rule"], ["-r"]])(
    "%s prints the rule and its conditions",
    (flag) => {
      const result = run([flag, "inert"]);

      expect(result.status).toBe(0);
      expect(result.stdout).toContain("# Focus trapping");
      expect(result.stdout).toContain("Keep the dependency if");
      expect(result.stdout).toContain("Signs it was hand-rolled");
    },
  );

  it("names the lint rule when one already checks the shape", () => {
    const result = run(["--rule", "structured-clone"]);

    expect(result.status).toBe(0);
    expect(result.stdout).toContain("unicorn/prefer-structured-clone");
  });

  it("exits 1 on an unknown id rather than printing nothing", () => {
    const result = run(["--rule", "not-a-real-rule"]);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('No rule with id "not-a-real-rule"');
  });

  it.each([["--rule="], ["--rule=-v"], ["-r"], ["--rule"]])(
    "%s exits 2 rather than looking up an empty id",
    (arg) => {
      const result = run([arg]);

      expect(result.status).toBe(2);
      expect(result.stderr).toContain("needs a rule id");
    },
  );
});

describe("--package rejects a missing value", () => {
  // parseArgs calls process.exit(2) on bad input, so these run out of process.
  const binPath = resolve(import.meta.dirname, "bin.ts");

  it.each([["--package="], ["--package=-v"], ["-p"], ["--package"]])(
    "%s exits 2 rather than reporting on an empty name",
    (arg) => {
      const result = spawnSync(process.execPath, [binPath, arg], {
        encoding: "utf8",
      });

      expect(result.status).toBe(2);
      expect(result.stderr).toContain("needs a package name");
      expect(result.stdout).not.toContain("no rule for");
    },
  );

  it.each([["--package=swiper"], ["-p"]])(
    "%s still accepts a real name",
    (arg) => {
      const args = arg === "-p" ? [arg, "swiper"] : [arg];
      const result = spawnSync(process.execPath, [binPath, ...args], {
        encoding: "utf8",
      });

      expect(result.status).toBe(0);
      expect(result.stdout).toContain("Carousels");
    },
  );
});

describe("stdout survives a pipe", () => {
  const binPath = resolve(import.meta.dirname, "bin.ts");

  // process.exit(0) after console.info discarded whatever stdout still had
  // buffered, so --json past the 64 KiB pipe buffer arrived as invalid JSON
  // with exit 0. spawnSync's captured stdio does not reproduce it; a real
  // pipe does.
  it("emits complete JSON through a shell pipe", () => {
    const dir = mkdtempSync(join(tmpdir(), "ymnn-pipe-"));
    try {
      const dependencies: Record<string, string> = {};
      for (const rule of rules) {
        for (const name of rule.replaces) dependencies[name] = "*";
      }
      const manifest = join(dir, "package.json");
      writeFileSync(manifest, JSON.stringify({ name: "big", dependencies }));

      const result = spawnSync(
        "/bin/sh",
        ["-c", `"${process.execPath}" "${binPath}" "${manifest}" --json | cat`],
        { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 },
      );

      expect(result.status).toBe(0);
      expect(result.stdout.length).toBeGreaterThan(65_536);
      expect(() => JSON.parse(result.stdout)).not.toThrow();
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("puts provenance in --json, like the human footer and the MCP server", () => {
    const result = spawnSync(
      process.execPath,
      [binPath, "--package", "swiper", "--json"],
      { encoding: "utf8" },
    );
    const parsed = JSON.parse(result.stdout) as {
      provenance?: { baselineOn: string; webFeaturesVersion: string };
    };
    expect(parsed.provenance?.baselineOn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(parsed.provenance?.webFeaturesVersion).toBeTruthy();
  });
});

describe("a file that is not a package.json", () => {
  const binPath = resolve(import.meta.dirname, "bin.ts");

  // typeof [] is "object", so an array used to pass the shape check and
  // produce a confident "nothing found" for a file that is not a manifest.
  it.each([["[1,2,3]"], ['"hello"'], ["42"]])(
    "rejects %s rather than reporting a clean run",
    (contents) => {
      const dir = mkdtempSync(join(tmpdir(), "ymnn-shape-"));
      try {
        const file = join(dir, "package.json");
        writeFileSync(file, contents);
        const result = spawnSync(process.execPath, [binPath, file], {
          encoding: "utf8",
        });
        expect(result.status).toBe(1);
        expect(result.stdout).not.toContain("Nothing in this package.json");
      } finally {
        rmSync(dir, { recursive: true, force: true });
      }
    },
  );

  it("refuses --package together with a path instead of ignoring the path", () => {
    const result = spawnSync(
      process.execPath,
      [binPath, "--package", "swiper", "./somewhere/package.json"],
      { encoding: "utf8" },
    );
    expect(result.status).toBe(2);
    expect(result.stderr).toContain("one or the other");
  });
});

describe("a lockfile is not a manifest", () => {
  const binPath = resolve(import.meta.dirname, "bin.ts");

  // A lockfile's top-level `dependencies` is the whole transitive tree, so
  // reading one reported packages nothing depends on directly.
  it("refuses a package-lock.json rather than reporting its whole tree", () => {
    const dir = mkdtempSync(join(tmpdir(), "ymnn-lock-"));
    try {
      const file = join(dir, "package.json");
      writeFileSync(
        file,
        JSON.stringify({
          name: "app",
          lockfileVersion: 2,
          dependencies: { uuid: { version: "9.0.0" } },
        }),
      );
      const result = spawnSync(process.execPath, [binPath, file], {
        encoding: "utf8",
      });
      expect(result.status).toBe(1);
      expect(result.stderr).toContain("lockfile");
      expect(result.stdout).not.toContain("Generating UUIDs");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("does not render a non-string name into the header", () => {
    const dir = mkdtempSync(join(tmpdir(), "ymnn-name-"));
    try {
      const file = join(dir, "package.json");
      writeFileSync(
        file,
        JSON.stringify({ name: { a: 1 }, dependencies: { swiper: "^11.0.0" } }),
      );
      const result = spawnSync(process.execPath, [binPath, file], {
        encoding: "utf8",
      });
      expect(result.status).toBe(0);
      expect(result.stdout).not.toContain("[object Object]");
      expect(result.stdout).toContain("Carousels");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
