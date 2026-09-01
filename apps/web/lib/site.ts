/** Single source of truth for site identity and metadata copy. */
export const site = {
  name: "youmightnotneed",
  // youmightnotneed.dev isn't wired up yet. Point at the live Vercel
  // deployment until it is; youmightnotneed.vercel.app (no -web) is a
  // squatted, unrelated site, not ours.
  domain: "youmightnotneed-web.vercel.app",
  url: "https://youmightnotneed-web.vercel.app",
  tagline: "Is it CSS yet?",
  description:
    "Find the modern CSS and HTML that replaces your JavaScript dependencies. Paste a package.json and see what the platform now does natively.",
  repo: "https://github.com/jomaendle/youmightnotneed",
  author: "Johannes Maendle",
  authorUrl: "https://www.jomaendle.com",
} as const;
