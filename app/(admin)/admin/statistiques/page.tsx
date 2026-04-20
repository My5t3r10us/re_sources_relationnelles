import { Card } from "@/components/ui/card";
import { Eye, PlusCircle, Users, TrendingUp, Download } from "lucide-react";

const metrics = [
  {
    label: "Consultations",
    value: "124 592",
    trend: "+12,4% vs période précédente",
    icon: <Eye className="w-5 h-5 text-primary" />,
    trendUp: true,
  },
  {
    label: "Créations",
    value: "8 405",
    trend: "+5,2% vs période précédente",
    icon: <PlusCircle className="w-5 h-5 text-primary" />,
    trendUp: true,
  },
  {
    label: "Utilisateurs actifs",
    value: "45 112",
    trend: "→ Stable",
    icon: <Users className="w-5 h-5 text-primary" />,
    trendUp: false,
  },
];

const categoryDistribution = [
  { name: "Santé mentale", percentage: 45 },
  { name: "Famille", percentage: 30 },
  { name: "Nutrition", percentage: 15 },
  { name: "Kinésithérapie", percentage: 10 },
];

export default function StatistiquesPage() {
  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto">
      {/* Header */}
      <h1 className="text-display-lg text-on-surface mb-4">
        Statistiques globales
      </h1>
      <p className="text-lg text-on-surface-variant mb-8 max-w-2xl">
        Vue d&apos;ensemble de la santé de la plateforme, du volume de consultations
        et des taux de création de ressources. Les données sont mises à jour en
        temps réel.
      </p>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-8">
        <span className="text-label-md text-on-surface-variant">Filtres</span>
        <select className="bg-surface-container-high rounded-xl px-4 py-2.5 text-sm text-on-surface border-none focus:outline-none focus:ring-2 focus:ring-primary/20">
          <option>30 derniers jours</option>
          <option>7 derniers jours</option>
          <option>3 derniers mois</option>
          <option>12 derniers mois</option>
        </select>
        <select className="bg-surface-container-high rounded-xl px-4 py-2.5 text-sm text-on-surface border-none focus:outline-none focus:ring-2 focus:ring-primary/20">
          <option>Toutes les régions</option>
          <option>Île-de-France</option>
          <option>Auvergne-Rhône-Alpes</option>
          <option>Provence-Alpes-Côte d&apos;Azur</option>
        </select>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {metrics.map((metric) => (
          <Card key={metric.label} className="p-6 relative overflow-hidden">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/5 rounded-full blur-xl" />
            <div className="flex items-center justify-between mb-4">
              <span className="text-label-md text-on-surface-variant">
                {metric.label}
              </span>
              {metric.icon}
            </div>
            <p className="text-4xl font-bold text-on-surface mb-2">
              {metric.value}
            </p>
            <p
              className={`text-sm flex items-center gap-1 ${metric.trendUp ? "text-tertiary" : "text-on-surface-variant"}`}
            >
              {metric.trendUp && (
                <TrendingUp className="w-4 h-4" />
              )}
              {metric.trend}
            </p>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        {/* Consultation Trends */}
        <Card className="md:col-span-3 p-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-headline-md text-on-surface">
              Tendances de consultation
            </h2>
            <button className="text-sm font-semibold text-primary flex items-center gap-1 hover:underline">
              Exporter
              <Download className="w-4 h-4" />
            </button>
          </div>
          <p className="text-sm text-on-surface-variant mb-6">
            Volume quotidien de vues de ressources toutes catégories confondues.
          </p>
          {/* Chart placeholder */}
          <div className="h-48 flex items-end gap-1">
            {[40, 55, 35, 65, 50, 70, 60, 80, 45, 75, 65, 85, 55, 90, 70, 80, 60, 95, 75, 85].map(
              (h, i) => (
                <div
                  key={i}
                  className="flex-1 bg-primary/20 rounded-t-sm hover:bg-primary/40 transition-colors"
                  style={{ height: `${h}%` }}
                />
              )
            )}
          </div>
        </Card>

        {/* Category Distribution */}
        <Card className="md:col-span-2 p-6">
          <h2 className="text-headline-md text-on-surface mb-2">
            Création par catégorie
          </h2>
          <p className="text-sm text-on-surface-variant mb-6">
            Répartition des nouvelles ressources ajoutées.
          </p>
          <div className="space-y-4">
            {categoryDistribution.map((cat) => (
              <div key={cat.name}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-on-surface">{cat.name}</span>
                  <span className="text-sm font-semibold text-on-surface">
                    {cat.percentage}%
                  </span>
                </div>
                <div className="w-full h-3 bg-surface-container-high rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${cat.percentage > 30 ? "bg-primary" : cat.percentage > 20 ? "bg-tertiary" : "bg-secondary"}`}
                    style={{ width: `${cat.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
