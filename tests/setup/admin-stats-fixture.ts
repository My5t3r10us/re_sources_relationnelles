import type { AdminStats } from "@/lib/admin-stats";

export function createAdminStatsFixture(overrides: Partial<AdminStats> = {}): AdminStats {
  return {
    filters: { period: "all", mediaType: "all", categoryId: "all", region: "all" },
    period: { label: "Toutes les données", start: "2026-07-01", end: "2026-08-17", grain: "week" },
    metrics: {
      users: 5,
      resources: 10,
      views: 100,
      pendingResources: 2,
      publishedResources: 8,
      reports: 2,
      unresolvedReports: 1,
      comments: 20,
    },
    engagement: { favorites: 12, completions: 7, savedResources: 4, completionRate: 87.5 },
    moderation: {
      averagePublicationHours: 18.5,
      hiddenComments: 1,
      resolvedShare: 50,
      reportsByReason: [{ reason: "spam", resolved: 1, unresolved: 1 }],
    },
    timeline: [
      { date: "2026-08-10", label: "10 août 26", resources: 2, users: 1, comments: 4, views: 50 },
      { date: "2026-08-17", label: "17 août 26", resources: 0, users: 0, comments: 0, views: 0 },
    ],
    byCategory: [{ name: "Santé; \"mentale\"\nFrance", count: 3 }],
    byMediaType: [{ mediaType: "article", count: 3 }],
    byRole: [{ role: "citizen", count: 4 }],
    byRegion: [{ region: "Bretagne", resources: 2, views: 40 }],
    topViewed: [{ id: "r1", title: "Ressource", category: "Santé", author: "Alice", count: 50 }],
    topFavorited: [{ id: "r1", title: "Ressource", category: "Santé", author: "Alice", count: 6 }],
    contributors: [{ id: "u1", name: "Alice", count: 3 }],
    options: { categories: [{ id: "c1", name: "Santé" }], regions: ["Bretagne"] },
    ...overrides,
  };
}
