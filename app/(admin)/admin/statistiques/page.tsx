import { Card } from "@/components/ui/card";
import { Eye, PlusCircle, Users, TrendingUp } from "lucide-react";
import { db } from "@/db";
import { user, resource, category, comment, report } from "@/db/schema";
import { eq, count, sum, sql, gte } from "drizzle-orm";
import Link from "next/link";
import { StatsExportButton } from "./stats-export";

interface PageProps {
  searchParams: Promise<{ period?: string }>;
}

function getPeriodStart(period: string): Date | null {
  const now = new Date();
  switch (period) {
    case "7d":
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case "30d":
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case "90d":
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    default:
      return null;
  }
}

export default async function StatistiquesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const period = params.period ?? "all";
  const periodStart = getPeriodStart(period);

  const resourceWhere = periodStart ? gte(resource.createdAt, periodStart) : undefined;
  const userWhere = periodStart ? gte(user.createdAt, periodStart) : undefined;
  const commentWhere = periodStart ? gte(comment.createdAt, periodStart) : undefined;

  const [
    [{ totalUsers }],
    [{ totalResources }],
    [{ totalViews }],
    [{ pendingResources }],
    [{ publishedResources }],
    [{ totalReports }],
    [{ unresolvedReports }],
    [{ totalComments }],
    categoryStats,
    roleStats,
  ] = await Promise.all([
    db.select({ totalUsers: count() }).from(user).where(userWhere),
    db.select({ totalResources: count() }).from(resource).where(resourceWhere),
    db.select({ totalViews: sum(resource.viewCount) }).from(resource).where(resourceWhere),
    db.select({ pendingResources: count() }).from(resource).where(
      periodStart ? sql`${resource.status} = 'pending' AND ${resource.createdAt} >= ${periodStart}` : eq(resource.status, "pending")
    ),
    db.select({ publishedResources: count() }).from(resource).where(
      periodStart ? sql`${resource.status} = 'published' AND ${resource.createdAt} >= ${periodStart}` : eq(resource.status, "published")
    ),
    db.select({ totalReports: count() }).from(report),
    db.select({ unresolvedReports: count() }).from(report).where(eq(report.resolved, false)),
    db.select({ totalComments: count() }).from(comment).where(commentWhere),
    db
      .select({ name: category.name, count: count() })
      .from(resource)
      .innerJoin(category, eq(resource.categoryId, category.id))
      .where(
        periodStart
          ? sql`${resource.status} = 'published' AND ${resource.createdAt} >= ${periodStart}`
          : eq(resource.status, "published")
      )
      .groupBy(category.name)
      .orderBy(sql`count(*) desc`),
    db.select({ role: user.role, count: count() }).from(user).groupBy(user.role),
  ]);

  const views = Number(totalViews) || 0;
  const maxCategoryStat = categoryStats.length > 0 ? Math.max(...categoryStats.map((c) => c.count)) : 1;

  const metrics = [
    {
      label: "Consultations totales",
      value: views.toLocaleString("fr-FR"),
      trend: `${publishedResources} ressources publiées`,
      icon: <Eye className="w-5 h-5 text-primary" />,
      trendUp: true,
    },
    {
      label: "Ressources créées",
      value: totalResources.toLocaleString("fr-FR"),
      trend: `${pendingResources} en attente de modération`,
      icon: <PlusCircle className="w-5 h-5 text-primary" />,
      trendUp: pendingResources > 0,
    },
    {
      label: "Utilisateurs inscrits",
      value: totalUsers.toLocaleString("fr-FR"),
      trend: roleStats.map((r) => `${r.count} ${r.role}`).join(", "),
      icon: <Users className="w-5 h-5 text-primary" />,
      trendUp: false,
    },
  ];

  const periodLabels: Record<string, string> = {
    all: "Toutes les données",
    "7d": "7 derniers jours",
    "30d": "30 derniers jours",
    "90d": "90 derniers jours",
  };

  const statsData = {
    totalUsers,
    totalResources,
    views,
    pendingResources,
    publishedResources,
    totalReports,
    unresolvedReports,
    totalComments,
    categoryStats,
    roleStats,
    period,
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
        <div>
          <h1 className="text-display-lg text-on-surface">Statistiques globales</h1>
          <p className="text-lg text-on-surface-variant max-w-2xl">
            Vue d&apos;ensemble de la santé de la plateforme.
          </p>
        </div>
        <StatsExportButton stats={statsData} />
      </div>

      {/* Period filter */}
      <div className="flex items-center gap-2 mb-8 flex-wrap">
        <span className="text-sm text-on-surface-variant mr-2">Période :</span>
        {(["all", "7d", "30d", "90d"] as const).map((p) => (
          <Link
            key={p}
            href={`/admin/statistiques?period=${p}`}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              period === p
                ? "bg-primary text-on-primary-fixed"
                : "text-on-surface-variant hover:bg-surface-container-high"
            }`}
          >
            {periodLabels[p]}
          </Link>
        ))}
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {metrics.map((metric) => (
          <Card key={metric.label} className="p-6 relative overflow-hidden">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/5 rounded-full blur-xl" />
            <div className="flex items-center justify-between mb-4">
              <span className="text-label-md text-on-surface-variant">{metric.label}</span>
              {metric.icon}
            </div>
            <p className="text-4xl font-bold text-on-surface mb-2">{metric.value}</p>
            <p className={`text-sm flex items-center gap-1 ${metric.trendUp ? "text-tertiary" : "text-on-surface-variant"}`}>
              {metric.trendUp && <TrendingUp className="w-4 h-4" />}
              {metric.trend}
            </p>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-10">
        <Card className="md:col-span-3 p-6">
          <h2 className="text-headline-md text-on-surface mb-6">Résumé de la plateforme</h2>
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-surface-container-low rounded-xl p-4">
              <p className="text-sm text-on-surface-variant mb-1">Commentaires</p>
              <p className="text-2xl font-bold text-on-surface">{totalComments}</p>
            </div>
            <div className="bg-surface-container-low rounded-xl p-4">
              <p className="text-sm text-on-surface-variant mb-1">Signalements</p>
              <p className="text-2xl font-bold text-on-surface">{totalReports}</p>
              {unresolvedReports > 0 && (
                <p className="text-xs text-error mt-1">{unresolvedReports} non résolus</p>
              )}
            </div>
            <div className="bg-surface-container-low rounded-xl p-4">
              <p className="text-sm text-on-surface-variant mb-1">Publiées</p>
              <p className="text-2xl font-bold text-tertiary">{publishedResources}</p>
            </div>
            <div className="bg-surface-container-low rounded-xl p-4">
              <p className="text-sm text-on-surface-variant mb-1">En attente</p>
              <p className="text-2xl font-bold text-on-surface">{pendingResources}</p>
            </div>
          </div>
        </Card>

        <Card className="md:col-span-2 p-6">
          <h2 className="text-headline-md text-on-surface mb-2">Ressources par catégorie</h2>
          <p className="text-sm text-on-surface-variant mb-6">Répartition des ressources publiées.</p>
          <div className="space-y-4">
            {categoryStats.length === 0 ? (
              <p className="text-sm text-on-surface-variant">Aucune ressource publiée.</p>
            ) : (
              categoryStats.map((cat) => {
                const pct = Math.round((cat.count / maxCategoryStat) * 100);
                return (
                  <div key={cat.name}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-on-surface">{cat.name}</span>
                      <span className="text-sm font-semibold text-on-surface">{cat.count}</span>
                    </div>
                    <div className="w-full h-3 bg-surface-container-high rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${pct > 60 ? "bg-primary" : pct > 30 ? "bg-tertiary" : "bg-secondary"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
