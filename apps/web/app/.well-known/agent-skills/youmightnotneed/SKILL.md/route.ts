import { readFileSync } from "node:fs";
import { resolve } from "node:path";

export const dynamic = "force-static";

export function GET() {
  const skill = readFileSync(
    resolve(process.cwd(), "../../skills/youmightnotneed/SKILL.md"),
    "utf8",
  );
  return new Response(skill, {
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });
}
