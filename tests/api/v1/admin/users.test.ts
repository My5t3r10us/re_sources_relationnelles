import { describe, it, expect } from "vitest";
import { GET, POST } from "@/app/api/v1/admin/users/route";
import { PUT as activePut } from "@/app/api/v1/admin/users/[id]/active/route";
import { PUT as rolePut } from "@/app/api/v1/admin/users/[id]/role/route";
import { setupApiHarness } from "../../../setup/api-harness";
import { createTestUser } from "../../../setup/db";

const harness = setupApiHarness([
  { path: "/api/v1/admin/users", handlers: { GET, POST } },
  { path: "/api/v1/admin/users/[id]/active", handlers: { PUT: activePut } },
  { path: "/api/v1/admin/users/[id]/role", handlers: { PUT: rolePut } },
]);

describe("Admin users", () => {
  describe("GET", () => {
    it("403 for citizen", async () => {
      const u = await createTestUser();
      const res = await harness.req().get("/api/v1/admin/users").set("Authorization", `Bearer ${u.token}`);
      expect(res.status).toBe(403);
    });

    it("lists users with pagination", async () => {
      const admin = await createTestUser({ role: "admin" });
      const res = await harness.req().get("/api/v1/admin/users?page=1&limit=5").set("Authorization", `Bearer ${admin.token}`);
      expect(res.status).toBe(200);
      expect(res.body.meta).toMatchObject({ page: 1, limit: 5 });
    });
  });

  describe("POST", () => {
    it("requires super_admin", async () => {
      const admin = await createTestUser({ role: "admin" });
      const res = await harness
        .req()
        .post("/api/v1/admin/users")
        .set("Authorization", `Bearer ${admin.token}`)
        .send({ name: "X", email: "x@x.com", password: "Password123!", role: "moderator" });
      expect(res.status).toBe(403);
    });

    it("super_admin can create moderator", async () => {
      const sa = await createTestUser({ role: "super_admin" });
      const res = await harness
        .req()
        .post("/api/v1/admin/users")
        .set("Authorization", `Bearer ${sa.token}`)
        .send({ name: "Mod", email: "mod@x.com", password: "Password123!", role: "moderator" });
      expect(res.status).toBe(201);
      expect(res.body.data.email).toBe("mod@x.com");
    });

    it("returns 409 on duplicate email", async () => {
      const sa = await createTestUser({ role: "super_admin" });
      await createTestUser({ email: "dup@x.com" });
      const res = await harness
        .req()
        .post("/api/v1/admin/users")
        .set("Authorization", `Bearer ${sa.token}`)
        .send({ name: "Z", email: "dup@x.com", password: "Password123!", role: "moderator" });
      expect(res.status).toBe(409);
    });
  });

  describe("PUT /active", () => {
    it("toggles active", async () => {
      const admin = await createTestUser({ role: "admin" });
      const target = await createTestUser({ active: true });
      const res = await harness
        .req()
        .put(`/api/v1/admin/users/${target.id}/active`)
        .set("Authorization", `Bearer ${admin.token}`);
      expect(res.status).toBe(200);
      expect(res.body.data.active).toBe(false);
    });

    it("404 for unknown id", async () => {
      const admin = await createTestUser({ role: "admin" });
      const res = await harness
        .req()
        .put("/api/v1/admin/users/missing/active")
        .set("Authorization", `Bearer ${admin.token}`);
      expect(res.status).toBe(404);
    });
  });

  describe("PUT /role", () => {
    it("admin can promote to moderator/admin", async () => {
      const admin = await createTestUser({ role: "admin" });
      const target = await createTestUser();
      const res = await harness
        .req()
        .put(`/api/v1/admin/users/${target.id}/role`)
        .set("Authorization", `Bearer ${admin.token}`)
        .send({ role: "moderator" });
      expect(res.status).toBe(200);
      expect(res.body.data.role).toBe("moderator");
    });

    it("admin cannot promote to super_admin", async () => {
      const admin = await createTestUser({ role: "admin" });
      const target = await createTestUser();
      const res = await harness
        .req()
        .put(`/api/v1/admin/users/${target.id}/role`)
        .set("Authorization", `Bearer ${admin.token}`)
        .send({ role: "super_admin" });
      expect(res.status).toBe(403);
    });

    it("rejects invalid role", async () => {
      const admin = await createTestUser({ role: "admin" });
      const target = await createTestUser();
      const res = await harness
        .req()
        .put(`/api/v1/admin/users/${target.id}/role`)
        .set("Authorization", `Bearer ${admin.token}`)
        .send({ role: "lord" });
      expect(res.status).toBe(400);
    });
  });
});
