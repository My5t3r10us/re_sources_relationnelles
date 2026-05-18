import { describe, it, expect } from "vitest";
import { GET } from "@/app/api/v1/admin/comments/route";
import { DELETE } from "@/app/api/v1/admin/comments/[id]/route";
import { PUT } from "@/app/api/v1/admin/comments/[id]/status/route";
import { setupApiHarness } from "../../../setup/api-harness";
import { createTestUser, createTestResource, createTestComment } from "../../../setup/db";

const harness = setupApiHarness([
  { path: "/api/v1/admin/comments", handlers: { GET } },
  { path: "/api/v1/admin/comments/[id]", handlers: { DELETE } },
  { path: "/api/v1/admin/comments/[id]/status", handlers: { PUT } },
]);

describe("Admin comments", () => {
  describe("GET", () => {
    it("403 for citizen", async () => {
      const u = await createTestUser();
      const res = await harness.req().get("/api/v1/admin/comments").set("Authorization", `Bearer ${u.token}`);
      expect(res.status).toBe(403);
    });

    it("lists for admin with pagination meta", async () => {
      const admin = await createTestUser({ role: "admin" });
      const res = await harness.req().get("/api/v1/admin/comments").set("Authorization", `Bearer ${admin.token}`);
      expect(res.status).toBe(200);
      expect(res.body.meta).toMatchObject({ page: 1, limit: 20 });
    });
  });

  describe("PUT /status", () => {
    it("rejects invalid status", async () => {
      const admin = await createTestUser({ role: "admin" });
      const u = await createTestUser();
      const r = await createTestResource({ authorId: u.id });
      const c = await createTestComment({ resourceId: r.id, authorId: u.id });
      const res = await harness
        .req()
        .put(`/api/v1/admin/comments/${c.id}/status`)
        .set("Authorization", `Bearer ${admin.token}`)
        .send({ status: "bad" });
      expect(res.status).toBe(400);
    });

    it("updates status to hidden", async () => {
      const admin = await createTestUser({ role: "admin" });
      const u = await createTestUser();
      const r = await createTestResource({ authorId: u.id });
      const c = await createTestComment({ resourceId: r.id, authorId: u.id });
      const res = await harness
        .req()
        .put(`/api/v1/admin/comments/${c.id}/status`)
        .set("Authorization", `Bearer ${admin.token}`)
        .send({ status: "hidden" });
      expect(res.body.data.status).toBe("hidden");
    });
  });

  describe("DELETE", () => {
    it("404 for unknown", async () => {
      const admin = await createTestUser({ role: "admin" });
      const res = await harness
        .req()
        .delete("/api/v1/admin/comments/missing")
        .set("Authorization", `Bearer ${admin.token}`);
      expect(res.status).toBe(404);
    });

    it("deletes comment", async () => {
      const admin = await createTestUser({ role: "admin" });
      const u = await createTestUser();
      const r = await createTestResource({ authorId: u.id });
      const c = await createTestComment({ resourceId: r.id, authorId: u.id });
      const res = await harness
        .req()
        .delete(`/api/v1/admin/comments/${c.id}`)
        .set("Authorization", `Bearer ${admin.token}`);
      expect(res.status).toBe(200);
    });
  });
});
