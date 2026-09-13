"use server";

import { detect } from "@jomae/catalog";
import { redirect } from "next/navigation";
import {
  fetchRepoPackageJson,
  parsePackageJson,
  parseRepoInput,
} from "@/lib/parse-input";
import { encodeReport } from "@/lib/permalink";

export interface ScanState {
  error?: string;
}

/**
 * Turns pasted input into a permalink and redirects to it.
 *
 * Nothing is stored. Only the dependency names that actually matched a rule
 * end up in the URL, so a shared link carries no more than it has to.
 */
/**
 * Resolves input that is not a pasted file.
 *
 * Returns a parsed manifest, or the error to show. Not a repository does not
 * mean not a file: if there is a brace anywhere in it, it was meant as one,
 * and selecting just the dependencies block is the likeliest way to get that
 * wrong. parsePackageJson says what is actually wrong ("Paste the whole
 * package.json, including the braces") where a guess about repositories would
 * send the reader somewhere useless.
 *
 * Without a brace there is nothing to suggest a file, so a bare word like
 * "lodash" keeps the message naming both ways in, rather than being told to
 * add braces to something that has none.
 */
async function resolveRepo(
  raw: string,
  trimmed: string,
): Promise<ReturnType<typeof parsePackageJson> | { ok: false; error: string }> {
  const ref = parseRepoInput(trimmed);

  if (!ref) {
    if (trimmed.includes("{")) {
      const asFile = parsePackageJson(raw);
      if (!asFile.ok) return asFile;
    }
    return {
      ok: false,
      error:
        "That is neither a package.json nor a repository. Paste the file, or try owner/repo.",
    };
  }

  const fetched = await fetchRepoPackageJson(ref);
  if (fetched.ok && !fetched.pkg.name) {
    return {
      ok: true,
      pkg: { ...fetched.pkg, name: `${ref.owner}/${ref.repo}` },
    };
  }
  return fetched;
}

export async function scan(
  _previous: ScanState,
  formData: FormData,
): Promise<ScanState> {
  // One field takes both inputs. Trimmed, a package.json starts with a brace
  // and a repository reference does not, so the two are told apart without
  // asking the reader to pick a mode first. Trimmed matters: a file pasted
  // with a leading newline, a tab or a BOM still routes to the JSON branch,
  // which is the common case and the one that would be most annoying to get
  // wrong. The second field this replaced came with its own heading and its
  // own caveat, both on screen before anyone had done anything.
  const raw = String(formData.get("input") ?? "");
  const trimmed = raw.trim();
  const isRepo = trimmed.length > 0 && !trimmed.startsWith("{");

  const parsed = isRepo
    ? await resolveRepo(raw, trimmed)
    : parsePackageJson(raw);

  if (!parsed.ok) return { error: parsed.error };

  const findings = detect(parsed.pkg);
  const packages = findings.flatMap((f) => f.matched.map((m) => m.name));

  redirect(
    `/report?d=${encodeReport({ packages, projectName: parsed.pkg.name })}`,
  );
}
