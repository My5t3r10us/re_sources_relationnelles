import { describe, it, expect, beforeEach } from "vitest";
import { getHomeData } from "@/lib/home-data";
import {
  resetDb,
  createTestUser,
  createTestCategory,
  createTestResource,
} from "../../setup/db";

describe("getHomeData (integration)", () => {
  beforeEach(async () => {
    await resetDb();
  });

  it("returns zero stats and empty lists on an empty DB", async () => {
    const data = await getHomeData();
    expect(data.featured).toEqual([]);
    expect(data.recent).toEqual([]);
    expect(data.popularCategories).toEqual([]);
    expect(data.stats).toEqual({ totalResources: 0, totalUsers: 0, totalCategories: 0 });
  });

  it("only includes public + published resources in featured/recent", async () => {
    const u = await createTestUser({ role: "citizen" });
    const cat = await createTestCategory();
    await createTestResource({ authorId: u.id, categoryId: cat.id, status: "published", privacy: "public", featured: true, title: "F1" });
    await createTestResource({ authorId: u.id, categoryId: cat.id, status: "draft", privacy: "public", featured: true, title: "D1" });
    await createTestResource({ authorId: u.id, categoryId: cat.id, status: "published", privacy: "private", featured: true, title: "P1" });

    const data = await getHomeData();
    const titles = data.featured.map((r) => r.title);
    expect(titles).toContain("F1");
    expect(titles).not.toContain("D1");
    expect(titles).not.toContain("P1");
  });

  it("caps featured to 3 and recent to 6", async () => {
    const u = await createTestUser();
    const cat = await createTestCategory();
    for (let i = 0; i < 5; i++) {
      await createTestResource({ authorId: u.id, categoryId: cat.id, status: "published", privacy: "public", featured: true });
    }
    for (let i = 0; i < 10; i++) {
      await createTestResource({ authorId: u.id, categoryId: cat.id, status: "published", privacy: "public" });
    }
    const data = await getHomeData();
    expect(data.featured.length).toBeLessThanOrEqual(3);
    expect(data.recent.length).toBeLessThanOrEqual(6);
  });

  it("computes counts in stats", async () => {
    const u = await createTestUser();
    await createTestCategory();
    await createTestResource({ authorId: u.id, status: "published" });
    const data = await getHomeData();
    expect(data.stats.totalUsers).toBeGreaterThanOrEqual(1);
    expect(data.stats.totalResources).toBeGreaterThanOrEqual(1);
    expect(data.stats.totalCategories).toBeGreaterThanOrEqual(1);
  });
});
