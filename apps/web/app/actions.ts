"use server";

import { detect } from "@youmightnotneed/catalog";
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
  const pasted = String(formData.get("packageJson") ?? "");
  const repoInput = String(formData.get("repo") ?? "").trim();

  let parsed: ReturnType<typeof parsePackageJson>;

  if (repoInput.length > 0) {
    const ref = parseRepoInput(repoInput);
    if (!ref) {
      return {
        error:
          "That does not look like a GitHub repository. Try github.com/owner/repo.",
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
    parsed = parsePackageJson(pasted);
  }

  if (!parsed.ok) return { error: parsed.error };

  const findings = detect(parsed.pkg);
  const packages = findings.flatMap((f) => f.matched.map((m) => m.name));

  redirect(
    `/report?d=${encodeReport({ packages, projectName: parsed.pkg.name })}`,
  );
}
