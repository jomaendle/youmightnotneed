import { existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { rules } from "@jomae/catalog";
import { describe, expect, it } from "vitest";
import { site } from "./site";
import { buildHomeGraph, buildRulesGraph, person } from "./structured-data";

type Node = Record<string, unknown>;

const byType = (graph: { "@graph": Node[] }, type: string) =>
  graph["@graph"].find((node) => node["@type"] === type) as Node;

describe("home graph", () => {
  const app = byType(buildHomeGraph(), "SoftwareApplication");

  it("points sameAs at pages that belong to this project", () => {
    expect(app.sameAs).toEqual([site.repo, site.npm.cli, site.npm.mcp]);
  });

  it("gives the author a GitHub profile", () => {
    expect(person.sameAs).toEqual(["https://github.com/jomaendle"]);
    expect(app.author).toBe(person);
  });

  it("claims no encyclopedia entry", () => {
    const urls = JSON.stringify(buildHomeGraph());
    expect(urls).not.toMatch(/wikipedia|wikidata/i);
  });
});

describe("rules graph", () => {
  const graph = buildRulesGraph();
  const dataset = byType(graph, "Dataset");
  const list = byType(graph, "ItemList");
  const items = list.itemListElement as Node[];

  it("describes the catalog as an MIT dataset with both documents", () => {
    expect(dataset.license).toBe("https://opensource.org/license/mit");
    const urls = (dataset.distribution as Node[]).map((d) => d.contentUrl);
    expect(urls).toEqual([`${site.url}/llms-full.txt`, `${site.url}/llms.txt`]);
  });

  it("distributes only documents this site serves", () => {
    const app = resolve(import.meta.dirname, "../app");
    for (const d of dataset.distribution as Node[]) {
      const path = new URL(d.contentUrl as string).pathname;
      expect(existsSync(join(app, path, "route.ts")), path).toBe(true);
    }
  });

  it("lists every rule once, in order, at its page", () => {
    expect(list.numberOfItems).toBe(rules.length);
    expect(items).toHaveLength(rules.length);
    rules.forEach((rule, index) => {
      expect(items[index]).toMatchObject({
        position: index + 1,
        name: rule.title,
        url: `${site.url}/rules/${rule.id}`,
      });
    });
  });
});
