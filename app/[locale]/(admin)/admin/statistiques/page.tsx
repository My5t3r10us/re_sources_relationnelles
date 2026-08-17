import { Card } from "@/components/ui/card";
import { getAdminStats, parseAdminStatsFilters, ADMIN_STATS_MEDIA_TYPES, type AdminStatsFilters } from "@/lib/admin-stats";
import { Bookmark, CheckCircle2, Clock3, Eye, Flag, Heart, MessageCircle, PlusCircle, Users } from "lucide-react";
import Link from "next/link";
import { StatsCharts } from "./stats-charts";
import { StatsExportButton } from "./stats-export";

interface PageProps {
  searchParams: Promise<{
    period?: string;
    mediaType?: string;
    categoryId?: string;
    region?: string;
  }>;
}

const PERIODS = [
  ["all", "Toutes les données"],
  ["7d", "7 jours"],
  ["30d", "30 jours"],
  ["90d", "90 jours"],
  ["12m", "12 mois"],
] as const;

const MEDIA_LABELS: Record<string, string> = {
  article: "Articles",
  video: "Vidéos",
  pdf: "PDF",
  exercise: "Exercices",
  audio: "Audio",
  protocol: "Protocoles",
};

const ROLE_LABELS: Record<string, string> = {
  citizen: "Citoyens",
  moderator: "Modérateurs",
  admin: "Administrateurs",
  super_admin: "Super-administrateurs",
};

function filterUrl(filters: AdminStatsFilters, overrides: Partial<AdminStatsFilters>) {
  const merged = { ...filters, ...overrides };
  const query = new URLSearchParams();
  if (merged.period !== "all") query.set("period", merged.period);
  if (merged.mediaType !== "all") query.set("mediaType", merged.mediaType);
  if (merged.categoryId !== "all") query.set("categoryId", merged.categoryId);
  if (merged.region !== "all") query.set("region", merged.region);
  return `/admin/statistiques${query.size ? `?${query}` : ""}`;
}

function FilterLink({ active, href, children }: { active: boolean; href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
        active ? "bg-primary text-on-primary-fixed" : "text-on-surface-variant hover:bg-surface-container-high"
      }`}
    >
      {children}
    </Link>
  );
}

export default async function StatistiquesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const filters = parseAdminStatsFilters(params);
  const stats = await getAdminStats(filters);
  const format = new Intl.NumberFormat("fr-FR");

  const metrics = [
    { label: "Consultations", value: stats.metrics.views, detail: `${stats.metrics.publishedResources} publiées`, icon: Eye },
    { label: "Ressources", value: stats.metrics.resources, detail: `${stats.metrics.pendingResources} en attente`, icon: PlusCircle },
    { label: "Utilisateurs", value: stats.metrics.users, detail: stats.byRole.map((item) => `${item.count} ${ROLE_LABELS[item.role] ?? item.role}`).join(", ") || "Aucun compte", icon: Users },
    { label: "Commentaires", value: stats.metrics.comments, detail: `${stats.moderation.hiddenComments} masqués`, icon: MessageCircle },
  ];

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-10">
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-display-lg text-on-surface">Statistiques globales</h1>
          <p className="text-lg text-on-surface-variant max-w-2xl">
            Activité, engagement et qualité de service sur {stats.period.label.toLowerCase()}.
          </p>
        </div>
        <StatsExportButton stats={stats} />
      </header>

      <nav aria-label="Filtres statistiques" className="bg-surface-container-low rounded-lg p-4 space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-on-surface-variant w-28">Période :</span>
          {PERIODS.map(([value, label]) => (
            <FilterLink key={value} active={filters.period === value} href={filterUrl(filters, { period: value })}>{label}</FilterLink>
          ))}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-on-surface-variant w-28">Type :</span>
          <FilterLink active={filters.mediaType === "all"} href={filterUrl(filters, { mediaType: "all" })}>Tous</FilterLink>
          {ADMIN_STATS_MEDIA_TYPES.map((value) => (
            <FilterLink key={value} active={filters.mediaType === value} href={filterUrl(filters, { mediaType: value })}>{MEDIA_LABELS[value]}</FilterLink>
          ))}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-on-surface-variant w-28">Catégorie :</span>
          <FilterLink active={filters.categoryId === "all"} href={filterUrl(filters, { categoryId: "all" })}>Toutes</FilterLink>
          {stats.options.categories.map((item) => (
            <FilterLink key={item.id} active={filters.categoryId === item.id} href={filterUrl(filters, { categoryId: item.id })}>{item.name}</FilterLink>
          ))}
        </div>
        {stats.options.regions.length > 0 ? (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-on-surface-variant w-28">Région :</span>
            <FilterLink active={filters.region === "all"} href={filterUrl(filters, { region: "all" })}>Toutes</FilterLink>
            {stats.options.regions.map((region) => (
              <FilterLink key={region} active={filters.region === region} href={filterUrl(filters, { region })}>{region}</FilterLink>
            ))}
          </div>
        ) : null}
      </nav>

      <section aria-labelledby="indicateurs-title">
        <h2 id="indicateurs-title" className="text-headline-md text-on-surface mb-4">Indicateurs clés</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {metrics.map(({ label, value, detail, icon: Icon }) => (
            <Card key={label} className="!rounded-lg p-5 min-h-36">
              <div className="flex items-center justify-between mb-4">
                <span className="text-label-md text-on-surface-variant">{label}</span>
                <Icon className="w-5 h-5 text-primary" aria-hidden="true" />
              </div>
              <p className="text-3xl font-bold text-on-surface">{format.format(value)}</p>
              <p className="text-sm text-on-surface-variant mt-2 line-clamp-2">{detail}</p>
            </Card>
          ))}
        </div>
      </section>

      <div>
        <h2 id="evolution-section-title" className="text-headline-md text-on-surface mb-4">Évolution temporelle</h2>
        <StatsCharts stats={stats} />
      </div>

      <section aria-labelledby="engagement-title">
        <h2 id="engagement-title" className="text-headline-md text-on-surface mb-4">Engagement et progression</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[
            { label: "Favoris", value: stats.engagement.favorites, icon: Heart },
            { label: "Ressources exploitées", value: stats.engagement.completions, icon: CheckCircle2 },
            { label: "Mises de côté", value: stats.engagement.savedResources, icon: Bookmark },
            { label: "Taux d'exploitation", value: `${stats.engagement.completionRate.toLocaleString("fr-FR")} %`, icon: CheckCircle2 },
          ].map(({ label, value, icon: Icon }) => (
            <Card key={label} className="!rounded-lg p-5 min-h-28">
              <Icon className="w-5 h-5 text-tertiary mb-3" aria-hidden="true" />
              <p className="text-sm text-on-surface-variant">{label}</p>
              <p className="text-2xl font-bold text-on-surface mt-1">{typeof value === "number" ? format.format(value) : value}</p>
            </Card>
          ))}
        </div>
      </section>

      <section aria-labelledby="moderation-title">
        <h2 id="moderation-title" className="text-headline-md text-on-surface mb-4">Modération</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <Card className="!rounded-lg p-5"><Clock3 className="w-5 h-5 text-primary mb-3" /><p className="text-sm text-on-surface-variant">Délai moyen de publication</p><p className="text-2xl font-bold text-on-surface mt-1">{stats.moderation.averagePublicationHours.toLocaleString("fr-FR")} h</p></Card>
          <Card className="!rounded-lg p-5"><MessageCircle className="w-5 h-5 text-secondary mb-3" /><p className="text-sm text-on-surface-variant">Commentaires masqués</p><p className="text-2xl font-bold text-on-surface mt-1">{format.format(stats.moderation.hiddenComments)}</p></Card>
          <Card className="!rounded-lg p-5"><Flag className="w-5 h-5 text-error mb-3" /><p className="text-sm text-on-surface-variant">Signalements ouverts</p><p className="text-2xl font-bold text-on-surface mt-1">{format.format(stats.metrics.unresolvedReports)}</p></Card>
          <Card className="!rounded-lg p-5"><CheckCircle2 className="w-5 h-5 text-tertiary mb-3" /><p className="text-sm text-on-surface-variant">Part résolue</p><p className="text-2xl font-bold text-on-surface mt-1">{stats.moderation.resolvedShare.toLocaleString("fr-FR")} %</p></Card>
        </div>
      </section>

      <section aria-labelledby="tops-title">
        <h2 id="tops-title" className="text-headline-md text-on-surface mb-4">Top contenus et contributeurs</h2>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <Ranking title="Les plus consultées" rows={stats.topViewed} empty="Aucune consultation." />
          <Ranking title="Les plus ajoutées aux favoris" rows={stats.topFavorited} empty="Aucun favori." />
          <div className="bg-surface-container-lowest shadow-ambient-sm rounded-lg p-5">
            <h3 className="text-title-md text-on-surface mb-4">Contributeurs les plus actifs</h3>
            {stats.contributors.length > 0 ? (
              <ol className="space-y-3">
                {stats.contributors.map((item, index) => (
                  <li key={item.id} className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-on-surface min-w-0 truncate">{index + 1}. {item.name}</span>
                    <span className="font-semibold text-primary shrink-0">{format.format(item.count)}</span>
                  </li>
                ))}
              </ol>
            ) : <p className="text-sm text-on-surface-variant">Aucun contributeur pour ces filtres.</p>}
          </div>
        </div>
      </section>
    </div>
  );
}

function Ranking({ title, rows, empty }: {
  title: string;
  rows: Array<{ id: string; title: string; category: string | null; author: string; count: number }>;
  empty: string;
}) {
  const format = new Intl.NumberFormat("fr-FR");
  return (
    <div className="bg-surface-container-lowest shadow-ambient-sm rounded-lg p-5">
      <h3 className="text-title-md text-on-surface mb-4">{title}</h3>
      {rows.length > 0 ? (
        <ol className="space-y-3">
          {rows.map((item, index) => (
            <li key={item.id} className="flex items-start justify-between gap-3 text-sm">
              <div className="min-w-0">
                <p className="font-medium text-on-surface truncate">{index + 1}. {item.title}</p>
                <p className="text-xs text-on-surface-variant truncate">{item.category ?? "Sans catégorie"} · {item.author}</p>
              </div>
              <span className="font-semibold text-primary shrink-0">{format.format(item.count)}</span>
            </li>
          ))}
        </ol>
      ) : <p className="text-sm text-on-surface-variant">{empty}</p>}
    </div>
  );
}
