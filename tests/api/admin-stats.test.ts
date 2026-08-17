import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/db";
import { comment, resource } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getAdminStats, parseAdminStatsFilters } from "@/lib/admin-stats";
import { createTestCategory, createTestComment, createTestResource, createTestUser, resetDb } from "../setup/db";

describe("getAdminStats", () => {
  beforeEach(resetDb);

  it("returns zero-filled series for an empty database", async () => {
    const stats = await getAdminStats(parseAdminStatsFilters({ period: "7d" }));
    expect(stats.metrics.resources).toBe(0);
    expect(stats.timeline).toHaveLength(8);
    expect(stats.timeline.every((item) => item.resources === 0 && item.users === 0 && item.comments === 0)).toBe(true);
  });

  it("aggregates resources, comments and views in the selected period", async () => {
    const author = await createTestUser();
    const item = await createTestResource({ authorId: author.id, mediaType: "article" });
    await db.update(resource).set({ viewCount: 42, createdAt: new Date() }).where(eq(resource.id, item.id));
    const entry = await createTestComment({ authorId: author.id, resourceId: item.id });
    await db.update(comment).set({ createdAt: new Date() }).where(eq(comment.id, entry.id));

    const stats = await getAdminStats(parseAdminStatsFilters({ period: "7d" }));
    expect(stats.metrics).toMatchObject({ resources: 1, views: 42, comments: 1 });
    expect(stats.timeline.reduce((total, row) => total + row.resources, 0)).toBe(1);
    expect(stats.timeline.reduce((total, row) => total + row.comments, 0)).toBe(1);
  });

  it("combines media, category and region filters across resource series", async () => {
    const author = await createTestUser();
    const category = await createTestCategory({ name: "Relations", slug: "relations" });
    const matching = await createTestResource({ authorId: author.id, categoryId: category.id, mediaType: "audio" });
    const excluded = await createTestResource({ authorId: author.id, categoryId: category.id, mediaType: "video" });
    await db.update(resource).set({ region: "Bretagne" }).where(eq(resource.id, matching.id));
    await db.update(resource).set({ region: "Bretagne" }).where(eq(resource.id, excluded.id));

    const stats = await getAdminStats(parseAdminStatsFilters({
      period: "30d",
      mediaType: "audio",
      categoryId: category.id,
      region: "Bretagne",
    }));

    expect(stats.metrics.resources).toBe(1);
    expect(stats.byMediaType).toEqual([{ mediaType: "audio", count: 1 }]);
    expect(stats.byCategory).toEqual([{ name: "Relations", count: 1 }]);
  });
});
