import { describe, it, expect } from "vitest";
import { GET, POST } from "@/app/api/v1/resources/route";
import { setupApiHarness } from "../../setup/api-harness";
import { createTestUser, createTestCategory, createTestResource } from "../../setup/db";

const harness = setupApiHarness([
  { path: "/api/v1/resources", handlers: { GET, POST } },
]);

describe("GET /api/v1/resources", () => {
  it("returns published+public resources for anonymous users", async () => {
    const u = await createTestUser();
    await createTestResource({ authorId: u.id, status: "published", privacy: "public", title: "Visible" });
    await createTestResource({ authorId: u.id, status: "draft", privacy: "public", title: "Hidden draft" });
    await createTestResource({ authorId: u.id, status: "published", privacy: "private", title: "Hidden private" });
    const res = await harness.req().get("/api/v1/resources");
    expect(res.status).toBe(200);
    const titles = res.body.data.map((r: { title: string }) => r.title);
    expect(titles).toContain("Visible");
    expect(titles).not.toContain("Hidden draft");
    expect(titles).not.toContain("Hidden private");
  });

  it("supports search by title", async () => {
    const u = await createTestUser();
    await createTestResource({ authorId: u.id, status: "published", title: "Méditation guidée" });
    await createTestResource({ authorId: u.id, status: "published", title: "Yoga doux" });
    const res = await harness.req().get("/api/v1/resources?search=Yoga");
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].title).toBe("Yoga doux");
  });

  it("filters by mediaType", async () => {
    const u = await createTestUser();
    await createTestResource({ authorId: u.id, status: "published", mediaType: "video", title: "V" });
    await createTestResource({ authorId: u.id, status: "published", mediaType: "audio", title: "A" });
    const res = await harness.req().get("/api/v1/resources?mediaType=video");
    expect(res.body.data.every((r: { mediaType: string }) => r.mediaType === "video")).toBe(true);
  });

  it("filters by category slug", async () => {
    const u = await createTestUser();
    const cat = await createTestCategory({ slug: "bien-etre" });
    await createTestResource({ authorId: u.id, status: "published", categoryId: cat.id, title: "In cat" });
    await createTestResource({ authorId: u.id, status: "published", title: "Out cat" });
    const res = await harness.req().get("/api/v1/resources?category=bien-etre");
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].title).toBe("In cat");
  });

  it("paginates with meta", async () => {
    const u = await createTestUser();
    for (let i = 0; i < 25; i++) {
      await createTestResource({ authorId: u.id, status: "published", title: `R${i}` });
    }
    const res = await harness.req().get("/api/v1/resources?page=2&limit=10");
    expect(res.body.meta).toMatchObject({ page: 2, limit: 10, total: 25 });
    expect(res.body.data.length).toBe(10);
  });

  it("admins can filter by any status", async () => {
    const admin = await createTestUser({ role: "admin" });
    await createTestResource({ authorId: admin.id, status: "pending", title: "Pending" });
    const res = await harness
      .req()
      .get("/api/v1/resources?status=pending")
      .set("Authorization", `Bearer ${admin.token}`);
    expect(res.body.data.some((r: { title: string }) => r.title === "Pending")).toBe(true);
  });
});

describe("POST /api/v1/resources", () => {
  it("requires authentication", async () => {
    const res = await harness.req().post("/api/v1/resources").send({});
    expect(res.status).toBe(401);
  });

  it("rejects missing title or content", async () => {
    const u = await createTestUser();
    const res = await harness
      .req()
      .post("/api/v1/resources")
      .set("Authorization", `Bearer ${u.token}`)
      .send({ title: "", content: "" });
    expect(res.status).toBe(400);
    expect(res.body.error?.code).toBe("VALIDATION_ERROR");
  });

  it("creates a pending resource by default", async () => {
    const u = await createTestUser();
    const res = await harness
      .req()
      .post("/api/v1/resources")
      .set("Authorization", `Bearer ${u.token}`)
      .send({ title: "T", content: "Du contenu réel avec plusieurs mots" });
    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe("pending");
    expect(res.body.data.title).toBe("T");
    expect(res.body.data.readingTime).toBeGreaterThanOrEqual(1);
  });

  it("creates a draft when isDraft=true", async () => {
    const u = await createTestUser();
    const res = await harness
      .req()
      .post("/api/v1/resources")
      .set("Authorization", `Bearer ${u.token}`)
      .send({ title: "D", content: "X", isDraft: true });
    expect(res.body.data.status).toBe("draft");
  });

  it("resolves categoryId from slug", async () => {
    const u = await createTestUser();
    const cat = await createTestCategory({ slug: "famille" });
    const res = await harness
      .req()
      .post("/api/v1/resources")
      .set("Authorization", `Bearer ${u.token}`)
      .send({ title: "X", content: "ok", categoryId: "famille" });
    expect(res.body.data.categoryId).toBe(cat.id);
  });
});
