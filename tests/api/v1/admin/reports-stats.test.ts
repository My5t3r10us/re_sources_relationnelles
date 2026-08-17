import { describe, it, expect } from "vitest";
import { GET as reportsGet } from "@/app/api/v1/admin/reports/route";
import { PUT as resolvePut } from "@/app/api/v1/admin/reports/[id]/resolve/route";
import { GET as statsGet } from "@/app/api/v1/admin/stats/route";
import { POST as createReport } from "@/app/api/v1/reports/route";
import { setupApiHarness } from "../../../setup/api-harness";
import { createTestUser, createTestResource } from "../../../setup/db";

const harness = setupApiHarness([
  { path: "/api/v1/admin/reports", handlers: { GET: reportsGet } },
  { path: "/api/v1/admin/reports/[id]/resolve", handlers: { PUT: resolvePut } },
  { path: "/api/v1/admin/stats", handlers: { GET: statsGet } },
  { path: "/api/v1/reports", handlers: { POST: createReport } },
]);

describe("Admin reports", () => {
  it("403 for citizen", async () => {
    const u = await createTestUser();
    const res = await harness.req().get("/api/v1/admin/reports").set("Authorization", `Bearer ${u.token}`);
    expect(res.status).toBe(403);
  });

  it("lists reports for admin", async () => {
    const admin = await createTestUser({ role: "admin" });
    const u = await createTestUser();
    const r = await createTestResource({ authorId: u.id });
    await harness
      .req()
      .post("/api/v1/reports")
      .set("Authorization", `Bearer ${u.token}`)
      .send({ reason: "spam", resourceId: r.id });
    const res = await harness.req().get("/api/v1/admin/reports").set("Authorization", `Bearer ${admin.token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
  });

  it("filters by resolved=false", async () => {
    const admin = await createTestUser({ role: "admin" });
    const res = await harness.req().get("/api/v1/admin/reports?resolved=false").set("Authorization", `Bearer ${admin.token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.every((r: { resolved: boolean }) => r.resolved === false)).toBe(true);
  });

  it("PUT /resolve 404 for unknown", async () => {
    const admin = await createTestUser({ role: "admin" });
    const res = await harness
      .req()
      .put("/api/v1/admin/reports/missing/resolve")
      .set("Authorization", `Bearer ${admin.token}`);
    expect(res.status).toBe(404);
  });

  it("PUT /resolve 403 for citizen", async () => {
    const u = await createTestUser();
    const res = await harness.req().put("/api/v1/admin/reports/x/resolve").set("Authorization", `Bearer ${u.token}`);
    expect(res.status).toBe(403);
  });

  it("PUT /resolve successfully marks report as resolved", async () => {
    const admin = await createTestUser({ role: "admin" });
    const u = await createTestUser();
    const r = await createTestResource({ authorId: u.id });
    const reportRes = await harness
      .req()
      .post("/api/v1/reports")
      .set("Authorization", `Bearer ${u.token}`)
      .send({ reason: "spam", resourceId: r.id });
    const reportId = reportRes.body.data.id;

    const res = await harness
      .req()
      .put(`/api/v1/admin/reports/${reportId}/resolve`)
      .set("Authorization", `Bearer ${admin.token}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ id: reportId, resolved: true });
  });

  it("GET /admin/reports filters by resolved=true", async () => {
    const admin = await createTestUser({ role: "admin" });
    const u = await createTestUser();
    const r = await createTestResource({ authorId: u.id });
    const reportRes = await harness
      .req()
      .post("/api/v1/reports")
      .set("Authorization", `Bearer ${u.token}`)
      .send({ reason: "spam", resourceId: r.id });
    await harness
      .req()
      .put(`/api/v1/admin/reports/${reportRes.body.data.id}/resolve`)
      .set("Authorization", `Bearer ${admin.token}`);

    const res = await harness.req().get("/api/v1/admin/reports?resolved=true").set("Authorization", `Bearer ${admin.token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.every((rp: { resolved: boolean }) => rp.resolved === true)).toBe(true);
  });

  it("GET /admin/reports 401 without auth", async () => {
    const res = await harness.req().get("/api/v1/admin/reports");
    expect(res.status).toBe(401);
  });
});

describe("Admin stats", () => {
  it("401 without auth", async () => {
    const res = await harness.req().get("/api/v1/admin/stats");
    expect(res.status).toBe(401);
  });

  it("403 for citizen", async () => {
    const u = await createTestUser();
    const res = await harness.req().get("/api/v1/admin/stats").set("Authorization", `Bearer ${u.token}`);
    expect(res.status).toBe(403);
  });

  it("refuses a disabled admin account", async () => {
    const admin = await createTestUser({ role: "admin", active: false });
    const res = await harness.req().get("/api/v1/admin/stats").set("Authorization", `Bearer ${admin.token}`);
    expect(res.status).toBe(403);
  });

  it("returns shape for admin", async () => {
    const admin = await createTestUser({ role: "admin" });
    const res = await harness.req().get("/api/v1/admin/stats").set("Authorization", `Bearer ${admin.token}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty("metrics");
    expect(res.body.data).toHaveProperty("engagement");
    expect(res.body.data).toHaveProperty("moderation");
    expect(res.body.data).toHaveProperty("timeline");
  });

  it("applies media type and period filters", async () => {
    const admin = await createTestUser({ role: "admin" });
    const author = await createTestUser();
    await createTestResource({ authorId: author.id, mediaType: "article" });
    await createTestResource({ authorId: author.id, mediaType: "video" });

    const res = await harness.req().get("/api/v1/admin/stats?mediaType=article&period=30d")
      .set("Authorization", `Bearer ${admin.token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.filters).toMatchObject({ mediaType: "article", period: "30d" });
    expect(res.body.data.metrics.resources).toBe(1);
  });

  it("ignores invalid filter values", async () => {
    const admin = await createTestUser({ role: "admin" });
    const res = await harness.req().get("/api/v1/admin/stats?mediaType=exe&period=tomorrow")
      .set("Authorization", `Bearer ${admin.token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.filters).toMatchObject({ mediaType: "all", period: "all" });
  });
});
