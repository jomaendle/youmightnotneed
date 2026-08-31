#!/usr/bin/env node
/**
 * npx youmightnotneed
 *
 * Reads a package.json, runs the catalog's detect(), prints a report. All the
 * I/O lives here; the rendering and the detection are both pure.
 */
import { readFileSync, realpathSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import {
  analyze,
  BASELINE_DATA_DATE,
  type PackageJsonLike,
  packageSizes,
  WEB_FEATURES_VERSION,
} from "@jomae/catalog";
import { createPalette } from "./colors.ts";
import { renderJson, renderReport } from "./render.ts";

const HELP = `
youmightnotneed  ·  is it CSS yet?

Finds the modern CSS and HTML that replaces your JavaScript dependencies.

Usage
  npx youmightnotneed [path] [options]

  path            A package.json, or a directory containing one.
                  Defaults to the nearest package.json from the current
                  directory upwards.

Options
  -v, --verbose   Print every condition under which the dependency is still
                  the right call. Recommended before you change anything.
      --json      Machine-readable output.
      --no-color  Disable colour. Also respects the NO_COLOR variable.
  -h, --help      Show this.
      --version   Print the version.

Notes
  A dependency in package.json is not proof of what it is used for, so every
  finding is a "this may apply", not an instruction. Read the conditions.
  npx youmightnotneed works with or without an install. The bare
  youmightnotneed command only works after a global install.
`;

interface Args {
  path: string | undefined;
  verbose: boolean;
  json: boolean;
  color: boolean;
  help: boolean;
  version: boolean;
}

function parseArgs(argv: readonly string[]): Args {
  const args: Args = {
    path: undefined,
    verbose: false,
    json: false,
    color: !process.env.NO_COLOR,
    help: false,
    version: false,
  };

  for (const arg of argv) {
    switch (arg) {
      case "-v":
      case "--verbose":
        args.verbose = true;
        break;
      case "--json":
        args.json = true;
        break;
      case "--no-color":
        args.color = false;
        break;
      case "-h":
      case "--help":
        args.help = true;
        break;
      case "--version":
        args.version = true;
        break;
      default:
        if (arg.startsWith("-")) {
          console.error(`Unknown option: ${arg}`);
          console.error("Run with --help to see the available options.");
          process.exit(2);
        }
        args.path = arg;
        break;
    }
  }

  return args;
}

/** Walks up from a directory looking for a package.json. */
export function findPackageJson(start: string): string | null {
  let dir = resolve(start);
  for (let depth = 0; depth < 40; depth += 1) {
    const candidate = join(dir, "package.json");
    try {
      readFileSync(candidate, "utf8");
      return candidate;
    } catch {
      const parent = dirname(dir);
      if (parent === dir) return null;
      dir = parent;
    }
  }
  return null;
}

export function resolveTarget(input: string | undefined): string {
  if (!input) {
    const found = findPackageJson(process.cwd());
    if (!found) {
      console.error(
        "No package.json found here or in any parent directory.\nPass a path: npx youmightnotneed ./path/to/package.json",
      );
      process.exit(1);
    }
    return found;
  }

  const target = resolve(input);
  if (basename(target) === "package.json") return target;

  // A file path under any other name: read it directly rather than assuming
  // it must be a directory. Covers a renamed manifest, or one written by
  // another tool.
  try {
    readFileSync(target, "utf8");
    return target;
  } catch {
    // Not a readable file. Fall through and try it as a directory.
  }

  const inDir = join(target, "package.json");
  try {
    readFileSync(inDir, "utf8");
    return inDir;
  } catch {
    console.error(`No package.json at ${target}`);
    process.exit(1);
  }
}

function readPackageJson(file: string): PackageJsonLike {
  let raw: string;
  try {
    raw = readFileSync(file, "utf8");
  } catch {
    console.error(`Could not read ${file}`);
    process.exit(1);
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed !== "object" || parsed === null) {
      throw new Error("not an object");
    }
    return parsed as PackageJsonLike;
  } catch {
    console.error(`${file} is not valid JSON.`);
    process.exit(1);
  }
}

function readOwnVersion(): string {
  try {
    const pkg = JSON.parse(
      readFileSync(new URL("../package.json", import.meta.url), "utf8"),
    ) as { version?: string };
    return pkg.version ?? "unknown";
  } catch {
    return "unknown";
  }
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    console.info(HELP);
    process.exit(0);
  }

  if (args.version) {
    console.info(readOwnVersion());
    process.exit(0);
  }

  const target = resolveTarget(args.path);
  const pkg = readPackageJson(target);
  const report = analyze(pkg);

  if (args.json) {
    console.info(renderJson(report));
  } else {
    const useColor = args.color && process.stdout.isTTY === true;
    console.info(
      renderReport(report, {
        palette: createPalette(useColor),
        projectName: pkg.name ?? basename(dirname(target)),
        provenance: {
          baselineOn: BASELINE_DATA_DATE,
          webFeaturesVersion: WEB_FEATURES_VERSION,
          sizesOn: packageSizes.fetchedOn,
        },
        verbose: args.verbose,
      }),
    );
  }

  // The report is informational, so a clean run always exits 0. A CI-friendly
  // threshold flag can come later, once the catalog has settled.
  process.exit(0);
}

// Only run as a side effect when this file is the process entry point, not
// when a test imports it to exercise resolveTarget() or findPackageJson().
const isEntryPoint =
  process.argv[1] !== undefined &&
  import.meta.url === `file://${realpathSync(process.argv[1])}`;

if (isEntryPoint) main();
