import { rules } from "@jomae/catalog";
import { site } from "./site.ts";

/**
 * Every JSON-LD object the site emits, built here so a unit test can run each
 * one over the whole catalog. Pages only place the result in a script tag.
 *
 * `sameAs` lists profiles that exist and that this project controls: the
 * GitHub profile, the repository and the npm package pages. Nothing is
 * invented to look established, and there is no Wikipedia or Wikidata entry
 * to point at.
 */
const SCHEMA = "https://schema.org";
const MIT = "https://opensource.org/license/mit";

export const person = {
  "@type": "Person",
  name: site.author,
  url: site.authorUrl,
  sameAs: [site.authorGithub],
} as const;

export function buildHomeGraph() {
  return {
    "@context": SCHEMA,
    "@graph": [
      {
        "@type": "WebSite",
        name: site.name,
        url: site.url,
        description: site.description,
      },
      {
        "@type": "SoftwareApplication",
        name: site.name,
        applicationCategory: "DeveloperApplication",
        operatingSystem: "Any",
        description: site.description,
        url: site.url,
        codeRepository: site.repo,
        license: MIT,
        sameAs: [site.repo, site.npm.cli, site.npm.mcp],
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        author: person,
      },
    ],
  };
}

/** The catalog as a dataset, with the two documents that carry all of it. */
export function buildRulesGraph() {
  return {
    "@context": SCHEMA,
    "@graph": [
      {
        "@type": "Dataset",
        name: `${site.name} rule catalog`,
        description:
          "Each rule maps npm packages to the CSS, HTML or Web API that covers the same case, with the conditions where the package is still the right call.",
        url: `${site.url}/rules`,
        license: MIT,
        isAccessibleForFree: true,
        creator: person,
        distribution: [
          {
            "@type": "DataDownload",
            encodingFormat: "text/markdown",
            contentUrl: `${site.url}/llms-full.txt`,
          },
          {
            "@type": "DataDownload",
            encodingFormat: "application/json",
            contentUrl: `${site.url}/openapi.json`,
          },
        ],
      },
      {
        "@type": "ItemList",
        name: "Rules",
        numberOfItems: rules.length,
        itemListElement: rules.map((rule, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: rule.title,
          url: `${site.url}/rules/${rule.id}`,
        })),
      },
    ],
  };
}
