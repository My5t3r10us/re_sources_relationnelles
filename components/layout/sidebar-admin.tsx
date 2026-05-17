"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus, BarChart3, Gavel, Users, HelpCircle, BookOpen, Tag, Flag } from "lucide-react";

const adminNav = [
  { href: "/admin/statistiques", label: "Statistiques", icon: <BarChart3 className="w-5 h-5" /> },
  { href: "/admin/moderation", label: "Modération", icon: <Gavel className="w-5 h-5" /> },
  { href: "/admin/signalements", label: "Signalements", icon: <Flag className="w-5 h-5" /> },
  { href: "/admin/ressources", label: "Ressources", icon: <BookOpen className="w-5 h-5" /> },
  { href: "/admin/categories", label: "Catégories", icon: <Tag className="w-5 h-5" /> },
  { href: "/admin/utilisateurs", label: "Comptes utilisateurs", icon: <Users className="w-5 h-5" /> },
];

export function SidebarAdmin() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-surface-container-low min-h-screen fixed left-0 top-0 hidden md:flex flex-col shrink-0 z-40">
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center text-on-primary-fixed font-bold text-sm">
          A
        </div>
        <div>
          <h2 className="text-sm font-bold text-on-surface">
            PANNEAU ADMIN
          </h2>
          <p className="text-xs text-on-surface-variant">
            L&apos;autorité sereine
          </p>
        </div>
      </div>

      <div className="px-4 mb-4">
        <Link
          href="/publier"
          className="gradient-primary text-on-primary-fixed rounded-xl px-6 py-3 text-sm font-semibold flex items-center justify-center gap-2 w-full"
        >
          <Plus className="w-5 h-5" />
          Nouvelle ressource
        </Link>
      </div>

      <nav className="flex-1 flex flex-col gap-1 px-3">
        {adminNav.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-colors ${
                isActive
                  ? "bg-surface-container-lowest text-primary font-semibold shadow-ambient-sm"
                  : "text-on-surface-variant hover:bg-surface-container-lowest/50 hover:text-primary"
              }`}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 mt-auto flex flex-col gap-1">
        <Link
          href="/aide"
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-on-surface-variant hover:bg-surface-container-lowest/50 transition-colors"
        >
          <HelpCircle className="w-5 h-5" />
          Support
        </Link>
      </div>
    </aside>
  );
}
