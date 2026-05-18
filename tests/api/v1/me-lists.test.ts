import { describe, it, expect } from "vitest";
import { GET as favoritesGet } from "@/app/api/v1/me/favorites/route";
import { GET as savedGet } from "@/app/api/v1/me/saved/route";
import { GET as completionsGet } from "@/app/api/v1/me/completions/route";
import { GET as resourcesGet } from "@/app/api/v1/me/resources/route";
import { POST as submitPost } from "@/app/api/v1/me/resources/[id]/submit/route";
import { POST as favoriteToggle } from "@/app/api/v1/resources/[id]/favorite/route";
import { POST as saveToggle } from "@/app/api/v1/resources/[id]/save/route";
import { POST as readToggle } from "@/app/api/v1/resources/[id]/read/route";
import { setupApiHarness } from "../../setup/api-harness";
import { createTestUser, createTestResource } from "../../setup/db";

const harness = setupApiHarness([
  { path: "/api/v1/me/favorites", handlers: { GET: favoritesGet } },
  { path: "/api/v1/me/saved", handlers: { GET: savedGet } },
  { path: "/api/v1/me/completions", handlers: { GET: completionsGet } },
  { path: "/api/v1/me/resources", handlers: { GET: resourcesGet } },
  { path: "/api/v1/me/resources/[id]/submit", handlers: { POST: submitPost } },
  { path: "/api/v1/resources/[id]/favorite", handlers: { POST: favoriteToggle } },
  { path: "/api/v1/resources/[id]/save", handlers: { POST: saveToggle } },
  { path: "/api/v1/resources/[id]/read", handlers: { POST: readToggle } },
]);

describe("Me lists", () => {
  it("GET /me/favorites requires auth", async () => {
    expect((await harness.req().get("/api/v1/me/favorites")).status).toBe(401);
  });
  it("GET /me/saved requires auth", async () => {
    expect((await harness.req().get("/api/v1/me/saved")).status).toBe(401);
  });
  it("GET /me/completions requires auth", async () => {
    expect((await harness.req().get("/api/v1/me/completions")).status).toBe(401);
  });
  it("GET /me/resources requires auth", async () => {
    expect((await harness.req().get("/api/v1/me/resources")).status).toBe(401);
  });

  it("GET /me/favorites returns favorited resources", async () => {
    const u = await createTestUser();
    const r = await createTestResource({ authorId: u.id });
    await harness.req().post(`/api/v1/resources/${r.id}/favorite`).set("Authorization", `Bearer ${u.token}`);
    const res = await harness.req().get("/api/v1/me/favorites").set("Authorization", `Bearer ${u.token}`);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].id).toBe(r.id);
  });

  it("GET /me/saved returns saved resources", async () => {
    const u = await createTestUser();
    const r = await createTestResource({ authorId: u.id });
    await harness.req().post(`/api/v1/resources/${r.id}/save`).set("Authorization", `Bearer ${u.token}`);
    const res = await harness.req().get("/api/v1/me/saved").set("Authorization", `Bearer ${u.token}`);
    expect(res.body.data.length).toBe(1);
  });

  it("GET /me/completions returns completed resources", async () => {
    const u = await createTestUser();
    const r = await createTestResource({ authorId: u.id });
    await harness.req().post(`/api/v1/resources/${r.id}/read`).set("Authorization", `Bearer ${u.token}`);
    const res = await harness.req().get("/api/v1/me/completions").set("Authorization", `Bearer ${u.token}`);
    expect(res.body.data.length).toBe(1);
  });

  it("GET /me/resources returns the user's own resources only", async () => {
    const a = await createTestUser();
    const b = await createTestUser();
    await createTestResource({ authorId: a.id, title: "MyA" });
    await createTestResource({ authorId: b.id, title: "MyB" });
    const res = await harness.req().get("/api/v1/me/resources").set("Authorization", `Bearer ${a.token}`);
    const titles = res.body.data.map((r: { title: string }) => r.title);
    expect(titles).toContain("MyA");
    expect(titles).not.toContain("MyB");
  });
});

describe("POST /me/resources/[id]/submit", () => {
  it("requires auth", async () => {
    expect((await harness.req().post("/api/v1/me/resources/x/submit")).status).toBe(401);
  });
  it("404 if missing", async () => {
    const u = await createTestUser();
    const res = await harness.req().post("/api/v1/me/resources/missing/submit").set("Authorization", `Bearer ${u.token}`);
    expect(res.status).toBe(404);
  });
  it("403 if not author", async () => {
    const a = await createTestUser();
    const b = await createTestUser();
    const r = await createTestResource({ authorId: a.id, status: "draft" });
    const res = await harness.req().post(`/api/v1/me/resources/${r.id}/submit`).set("Authorization", `Bearer ${b.token}`);
    expect(res.status).toBe(403);
  });
  it("400 if not draft", async () => {
    const u = await createTestUser();
    const r = await createTestResource({ authorId: u.id, status: "published" });
    const res = await harness.req().post(`/api/v1/me/resources/${r.id}/submit`).set("Authorization", `Bearer ${u.token}`);
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_STATE");
  });
  it("draft → pending", async () => {
    const u = await createTestUser();
    const r = await createTestResource({ authorId: u.id, status: "draft" });
    const res = await harness.req().post(`/api/v1/me/resources/${r.id}/submit`).set("Authorization", `Bearer ${u.token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("pending");
  });
});
