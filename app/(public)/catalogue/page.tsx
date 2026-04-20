"use client";

import Link from "next/link";
import { SidebarCatalog } from "@/components/layout/sidebar-catalog";
import { Pagination } from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import { Search, PlayCircle, FileDown, Dumbbell, FileText, Sparkles, Clock, ArrowRight, Bookmark, Headphones, ShieldAlert } from "lucide-react";
import { type ReactNode } from "react";

const mediaFilters = [
  { key: "video", label: "Vidéo", icon: <PlayCircle className="w-4 h-4" /> },
  { key: "pdf", label: "Document", icon: <FileDown className="w-4 h-4" /> },
  { key: "exercise", label: "Exercice", icon: <Dumbbell className="w-4 h-4" /> },
  { key: "article", label: "Article", icon: <FileText className="w-4 h-4" /> },
];

const mockResources = [
  {
    id: "featured-1",
    title: "Restructuration cognitive pour le stress quotidien",
    summary:
      "Un exercice pratique de 15 minutes conçu pour vous aider à identifier et remettre en question les schémas de pensée négatifs qui contribuent au stress chronique.",
    mediaType: "exercise",
    readingTime: 15,
    featured: true,
  },
  {
    id: "2",
    title: "Résoudre les conflits au travail",
    summary:
      "Apprenez des techniques de médiation et des stratégies de communication pour désamorcer les tensions en milieu professionnel.",
    mediaType: "video",
    episodes: 4,
  },
  {
    id: "3",
    title: "L'architecture d'une routine de sommeil saine",
    summary:
      "Une analyse complète des principes d'hygiène du sommeil, des rythmes circadiens et de l'optimisation de l'environnement.",
    mediaType: "pdf",
    pages: 12,
  },
  {
    id: "4",
    title: "Comprendre la charge mentale parentale",
    summary:
      "Explorer le travail invisible de la gestion d'un foyer et les stratégies pour une répartition équitable entre partenaires.",
    mediaType: "article",
    readingTime: 8,
  },
  {
    id: "5",
    title: "Techniques d'ancrage immédiates pour les crises d'angoisse",
    summary:
      "Exercices de réponse rapide incluant la méthode 5-4-3-2-1 pour reprendre le contrôle dans les moments d'anxiété aiguë.",
    mediaType: "protocol",
  },
];

const mediaTypeLabels: Record<string, string> = {
  article: "Article",
  video: "Série vidéo",
  pdf: "Guide PDF",
  exercise: "Exercice",
  audio: "Audio",
  protocol: "Protocole",
};

const mediaTypeIcons: Record<string, ReactNode> = {
  article: <FileText className="w-4 h-4 text-primary" />,
  video: <PlayCircle className="w-4 h-4 text-primary" />,
  pdf: <FileDown className="w-4 h-4 text-primary" />,
  exercise: <Dumbbell className="w-4 h-4 text-primary" />,
  audio: <Headphones className="w-4 h-4 text-primary" />,
  protocol: <ShieldAlert className="w-4 h-4 text-primary" />,
};

export default function CataloguePage() {
  return (
    <div className="flex min-h-screen">
      <SidebarCatalog />
      <main className="flex-1 bg-surface">
        <div className="max-w-6xl mx-auto px-6 py-12">
          {/* Header */}
          <h1 className="text-display-lg text-on-surface mb-4">
            Explorer les ressources
          </h1>
          <p className="text-lg text-on-surface-variant mb-8 max-w-2xl">
            Contenus sélectionnés pour soutenir votre bien-être mental, vos
            relations et votre vie professionnelle. Guidés par des experts,
            disponibles pour vous.
          </p>

          {/* Search + Filters */}
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mb-6">
            <div className="flex items-center bg-surface-container-high rounded-xl px-4 py-3 flex-1 max-w-md">
              <Search className="w-5 h-5 text-on-surface-variant mr-2" />
              <input
                type="text"
                placeholder="Rechercher par condition, sujet ou auteur..."
                className="bg-transparent border-none focus:outline-none text-sm text-on-surface placeholder:text-outline flex-1"
              />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {mediaFilters.map((filter) => (
                <button
                  key={filter.key}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium bg-surface-container-high text-on-surface hover:bg-primary/10 hover:text-primary transition-colors"
                >
                  {filter.icon}
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          {/* Results info */}
          <div className="flex items-center justify-between mb-8">
            <p className="text-sm text-on-surface-variant">
              Affichage de <strong>124 résultats</strong> pour &quot;Toutes les
              ressources&quot;
            </p>
            <div className="flex items-center gap-2 text-sm text-on-surface-variant">
              Trier par :
              <select className="bg-transparent font-semibold text-on-surface focus:outline-none cursor-pointer">
                <option>Plus récents</option>
                <option>Plus populaires</option>
                <option>Mieux notés</option>
              </select>
            </div>
          </div>

          {/* Resource Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {/* Featured card */}
            <Link
              href={`/ressource/${mockResources[0].id}`}
              className="group col-span-1 md:col-span-2"
            >
              <div className="bg-surface-container-lowest rounded-xl shadow-ambient-sm hover:shadow-ambient transition-all overflow-hidden flex flex-col md:flex-row h-full">
                <div className="relative md:w-2/5 aspect-[4/3] md:aspect-auto overflow-hidden">
                  <div className="w-full h-full bg-surface-container-high min-h-[200px]" />
                  <div className="absolute top-3 left-3">
                    <Badge variant="primary">
                      <Sparkles className="w-3.5 h-3.5" />
                      À la une
                    </Badge>
                  </div>
                </div>
                <div className="p-6 md:w-3/5 flex flex-col justify-center">
                  <span className="text-label-sm text-primary mb-2">
                    Exercice
                  </span>
                  <h3 className="text-headline-md text-on-surface mb-3 group-hover:text-primary transition-colors">
                    {mockResources[0].title}
                  </h3>
                  <p className="text-sm text-on-surface-variant line-clamp-3 mb-4">
                    {mockResources[0].summary}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 text-xs text-on-surface-variant">
                      <Clock className="w-4 h-4" />
                      15 min / jour
                    </span>
                    <span className="text-sm font-semibold text-primary flex items-center gap-1">
                      Commencer
                      <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              </div>
            </Link>

            {/* Standard cards */}
            {mockResources.slice(1).map((res) => (
              <Link
                key={res.id}
                href={`/ressource/${res.id}`}
                className="group"
              >
                <div className="bg-surface-container-lowest rounded-xl shadow-ambient-sm hover:shadow-ambient hover:-translate-y-1 transition-all overflow-hidden h-full flex flex-col">
                  <div className="p-5 flex flex-col flex-1">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {mediaTypeIcons[res.mediaType] || <FileText className="w-4 h-4 text-primary" />}
                        <span className="text-label-sm text-primary">
                          {mediaTypeLabels[res.mediaType]}
                        </span>
                      </div>
                      <button
                        className="text-on-surface-variant hover:text-primary transition-colors"
                        onClick={(e) => e.preventDefault()}
                        aria-label="Sauvegarder"
                      >
                        <Bookmark className="w-5 h-5" />
                      </button>
                    </div>
                    <h3 className="text-title-md text-on-surface mb-2 group-hover:text-primary transition-colors">
                      {res.title}
                    </h3>
                    <p className="text-sm text-on-surface-variant line-clamp-3 flex-1">
                      {res.summary}
                    </p>
                    <div className="flex items-center justify-between mt-4 pt-3">
                      <span className="text-xs text-on-surface-variant">
                        {res.readingTime
                          ? `${res.readingTime} min de lecture`
                          : res.episodes
                            ? `${res.episodes} Épisodes`
                            : res.pages
                              ? `${res.pages} Pages`
                              : "Accès rapide"}
                      </span>
                      <span className="text-sm font-semibold text-primary">
                        {res.mediaType === "video"
                          ? "Regarder"
                          : res.mediaType === "pdf"
                            ? "Télécharger"
                            : res.mediaType === "article"
                              ? "Lire"
                              : "Voir les étapes"}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          <Pagination currentPage={1} totalPages={12} />
        </div>
      </main>
    </div>
  );
}
