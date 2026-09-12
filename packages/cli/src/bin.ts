#!/usr/bin/env node
/**
 * npx youmightnotneed
 *
 * Reads a package.json, runs the catalog's detect(), prints a report. All the
 * I/O lives here; the rendering and the detection are both pure.
 */
import { readFileSync, realpathSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import {
  analyze,
  BASELINE_DATA_DATE,
  type PackageJsonLike,
  packageSizes,
  renderRuleMarkdown,
  rulesById,
  WEB_FEATURES_VERSION,
} from "@jomae/catalog";
import { createPalette } from "./colors.ts";
import { renderJson, renderReport } from "./render.ts";

const HELP = `
youmightnotneed  ·  is it CSS yet?

Finds the CSS, HTML, or Web API that replaces your JavaScript dependencies.

Usage
  npx youmightnotneed [path] [options]

  path            A package.json, or a directory containing one.
                  Defaults to the nearest package.json from the current
                  directory upwards.

Options
  -p, --package   Check one npm package by name instead of reading a
                  package.json. Use it before you install something.
  -r, --rule      Print one rule in full by its id, including the conditions
                  and the shapes people hand-roll instead. Use it when you are
                  holding code rather than a package name.
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

export interface Args {
  path: string | undefined;
  /** A single npm package to check, instead of reading a package.json. */
  package: string | undefined;
  /**
   * A rule id to print in full, for when you are holding code rather than a
   * package name. This is the offline route for a hand-rolled shape: there is
   * no package to look up, so --package cannot answer it.
   */
  rule: string | undefined;
  verbose: boolean;
  json: boolean;
  color: boolean;
  help: boolean;
  version: boolean;
}

/**
 * Reads a flag that takes a value, in both the `--flag value` and
 * `--flag=value` spellings. Returns how many argv entries it consumed, or 0
 * when this argument is not that flag.
 */
function readValueFlag(
  argv: readonly string[],
  index: number,
  spec: { long: string; short?: string; noun: string; example: string },
): { value: string; consumed: number } | null {
  const arg = argv[index] as string;
  const prefix = `${spec.long}=`;

  const attached = arg.startsWith(prefix);
  if (!(attached || arg === spec.short || arg === spec.long)) return null;

  // Both spellings go through one check, or --package= and --package=-v slip
  // past it and the run reports on the empty string instead of erroring.
  const value = attached ? arg.slice(prefix.length) : argv[index + 1];
  if (value === undefined || value === "" || value.startsWith("-")) {
    console.error(
      `${spec.long} needs a ${spec.noun}, for example: ${spec.example}`,
    );
    process.exit(2);
  }
  return { value, consumed: attached ? 1 : 2 };
}

/**
 * Prints one rule in full, for `--rule <id>`.
 *
 * The route for someone holding code rather than a package name: a hand-rolled
 * focus trap has no dependency to look up, so --package cannot answer it and
 * the id is the only handle there is.
 */
function printRule(id: string): void {
  const rule = rulesById.get(id);
  if (!rule) {
    console.error(`No rule with id "${id}".`);
    console.error(
      "Run without --rule to scan a package.json, or see https://youmightnotneed.dev/rules",
    );
    process.exit(1);
  }
  console.info(renderRuleMarkdown(rule));
}

export function parseArgs(argv: readonly string[]): Args {
  const args: Args = {
    path: undefined,
    package: undefined,
    rule: undefined,
    verbose: false,
    json: false,
    color: !process.env.NO_COLOR,
    help: false,
    version: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i] as string;

    const pkgFlag = readValueFlag(argv, i, {
      long: "--package",
      short: "-p",
      noun: "package name",
      example: "--package swiper",
    });
    if (pkgFlag) {
      args.package = pkgFlag.value;
      i += pkgFlag.consumed - 1;
      continue;
    }

    const ruleFlag = readValueFlag(argv, i, {
      long: "--rule",
      short: "-r",
      noun: "rule id",
      example: "--rule inert",
    });
    if (ruleFlag) {
      args.rule = ruleFlag.value;
      i += ruleFlag.consumed - 1;
      continue;
    }

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

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    console.error(`${file} is not valid JSON.`);
    process.exit(1);
  }

  // typeof [] is "object", so an array would otherwise pass and produce a
  // confident "nothing found" for a file that is not a manifest at all.
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    console.error(`${file} is valid JSON but not a package.json object.`);
    process.exit(1);
  }

  const record = parsed as Record<string, unknown>;

  // A lockfile's top-level `dependencies` is the whole transitive tree, so
  // reading one would report hundreds of packages nothing here depends on
  // directly, dev-only entries included.
  if ("lockfileVersion" in record) {
    console.error(
      `${file} is a lockfile, not a package.json. Point at the manifest instead.`,
    );
    process.exit(1);
  }

  // `name` is whatever the file says. Anything but a string would render as
  // "[object Object]" in the report header.
  if (typeof record.name !== "string") delete record.name;

  return record as PackageJsonLike;
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

/**
 * The modes that print one thing and stop, rather than scanning anything.
 * Returns true when one of them handled the run.
 */
function runDirectMode(args: Args): boolean {
  if (args.help) {
    console.info(HELP);
    return true;
  }
  if (args.version) {
    console.info(readOwnVersion());
    return true;
  }
  if (args.rule !== undefined) {
    printRule(args.rule);
    return true;
  }
  return false;
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));

  // Never process.exit(0) after writing: stdout to a pipe is asynchronous in
  // Node, and exiting discards whatever is still buffered. That silently
  // truncated --json past the 64 KiB pipe buffer. Returning lets Node flush
  // and exit 0 on its own.
  if (runDirectMode(args)) return;

  if (args.package !== undefined && args.path !== undefined) {
    console.error(
      "--package checks one name and ignores a path. Pass one or the other.",
    );
    process.exit(2);
  }

  // --package builds a one-entry dependency map so a single lookup goes
  // through exactly the same detect() and renderers as a whole project.
  const single = args.package;
  const target = single === undefined ? resolveTarget(args.path) : null;
  const pkg: PackageJsonLike =
    single === undefined
      ? readPackageJson(target as string)
      : { name: single, dependencies: { [single]: "*" } };
  const report = analyze(pkg);
  const provenance = {
    baselineOn: BASELINE_DATA_DATE,
    webFeaturesVersion: WEB_FEATURES_VERSION,
    sizesOn: packageSizes.fetchedOn,
  };

  if (args.json) {
    console.info(renderJson(report, provenance));
  } else {
    const useColor = args.color && process.stdout.isTTY === true;
    console.info(
      renderReport(report, {
        palette: createPalette(useColor),
        subject: single === undefined ? "project" : "package",
        projectName: single ?? pkg.name ?? basename(dirname(target as string)),
        provenance,
        verbose: args.verbose,
      }),
    );
  }

  // The report is informational, so a clean run always exits 0, which is what
  // returning gives us. See the note above on why this is not process.exit(0).
}

// Only run as a side effect when this file is the process entry point, not
// when a test imports it to exercise resolveTarget() or findPackageJson().
// import.meta.url is a properly percent-encoded file:// URL, so argv[1] is
// resolved through realpathSync (npm/npx invoke through a node_modules/.bin
// symlink) and converted with pathToFileURL rather than plain string
// concatenation, or a path containing a space never matches. A missing
// argv[1] target (a broken symlink) means this isn't the entry point either,
// not an uncaught crash.
function isEntryPoint(): boolean {
  const argv1 = process.argv[1];
  if (argv1 === undefined) return false;
  try {
    return import.meta.url === pathToFileURL(realpathSync(argv1)).href;
  } catch {
    return false;
  }
}

if (isEntryPoint()) main();
