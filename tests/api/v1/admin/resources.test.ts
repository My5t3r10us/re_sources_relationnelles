import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/s3", () => ({
  deleteObject: vi.fn().mockResolvedValue(undefined),
  getObjectKeyFromUrl: () => "key",
}));

import { GET as listGet } from "@/app/api/v1/admin/resources/route";
import { DELETE as resourceDelete } from "@/app/api/v1/admin/resources/[id]/route";
import { PUT as statusPut } from "@/app/api/v1/admin/resources/[id]/status/route";
import { PUT as featuredPut } from "@/app/api/v1/admin/resources/[id]/featured/route";
import { setupApiHarness } from "../../../setup/api-harness";
import { createTestUser, createTestResource } from "../../../setup/db";

const harness = setupApiHarness([
  { path: "/api/v1/admin/resources", handlers: { GET: listGet } },
  { path: "/api/v1/admin/resources/[id]", handlers: { DELETE: resourceDelete } },
  { path: "/api/v1/admin/resources/[id]/status", handlers: { PUT: statusPut } },
  { path: "/api/v1/admin/resources/[id]/featured", handlers: { PUT: featuredPut } },
]);

describe("Admin resources", () => {
  describe("GET", () => {
    it("403 for citizen", async () => {
      const u = await createTestUser();
      const res = await harness.req().get("/api/v1/admin/resources").set("Authorization", `Bearer ${u.token}`);
      expect(res.status).toBe(403);
    });

    it("filters by status", async () => {
      const admin = await createTestUser({ role: "admin" });
      const u = await createTestUser();
      await createTestResource({ authorId: u.id, status: "pending" });
      await createTestResource({ authorId: u.id, status: "published" });
      const res = await harness
        .req()
        .get("/api/v1/admin/resources?status=pending")
        .set("Authorization", `Bearer ${admin.token}`);
      expect(res.body.data.every((r: { status: string }) => r.status === "pending")).toBe(true);
    });

    it("filters by featured=true", async () => {
      const admin = await createTestUser({ role: "admin" });
      const u = await createTestUser();
      await createTestResource({ authorId: u.id, featured: true });
      await createTestResource({ authorId: u.id, featured: false });
      const res = await harness
        .req()
        .get("/api/v1/admin/resources?featured=true")
        .set("Authorization", `Bearer ${admin.token}`);
      expect(res.body.data.every((r: { featured: boolean }) => r.featured === true)).toBe(true);
    });
  });

  describe("PUT /status", () => {
    it("rejects invalid status", async () => {
      const admin = await createTestUser({ role: "admin" });
      const u = await createTestUser();
      const r = await createTestResource({ authorId: u.id });
      const res = await harness
        .req()
        .put(`/api/v1/admin/resources/${r.id}/status`)
        .set("Authorization", `Bearer ${admin.token}`)
        .send({ status: "wrong" });
      expect(res.status).toBe(400);
    });

    it("404 for missing resource", async () => {
      const admin = await createTestUser({ role: "admin" });
      const res = await harness
        .req()
        .put("/api/v1/admin/resources/missing/status")
        .set("Authorization", `Bearer ${admin.token}`)
        .send({ status: "published" });
      expect(res.status).toBe(404);
    });

    it("updates status", async () => {
      const admin = await createTestUser({ role: "admin" });
      const u = await createTestUser();
      const r = await createTestResource({ authorId: u.id, status: "pending" });
      const res = await harness
        .req()
        .put(`/api/v1/admin/resources/${r.id}/status`)
        .set("Authorization", `Bearer ${admin.token}`)
        .send({ status: "published" });
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe("published");
    });
  });

  describe("PUT /featured", () => {
    it("validates boolean", async () => {
      const admin = await createTestUser({ role: "admin" });
      const u = await createTestUser();
      const r = await createTestResource({ authorId: u.id });
      const res = await harness
        .req()
        .put(`/api/v1/admin/resources/${r.id}/featured`)
        .set("Authorization", `Bearer ${admin.token}`)
        .send({ featured: "yes" });
      expect(res.status).toBe(400);
    });

    it("toggles featured", async () => {
      const admin = await createTestUser({ role: "admin" });
      const u = await createTestUser();
      const r = await createTestResource({ authorId: u.id });
      const res = await harness
        .req()
        .put(`/api/v1/admin/resources/${r.id}/featured`)
        .set("Authorization", `Bearer ${admin.token}`)
        .send({ featured: true });
      expect(res.body.data.featured).toBe(true);
    });
  });

  describe("DELETE", () => {
    it("404 for unknown", async () => {
      const admin = await createTestUser({ role: "admin" });
      const res = await harness
        .req()
        .delete("/api/v1/admin/resources/missing")
        .set("Authorization", `Bearer ${admin.token}`);
      expect(res.status).toBe(404);
    });

    it("deletes resource", async () => {
      const admin = await createTestUser({ role: "admin" });
      const u = await createTestUser();
      const r = await createTestResource({ authorId: u.id });
      const res = await harness
        .req()
        .delete(`/api/v1/admin/resources/${r.id}`)
        .set("Authorization", `Bearer ${admin.token}`);
      expect(res.status).toBe(200);
    });
  });
});
