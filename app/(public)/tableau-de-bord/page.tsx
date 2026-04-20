import Link from "next/link";
import { SidebarCatalog } from "@/components/layout/sidebar-catalog";
import { Badge } from "@/components/ui/badge";
import { Calendar, Video } from "lucide-react";

const savedResources = [
  {
    id: "1",
    title: "5 techniques d'ancrage pour un soulagement immédiat",
    summary:
      "Apprenez des méthodes pratiques et fondées sur des preuves pour vous recentrer lors de moments d'anxiété...",
    tags: ["Article", "Anxiété"],
  },
  {
    id: "2",
    title: "Méditation guidée du sommeil : repos profond",
    summary:
      "Une pratique guidée de 20 minutes conçue pour vous aider à vous déconnecter du stress quotidien...",
    tags: ["Audio", "Sommeil"],
  },
  {
    id: "3",
    title: "Poser des limites au travail",
    summary:
      "Session interactive sur comment poser des limites professionnelles et protéger votre bien-être...",
    tags: ["Atelier", "Travail"],
  },
];

export default function TableauDeBordPage() {
  return (
    <div className="flex min-h-screen">
      <SidebarCatalog />
      <main className="flex-1 bg-surface-container-low">
        <div className="max-w-6xl mx-auto px-6 py-12">
          {/* Welcome */}
          <h1 className="text-display-lg text-on-surface mb-2">
            Bonjour, Sarah.
          </h1>
          <p className="text-lg text-on-surface-variant mb-10">
            Voici votre aperçu bien-être du jour. Vous avez complété 3
            activités cette semaine et avez 2 sessions à venir.
          </p>

          {/* Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-12">
            {/* Weekly Progress */}
            <div className="md:col-span-8 bg-surface-container-lowest rounded-xl shadow-ambient-sm p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-headline-md text-on-surface">
                  Progression hebdomadaire
                </h2>
                <Link
                  href="#"
                  className="text-sm font-semibold text-primary hover:underline"
                >
                  Voir l&apos;historique
                </Link>
              </div>
              <div className="flex items-center gap-8">
                {/* Progress ring */}
                <div className="relative w-32 h-32 shrink-0">
                  <svg
                    className="w-full h-full -rotate-90"
                    viewBox="0 0 100 100"
                  >
                    <circle
                      cx="50"
                      cy="50"
                      r="42"
                      fill="none"
                      stroke="#e5e9eb"
                      strokeWidth="8"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="42"
                      fill="none"
                      stroke="#0356d5"
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={`${0.75 * 2 * Math.PI * 42} ${2 * Math.PI * 42}`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold text-on-surface">
                      75%
                    </span>
                    <span className="text-xs text-on-surface-variant uppercase tracking-wider">
                      Objectif
                    </span>
                  </div>
                </div>
                <div className="flex-1 space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-on-surface">
                        Sessions de pleine conscience
                      </span>
                      <span className="text-sm font-semibold text-on-surface">
                        3/4
                      </span>
                    </div>
                    <div className="w-full h-2 bg-surface-container-high rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: "75%" }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-on-surface">
                        Lectures
                      </span>
                      <span className="text-sm font-semibold text-on-surface">
                        1/2
                      </span>
                    </div>
                    <div className="w-full h-2 bg-surface-container-high rounded-full overflow-hidden">
                      <div
                        className="h-full bg-tertiary rounded-full"
                        style={{ width: "50%" }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Upcoming Session */}
            <div className="md:col-span-4 bg-surface-container-lowest rounded-xl shadow-ambient-sm p-6 flex flex-col">
              <Badge variant="secondary" className="self-start mb-4">
                À venir
              </Badge>
              <h3 className="text-title-md text-on-surface mb-2">
                Session de soutien en groupe
              </h3>
              <p className="text-sm text-on-surface-variant mb-4">
                Gérer l&apos;anxiété professionnelle
              </p>
              <div className="space-y-2 text-sm text-on-surface-variant mb-6">
                <p className="flex items-center gap-2">
                  <Calendar className="w-4.5 h-4.5" />
                  Demain, 14:00
                </p>
                <p className="flex items-center gap-2">
                  <Video className="w-4.5 h-4.5" />
                  En ligne via Zoom
                </p>
              </div>
              <Link
                href="#"
                className="mt-auto text-center text-primary font-semibold text-sm py-2.5 rounded-xl bg-primary/5 hover:bg-primary/10 transition-colors"
              >
                Rejoindre la session
              </Link>
            </div>
          </div>

          {/* Saved Resources */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-headline-md text-on-surface">
              Ressources sauvegardées
            </h2>
            <Link
              href="/catalogue"
              className="text-sm font-semibold text-primary hover:underline"
            >
              Voir tout
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {savedResources.map((res) => (
              <Link key={res.id} href={`/ressource/${res.id}`} className="group">
                <div className="bg-surface-container-lowest rounded-xl shadow-ambient-sm hover:shadow-ambient hover:-translate-y-1 transition-all overflow-hidden h-full flex flex-col">
                  <div className="aspect-[4/3] bg-surface-container-high" />
                  <div className="p-5 flex flex-col flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      {res.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-label-sm bg-surface-container text-on-surface-variant px-2 py-0.5 rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <h3 className="text-title-md text-on-surface mb-2 group-hover:text-primary transition-colors">
                      {res.title}
                    </h3>
                    <p className="text-sm text-on-surface-variant line-clamp-2">
                      {res.summary}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
