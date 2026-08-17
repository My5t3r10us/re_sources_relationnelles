import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StatsCharts } from "@/app/[locale]/(admin)/admin/statistiques/stats-charts";
import { createAdminStatsFixture } from "../../setup/admin-stats-fixture";

describe("StatsCharts", () => {
  it("shows explicit empty states for zero-valued series", () => {
    const stats = createAdminStatsFixture({
      timeline: [{ date: "2026-08-17", label: "17 août", resources: 0, users: 0, comments: 0, views: 0 }],
      byCategory: [],
      byMediaType: [],
      byRegion: [],
      moderation: {
        averagePublicationHours: 0,
        hiddenComments: 0,
        resolvedShare: 0,
        reportsByReason: [],
      },
    });

    render(<StatsCharts stats={stats} />);

    expect(screen.getByText("Aucune création ni inscription sur cette période.")).toBeInTheDocument();
    expect(screen.getByText("Aucune consultation associée à cette période.")).toBeInTheDocument();
    expect(screen.getByText("Aucune ressource publiée pour ces filtres.")).toBeInTheDocument();
    expect(screen.getByText("Aucun signalement pour ces filtres.")).toBeInTheDocument();
  });
});
