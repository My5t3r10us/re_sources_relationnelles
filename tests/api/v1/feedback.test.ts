import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { POST } from "@/app/api/v1/feedback/route";
import { setupApiHarness } from "../../setup/api-harness";
import { createTestUser } from "../../setup/db";

const harness = setupApiHarness([{ path: "/api/v1/feedback", handlers: { POST } }]);

const API_KEY = "fider-secret-key";

/**
 * Fabrique une réponse NEUVE à chaque appel : le corps d'une `Response` ne se
 * lit qu'une fois, et réutiliser la même instance ferait échouer le deuxième
 * appel du test de limitation de débit.
 */
function fiderResponder(body: unknown, status = 200) {
  return vi.fn().mockImplementation(async () => new Response(JSON.stringify(body), { status }));
}

beforeEach(() => {
  process.env.FIDER_URL = "https://fider.internal";
  process.env.FIDER_API_KEY = API_KEY;
  process.env.NEXT_PUBLIC_FIDER_URL = "https://feedback.example";
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  delete process.env.FIDER_URL;
  delete process.env.FIDER_API_KEY;
  delete process.env.NEXT_PUBLIC_FIDER_URL;
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("POST /api/v1/feedback", () => {
  it("requires auth", async () => {
    const res = await harness.req().post("/api/v1/feedback").send({ type: "bug", title: "Titre valide" });
    expect(res.status).toBe(401);
  });

  it("rejects an invalid payload", async () => {
    const u = await createTestUser();
    const res = await harness
      .req()
      .post("/api/v1/feedback")
      .set("Authorization", `Bearer ${u.token}`)
      .send({ type: "bug", title: "abc" });
    expect(res.status).toBe(400);
  });

  it("returns 503 when the portal is not configured", async () => {
    delete process.env.FIDER_API_KEY;
    const u = await createTestUser();
    const res = await harness
      .req()
      .post("/api/v1/feedback")
      .set("Authorization", `Bearer ${u.token}`)
      .send({ type: "bug", title: "Titre valide" });
    expect(res.status).toBe(503);
  });

  it("creates the post and returns its public URL", async () => {
    vi.stubGlobal("fetch", fiderResponder({ number: 42, slug: "mode-sombre" }));

    const u = await createTestUser();
    const res = await harness
      .req()
      .post("/api/v1/feedback")
      .set("Authorization", `Bearer ${u.token}`)
      .send({ type: "feature", title: "Ajouter un mode sombre" });

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({
      number: 42,
      slug: "mode-sombre",
      url: "https://feedback.example/posts/42/mode-sombre",
    });
  });

  it("returns 502 without leaking the upstream detail or the API key", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(new Response("fider.internal refused: bad token", { status: 500 })),
    );

    const u = await createTestUser();
    const res = await harness
      .req()
      .post("/api/v1/feedback")
      .set("Authorization", `Bearer ${u.token}`)
      .send({ type: "bug", title: "Titre valide" });

    expect(res.status).toBe(502);
    expect(res.body.error.code).toBe("FEEDBACK_UNAVAILABLE");

    const serialized = JSON.stringify(res.body);
    expect(serialized).not.toContain(API_KEY);
    expect(serialized).not.toContain("fider.internal");
  });

  it("rate limits after 5 submissions in the window", async () => {
    vi.stubGlobal("fetch", fiderResponder({ number: 1, slug: "s" }));

    const u = await createTestUser();
    for (let i = 0; i < 5; i++) {
      const ok = await harness
        .req()
        .post("/api/v1/feedback")
        .set("Authorization", `Bearer ${u.token}`)
        .send({ type: "bug", title: `Anomalie numéro ${i}` });
      expect(ok.status).toBe(201);
    }

    const limited = await harness
      .req()
      .post("/api/v1/feedback")
      .set("Authorization", `Bearer ${u.token}`)
      .send({ type: "bug", title: "Une anomalie de trop" });
    expect(limited.status).toBe(429);
  });
});
