"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useCallback, type ReactNode } from "react";
import { Pagination } from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  PlayCircle,
  FileDown,
  Dumbbell,
  FileText,
  Sparkles,
  Clock,
  ArrowRight,
  Bookmark,
  Headphones,
  ShieldAlert,
} from "lucide-react";

interface Resource {
  id: string;
  title: string;
  summary: string | null;
  mediaType: "article" | "video" | "pdf" | "exercise" | "audio" | "protocol";
  readingTime: number | null;
  featured: boolean;
  viewCount: number;
  createdAt: Date;
  imageUrl: string | null;
  categoryName: string | null;
  categorySlug: string | null;
}

interface Props {
  resources: Resource[];
  total: number;
  currentPage: number;
  totalPages: number;
  activeMedia: string;
  activeSort: string;
  search: string;
}

const mediaFilters = [
  { key: "video", label: "Vidéo", icon: <PlayCircle className="w-4 h-4" /> },
  { key: "pdf", label: "Document", icon: <FileDown className="w-4 h-4" /> },
  { key: "exercise", label: "Exercice", icon: <Dumbbell className="w-4 h-4" /> },
  { key: "article", label: "Article", icon: <FileText className="w-4 h-4" /> },
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

export function CatalogueClient({
  resources,
  total,
  currentPage,
  totalPages,
  activeMedia,
  activeSort,
  search,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchInput, setSearchInput] = useState(search);

  const updateParams = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      }
      // Reset page when filters change (unless explicitly setting page)
      if (!("page" in updates)) {
        params.delete("page");
      }
      router.push(`/catalogue?${params.toString()}`);
    },
    [router, searchParams],
  );

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    updateParams({ q: searchInput });
  }

  function handleMediaFilter(key: string) {
    updateParams({ media: activeMedia === key ? "" : key });
  }

  function handleSort(value: string) {
    updateParams({ tri: value });
  }

  function handlePageChange(page: number) {
    updateParams({ page: page.toString() });
  }

  const featured = resources.find((r) => r.featured);
  const rest = featured ? resources.filter((r) => r.id !== featured.id) : resources;

  return (
    <main className="flex-1 bg-surface">
      <div className="max-w-6xl mx-auto px-6 py-12">
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
          <form onSubmit={handleSearch} className="flex items-center bg-surface-container-high rounded-xl px-4 py-3 flex-1 max-w-md">
            <Search className="w-5 h-5 text-on-surface-variant mr-2" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Rechercher par condition, sujet ou auteur..."
              className="bg-transparent border-none focus:outline-none text-sm text-on-surface placeholder:text-outline flex-1"
            />
          </form>
          <div className="flex items-center gap-2 flex-wrap">
            {mediaFilters.map((filter) => (
              <button
                key={filter.key}
                onClick={() => handleMediaFilter(filter.key)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  activeMedia === filter.key
                    ? "bg-primary text-on-primary-fixed"
                    : "bg-surface-container-high text-on-surface hover:bg-primary/10 hover:text-primary"
                }`}
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
            Affichage de <strong>{total} résultat{total !== 1 ? "s" : ""}</strong>
          </p>
          <div className="flex items-center gap-2 text-sm text-on-surface-variant">
            Trier par :
            <select
              value={activeSort}
              onChange={(e) => handleSort(e.target.value)}
              className="bg-transparent font-semibold text-on-surface focus:outline-none cursor-pointer"
            >
              <option value="recent">Plus récents</option>
              <option value="populaire">Plus populaires</option>
              <option value="ancien">Plus anciens</option>
            </select>
          </div>
        </div>

        {/* Empty state */}
        {resources.length === 0 && (
          <div className="text-center py-20">
            <p className="text-lg text-on-surface-variant">
              Aucune ressource trouvée.
            </p>
            <button
              onClick={() => router.push("/catalogue")}
              className="mt-4 text-sm text-primary hover:underline"
            >
              Réinitialiser les filtres
            </button>
          </div>
        )}

        {/* Resource Grid */}
        {resources.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {/* Featured card */}
            {featured && currentPage === 1 && (
              <Link
                href={`/ressource/${featured.id}`}
                className="group col-span-1 md:col-span-2"
              >
                <div className="bg-surface-container-lowest rounded-xl shadow-ambient-sm hover:shadow-ambient transition-all overflow-hidden flex flex-col md:flex-row h-full">
                  <div className="relative md:w-2/5 aspect-4/3 md:aspect-auto overflow-hidden">
                    {featured.imageUrl ? (
                      <img
                        src={featured.imageUrl}
                        alt={featured.title}
                        className="w-full h-full object-cover min-h-50"
                      />
                    ) : (
                      <div className="w-full h-full bg-surface-container-high min-h-50" />
                    )}
                    <div className="absolute top-3 left-3">
                      <Badge variant="primary">
                        <Sparkles className="w-3.5 h-3.5" />
                        À la une
                      </Badge>
                    </div>
                  </div>
                  <div className="p-6 md:w-3/5 flex flex-col justify-center">
                    <span className="text-label-sm text-primary mb-2">
                      {mediaTypeLabels[featured.mediaType]}
                    </span>
                    <h3 className="text-headline-md text-on-surface mb-3 group-hover:text-primary transition-colors">
                      {featured.title}
                    </h3>
                    <p className="text-sm text-on-surface-variant line-clamp-3 mb-4">
                      {featured.summary}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1 text-xs text-on-surface-variant">
                        <Clock className="w-4 h-4" />
                        {featured.readingTime
                          ? `${featured.readingTime} min`
                          : "Accès rapide"}
                      </span>
                      <span className="text-sm font-semibold text-primary flex items-center gap-1">
                        Commencer
                        <ArrowRight className="w-4 h-4" />
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            )}

            {/* Standard cards */}
            {rest.map((res) => (
              <Link
                key={res.id}
                href={`/ressource/${res.id}`}
                className="group"
              >
                <div className="bg-surface-container-lowest rounded-xl shadow-ambient-sm hover:shadow-ambient hover:-translate-y-1 transition-all overflow-hidden h-full flex flex-col">
                  {res.imageUrl && (
                    <div className="aspect-video overflow-hidden">
                      <img
                        src={res.imageUrl}
                        alt={res.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  <div className="p-5 flex flex-col flex-1">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {mediaTypeIcons[res.mediaType] || (
                          <FileText className="w-4 h-4 text-primary" />
                        )}
                        <span className="text-label-sm text-primary">
                          {mediaTypeLabels[res.mediaType]}
                        </span>
                      </div>
                      <span className="text-on-surface-variant">
                        <Bookmark className="w-5 h-5" />
                      </span>
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
                          : "Accès rapide"}
                      </span>
                      <span className="text-sm font-semibold text-primary">
                        {res.mediaType === "video"
                          ? "Regarder"
                          : res.mediaType === "pdf"
                            ? "Télécharger"
                            : res.mediaType === "article"
                              ? "Lire"
                              : "Explorer"}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        )}
      </div>
    </main>
  );
}
