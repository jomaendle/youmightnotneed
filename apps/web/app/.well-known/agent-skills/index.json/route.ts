import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { site } from "@/lib/site";

/**
 * Skill discovery. The digest is computed at build time from the same file the
 * sibling SKILL.md route serves, so the two cannot drift.
 */
export const dynamic = "force-static";

export function GET() {
  const skill = readFileSync(
    resolve(process.cwd(), "../../skills/youmightnotneed/SKILL.md"),
    "utf8",
  );
  const description =
    /^description: (.+)$/m.exec(skill)?.[1] ?? site.description;

  return Response.json({
    $schema: "https://schemas.agentskills.io/discovery/0.2.0/schema.json",
    skills: [
      {
        name: "youmightnotneed",
        type: "skill-md",
        description,
        url: `${site.url}/.well-known/agent-skills/youmightnotneed/SKILL.md`,
        digest: `sha256:${createHash("sha256").update(skill).digest("hex")}`,
      },
    ],
  });
}
