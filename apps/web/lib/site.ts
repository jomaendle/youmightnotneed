/** Single source of truth for site identity and metadata copy. */
export const site = {
  name: "youmightnotneed",
  // The .vercel.app deployment URL still resolves and is still attached, so
  // old links keep working. Nothing should point at it any more:
  // youmightnotneed.vercel.app (no -web) is a squatted, unrelated site, and
  // one wrong hyphen is all that separates the two.
  domain: "youmightnotneed.dev",
  url: "https://youmightnotneed.dev",
  tagline: "Is it CSS yet?",
  description:
    "Find the CSS, HTML, or Web API that replaces your JavaScript dependencies. Paste a package.json and see what the platform now does natively.",
  repo: "https://github.com/jomaendle/youmightnotneed",
  author: "Johannes Maendle",
  authorUrl: "https://www.jomaendle.com",
} as const;
