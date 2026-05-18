import { describe, it, expect } from "vitest";
import { POST } from "@/app/api/v1/reports/route";
import { setupApiHarness } from "../../setup/api-harness";
import { createTestUser, createTestResource, createTestComment } from "../../setup/db";

const harness = setupApiHarness([
  { path: "/api/v1/reports", handlers: { POST } },
]);

describe("POST /api/v1/reports", () => {
  it("requires auth", async () => {
    const res = await harness.req().post("/api/v1/reports").send({});
    expect(res.status).toBe(401);
  });

  it("rejects invalid reason", async () => {
    const u = await createTestUser();
    const res = await harness
      .req()
      .post("/api/v1/reports")
      .set("Authorization", `Bearer ${u.token}`)
      .send({ reason: "notvalid", resourceId: "x" });
    expect(res.status).toBe(400);
  });

  it("requires exactly one of resourceId or commentId", async () => {
    const u = await createTestUser();
    const r1 = await harness
      .req()
      .post("/api/v1/reports")
      .set("Authorization", `Bearer ${u.token}`)
      .send({ reason: "spam" });
    expect(r1.status).toBe(400);

    const r2 = await harness
      .req()
      .post("/api/v1/reports")
      .set("Authorization", `Bearer ${u.token}`)
      .send({ reason: "spam", resourceId: "x", commentId: "y" });
    expect(r2.status).toBe(400);
  });

  it("404 if target resource does not exist", async () => {
    const u = await createTestUser();
    const res = await harness
      .req()
      .post("/api/v1/reports")
      .set("Authorization", `Bearer ${u.token}`)
      .send({ reason: "spam", resourceId: "missing" });
    expect(res.status).toBe(404);
  });

  it("creates a report on a resource", async () => {
    const u = await createTestUser();
    const r = await createTestResource({ authorId: u.id });
    const res = await harness
      .req()
      .post("/api/v1/reports")
      .set("Authorization", `Bearer ${u.token}`)
      .send({ reason: "harassment", description: "x", resourceId: r.id });
    expect(res.status).toBe(201);
    expect(res.body.data.id).toBeTruthy();
  });

  it("creates a report on a comment", async () => {
    const u = await createTestUser();
    const r = await createTestResource({ authorId: u.id });
    const c = await createTestComment({ resourceId: r.id, authorId: u.id });
    const res = await harness
      .req()
      .post("/api/v1/reports")
      .set("Authorization", `Bearer ${u.token}`)
      .send({ reason: "inappropriate", commentId: c.id });
    expect(res.status).toBe(201);
  });
});
