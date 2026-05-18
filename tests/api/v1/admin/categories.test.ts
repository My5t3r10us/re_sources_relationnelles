import { describe, it, expect } from "vitest";
import { GET, POST } from "@/app/api/v1/admin/categories/route";
import { PUT, DELETE } from "@/app/api/v1/admin/categories/[id]/route";
import { setupApiHarness } from "../../../setup/api-harness";
import { createTestUser, createTestCategory } from "../../../setup/db";

const harness = setupApiHarness([
  { path: "/api/v1/admin/categories", handlers: { GET, POST } },
  { path: "/api/v1/admin/categories/[id]", handlers: { PUT, DELETE } },
]);

describe("Admin categories", () => {
  it("GET forbids non-admin", async () => {
    const u = await createTestUser({ role: "citizen" });
    const res = await harness.req().get("/api/v1/admin/categories").set("Authorization", `Bearer ${u.token}`);
    expect(res.status).toBe(403);
  });

  it("GET works for admin", async () => {
    const admin = await createTestUser({ role: "admin" });
    await createTestCategory();
    const res = await harness.req().get("/api/v1/admin/categories").set("Authorization", `Bearer ${admin.token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
  });

  it("POST validates name+slug", async () => {
    const admin = await createTestUser({ role: "admin" });
    const res = await harness
      .req()
      .post("/api/v1/admin/categories")
      .set("Authorization", `Bearer ${admin.token}`)
      .send({});
    expect(res.status).toBe(400);
  });

  it("POST rejects duplicate slug", async () => {
    const admin = await createTestUser({ role: "admin" });
    await createTestCategory({ slug: "dup" });
    const res = await harness
      .req()
      .post("/api/v1/admin/categories")
      .set("Authorization", `Bearer ${admin.token}`)
      .send({ name: "X", slug: "dup" });
    expect(res.status).toBe(409);
  });

  it("POST creates a category", async () => {
    const admin = await createTestUser({ role: "admin" });
    const res = await harness
      .req()
      .post("/api/v1/admin/categories")
      .set("Authorization", `Bearer ${admin.token}`)
      .send({ name: "Famille", slug: "famille", icon: "👨‍👩" });
    expect(res.status).toBe(201);
    expect(res.body.data.slug).toBe("famille");
  });

  it("PUT 404 unknown id", async () => {
    const admin = await createTestUser({ role: "admin" });
    const res = await harness
      .req()
      .put("/api/v1/admin/categories/missing")
      .set("Authorization", `Bearer ${admin.token}`)
      .send({ name: "X", slug: "x" });
    expect(res.status).toBe(404);
  });

  it("PUT updates a category", async () => {
    const admin = await createTestUser({ role: "admin" });
    const cat = await createTestCategory();
    const res = await harness
      .req()
      .put(`/api/v1/admin/categories/${cat.id}`)
      .set("Authorization", `Bearer ${admin.token}`)
      .send({ name: "Renamed", slug: "renamed" });
    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe("Renamed");
  });

  it("DELETE 404 unknown id", async () => {
    const admin = await createTestUser({ role: "admin" });
    const res = await harness
      .req()
      .delete("/api/v1/admin/categories/missing")
      .set("Authorization", `Bearer ${admin.token}`);
    expect(res.status).toBe(404);
  });

  it("DELETE removes a category", async () => {
    const admin = await createTestUser({ role: "admin" });
    const cat = await createTestCategory();
    const res = await harness
      .req()
      .delete(`/api/v1/admin/categories/${cat.id}`)
      .set("Authorization", `Bearer ${admin.token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.deleted).toBe(true);
  });
});
