import { describe, it, expect } from "vitest";
import { POST as favoritePost } from "@/app/api/v1/resources/[id]/favorite/route";
import { POST as savePost } from "@/app/api/v1/resources/[id]/save/route";
import { POST as readPost } from "@/app/api/v1/resources/[id]/read/route";
import { setupApiHarness } from "../../setup/api-harness";
import { createTestUser, createTestResource } from "../../setup/db";

const harness = setupApiHarness([
  { path: "/api/v1/resources/[id]/favorite", handlers: { POST: favoritePost } },
  { path: "/api/v1/resources/[id]/save", handlers: { POST: savePost } },
  { path: "/api/v1/resources/[id]/read", handlers: { POST: readPost } },
]);

describe("Resource toggles (favorite/save/read)", () => {
  it.each([
    ["favorite", "isFavorite"],
    ["save", "isSaved"],
    ["read", "isRead"],
  ])("/%s requires auth", async (path) => {
    const res = await harness.req().post(`/api/v1/resources/r/${path === "favorite" ? "favorite" : path === "save" ? "save" : "read"}`);
    expect(res.status).toBe(401);
  });

  it("toggles favorite on/off", async () => {
    const u = await createTestUser();
    const r = await createTestResource({ authorId: u.id });
    const headers = { Authorization: `Bearer ${u.token}` };
    const a = await harness.req().post(`/api/v1/resources/${r.id}/favorite`).set(headers);
    expect(a.body.data.isFavorite).toBe(true);
    const b = await harness.req().post(`/api/v1/resources/${r.id}/favorite`).set(headers);
    expect(b.body.data.isFavorite).toBe(false);
  });

  it("toggles save on/off", async () => {
    const u = await createTestUser();
    const r = await createTestResource({ authorId: u.id });
    const headers = { Authorization: `Bearer ${u.token}` };
    const a = await harness.req().post(`/api/v1/resources/${r.id}/save`).set(headers);
    expect(a.body.data.isSaved).toBe(true);
    const b = await harness.req().post(`/api/v1/resources/${r.id}/save`).set(headers);
    expect(b.body.data.isSaved).toBe(false);
  });

  it("toggles read on/off", async () => {
    const u = await createTestUser();
    const r = await createTestResource({ authorId: u.id });
    const headers = { Authorization: `Bearer ${u.token}` };
    const a = await harness.req().post(`/api/v1/resources/${r.id}/read`).set(headers);
    expect(a.body.data.isRead).toBe(true);
    const b = await harness.req().post(`/api/v1/resources/${r.id}/read`).set(headers);
    expect(b.body.data.isRead).toBe(false);
  });
});
