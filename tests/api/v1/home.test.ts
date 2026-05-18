import { describe, it, expect } from "vitest";
import { GET } from "@/app/api/v1/home/route";
import { setupApiHarness } from "../../setup/api-harness";
import { createTestUser, createTestCategory, createTestResource } from "../../setup/db";

const harness = setupApiHarness([
  { path: "/api/v1/home", handlers: { GET } },
]);

describe("GET /api/v1/home", () => {
  it("returns empty arrays and zero stats on empty DB", async () => {
    const res = await harness.req().get("/api/v1/home");
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      featured: [],
      recent: [],
      popularCategories: [],
      stats: { totalResources: 0, totalUsers: 0, totalCategories: 0 },
    });
  });

  it("populates featured/recent when data exists", async () => {
    const u = await createTestUser();
    const cat = await createTestCategory();
    await createTestResource({
      authorId: u.id,
      categoryId: cat.id,
      status: "published",
      privacy: "public",
      featured: true,
      title: "Featured!",
    });
    const res = await harness.req().get("/api/v1/home");
    expect(res.status).toBe(200);
    expect(res.body.data.recent.length).toBeGreaterThan(0);
    expect(res.body.data.featured.some((r: { title: string }) => r.title === "Featured!")).toBe(true);
  });
});
