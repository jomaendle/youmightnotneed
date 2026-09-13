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
export async function scan(
  _previous: ScanState,
  formData: FormData,
): Promise<ScanState> {
  // One field takes both inputs. A package.json always starts with a brace
  // and a repository reference never does, so the two are told apart without
  // asking the reader to choose a mode first. The second field this replaced
  // came with its own heading and its own caveat, both of which were on
  // screen before anyone had done anything.
  const raw = String(formData.get("input") ?? "");
  const trimmed = raw.trim();
  const isRepo = trimmed.length > 0 && !trimmed.startsWith("{");

  let parsed: ReturnType<typeof parsePackageJson>;

  if (isRepo) {
    const ref = parseRepoInput(trimmed);
    if (!ref) {
      return {
        error:
          "That is neither a package.json nor a repository. Paste the file, or try owner/repo.",
      };
    }
    parsed = await fetchRepoPackageJson(ref);
    if (parsed.ok && !parsed.pkg.name) {
      parsed = {
        ok: true,
        pkg: { ...parsed.pkg, name: `${ref.owner}/${ref.repo}` },
      };
    }
  } else {
    parsed = parsePackageJson(raw);
  }

  if (!parsed.ok) return { error: parsed.error };

  const findings = detect(parsed.pkg);
  const packages = findings.flatMap((f) => f.matched.map((m) => m.name));

  redirect(
    `/report?d=${encodeReport({ packages, projectName: parsed.pkg.name })}`,
  );
}
