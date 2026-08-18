import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  buildFiderTitle,
  buildPostUrl,
  createFiderPost,
  feedbackInputSchema,
  fiderServerConfig,
  FiderError,
} from "@/lib/fider";

describe("feedbackInputSchema", () => {
  it("rejects a title shorter than 5 characters", () => {
    expect(feedbackInputSchema.safeParse({ type: "bug", title: "abc" }).success).toBe(false);
  });

  it("rejects a title longer than 100 characters", () => {
    expect(
      feedbackInputSchema.safeParse({ type: "bug", title: "a".repeat(101) }).success,
    ).toBe(false);
  });

  it("rejects an unknown type", () => {
    expect(
      feedbackInputSchema.safeParse({ type: "question", title: "Titre valide" }).success,
    ).toBe(false);
  });

  it("rejects a description longer than 1000 characters", () => {
    expect(
      feedbackInputSchema.safeParse({
        type: "bug",
        title: "Titre valide",
        description: "a".repeat(1001),
      }).success,
    ).toBe(false);
  });

  it("accepts a valid payload and trims it", () => {
    const parsed = feedbackInputSchema.parse({
      type: "feature",
      title: "  Ajouter un mode sombre  ",
      description: "  Confort de lecture  ",
    });
    expect(parsed.title).toBe("Ajouter un mode sombre");
    expect(parsed.description).toBe("Confort de lecture");
  });
});

describe("buildFiderTitle", () => {
  it("prefixes according to the feedback type", () => {
    expect(buildFiderTitle("bug", "Le filtre plante")).toBe("[Bug] Le filtre plante");
    expect(buildFiderTitle("feature", "Mode sombre")).toBe("[Fonctionnalité] Mode sombre");
  });
});

describe("buildPostUrl", () => {
  it("builds a public post URL", () => {
    expect(buildPostUrl("https://feedback.example", 12, "mode-sombre")).toBe(
      "https://feedback.example/posts/12/mode-sombre",
    );
  });

  it("tolerates a trailing slash on the board URL", () => {
    expect(buildPostUrl("https://feedback.example/", 12, "x")).toBe(
      "https://feedback.example/posts/12/x",
    );
  });

  it("returns null when the board URL is not configured", () => {
    expect(buildPostUrl(undefined, 12, "x")).toBeNull();
  });
});

describe("fiderServerConfig", () => {
  it("returns null unless both URL and key are set", () => {
    expect(fiderServerConfig({})).toBeNull();
    expect(fiderServerConfig({ FIDER_URL: "https://f.example" })).toBeNull();
    expect(fiderServerConfig({ FIDER_API_KEY: "k" })).toBeNull();
  });

  it("strips the trailing slash from the URL", () => {
    expect(
      fiderServerConfig({
        FIDER_URL: "https://f.example/",
        FIDER_API_KEY: "k",
      }),
    ).toEqual({ url: "https://f.example", apiKey: "k" });
  });
});

describe("createFiderPost", () => {
  const config = { url: "https://f.example", apiKey: "secret-key" };
  const input = { type: "bug" as const, title: "Le filtre plante", description: "Étapes" };

  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("posts the prefixed title with a bearer key", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ number: 7, slug: "le-filtre-plante" }), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(createFiderPost(input, config)).resolves.toEqual({
      number: 7,
      slug: "le-filtre-plante",
    });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://f.example/api/v1/posts");
    expect(init.headers.Authorization).toBe("Bearer secret-key");
    expect(JSON.parse(init.body)).toEqual({
      title: "[Bug] Le filtre plante",
      description: "Étapes",
    });

    vi.unstubAllGlobals();
  });

  it("raises FiderError on an upstream failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("internal host leaked", { status: 500 })),
    );
    await expect(createFiderPost(input, config)).rejects.toBeInstanceOf(FiderError);
    vi.unstubAllGlobals();
  });

  it("raises FiderError when the portal is unreachable", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("ECONNREFUSED")));
    await expect(createFiderPost(input, config)).rejects.toBeInstanceOf(FiderError);
    vi.unstubAllGlobals();
  });

  it("raises FiderError on an unexpected payload", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 })),
    );
    await expect(createFiderPost(input, config)).rejects.toBeInstanceOf(FiderError);
    vi.unstubAllGlobals();
  });
});
