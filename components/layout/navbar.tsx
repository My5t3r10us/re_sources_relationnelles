"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Bell, User } from "lucide-react";

const navItems = [
  { href: "/catalogue", label: "Catalogue" },
  { href: "/bien-etre", label: "Bien-être" },
  { href: "/communaute", label: "Communauté" },
  { href: "/urgence", label: "Urgence" },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <header className="glassmorphism sticky top-0 z-50 shadow-sm">
      <nav className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="font-bold text-lg text-on-surface">
          (RE)Sources Relationnelles
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`text-sm font-medium transition-colors ${
                pathname.startsWith(item.href)
                  ? "text-primary border-b-2 border-primary pb-0.5"
                  : "text-on-surface-variant hover:text-primary"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <button className="hidden md:flex items-center gap-2 bg-surface-container-high rounded-xl px-4 py-2 text-sm text-on-surface-variant" aria-label="Rechercher">
            <Search className="w-5 h-5" />
            <span className="text-outline">Rechercher...</span>
          </button>
          <button className="relative p-2 text-on-surface-variant hover:text-primary transition-colors" aria-label="Notifications">
            <Bell className="w-6 h-6" />
          </button>
          <Link
            href="/login"
            className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant hover:bg-surface-container-highest transition-colors"
            aria-label="Mon compte"
          >
            <User className="w-6 h-6" />
          </Link>
        </div>
      </nav>
    </header>
  );
}
