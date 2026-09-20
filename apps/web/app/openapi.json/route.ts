import { rules } from "@jomae/catalog";
import { site } from "@/lib/site";

/**
 * The read-only, agent-facing endpoints, described for tools that look for a
 * spec. No authentication, and none of these stores anything a caller sends.
 * The scan form and the OG image route are not part of it.
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
            404: {
              description:
                "No rule with that id. A short markdown body linking /llms.txt and /rules.",
              content: { "text/markdown": { schema: { type: "string" } } },
            },
          },
        },
      },
    },
  });
}
