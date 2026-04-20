"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, Brain, Briefcase, Users, AlertTriangle, HelpCircle } from "lucide-react";

const categories = [
  { slug: "", label: "Toutes les ressources", icon: <LayoutGrid className="w-5 h-5" /> },
  { slug: "anxiete-stress", label: "Anxiété & Stress", icon: <Brain className="w-5 h-5" /> },
  { slug: "equilibre-vie", label: "Équilibre vie pro/perso", icon: <Briefcase className="w-5 h-5" /> },
  { slug: "parentalite", label: "Parentalité", icon: <Users className="w-5 h-5" /> },
  { slug: "soutien-crise", label: "Soutien de crise", icon: <AlertTriangle className="w-5 h-5" /> },
];

export function SidebarCatalog() {
  const pathname = usePathname();

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
        {categories.map((cat) => {
          const href =
            cat.slug === ""
              ? "/catalogue"
              : `/catalogue?categorie=${cat.slug}`;
          const isActive =
            cat.slug === ""
              ? pathname === "/catalogue" &&
                !pathname.includes("categorie")
              : pathname.includes(cat.slug);

          return (
            <Link
              key={cat.slug}
              href={href}
              className={`flex items-center gap-3 py-3 transition-colors ${
                isActive
                  ? "bg-surface-container-lowest text-primary font-bold rounded-l-full ml-4 pl-4 shadow-ambient-sm"
                  : "text-on-surface-variant pl-8 hover:text-primary hover:bg-surface-container-lowest/50"
              }`}
            >
              {cat.icon}
              <span className="text-sm">{cat.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="p-6 mt-auto flex flex-col gap-3">
        <Link
          href="/catalogue"
          className="gradient-primary text-on-primary-fixed rounded-xl px-6 py-3 text-sm font-semibold text-center"
        >
          Appliquer les filtres
        </Link>
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
