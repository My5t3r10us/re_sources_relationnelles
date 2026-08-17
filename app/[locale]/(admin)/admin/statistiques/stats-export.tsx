"use client";

import type { AdminStats } from "@/lib/admin-stats";
import { Download } from "lucide-react";

export type StatsExportKind = "synthese" | "series-temporelles";

export function escapeCsvValue(value: string | number) {
  const text = String(value);
  return /[;"\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function csvRow(values: Array<string | number>) {
  return values.map(escapeCsvValue).join(";");
}

export function buildStatsCsv(stats: AdminStats, kind: StatsExportKind) {
  if (kind === "series-temporelles") {
    const rows = [
      ["Date", "Libellé", "Ressources créées", "Comptes créés", "Commentaires publiés", "Consultations"],
      ...stats.timeline.map((item) => [item.date, item.label, item.resources, item.users, item.comments, item.views]),
    ];
    return `\uFEFF${rows.map(csvRow).join("\r\n")}\r\n`;
  }

  const rows: Array<Array<string | number>> = [
    ["Section", "Indicateur", "Dimension", "Valeur"],
    ["Périmètre", "Période", stats.period.label, `${stats.period.start} au ${stats.period.end}`],
    ["Indicateurs", "Consultations", "Total", stats.metrics.views],
    ["Indicateurs", "Ressources", "Total", stats.metrics.resources],
    ["Indicateurs", "Ressources", "Publiées", stats.metrics.publishedResources],
    ["Indicateurs", "Ressources", "En attente", stats.metrics.pendingResources],
    ["Indicateurs", "Utilisateurs", "Total", stats.metrics.users],
    ["Indicateurs", "Commentaires", "Total", stats.metrics.comments],
    ["Indicateurs", "Signalements", "Total", stats.metrics.reports],
    ["Indicateurs", "Signalements", "Non résolus", stats.metrics.unresolvedReports],
    ["Engagement", "Favoris", "Total", stats.engagement.favorites],
    ["Engagement", "Ressources exploitées", "Total", stats.engagement.completions],
    ["Engagement", "Mises de côté", "Total", stats.engagement.savedResources],
    ["Engagement", "Taux d'exploitation", "Pourcentage", stats.engagement.completionRate],
    ["Modération", "Délai moyen de publication", "Heures", stats.moderation.averagePublicationHours],
    ["Modération", "Commentaires masqués", "Total", stats.moderation.hiddenComments],
    ["Modération", "Signalements résolus", "Pourcentage", stats.moderation.resolvedShare],
    ...stats.byCategory.map((item) => ["Répartition", "Catégorie", item.name, item.count]),
    ...stats.byMediaType.map((item) => ["Répartition", "Type de média", item.mediaType, item.count]),
    ...stats.byRole.map((item) => ["Répartition", "Rôle", item.role, item.count]),
    ...stats.byRegion.map((item) => ["Répartition", "Région", item.region, item.resources]),
  ];
  return `\uFEFF${rows.map(csvRow).join("\r\n")}\r\n`;
}

function downloadCsv(stats: AdminStats, kind: StatsExportKind) {
  const csv = buildStatsCsv(stats, kind);
  const date = new Date().toISOString().slice(0, 10);
  const filename = `stats-re-sources-${kind}-${stats.filters.period}-${date}.csv`;
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function StatsExportButton({ stats }: { stats: AdminStats }) {
  return (
    <div className="flex items-center gap-2 flex-wrap" aria-label="Exports CSV">
      <button
        type="button"
        onClick={() => downloadCsv(stats, "synthese")}
        className="inline-flex items-center gap-2 px-4 py-2.5 bg-surface-container-highest text-on-surface rounded-lg text-sm font-semibold hover:bg-surface-container-high transition-colors"
      >
        <Download className="w-4 h-4" aria-hidden="true" />
        Synthèse
      </button>
      <button
        type="button"
        onClick={() => downloadCsv(stats, "series-temporelles")}
        className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-on-primary-fixed rounded-lg text-sm font-semibold hover:bg-primary-dim transition-colors"
      >
        <Download className="w-4 h-4" aria-hidden="true" />
        Séries temporelles
      </button>
    </div>
  );
}
