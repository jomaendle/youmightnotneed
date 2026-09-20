import { rules } from "@jomae/catalog";
import { site } from "@/lib/site";

/**
 * The read-only HTTP surface, described for tools that look for a spec. There
 * is no authentication and no write endpoint: the catalog is public data and
 * nothing a caller sends is stored.
 */
export const dynamic = "force-static";

const markdown = (description: string) => ({
  200: {
    description,
    content: { "text/markdown": { schema: { type: "string" } } },
  },
});

export function GET() {
  return Response.json({
    openapi: "3.1.0",
    info: {
      title: site.name,
      description: site.description,
      version: "1.0.0",
      license: { name: "MIT" },
    },
    servers: [{ url: site.url }],
    security: [],
    paths: {
      "/llms.txt": {
        get: {
          operationId: "getIndex",
          summary: "Index of every rule, by use case",
          responses: markdown("Markdown index."),
        },
      },
      "/llms-full.txt": {
        get: {
          operationId: "getFullCatalog",
          summary: "Every rule in one document",
          responses: markdown("Markdown, one section per rule."),
        },
      },
      "/rules/{id}.md": {
        get: {
          operationId: "getRule",
          summary: "One rule: the native approach and when to keep the package",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string", enum: rules.map((rule) => rule.id) },
            },
          ],
          responses: {
            ...markdown("Markdown for the rule."),
            404: { description: "No rule with that id." },
          },
        },
      },
    },
  });
}
