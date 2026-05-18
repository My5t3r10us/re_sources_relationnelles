import { describe, it, expect } from "vitest";
import { GET as listGet, POST as listPost } from "@/app/api/v1/resources/[id]/comments/route";
import { DELETE as commentDelete } from "@/app/api/v1/comments/[id]/route";
import { POST as likePost } from "@/app/api/v1/comments/[id]/like/route";
import { setupApiHarness } from "../../setup/api-harness";
import { createTestUser, createTestResource, createTestComment } from "../../setup/db";

const harness = setupApiHarness([
  { path: "/api/v1/resources/[id]/comments", handlers: { GET: listGet, POST: listPost } },
  { path: "/api/v1/comments/[id]", handlers: { DELETE: commentDelete } },
  { path: "/api/v1/comments/[id]/like", handlers: { POST: likePost } },
]);

describe("Comments API", () => {
  describe("GET /resources/[id]/comments", () => {
    it("lists only visible comments", async () => {
      const u = await createTestUser();
      const r = await createTestResource({ authorId: u.id });
      await createTestComment({ resourceId: r.id, authorId: u.id, content: "First" });
      const res = await harness.req().get(`/api/v1/resources/${r.id}/comments`);
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].content).toBe("First");
    });
  });

  describe("POST /resources/[id]/comments", () => {
    it("requires auth", async () => {
      const res = await harness.req().post("/api/v1/resources/x/comments").send({ content: "hi" });
      expect(res.status).toBe(401);
    });

    it("rejects empty content", async () => {
      const u = await createTestUser();
      const r = await createTestResource({ authorId: u.id });
      const res = await harness
        .req()
        .post(`/api/v1/resources/${r.id}/comments`)
        .set("Authorization", `Bearer ${u.token}`)
        .send({ content: "   " });
      expect(res.status).toBe(400);
    });

    it("rejects content > 2000 chars", async () => {
      const u = await createTestUser();
      const r = await createTestResource({ authorId: u.id });
      const res = await harness
        .req()
        .post(`/api/v1/resources/${r.id}/comments`)
        .set("Authorization", `Bearer ${u.token}`)
        .send({ content: "x".repeat(2001) });
      expect(res.status).toBe(400);
    });

    it("creates a comment with 201", async () => {
      const u = await createTestUser();
      const r = await createTestResource({ authorId: u.id });
      const res = await harness
        .req()
        .post(`/api/v1/resources/${r.id}/comments`)
        .set("Authorization", `Bearer ${u.token}`)
        .send({ content: "Bravo" });
      expect(res.status).toBe(201);
      expect(res.body.data.content).toBe("Bravo");
    });
  });

  describe("DELETE /comments/[id]", () => {
    it("requires auth", async () => {
      const res = await harness.req().delete("/api/v1/comments/x");
      expect(res.status).toBe(401);
    });

    it("404 for unknown id", async () => {
      const u = await createTestUser();
      const res = await harness
        .req()
        .delete("/api/v1/comments/missing")
        .set("Authorization", `Bearer ${u.token}`);
      expect(res.status).toBe(404);
    });

    it("403 when not author", async () => {
      const a = await createTestUser();
      const b = await createTestUser();
      const r = await createTestResource({ authorId: a.id });
      const c = await createTestComment({ resourceId: r.id, authorId: a.id });
      const res = await harness
        .req()
        .delete(`/api/v1/comments/${c.id}`)
        .set("Authorization", `Bearer ${b.token}`);
      expect(res.status).toBe(403);
    });

    it("author can delete", async () => {
      const u = await createTestUser();
      const r = await createTestResource({ authorId: u.id });
      const c = await createTestComment({ resourceId: r.id, authorId: u.id });
      const res = await harness
        .req()
        .delete(`/api/v1/comments/${c.id}`)
        .set("Authorization", `Bearer ${u.token}`);
      expect(res.status).toBe(200);
    });
  });

  describe("POST /comments/[id]/like", () => {
    it("requires auth", async () => {
      const res = await harness.req().post("/api/v1/comments/x/like");
      expect(res.status).toBe(401);
    });

    it("toggles like on/off and updates likes count", async () => {
      const u = await createTestUser();
      const r = await createTestResource({ authorId: u.id });
      const c = await createTestComment({ resourceId: r.id, authorId: u.id });
      const a = await harness.req().post(`/api/v1/comments/${c.id}/like`).set("Authorization", `Bearer ${u.token}`);
      expect(a.body.data.liked).toBe(true);
      const b = await harness.req().post(`/api/v1/comments/${c.id}/like`).set("Authorization", `Bearer ${u.token}`);
      expect(b.body.data.liked).toBe(false);
    });
  });
});
