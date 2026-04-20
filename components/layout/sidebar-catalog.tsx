"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { LayoutGrid, Brain, Briefcase, Users, AlertTriangle, HelpCircle, Hash } from "lucide-react";
import { type ReactNode } from "react";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
}

interface Props {
  categories: Category[];
  activeSlug: string;
}

const iconMap: Record<string, ReactNode> = {
  "anxiete-stress": <Brain className="w-5 h-5" />,
  "equilibre-vie": <Briefcase className="w-5 h-5" />,
  "parentalite": <Users className="w-5 h-5" />,
  "soutien-crise": <AlertTriangle className="w-5 h-5" />,
  "sante-mentale": <HelpCircle className="w-5 h-5" />,
};

export function SidebarCatalog({ categories, activeSlug }: Props) {
  const searchParams = useSearchParams();

  function buildHref(slug: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (slug) {
      params.set("categorie", slug);
    } else {
      params.delete("categorie");
    }
    params.delete("page");
    const qs = params.toString();
    return `/catalogue${qs ? `?${qs}` : ""}`;
  }

  return (
    <aside className="w-64 bg-surface-container-low min-h-screen hidden md:flex flex-col shrink-0">
      <div className="p-6">
        <h2 className="text-label-md text-on-surface font-bold">
          Catalogue de ressources
        </h2>
        <p className="text-xs text-on-surface-variant mt-1">
          Filtrer par catégorie
        </p>
      </div>
      <nav className="flex-1 flex flex-col gap-1">
        {/* All resources link */}
        <Link
          href={buildHref("")}
          className={`flex items-center gap-3 py-3 transition-colors ${
            !activeSlug
              ? "bg-surface-container-lowest text-primary font-bold rounded-l-full ml-4 pl-4 shadow-ambient-sm"
              : "text-on-surface-variant pl-8 hover:text-primary hover:bg-surface-container-lowest/50"
          }`}
        >
          <LayoutGrid className="w-5 h-5" />
          <span className="text-sm">Toutes les ressources</span>
        </Link>

        {categories.map((cat) => {
          const isActive = activeSlug === cat.slug;

          return (
            <Link
              key={cat.id}
              href={buildHref(cat.slug)}
              className={`flex items-center gap-3 py-3 transition-colors ${
                isActive
                  ? "bg-surface-container-lowest text-primary font-bold rounded-l-full ml-4 pl-4 shadow-ambient-sm"
                  : "text-on-surface-variant pl-8 hover:text-primary hover:bg-surface-container-lowest/50"
              }`}
            >
              {iconMap[cat.slug] || <Hash className="w-5 h-5" />}
              <span className="text-sm">{cat.name}</span>
            </Link>
          );
        })}
      </nav>
      <div className="p-6 mt-auto flex flex-col gap-3">
        <Link
          href="/aide"
          className="flex items-center gap-2 text-sm text-on-surface-variant hover:text-primary transition-colors"
        >
          <HelpCircle className="w-5 h-5" />
          Centre d&apos;aide
        </Link>
      </div>
    </aside>
  );
}
