import {
  LINT_RULES_FETCHED_ON,
  LINT_SOURCES,
  resolveRuleLint,
  rules,
} from "@jomae/catalog";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  openGraph: {
    title: "What can be checked automatically",
    description:
      "Which of these migrations a linter already finds, which need a person, and which tools do the rest.",
    url: "/checks",
  },
  alternates: { canonical: "/checks" },
  title: "What can be checked automatically",
  description:
    "Some of this catalog is already enforced by a lint rule. The rest is multi-line behaviour no linter can match. Here is which is which.",
};

/** Rules a linter already covers, with the resolved rule name and docs link. */
function lintable() {
  return rules
    .map((rule) => ({ rule, lint: resolveRuleLint(rule) }))
    .filter((entry) => entry.lint?.url)
    .sort((a, b) => a.rule.title.localeCompare(b.rule.title));
}

/** Rules carrying hand-rolled shapes, which is the half no linter matches. */
function byJudgement() {
  return rules
    .filter((rule) => (rule.agent.handRolled ?? []).length > 0)
    .sort((a, b) => a.title.localeCompare(b.title));
}

export default function ChecksPage() {
  const automated = lintable();
  const manual = byJudgement();
  const shapeCount = manual.reduce(
    (total, rule) => total + (rule.agent.handRolled ?? []).length,
    0,
  );

  return (
    <div className="space-y-10">
      <header>
        <h1 className="mb-4 text-page-title">
          What can be checked automatically
        </h1>
        <p className="max-w-[62ch] text-fg-muted text-lede">
          Part of this catalog is already enforced by a lint rule, so it belongs
          in CI rather than in a review. The rest is multi-line behaviour spread
          over a file, which no linter can match and a person or an agent has to
          recognise. Knowing which half a migration falls into is most of
          deciding how to tackle it.
        </p>
      </header>

      <section className="hairline pt-8">
        <h2 className="mb-2 text-section">
          {automated.length} a linter already finds
        </h2>
        <p className="mb-5 max-w-[62ch] text-compact text-fg-muted">
          Turn these on and stop reviewing them by hand. This catalog names the
          rule rather than reimplementing the check, the same way it points at
          guides rather than copying them.
        </p>

        <ul className="rule-list">
          {automated.map(({ rule, lint }) => (
            <li key={rule.id} className="py-3">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <Link href={`/rules/${rule.id}`} className="text-compact">
                  {rule.title}
                </Link>
                <code className="font-mono text-fg-faint text-metadata">
                  {rule.native}
                </code>
              </div>
              <p className="mt-1 text-metadata">
                <a href={lint?.url ?? "#"} target="_blank" rel="noreferrer">
                  <code className="font-mono">{lint?.name}</code>
                </a>
              </p>
            </li>
          ))}
        </ul>

        <div className="mt-6">
          <p className="mb-2 max-w-[62ch] text-compact text-fg-muted">
            All of them at once, in an eslint config:
          </p>
          <pre className="w-fit overflow-x-auto rounded-md border border-border bg-bg-subtle px-4 py-3 font-mono text-metadata">
            <code>
              {eslintConfig(automated.map((e) => e.lint?.name ?? ""))}
            </code>
          </pre>
          <p className="mt-3 max-w-[62ch] text-fg-faint text-metadata">
            Rule names checked against{" "}
            {LINT_SOURCES.map((s) => `${s.package} ${s.version}`).join(", ")},
            captured {LINT_RULES_FETCHED_ON}. A rule renamed upstream fails this
            site's freshness check rather than becoming a dead link.
          </p>
        </div>
      </section>

      <section className="hairline pt-8">
        <h2 className="mb-2 text-section">
          {shapeCount} shapes that need a person
        </h2>
        <p className="mb-5 max-w-[62ch] text-compact text-fg-muted">
          No package is installed for any of these, so nothing matches in a
          package.json either. They are stateful and spread over a file, which
          is why no lint rule covers them. An agent reading the code can, which
          is what the skill and the MCP server are for.
        </p>

        <ul className="rule-list">
          {manual.map((rule) => (
            <li key={rule.id} className="py-4">
              <div className="mb-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <Link href={`/rules/${rule.id}`} className="text-compact">
                  {rule.title}
                </Link>
                <code className="font-mono text-fg-faint text-metadata">
                  {rule.native}
                </code>
              </div>
              <ul className="space-y-1">
                {(rule.agent.handRolled ?? []).map((shape) => (
                  <li key={shape} className="text-fg-muted text-metadata">
                    {shape}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </section>

      <section className="hairline pt-8">
        <h2 className="mb-2 text-section">Not this tool's job</h2>
        <p className="mb-5 max-w-[62ch] text-compact text-fg-muted">
          Three questions near this one, each better answered somewhere else.
          Reimplementing them here would be worse than pointing at them.
        </p>
        <dl className="max-w-[66ch] space-y-4 text-compact">
          <Elsewhere
            name="knip"
            href="https://knip.dev"
            question="Is this dependency used at all?"
          >
            Unused dependencies, exports and files. It reads npm scripts, config
            files and plugin names, which is what makes an "unused" claim
            trustworthy rather than a guess.
          </Elsewhere>
          <Elsewhere
            name="Biome useBaseline"
            href="https://biomejs.dev/linter/rules/use-baseline/css/"
            question="Is this CSS feature too new for my users?"
          >
            The opposite direction to this catalog. It stops you using a feature
            before your target browsers have it, where this tells you a feature
            is finally old enough to replace a library.
          </Elsewhere>
          <Elsewhere
            name="eslint-plugin-compat"
            href="https://github.com/amilajack/eslint-plugin-compat"
            question="Does this API exist in my browser targets?"
          >
            Checks calls against your browserslist. Useful alongside a finding
            here that reads as newly available.
          </Elsewhere>
        </dl>
      </section>
    </div>
  );
}

function Elsewhere({
  name,
  href,
  question,
  children,
}: {
  name: string;
  href: string;
  question: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <dt className="mb-0.5">
        <a href={href} target="_blank" rel="noreferrer">
          {name}
        </a>
        <span className="ml-2 text-fg-faint text-metadata">{question}</span>
      </dt>
      <dd className="text-fg-muted">{children}</dd>
    </div>
  );
}

/**
 * The config block, built from the rules the catalog actually names rather
 * than written out by hand, so it cannot drift from the list above it.
 */
function eslintConfig(names: readonly string[]): string {
  const entries = names
    .map((name) => `      "${name}": "error",`)
    .sort()
    .join("\n");

  return `import unicorn from "eslint-plugin-unicorn";

export default [
  {
    plugins: { unicorn },
    rules: {
${entries}
    },
  },
];`;
}
