import { CLI_VERSION } from "./versions.ts";

/**
 * The prompt the home page hands to an agent.
 *
 * It is written as instructions to a coding agent working in someone else's
 * repo, so it has to carry the one thing the catalog exists to protect: a
 * finding is a conditional, not an instruction. An agent that reads "swiper
 * can go" and deletes the import has used this wrong. Hence the last
 * paragraph, and hence the explicit "do not remove anything yet".
 *
 * The command says @latest rather than a pinned version, which is what the
 * README and the skill already tell people to run. Pinning it here would
 * freeze someone's copied prompt on the day they copied it.
 */
export const AGENT_PROMPT = `Audit this project for dependencies the browser now covers on its own.

Scan the package.json:

    npx -y youmightnotneed@latest --verbose

For anything it flags, read that rule's conditions before touching code:

    npx -y youmightnotneed@latest --package <name> --verbose

Every finding is conditional. Each rule lists when the library is still the right call, so check those against how this codebase actually uses the package.

Report what could go, what it weighs, and what needs a fallback. Do not remove anything yet.`;

/** Shown beside the button so the reader knows what they are copying. */
export const AGENT_PROMPT_SUMMARY = `Runs the CLI, reads the conditions, reports back without changing code. Needs youmightnotneed ${CLI_VERSION} or newer.`;
