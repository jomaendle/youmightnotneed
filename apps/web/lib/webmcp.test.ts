import { describe, expect, it, vi } from "vitest";
import {
  findModelContext,
  type ModelContext,
  registerWebMcpTools,
} from "./webmcp";

const asDoc = (value: object) => value as unknown as Document;
const asNav = (value: object) => value as unknown as Navigator;

describe("findModelContext", () => {
  const context = { registerTool: () => undefined };

  it("is null where WebMCP does not exist", () => {
    expect(findModelContext(asDoc({}), asNav({}))).toBeNull();
  });

  it("finds it on document, as the spec says", () => {
    expect(findModelContext(asDoc({ modelContext: context }), asNav({}))).toBe(
      context,
    );
  });

  it("falls back to navigator, as some guides say", () => {
    expect(findModelContext(asDoc({}), asNav({ modelContext: context }))).toBe(
      context,
    );
  });

  it("ignores an object with no registerTool", () => {
    expect(findModelContext(asDoc({ modelContext: {} }), asNav({}))).toBeNull();
  });
});

describe("registerWebMcpTools", () => {
  function setup(
    deps: Partial<Parameters<typeof registerWebMcpTools>[2]> = {},
  ) {
    const registered = new Map<
      string,
      Parameters<ModelContext["registerTool"]>
    >();
    const context: ModelContext = {
      registerTool: (tool, options) => {
        registered.set(tool.name, [tool, options]);
      },
    };
    const controller = new AbortController();
    registerWebMcpTools(context, controller.signal, {
      fetchRule: vi.fn(),
      scan: vi.fn(),
      ...deps,
    });
    return { registered, controller };
  }

  it("registers both tools with the abort signal", () => {
    const { registered, controller } = setup();
    expect([...registered.keys()]).toEqual(["get_rule", "scan_dependencies"]);
    for (const [, options] of registered.values()) {
      expect(options?.signal).toBe(controller.signal);
    }
  });

  it("get_rule returns the markdown, and flags a 404 as an error", async () => {
    const fetchRule = vi
      .fn()
      .mockResolvedValueOnce(new Response("# Rule", { status: 200 }))
      .mockResolvedValueOnce(new Response("# Not found", { status: 404 }));
    const [tool] = setup({ fetchRule }).registered.get("get_rule") ?? [];
    expect(await tool?.execute({ id: "dialog-element" })).toEqual({
      content: [{ type: "text", text: "# Rule" }],
    });
    expect(await tool?.execute({ id: "nope" })).toMatchObject({
      isError: true,
    });
  });

  it("get_rule rejects a missing id without fetching", async () => {
    const fetchRule = vi.fn();
    const [tool] = setup({ fetchRule }).registered.get("get_rule") ?? [];
    expect(await tool?.execute({})).toMatchObject({ isError: true });
    expect(fetchRule).not.toHaveBeenCalled();
  });

  it("scan_dependencies passes the input to the scan action", async () => {
    const scan = vi.fn().mockResolvedValue(undefined);
    const [tool] = setup({ scan }).registered.get("scan_dependencies") ?? [];
    const result = await tool?.execute({ input: "owner/repo" });
    expect(scan).toHaveBeenCalledWith("owner/repo");
    expect(result?.isError).toBeUndefined();
  });

  it("scan_dependencies reports the action's error", async () => {
    const scan = vi.fn().mockResolvedValue({ error: "Not a package.json" });
    const [tool] = setup({ scan }).registered.get("scan_dependencies") ?? [];
    expect(await tool?.execute({ input: "x" })).toEqual({
      content: [{ type: "text", text: "Not a package.json" }],
      isError: true,
    });
  });

  it("get_rule turns a failed fetch into an error result, not a rejection", async () => {
    const fetchRule = vi.fn().mockRejectedValue(new Error("offline"));
    const [tool] = setup({ fetchRule }).registered.get("get_rule") ?? [];
    expect(await tool?.execute({ id: "x" })).toEqual({
      content: [{ type: "text", text: "Could not fetch the rule: offline" }],
      isError: true,
    });
  });

  it("get_rule reports the HTTP status", async () => {
    const fetchRule = vi
      .fn()
      .mockResolvedValue(new Response("busy", { status: 503 }));
    const [tool] = setup({ fetchRule }).registered.get("get_rule") ?? [];
    expect(await tool?.execute({ id: "x" })).toMatchObject({
      content: [{ text: "HTTP 503. busy" }],
      isError: true,
    });
  });

  it("scan_dependencies turns a thrown action into an error result", async () => {
    const scan = vi
      .fn()
      .mockRejectedValue(new Error("Failed to find Server Action"));
    const [tool] = setup({ scan }).registered.get("scan_dependencies") ?? [];
    expect(await tool?.execute({ input: "x" })).toMatchObject({
      isError: true,
    });
  });

  it("keeps registering when one registration throws", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const names: string[] = [];
    const context: ModelContext = {
      registerTool: (tool) => {
        if (tool.name === "get_rule") throw new Error("duplicate");
        names.push(tool.name);
      },
    };
    registerWebMcpTools(context, new AbortController().signal, {
      fetchRule: vi.fn(),
      scan: vi.fn(),
    });
    expect(names).toEqual(["scan_dependencies"]);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});
