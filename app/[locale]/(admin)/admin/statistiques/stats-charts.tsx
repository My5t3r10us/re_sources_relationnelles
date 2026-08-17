"use client";

import type { AdminStats } from "@/lib/admin-stats";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const COLORS = {
  primary: "#0356d5",
  secondary: "#4d626c",
  tertiary: "#15696d",
  error: "#a83836",
  gold: "#a15c00",
  grid: "#dfe3eb",
  ink: "#1a1c1e",
};

const MEDIA_LABELS: Record<string, string> = {
  article: "Articles",
  video: "Vidéos",
  pdf: "PDF",
  exercise: "Exercices",
  audio: "Audio",
  protocol: "Protocoles",
};

const REPORT_LABELS: Record<string, string> = {
  harassment: "Harcèlement",
  spam: "Spam",
  misinformation: "Désinformation",
  inappropriate: "Inapproprié",
  other: "Autre",
};

const PIE_COLORS = [COLORS.primary, COLORS.tertiary, COLORS.gold, COLORS.secondary, "#7b4ea3", "#b33f62"];
const numberFormatter = new Intl.NumberFormat("fr-FR");

function EmptyChart({ label }: { label: string }) {
  return (
    <div className="h-80 flex items-center justify-center text-sm text-on-surface-variant" role="status">
      {label}
    </div>
  );
}

function hasValues(rows: Array<Record<string, unknown>>, keys: string[]) {
  return rows.some((row) => keys.some((key) => Number(row[key]) > 0));
}

const tooltipStyle = {
  border: "1px solid #dfe3eb",
  borderRadius: 8,
  backgroundColor: "#ffffff",
  color: COLORS.ink,
};

export function StatsCharts({ stats }: { stats: AdminStats }) {
  const mediaData = stats.byMediaType.map((item) => ({ ...item, label: MEDIA_LABELS[item.mediaType] ?? item.mediaType }));
  const reportData = stats.moderation.reportsByReason.map((item) => ({ ...item, label: REPORT_LABELS[item.reason] ?? item.reason }));
  const timelineHasActivity = hasValues(stats.timeline, ["resources", "users", "comments"]);
  const viewsHaveActivity = hasValues(stats.timeline, ["views"]);

  return (
    <div className="space-y-6">
      <section aria-labelledby="evolution-title" className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-surface-container-lowest shadow-ambient-sm rounded-lg p-5 min-w-0">
          <h3 id="evolution-title" className="text-title-md text-on-surface">Créations et inscriptions</h3>
          <p className="text-sm text-on-surface-variant mb-4">Agrégation par {stats.period.grain === "day" ? "jour" : "semaine"} sur {stats.period.label.toLowerCase()}.</p>
          {timelineHasActivity ? (
            <div className="h-80" data-testid="timeline-chart">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.timeline} margin={{ top: 8, right: 12, left: -12, bottom: 4 }}>
                  <CartesianGrid stroke={COLORS.grid} strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: COLORS.ink, fontSize: 11 }} minTickGap={28} />
                  <YAxis allowDecimals={false} tick={{ fill: COLORS.ink, fontSize: 11 }} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(value, name) => [numberFormatter.format(Number(value)), String(name)]} />
                  <Legend />
                  <Line type="monotone" dataKey="resources" name="Ressources" stroke={COLORS.primary} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                  <Line type="monotone" dataKey="users" name="Inscriptions" stroke={COLORS.tertiary} strokeWidth={2} strokeDasharray="6 3" dot={false} activeDot={{ r: 4 }} />
                  <Line type="monotone" dataKey="comments" name="Commentaires" stroke={COLORS.gold} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : <EmptyChart label="Aucune création ni inscription sur cette période." />}
        </div>

        <div className="bg-surface-container-lowest shadow-ambient-sm rounded-lg p-5 min-w-0">
          <h3 className="text-title-md text-on-surface">Consultations par cohorte de ressources</h3>
          <p className="text-sm text-on-surface-variant mb-4">Consultations cumulées, rattachées à la date de création des contenus.</p>
          {viewsHaveActivity ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.timeline} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
                  <CartesianGrid stroke={COLORS.grid} strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: COLORS.ink, fontSize: 11 }} minTickGap={28} />
                  <YAxis tick={{ fill: COLORS.ink, fontSize: 11 }} tickFormatter={(value) => numberFormatter.format(value)} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(value) => [numberFormatter.format(Number(value)), "Consultations"]} />
                  <Area type="monotone" dataKey="views" name="Consultations" stroke={COLORS.primary} fill={COLORS.primary} fillOpacity={0.16} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : <EmptyChart label="Aucune consultation associée à cette période." />}
        </div>
      </section>

      <section aria-labelledby="repartitions-title">
        <h2 id="repartitions-title" className="text-headline-md text-on-surface mb-4">Répartitions</h2>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="bg-surface-container-lowest shadow-ambient-sm rounded-lg p-5 min-w-0">
            <h3 className="text-title-md text-on-surface">Formats publiés</h3>
            <p className="text-sm text-on-surface-variant mb-4">Part des ressources publiées par type de média.</p>
            {mediaData.some((item) => item.count > 0) ? (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={mediaData} dataKey="count" nameKey="label" innerRadius={62} outerRadius={96} paddingAngle={2}>
                      {mediaData.map((item, index) => <Cell key={item.mediaType} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} formatter={(value) => numberFormatter.format(Number(value))} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : <EmptyChart label="Aucune ressource publiée pour ces filtres." />}
          </div>

          <div className="bg-surface-container-lowest shadow-ambient-sm rounded-lg p-5 min-w-0">
            <h3 className="text-title-md text-on-surface">Ressources par catégorie</h3>
            <p className="text-sm text-on-surface-variant mb-4">Comparaison des volumes de contenus publiés.</p>
            {stats.byCategory.some((item) => item.count > 0) ? (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.byCategory} layout="vertical" margin={{ top: 4, right: 18, left: 34, bottom: 4 }}>
                    <CartesianGrid stroke={COLORS.grid} strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" allowDecimals={false} tick={{ fill: COLORS.ink, fontSize: 11 }} />
                    <YAxis dataKey="name" type="category" width={120} tick={{ fill: COLORS.ink, fontSize: 11 }} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(value) => [numberFormatter.format(Number(value)), "Ressources"]} />
                    <Bar dataKey="count" name="Ressources" fill={COLORS.tertiary} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : <EmptyChart label="Aucune catégorie alimentée pour ces filtres." />}
          </div>

          <div className="bg-surface-container-lowest shadow-ambient-sm rounded-lg p-5 min-w-0">
            <h3 className="text-title-md text-on-surface">Couverture géographique</h3>
            <p className="text-sm text-on-surface-variant mb-4">Ressources publiées par région.</p>
            {stats.byRegion.some((item) => item.resources > 0) ? (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.byRegion} margin={{ top: 4, right: 12, left: -12, bottom: 72 }}>
                    <CartesianGrid stroke={COLORS.grid} strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="region" angle={-35} textAnchor="end" interval={0} height={82} tick={{ fill: COLORS.ink, fontSize: 10 }} />
                    <YAxis allowDecimals={false} tick={{ fill: COLORS.ink, fontSize: 11 }} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(value) => [numberFormatter.format(Number(value)), "Ressources"]} />
                    <Bar dataKey="resources" name="Ressources" fill={COLORS.primary} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : <EmptyChart label="Aucune ressource géolocalisée pour ces filtres." />}
          </div>

          <div className="bg-surface-container-lowest shadow-ambient-sm rounded-lg p-5 min-w-0">
            <h3 className="text-title-md text-on-surface">Signalements par motif</h3>
            <p className="text-sm text-on-surface-variant mb-4">État de résolution des signalements reçus.</p>
            {reportData.some((item) => item.resolved + item.unresolved > 0) ? (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={reportData} layout="vertical" margin={{ top: 4, right: 18, left: 28, bottom: 4 }}>
                    <CartesianGrid stroke={COLORS.grid} strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" allowDecimals={false} tick={{ fill: COLORS.ink, fontSize: 11 }} />
                    <YAxis dataKey="label" type="category" width={108} tick={{ fill: COLORS.ink, fontSize: 11 }} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(value, name) => [numberFormatter.format(Number(value)), String(name)]} />
                    <Legend />
                    <Bar dataKey="resolved" name="Résolus" stackId="reports" fill={COLORS.tertiary} />
                    <Bar dataKey="unresolved" name="Non résolus" stackId="reports" fill={COLORS.error} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : <EmptyChart label="Aucun signalement pour ces filtres." />}
          </div>
        </div>
      </section>
    </div>
  );
}
