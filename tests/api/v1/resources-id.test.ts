import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/s3", () => ({
  deleteObject: vi.fn().mockResolvedValue(undefined),
  getObjectKeyFromUrl: () => "key",
}));

import { GET, PUT, DELETE } from "@/app/api/v1/resources/[id]/route";
import { setupApiHarness } from "../../setup/api-harness";
import { createTestUser, createTestResource } from "../../setup/db";

const harness = setupApiHarness([
  { path: "/api/v1/resources/[id]", handlers: { GET, PUT, DELETE } },
]);

describe("/api/v1/resources/[id]", () => {
  describe("GET", () => {
    it("returns 404 for unknown id", async () => {
      const res = await harness.req().get("/api/v1/resources/does-not-exist");
      expect(res.status).toBe(404);
    });

    it("returns the resource for anonymous on published+public", async () => {
      const u = await createTestUser();
      const r = await createTestResource({ authorId: u.id, status: "published", privacy: "public" });
      const res = await harness.req().get(`/api/v1/resources/${r.id}`);
      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(r.id);
      expect(res.body.data.isFavorite).toBe(false);
    });

    it("hides draft from anonymous", async () => {
      const u = await createTestUser();
      const r = await createTestResource({ authorId: u.id, status: "draft", privacy: "public" });
      const res = await harness.req().get(`/api/v1/resources/${r.id}`);
      expect(res.status).toBe(404);
    });

    it("returns 403 for private to anon", async () => {
      const u = await createTestUser();
      const r = await createTestResource({ authorId: u.id, status: "published", privacy: "private" });
      const res = await harness.req().get(`/api/v1/resources/${r.id}`);
      expect([403, 404]).toContain(res.status);
    });

    it("admin can read drafts", async () => {
      const u = await createTestUser();
      const admin = await createTestUser({ role: "admin" });
      const r = await createTestResource({ authorId: u.id, status: "draft", privacy: "public" });
      const res = await harness
        .req()
        .get(`/api/v1/resources/${r.id}`)
        .set("Authorization", `Bearer ${admin.token}`);
      expect(res.status).toBe(200);
    });
  });

  describe("PUT", () => {
    it("requires authentication", async () => {
      const res = await harness.req().put("/api/v1/resources/abc").send({ title: "x", content: "y" });
      expect(res.status).toBe(401);
    });

    it("returns 404 for unknown id", async () => {
      const u = await createTestUser();
      const res = await harness
        .req()
        .put("/api/v1/resources/missing")
        .set("Authorization", `Bearer ${u.token}`)
        .send({ title: "x", content: "y" });
      expect(res.status).toBe(404);
    });

    it("forbids non-author", async () => {
      const a = await createTestUser();
      const b = await createTestUser();
      const r = await createTestResource({ authorId: a.id, status: "published" });
      const res = await harness
        .req()
        .put(`/api/v1/resources/${r.id}`)
        .set("Authorization", `Bearer ${b.token}`)
        .send({ title: "x", content: "y" });
      expect(res.status).toBe(403);
    });

    it("validates title/content", async () => {
      const u = await createTestUser();
      const r = await createTestResource({ authorId: u.id });
      const res = await harness
        .req()
        .put(`/api/v1/resources/${r.id}`)
        .set("Authorization", `Bearer ${u.token}`)
        .send({ title: "", content: "" });
      expect(res.status).toBe(400);
    });

    it("author can update their resource", async () => {
      const u = await createTestUser();
      const r = await createTestResource({ authorId: u.id });
      const res = await harness
        .req()
        .put(`/api/v1/resources/${r.id}`)
        .set("Authorization", `Bearer ${u.token}`)
        .send({ title: "Nouveau", content: "Nouveau contenu" });
      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe("Nouveau");
    });
  });

  describe("DELETE", () => {
    it("requires auth", async () => {
      const res = await harness.req().delete("/api/v1/resources/x");
      expect(res.status).toBe(401);
    });

    it("returns 404 for unknown id", async () => {
      const u = await createTestUser();
      const res = await harness
        .req()
        .delete("/api/v1/resources/missing")
        .set("Authorization", `Bearer ${u.token}`);
      expect(res.status).toBe(404);
    });

    it("forbids non-author non-admin", async () => {
      const a = await createTestUser();
      const b = await createTestUser();
      const r = await createTestResource({ authorId: a.id });
      const res = await harness
        .req()
        .delete(`/api/v1/resources/${r.id}`)
        .set("Authorization", `Bearer ${b.token}`);
      expect(res.status).toBe(403);
    });

    it("author can delete their resource", async () => {
      const u = await createTestUser();
      const r = await createTestResource({ authorId: u.id });
      const res = await harness
        .req()
        .delete(`/api/v1/resources/${r.id}`)
        .set("Authorization", `Bearer ${u.token}`);
      expect(res.status).toBe(200);
      expect(res.body.data.deleted).toBe(true);
    });

    it("admin can delete any resource", async () => {
      const a = await createTestUser();
      const admin = await createTestUser({ role: "admin" });
      const r = await createTestResource({ authorId: a.id });
      const res = await harness
        .req()
        .delete(`/api/v1/resources/${r.id}`)
        .set("Authorization", `Bearer ${admin.token}`);
      expect(res.status).toBe(200);
    });
  });
});
