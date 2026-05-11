"use client";

import { Download } from "lucide-react";

interface StatsData {
  totalUsers: number;
  totalResources: number;
  views: number;
  pendingResources: number;
  publishedResources: number;
  totalReports: number;
  unresolvedReports: number;
  totalComments: number;
  categoryStats: { name: string; count: number }[];
  roleStats: { role: string; count: number }[];
  period: string;
}

export function StatsExportButton({ stats }: { stats: StatsData }) {
  function handleExport() {
    const periodLabel: Record<string, string> = {
      all: "Toutes les données",
      "7d": "7 derniers jours",
      "30d": "30 derniers jours",
      "90d": "90 derniers jours",
    };

    const lines: string[] = [
      "Statistiques (RE)Sources Relationnelles",
      `Période: ${periodLabel[stats.period] ?? stats.period}`,
      `Exporté le: ${new Date().toLocaleDateString("fr-FR")}`,
      "",
      "=== MÉTRIQUES GÉNÉRALES ===",
      `Consultations totales,${stats.views}`,
      `Ressources créées,${stats.totalResources}`,
      `Ressources publiées,${stats.publishedResources}`,
      `Ressources en attente,${stats.pendingResources}`,
      `Utilisateurs inscrits,${stats.totalUsers}`,
      `Commentaires,${stats.totalComments}`,
      `Signalements totaux,${stats.totalReports}`,
      `Signalements non résolus,${stats.unresolvedReports}`,
      "",
      "=== RESSOURCES PAR CATÉGORIE ===",
      "Catégorie,Nombre de ressources",
      ...stats.categoryStats.map((c) => `${c.name},${c.count}`),
      "",
      "=== UTILISATEURS PAR RÔLE ===",
      "Rôle,Nombre",
      ...stats.roleStats.map((r) => `${r.role},${r.count}`),
    ];

    const csv = lines.join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `stats-re-sources-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button
      onClick={handleExport}
      className="flex items-center gap-2 px-5 py-2.5 bg-surface-container-highest text-on-surface rounded-xl text-sm font-semibold hover:bg-surface-container-high transition-colors"
    >
      <Download className="w-4 h-4" />
      Exporter CSV
    </button>
  );
}
